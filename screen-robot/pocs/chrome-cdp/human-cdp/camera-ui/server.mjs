#!/usr/bin/env node
/**
 * UI local: selecionar CDP + vídeo + nome da webcam (setCamera).
 *
 *   npm run camera-ui
 *   # → http://127.0.0.1:18770/
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listCdps,
  getCamera,
  setCamera,
  clearCamera,
} from '../src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.HUMAN_CDP_CAMERA_UI_PORT || 18770);
const HTML = readFileSync(join(__dirname, 'index.html'));

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(raw);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/cdps') {
      const cdps = listCdps().map((c) => {
        const cam = c.fingerprint
          ? {
              label: c.fingerprint.cameraLabel || null,
              video: c.fingerprint.cameraVideo || null,
            }
          : { label: null, video: null };
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          port: c.port ?? c.preferredPort,
          label: cam.label,
          video: cam.video,
        };
      });
      json(res, 200, { cdps });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/camera') {
      const id = url.searchParams.get('id');
      if (!id) return json(res, 400, { error: 'id obrigatório' });
      json(res, 200, getCamera(id));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/camera') {
      const body = await readBody(req);
      if (!body.id || !body.video) {
        return json(res, 400, { error: 'id e video obrigatórios' });
      }
      const out = await setCamera(body.id, {
        video: body.video,
        label: body.label,
        apply: body.apply !== false,
      });
      json(res, 200, out);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/camera/clear') {
      const body = await readBody(req);
      if (!body.id) return json(res, 400, { error: 'id obrigatório' });
      const out = await clearCamera(body.id, { apply: body.apply !== false });
      json(res, 200, out);
      return;
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 500, { error: String(e && e.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`human-cdp camera-ui → http://127.0.0.1:${PORT}/`);
});
