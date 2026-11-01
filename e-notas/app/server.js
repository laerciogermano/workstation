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
import { cadastrarNotaCompleta, dbInfo, initDb } from './db.js';

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

ensureCerts();

await initDb();

const server = https.createServer(
  {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  },
  app,
);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`e-notas HTTPS em https://0.0.0.0:${PORT}`);
  console.log(`  db: ${dbInfo()}`);
  console.log(`  local: https://localhost:${PORT}`);
  for (const ip of lanIPs()) {
    console.log(`  rede: https://${ip}:${PORT}`);
  }
  console.log('Aceite o aviso do certificado autoassinado no browser (necessário p/ câmera).');
});
