/**
 * Visão da tela do CDP: prints JPEG de baixa qualidade em loop, salvos em disco.
 *
 *   ~/chrome-cdp-view/<cdpId>/
 *     config.json
 *     latest.jpg
 *     frames/<stamp>.jpg   (últimos N)
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { captureScreenshot } from './ocr.mjs';
import { getCdp, isPortListening } from './registry.mjs';
import { connect } from './session.mjs';

const VIEW_ROOT = join(homedir(), 'chrome-cdp-view');

/** @type {Map<string, { timer: NodeJS.Timeout, session: any, running: boolean }>} */
const loops = new Map();

const DEFAULT_CONFIG = {
  quality: 15,
  intervalMs: 1000,
  format: 'jpeg',
  maxKeep: 40,
  scale: 0.35,
};

function viewDir(id) {
  return join(VIEW_ROOT, id);
}

function configPath(id) {
  return join(viewDir(id), 'config.json');
}

function latestPath(id) {
  return join(viewDir(id), 'latest.jpg');
}

function framesDir(id) {
  return join(viewDir(id), 'frames');
}

function metaPath(id) {
  return join(viewDir(id), 'latest.json');
}

function readConfig(id) {
  const p = configPath(id);
  if (!existsSync(p)) return { ...DEFAULT_CONFIG };
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(p, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(id, cfg) {
  mkdirSync(viewDir(id), { recursive: true });
  const next = {
    quality: clampInt(cfg.quality, 1, 100, DEFAULT_CONFIG.quality),
    intervalMs: clampInt(cfg.intervalMs, 250, 10000, DEFAULT_CONFIG.intervalMs),
    format: 'jpeg',
    maxKeep: clampInt(cfg.maxKeep, 1, 200, DEFAULT_CONFIG.maxKeep),
    scale: clampFloat(cfg.scale, 0.1, 1, DEFAULT_CONFIG.scale),
  };
  writeFileSync(configPath(id), JSON.stringify(next, null, 2) + '\n');
  return next;
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function clampFloat(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function viewRoot() {
  return VIEW_ROOT;
}

export function getViewConfig(cdpId) {
  return {
    cdpId,
    path: viewDir(cdpId),
    config: readConfig(cdpId),
    running: loops.has(cdpId),
    latest: existsSync(latestPath(cdpId)) ? latestPath(cdpId) : null,
    latestMeta: existsSync(metaPath(cdpId))
      ? JSON.parse(readFileSync(metaPath(cdpId), 'utf8'))
      : null,
  };
}

export function setViewConfig(cdpId, patch = {}) {
  const cur = readConfig(cdpId);
  const next = writeConfig(cdpId, { ...cur, ...patch });
  const loop = loops.get(cdpId);
  if (loop?.running) {
    // reinicia com novo intervalo
    stopView(cdpId);
    startView(cdpId).catch(() => {});
  }
  return { cdpId, path: viewDir(cdpId), config: next, running: loops.has(cdpId) };
}

function pruneFrames(cdpId, maxKeep) {
  const dir = framesDir(cdpId);
  if (!existsSync(dir)) return;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.jpg'))
    .sort();
  const excess = files.length - maxKeep;
  for (let i = 0; i < excess; i++) {
    try {
      unlinkSync(join(dir, files[i]));
    } catch {
      /* ignore */
    }
  }
}

async function takeFrame(cdpId) {
  const loop = loops.get(cdpId);
  if (!loop?.session) return;
  const cfg = readConfig(cdpId);
  mkdirSync(framesDir(cdpId), { recursive: true });

  let clip;
  try {
    const metrics = await loop.session.send('Page.getLayoutMetrics');
    const css = metrics?.cssVisualViewport || metrics?.visualViewport || metrics?.contentSize;
    const width = Number(css?.clientWidth || css?.width || 0);
    const height = Number(css?.clientHeight || css?.height || 0);
    if (width > 0 && height > 0 && cfg.scale < 1) {
      // captureScreenshot clip usa CSS pixels; scale via quality only —
      // usamos Emulation se disponível; senão JPEG quality baixa basta.
      clip = undefined;
      loop.viewport = { width, height };
    }
  } catch {
    /* ignore */
  }

  const buf = await captureScreenshot(loop.session, {
    format: 'jpeg',
    quality: cfg.quality,
    clip,
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const frameFile = join(framesDir(cdpId), `${stamp}.jpg`);
  writeFileSync(frameFile, buf);
  writeFileSync(latestPath(cdpId), buf);
  const meta = {
    cdpId,
    at: new Date().toISOString(),
    bytes: buf.length,
    quality: cfg.quality,
    path: latestPath(cdpId),
    frame: frameFile,
    viewport: loop.viewport || null,
  };
  writeFileSync(metaPath(cdpId), JSON.stringify(meta, null, 2) + '\n');
  pruneFrames(cdpId, cfg.maxKeep);
  return meta;
}

export async function startView(cdpId) {
  const row = getCdp(cdpId);
  if (!row) throw new Error(`cdp não encontrado: ${cdpId}`);
  if (row.status !== 'up' || row.port == null || !isPortListening(row.port)) {
    throw new Error(`CDP ${cdpId} precisa estar up para visão`);
  }
  if (loops.has(cdpId)) {
    return getViewConfig(cdpId);
  }

  writeConfig(cdpId, readConfig(cdpId));
  const session = await connect({
    cdpUrl: row.cdpUrl,
    chromeApp: 'Google Chrome',
  });

  const entry = { timer: null, session, running: true, viewport: null };
  loops.set(cdpId, entry);

  const tick = async () => {
    if (!loops.get(cdpId)?.running) return;
    try {
      await takeFrame(cdpId);
    } catch (e) {
      // sessão caiu → para
      stopView(cdpId);
      return;
    }
    const cfg = readConfig(cdpId);
    const cur = loops.get(cdpId);
    if (cur?.running) {
      cur.timer = setTimeout(tick, cfg.intervalMs);
    }
  };

  await tick();
  return getViewConfig(cdpId);
}

export function stopView(cdpId) {
  const loop = loops.get(cdpId);
  if (!loop) return getViewConfig(cdpId);
  loop.running = false;
  if (loop.timer) clearTimeout(loop.timer);
  try {
    loop.session?.close?.();
  } catch {
    /* ignore */
  }
  loops.delete(cdpId);
  return getViewConfig(cdpId);
}

export function readLatestFrame(cdpId) {
  const p = latestPath(cdpId);
  if (!existsSync(p)) return null;
  return {
    path: p,
    buffer: readFileSync(p),
    meta: existsSync(metaPath(cdpId))
      ? JSON.parse(readFileSync(metaPath(cdpId), 'utf8'))
      : null,
  };
}

export function clearViewFrames(cdpId) {
  const dir = framesDir(cdpId);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  if (existsSync(latestPath(cdpId))) unlinkSync(latestPath(cdpId));
  if (existsSync(metaPath(cdpId))) unlinkSync(metaPath(cdpId));
  return getViewConfig(cdpId);
}
