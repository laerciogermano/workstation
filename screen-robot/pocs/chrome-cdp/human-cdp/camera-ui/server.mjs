#!/usr/bin/env node
/**
 * Gestão de CDPs (UI local):
 * lista + status + CRUD + fingerprint + backups + galeria de mídias + visão + câmera
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
  connectCdp,
  getCamera,
  setCamera,
  clearCamera,
  listFingerprintOptions,
  generateFingerprint,
  listBackups,
  getSelectedBackup,
  createBackup,
  selectBackup,
  removeBackup,
  getViewConfig,
  setViewConfig,
  startView,
  stopView,
  readLatestFrame,
  clearViewFrames,
  backupsDir,
  viewRoot,
  mediaDir,
  listMedia,
  addMedia,
  removeMedia,
  getSelectedMedia,
  selectMediaForCdp,
  applySelectedMedia,
} from '../src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.HUMAN_CDP_CAMERA_UI_PORT || 18770);
const HTML = readFileSync(join(__dirname, 'index.html'), 'utf8');
const WORKS = resolve(__dirname, '../../../../..');

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
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
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

function serializeCdp(c, { full = false } = {}) {
  const cam = c.fingerprint
    ? {
        label: c.fingerprint.cameraLabel || null,
        video: c.fingerprint.cameraVideo || null,
      }
    : { label: null, video: null };
  const selected = getSelectedBackup(c.id);
  const backups = listBackups(c.id);
  const selectedMedia = getSelectedMedia(c.id);
  const row = {
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
    hasFingerprint: !!c.fingerprint,
    label: cam.label,
    video: cam.video,
    backupCount: backups.length,
    selectedBackupId: selected?.id || null,
    selectedBackupAt: selected?.createdAt || null,
    selectedMediaId: c.selectedMediaId || selectedMedia?.id || null,
    selectedMediaName: selectedMedia?.name || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
  if (full) {
    row.fingerprint = c.fingerprint || null;
    row.backups = backups;
    row.selectedBackup = selected;
    row.selectedMedia = selectedMedia;
    row.view = getViewConfig(c.id);
  }
  return row;
}

function defaultsPayload() {
  return {
    video: DEFAULT_VIDEO,
    label: DEFAULT_LABEL,
    videoExists: existsSync(DEFAULT_VIDEO),
    backupsDir: backupsDir(),
    viewRoot: viewRoot(),
    mediaDir: mediaDir(),
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
      return json(res, 200, defaultsPayload());
    }
    if (req.method === 'GET' && path === '/api/media') {
      return json(res, 200, { media: listMedia(), mediaDir: mediaDir() });
    }
    if (req.method === 'POST' && path === '/api/media') {
      const body = await readBody(req);
      const row = addMedia({
        path: body.path,
        name: body.name,
        note: body.note,
        id: body.id,
      });
      return json(res, 201, { media: row, list: listMedia() });
    }
    if (req.method === 'DELETE' && path.startsWith('/api/media/')) {
      const mediaId = decodeURIComponent(path.slice('/api/media/'.length));
      if (!mediaId) return json(res, 400, { error: 'id obrigatório' });
      const ok = removeMedia(mediaId);
      if (!ok) return json(res, 404, { error: `mídia não encontrada: ${mediaId}` });
      return json(res, 200, { ok: true, list: listMedia() });
    }
    if (req.method === 'GET' && path === '/api/fingerprint/options') {
      return json(res, 200, listFingerprintOptions());
    }
    if (req.method === 'POST' && path === '/api/fingerprint/generate') {
      const body = await readBody(req).catch(() => ({}));
      const fingerprint = generateFingerprint({
        os: body.os || undefined,
        chrome: body.chrome || undefined,
        locale: body.locale || undefined,
        lang: body.lang || undefined,
        hardwareConcurrency:
          body.hardwareConcurrency !== '' && body.hardwareConcurrency != null
            ? Number(body.hardwareConcurrency)
            : undefined,
        deviceMemory:
          body.deviceMemory !== '' && body.deviceMemory != null
            ? Number(body.deviceMemory)
            : undefined,
        colorScheme: body.colorScheme || undefined,
        reducedMotion: body.reducedMotion || undefined,
        webrtcIpHandling: body.webrtcIpHandling || undefined,
      });
      return json(res, 200, { fingerprint });
    }
    if (req.method === 'GET' && path === '/api/cdps') {
      return json(res, 200, {
        cdps: listCdps().map((c) => serializeCdp(c)),
        defaults: defaultsPayload(),
      });
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
      return json(res, 201, serializeCdp(row, { full: true }));
    }

    const viewLatest = path.match(/^\/api\/cdps\/([^/]+)\/view\/latest$/);
    if (req.method === 'GET' && viewLatest) {
      const id = decodeURIComponent(viewLatest[1]);
      const frame = readLatestFrame(id);
      if (!frame) return json(res, 404, { error: 'sem frame ainda' });
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'X-View-At': frame.meta?.at || '',
      });
      res.end(frame.buffer);
      return;
    }

    const cdpExtra = path.match(
      /^\/api\/cdps\/([^/]+)\/(start|stop|backups|view|input|media)(?:\/([^/]+))?$/,
    );
    if (cdpExtra) {
      const id = decodeURIComponent(cdpExtra[1]);
      const section = cdpExtra[2];
      const sub = cdpExtra[3] ? decodeURIComponent(cdpExtra[3]) : null;

      if (section === 'start' && req.method === 'POST') {
        const body = await readBody(req).catch(() => ({}));
        const out = await startCdp(id, { url: body.url });
        return json(res, 200, {
          ...serializeCdp(getCdp(id), { full: true }),
          already: !!out.already,
          restored: out.restored || null,
        });
      }
      if (section === 'stop' && req.method === 'POST') {
        await stopCdp(id);
        return json(res, 200, serializeCdp(getCdp(id) || { id, name: id, status: 'down' }));
      }

      if (section === 'backups') {
        if (req.method === 'GET' && !sub) {
          return json(res, 200, {
            cdpId: id,
            backupsDir: joinSafe(backupsDir(), id),
            selected: getSelectedBackup(id),
            backups: listBackups(id),
          });
        }
        if (req.method === 'POST' && !sub) {
          const body = await readBody(req).catch(() => ({}));
          const row = createBackup(id, { note: body.note });
          return json(res, 201, {
            backup: row,
            selected: getSelectedBackup(id),
            backups: listBackups(id),
          });
        }
        if (req.method === 'POST' && sub === 'select') {
          const body = await readBody(req);
          if (!body.backupId) return json(res, 400, { error: 'backupId obrigatório' });
          const selected = selectBackup(id, body.backupId);
          return json(res, 200, { selected, backups: listBackups(id) });
        }
        if (req.method === 'DELETE' && sub) {
          removeBackup(id, sub);
          return json(res, 200, {
            ok: true,
            selected: getSelectedBackup(id),
            backups: listBackups(id),
          });
        }
      }

      if (section === 'media') {
        if (req.method === 'GET' && !sub) {
          return json(res, 200, {
            cdpId: id,
            selected: getSelectedMedia(id),
            media: listMedia(),
            mediaDir: mediaDir(),
          });
        }
        if (req.method === 'POST' && sub === 'select') {
          const body = await readBody(req);
          const sel = selectMediaForCdp(id, body.mediaId ?? null);
          let applied = null;
          if (sel.selectedMediaId && body.apply !== false) {
            applied = await applySelectedMedia(id, {
              apply: body.restart !== false,
              label: body.label,
            });
          }
          return json(res, 200, {
            ...sel,
            applied,
            cdp: serializeCdp(getCdp(id), { full: true }),
          });
        }
      }

      if (section === 'view') {
        if (req.method === 'GET' && !sub) {
          return json(res, 200, getViewConfig(id));
        }
        if (req.method === 'PATCH' && !sub) {
          const body = await readBody(req);
          return json(res, 200, setViewConfig(id, body));
        }
        if (req.method === 'POST' && sub === 'start') {
          return json(res, 200, await startView(id));
        }
        if (req.method === 'POST' && sub === 'stop') {
          return json(res, 200, stopView(id));
        }
        if (req.method === 'POST' && sub === 'clear') {
          return json(res, 200, clearViewFrames(id));
        }
      }

      if (section === 'input' && req.method === 'POST') {
        const body = await readBody(req);
        const page = await connectCdp(id);
        try {
          if (body.type === 'click') {
            await page.clickAt(Number(body.x), Number(body.y), {
              clicks: body.clicks || 1,
            });
          } else if (body.type === 'type') {
            await page.type(body.selector || 'body', String(body.text || ''), {
              delayMs: body.delayMs,
            });
          } else if (body.type === 'key') {
            // digita caractere avulso via insertText na página
            await page.ensureFocus({ force: true });
            await page.send('Input.insertText', { text: String(body.text || '') });
          } else {
            return json(res, 400, { error: 'type inválido (click|type|key)' });
          }
          return json(res, 200, { ok: true });
        } finally {
          page.close();
        }
      }
    }

    const cdpOne = path.match(/^\/api\/cdps\/([^/]+)$/);
    if (cdpOne) {
      const id = decodeURIComponent(cdpOne[1]);
      if (req.method === 'GET') {
        const row = getCdp(id);
        if (!row) return json(res, 404, { error: `cdp não encontrado: ${id}` });
        return json(res, 200, serializeCdp(row, { full: true }));
      }
      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const patch = {};
        for (const key of ['name', 'port', 'defaultUrl', 'obs', 'fingerprint', 'debug']) {
          if (key in body) patch[key] = body[key];
        }
        return json(res, 200, serializeCdp(updateCdp(id, patch), { full: true }));
      }
      if (req.method === 'DELETE') {
        const body = await readBody(req).catch(() => ({}));
        const ok = removeCdp(id, { deleteProfile: body.deleteProfile === true });
        if (!ok) return json(res, 404, { error: `cdp não encontrado: ${id}` });
        return json(res, 200, { ok: true, id });
      }
    }

    if (req.method === 'GET' && path === '/api/camera') {
      const id = url.searchParams.get('id');
      if (!id) return json(res, 400, { error: 'id obrigatório' });
      return json(res, 200, getCamera(id));
    }
    if (req.method === 'POST' && path === '/api/camera') {
      const body = await readBody(req);
      if (!body.id || !body.video) return json(res, 400, { error: 'id e video obrigatórios' });
      return json(res, 200, await setCamera(body.id, {
        video: body.video,
        label: body.label,
        apply: body.apply !== false,
      }));
    }
    if (req.method === 'POST' && path === '/api/camera/clear') {
      const body = await readBody(req);
      if (!body.id) return json(res, 400, { error: 'id obrigatório' });
      return json(res, 200, await clearCamera(body.id, { apply: body.apply !== false }));
    }

    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 500, { error: String(e && e.message || e) });
  }
});

function joinSafe(a, b) {
  return `${a}/${b}`;
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`gestão de CDPs → http://127.0.0.1:${PORT}/`);
  console.log(`backups → ${backupsDir()}`);
  console.log(`view    → ${viewRoot()}`);
});
