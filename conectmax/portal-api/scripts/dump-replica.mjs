#!/usr/bin/env node
/**
 * Extrai JSONL + schema.sql para réplica local da base visível no portal.
 *
 * Uso:
 *   node scripts/dump-replica.mjs
 *   node scripts/dump-replica.mjs --from=01/01/2025 --to=06/11/2026
 *   node scripts/dump-replica.mjs --franquias=9
 *   node scripts/dump-replica.mjs --with-itens --itens-limit=30
 *
 * Saída: ~/.config/conectmax-franqueado/replica-base/<timestamp>/
 */
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fetchAjax, fetchPageHtml, fetchPageHtmlPaginated } from '../src/portal.js';
import { parseOrcamentosHtml } from '../src/parse-orcamentos.js';
import { parsePedidosHtml } from '../src/parse-pedidos.js';
import { parseNotasFiscaisHtml } from '../src/parse-notas.js';
import { parseFaturasHtml } from '../src/parse-faturas.js';
import {
  parseFaturamentoExcel,
  parseFaturamentoHtml,
} from '../src/parse-faturamento.js';
import { parsePedidoDetalheHtml } from '../src/parse-pedido-detalhe.js';
import { parsePedidoItensHtml } from '../src/parse-pedido-itens.js';

const FRANQUIAS_KNOWN = {
  1: {
    razao: 'CONECT MAX RS SOLUCOES EM TECNOLOGIA E COMERCIO LTDA',
    cnpj: '51687136000152',
  },
  2: { razao: 'CONECT X JV SOLUCOES EMPRESARIAIS LTDA', cnpj: '61571397000166' },
  3: {
    razao: 'CONECTX CURITIBA SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '60169241000190',
  },
  4: {
    razao: 'CONECTMAX TECH SOLUCOES CORPORATIVAS LTDA',
    cnpj: '59642703000166',
  },
  5: { razao: 'CONECT PG SOLUCOES EM TECNOLOGIA LTDA', cnpj: '48713160000104' },
  7: { razao: 'CONECT SP SOLUCOES EM TECNOLOGA LTDA', cnpj: '46475969000110' },
  8: {
    razao: 'CONECT X CRUZEIRO SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '62184037000174',
  },
  9: {
    razao: 'CONECT X CAMPINAS SOLUCOES EMPRESARIAIS LTDA',
    cnpj: '62248210000150',
  },
  11: {
    razao: 'CONECTX SP SOLUCOES EM TECNOLOGIA LTDA',
    cnpj: '57026399000105',
  },
  12: { razao: 'CONECTX CURITIBA TSF SERVICOS LTDA', cnpj: '59859764000180' },
  13: { razao: 'CONECTX CURITIBA MG SERVICOS LTDA', cnpj: '66763041000148' },
};

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

const FROM = arg('from', '01/01/2025');
const TO = arg('to', '06/11/2026');
const WITH_ITENS = hasFlag('with-itens');
const ITENS_LIMIT = Number(arg('itens-limit', '50'));
const FRANQ_ARG = arg('franquias', '');
const FRANQUIAS = FRANQ_ARG
  ? FRANQ_ARG.split(',').map((x) => Number(x.trim())).filter(Boolean)
  : [1, 2, 3, 4, 5, 8, 9, 12, 13];

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = join(homedir(), '.config/conectmax-franqueado/replica-base', stamp);

function range() {
  return { data_inicial: FROM, data_final: TO };
}

async function writeJsonl(name, rows) {
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');
  await writeFile(join(OUT, name), body, { mode: 0o600 });
}

async function dumpFranquia(fid) {
  const q = { ...range(), id_franqueado_rel: fid };
  console.log(`\n=== franquia ${fid} ===`);

  const orc = await fetchPageHtmlPaginated('orcamentos', q, { all: true });
  const orcamentos = parseOrcamentosHtml(orc.html).map((x) => ({
    ...x,
    franquiaId: fid,
  }));
  console.log('  orcamentos', orcamentos.length, 'pages', orc.pages?.length);

  const ped = await fetchPageHtmlPaginated('pedidos', q, { all: true });
  const pedidos = parsePedidosHtml(ped.html).map((x) => ({
    ...x,
    franquiaId: fid,
  }));
  console.log('  pedidos', pedidos.length, 'pages', ped.pages?.length);

  const nf = await fetchPageHtmlPaginated('notas_fiscais', q, { all: true });
  const notas = parseNotasFiscaisHtml(nf.html).map((x) => ({
    ...x,
    franquiaId: fid,
  }));
  console.log('  notas', notas.length, 'pages', nf.pages?.length);

  const cr = await fetchPageHtml('contasareceber', q);
  const faturas = parseFaturasHtml(cr.html).map((x) => ({
    ...x,
    franquiaId: fid,
  }));
  console.log('  faturas', faturas.length);

  const fatPage = await fetchPageHtml('faturamento', {
    ...range(),
    id_franqueado_rel: fid,
  });
  const porVendedor = parseFaturamentoHtml(fatPage.html).map((x) => ({
    ...x,
    franquiaId: fid,
  }));
  const excel = await fetchAjax(
    '/franqueado/ajax/faturamento/relatorio_excel.php',
    {
      id_franqueado: fid,
      page: 'faturamento',
      data_inicial: FROM,
      data_final: TO,
    },
  );
  const parsed = parseFaturamentoExcel(excel.body);
  const fatDetalhe = parsed.detalhe.map((x) => ({ ...x, franquiaId: fid }));
  const fatVend =
    (parsed.porVendedor.length ? parsed.porVendedor : porVendedor).map(
      (x) => ({ ...x, franquiaId: fid }),
    );
  console.log('  faturamento detalhe', fatDetalhe.length, 'vendedores', fatVend.length);

  let detalhes = [];
  let itens = [];
  if (WITH_ITENS) {
    const sample = pedidos.slice(0, ITENS_LIMIT);
    for (const p of sample) {
      try {
        const { html } = await fetchPageHtml('pedidos_edicao', {
          id_pedido: p.id,
          action: 'visualizar',
        });
        const d = parsePedidoDetalheHtml(html, p.id);
        detalhes.push({ ...d, franquiaId: fid, listTotal: p.total });
        const prod = await fetchAjax(
          '/franqueado/ajax/pedidos/produtos.php',
          { id_pedido: p.id },
          { method: 'POST' },
        );
        const lines = parsePedidoItensHtml(prod.body).map((it, i) => ({
          ...it,
          pedidoId: p.id,
          franquiaId: fid,
          seq: i + 1,
        }));
        itens.push(...lines);
        process.stdout.write('.');
      } catch (e) {
        console.warn(`\n  pedido ${p.id}: ${e.message}`);
      }
    }
    console.log(`\n  detalhes ${detalhes.length} itens ${itens.length}`);
  }

  return {
    orcamentos,
    pedidos,
    notas,
    faturas,
    fatVend,
    fatDetalhe,
    detalhes,
    itens,
  };
}

const SCHEMA_SQL = `-- Réplica inferida Portal Franqueado (não é o schema PHP original)
CREATE TABLE franquia (
  id INTEGER PRIMARY KEY,
  razao_social TEXT,
  cnpj TEXT
);
CREATE TABLE orcamento (
  id INTEGER PRIMARY KEY,
  franquia_id INTEGER,
  numero INTEGER,
  data TEXT,
  status TEXT,
  cliente TEXT,
  vendedor TEXT,
  total REAL
);
CREATE TABLE pedido (
  id INTEGER PRIMARY KEY,
  franquia_id INTEGER,
  orcamento_id INTEGER,
  data TEXT,
  status TEXT,
  cliente TEXT,
  vendedor TEXT,
  total REAL,
  email TEXT,
  telefone TEXT,
  cnpj TEXT
);
CREATE TABLE pedido_item (
  pedido_id INTEGER,
  seq INTEGER,
  franquia_id INTEGER,
  id_produto INTEGER,
  produto TEXT,
  ncm TEXT,
  quantidade REAL,
  valor_unitario REAL,
  lucro_percentual REAL,
  valor_extra REAL,
  total REAL,
  PRIMARY KEY (pedido_id, seq)
);
CREATE TABLE nota_fiscal (
  id INTEGER PRIMARY KEY,
  franquia_id INTEGER,
  numero INTEGER,
  status TEXT,
  tipo TEXT,
  cliente TEXT,
  data TEXT,
  transportadora TEXT,
  total REAL
);
CREATE TABLE conta_receber (
  id INTEGER PRIMARY KEY,
  franquia_id INTEGER,
  status TEXT,
  vencimento TEXT,
  titulo TEXT,
  fatura_n INTEGER,
  nf_numero INTEGER,
  id_nota INTEGER,
  pedido_id INTEGER,
  cliente TEXT,
  cnpj TEXT,
  descricao TEXT,
  valor REAL
);
CREATE TABLE faturamento_vendedor (
  franquia_id INTEGER,
  vendedor TEXT,
  total REAL
);
CREATE TABLE faturamento_linha (
  franquia_id INTEGER,
  vendedor TEXT,
  nota TEXT,
  pedido TEXT,
  data TEXT,
  total REAL
);
`;

async function main() {
  await mkdir(OUT, { recursive: true, mode: 0o700 });
  await chmod(OUT, 0o700).catch(() => {});

  const franquias = FRANQUIAS.map((id) => ({
    id,
    razao_social: FRANQUIAS_KNOWN[id]?.razao || null,
    cnpj: FRANQUIAS_KNOWN[id]?.cnpj || null,
  }));
  await writeFile(join(OUT, 'franquias.json'), JSON.stringify(franquias, null, 2));
  await writeFile(join(OUT, 'schema.sql'), SCHEMA_SQL);
  await writeFile(
    join(OUT, 'meta.json'),
    JSON.stringify(
      {
        geradoEm: new Date().toISOString(),
        periodo: { from: FROM, to: TO },
        franquias: FRANQUIAS,
        withItens: WITH_ITENS,
        itensLimit: WITH_ITENS ? ITENS_LIMIT : 0,
        fonte: 'https://franqueado.conectmax.com/',
      },
      null,
      2,
    ),
  );

  const bag = {
    orcamentos: [],
    pedidos: [],
    notas: [],
    faturas: [],
    fatVend: [],
    fatDetalhe: [],
    detalhes: [],
    itens: [],
  };

  for (const fid of FRANQUIAS) {
    const part = await dumpFranquia(fid);
    for (const k of Object.keys(bag)) bag[k].push(...part[k]);
  }

  // merge pedido detalhe onto pedidos when present
  const detById = new Map(bag.detalhes.map((d) => [d.id, d]));
  const pedidosMerged = bag.pedidos.map((p) => {
    const d = detById.get(p.id);
    if (!d) return p;
    return {
      ...p,
      email: d.email,
      telefone: d.telefone,
      cnpj: d.cnpj,
      cliente: d.cliente || p.cliente,
      vendedor: d.vendedor || p.vendedor,
      vendedorId: d.vendedorId,
    };
  });

  await writeJsonl('orcamentos.jsonl', bag.orcamentos);
  await writeJsonl('pedidos.jsonl', pedidosMerged);
  await writeJsonl('notas_fiscais.jsonl', bag.notas);
  await writeJsonl('contas_receber.jsonl', bag.faturas);
  await writeJsonl('faturamento_vendedor.jsonl', bag.fatVend);
  await writeJsonl('faturamento_linha.jsonl', bag.fatDetalhe);
  await writeJsonl('pedido_itens.jsonl', bag.itens);

  const summary = {
    out: OUT,
    counts: {
      franquias: franquias.length,
      orcamentos: bag.orcamentos.length,
      pedidos: bag.pedidos.length,
      notas: bag.notas.length,
      faturas: bag.faturas.length,
      faturamentoLinhas: bag.fatDetalhe.length,
      pedidoItens: bag.itens.length,
    },
  };
  await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nOK', JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
