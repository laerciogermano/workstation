#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const CDP = 'http://127.0.0.1:9222';
const SITE = 'https://bot.sannysoft.com/';

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page =
  targets.find((t) => t.type === 'page' && String(t.url || '').includes('sannysoft')) ||
  targets.find((t) => t.type === 'page');
if (!page) throw new Error('Chrome CDP não está na porta 9222');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = j;
});

let id = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== i) return;
      ws.removeEventListener('message', onMsg);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send('Page.enable');
await send('Page.navigate', { url: SITE });
await new Promise((r) => setTimeout(r, 4000));

const { result } = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `([...document.querySelectorAll('table tr')].map(tr => {
    const c = [...tr.querySelectorAll('th,td')].map(x => x.innerText.replace(/\\s+/g,' ').trim());
    return c.length >= 2 ? c[0] + ' => ' + c.slice(1).join(' | ') : null;
  }).filter(Boolean))`,
});
for (const line of result.value) console.log(line);

const link = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const a = [...document.querySelectorAll('a')].find((x) =>
      /fingerprint\\s*scanner/i.test(x.innerText || ''),
    );
    if (!a) return null;
    a.scrollIntoView({ block: 'center' });
    const r = a.getBoundingClientRect();
    const chromeUI = window.outerHeight - window.innerHeight;
    return {
      x: Math.round(window.screenX + r.x + r.width / 2),
      y: Math.round(window.screenY + chromeUI + r.y + r.height / 2),
    };
  })()`,
});
const { x, y } = link.result.value || {};
if (x == null) throw new Error('link Fingerprint Scanner não encontrado');

execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
await new Promise((r) => setTimeout(r, 400));
execFileSync('cliclick', [`c:${x},${y}`]);
console.log('cliclick =>', `c:${x},${y}`);
ws.close();
