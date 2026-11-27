// Integração contra Postgres real (docker compose up -d). Cobre CU-01..CU-05 + descadastro.
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { createAuthService } from '../src/modules/auth/service.ts';
import { createSendQueue } from '../src/modules/sending/queue.ts';
import { createSendWorker } from '../src/modules/sending/worker.ts';
import { PermanentSendError } from '../src/modules/sending/mail-sender.ts';
import type { Db } from '../src/shared/db.ts';
import type { Config } from '../src/shared/config.ts';
import { fakeSender, resetDb, setupTestDb, silentLogger } from './helpers.ts';

let db: Db;
let config: Config;
let app: ReturnType<typeof createApp>;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  ({ db, config } = await setupTestDb());
});
afterAll(async () => {
  await db.end();
});
beforeEach(async () => {
  await resetDb(db);
  app = createApp({ db, config, logger: silentLogger }); // limiter de login zerado
  await createAuthService(db).upsertOperator('op@connect.com.br', 'senha-de-teste-123');
  agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'op@connect.com.br', password: 'senha-de-teste-123' }).expect(200);
});

function makeWorker(sender = fakeSender(), maxAttempts = 3) {
  const worker = createSendWorker(createSendQueue(db), sender, silentLogger, {
    from: config.MAIL_FROM,
    publicBaseUrl: config.PUBLIC_BASE_URL,
    ratePerSecond: 1000,
    maxAttempts,
  });
  return { worker, sender };
}

async function listWith(emails: string) {
  const { body: list } = await agent.post('/api/lists').send({ name: 'Clientes' }).expect(201);
  await agent.post(`/api/lists/${list.id}/contacts/import`).send({ text: emails }).expect(200);
  return list as { id: string };
}

async function readyCampaign(listId: string) {
  const { body: c } = await agent.post('/api/campaigns').send({ name: 'Black Friday' }).expect(201);
  await agent
    .patch(`/api/campaigns/${c.id}`)
    .send({ subject: 'Ofertas', bodyHtml: '<p>Olá!</p>', listId })
    .expect(200);
  return c as { id: string };
}

describe('autenticação', () => {
  it('nega rotas da API sem sessão (deny-by-default)', async () => {
    await request(app).get('/api/lists').expect(401);
    await request(app).get('/api/campaigns').expect(401);
  });

  it('recusa senha errada sem dizer se o e-mail existe', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'op@connect.com.br', password: 'errada' });
    const b = await request(app).post('/api/auth/login').send({ email: 'ninguem@x.com', password: 'errada' });
    expect(a.status).toBe(401);
    expect(b.body).toEqual(a.body);
  });

  it('cookie de sessão é HttpOnly e SameSite=Strict; logout invalida', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'op@connect.com.br', password: 'senha-de-teste-123' });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('CU-01 listas', () => {
  it('importa, ignora duplicados e informa inválidos', async () => {
    const { body: list } = await agent.post('/api/lists').send({ name: 'Leads' }).expect(201);
    const { body: r1 } = await agent
      .post(`/api/lists/${list.id}/contacts/import`)
      .send({ text: 'a@x.com, Ana\nb@x.com\nlixo\nA@x.com' })
      .expect(200);
    expect(r1).toMatchObject({ added: 2, alreadyInList: 0, duplicatesInInput: 1, invalidCount: 1 });

    const { body: r2 } = await agent.post(`/api/lists/${list.id}/contacts/import`).send({ text: 'b@x.com\nc@x.com' });
    expect(r2).toMatchObject({ added: 1, alreadyInList: 1 });

    const { body: page } = await agent.get(`/api/lists/${list.id}/contacts?search=ana`).expect(200);
    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({ email: 'a@x.com', name: 'Ana', isSuppressed: false });

    await agent.post(`/api/lists/${list.id}/contacts`).send({ email: 'c@x.com' }).expect(409);
    const { body: summary } = await agent.get(`/api/lists/${list.id}`);
    expect(summary.contactCount).toBe(3);
  });

  it('valida entrada e ids', async () => {
    await agent.post('/api/lists').send({ name: '   ' }).expect(400);
    await agent.get('/api/lists/nao-e-uuid').expect(400);
    await agent.get('/api/lists/00000000-0000-4000-8000-000000000000').expect(404);
  });

  it('não exclui lista ligada a campanha', async () => {
    const list = await listWith('a@x.com');
    await readyCampaign(list.id);
    await agent.delete(`/api/lists/${list.id}`).expect(409);
  });
});

describe('CU-02..05 campanha', () => {
  it('não envia campanha incompleta', async () => {
    const { body: c } = await agent.post('/api/campaigns').send({ name: 'Rascunho' }).expect(201);
    const res = await agent.post(`/api/campaigns/${c.id}/send`).expect(400);
    expect(res.body.error.message).toMatch(/assunto, conteúdo, lista/);
  });

  it('envia para a lista, acompanha progresso e conclui', async () => {
    const list = await listWith('a@x.com\nb@x.com\nc@x.com');
    const c = await readyCampaign(list.id);

    const { body: started } = await agent.post(`/api/campaigns/${c.id}/send`).expect(202);
    expect(started.status).toBe('sending');
    expect(started.progress).toMatchObject({ total: 3, pending: 3, sent: 0 });

    // depois de disparada, não edita nem dispara de novo
    await agent.patch(`/api/campaigns/${c.id}`).send({ subject: 'x' }).expect(409);
    await agent.post(`/api/campaigns/${c.id}/send`).expect(409);

    const { worker, sender } = makeWorker();
    await worker.tick();

    const { body: done } = await agent.get(`/api/campaigns/${c.id}`).expect(200);
    expect(done.status).toBe('sent');
    expect(done.progress).toMatchObject({ total: 3, sent: 3, pending: 0, failed: 0 });
    expect(sender.sent.map((m) => m.to).sort()).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
    expect(sender.sent[0]?.headers['List-Unsubscribe']).toMatch(/\/u\/[0-9a-f-]{36}>$/);
  });

  it('erro temporário volta para a fila; erro definitivo marca falha', async () => {
    const list = await listWith('a@x.com\nb@x.com');
    const c = await readyCampaign(list.id);
    await agent.post(`/api/campaigns/${c.id}/send`).expect(202);

    const sender = fakeSender();
    sender.failNext(new Error('timeout'), 1);
    const { worker } = makeWorker(sender);
    await worker.tick();

    let { body } = await agent.get(`/api/campaigns/${c.id}`);
    expect(body.progress).toMatchObject({ sent: 1, pending: 1 });
    expect(body.status).toBe('sending');

    // antecipa o backoff e falha de vez
    await db.query('update deliveries set next_attempt_at = now() where status = $1', ['pending']);
    sender.failNext(new PermanentSendError('550 mailbox unavailable'));
    await worker.tick();

    ({ body } = await agent.get(`/api/campaigns/${c.id}`));
    expect(body.progress).toMatchObject({ sent: 1, failed: 1, pending: 0 });
    expect(body.status).toBe('sent');
  });

  it('entrega presa por worker morto volta para a fila', async () => {
    const list = await listWith('a@x.com');
    const c = await readyCampaign(list.id);
    await agent.post(`/api/campaigns/${c.id}/send`).expect(202);
    await db.query("update deliveries set status = 'sending', locked_at = now() - interval '1 hour'");

    const { worker, sender } = makeWorker();
    await worker.tick();
    expect(sender.sent).toHaveLength(1);
  });
});

describe('CU-06 abertura', () => {
  it('o pixel do e-mail enviado registra quem abriu', async () => {
    const list = await listWith('a@x.com\nb@x.com');
    const c = await readyCampaign(list.id);
    await agent.post(`/api/campaigns/${c.id}/send`).expect(202);
    const { worker, sender } = makeWorker();
    await worker.tick();

    const html = sender.sent.find((m) => m.to === 'a@x.com')!.html;
    const url = new URL(html.match(/<img src="([^"]+\/t\/o\/[^"]+)"/)![1]!);
    expect(url.searchParams.get('e')).toBe('a@x.com');

    // público (sem sessão), carregável dentro de outro site e sem cache
    const res = await request(app).get(url.pathname + url.search).expect(200);
    expect(res.headers['content-type']).toBe('image/gif');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['cache-control']).toMatch(/no-store/);
    // trocar o e-mail do link não atribui a abertura a outra pessoa
    await request(app).get(`${url.pathname}?e=b@x.com`).expect(200);
    await request(app).head(url.pathname).expect(200);

    const { body: done } = await agent.get(`/api/campaigns/${c.id}`).expect(200);
    expect(done.progress).toMatchObject({ sent: 2, opened: 1 });

    const { body: opened } = await agent.get(`/api/campaigns/${c.id}/recipients?filter=opened`).expect(200);
    expect(opened.total).toBe(1);
    expect(opened.items[0]).toMatchObject({ email: 'a@x.com', openCount: 2 });
    expect(Date.parse(opened.items[0].openedAt)).toBeLessThanOrEqual(Date.parse(opened.items[0].lastOpenedAt));

    const { body: rest } = await agent.get(`/api/campaigns/${c.id}/recipients?filter=not_opened`).expect(200);
    expect(rest.items.map((r: { email: string }) => r.email)).toEqual(['b@x.com']);
    const { body: all } = await agent.get(`/api/campaigns/${c.id}/recipients`).expect(200);
    expect(all.items.map((r: { email: string }) => r.email)).toEqual(['a@x.com', 'b@x.com']);
  });

  it('token desconhecido devolve a mesma imagem; destinatários exigem login', async () => {
    for (const token of ['nao-existe', '00000000-0000-4000-8000-000000000000']) {
      const res = await request(app).get(`/t/o/${token}.gif`).expect(200);
      expect(res.headers['content-type']).toBe('image/gif');
    }
    await request(app).get('/api/campaigns/00000000-0000-4000-8000-000000000000/recipients').expect(401);
    await agent.get('/api/campaigns/00000000-0000-4000-8000-000000000000/recipients').expect(404);
    await agent.get('/api/campaigns/00000000-0000-4000-8000-000000000000/recipients?filter=x').expect(400);
  });
});

describe('descadastro', () => {
  it('GET só confirma; POST descadastra e as próximas campanhas respeitam', async () => {
    const list = await listWith('a@x.com\nb@x.com');
    const c1 = await readyCampaign(list.id);
    await agent.post(`/api/campaigns/${c1.id}/send`).expect(202);
    const { worker, sender } = makeWorker();
    await worker.tick();

    const token = sender.sent.find((m) => m.to === 'a@x.com')!.headers['List-Unsubscribe']!.match(/\/u\/([^>]+)>/)![1]!;
    await request(app).get(`/u/${token}`).expect(200);
    const { rowCount } = await db.query('select 1 from suppressions');
    expect(rowCount).toBe(0);

    // One-Click (RFC 8058)
    await request(app).post(`/u/${token}`).type('form').send('List-Unsubscribe=One-Click').expect(200);
    const { body: contacts } = await agent.get(`/api/lists/${list.id}/contacts`);
    expect(contacts.items.find((x: { email: string }) => x.email === 'a@x.com').isSuppressed).toBe(true);

    const c2 = await readyCampaign(list.id);
    const { body } = await agent.post(`/api/campaigns/${c2.id}/send`).expect(202);
    expect(body.progress.total).toBe(1);

    await request(app).get('/u/nao-existe').expect(404);
  });

  it('quem descadastra depois do disparo é pulado no envio', async () => {
    const list = await listWith('a@x.com\nb@x.com');
    const c = await readyCampaign(list.id);
    await agent.post(`/api/campaigns/${c.id}/send`).expect(202);
    await db.query("insert into suppressions (email, reason) values ('b@x.com', 'unsubscribe')");

    const { worker, sender } = makeWorker();
    await worker.tick();
    expect(sender.sent.map((m) => m.to)).toEqual(['a@x.com']);
    const { body } = await agent.get(`/api/campaigns/${c.id}`);
    expect(body.progress).toMatchObject({ sent: 1, skipped: 1 });
    expect(body.status).toBe('sent');
  });
});
