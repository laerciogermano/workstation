#!/usr/bin/env node
// Captura via Chrome CDP (:9290, perfil ~/chrome-profiles/clozzy-mockups).
//   node shot.mjs <arquivo.html> --pages <dir>        # um PNG por <section> (p01.png…)
//   node shot.mjs <arquivo.html> --pdf <saida.pdf>    # PDF 1600×900 por página
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const PORT = 9290;
const [file, mode, out] = process.argv.slice(2);
if (!file || !mode || !out) { console.error('uso: shot.mjs arquivo.html --pages dir | --pdf saida.pdf'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();

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

const tab = (await j('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: mode === '--pages' ? 1 : 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' });
await sleep(300);
await send('Page.navigate', { url: 'file://' + resolve(file) });
await sleep(2500);
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
await sleep(800);

if (mode === '--pages') {
  mkdirSync(out, { recursive: true });
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify([...document.querySelectorAll("section")].map(s=>{const b=s.getBoundingClientRect();return [b.x,b.y+scrollY,b.width,b.height]}))', returnByValue: true });
  const boxes = JSON.parse(r.result.result.value);
  for (let i = 0; i < boxes.length; i++) {
    const [x, y, w, h] = boxes[i];
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x, y, width: w, height: h, scale: 1 } });
    writeFileSync(`${out}/p${String(i + 1).padStart(2, '0')}.png`, Buffer.from(s.result.data, 'base64'));
  }
  console.log('ok', boxes.length, 'páginas →', out);
} else {
  const r = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  console.log('ok', out);
}
ws.close();
process.exit(0);
