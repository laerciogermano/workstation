/**
 * Integração contra PostgreSQL real (08 §9): schema isolado `notinhas_test`, SEFAZ e Open Food Facts falsos.
 * Requer DATABASE_URL (ou o Postgres do lab em 127.0.0.1:5432). Sem banco, a suíte é pulada.
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createPriceIndex } from '../src/modules/catalog/price-index.js';
import { createTokenService } from '../src/modules/identity/tokens.js';
import { parseDanfeHtml } from '../src/modules/receipts/sefaz-pr.adapter.js';
import { SefazError } from '../src/modules/receipts/sefaz.port.js';
import { retryFailure } from '../src/modules/receipts/ingest-receipt.js';
import { migrate } from '../src/scripts/migrate.js';
import { systemClock } from '../src/shared/clock.js';
import { createPool, type Db } from '../src/shared/db.js';
import type { Deps } from '../src/shared/deps.js';
import { loadEnv } from '../src/shared/env.js';
import { createLogger } from '../src/shared/logger.js';
import { KEY_JUPITER, KEY_OTHER, sefazUrl } from './helpers.js';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgres://connectmax:connectmax@127.0.0.1:5432/connectmax';
const SCHEMA = 'notinhas_test';
const html = readFileSync(new URL('./fixtures/danfe-jupiter.html', import.meta.url), 'utf8');

async function dbAvailable(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const hasDb = await dbAvailable();

describe.skipIf(!hasDb)('API · fluxo completo (Postgres real)', () => {
  let db: Db;
  let app: ReturnType<typeof createApp>;
  let deps: Deps;
  let sefazMode: 'ok' | 'timeout' = 'ok';
  const FP = 'fp-teste-0123456789abcdef';
  const FP2 = 'fp-outro-0123456789abcdef';
  const H = { 'X-Requested-With': 'notinhas', 'X-Client-Fingerprint': FP };

  beforeAll(async () => {
    const env = loadEnv({
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL,
      DB_SCHEMA: SCHEMA,
      JWT_SECRET: 'x'.repeat(40),
      FINGERPRINT_PEPPER: 'y'.repeat(40),
      GEOCODE_ENABLED: 'false',
    });
    const log = createLogger(env);
    await migrate(env, log);
    db = createPool(DATABASE_URL, SCHEMA);
    deps = {
      env,
      db,
      log,
      clock: systemClock,
      tokens: createTokenService(env.JWT_SECRET),
      mailer: { send: async () => undefined },
      sefaz: {
        async fetchReceipt(url) {
          if (sefazMode === 'timeout') throw new SefazError('SEFAZ_TIMEOUT', 'sem resposta');
          const key = new URL(url).searchParams.get('p')?.split('|')[0] ?? '';
          return parseDanfeHtml(html.replace('__CHAVE__', key));
        },
      },
      productLookup: { byGtin: async (gtin) => (gtin === '7894900011517' ? { title: 'Coca-Cola Original 2L', brand: 'Coca-Cola', photoUrls: [], categoriesHint: 'sodas', source: 'openfoodfacts' } : null) },
      eanSuggest: { byDescription: async () => [], photosByGtin: async () => [] },
      index: createPriceIndex(db, systemClock),
    };
    app = createApp(deps);
  });

  afterAll(async () => {
    await db?.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await db?.end();
  });

  it('mutação sem X-Requested-With é barrada (CSRF)', async () => {
    const r = await request(app).post('/api/v1/notas').send({ url: sefazUrl(KEY_JUPITER) });
    expect(r.status).toBe(403);
    expect(r.headers['content-type']).toContain('application/problem+json');
    expect(r.body.code).toBe('CSRF_HEADER_MISSING');
  });

  it('RN-01: link que não é NFC-e do PR → 400 INVALID_SEFAZ_URL', async () => {
    const r = await request(app).post('/api/v1/notas').set(H).send({ url: 'https://example.com/qr?p=1' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_SEFAZ_URL');
  });

  it('US-01.06: ingere nota, cria loja, itens e dá +10 pontos ao visitante', async () => {
    const r = await request(app).post('/api/v1/notas').set(H).send({ url: sefazUrl(KEY_JUPITER) });
    expect(r.status).toBe(201);
    expect(r.body.status).toBe('created');
    expect(r.body.pointsAwarded).toBe(10);
    expect(r.body.receipt.items).toHaveLength(3);
    expect(r.body.receipt.eanProgress).toEqual({ done: 0, total: 3 });
    expect(r.body.receipt.store.name).toBe('Jupiter');
  });

  it('RN-03: mesma chave → duplicada, sem pontos, sem itens novos', async () => {
    const r = await request(app).post('/api/v1/notas').set({ ...H, 'X-Client-Fingerprint': FP2 }).send({ url: sefazUrl(KEY_JUPITER) });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('duplicate');
    expect(r.body.pointsAwarded).toBe(0);
    const n = await db.query('SELECT count(*)::int AS c FROM receipt_items');
    expect(n.rows[0].c).toBe(3);
  });

  it('RN-15: SEFAZ sem resposta → 504 e entra na fila do ADM', async () => {
    sefazMode = 'timeout';
    const r = await request(app).post('/api/v1/notas').set(H).send({ url: sefazUrl(KEY_OTHER) });
    sefazMode = 'ok';
    expect(r.status).toBe(504);
    const f = await db.query(`SELECT id, status FROM ingest_failures`);
    expect(f.rows[0].status).toBe('pending');

    // nova tentativa (agendador/ADM) lê a nota e ela entra no histórico de quem mandou
    const out = await retryFailure({ db, sefaz: deps.sefaz, log: deps.log }, f.rows[0].id);
    expect(out.ok).toBe(true);
    const mine = await request(app).get('/api/v1/notas/minhas').set(H);
    expect(mine.body.map((r: { number: string }) => r.number)).toContain('48271');
    // volta ao estado do roteiro (uma nota no índice, 10 pontos)
    await db.query('DELETE FROM receipts WHERE access_key = $1', [KEY_OTHER]);
    await db.query(`DELETE FROM point_events WHERE ref = 'receipt:' || $1`, [KEY_OTHER]);
  });

  it('US-01.10: vincula EAN (+5), dígito inválido → 422, divergência → moderação', async () => {
    const store = (await db.query('SELECT id FROM stores LIMIT 1')).rows[0].id as number;
    const bad = await request(app).post('/api/v1/codigos-barras').set(H).send({ storeId: store, storeCode: '20981', gtin: '7894900011518', origin: 'manual' });
    expect(bad.status).toBe(422);
    expect(bad.body.code).toBe('INVALID_EAN');

    const ok = await request(app).post('/api/v1/codigos-barras').set(H).send({ storeId: store, storeCode: '20981', gtin: '7894900011517', origin: 'barcode_scan' });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ status: 'linked', pointsAwarded: 5, product: { title: 'Coca-Cola Original 2L' } });

    const div = await request(app).post('/api/v1/codigos-barras').set({ ...H, 'X-Client-Fingerprint': FP2 }).send({ storeId: store, storeCode: '20981', gtin: '78936683', origin: 'manual' });
    expect(div.body.status).toBe('flagged');
    const link = await db.query(`SELECT gtin FROM barcode_links WHERE store_code = '20981'`);
    expect(link.rows[0].gtin).toBe('7894900011517'); // primeiro vínculo vale (Q2)
  });

  it('RN-06: busca pública traz preço com loja e data, sem nada de pessoa', async () => {
    const r = await request(app).get('/api/v1/produtos/7894900011517');
    expect(r.status).toBe(200);
    expect(r.body.best).toMatchObject({ priceCents: 1199, store: { name: 'Jupiter' } });
    const s = JSON.stringify(r.body);
    expect(s).not.toMatch(/visitor|user|ip|fingerprint/i);
    const busca = await request(app).get('/api/v1/produtos/busca').query({ q: 'leite' });
    expect(busca.body.unlinked[0]).toMatchObject({ storeCode: '34811' });
  });

  it('RN-14: “Minhas notas” é do titular; outro navegador não vê o detalhe', async () => {
    const mine = await request(app).get('/api/v1/notas/minhas').set(H);
    expect(mine.body).toHaveLength(1);
    const id = mine.body[0].id as string;
    const other = await request(app).get(`/api/v1/notas/${id}`).set({ 'X-Client-Fingerprint': 'fp-terceiro-0123456789abc' });
    expect(other.status).toBe(404);
  });

  it('REQ-051/RN-13: lista cota sem interpolar e consome crédito', async () => {
    const created = await request(app).post('/api/v1/listas').set(H).send({ name: 'Compra do mês' });
    expect(created.status).toBe(201);
    await request(app).put(`/api/v1/listas/${created.body.id}/itens/7894900011517`).set(H).send({ quantity: 2 }).expect(200);
    const detail = await request(app).get(`/api/v1/listas/${created.body.id}`).set(H);
    expect(detail.body.quote.byStore[0]).toMatchObject({ totalCents: 2398, found: 1 });
    expect(detail.body.quote.split.uncovered).toEqual([]);
  });

  it('REQ-050: criar conta leva notas, listas e pontos do fingerprint', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .set(H)
      .send({ email: 'ana@example.com', password: 'senha-forte-1', acceptTerms: true });
    expect(reg.status).toBe(201);
    expect(reg.body.me.user.email).toBe('ana@example.com');
    expect(reg.body.me.points).toBe(15);
    const cookie = reg.headers['set-cookie'];
    expect(String(cookie)).toContain('HttpOnly');

    const auth = { ...H, Authorization: `Bearer ${reg.body.accessToken}` };
    const lists = await request(app).get('/api/v1/listas').set(auth);
    expect(lists.body).toHaveLength(1);

    const dup = await request(app).post('/api/v1/auth/register').set(H).send({ email: 'ana@example.com', password: 'outra-senha-2', acceptTerms: true });
    expect(dup.status).toBe(409);

    const wrong = await request(app).post('/api/v1/auth/login').set(H).send({ email: 'ana@example.com', password: 'errada' });
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('refresh rotaciona e reuso revoga a família', async () => {
    const login = await request(app).post('/api/v1/auth/login').set(H).send({ email: 'ana@example.com', password: 'senha-forte-1' });
    const c1 = String(login.headers['set-cookie']).split(';')[0] ?? '';
    const r1 = await request(app).post('/api/v1/auth/refresh').set({ ...H, Cookie: c1 });
    expect(r1.status).toBe(200);
    const reuse = await request(app).post('/api/v1/auth/refresh').set({ ...H, Cookie: c1 });
    expect(reuse.body.code).toBe('REFRESH_REUSED');
    const c2 = String(r1.headers['set-cookie']).split(';')[0] ?? '';
    const r2 = await request(app).post('/api/v1/auth/refresh').set({ ...H, Cookie: c2 });
    expect(r2.status).toBe(401);
  });

  it('admin exige role; LGPD apaga dados pessoais e mantém o índice', async () => {
    const login = await request(app).post('/api/v1/auth/login').set(H).send({ email: 'ana@example.com', password: 'senha-forte-1' });
    const auth = { ...H, Authorization: `Bearer ${login.body.accessToken}` };
    expect((await request(app).get('/api/v1/admin/metricas').set(auth)).status).toBe(403);

    const del = await request(app).delete('/api/v1/me').set(auth).send({ confirmation: 'EXCLUIR' });
    expect(del.status).toBe(202);
    const owners = await db.query('SELECT count(*)::int AS c FROM receipt_owners WHERE user_id IS NOT NULL');
    expect(owners.rows[0].c).toBe(0);
    const receipts = await db.query('SELECT count(*)::int AS c FROM receipts');
    expect(receipts.rows[0].c).toBe(1);
  });
});
