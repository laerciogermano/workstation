import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authorize } from './auth.js';
import { CATALOG } from './catalog.js';
import { fetchAjax, fetchPageHtml, fetchPageHtmlPaginated } from './portal.js';
import { parseFaturasHtml } from './parse-faturas.js';
import { parseOrcamentosHtml } from './parse-orcamentos.js';
import { parsePedidosHtml } from './parse-pedidos.js';
import { parseNotasFiscaisHtml } from './parse-notas.js';
import {
  parseFaturamentoExcel,
  parseFaturamentoHtml,
} from './parse-faturamento.js';
import { parseFluxoPrevistoHtml } from './parse-fluxo.js';
import { parseChamadosHtml } from './parse-chamados.js';
import { parseNotificacoesHtml } from './parse-notificacoes.js';
import { parsePedidoDetalheHtml } from './parse-pedido-detalhe.js';
import { parsePedidoItensHtml } from './parse-pedido-itens.js';
import { getContatoCached, setContatoCached } from './contato-cache.js';
import {
  assertCampinasPedido,
  dbAtrasados,
  dbClientes,
  dbFaturamentoLinhas,
  dbFaturas,
  dbHealth,
  dbNotasFiscais,
  dbOrcamentos,
  dbPedidoItens,
  dbPedidos,
  dbVendedores,
} from './db-dashboard.js';
import { EXTRACT_LIMIT, capExtract } from './extract-limit.js';
import {
  LOCKED_FRANQUIA_ID,
  LOCKED_FRANQUIA_NOME,
  forcePortalFranquia,
  stripClientFranquia,
} from './franquia.js';

const PORT = Number(process.env.PORT || 4182);
const HOST = process.env.HOST || '127.0.0.1';
const SERVICE = 'connect-max-api';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const IMPLEMENTED = [
  'GET /',
  'GET /catalog',
  'GET /health',
  'GET /docs',
  'GET /dashboard',
  'GET /openapi.json',
  'GET /openapi.yaml',
  'GET /db/health',
  'GET /db/orcamentos',
  'GET /db/pedidos',
  'GET /db/notas-fiscais',
  'GET /db/faturas',
  'GET /db/atrasados',
  'GET /db/vendedores',
  'GET /db/clientes',
  'GET /db/pedido-itens',
  'GET /db/faturamento-linhas',
  'GET /faturas',
  'GET /orcamentos',
  'GET /pedidos',
  'GET /pedidos/:id',
  'GET /notas-fiscais',
  'GET /faturamento',
  'GET /fluxo-previsto',
  'GET /chamados',
  'GET /notificacoes',
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, X-API-Key, Accept',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...CORS,
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendRaw(res, status, contentType, body) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...CORS,
  });
  res.end(body);
}

function parseQuery(url) {
  return Object.fromEntries(new URL(url, 'http://local').searchParams.entries());
}

function dateRange(q) {
  return {
    data_inicial: q.data_inicial || q.from || '01/01/2025',
    data_final: q.data_final || q.to || '31/12/2026',
  };
}

function forceLogin(q) {
  return q.refresh === '1' || q.refresh === 'true';
}

/** Paginação do portal não é exposta: só enche até EXTRACT_LIMIT a partir da pág. 1 (mais novos). */
function wantAll(_q) {
  return false;
}

function filterStatus(items, status) {
  if (!status) return items;
  const needle = status.trim().toLowerCase();
  return items.filter((x) => String(x.status || '').toLowerCase() === needle);
}

function porStatus(items) {
  const out = {};
  for (const x of items) {
    const k = x.status || 'desconhecido';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function sumField(items, field = 'valor') {
  return Math.round(items.reduce((s, x) => s + (Number(x[field]) || 0), 0) * 100) / 100;
}

async function listPaginated(page, q, extraQuery, parse) {
  const range = dateRange(q);
  const query = {
    ...range,
    ...extraQuery,
    status: q.status_portal || undefined,
    id_vendedor: q.id_vendedor || undefined,
  };
  const currentPage = q.current_page ? Number(q.current_page) : undefined;
  const result = await fetchPageHtmlPaginated(page, query, {
    forceLogin: forceLogin(q),
    all: wantAll(q),
    currentPage,
    maxItems: currentPage ? 0 : EXTRACT_LIMIT,
    parse,
  });
  const items = Array.isArray(result.items)
    ? result.items
    : parse(result.html);
  return {
    range,
    pagesFetched: result.pages?.length || 1,
    items,
  };
}

async function fetchPedidoItens(pedidoId, opts = {}) {
  const { body } = await fetchAjax(
    '/franqueado/ajax/pedidos/produtos.php',
    { id_pedido: pedidoId },
    { forceLogin: opts.forceLogin, method: 'POST' },
  );
  return parsePedidoItensHtml(body);
}

async function fetchPedidoDetalhe(id, opts = {}) {
  const pedidoId = await assertCampinasPedido(id);
  const wantItens = opts.itens !== false;
  if (!opts.skipCache) {
    const cached = getContatoCached(pedidoId);
    if (cached && (!wantItens || Array.isArray(cached.itens))) {
      return { ...cached, _cache: true };
    }
  }
  const { html } = await fetchPageHtml(
    'pedidos_edicao',
    { id_pedido: pedidoId, action: 'visualizar' },
    { forceLogin: opts.forceLogin },
  );
  const detalhe = parsePedidoDetalheHtml(html, pedidoId);
  if (wantItens) {
    detalhe.itens = await fetchPedidoItens(pedidoId, opts);
    detalhe.itensTotal = detalhe.itens.length;
  }
  setContatoCached(pedidoId, detalhe);
  return { ...detalhe, _cache: false };
}

async function enrichPedidosComItens(items, opts = {}) {
  const capped = capExtract(items);
  let fetched = 0;
  let cacheHits = 0;
  const out = [];
  for (const p of capped) {
    try {
      const d = await fetchPedidoDetalhe(p.id, { ...opts, itens: true });
      if (d._cache) cacheHits += 1;
      else fetched += 1;
      out.push({
        ...p,
        email: d.email ?? null,
        telefone: d.telefone ?? null,
        whatsapp: d.whatsapp ?? null,
        itens: d.itens || [],
        itensTotal: d.itensTotal || 0,
      });
    } catch (err) {
      out.push({
        ...p,
        itens: [],
        itensTotal: 0,
        itensErro: String(err?.message || err),
      });
    }
  }
  return {
    items: out,
    itensMeta: { pedidosComItens: out.length, fetched, cacheHits },
  };
}

async function enrichFaturasComContato(items, opts = {}) {
  const capped = capExtract(items);
  const ids = [
    ...new Set(
      capped.map((f) => f.pedido).filter((n) => Number.isFinite(Number(n))),
    ),
  ].slice(0, EXTRACT_LIMIT);
  const byPedido = new Map();
  let fetched = 0;
  let cacheHits = 0;
  for (const id of ids) {
    try {
      const d = await fetchPedidoDetalhe(id, opts);
      if (d._cache) cacheHits += 1;
      else fetched += 1;
      byPedido.set(Number(id), d);
    } catch (err) {
      byPedido.set(Number(id), { error: String(err?.message || err) });
    }
  }
  const enriched = capped.map((f) => {
    const d = f.pedido ? byPedido.get(Number(f.pedido)) : null;
    if (!d || d.error) {
      return {
        ...f,
        email: null,
        telefone: null,
        whatsapp: null,
        contatoErro: d?.error || (f.pedido ? null : 'sem pedido'),
      };
    }
    return {
      ...f,
      email: d.email ?? null,
      telefone: d.telefone ?? null,
      whatsapp: d.whatsapp ?? null,
    };
  });
  return {
    items: enriched,
    contatos: { pedidosUnicos: ids.length, fetched, cacheHits },
  };
}

const server = createServer(async (req, res) => {
  try {
    const path = (req.url || '/').split('?')[0];
    const q = stripClientFranquia(parseQuery(req.url || ''));

    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'method not allowed' });
    }

    const auth = authorize(req, path);
    if (!auth.ok) {
      return sendJson(res, auth.status, { error: auth.error });
    }

    if (req.method === 'GET' && path === '/health') {
      return sendJson(res, 200, { ok: true, service: SERVICE });
    }

    if (req.method === 'GET' && path === '/db/health') {
      return sendJson(res, 200, await dbHealth());
    }

    if (req.method === 'GET' && path === '/db/orcamentos') {
      return sendJson(res, 200, await dbOrcamentos(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/db/pedidos') {
      return sendJson(res, 200, await dbPedidos(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/db/notas-fiscais') {
      return sendJson(res, 200, await dbNotasFiscais(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/db/faturas') {
      return sendJson(res, 200, await dbFaturas(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/db/atrasados') {
      return sendJson(res, 200, await dbAtrasados(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/db/vendedores') {
      return sendJson(res, 200, await dbVendedores(q));
    }

    if (req.method === 'GET' && path === '/db/clientes') {
      return sendJson(res, 200, await dbClientes(q));
    }

    if (req.method === 'GET' && path === '/db/pedido-itens') {
      return sendJson(res, 200, await dbPedidoItens(q));
    }

    if (req.method === 'GET' && path === '/db/faturamento-linhas') {
      return sendJson(res, 200, await dbFaturamentoLinhas(q, dateRange(q)));
    }

    if (req.method === 'GET' && path === '/docs') {
      const html = await readFile(join(ROOT, 'docs.html'), 'utf8');
      return sendRaw(res, 200, 'text/html; charset=utf-8', html);
    }

    if (req.method === 'GET' && (path === '/dashboard' || path === '/financeiro')) {
      const html = await readFile(join(ROOT, 'dashboard.html'), 'utf8');
      return sendRaw(res, 200, 'text/html; charset=utf-8', html);
    }

    if (req.method === 'GET' && path === '/openapi.json') {
      const raw = await readFile(join(ROOT, 'openapi.json'), 'utf8');
      return sendRaw(res, 200, 'application/json; charset=utf-8', raw);
    }

    if (req.method === 'GET' && path === '/openapi.yaml') {
      const raw = await readFile(join(ROOT, 'openapi.yaml'), 'utf8');
      return sendRaw(res, 200, 'text/yaml; charset=utf-8', raw);
    }

    if (req.method === 'GET' && (path === '/' || path === '/catalog')) {
      return sendJson(res, 200, {
        ok: true,
        service: SERVICE,
        implementados: IMPLEMENTED,
        docs: '/docs',
        dashboard: '/dashboard',
        openapi: '/openapi.json',
        auth: 'Authorization: Bearer <API_KEY> ou X-API-Key',
        ...CATALOG,
      });
    }

    if (req.method === 'GET' && path === '/faturas') {
      const range = dateRange(q);
      const { html } = await fetchPageHtml(
        'contasareceber',
        { ...range, status: q.status_portal || undefined },
        { forceLogin: forceLogin(q) },
      );
      let items = capExtract(filterStatus(parseFaturasHtml(html), q.status));
      let contatos = undefined;
      if (q.contato === '1' || q.contato === 'true') {
        const enriched = await enrichFaturasComContato(items, {
          forceLogin: forceLogin(q),
        });
        items = enriched.items;
        contatos = enriched.contatos;
      }
      return sendJson(res, 200, {
        fonte: 'portal franqueado · contasareceber',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        total: items.length,
        totalValor: sumField(items, 'valor'),
        porStatus: porStatus(items),
        ...(contatos ? { contatos } : {}),
        faturas: items,
      });
    }

    const pedidoDetalheMatch = path.match(/^\/pedidos\/(\d+)$/);
    if (req.method === 'GET' && pedidoDetalheMatch) {
      const detalhe = await fetchPedidoDetalhe(pedidoDetalheMatch[1], {
        forceLogin: forceLogin(q),
        skipCache: q.refresh === '1' || q.refresh === 'true',
      });
      const { _cache, ...pedido } = detalhe;
      return sendJson(res, 200, {
        fonte: 'portal franqueado · pedidos_edicao',
        cache: Boolean(_cache),
        pedido,
      });
    }

    if (req.method === 'GET' && path === '/orcamentos') {
      const { range, pagesFetched, items: raw } = await listPaginated(
        'orcamentos',
        q,
        {},
        parseOrcamentosHtml,
      );
      const items = capExtract(filterStatus(raw, q.status));
      return sendJson(res, 200, {
        fonte: 'portal franqueado · orcamentos',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        pagesFetched,
        total: items.length,
        totalValor: sumField(items, 'total'),
        porStatus: porStatus(items),
        orcamentos: items,
      });
    }

    if (req.method === 'GET' && path === '/pedidos') {
      const { range, pagesFetched, items: raw } = await listPaginated(
        'pedidos',
        q,
        {},
        parsePedidosHtml,
      );
      let items = capExtract(filterStatus(raw, q.status));
      let itensMeta = undefined;
      if (q.itens === '1' || q.itens === 'true') {
        const enriched = await enrichPedidosComItens(items, {
          forceLogin: forceLogin(q),
        });
        items = enriched.items;
        itensMeta = enriched.itensMeta;
      }
      return sendJson(res, 200, {
        fonte: 'portal franqueado · pedidos',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        pagesFetched,
        total: items.length,
        totalValor: sumField(items, 'total'),
        porStatus: porStatus(items),
        ...(itensMeta ? { itensMeta } : {}),
        pedidos: items,
      });
    }

    if (req.method === 'GET' && path === '/notas-fiscais') {
      const { range, pagesFetched, items: raw } = await listPaginated(
        'notas_fiscais',
        q,
        {
          tipo: q.tipo || undefined,
          uf: q.uf || undefined,
        },
        parseNotasFiscaisHtml,
      );
      const items = capExtract(filterStatus(raw, q.status));
      return sendJson(res, 200, {
        fonte: 'portal franqueado · notas_fiscais',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        pagesFetched,
        total: items.length,
        totalValor: sumField(items, 'total'),
        porStatus: porStatus(items),
        notasFiscais: items,
      });
    }

    if (req.method === 'GET' && path === '/faturamento') {
      const range = dateRange(q);
      const page = await fetchPageHtml(
        'faturamento',
        { ...range, id_vendedor: q.id_vendedor || undefined },
        { forceLogin: forceLogin(q) },
      );
      const porVendedorHtml = parseFaturamentoHtml(page.html);
      const excel = await fetchAjax(
        '/franqueado/ajax/faturamento/relatorio_excel.php',
        forcePortalFranquia({
          page: 'faturamento',
          data_inicial: range.data_inicial,
          data_final: range.data_final,
          id_vendedor: q.id_vendedor || undefined,
        }),
      );
      const parsed = parseFaturamentoExcel(excel.body);
      const porVendedor = capExtract(
        parsed.porVendedor.length ? parsed.porVendedor : porVendedorHtml,
      );
      const detalhe = capExtract(parsed.detalhe);
      return sendJson(res, 200, {
        fonte: 'portal franqueado · faturamento',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        totalVendedores: porVendedor.length,
        totalDetalhe: detalhe.length,
        totalValor: sumField(detalhe, 'total'),
        porVendedor,
        detalhe,
      });
    }

    if (req.method === 'GET' && path === '/fluxo-previsto') {
      const data = q.data || q.mes || undefined;
      const { html } = await fetchPageHtml(
        'fluxo_previsto',
        data ? { data } : {},
        { forceLogin: forceLogin(q) },
      );
      const fluxo = parseFluxoPrevistoHtml(html);
      return sendJson(res, 200, {
        fonte: 'portal franqueado · fluxo_previsto',
        ...fluxo,
      });
    }

    if (req.method === 'GET' && path === '/chamados') {
      const range = dateRange(q);
      const { html } = await fetchPageHtml(
        'chamados',
        {
          ...range,
          status: q.status_portal || q.status || undefined,
        },
        { forceLogin: forceLogin(q) },
      );
      const items = capExtract(parseChamadosHtml(html));
      return sendJson(res, 200, {
        fonte: 'portal franqueado · chamados',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        total: items.length,
        porStatus: porStatus(items),
        chamados: items,
      });
    }

    if (req.method === 'GET' && path === '/notificacoes') {
      const range = dateRange(q);
      const { html } = await fetchPageHtml(
        'notificacoes',
        range,
        { forceLogin: forceLogin(q) },
      );
      const items = capExtract(parseNotificacoesHtml(html));
      return sendJson(res, 200, {
        fonte: 'portal franqueado · notificacoes',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        total: items.length,
        notificacoes: items,
      });
    }

    sendJson(res, 404, { error: 'not found', routes: IMPLEMENTED });
  } catch (err) {
    console.error(err);
    const status = Number(err?.status) || 500;
    if (status === 400 || status === 403) {
      return sendJson(res, status, { error: String(err.message || err) });
    }
    sendJson(res, 500, { error: 'internal error' });
  }
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, HOST, () => {
  console.log(`${SERVICE} http://${HOST}:${PORT}`);
  console.log(
    `franquia=${LOCKED_FRANQUIA_ID} (${LOCKED_FRANQUIA_NOME}) extractLimit=${EXTRACT_LIMIT}`,
  );
  console.log(IMPLEMENTED.join('  '));
});
