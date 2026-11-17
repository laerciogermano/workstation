#!/usr/bin/env node
/**
 * POC OmTV — usa setCamera da human-cdp (vídeo local + label, sem OBS).
 *
 *   node run.mjs
 *   node run.mjs --video /caminho/video.mp4 --label "FaceTime HD Camera"
 *   node run.mjs --stop
 *
 * UI da lib: cd screen-robot/pocs/chrome-cdp/human-cdp && npm run camera-ui
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const MEDIA = join(ROOT, 'media');
const FIXTURE = join(ROOT, 'fixtures', 'webcam-test.html');
const HUMAN_CDP = resolve(ROOT, '../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs');
const FIXTURE_PORT = Number(process.env.OMTV_FAKE_CAM_HTTP || 18765);

function parseArgs(argv) {
  const out = {
    video: null,
    label: 'FaceTime HD Camera',
    url: null,
    id: 'omtv-fake-cam',
    port: 9270,
    stop: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--stop') out.stop = true;
    else if (a === '--video') out.video = argv[++i];
    else if (a === '--label') out.label = argv[++i];
    else if (a === '--url') out.url = argv[++i];
    else if (a === '--id') out.id = argv[++i];
    else if (a === '--port') out.port = Number(argv[++i]);
    else throw new Error(`arg desconhecido: ${a}`);
  }
  return out;
}

function defaultVideo() {
  mkdirSync(MEDIA, { recursive: true });
  const generated = join(MEDIA, 'testsrc.y4m');
  if (!existsSync(generated)) {
    execFileSync(
      'ffmpeg',
      ['-y', '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=10', '-t', '1', '-pix_fmt', 'yuv420p', generated],
      { stdio: 'inherit' },
    );
  }
  return generated;
}

function startFixtureServer() {
  const html = readFileSync(FIXTURE);
  const server = createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
  });
  return new Promise((resolvePromise, reject) => {
    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        resolvePromise({ server: null, url: `http://127.0.0.1:${FIXTURE_PORT}/`, reused: true });
        return;
      }
      reject(err);
    });
    server.listen(FIXTURE_PORT, '127.0.0.1', () => {
      server.unref();
      resolvePromise({ server, url: `http://127.0.0.1:${FIXTURE_PORT}/` });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`POC fake webcam via human-cdp setCamera

  node run.mjs [--video path] [--label "Nome"] [--url URL] [--id omtv-fake-cam] [--port 9270]
  node run.mjs --stop
`);
    return;
  }

  const {
    createCdp,
    updateCdp,
    getCdp,
    startCdp,
    stopCdp,
    statusCdp,
    connectCdp,
    setCamera,
    getCamera,
  } = await import(HUMAN_CDP);

  if (args.stop) {
    if (getCdp(args.id)) {
      await stopCdp(args.id);
      console.log(JSON.stringify({ stopped: args.id }, null, 2));
    } else {
      console.log(JSON.stringify({ stopped: false, reason: 'cdp inexistente' }, null, 2));
    }
    return;
  }

  const video = args.video ? resolve(args.video) : defaultVideo();
  const fixture = args.url ? null : await startFixtureServer();
  const pageUrl = args.url || fixture.url;
  const origin = new URL(pageUrl).origin;

  if (!getCdp(args.id)) {
    createCdp({
      id: args.id,
      name: 'OmTV fake webcam POC',
      port: args.port,
      defaultUrl: pageUrl,
      obs: 'POC OmTV: setCamera human-cdp',
      fingerprint: {
        lang: 'pt-BR',
        acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
        permissions: [
          { origin, permission: 'video_capture', setting: 'granted' },
          { origin, permission: 'audio_capture', setting: 'granted' },
          { origin, permission: 'camera', setting: 'granted' },
          { origin, permission: 'microphone', setting: 'granted' },
        ],
      },
    });
  } else {
    const prev = getCdp(args.id);
    updateCdp(args.id, {
      defaultUrl: pageUrl,
      fingerprint: {
        ...(prev?.fingerprint || {}),
        permissions: [
          { origin, permission: 'video_capture', setting: 'granted' },
          { origin, permission: 'audio_capture', setting: 'granted' },
          { origin, permission: 'camera', setting: 'granted' },
          { origin, permission: 'microphone', setting: 'granted' },
        ],
      },
    });
  }

  // apply:false aqui — startCdp em seguida já lê cameraCaptureFile
  const cam = await setCamera(args.id, {
    video,
    label: args.label,
    apply: false,
  });

  const st0 = await statusCdp(args.id);
  if (st0.status === 'up') await stopCdp(args.id);
  const st = await startCdp(args.id, { url: pageUrl });
  const page = await connectCdp(args.id, { url: pageUrl });

  try {
    await page.send('Browser.grantPermissions', {
      origin,
      permissions: ['videoCapture', 'audioCapture'],
    });
  } catch { /* ignore */ }

  await new Promise((r) => setTimeout(r, 1500));

  const verify = await page.evaluate(
    `(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput').map((d) => d.label);
    let trackLabel = null, err = null, w = 0, h = 0;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const t = s.getVideoTracks()[0];
      trackLabel = t?.label || null;
      const settings = t?.getSettings?.() || {};
      w = settings.width || 0;
      h = settings.height || 0;
      s.getTracks().forEach((x) => x.stop());
    } catch (e) { err = String(e && e.message || e); }
    return { href: location.href, cams, trackLabel, w, h, err };
  })()`,
    { awaitPromise: true },
  );

  page.close();

  console.log(JSON.stringify({
    id: args.id,
    port: st.port,
    cdpUrl: st.cdpUrl,
    camera: getCamera(args.id),
    setCamera: cam,
    pageUrl,
    verify,
    note: 'UI: human-cdp → npm run camera-ui. --stop para fechar o Chrome.',
  }, null, 2));

  if (fixture) globalThis.__omtvFakeCamServer = fixture.server;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
