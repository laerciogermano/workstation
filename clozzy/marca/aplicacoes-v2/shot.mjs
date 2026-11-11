#!/usr/bin/env node
// Captura PNG de uma peça via Chrome CDP (:9290, perfil ~/chrome-profiles/clozzy-mockups).
// Uso: node shot.mjs <arquivo.html> <saida.png> [largura=1440] [altura=900] [fullPage=1]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const PORT = 9290;
const [file, out, W = '1440', H = '900', full = '1'] = process.argv.slice(2);
if (!file || !out) { console.error('uso: shot.mjs arquivo.html saida.png [w] [h] [full]'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = async (p, o) => (await fetch(`http://127.0.0.1:${PORT}${p}`, o)).json();

let up = true;
try { await j('/json/version'); } catch { up = false; }
if (!up) {
  spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    `--user-data-dir=${homedir()}/chrome-profiles/clozzy-mockups`,
    '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 40; i++) { try { await j('/json/version'); break; } catch { await sleep(250); } }
}

const { id } = await j(`/json/list`).then((l) => l.find((t) => t.type === 'page'));
const tab = (await j('/json/list')).find((t) => t.id === id);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' });
await sleep(300);
await send('Page.navigate', { url: 'file://' + resolve(file) });
await sleep(1800);
await send('Runtime.evaluate', { expression: 'scrollTo({top:0,behavior:"instant"})' });
await sleep(300);
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
let clip;
if (full === '1') {
  const m = await send('Page.getLayoutMetrics');
  const s = m.result.cssContentSize;
  clip = { x: 0, y: 0, width: s.width, height: s.height, scale: 1 };
}
const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full === '1', ...(clip ? { clip } : {}) });
writeFileSync(out, Buffer.from(r.result.data, 'base64'));
console.log('ok', out);
ws.close();
process.exit(0);
