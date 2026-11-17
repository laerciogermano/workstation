#!/usr/bin/env node
/**
 * Aceite setCamera/getCamera/clearCamera sem subir Chrome (apply:false).
 */
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  createCdp,
  getCdp,
  removeCdp,
  setCamera,
  getCamera,
  clearCamera,
  chromeArgsFromFingerprint,
} from '../src/index.mjs';

const SMOKE_ID = 'smoke-tmp-camera';
const SMOKE_PORT = 19301;
const dir = join(tmpdir(), 'human-cdp-camera-smoke');
mkdirSync(dir, { recursive: true });
const y4m = join(dir, 'tiny.y4m');

if (!existsSync(y4m)) {
  execFileSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', 'testsrc=size=160x120:rate=5', '-t', '0.4', '-pix_fmt', 'yuv420p', y4m],
    { stdio: 'pipe' },
  );
}

if (getCdp(SMOKE_ID)) removeCdp(SMOKE_ID, { deleteProfile: true });

createCdp({
  id: SMOKE_ID,
  name: 'Smoke Camera',
  port: SMOKE_PORT,
  defaultUrl: 'https://ome.tv/',
  fingerprint: { lang: 'pt-BR' },
});

const set = await setCamera(SMOKE_ID, {
  video: y4m,
  label: 'HD Webcam C270',
  apply: false,
});
if (set.label !== 'HD Webcam C270') throw new Error('label');
if (!set.captureFile) throw new Error('captureFile');

const got = getCamera(SMOKE_ID);
if (got.label !== 'HD Webcam C270') throw new Error('getCamera label');
if (!got.video) throw new Error('getCamera video');

const row = getCdp(SMOKE_ID);
const args = chromeArgsFromFingerprint(row.fingerprint);
if (!args.some((a) => a.startsWith('--use-file-for-fake-video-capture='))) {
  throw new Error('chromeArgs sem fake file');
}
if (!args.includes('--use-fake-device-for-media-stream')) {
  throw new Error('chromeArgs sem fake device');
}
const perms = row.fingerprint?.permissions || [];
if (!perms.some((p) => p.origin === 'https://ome.tv' && p.permission === 'video_capture' && p.setting === 'granted')) {
  throw new Error('setCamera sem permissions video_capture (POC)');
}

await clearCamera(SMOKE_ID, { apply: false });
const after = getCamera(SMOKE_ID);
if (after.video || after.captureFile) throw new Error('clearCamera não limpou vídeo');
const args2 = chromeArgsFromFingerprint(getCdp(SMOKE_ID).fingerprint);
if (args2.some((a) => /use-fake|fake-video-capture/i.test(a))) {
  throw new Error('clearCamera deixou flags fake');
}

removeCdp(SMOKE_ID, { deleteProfile: true });
try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }

console.log('camera-smoke ok');
