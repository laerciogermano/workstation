#!/usr/bin/env node
/**
 * Gestão de CDPs (UI local):
 * lista + status + CRUD + fingerprint + snapshots + galeria (file picker) + visão + câmera
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
  controlCameraPlayback,
  getCameraPreviewPath,
  listFingerprintOptions,
  generateFingerprint,
  listSnapshots,
  getSelectedSnapshot,
  createSnapshot,
  selectSnapshot,
  removeSnapshot,
  packSnapshotStream,
  importSnapshot,
  snapshotsDir,
  getViewConfig,
  setViewConfig,
  startView,
  stopView,
  readLatestFrame,
  clearViewFrames,
  viewRoot,
  mediaDir,
  listMedia,
  addMedia,
  addMediaFromUpload,
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

function readRaw(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
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
  const selected = getSelectedSnapshot(c.id);
  const snapshots = listSnapshots(c.id);
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
    snapshotCount: snapshots.length,
    backupCount: snapshots.length,
    selectedSnapshotId: selected?.id || null,
    selectedSnapshotAt: selected?.createdAt || null,
    selectedBackupId: selected?.id || null,
    selectedBackupAt: selected?.createdAt || null,
    selectedMediaId: c.selectedMediaId || selectedMedia?.id || null,
    selectedMediaName: selectedMedia?.name || null,
    cameraPlayback: c.cameraPlayback || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
  if (full) {
    row.fingerprint = c.fingerprint || null;
    row.snapshots = snapshots;
    row.backups = snapshots;
    row.selectedSnapshot = selected;
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
    snapshotsDir: snapshotsDir(),
    backupsDir: snapshotsDir(),
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
    if (req.method === 'POST' && path === '/api/media/upload') {
      const filename = decodeURIComponent(String(req.headers['x-filename'] || 'video.bin'));
      const name = decodeURIComponent(String(req.headers['x-name'] || ''));
      const note = decodeURIComponent(String(req.headers['x-note'] || ''));
      const buffer = await readRaw(req);
      const row = addMediaFromUpload({ buffer, filename, name: name || undefined, note });
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

    const snapDownload = path.match(
      /^\/api\/cdps\/([^/]+)\/(?:snapshots|backups)\/([^/]+)\/download$/,
    );
    if (req.method === 'GET' && snapDownload) {
      const id = decodeURIComponent(snapDownload[1]);
      const sid = decodeURIComponent(snapDownload[2]);
      if (!getCdp(id)) return json(res, 404, { error: `CDP não encontrado: ${id}` });
      const { filename, child, stream } = packSnapshotStream(id, sid);
      res.writeHead(200, {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      });
      stream.pipe(res);
      child.stderr?.on('data', () => {});
      child.on('error', (err) => {
        if (!res.headersSent) json(res, 500, { error: String(err.message || err) });
        else res.destroy(err);
      });
      child.on('close', (code) => {
        if (code && code !== 0 && !res.writableEnded) res.destroy();
      });
      return;
    }

    const snapImport = path.match(/^\/api\/cdps\/([^/]+)\/(?:snapshots|backups)\/import$/);
    if (req.method === 'POST' && snapImport) {
      const id = decodeURIComponent(snapImport[1]);
      if (!getCdp(id)) return json(res, 404, { error: `CDP não encontrado: ${id}` });
      const filename = decodeURIComponent(String(req.headers['x-filename'] || 'snapshot.tar.gz'));
      const note = decodeURIComponent(String(req.headers['x-note'] || ''));
      const selectHdr = String(req.headers['x-select'] || '1');
      const buffer = await readRaw(req);
      const row = importSnapshot(id, {
        buffer,
        filename,
        note,
        select: selectHdr !== '0' && selectHdr !== 'false',
      });
      return json(res, 201, {
        snapshot: row,
        backup: row,
        selected: getSelectedSnapshot(id),
        snapshots: listSnapshots(id),
        backups: listSnapshots(id),
      });
    }

    const cdpExtra = path.match(
      /^\/api\/cdps\/([^/]+)\/(start|stop|backups|snapshots|view|input|media)(?:\/([^/]+))?$/,
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

      if (section === 'backups' || section === 'snapshots') {
        if (req.method === 'GET' && !sub) {
          return json(res, 200, {
            cdpId: id,
            snapshotsDir: joinSafe(snapshotsDir(), id),
            backupsDir: joinSafe(snapshotsDir(), id),
            selected: getSelectedSnapshot(id),
            snapshots: listSnapshots(id),
            backups: listSnapshots(id),
          });
        }
        if (req.method === 'POST' && !sub) {
          const body = await readBody(req).catch(() => ({}));
          const row = createSnapshot(id, { note: body.note, select: body.select !== false });
          return json(res, 201, {
            snapshot: row,
            backup: row,
            selected: getSelectedSnapshot(id),
            snapshots: listSnapshots(id),
            backups: listSnapshots(id),
          });
        }
        if (req.method === 'POST' && sub === 'select') {
          const body = await readBody(req);
          const sid = body.snapshotId || body.backupId;
          if (!sid) return json(res, 400, { error: 'snapshotId obrigatório' });
          const selected = selectSnapshot(id, sid);
          return json(res, 200, {
            selected,
            snapshots: listSnapshots(id),
            backups: listSnapshots(id),
          });
        }
        if (req.method === 'DELETE' && sub) {
          removeSnapshot(id, sub);
          return json(res, 200, {
            ok: true,
            selected: getSelectedSnapshot(id),
            snapshots: listSnapshots(id),
            backups: listSnapshots(id),
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
        // Textarea do Editar costuma vir sem camera* — não apagar vídeo já aplicado
        // se a mídia ainda estiver selecionada (Salvar em seguida re-aplica de qualquer forma).
        if ('fingerprint' in patch && patch.fingerprint && typeof patch.fingerprint === 'object') {
          const cur = getCdp(id);
          const prevFp = cur?.fingerprint || {};
          if (cur?.selectedMediaId) {
            for (const key of ['cameraVideo', 'cameraCaptureFile', 'cameraLabel']) {
              if (!patch.fingerprint[key] && prevFp[key]) {
                patch.fingerprint[key] = prevFp[key];
              }
            }
          }
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
    if (req.method === 'POST' && path === '/api/camera/playback') {
      const body = await readBody(req);
      if (!body.id) return json(res, 400, { error: 'id obrigatório' });
      return json(res, 200, await controlCameraPlayback(body.id, {
        action: body.action || 'status',
        positionSec: body.positionSec,
        deltaSec: body.deltaSec,
        zoom: body.zoom,
        restart: body.restart === true,
      }));
    }
    if (req.method === 'GET' && path === '/api/camera/preview') {
      const id = url.searchParams.get('id');
      if (!id) return json(res, 400, { error: 'id obrigatório' });
      // Atualiza frame no instante atual antes de servir.
      try {
        await controlCameraPlayback(id, { action: 'status' });
      } catch {
        /* pode não ter mídia ainda */
      }
      const preview = getCameraPreviewPath(id);
      if (!preview || !existsSync(preview)) {
        return json(res, 404, { error: 'preview ausente — aplique uma mídia' });
      }
      const buf = readFileSync(preview);
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'Content-Length': buf.length,
      });
      res.end(buf);
      return;
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
  console.log(`snapshots → ${snapshotsDir()}`);
  console.log(`view      → ${viewRoot()}`);
  console.log(`media     → ${mediaDir()}`);
});
