/**
 * Webcam fake via flags Chrome (--use-file-for-fake-video-capture) + label spoof.
 * Sem OBS. Trocar vídeo exige restart do Chrome (só vale no spawn).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

export const DEFAULT_CAMERA_LABEL = 'FaceTime HD Camera';

const FAKE_DEVICE = '--use-fake-device-for-media-stream';
const FAKE_UI = '--use-fake-ui-for-media-stream';
const FAKE_FILE_RE = /^--use-file-for-fake-video-capture=/;

/**
 * @param {string} videoPath mp4/y4m/mjpeg…
 * @param {string} outY4m
 * @param {string} [size] ex. 640x360
 */
export function convertToY4m(videoPath, outY4m, size = '640x360') {
  const absIn = resolve(videoPath);
  if (!existsSync(absIn)) throw new Error(`vídeo não encontrado: ${absIn}`);
  if (!commandExists('ffmpeg')) throw new Error('ffmpeg não encontrado no PATH');
  mkdirSync(dirname(outY4m), { recursive: true });
  execFileSync(
    'ffmpeg',
    ['-y', '-i', absIn, '-an', '-pix_fmt', 'yuv420p', '-vf', `scale=${size}`, outY4m],
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
 * Garante arquivo consumível pelo Chrome (y4m/mjpeg).
 * @param {string} videoPath
 * @param {string} cacheDir pasta p/ Y4M gerado
 * @param {{ size?: string }} [opts]
 */
export function ensureCaptureFile(videoPath, cacheDir, opts = {}) {
  const abs = resolve(videoPath);
  if (!existsSync(abs)) throw new Error(`vídeo não encontrado: ${abs}`);
  const ext = extname(abs).toLowerCase();
  if (ext === '.y4m' || ext === '.mjpeg' || ext === '.mjpg') return abs;
  mkdirSync(cacheDir, { recursive: true });
  const out = join(cacheDir, `${basename(abs, extname(abs)) || 'capture'}.y4m`);
  return convertToY4m(abs, out, opts.size || '640x360');
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
