/**
 * Galeria de mídias (vídeos) via pastas legíveis:
 *   ~/chrome-cdp-media/
 *     <mediaId>/
 *       meta.json
 *       <arquivo>          ← cópia do vídeo
 *
 * Cada CDP pode ter `selectedMediaId` na meta (.human-cdp.json).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

const MEDIA_DIR = join(homedir(), 'chrome-cdp-media');
const PROFILES_DIR = join(homedir(), 'chrome-profiles');
const META_FILE = '.human-cdp.json';
const VIDEO_EXTS = new Set(['.mp4', '.y4m', '.mjpeg', '.mjpg', '.webm', '.mov', '.mkv']);

function stampId(d = new Date()) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

function readJson(p, fallback = null) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function profileMetaPath(cdpId) {
  return join(PROFILES_DIR, cdpId, META_FILE);
}

function readCdpMeta(cdpId) {
  return readJson(profileMetaPath(cdpId), null);
}

function writeCdpMeta(cdpId, meta) {
  const dir = join(PROFILES_DIR, cdpId);
  mkdirSync(dir, { recursive: true });
  writeJson(profileMetaPath(cdpId), meta);
}

export function mediaDir() {
  return MEDIA_DIR;
}

export function listMedia() {
  if (!existsSync(MEDIA_DIR)) return [];
  const rows = [];
  for (const name of readdirSync(MEDIA_DIR)) {
    const dir = join(MEDIA_DIR, name);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const meta = readJson(join(dir, 'meta.json'));
    if (!meta?.id) continue;
    const filePath = meta.path || null;
    const exists = filePath ? existsSync(filePath) : false;
    rows.push({
      id: meta.id,
      name: meta.name || meta.id,
      path: filePath,
      originalPath: meta.originalPath || null,
      note: meta.note || '',
      createdAt: meta.createdAt || null,
      bytes: exists && filePath ? statSync(filePath).size : null,
      exists,
      dir,
    });
  }
  return rows.sort((a, b) =>
    String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)),
  );
}

export function getMedia(mediaId) {
  return listMedia().find((m) => m.id === mediaId) || null;
}

/**
 * Adiciona vídeo à galeria (copia para ~/chrome-cdp-media/<id>/).
 * @param {{ path: string, name?: string, note?: string, id?: string }} input
 */
export function addMedia(input = {}) {
  const src = resolve(String(input.path || '').trim());
  if (!src || !existsSync(src)) throw new Error(`vídeo não encontrado: ${src || '(vazio)'}`);
  const ext = extname(src).toLowerCase();
  if (!VIDEO_EXTS.has(ext)) {
    throw new Error(`extensão não suportada: ${ext || '(sem ext)'} — use ${[...VIDEO_EXTS].join(' ')}`);
  }
  const id = String(input.id || stampId()).trim();
  const dir = join(MEDIA_DIR, id);
  if (existsSync(dir)) throw new Error(`mídia já existe: ${id}`);
  mkdirSync(dir, { recursive: true });
  const destName = basename(src);
  const dest = join(dir, destName);
  cpSync(src, dest);
  const meta = {
    id,
    name: String(input.name || destName).trim() || destName,
    note: String(input.note || '').trim(),
    originalPath: src,
    path: dest,
    createdAt: new Date().toISOString(),
  };
  writeJson(join(dir, 'meta.json'), meta);
  return { ...meta, exists: true, dir, bytes: statSync(dest).size };
}

export function removeMedia(mediaId) {
  const row = getMedia(mediaId);
  if (!row) return false;
  // limpa seleção nos CDPs que apontavam pra ela
  if (existsSync(PROFILES_DIR)) {
    for (const id of readdirSync(PROFILES_DIR)) {
      const meta = readCdpMeta(id);
      if (meta?.selectedMediaId === mediaId) {
        delete meta.selectedMediaId;
        meta.updatedAt = new Date().toISOString();
        writeCdpMeta(id, meta);
      }
    }
  }
  rmSync(row.dir, { recursive: true, force: true });
  return true;
}

export function getSelectedMedia(cdpId) {
  const meta = readCdpMeta(cdpId);
  if (!meta?.selectedMediaId) return null;
  const media = getMedia(meta.selectedMediaId);
  return media
    ? { ...media, selected: true }
    : { id: meta.selectedMediaId, missing: true, selected: true };
}

/**
 * Seleciona mídia da galeria para o CDP (grava selectedMediaId na meta).
 * Não aplica câmera sozinho — use applySelectedMedia / setCamera.
 */
export function selectMediaForCdp(cdpId, mediaId) {
  const meta = readCdpMeta(cdpId);
  if (!meta) throw new Error(`meta ausente: ${cdpId}`);
  if (mediaId == null || mediaId === '') {
    delete meta.selectedMediaId;
    meta.updatedAt = new Date().toISOString();
    writeCdpMeta(cdpId, meta);
    return { cdpId, selectedMediaId: null, media: null };
  }
  const media = getMedia(mediaId);
  if (!media || !media.exists) throw new Error(`mídia não encontrada: ${mediaId}`);
  meta.selectedMediaId = media.id;
  meta.updatedAt = new Date().toISOString();
  writeCdpMeta(cdpId, meta);
  return { cdpId, selectedMediaId: media.id, media };
}
