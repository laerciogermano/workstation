/**
 * Webcam fake via flags Chrome (--use-file-for-fake-video-capture) + label spoof.
 * Sem OBS. Trocar vídeo exige restart do Chrome (só vale no spawn).
 */
import { execFileSync } from 'node:child_process';
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  ftruncateSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  writeSync,
} from 'node:fs';
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
/** Passo padrão dos botões ≪ / ≫ na UI. */
export const DEFAULT_SEEK_STEP_SEC = 5;
/** Arquivo estável que o Chrome mantém aberto — seek/pause só sobrescreve, sem restart. */
export const LIVE_CAPTURE_NAME = 'live.y4m';
/** Segmento curto no transporte: EOF rápido → Chrome relê o Y4M novo. */
export const TRANSPORT_CAPTURE_SECONDS = 3;
export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;
export const PREVIEW_NAME = 'preview.jpg';

/**
 * @param {unknown} zoom
 * @returns {number}
 */
export function clampZoom(zoom) {
  const z = Number(zoom);
  if (!Number.isFinite(z)) return DEFAULT_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
}

/**
 * @param {string} size ex. 640x360
 * @param {number} [fps]
 * @param {number} [zoom]
 */
export function captureVideoFilter(size, fps, zoom = DEFAULT_ZOOM) {
  const z = clampZoom(zoom);
  const fpsPart = fps != null ? `,fps=${fps}` : '';
  if (z <= 1.001) {
    return `scale=${size}:force_original_aspect_ratio=decrease${fpsPart}`;
  }
  // Zoom centro: recorta iw/z × ih/z e escala de volta.
  return `crop=iw/${z}:ih/${z},scale=${size}:force_original_aspect_ratio=decrease${fpsPart}`;
}

/**
 * @param {string} cacheDir
 */
export function previewPath(cacheDir) {
  return join(cacheDir, PREVIEW_NAME);
}

/**
 * @param {string} videoPath
 * @returns {number|null} duração em segundos
 */
export function probeMediaDuration(videoPath) {
  const abs = resolve(videoPath);
  if (!existsSync(abs)) return null;
  if (!commandExists('ffprobe')) return null;
  try {
    const out = execFileSync(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        abs,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    const n = Number(out);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} videoPath mp4/y4m/mjpeg…
 * @param {string} outY4m
 * @param {string | { size?: string, fps?: number, maxSeconds?: number, startSec?: number, paused?: boolean, zoom?: number }} [sizeOrOpts]
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
  const startSec = Math.max(0, Number(opts.startSec) || 0);
  const paused = opts.paused === true;
  const zoom = clampZoom(opts.zoom);
  const vf = captureVideoFilter(size, fps, zoom);
  mkdirSync(dirname(outY4m), { recursive: true });

  if (paused) {
    // Congela o frame em startSec (loop curto de still) — Chrome não pausa o arquivo sozinho.
    const framePng = join(dirname(outY4m), `pause-frame-${Math.round(startSec * 10)}.png`);
    execFileSync(
      'ffmpeg',
      ['-y', '-ss', String(startSec), '-i', absIn, '-frames:v', '1', '-q:v', '2', framePng],
      { stdio: 'pipe' },
    );
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-loop', '1',
        '-i', framePng,
        '-t', '2',
        '-an',
        '-pix_fmt', 'yuv420p',
        '-vf', vf,
        outY4m,
      ],
      { stdio: 'pipe' },
    );
    return outY4m;
  }

  execFileSync(
    'ffmpeg',
    [
      '-y',
      ...(startSec > 0 ? ['-ss', String(startSec)] : []),
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

/**
 * Frame JPEG do instante atual (com zoom) p/ preview na UI.
 * @param {string} videoPath
 * @param {string} outJpeg
 * @param {{ startSec?: number, zoom?: number, size?: string }} [opts]
 */
export function extractPreviewJpeg(videoPath, outJpeg, opts = {}) {
  const absIn = resolve(videoPath);
  if (!existsSync(absIn)) throw new Error(`vídeo não encontrado: ${absIn}`);
  if (!commandExists('ffmpeg')) throw new Error('ffmpeg não encontrado no PATH');
  const size = String(opts.size || DEFAULT_CAPTURE_SIZE).replace(/[^0-9x]/gi, '') || DEFAULT_CAPTURE_SIZE;
  const startSec = Math.max(0, Number(opts.startSec) || 0);
  const zoom = clampZoom(opts.zoom);
  const vf = captureVideoFilter(size, null, zoom);
  mkdirSync(dirname(outJpeg), { recursive: true });
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-ss', String(startSec),
      '-i', absIn,
      '-frames:v', '1',
      '-vf', vf,
      '-q:v', '3',
      outJpeg,
    ],
    { stdio: 'pipe' },
  );
  return outJpeg;
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
 * Caminho estável da captura ao vivo (seek sem fechar o Chrome).
 * @param {string} cacheDir
 */
export function liveCapturePath(cacheDir) {
  return join(cacheDir, LIVE_CAPTURE_NAME);
}

/**
 * Publica Y4M no path que o Chrome já tem aberto.
 * Nunca abre com O_TRUNC (ffmpeg -y zera o arquivo → fake cam fica preto).
 * @param {string} livePath
 * @param {string} nextPath
 */
export function publishLiveCapture(livePath, nextPath) {
  const live = resolve(livePath);
  const next = resolve(nextPath);
  if (!existsSync(next)) throw new Error(`captura ausente: ${next}`);
  const data = readFileSync(next);
  if (data.length < 128 || !data.subarray(0, 9).toString().startsWith('YUV4MPEG2')) {
    throw new Error(`Y4M inválido após encode (${data.length} B)`);
  }
  mkdirSync(dirname(live), { recursive: true });
  if (!existsSync(live)) {
    copyFileSync(next, live);
    return live;
  }
  const fd = openSync(live, 'r+');
  try {
    writeSync(fd, data, 0, data.length, 0);
    ftruncateSync(fd, data.length);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return live;
}

/**
 * Encode → live.next.y4m → publica em live.y4m sem janela de 0 bytes.
 * @param {string} videoPath
 * @param {string} cacheDir
 * @param {{ size?: string, fps?: number, maxSeconds?: number, startSec?: number, paused?: boolean, zoom?: number }} [opts]
 */
export function writeLiveCapture(videoPath, cacheDir, opts = {}) {
  mkdirSync(cacheDir, { recursive: true });
  const live = liveCapturePath(cacheDir);
  const next = join(cacheDir, 'live.next.y4m');
  convertToY4m(videoPath, next, opts);
  return publishLiveCapture(live, next);
}

/**
 * Garante Y4M leve no cache (sempre normaliza — y4m/mjpeg grande também).
 * @param {string} videoPath
 * @param {string} cacheDir pasta p/ Y4M gerado
 * @param {{ size?: string, fps?: number, maxSeconds?: number, startSec?: number, paused?: boolean, zoom?: number, force?: boolean, outPath?: string, live?: boolean }} [opts]
 */
export function ensureCaptureFile(videoPath, cacheDir, opts = {}) {
  const abs = resolve(videoPath);
  if (!existsSync(abs)) throw new Error(`vídeo não encontrado: ${abs}`);
  const size = String(opts.size || DEFAULT_CAPTURE_SIZE);
  const fps = Number(opts.fps) || DEFAULT_CAPTURE_FPS;
  let maxSeconds = opts.maxSeconds != null ? Number(opts.maxSeconds) : DEFAULT_CAPTURE_MAX_SECONDS;
  let startSec = Math.max(0, Number(opts.startSec) || 0);
  const paused = opts.paused === true;
  const zoom = clampZoom(opts.zoom);
  const duration = probeMediaDuration(abs);
  if (duration != null) {
    // deixa pelo menos ~1s de conteúdo (evita Y4M vazio → preto)
    const maxStart = Math.max(0, duration - 1);
    startSec = Math.min(startSec, maxStart);
    if (!paused) {
      maxSeconds = Math.min(maxSeconds, Math.max(1, duration - startSec));
    }
  }
  mkdirSync(cacheDir, { recursive: true });

  if (opts.live || (opts.outPath && resolve(opts.outPath) === resolve(liveCapturePath(cacheDir)))) {
    return writeLiveCapture(abs, cacheDir, { size, fps, maxSeconds, startSec, paused, zoom });
  }

  const base = basename(abs, extname(abs)) || 'capture';
  const tag = paused
    ? `p${startSec.toFixed(1)}`
    : startSec > 0
      ? `s${startSec.toFixed(1)}`
      : 's0';
  const out = opts.outPath
    ? resolve(opts.outPath)
    : join(cacheDir, `${base}.${size}.${fps}fps.${maxSeconds}s.${tag}.y4m`);
  const transport = startSec > 0 || paused || opts.force || !!opts.outPath;
  if (!transport && existsSync(out)) {
    try {
      if (statSync(out).mtimeMs >= statSync(abs).mtimeMs) return out;
    } catch {
      return out;
    }
  }
  return convertToY4m(abs, out, { size, fps, maxSeconds, startSec, paused, zoom });
}

/**
 * Atualiza preview.jpg do CDP no instante/zoom atuais.
 * @param {string} videoPath
 * @param {string} cacheDir
 * @param {{ startSec?: number, zoom?: number, size?: string }} [opts]
 */
export function writePreviewFrame(videoPath, cacheDir, opts = {}) {
  mkdirSync(cacheDir, { recursive: true });
  return extractPreviewJpeg(videoPath, previewPath(cacheDir), opts);
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
