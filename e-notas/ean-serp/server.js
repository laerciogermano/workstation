import 'dotenv/config';
import express from 'express';
import { resolveEanByDescricao } from './src/resolve.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

const PORT = Number(process.env.PORT) || 4180;

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ean-serp', port: PORT });
});

async function handleResolve(req, res) {
  const body = req.method === 'POST' ? req.body || {} : {};
  const descricao =
    body.descricao || req.query.descricao || body.q || req.query.q || '';
  const limit = body.limit ?? req.query.limit;
  const enrichRaw = body.enrich ?? req.query.enrich;
  const enrich =
    enrichRaw === undefined || enrichRaw === ''
      ? true
      : !['0', 'false', 'no'].includes(String(enrichRaw).toLowerCase());
  const googleCdp =
    body.google_cdp === true ||
    ['1', 'true', 'yes'].includes(String(req.query.google_cdp || '').toLowerCase());

  try {
    const result = await resolveEanByDescricao(descricao, {
      limit: limit ? Number(limit) : undefined,
      enrich,
      googleCdp,
    });
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: err.message || String(err) });
  }
}

app.get('/ean', handleResolve);
app.post('/ean', handleResolve);
app.get('/api/ean', handleResolve);
app.post('/api/ean', handleResolve);

app.listen(PORT, () => {
  console.log(`[ean-serp] http://127.0.0.1:${PORT}/ean?descricao=PAO%20DE%20FORMA%20VISCONTI%20400G`);
});
