/**
 * Webcam fake via flags Chrome (--use-file-for-fake-video-capture) + label spoof.
 * Sem OBS. Trocar vídeo exige restart do Chrome (só vale no spawn).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

export const DEFAULT_CAMERA_LABEL = 'FaceTime HD Camera';

const FAKE_DEVICE = '--use-fake-device-for-media-stream';
const FAKE_UI = '--use-fake-ui-for-media-stream';
const FAKE_FILE_RE = /^--use-file-for-fake-video-capture=/;

/** Nomes CDP Browser.grantPermissions (camelCase). */
export const GRANT_MEDIA_PERMISSIONS = ['videoCapture', 'audioCapture'];

/**
 * @param {string} urlOrOrigin
 * @returns {string|null}
 */
export function originFromUrl(urlOrOrigin) {
  const raw = String(urlOrOrigin || '').trim();
  if (!raw) return null;
  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).origin;
    if (raw.includes('://')) return new URL(raw).origin;
    return new URL(`https://${raw}`).origin;
  } catch {
    return null;
  }
}

/**
 * Entradas fingerprint.permissions (igual POC OmTV).
 * @param {string} origin
 */
export function mediaPermissionEntries(origin) {
  const o = String(origin || '').trim();
  if (!o) return [];
  return [
    { origin: o, permission: 'video_capture', setting: 'granted' },
    { origin: o, permission: 'audio_capture', setting: 'granted' },
    { origin: o, permission: 'camera', setting: 'granted' },
    { origin: o, permission: 'microphone', setting: 'granted' },
  ];
}

/**
 * Une permissions existentes com grant de câmera/mic por origem.
 * @param {Array<{origin: string, permission: string, setting?: string}>|undefined|null} existing
 * @param {string[]} origins
 */
export function mergeMediaPermissions(existing, origins) {
  const map = new Map();
  const key = (p) => `${p.origin}|${p.permission}`;
  for (const p of Array.isArray(existing) ? existing : []) {
    if (p?.origin && p?.permission) map.set(key(p), p);
  }
  for (const origin of origins || []) {
    const o = originFromUrl(origin) || String(origin || '').trim();
    if (!o) continue;
    for (const p of mediaPermissionEntries(o)) map.set(key(p), p);
  }
  return [...map.values()];
}

/** Webcam fake leve — Y4M raw grande trava o Chrome. */
export const DEFAULT_CAPTURE_SIZE = '640x360';
export const DEFAULT_CAPTURE_FPS = 12;
/** Segundos máximos no loop (Chrome repete o arquivo). */
export const DEFAULT_CAPTURE_MAX_SECONDS = 30;

/**
 * @param {string} videoPath mp4/y4m/mjpeg…
 * @param {string} outY4m
 * @param {string | { size?: string, fps?: number, maxSeconds?: number }} [sizeOrOpts]
 */
export function convertToY4m(videoPath, outY4m, sizeOrOpts = DEFAULT_CAPTURE_SIZE) {
  const absIn = resolve(videoPath);
  if (!existsSync(absIn)) throw new Error(`vídeo não encontrado: ${absIn}`);
  if (!commandExists('ffmpeg')) throw new Error('ffmpeg não encontrado no PATH');
  const opts =
    typeof sizeOrOpts === 'string' || sizeOrOpts == null
      ? { size: sizeOrOpts || DEFAULT_CAPTURE_SIZE }
      : sizeOrOpts;
  const size = String(opts.size || DEFAULT_CAPTURE_SIZE).replace(/[^0-9x]/gi, '') || DEFAULT_CAPTURE_SIZE;
  const fps = Math.max(1, Math.min(30, Number(opts.fps) || DEFAULT_CAPTURE_FPS));
  const maxSeconds = Math.max(
    1,
    Number(opts.maxSeconds != null ? opts.maxSeconds : DEFAULT_CAPTURE_MAX_SECONDS) || DEFAULT_CAPTURE_MAX_SECONDS,
  );
  // scale com aspect ratio; fps baixo; corta duração — Y4M uncompressed não escala bem.
  const vf = `scale=${size}:force_original_aspect_ratio=decrease,fps=${fps}`;
  mkdirSync(dirname(outY4m), { recursive: true });
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i', absIn,
      '-t', String(maxSeconds),
      '-an',
      '-pix_fmt', 'yuv420p',
      '-vf', vf,
      outY4m,
    ],
    { stdio: 'pipe' },
  );
  return outY4m;
}

function commandExists(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Garante Y4M leve no cache (sempre normaliza — y4m/mjpeg grande também).
 * @param {string} videoPath
 * @param {string} cacheDir pasta p/ Y4M gerado
 * @param {{ size?: string, fps?: number, maxSeconds?: number }} [opts]
 */
export function ensureCaptureFile(videoPath, cacheDir, opts = {}) {
  const abs = resolve(videoPath);
  if (!existsSync(abs)) throw new Error(`vídeo não encontrado: ${abs}`);
  const size = String(opts.size || DEFAULT_CAPTURE_SIZE);
  const fps = Number(opts.fps) || DEFAULT_CAPTURE_FPS;
  const maxSeconds = opts.maxSeconds != null ? Number(opts.maxSeconds) : DEFAULT_CAPTURE_MAX_SECONDS;
  mkdirSync(cacheDir, { recursive: true });
  const base = basename(abs, extname(abs)) || 'capture';
  const out = join(
    cacheDir,
    `${base}.${size.replace('x', 'x')}.${fps}fps.${maxSeconds}s.y4m`,
  );
  if (existsSync(out)) {
    try {
      if (statSync(out).mtimeMs >= statSync(abs).mtimeMs) return out;
    } catch {
      return out;
    }
  }
  return convertToY4m(abs, out, { size, fps, maxSeconds });
}

/**
 * @param {string} captureFile caminho absoluto y4m/mjpeg
 * @returns {string[]}
 */
export function fakeCameraChromeArgs(captureFile) {
  const abs = resolve(captureFile);
  return [FAKE_DEVICE, FAKE_UI, `--use-file-for-fake-video-capture=${abs}`];
}

/**
 * Remove flags fake de uma lista de chromeArgs.
 * @param {string[]|undefined|null} args
 */
export function stripFakeCameraArgs(args) {
  if (!Array.isArray(args)) return [];
  return args.filter(
    (a) =>
      a !== FAKE_DEVICE &&
      a !== FAKE_UI &&
      !FAKE_FILE_RE.test(String(a)),
  );
}

/**
 * @param {object|null|undefined} fp
 * @returns {{ video: string|null, captureFile: string|null, label: string|null }}
 */
export function cameraFromFingerprint(fp) {
  if (!fp || typeof fp !== 'object') {
    return { video: null, captureFile: null, label: null };
  }
  const video = typeof fp.cameraVideo === 'string' && fp.cameraVideo.trim()
    ? fp.cameraVideo.trim()
    : null;
  const captureFile =
    typeof fp.cameraCaptureFile === 'string' && fp.cameraCaptureFile.trim()
      ? fp.cameraCaptureFile.trim()
      : null;
  const label =
    typeof fp.cameraLabel === 'string' && fp.cameraLabel.trim()
      ? fp.cameraLabel.trim()
      : null;
  return { video, captureFile, label };
}
