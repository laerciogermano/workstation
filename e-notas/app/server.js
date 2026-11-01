import express from 'express';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/nota', (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!url) {
    return res.status(400).json({ ok: false, error: 'url obrigatória' });
  }
  console.log('[nota]', url);
  return res.json({ ok: true });
});

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`e-notas ouvindo em http://0.0.0.0:${PORT}`);
  for (const ip of lanIPs()) {
    console.log(`  rede: http://${ip}:${PORT}`);
  }
});
