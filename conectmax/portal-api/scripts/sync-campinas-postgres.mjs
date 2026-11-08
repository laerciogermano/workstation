#!/usr/bin/env node
/**
 * Sync franquia → schema normalizado portal_franqueado (Contabo).
 *
 *   node scripts/sync-campinas-postgres.mjs
 *   node scripts/sync-campinas-postgres.mjs --franquia=2
 *   node scripts/sync-campinas-postgres.mjs --franquia=2 --skip-itens
 *   node scripts/sync-campinas-postgres.mjs --franquia=2 --only-itens
 *   node scripts/sync-campinas-postgres.mjs --franquia=3 --delta
 *   node scripts/sync-campinas-postgres.mjs --franquia=2 --only-orcamentos
 *   node scripts/sync-campinas-postgres.mjs --contato --itens-concurrency=8
 *
 * Listagens de outras franquias usam id_franqueado_rel / id_franqueado (IDOR do portal).
 * --delta: não apaga pedidos/itens; só INSERT ON CONFLICT + completa itens faltantes.
 * --only-orcamentos: stubs a partir dos pedidos + liga pedido.orcamento_id (PK composta).
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAjax, fetchPageHtml, fetchPageHtmlPaginated } from '../src/portal.js';
import { parseOrcamentosHtml } from '../src/parse-orcamentos.js';
import { parsePedidosHtml } from '../src/parse-pedidos.js';
import { parseNotasFiscaisHtml } from '../src/parse-notas.js';
import { parseFaturasHtml } from '../src/parse-faturas.js';
import { parseFaturamentoExcel } from '../src/parse-faturamento.js';
import { parsePedidoDetalheHtml } from '../src/parse-pedido-detalhe.js';
import { parsePedidoItensHtml } from '../src/parse-pedido-itens.js';
import { parseChamadosHtml } from '../src/parse-chamados.js';
import { parseNotificacoesHtml } from '../src/parse-notificacoes.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_ENV = join(ROOT, '../connectmax/vendas/api/.env');
const DDL_PATH = join(ROOT, 'sql/schema-normalizado.sql');

const FRANQUIAS = {
  1: {
    razao: 'CONECT MAX RS SOLUCOES EM TECNOLOGIA E COMERCIO LTDA',
    cnpj: '51687136000152',
    nome: 'RS',
  },
  2: {
    razao: 'CONECT X JV SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '61571397000166',
    nome: 'JV',
  },
  3: {
    razao: 'CONECTX CURITIBA SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '60169241000190',
    nome: 'Curitiba',
  },
  4: {
    razao: 'CONECTMAX TECH SOLUCOES CORPORATIVAS LTDA',
    cnpj: '59642703000166',
    nome: 'Tech',
  },
  5: {
    razao: 'CONECT PG SOLUCOES EM TECNOLOGIA LTDA',
    cnpj: '48713160000104',
    nome: 'PG',
  },
  8: {
    razao: 'CONECT X CRUZEIRO SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '62184037000174',
    nome: 'Cruzeiro',
  },
  9: {
    razao: 'CONECT X CAMPINAS SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '62248210000150',
    nome: 'Campinas',
  },
  12: {
    razao: 'CONECTX CURITIBA TSF SERVICOS LTDA',
    cnpj: '59859764000180',
    nome: 'Curitiba TSF',
  },
  13: {
    razao: 'CONECTX CURITIBA MG SERVICOS LTDA',
    cnpj: '66763041000148',
    nome: 'Curitiba MG',
  },
};

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
const SKIP_ITENS = hasFlag('skip-itens');
const ONLY_ITENS = hasFlag('only-itens');
const ONLY_ORCAMENTOS = hasFlag('only-orcamentos');
const DELTA = hasFlag('delta');
const CONCURRENCY = Math.max(1, Number(arg('itens-concurrency', '6')) || 6);
const FRANQUIA_ID = Number(arg('franquia', '9')) || 9;
const meta = FRANQUIAS[FRANQUIA_ID];
if (!meta) {
  console.error(
    `franquia ${FRANQUIA_ID} desconhecida. Ids: ${Object.keys(FRANQUIAS).join(', ')}`,
  );
  process.exit(1);
}
const FRANQUIA = { id: FRANQUIA_ID, ...meta };

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
    keepAlive: true,
    connectionTimeoutMillis: 30_000,
    options: '-c statement_timeout=120000',
  };
}

function digitsCnpj(s) {
  const d = String(s || '').replace(/\D/g, '');
  return d || null;
}

function normNome(s) {
  return String(s || '').trim().replace(/\s+/g, ' ') || null;
}

async function seedVendedores(client, nomes) {
  const uniq = [...new Set([...nomes].map(normNome).filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 80) {
    const part = uniq.slice(i, i + 80);
    const params = [];
    const vals = part.map((n, j) => {
      const b = params.length;
      params.push(FRANQUIA_ID, n);
      return `($${b + 1},$${b + 2})`;
    });
    await client.query(
      `INSERT INTO portal_franqueado.vendedor (franquia_id, nome)
       VALUES ${vals.join(',')}
       ON CONFLICT (franquia_id, nome) DO NOTHING`,
      params,
    );
  }
  const { rows } = await client.query(
    `SELECT id, nome FROM portal_franqueado.vendedor WHERE franquia_id=$1`,
    [FRANQUIA_ID],
  );
  const cache = new Map();
  for (const r of rows) cache.set(String(r.nome).toLowerCase(), r.id);
  return cache;
}

async function seedClientes(client, list) {
  /** @type {Map<string,{nome:string,cnpj?:string|null,email?:string|null,telefone?:string|null,whatsapp?:string|null}>} */
  const byKey = new Map();
  for (const raw of list) {
    const n = normNome(raw.nome);
    if (!n) continue;
    const c = digitsCnpj(raw.cnpj);
    const key = c ? `c:${c}` : `n:${n.toLowerCase()}`;
    const prev = byKey.get(key) || { nome: n, cnpj: c };
    byKey.set(key, {
      nome: n,
      cnpj: c || prev.cnpj || null,
      email: raw.email || prev.email || null,
      telefone: raw.telefone || prev.telefone || null,
      whatsapp: raw.whatsapp || prev.whatsapp || null,
    });
  }
  const all = [...byKey.values()];
  for (let i = 0; i < all.length; i += 50) {
    const part = all.slice(i, i + 50);
    for (const r of part) {
      if (r.cnpj) {
        await client.query(
          `INSERT INTO portal_franqueado.cliente (franquia_id, cnpj, nome, email, telefone, whatsapp)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (franquia_id, cnpj) WHERE cnpj IS NOT NULL AND cnpj <> ''
           DO UPDATE SET
             nome = EXCLUDED.nome,
             email = COALESCE(EXCLUDED.email, portal_franqueado.cliente.email),
             telefone = COALESCE(EXCLUDED.telefone, portal_franqueado.cliente.telefone),
             whatsapp = COALESCE(EXCLUDED.whatsapp, portal_franqueado.cliente.whatsapp)`,
          [FRANQUIA_ID, r.cnpj, r.nome, r.email, r.telefone, r.whatsapp],
        );
      } else {
        await client.query(
          `INSERT INTO portal_franqueado.cliente (franquia_id, cnpj, nome, email, telefone, whatsapp)
           VALUES ($1,NULL,$2,$3,$4,$5)
           ON CONFLICT (franquia_id, nome) WHERE cnpj IS NULL OR cnpj = ''
           DO UPDATE SET
             email = COALESCE(EXCLUDED.email, portal_franqueado.cliente.email),
             telefone = COALESCE(EXCLUDED.telefone, portal_franqueado.cliente.telefone),
             whatsapp = COALESCE(EXCLUDED.whatsapp, portal_franqueado.cliente.whatsapp)`,
          [FRANQUIA_ID, r.nome, r.email, r.telefone, r.whatsapp],
        );
      }
    }
  }
  const { rows } = await client.query(
    `SELECT id, cnpj, nome FROM portal_franqueado.cliente WHERE franquia_id=$1`,
    [FRANQUIA_ID],
  );
  const cache = new Map();
  for (const r of rows) {
    if (r.cnpj) cache.set(`c:${r.cnpj}`, r.id);
    cache.set(`n:${String(r.nome).toLowerCase()}`, r.id);
  }
  return cache;
}

function clienteId(cache, nome, cnpj) {
  const c = digitsCnpj(cnpj);
  if (c && cache.has(`c:${c}`)) return cache.get(`c:${c}`);
  const n = normNome(nome);
  if (n && cache.has(`n:${n.toLowerCase()}`)) return cache.get(`n:${n.toLowerCase()}`);
  return null;
}

function vendedorId(cache, nome) {
  const n = normNome(nome);
  return n ? cache.get(n.toLowerCase()) || null : null;
}

async function insertChunks(
  client,
  sqlPrefix,
  rows,
  rowToParams,
  chunkSize = 100,
  onConflict = '',
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const part = rows.slice(i, i + chunkSize);
    const params = [];
    const tuples = part.map((row) => {
      const vals = rowToParams(row);
      const base = params.length;
      params.push(...vals);
      return `(${vals.map((_, j) => `$${base + j + 1}`).join(',')})`;
    });
    await client.query(
      `${sqlPrefix} VALUES ${tuples.join(',')} ${onConflict}`,
      params,
    );
  }
}

async function mapPool(items, concurrency, fn) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function syncOnlyItens(pool) {
  const resume = hasFlag('resume') || hasFlag('only-itens');
  // --resume / only-itens: não apaga itens já gravados; completa o que falta
  const { rows: pedidos } = await pool.query(
    resume
      ? `SELECT p.id FROM portal_franqueado.pedido p
         WHERE p.franquia_id=$1
           AND NOT EXISTS (
             SELECT 1 FROM portal_franqueado.pedido_item i
             WHERE i.pedido_id=p.id AND i.franquia_id=$1
           )
         ORDER BY p.id`
      : `SELECT id FROM portal_franqueado.pedido WHERE franquia_id=$1 ORDER BY id`,
    [FRANQUIA_ID],
  );
  console.log(
    `only-itens · ${pedidos.length} pedidos · concurrency=${CONCURRENCY} · resume=${resume}`,
  );
  if (!resume) {
    await pool.query(
      `DELETE FROM portal_franqueado.pedido_item WHERE franquia_id=$1`,
      [FRANQUIA_ID],
    );
  }
  let itensCount = 0;
  let done = 0;
  await mapPool(pedidos, CONCURRENCY, async (p) => {
    const client = await pool.connect();
    try {
      const { html } = await fetchPageHtml('pedidos_edicao', {
        id_pedido: p.id,
        action: 'visualizar',
      });
      const d = parsePedidoDetalheHtml(html, Number(p.id));
      await client.query(
        `UPDATE portal_franqueado.pedido SET
           cnpj=COALESCE($2,cnpj),
           email=COALESCE($3,email),
           telefone=COALESCE($4,telefone),
           whatsapp=COALESCE($5,whatsapp),
           cliente_nome=COALESCE($6,cliente_nome),
           vendedor_nome=COALESCE($7,vendedor_nome)
         WHERE id=$1`,
        [
          p.id,
          digitsCnpj(d.cnpj),
          d.email,
          d.telefone,
          d.whatsapp,
          d.cliente,
          d.vendedor,
        ],
      );
      const prod = await fetchAjax(
        '/franqueado/ajax/pedidos/produtos.php',
        { id_pedido: p.id },
        { method: 'POST' },
      );
      const lines = parsePedidoItensHtml(prod.body);
      for (let seq = 0; seq < lines.length; seq++) {
        const it = lines[seq];
        await client.query(
          `INSERT INTO portal_franqueado.pedido_item
           (pedido_id,seq,franquia_id,id_produto,produto,ncm,quantidade,valor_unitario,
            lucro_percentual,valor_extra,total,total_unidade)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (pedido_id, seq) DO UPDATE SET
             produto=EXCLUDED.produto, total=EXCLUDED.total`,
          [
            p.id,
            seq + 1,
            FRANQUIA_ID,
            it.idProduto,
            it.produto,
            it.ncm,
            it.quantidade,
            it.valorUnitario,
            it.lucroPercentual,
            it.valorExtra,
            it.total,
            it.totalUnidade,
          ],
        );
        itensCount += 1;
      }
    } catch (e) {
      console.warn(`\npedido ${p.id}: ${e.message}`);
    } finally {
      client.release();
    }
    done += 1;
    if (done % 25 === 0 || done === pedidos.length) {
      process.stdout.write(`  itens progress ${done}/${pedidos.length} (rows=${itensCount})\n`);
    }
  });
  console.log('pedido_item ok', itensCount);
}

/** Sessão do login em credentials.env (lista /orcamentos é dessa franquia). */
const SESSION_FRANQUIA_ID = Number(arg('session-franquia', '9')) || 9;

function stubsFromPedidos(pedidos, orcFromPed) {
  return [...orcFromPed].map((id) => {
    const p = pedidos.find((x) => x.orcamento === id);
    return {
      id,
      numero: id,
      data: p?.data || null,
      status: null,
      cliente: p?.cliente || null,
      vendedor: p?.vendedor || null,
      total: null,
      totalTexto: null,
    };
  });
}

async function upsertOrcamentosAndLink(client, pedidos, orcamentos) {
  const vendCache = await seedVendedores(client, [
    ...orcamentos.map((r) => r.vendedor),
    ...pedidos.map((r) => r.vendedor),
  ]);
  const cliCache = await seedClientes(client, [
    ...orcamentos.map((r) => ({ nome: r.cliente })),
    ...pedidos.map((r) => ({ nome: r.cliente })),
  ]);

  await insertChunks(
    client,
    `INSERT INTO portal_franqueado.orcamento
     (id,franquia_id,vendedor_id,cliente_id,numero,data,status,cliente_nome,vendedor_nome,total,total_texto)`,
    orcamentos,
    (r) => [
      r.id,
      FRANQUIA_ID,
      vendedorId(vendCache, r.vendedor),
      clienteId(cliCache, r.cliente),
      r.numero,
      r.data,
      r.status,
      r.cliente,
      r.vendedor,
      r.total,
      r.totalTexto ?? null,
    ],
    100,
    `ON CONFLICT (franquia_id, id) DO UPDATE SET
       vendedor_id=COALESCE(EXCLUDED.vendedor_id, portal_franqueado.orcamento.vendedor_id),
       cliente_id=COALESCE(EXCLUDED.cliente_id, portal_franqueado.orcamento.cliente_id),
       numero=COALESCE(EXCLUDED.numero, portal_franqueado.orcamento.numero),
       data=COALESCE(EXCLUDED.data, portal_franqueado.orcamento.data),
       status=COALESCE(EXCLUDED.status, portal_franqueado.orcamento.status),
       cliente_nome=COALESCE(EXCLUDED.cliente_nome, portal_franqueado.orcamento.cliente_nome),
       vendedor_nome=COALESCE(EXCLUDED.vendedor_nome, portal_franqueado.orcamento.vendedor_nome),
       total=COALESCE(EXCLUDED.total, portal_franqueado.orcamento.total),
       total_texto=COALESCE(EXCLUDED.total_texto, portal_franqueado.orcamento.total_texto),
       synced_at=now()`,
  );

  const orcWanted = orcamentos.map((o) => o.id).filter(Boolean);
  const { rows: orcExisting } = await client.query(
    `SELECT id FROM portal_franqueado.orcamento
     WHERE franquia_id=$1 AND id = ANY($2::bigint[])`,
    [FRANQUIA_ID, orcWanted],
  );
  const orcIds = new Set(orcExisting.map((r) => Number(r.id)));
  console.log('orcamento ok', orcamentos.length, 'fk-ready', orcIds.size);

  const linkIds = [];
  const linkOrcs = [];
  for (const p of pedidos) {
    if (!p.orcamento || !orcIds.has(Number(p.orcamento))) continue;
    linkIds.push(p.id);
    linkOrcs.push(Number(p.orcamento));
  }
  let linked = 0;
  const LINK_CHUNK = 500;
  for (let i = 0; i < linkIds.length; i += LINK_CHUNK) {
    const ids = linkIds.slice(i, i + LINK_CHUNK);
    const orcs = linkOrcs.slice(i, i + LINK_CHUNK);
    const r = await client.query(
      `UPDATE portal_franqueado.pedido p
       SET orcamento_id = x.orc
       FROM unnest($1::bigint[], $2::bigint[]) AS x(id, orc)
       WHERE p.id = x.id
         AND p.franquia_id = $3
         AND (p.orcamento_id IS DISTINCT FROM x.orc)`,
      [ids, orcs, FRANQUIA_ID],
    );
    linked += r.rowCount || 0;
  }
  console.log('pedido.orcamento_id linked', linked);
  return { vendCache, cliCache, orcIds };
}

async function main() {
  const range = { data_inicial: FROM, data_final: TO };
  console.log(
    `${FRANQUIA.nome} id=${FRANQUIA_ID} · ${FROM} → ${TO} · itens=${!SKIP_ITENS} · onlyItens=${ONLY_ITENS} · onlyOrcs=${ONLY_ORCAMENTOS} · delta=${DELTA}`,
  );

  if (ONLY_ITENS) {
    const db = await loadDbEnv();
    const { Pool } = require('pg');
    const pool = new Pool({ ...db, max: CONCURRENCY + 1 });
    try {
      await syncOnlyItens(pool);
    } finally {
      await pool.end();
    }
    return;
  }

  // filtro cross-franquia (portal honra id_franqueado_rel)
  const fq = { ...range, id_franqueado_rel: FRANQUIA_ID };

  console.log('fetch pedidos…');
  const pedidos = parsePedidosHtml(
    (await fetchPageHtmlPaginated('pedidos', fq, { all: true })).html,
  );
  console.log(' ', pedidos.length);

  // orcamentos: portal ignora id_franqueado_rel (lista = sessão).
  // Outras franquias → só stubs dos pedidos. Sessão (default 9) → lista completa + stubs faltantes.
  const orcFromPed = new Set(
    pedidos
      .map((p) => p.orcamento)
      .filter((n) => n != null && Number.isFinite(Number(n)) && Number(n) > 0)
      .map((n) => Number(n)),
  );
  let orcamentos;
  let beforeOrc = 0;
  if (FRANQUIA_ID === SESSION_FRANQUIA_ID) {
    console.log('fetch orcamentos (lista da sessão)…');
    orcamentos = parseOrcamentosHtml(
      (await fetchPageHtmlPaginated('orcamentos', fq, { all: true })).html,
    );
    beforeOrc = orcamentos.length;
    const have = new Set(orcamentos.map((o) => o.id));
    for (const stub of stubsFromPedidos(pedidos, orcFromPed)) {
      if (!have.has(stub.id)) {
        orcamentos.push(stub);
        have.add(stub.id);
      }
    }
  } else {
    console.log('orcamentos stubs (via pedidos; lista portal é de outra franquia)…');
    orcamentos = stubsFromPedidos(pedidos, orcFromPed);
  }
  console.log(
    ' ',
    orcamentos.length,
    `(lista sessão ${beforeOrc}, refs pedido ${orcFromPed.size})`,
  );

  if (ONLY_ORCAMENTOS) {
    const db = await loadDbEnv();
    console.log(`postgres ${db.user}@${db.host}/${db.database}`);
    const client = new Client(db);
    await client.connect();
    try {
      const ddl = await readFile(DDL_PATH, 'utf8');
      await client.query(ddl);
      await client.query(
        `INSERT INTO portal_franqueado.franquia (id, razao_social, cnpj, nome, synced_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (id) DO UPDATE SET
           razao_social=EXCLUDED.razao_social,
           cnpj=EXCLUDED.cnpj,
           nome=EXCLUDED.nome,
           synced_at=now()`,
        [FRANQUIA.id, FRANQUIA.razao, FRANQUIA.cnpj, FRANQUIA.nome],
      );
      await client.query('BEGIN');
      await upsertOrcamentosAndLink(client, pedidos, orcamentos);
      await client.query('COMMIT');
      const { rows } = await client.query(
        `SELECT
           (SELECT count(*)::int FROM portal_franqueado.orcamento WHERE franquia_id=$1) orcs,
           (SELECT count(*)::int FROM portal_franqueado.pedido
            WHERE franquia_id=$1 AND orcamento_id IS NOT NULL) ped_com_orc`,
        [FRANQUIA_ID],
      );
      console.log('counts', rows[0]);
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      await client.end();
    }
    return;
  }

  console.log('fetch notas…');
  const notas = parseNotasFiscaisHtml(
    (await fetchPageHtmlPaginated('notas_fiscais', fq, { all: true })).html,
  );
  console.log(' ', notas.length);

  console.log('fetch faturas…');
  let faturas = parseFaturasHtml(
    (await fetchPageHtml('contasareceber', fq)).html,
  );
  console.log(' ', faturas.length);

  console.log('fetch faturamento excel…');
  const excel = await fetchAjax('/franqueado/ajax/faturamento/relatorio_excel.php', {
    id_franqueado: FRANQUIA_ID,
    page: 'faturamento',
    data_inicial: FROM,
    data_final: TO,
  });
  const fatLinhas = parseFaturamentoExcel(excel.body).detalhe || [];
  console.log(' ', fatLinhas.length);

  console.log('fetch chamados / notificacoes…');
  const chamados = parseChamadosHtml(
    (await fetchPageHtml('chamados', range)).html,
  );
  const notificacoes = parseNotificacoesHtml(
    (await fetchPageHtml('notificacoes', range)).html,
  );
  console.log(' ', chamados.length, notificacoes.length);

  if (WITH_CONTATO) {
    console.log('enrich contato vencidas…');
    const ids = [
      ...new Set(
        faturas.filter((f) => f.status === 'Vencida' && f.pedido).map((f) => f.pedido),
      ),
    ];
    const cache = new Map();
    await mapPool(ids, CONCURRENCY, async (id) => {
      try {
        const { html } = await fetchPageHtml('pedidos_edicao', {
          id_pedido: id,
          action: 'visualizar',
        });
        cache.set(id, parsePedidoDetalheHtml(html, id));
      } catch (e) {
        cache.set(id, { erro: e.message });
      }
    });
    faturas = faturas.map((f) => {
      const d = f.pedido ? cache.get(f.pedido) : null;
      if (!d || d.erro) return f;
      return {
        ...f,
        email: d.email ?? null,
        telefone: d.telefone ?? null,
        whatsapp: d.whatsapp ?? null,
        cnpj: d.cnpj || f.cnpj,
        cliente: d.cliente || f.cliente,
      };
    });
  }

  const db = await loadDbEnv();
  const ddl = await readFile(DDL_PATH, 'utf8');
  console.log(`postgres ${db.user}@${db.host}/${db.database}`);
  const client = new Client(db);
  await client.connect();

  try {
    await client.query(ddl);
    await client.query(
      `INSERT INTO portal_franqueado.franquia (id, razao_social, cnpj, nome, synced_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (id) DO UPDATE SET
         razao_social=EXCLUDED.razao_social,
         cnpj=EXCLUDED.cnpj,
         nome=EXCLUDED.nome,
         synced_at=now()`,
      [FRANQUIA.id, FRANQUIA.razao, FRANQUIA.cnpj, FRANQUIA.nome],
    );

    await client.query('BEGIN');

    if (DELTA) {
      // mantém pedidos/itens; só refresca tabelas sem PK estável / espelho completo barato
      await client.query(
        `DELETE FROM portal_franqueado.faturamento_linha WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.chamado WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.notificacao WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
    } else {
      // limpa filhos da franquia (ordem FK)
      await client.query(
        `DELETE FROM portal_franqueado.pedido_item WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.nota_fiscal_xml nf USING portal_franqueado.nota_fiscal n
         WHERE nf.nota_id=n.id AND n.franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.conta_receber WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.pedido WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.nota_fiscal WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.orcamento WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.faturamento_linha WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.chamado WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
      await client.query(
        `DELETE FROM portal_franqueado.notificacao WHERE franquia_id=$1`,
        [FRANQUIA_ID],
      );
    }

    console.log('seed vendedor/cliente…');
    const vendCache = await seedVendedores(client, [
      ...orcamentos.map((r) => r.vendedor),
      ...pedidos.map((r) => r.vendedor),
      ...fatLinhas.map((r) => r.vendedor),
    ]);
    const cliCache = await seedClientes(client, [
      ...orcamentos.map((r) => ({ nome: r.cliente })),
      ...pedidos.map((r) => ({ nome: r.cliente })),
      ...notas.map((r) => ({ nome: r.cliente })),
      ...faturas.map((r) => ({
        nome: r.cliente,
        cnpj: r.cnpj,
        email: r.email,
        telefone: r.telefone,
        whatsapp: r.whatsapp,
      })),
    ]);
    console.log('  vendedores', vendCache.size, 'clientes', cliCache.size);

    await insertChunks(
      client,
      `INSERT INTO portal_franqueado.orcamento
       (id,franquia_id,vendedor_id,cliente_id,numero,data,status,cliente_nome,vendedor_nome,total,total_texto)`,
      orcamentos,
      (r) => [
        r.id,
        FRANQUIA_ID,
        vendedorId(vendCache, r.vendedor),
        clienteId(cliCache, r.cliente),
        r.numero,
        r.data,
        r.status,
        r.cliente,
        r.vendedor,
        r.total,
        r.totalTexto ?? null,
      ],
      100,
      `ON CONFLICT (franquia_id, id) DO UPDATE SET
         vendedor_id=COALESCE(EXCLUDED.vendedor_id, portal_franqueado.orcamento.vendedor_id),
         cliente_id=COALESCE(EXCLUDED.cliente_id, portal_franqueado.orcamento.cliente_id),
         numero=COALESCE(EXCLUDED.numero, portal_franqueado.orcamento.numero),
         data=COALESCE(EXCLUDED.data, portal_franqueado.orcamento.data),
         status=COALESCE(EXCLUDED.status, portal_franqueado.orcamento.status),
         cliente_nome=COALESCE(EXCLUDED.cliente_nome, portal_franqueado.orcamento.cliente_nome),
         vendedor_nome=COALESCE(EXCLUDED.vendedor_nome, portal_franqueado.orcamento.vendedor_nome),
         total=COALESCE(EXCLUDED.total, portal_franqueado.orcamento.total),
         total_texto=COALESCE(EXCLUDED.total_texto, portal_franqueado.orcamento.total_texto),
         synced_at=now()`,
    );
    const orcWanted = orcamentos.map((o) => o.id).filter(Boolean);
    const { rows: orcExisting } = await client.query(
      `SELECT id FROM portal_franqueado.orcamento
       WHERE franquia_id=$1 AND id = ANY($2::bigint[])`,
      [FRANQUIA_ID, orcWanted],
    );
    const orcIds = new Set(orcExisting.map((r) => Number(r.id)));
    console.log('orcamento ok', orcamentos.length, 'fk-ready', orcIds.size);

    await insertChunks(
      client,
      `INSERT INTO portal_franqueado.pedido
       (id,franquia_id,orcamento_id,vendedor_id,cliente_id,numero,data,status,cliente_nome,vendedor_nome,total,total_texto)`,
      pedidos,
      (r) => [
        r.id,
        FRANQUIA_ID,
        r.orcamento && orcIds.has(r.orcamento) ? r.orcamento : null,
        vendedorId(vendCache, r.vendedor),
        clienteId(cliCache, r.cliente),
        r.numero ?? r.id,
        r.data,
        r.status,
        r.cliente,
        r.vendedor,
        r.total,
        r.totalTexto ?? null,
      ],
      100,
      DELTA
        ? `ON CONFLICT (id) DO UPDATE SET
             orcamento_id=COALESCE(EXCLUDED.orcamento_id, portal_franqueado.pedido.orcamento_id),
             status=COALESCE(EXCLUDED.status, portal_franqueado.pedido.status),
             total=COALESCE(EXCLUDED.total, portal_franqueado.pedido.total),
             total_texto=COALESCE(EXCLUDED.total_texto, portal_franqueado.pedido.total_texto),
             cliente_nome=COALESCE(EXCLUDED.cliente_nome, portal_franqueado.pedido.cliente_nome),
             vendedor_nome=COALESCE(EXCLUDED.vendedor_nome, portal_franqueado.pedido.vendedor_nome),
             synced_at=now()`
        : 'ON CONFLICT (id) DO NOTHING',
    );
    console.log('pedido ok', pedidos.length);

    await insertChunks(
      client,
      `INSERT INTO portal_franqueado.nota_fiscal
       (id,franquia_id,cliente_id,numero,status,tipo,cliente_nome,data,transportadora,total,total_texto,pdf,xml_url)`,
      notas,
      (r) => [
        r.id,
        FRANQUIA_ID,
        clienteId(cliCache, r.cliente),
        r.numero,
        r.status,
        r.tipo,
        r.cliente,
        r.data,
        r.transportadora,
        r.total,
        r.totalTexto ?? null,
        r.pdf ?? null,
        r.xml ?? null,
      ],
      100,
      DELTA ? 'ON CONFLICT (id) DO NOTHING' : '',
    );
    console.log('nota_fiscal ok', notas.length);

    const pedIds = new Set(pedidos.map((p) => p.id));
    const nfIds = new Set(notas.map((n) => n.id));
    await insertChunks(
      client,
      `INSERT INTO portal_franqueado.conta_receber
       (id,franquia_id,nota_id,pedido_id,cliente_id,status,vencimento,titulo,fatura_n,nf_numero,
        cliente_nome,cnpj,descricao,valor,valor_texto,email,telefone,whatsapp)`,
      faturas,
      (r) => [
        r.id,
        FRANQUIA_ID,
        r.idNota && nfIds.has(r.idNota) ? r.idNota : null,
        r.pedido && pedIds.has(r.pedido) ? r.pedido : null,
        clienteId(cliCache, r.cliente, r.cnpj),
        r.status,
        r.vencimento,
        r.titulo,
        r.faturaN,
        r.nfNumero,
        r.cliente,
        digitsCnpj(r.cnpj),
        r.descricao,
        r.valor,
        r.valorTexto ?? null,
        r.email ?? null,
        r.telefone ?? null,
        r.whatsapp ?? null,
      ],
      100,
      DELTA ? 'ON CONFLICT (id) DO NOTHING' : '',
    );
    console.log('conta_receber ok', faturas.length);

    await insertChunks(
      client,
      `INSERT INTO portal_franqueado.faturamento_linha
       (franquia_id,vendedor_nome,nota,pedido,data,total)`,
      fatLinhas,
      (r) => [
        FRANQUIA_ID,
        r.vendedor ?? null,
        r.nota != null ? String(r.nota) : null,
        r.pedido != null ? String(r.pedido) : null,
        r.data ?? null,
        r.total ?? null,
      ],
    );
    console.log('faturamento_linha ok', fatLinhas.length);

    for (const r of chamados) {
      await client.query(
        `INSERT INTO portal_franqueado.chamado
         (franquia_id,status,assunto,envolvidos,criado_em,editado_por,ultima_interacao,payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          FRANQUIA_ID,
          r.status ?? null,
          r.assunto ?? null,
          r.envolvidos ?? null,
          r.criadoEm ?? null,
          r.editadoPor ?? null,
          r.ultimaInteracao ?? null,
          JSON.stringify(r),
        ],
      );
    }
    for (const r of notificacoes) {
      await client.query(
        `INSERT INTO portal_franqueado.notificacao
         (franquia_id,assunto,enviado_por,data,payload)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          FRANQUIA_ID,
          r.assunto ?? null,
          r.enviadoPor ?? null,
          r.data ?? null,
          JSON.stringify(r),
        ],
      );
    }

    await client.query('COMMIT');

    let itensCount = 0;
    if (!SKIP_ITENS) {
      let alvo = pedidos;
      if (DELTA) {
        const { rows: missing } = await client.query(
          `SELECT p.id FROM portal_franqueado.pedido p
           WHERE p.franquia_id=$1
             AND NOT EXISTS (
               SELECT 1 FROM portal_franqueado.pedido_item i
               WHERE i.pedido_id=p.id AND i.franquia_id=$1
             )
           ORDER BY p.id`,
          [FRANQUIA_ID],
        );
        const miss = new Set(missing.map((r) => Number(r.id)));
        alvo = pedidos.filter((p) => miss.has(Number(p.id)));
        console.log(
          `pedido_item delta · ${alvo.length}/${pedidos.length} sem item · concurrency=${CONCURRENCY}`,
        );
      } else {
        console.log(
          `pedido_item · ${pedidos.length} pedidos · concurrency=${CONCURRENCY}`,
        );
      }
      let done = 0;
      await mapPool(alvo, CONCURRENCY, async (p) => {
        try {
          const { html } = await fetchPageHtml('pedidos_edicao', {
            id_pedido: p.id,
            action: 'visualizar',
          });
          const d = parsePedidoDetalheHtml(html, p.id);
          await client.query(
            `UPDATE portal_franqueado.pedido SET
               cnpj=COALESCE($2,cnpj),
               email=COALESCE($3,email),
               telefone=COALESCE($4,telefone),
               whatsapp=COALESCE($5,whatsapp),
               cliente_nome=COALESCE($6,cliente_nome),
               vendedor_nome=COALESCE($7,vendedor_nome)
             WHERE id=$1`,
            [
              p.id,
              digitsCnpj(d.cnpj),
              d.email,
              d.telefone,
              d.whatsapp,
              d.cliente,
              d.vendedor,
            ],
          );
          if (d.cliente || d.cnpj) {
            await seedClientes(client, [
              {
                nome: d.cliente || p.cliente,
                cnpj: d.cnpj,
                email: d.email,
                telefone: d.telefone,
                whatsapp: d.whatsapp,
              },
            ]);
          }
          if (d.vendedor) {
            await seedVendedores(client, [d.vendedor]);
            if (d.vendedorId) {
              await client.query(
                `UPDATE portal_franqueado.vendedor SET portal_id=$3
                 WHERE franquia_id=$1 AND lower(nome)=lower($2)`,
                [FRANQUIA_ID, d.vendedor, Number(d.vendedorId)],
              );
            }
          }
          const prod = await fetchAjax(
            '/franqueado/ajax/pedidos/produtos.php',
            { id_pedido: p.id },
            { method: 'POST' },
          );
          const lines = parsePedidoItensHtml(prod.body);
          for (let seq = 0; seq < lines.length; seq++) {
            const it = lines[seq];
            await client.query(
              `INSERT INTO portal_franqueado.pedido_item
               (pedido_id,seq,franquia_id,id_produto,produto,ncm,quantidade,valor_unitario,
                lucro_percentual,valor_extra,total,total_unidade)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
               ON CONFLICT (pedido_id, seq) DO UPDATE SET
                 produto=EXCLUDED.produto, total=EXCLUDED.total`,
              [
                p.id,
                seq + 1,
                FRANQUIA_ID,
                it.idProduto,
                it.produto,
                it.ncm,
                it.quantidade,
                it.valorUnitario,
                it.lucroPercentual,
                it.valorExtra,
                it.total,
                it.totalUnidade,
              ],
            );
            itensCount += 1;
          }
        } catch (e) {
          console.warn(`\npedido ${p.id}: ${e.message}`);
        }
        done += 1;
        if (done % 25 === 0 || done === alvo.length) {
          process.stdout.write(`  itens progress ${done}/${alvo.length}\n`);
        }
      });
      console.log('pedido_item ok', itensCount);
    }

    const counts = await client.query(`
      SELECT 'vendedor' t, count(*)::int c FROM portal_franqueado.vendedor WHERE franquia_id=$1
      UNION ALL SELECT 'cliente', count(*)::int FROM portal_franqueado.cliente WHERE franquia_id=$1
      UNION ALL SELECT 'orcamento', count(*)::int FROM portal_franqueado.orcamento WHERE franquia_id=$1
      UNION ALL SELECT 'pedido', count(*)::int FROM portal_franqueado.pedido WHERE franquia_id=$1
      UNION ALL SELECT 'pedido_item', count(*)::int FROM portal_franqueado.pedido_item WHERE franquia_id=$1
      UNION ALL SELECT 'nota_fiscal', count(*)::int FROM portal_franqueado.nota_fiscal WHERE franquia_id=$1
      UNION ALL SELECT 'conta_receber', count(*)::int FROM portal_franqueado.conta_receber WHERE franquia_id=$1
      UNION ALL SELECT 'faturamento_linha', count(*)::int FROM portal_franqueado.faturamento_linha WHERE franquia_id=$1
      UNION ALL SELECT 'chamado', count(*)::int FROM portal_franqueado.chamado WHERE franquia_id=$1
      UNION ALL SELECT 'notificacao', count(*)::int FROM portal_franqueado.notificacao WHERE franquia_id=$1
    `, [FRANQUIA_ID]);
    console.log('counts', Object.fromEntries(counts.rows.map((r) => [r.t, r.c])));
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
