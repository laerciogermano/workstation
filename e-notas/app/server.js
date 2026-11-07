import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  assertFazendaPrNfceUrl,
  fetchDanfe,
  parseDanfeHtml,
} from './fazenda-pr.js';
import {
  buscarImagensEan,
  cadastrarNotaCompleta,
  confirmarEanSugestao,
  dbInfo,
  enqueueBuscarImagensEan,
  geocodeEmpresasPendentes,
  initDb,
  listCodigosBarras,
  listEanImagens,
  listEmpresas,
  listItens,
  listNotas,
  selecionarEanImagem,
  upsertCodigoBarras,
} from './db.js';
import {
  imagensPorDescricao,
  normalizeDescricao,
  resolveEanFromDescricao,
} from './enrichment.js';
import { baixarGoogleImagens } from './google-imagens.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const CERT_DIR = path.join(__dirname, 'certs');
const KEY_PATH = path.join(CERT_DIR, 'key.pem');
const CERT_PATH = path.join(CERT_DIR, 'cert.pem');

function lanIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

function ensureCerts() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return;
  }

  const ips = ['127.0.0.1', ...lanIPs()];
  const san = ['DNS:localhost', ...ips.map((ip) => `IP:${ip}`)].join(',');
  const confPath = path.join(CERT_DIR, 'openssl.cnf');
  fs.writeFileSync(
    confPath,
    `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = e-notas.local

[v3_req]
subjectAltName = ${san}
`,
  );

  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      KEY_PATH,
      '-out',
      CERT_PATH,
      '-days',
      '825',
      '-config',
      confPath,
    ],
    { stdio: 'inherit' },
  );
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/empresas', async (_req, res) => {
  try {
    const empresas = await listEmpresas();
    return res.json({ ok: true, empresas });
  } catch (err) {
    console.error('[empresas:erro]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

let geocodeRunning = false;
app.post('/api/empresas/geocode', async (_req, res) => {
  try {
    if (!geocodeRunning) {
      geocodeRunning = true;
      geocodeEmpresasPendentes()
        .catch((err) => console.error('[empresas:geocode]', err.message))
        .finally(() => {
          geocodeRunning = false;
        });
    }
    const empresas = await listEmpresas();
    return res.json({ ok: true, started: true, empresas });
  } catch (err) {
    console.error('[empresas:geocode]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/notas', async (_req, res) => {
  try {
    const notas = await listNotas();
    return res.json({ ok: true, notas });
  } catch (err) {
    console.error('[notas:erro]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/itens', async (_req, res) => {
  try {
    const itens = await listItens();
    return res.json({ ok: true, itens });
  } catch (err) {
    console.error('[itens:erro]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/codigos-barras', async (_req, res) => {
  try {
    const codigosBarras = await listCodigosBarras();
    return res.json({ ok: true, codigosBarras });
  } catch (err) {
    console.error('[codigos-barras:erro]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/codigos-barras', async (req, res) => {
  try {
    const origem = String(req.body?.origem || '').trim() || 'manual';
    const row = await upsertCodigoBarras({
      empresaId: req.body?.empresa_id,
      codigoUnidade: req.body?.codigo_unidade,
      codigoBarras: req.body?.codigo_barras,
      fotoUrl: req.body?.foto_url,
      origem,
    });
    enqueueBuscarImagensEan(row.codigo_barras);
    const descSugestao = String(req.body?.descricao || '').trim();
    if (descSugestao && origem === 'sugestao') {
      confirmarEanSugestao(normalizeDescricao(descSugestao), row.codigo_barras).catch(
        (err) => console.warn('[ean-sugestao:confirm]', err.message),
      );
    }
    console.log(
      `[codigo-barras] empresa=${row.empresa_id} unidade=${row.codigo_unidade} ean=${row.codigo_barras} origem=${row.origem || origem} foto=${row.foto_url || '-'}`,
    );
    return res.json({ ok: true, codigoBarras: row, imagensPendentes: true });
  } catch (err) {
    const status = err.status || 500;
    console.error('[codigos-barras:erro]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
});

function enrichmentInput(req, key) {
  const q = req.query?.[key];
  const b = req.body?.[key];
  return String(q ?? b ?? '').trim();
}

function enrichmentForce(req) {
  const raw = req.query?.force ?? req.body?.force;
  return raw === true || raw === '1' || raw === 'true';
}

/** REQ-039 — descrição → candidatos EAN (GET query ou POST body; sem auto-vínculo). */
async function handleEnrichmentEan(req, res) {
  try {
    const descricao = enrichmentInput(req, 'descricao');
    const result = await resolveEanFromDescricao(descricao);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    console.error('[enrichment:ean]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
}

/** REQ-040 — EAN → imagens (wrapper estável sobre buscarImagensEan). */
async function handleEnrichmentImagens(req, res) {
  try {
    const ean =
      enrichmentInput(req, 'ean') || enrichmentInput(req, 'codigo_barras');
    const force = enrichmentForce(req);
    if (!ean) {
      return res.status(400).json({ ok: false, error: 'ean obrigatório' });
    }
    const result = await buscarImagensEan(ean, { force });
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    console.error('[enrichment:imagens]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
}

/** REQ-041 — descrição → imagens (orquestra EAN confiável ou busca textual). */
async function handleEnrichmentImagensPorDescricao(req, res) {
  try {
    const descricao = enrichmentInput(req, 'descricao');
    const force = enrichmentForce(req);
    if (!descricao) {
      return res.status(400).json({ ok: false, error: 'descricao obrigatória' });
    }
    const result = await imagensPorDescricao(descricao, { force });
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    console.error('[enrichment:imagens-por-descricao]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
}

/** REQ-042 — Google Imagens: descrição|ean + n (baixa as N primeiras). */
async function handleGoogleImagens(req, res) {
  try {
    const descricao = enrichmentInput(req, 'descricao');
    const ean =
      enrichmentInput(req, 'ean') || enrichmentInput(req, 'codigo_barras');
    const nRaw = enrichmentInput(req, 'n') || req.body?.n || 10;
    const dl = req.query?.download ?? req.body?.download;
    const download = !(dl === '0' || dl === 'false' || dl === false);
    if (!descricao && !ean) {
      return res.status(400).json({
        ok: false,
        error: 'informe descricao ou ean (+ n opcional, máx 100)',
      });
    }
    const result = await baixarGoogleImagens({
      descricao: ean ? undefined : descricao,
      ean: ean || undefined,
      n: nRaw,
      download,
    });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    console.error('[enrichment:google-imagens]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
}

app.get('/api/enrichment/ean', handleEnrichmentEan);
app.post('/api/enrichment/ean', handleEnrichmentEan);
app.get('/api/enrichment/imagens', handleEnrichmentImagens);
app.post('/api/enrichment/imagens', handleEnrichmentImagens);
app.get('/api/enrichment/imagens-por-descricao', handleEnrichmentImagensPorDescricao);
app.post('/api/enrichment/imagens-por-descricao', handleEnrichmentImagensPorDescricao);
app.get('/api/enrichment/google-imagens', handleGoogleImagens);
app.post('/api/enrichment/google-imagens', handleGoogleImagens);

app.get('/api/ean-imagens', async (req, res) => {
  try {
    const ean = String(req.query?.codigo_barras || '').trim();
    if (!ean) {
      return res.status(400).json({ ok: false, error: 'codigo_barras obrigatório' });
    }
    const imagens = await listEanImagens(ean);
    return res.json({ ok: true, codigo_barras: ean, imagens });
  } catch (err) {
    console.error('[ean-imagens:erro]', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/ean-imagens/buscar', async (req, res) => {
  try {
    const ean = String(req.body?.codigo_barras || '').trim();
    const force = Boolean(req.body?.force);
    if (!ean) {
      return res.status(400).json({ ok: false, error: 'codigo_barras obrigatório' });
    }
    const result = await buscarImagensEan(ean, { force });
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    console.error('[ean-imagens:buscar]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
});

app.post('/api/ean-imagens/:id/selecionar', async (req, res) => {
  try {
    const row = await selecionarEanImagem(req.params.id);
    return res.json({ ok: true, imagem: row });
  } catch (err) {
    const status = err.status || 500;
    console.error('[ean-imagens:selecionar]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
});

app.post('/api/nota', async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!url) {
    return res.status(400).json({ ok: false, error: 'url obrigatória' });
  }

  try {
    const nfceUrl = assertFazendaPrNfceUrl(url);
    console.log('[nota]', nfceUrl);

    const html = await fetchDanfe(nfceUrl);
    const parsed = parseDanfeHtml(html);
    const saved = await cadastrarNotaCompleta({
      url: nfceUrl,
      empresa: parsed.empresa,
      nota: parsed.nota,
      itens: parsed.itens,
    });

    console.log(
      `[cadastro] empresa=${saved.empresa.id}${saved.empresaCriada ? ' (nova)' : ''} nota=${saved.nota.id}${saved.created ? ' (nova)' : ' (já existia)'} itens=${saved.itens.length}`,
    );
    for (const item of saved.itens) {
      console.log(
        `  - #${item.id} ${item.codigo || '-'} | ${item.nome} | qtd ${item.quantidade} ${item.unidade} | unit ${item.valor_unitario} | total ${item.valor_total}`,
      );
    }

    return res.json({
      ok: true,
      created: saved.created,
      empresaCriada: Boolean(saved.empresaCriada),
      url: nfceUrl,
      empresa: saved.empresa,
      nota: saved.nota,
      itens: saved.itens,
    });
  } catch (err) {
    const status = err.status || 500;
    console.error('[nota:erro]', err.message);
    return res.status(status).json({ ok: false, error: err.message });
  }
});

await initDb();

geocodeEmpresasPendentes().catch((err) =>
  console.warn('[geo:boot]', err.message),
);

const useHttp = /^(1|true|yes)$/i.test(String(process.env.USE_HTTP || ''));
const host = process.env.HOST || (useHttp ? '127.0.0.1' : '0.0.0.0');

function onListen() {
  const scheme = useHttp ? 'http' : 'https';
  console.log(`e-notas ${scheme.toUpperCase()} em ${scheme}://${host}:${PORT}`);
  console.log(`  db: ${dbInfo()}`);
  if (!useHttp) {
    console.log(`  local: https://localhost:${PORT}`);
    for (const ip of lanIPs()) {
      console.log(`  rede: https://${ip}:${PORT}`);
    }
    console.log(
      'Aceite o aviso do certificado autoassinado no browser (necessário p/ câmera).',
    );
  }
}

if (useHttp) {
  const { createServer } = await import('http');
  createServer(app).listen(PORT, host, onListen);
} else {
  ensureCerts();
  https
    .createServer(
      {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
      },
      app,
    )
    .listen(PORT, host, onListen);
}
