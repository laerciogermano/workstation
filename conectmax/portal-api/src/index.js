import { createServer } from 'node:http';
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

const PORT = Number(process.env.PORT || 4175);
const HOST = process.env.HOST || '127.0.0.1';

const IMPLEMENTED = [
  'GET /',
  'GET /catalog',
  'GET /health',
  'GET /faturas',
  'GET /orcamentos',
  'GET /pedidos',
  'GET /notas-fiscais',
  'GET /faturamento',
  'GET /fluxo-previsto',
  'GET /chamados',
  'GET /notificacoes',
];

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body, null, 2));
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

function wantAll(q) {
  if (q.all === '0' || q.all === 'false') return false;
  if (q.current_page) return false;
  return q.all !== '0';
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
  const { html, pages } = await fetchPageHtmlPaginated(page, query, {
    forceLogin: forceLogin(q),
    all: wantAll(q),
    currentPage,
  });
  return {
    range,
    pagesFetched: pages?.length || 1,
    items: parse(html),
  };
}

const server = createServer(async (req, res) => {
  try {
    const path = (req.url || '/').split('?')[0];
    const q = parseQuery(req.url || '');

    if (req.method === 'GET' && path === '/health') {
      return sendJson(res, 200, { ok: true, service: 'conectmax-portal-api' });
    }

    if (req.method === 'GET' && (path === '/' || path === '/catalog')) {
      return sendJson(res, 200, {
        ok: true,
        service: 'conectmax-portal-api',
        implementados: IMPLEMENTED,
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
      let items = filterStatus(parseFaturasHtml(html), q.status);
      return sendJson(res, 200, {
        fonte: 'portal franqueado · contasareceber',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        total: items.length,
        totalValor: sumField(items, 'valor'),
        porStatus: porStatus(items),
        faturas: items,
      });
    }

    if (req.method === 'GET' && path === '/orcamentos') {
      const { range, pagesFetched, items: raw } = await listPaginated(
        'orcamentos',
        q,
        {},
        parseOrcamentosHtml,
      );
      const items = filterStatus(raw, q.status);
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
      const items = filterStatus(raw, q.status);
      return sendJson(res, 200, {
        fonte: 'portal franqueado · pedidos',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        pagesFetched,
        total: items.length,
        totalValor: sumField(items, 'total'),
        porStatus: porStatus(items),
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
      const items = filterStatus(raw, q.status);
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
        {
          ...range,
          id_vendedor: q.id_vendedor || undefined,
        },
        { forceLogin: forceLogin(q) },
      );
      const porVendedorHtml = parseFaturamentoHtml(page.html);
      const idFranqueado =
        page.html.match(/id_franqueado=(\d+)/)?.[1] ||
        page.html.match(/name=["']id_franqueado[^"']*["'][^>]*value=["'](\d+)["']/i)?.[1] ||
        '9';
      const excel = await fetchAjax(
        '/franqueado/ajax/faturamento/relatorio_excel.php',
        {
          id_franqueado: idFranqueado,
          page: 'faturamento',
          data_inicial: range.data_inicial,
          data_final: range.data_final,
          id_vendedor: q.id_vendedor || undefined,
        },
      );
      const parsed = parseFaturamentoExcel(excel.body);
      return sendJson(res, 200, {
        fonte: 'portal franqueado · faturamento',
        dataInicial: range.data_inicial,
        dataFinal: range.data_final,
        totalVendedores: (parsed.porVendedor.length || porVendedorHtml.length),
        totalDetalhe: parsed.detalhe.length,
        totalValor: sumField(parsed.detalhe, 'total'),
        porVendedor: parsed.porVendedor.length ? parsed.porVendedor : porVendedorHtml,
        detalhe: parsed.detalhe,
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
        { ...range, status: q.status_portal || q.status || undefined },
        { forceLogin: forceLogin(q) },
      );
      const items = parseChamadosHtml(html);
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
      const items = parseNotificacoesHtml(html);
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
    sendJson(res, 500, { error: String(err?.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`conectmax-portal-api http://${HOST}:${PORT}`);
  console.log(IMPLEMENTED.join('  '));
});
