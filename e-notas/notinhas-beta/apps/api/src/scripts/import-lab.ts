/**
 * Importa a base real do lab (schema LAB_SCHEMA, padrão `enotas` — app v0.1) para o schema novo.
 * Idempotente: nota por chave de acesso, loja por CNPJ, vínculo por (loja, código), ficha por EAN.
 * Não importa nada de pessoa (o lab não tem usuários).
 */
import { classifyProduct, isValidAccessKey, isValidGtin, parseBrl, parseQuantity, storeDisplayName } from '@notinhas/domain';
import { splitAddress } from '../modules/receipts/sefaz-pr.adapter.js';
import { createPool, withTx } from '../shared/db.js';
import { loadEnv } from '../shared/env.js';
import { migrate } from './migrate.js';

const env = loadEnv();
if (env.LAB_SCHEMA === env.DB_SCHEMA) throw new Error('LAB_SCHEMA e DB_SCHEMA precisam ser diferentes');
await migrate(env, { info: () => undefined });
const db = createPool(env.DATABASE_URL, env.DB_SCHEMA);
const L = env.LAB_SCHEMA;

function issuedAt(raw: string | null): Date | null {
  const m = raw?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6] ?? '00'}-03:00`) : null;
}

const stats = { stores: 0, receipts: 0, items: 0, products: 0, links: 0, skipped: 0 };

await withTx(db, async (tx) => {
  const empresas = await tx.query<{ id: number; cnpj: string; nome: string | null; endereco: string | null; lat: number | null; lng: number | null }>(
    `SELECT id, cnpj, nome, endereco, lat, lng FROM ${L}.empresas`,
  );
  const storeMap = new Map<number, number>();
  for (const e of empresas.rows) {
    const cnpj = e.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) continue;
    const legal = e.nome ?? cnpj;
    const { neighborhood, city } = splitAddress(e.endereco);
    const { rows } = await tx.query<{ id: number }>(
      `INSERT INTO stores (cnpj, legal_name, display_name, address, neighborhood, city, lat, lng, geocode_status, geocoded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $7::float8 IS NULL THEN NULL ELSE now() END)
       ON CONFLICT (cnpj) DO UPDATE SET lat = coalesce(stores.lat, EXCLUDED.lat), lng = coalesce(stores.lng, EXCLUDED.lng)
       RETURNING id`,
      [cnpj, legal, storeDisplayName(legal), e.endereco, neighborhood, city, e.lat, e.lng, e.lat !== null ? 'ok' : 'pending'],
    );
    if (rows[0]) {
      storeMap.set(e.id, rows[0].id);
      stats.stores++;
    }
  }

  const produtos = await tx.query<{ codigo_barras: string; titulo: string; marca: string | null; categorias: string[]; foto_url: string | null; ncm: string | null; fontes: string[] }>(
    `SELECT codigo_barras, titulo, marca, categorias, foto_url, ncm, fontes FROM ${L}.produtos_ean`,
  );
  for (const p of produtos.rows) {
    if (!isValidGtin(p.codigo_barras)) continue;
    const { category, subcategory } = classifyProduct(`${p.titulo} ${p.categorias.join(' ')}`);
    await tx.query(
      `INSERT INTO products (gtin, title, brand, category, subcategory, ncm, photo_url, sources)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (gtin) DO NOTHING`,
      [p.codigo_barras, p.titulo, p.marca, category, subcategory, p.ncm, p.foto_url?.startsWith('https://') ? p.foto_url : null, p.fontes],
    );
    stats.products++;
  }

  const notas = await tx.query<{ id: number; chave_acesso: string; empresa_id: number; url: string; numero: string | null; serie: string | null; emissao: string | null; protocolo: string | null; valor_a_pagar: string | null; valor_total: string | null; descontos: string | null }>(
    `SELECT id, chave_acesso, empresa_id, url, numero, serie, emissao, protocolo, valor_a_pagar, valor_total, descontos FROM ${L}.notas`,
  );
  for (const n of notas.rows) {
    const storeId = storeMap.get(n.empresa_id);
    const key = n.chave_acesso.replace(/\D/g, '');
    if (!storeId || !isValidAccessKey(key)) {
      stats.skipped++;
      continue;
    }
    const itens = await tx.query<{ codigo: string; nome: string | null; quantidade: string | null; unidade: string | null; valor_unitario: string | null; valor_total: string | null }>(
      `SELECT codigo, nome, quantidade, unidade, valor_unitario, valor_total FROM ${L}.itens WHERE nota_id = $1 ORDER BY id`,
      [n.id],
    );
    const lines = itens.rows.map((i, idx) => {
      const unit = parseBrl(i.valor_unitario) ?? 0;
      const qty = parseQuantity(i.quantidade) ?? 1;
      return { lineNo: idx + 1, code: i.codigo, desc: i.nome ?? i.codigo, qty: qty > 0 ? qty : 1, unitTxt: i.unidade, unit, total: parseBrl(i.valor_total) ?? Math.round(unit * qty) };
    });
    const total = parseBrl(n.valor_a_pagar) ?? parseBrl(n.valor_total) ?? lines.reduce((a, l) => a + l.total, 0);
    const ins = await tx.query<{ id: number }>(
      `INSERT INTO receipts (access_key, store_id, url, number, series, issued_at, protocol, total_cents, discount_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (access_key) DO NOTHING RETURNING id`,
      [key, storeId, n.url, n.numero, n.serie, issuedAt(n.emissao), n.protocolo, total, parseBrl(n.descontos)],
    );
    const receiptId = ins.rows[0]?.id;
    if (!receiptId) continue;
    stats.receipts++;
    for (const l of lines) {
      await tx.query(
        `INSERT INTO receipt_items (receipt_id, store_id, line_no, store_code, description, quantity, unit, unit_price_cents, total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [receiptId, storeId, l.lineNo, l.code, l.desc, l.qty, l.unitTxt, l.unit, l.total],
      );
      stats.items++;
    }
  }

  const links = await tx.query<{ empresa_id: number; codigo_unidade: string; codigo_barras: string; origem: string | null }>(
    `SELECT empresa_id, codigo_unidade, codigo_barras, origem FROM ${L}.codigos_barras`,
  );
  for (const l of links.rows) {
    const storeId = storeMap.get(l.empresa_id);
    if (!storeId || !isValidGtin(l.codigo_barras)) continue;
    const desc = await tx.query<{ description: string }>('SELECT description FROM receipt_items WHERE store_id = $1 AND store_code = $2 LIMIT 1', [storeId, l.codigo_unidade]);
    const title = desc.rows[0]?.description ?? l.codigo_barras;
    const { category } = classifyProduct(title);
    await tx.query(`INSERT INTO products (gtin, title, category, sources) VALUES ($1, $2, $3, '{DANFE}') ON CONFLICT (gtin) DO NOTHING`, [l.codigo_barras, title, category]);
    const origin = l.origem === 'barcode_scan' || l.origem === 'manual' ? l.origem : l.origem === 'sugestao' ? 'suggestion' : 'import';
    const r = await tx.query(
      `INSERT INTO barcode_links (store_id, store_code, gtin, origin) VALUES ($1, $2, $3, $4) ON CONFLICT (store_id, store_code) DO NOTHING`,
      [storeId, l.codigo_unidade, l.codigo_barras, origin],
    );
    stats.links += r.rowCount ?? 0;
  }
});

console.log(`import do lab (${L} → ${env.DB_SCHEMA}):`, stats);
await db.end();
