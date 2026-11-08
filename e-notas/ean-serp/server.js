import 'dotenv/config';
import express from 'express';
import {
  resolveEanByDescricao,
  resolveEanGoogleCdp,
  resolveEanSi5,
} from './src/resolve.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

const PORT = Number(process.env.PORT) || 4180;

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ean-serp', port: PORT });
});

function parseCommon(req) {
  const body = req.method === 'POST' ? req.body || {} : {};
  const descricao =
    body.descricao || req.query.descricao || body.q || req.query.q || '';
  const limit = body.limit ?? body.n ?? req.query.limit ?? req.query.n;
  const enrichRaw = body.enrich ?? req.query.enrich;
  const enrich =
    enrichRaw === undefined || enrichRaw === ''
      ? true
      : !['0', 'false', 'no'].includes(String(enrichRaw).toLowerCase());
  return { descricao, limit, enrich, body };
}

async function handleSi5(req, res) {
  const { descricao, limit, enrich } = parseCommon(req);
  try {
    const result = await resolveEanSi5(descricao, {
      limit: limit ? Number(limit) : undefined,
      enrich,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message || String(err) });
  }
}

async function handleGoogleCdp(req, res) {
  const { descricao, limit, enrich } = parseCommon(req);
  try {
    const result = await resolveEanGoogleCdp(descricao, {
      limit: limit ? Number(limit) : undefined,
      enrich,
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message || String(err) });
  }
}

async function handleResolve(req, res) {
  const { descricao, limit, enrich, body } = parseCommon(req);
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
    res.status(err.status || 500).json({ ok: false, error: err.message || String(err) });
  }
}

app.get('/ean/si5', handleSi5);
app.post('/ean/si5', handleSi5);
app.get('/api/ean/si5', handleSi5);
app.post('/api/ean/si5', handleSi5);

app.get('/ean/google-cdp', handleGoogleCdp);
app.post('/ean/google-cdp', handleGoogleCdp);
app.get('/api/ean/google-cdp', handleGoogleCdp);
app.post('/api/ean/google-cdp', handleGoogleCdp);

app.get('/ean', handleResolve);
app.post('/ean', handleResolve);
app.get('/api/ean', handleResolve);
app.post('/api/ean', handleResolve);

app.listen(PORT, () => {
  console.log(`[ean-serp] SI5  http://127.0.0.1:${PORT}/ean/si5?descricao=…`);
  console.log(`[ean-serp] Google CDP http://127.0.0.1:${PORT}/ean/google-cdp?descricao=…`);
});
