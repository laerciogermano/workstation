import { createServer } from 'node:http';
import { CATALOG } from './catalog.js';
import { fetchContasAReceber } from './portal.js';

const PORT = Number(process.env.PORT || 4175);
const HOST = process.env.HOST || '127.0.0.1';

function sendJson(res, status, body) {
  const raw = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(raw);
}

function parseQuery(url) {
  const u = new URL(url, 'http://local');
  return Object.fromEntries(u.searchParams.entries());
}

const IMPLEMENTED = ['GET /', 'GET /health', 'GET /catalog', 'GET /faturas'];

const server = createServer(async (req, res) => {
  try {
    const path = (req.url || '/').split('?')[0];
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
      const q = parseQuery(req.url || '');
      const dataInicial = q.data_inicial || q.from || '01/01/2025';
      const dataFinal = q.data_final || q.to || '31/12/2026';
      const statusFilter = (q.status || '').trim();
      const forceLogin = q.refresh === '1' || q.refresh === 'true';

      const { faturas, dataInicial: di, dataFinal: df } = await fetchContasAReceber({
        dataInicial,
        dataFinal,
        forceLogin,
      });

      let items = faturas;
      if (statusFilter) {
        const needle = statusFilter.toLowerCase();
        items = items.filter((f) => String(f.status || '').toLowerCase() === needle);
      }

      const totalValor = items.reduce((s, f) => s + (Number(f.valor) || 0), 0);
      const byStatus = {};
      for (const f of items) {
        const k = f.status || 'desconhecido';
        byStatus[k] = (byStatus[k] || 0) + 1;
      }

      return sendJson(res, 200, {
        fonte: 'portal franqueado · contasareceber',
        dataInicial: di,
        dataFinal: df,
        total: items.length,
        totalValor: Math.round(totalValor * 100) / 100,
        porStatus: byStatus,
        faturas: items,
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
  console.log('GET /  GET /catalog  GET /faturas  GET /health');
});
