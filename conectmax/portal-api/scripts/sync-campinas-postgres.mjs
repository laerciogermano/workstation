#!/usr/bin/env node
/**
 * Sincroniza Campinas (franquia 9) → Postgres Contabo (schema portal_franqueado).
 * Formato das linhas = mesmo objeto JSON dos GETs usados pelo dashboard.html
 * (/orcamentos, /pedidos, /notas-fiscais, /faturas).
 *
 * Credenciais DB: conectmax/connectmax/vendas/api/.env (DB_HOST/USER/PASSWORD/NAME)
 *
 * Uso:
 *   node scripts/sync-campinas-postgres.mjs
 *   node scripts/sync-campinas-postgres.mjs --from=01/01/2020 --to=31/12/2026
 *   node scripts/sync-campinas-postgres.mjs --contato
 *
 * Default: 01/01/2015 → 31/12/2026 (todos os anos disponíveis no portal).
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPageHtml, fetchPageHtmlPaginated } from '../src/portal.js';
import { parseOrcamentosHtml } from '../src/parse-orcamentos.js';
import { parsePedidosHtml } from '../src/parse-pedidos.js';
import { parseNotasFiscaisHtml } from '../src/parse-notas.js';
import { parseFaturasHtml } from '../src/parse-faturas.js';
import { parsePedidoDetalheHtml } from '../src/parse-pedido-detalhe.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_ENV = join(ROOT, '../connectmax/vendas/api/.env');
const FRANQUIA_ID = 9;
const FRANQUIA_NOME = 'CONECT X CAMPINAS SOLUCOES EMPRESARIAIS LTDA';

const require = createRequire(
  join(ROOT, '../connectmax/vendas/api/package.json'),
);
const { Client } = require('pg');

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

const FROM = arg('from', '01/01/2015');
const TO = arg('to', '31/12/2026');
const WITH_CONTATO = hasFlag('contato');

async function loadDbEnv() {
  const text = await readFile(API_ENV, 'utf8');
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    host: map.DB_HOST,
    port: Number(map.DB_PORT || 5432),
    user: map.DB_USER,
    password: map.DB_PASSWORD,
    database: map.DB_NAME,
  };
}

const DDL = `
CREATE SCHEMA IF NOT EXISTS portal_franqueado;

CREATE TABLE IF NOT EXISTS portal_franqueado.franquia (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  synced_at TIMESTAMPTZ
);

-- payload = objeto idêntico ao item do GET da portal-api / dashboard
CREATE TABLE IF NOT EXISTS portal_franqueado.orcamentos (
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  id BIGINT NOT NULL,
  numero INTEGER,
  data TEXT,
  status TEXT,
  cliente TEXT,
  vendedor TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (franquia_id, id)
);

CREATE TABLE IF NOT EXISTS portal_franqueado.pedidos (
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  id BIGINT NOT NULL,
  numero INTEGER,
  data TEXT,
  orcamento INTEGER,
  status TEXT,
  cliente TEXT,
  vendedor TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (franquia_id, id)
);

CREATE TABLE IF NOT EXISTS portal_franqueado.notas_fiscais (
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  id BIGINT NOT NULL,
  numero INTEGER,
  data TEXT,
  status TEXT,
  tipo TEXT,
  cliente TEXT,
  transportadora TEXT,
  total DOUBLE PRECISION,
  total_texto TEXT,
  pdf TEXT,
  xml TEXT,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (franquia_id, id)
);

CREATE TABLE IF NOT EXISTS portal_franqueado.faturas (
  franquia_id INTEGER NOT NULL REFERENCES portal_franqueado.franquia(id),
  id BIGINT NOT NULL,
  status TEXT,
  vencimento TEXT,
  titulo TEXT,
  fatura_n INTEGER,
  nf_numero INTEGER,
  id_nota BIGINT,
  pedido BIGINT,
  cliente TEXT,
  cnpj TEXT,
  descricao TEXT,
  valor DOUBLE PRECISION,
  valor_texto TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (franquia_id, id)
);

CREATE INDEX IF NOT EXISTS idx_portal_orc_status ON portal_franqueado.orcamentos (franquia_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_ped_status ON portal_franqueado.pedidos (franquia_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_nf_status ON portal_franqueado.notas_fiscais (franquia_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_fat_status ON portal_franqueado.faturas (franquia_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_fat_venc ON portal_franqueado.faturas (franquia_id, vencimento);

-- Visões no formato agregado do dashboard (listKey)
CREATE OR REPLACE VIEW portal_franqueado.v_dashboard_orcamentos AS
SELECT franquia_id,
       jsonb_agg(payload ORDER BY id DESC) AS orcamentos,
       count(*)::int AS total,
       coalesce(sum(total),0) AS "totalValor"
FROM portal_franqueado.orcamentos
GROUP BY franquia_id;

CREATE OR REPLACE VIEW portal_franqueado.v_dashboard_pedidos AS
SELECT franquia_id,
       jsonb_agg(payload ORDER BY id DESC) AS pedidos,
       count(*)::int AS total,
       coalesce(sum(total),0) AS "totalValor"
FROM portal_franqueado.pedidos
GROUP BY franquia_id;

CREATE OR REPLACE VIEW portal_franqueado.v_dashboard_notas AS
SELECT franquia_id,
       jsonb_agg(payload ORDER BY id DESC) AS "notasFiscais",
       count(*)::int AS total,
       coalesce(sum(total),0) AS "totalValor"
FROM portal_franqueado.notas_fiscais
GROUP BY franquia_id;

CREATE OR REPLACE VIEW portal_franqueado.v_dashboard_faturas AS
SELECT franquia_id,
       jsonb_agg(payload ORDER BY id DESC) AS faturas,
       count(*)::int AS total,
       coalesce(sum(valor),0) AS "totalValor"
FROM portal_franqueado.faturas
GROUP BY franquia_id;

CREATE OR REPLACE VIEW portal_franqueado.v_dashboard_atrasados AS
SELECT franquia_id,
       jsonb_agg(payload ORDER BY id DESC) AS faturas,
       count(*)::int AS total,
       coalesce(sum(valor),0) AS "totalValor"
FROM portal_franqueado.faturas
WHERE status = 'Vencida'
GROUP BY franquia_id;
`;

async function upsertBatch(client, table, cols, rows, valuesFn) {
  if (!rows.length) return 0;
  const chunk = 80;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const params = [];
    const tuples = part.map((row, ri) => {
      const vals = valuesFn(row);
      const base = params.length;
      params.push(...vals);
      return `(${vals.map((_, j) => `$${base + j + 1}`).join(',')})`;
    });
    const updates = cols
      .filter((c) => c !== 'franquia_id' && c !== 'id')
      .map((c) => `${c}=EXCLUDED.${c}`)
      .join(', ');
    await client.query(
      `INSERT INTO portal_franqueado.${table} (${cols.join(',')})
       VALUES ${tuples.join(',')}
       ON CONFLICT (franquia_id, id) DO UPDATE SET ${updates}`,
      params,
    );
    n += part.length;
  }
  return n;
}

async function enrichContato(faturas) {
  const pedidoIds = [
    ...new Set(
      faturas
        .filter((f) => f.status === 'Vencida' && f.pedido)
        .map((f) => f.pedido),
    ),
  ];
  const cache = new Map();
  for (const id of pedidoIds) {
    try {
      const { html } = await fetchPageHtml('pedidos_edicao', {
        id_pedido: id,
        action: 'visualizar',
      });
      cache.set(id, parsePedidoDetalheHtml(html, id));
      process.stdout.write('.');
    } catch (e) {
      cache.set(id, { erro: e.message });
    }
  }
  if (pedidoIds.length) process.stdout.write('\n');
  return faturas.map((f) => {
    const d = f.pedido ? cache.get(f.pedido) : null;
    if (!d || d.erro) return f;
    return {
      ...f,
      email: d.email ?? null,
      telefone: d.telefone ?? null,
      whatsapp: d.whatsapp ?? null,
    };
  });
}

async function main() {
  const range = { data_inicial: FROM, data_final: TO };
  console.log(`Campinas id=${FRANQUIA_ID} · ${FROM} → ${TO}`);

  console.log('fetch orcamentos…');
  const orcHtml = await fetchPageHtmlPaginated('orcamentos', range, { all: true });
  const orcamentos = parseOrcamentosHtml(orcHtml.html);
  console.log(' ', orcamentos.length);

  console.log('fetch pedidos…');
  const pedHtml = await fetchPageHtmlPaginated('pedidos', range, { all: true });
  const pedidos = parsePedidosHtml(pedHtml.html);
  console.log(' ', pedidos.length);

  console.log('fetch notas…');
  const nfHtml = await fetchPageHtmlPaginated('notas_fiscais', range, { all: true });
  const notas = parseNotasFiscaisHtml(nfHtml.html);
  console.log(' ', notas.length);

  console.log('fetch faturas…');
  const crHtml = await fetchPageHtml('contasareceber', range);
  let faturas = parseFaturasHtml(crHtml.html);
  console.log(' ', faturas.length);

  if (WITH_CONTATO) {
    console.log('enrich contato (vencidas)…');
    faturas = await enrichContato(faturas);
  }

  const db = await loadDbEnv();
  console.log(`postgres ${db.user}@${db.host}:${db.port}/${db.database}`);
  const client = new Client(db);
  await client.connect();
  try {
    await client.query(DDL);
    await client.query(
      `INSERT INTO portal_franqueado.franquia (id, nome, synced_at)
       VALUES ($1,$2,now())
       ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome, synced_at=now()`,
      [FRANQUIA_ID, FRANQUIA_NOME],
    );

    // replace snapshot da franquia (evita órfãos fora do período)
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM portal_franqueado.orcamentos WHERE franquia_id=$1',
      [FRANQUIA_ID],
    );
    await client.query(
      'DELETE FROM portal_franqueado.pedidos WHERE franquia_id=$1',
      [FRANQUIA_ID],
    );
    await client.query(
      'DELETE FROM portal_franqueado.notas_fiscais WHERE franquia_id=$1',
      [FRANQUIA_ID],
    );
    await client.query(
      'DELETE FROM portal_franqueado.faturas WHERE franquia_id=$1',
      [FRANQUIA_ID],
    );

    const nOrc = await upsertBatch(
      client,
      'orcamentos',
      [
        'franquia_id',
        'id',
        'numero',
        'data',
        'status',
        'cliente',
        'vendedor',
        'total',
        'total_texto',
        'payload',
        'synced_at',
      ],
      orcamentos,
      (r) => [
        FRANQUIA_ID,
        r.id,
        r.numero,
        r.data,
        r.status,
        r.cliente,
        r.vendedor,
        r.total,
        r.totalTexto ?? null,
        JSON.stringify(r),
        new Date(),
      ],
    );

    const nPed = await upsertBatch(
      client,
      'pedidos',
      [
        'franquia_id',
        'id',
        'numero',
        'data',
        'orcamento',
        'status',
        'cliente',
        'vendedor',
        'total',
        'total_texto',
        'payload',
        'synced_at',
      ],
      pedidos,
      (r) => [
        FRANQUIA_ID,
        r.id,
        r.numero,
        r.data,
        r.orcamento,
        r.status,
        r.cliente,
        r.vendedor,
        r.total,
        r.totalTexto ?? null,
        JSON.stringify(r),
        new Date(),
      ],
    );

    const nNf = await upsertBatch(
      client,
      'notas_fiscais',
      [
        'franquia_id',
        'id',
        'numero',
        'data',
        'status',
        'tipo',
        'cliente',
        'transportadora',
        'total',
        'total_texto',
        'pdf',
        'xml',
        'payload',
        'synced_at',
      ],
      notas,
      (r) => [
        FRANQUIA_ID,
        r.id,
        r.numero,
        r.data,
        r.status,
        r.tipo,
        r.cliente,
        r.transportadora,
        r.total,
        r.totalTexto ?? null,
        r.pdf,
        r.xml,
        JSON.stringify(r),
        new Date(),
      ],
    );

    const nFat = await upsertBatch(
      client,
      'faturas',
      [
        'franquia_id',
        'id',
        'status',
        'vencimento',
        'titulo',
        'fatura_n',
        'nf_numero',
        'id_nota',
        'pedido',
        'cliente',
        'cnpj',
        'descricao',
        'valor',
        'valor_texto',
        'email',
        'telefone',
        'whatsapp',
        'payload',
        'synced_at',
      ],
      faturas,
      (r) => [
        FRANQUIA_ID,
        r.id,
        r.status,
        r.vencimento,
        r.titulo,
        r.faturaN,
        r.nfNumero,
        r.idNota,
        r.pedido,
        r.cliente,
        r.cnpj,
        r.descricao,
        r.valor,
        r.valorTexto ?? null,
        r.email ?? null,
        r.telefone ?? null,
        r.whatsapp ?? null,
        JSON.stringify(r),
        new Date(),
      ],
    );

    await client.query('COMMIT');

    const check = await client.query(`
      SELECT 'orcamentos' t, count(*)::int c FROM portal_franqueado.orcamentos WHERE franquia_id=$1
      UNION ALL SELECT 'pedidos', count(*)::int FROM portal_franqueado.pedidos WHERE franquia_id=$1
      UNION ALL SELECT 'notas_fiscais', count(*)::int FROM portal_franqueado.notas_fiscais WHERE franquia_id=$1
      UNION ALL SELECT 'faturas', count(*)::int FROM portal_franqueado.faturas WHERE franquia_id=$1
      UNION ALL SELECT 'atrasados', count(*)::int FROM portal_franqueado.faturas WHERE franquia_id=$1 AND status='Vencida'
    `, [FRANQUIA_ID]);

    console.log('inserted', { nOrc, nPed, nNf, nFat });
    console.log('counts', Object.fromEntries(check.rows.map((r) => [r.t, r.c])));
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
