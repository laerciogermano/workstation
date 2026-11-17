#!/usr/bin/env node
/**
 * Gestão de CDPs (UI local): lista + status + criar/editar/remover + start/stop + câmera.
 *
 *   npm run camera-ui
 *   # → http://127.0.0.1:18770/
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listCdps,
  getCdp,
  createCdp,
  updateCdp,
  removeCdp,
  startCdp,
  stopCdp,
  getCamera,
  setCamera,
  clearCamera,
} from '../src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.HUMAN_CDP_CAMERA_UI_PORT || 18770);
const HTML = readFileSync(join(__dirname, 'index.html'), 'utf8');
const WORKS = resolve(__dirname, '../../../../..');

/** Vídeo padrão do lab (primeiro que existir). */
function defaultVideoPath() {
  const env = String(process.env.HUMAN_CDP_DEFAULT_VIDEO || '').trim();
  if (env && existsSync(env)) return resolve(env);
  const candidates = [
    join(WORKS, 'omtv/pocs/fake-webcam-cdp/media/testsrc.y4m'),
    join(WORKS, 'screen-robot/pocs/chrome-cdp/media/sample.y4m'),
    join(WORKS, 'screen-robot/pocs/android-studio/media/loop-preview.mp4'),
    join(WORKS, 'screen-robot/pocs/android-studio/media/sample.mp4'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

const DEFAULT_VIDEO = defaultVideoPath();
const DEFAULT_LABEL = 'FaceTime HD Camera';

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(raw);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function serializeCdp(c) {
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
    port: c.port ?? null,
    preferredPort: c.preferredPort ?? null,
    displayPort: c.port ?? c.preferredPort ?? null,
    cdpUrl: c.cdpUrl,
    defaultUrl: c.defaultUrl || '',
    obs: c.obs || '',
    hasMeta: !!c.hasMeta,
    label: cam.label,
    video: cam.video,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function defaultsPayload() {
  return {
    video: DEFAULT_VIDEO,
    label: DEFAULT_LABEL,
    videoExists: existsSync(DEFAULT_VIDEO),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  try {
    if (req.method === 'GET' && path === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
      return;
    }
    if (req.method === 'GET' && path === '/api/defaults') {
      json(res, 200, defaultsPayload());
      return;
    }
    if (req.method === 'GET' && path === '/api/cdps') {
      json(res, 200, {
        cdps: listCdps().map(serializeCdp),
        defaults: defaultsPayload(),
      });
      return;
    }
    if (req.method === 'POST' && path === '/api/cdps') {
      const body = await readBody(req);
      const row = createCdp({
        id: body.id,
        name: body.name,
        port: body.port,
        defaultUrl: body.defaultUrl,
        obs: body.obs,
        fingerprint: body.fingerprint,
      });
      json(res, 201, serializeCdp(row));
      return;
    }

    const cdpMatch = path.match(/^\/api\/cdps\/([^/]+)(?:\/(start|stop))?$/);
    if (cdpMatch) {
      const id = decodeURIComponent(cdpMatch[1]);
      const action = cdpMatch[2] || null;

      if (req.method === 'GET' && !action) {
        const row = getCdp(id);
        if (!row) return json(res, 404, { error: `cdp não encontrado: ${id}` });
        json(res, 200, serializeCdp(row));
        return;
      }
      if (req.method === 'PATCH' && !action) {
        const body = await readBody(req);
        const patch = {};
        for (const key of ['name', 'port', 'defaultUrl', 'obs', 'fingerprint', 'debug']) {
          if (key in body) patch[key] = body[key];
        }
        const row = updateCdp(id, patch);
        json(res, 200, serializeCdp(row));
        return;
      }
      if (req.method === 'DELETE' && !action) {
        const body = await readBody(req).catch(() => ({}));
        const ok = removeCdp(id, { deleteProfile: body.deleteProfile === true });
        if (!ok) return json(res, 404, { error: `cdp não encontrado: ${id}` });
        json(res, 200, { ok: true, id });
        return;
      }
      if (req.method === 'POST' && action === 'start') {
        const body = await readBody(req).catch(() => ({}));
        const out = await startCdp(id, { url: body.url });
        json(res, 200, { ...serializeCdp(getCdp(id)), already: !!out.already });
        return;
      }
      if (req.method === 'POST' && action === 'stop') {
        await stopCdp(id);
        json(res, 200, serializeCdp(getCdp(id) || { id, name: id, status: 'down' }));
        return;
      }
    }

    if (req.method === 'GET' && path === '/api/camera') {
      const id = url.searchParams.get('id');
      if (!id) return json(res, 400, { error: 'id obrigatório' });
      json(res, 200, getCamera(id));
      return;
    }
    if (req.method === 'POST' && path === '/api/camera') {
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
    if (req.method === 'POST' && path === '/api/camera/clear') {
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
  console.log(`gestão de CDPs → http://127.0.0.1:${PORT}/`);
});
