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

const readSignals = async (label) => {
  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `({
      label: ${JSON.stringify(label)},
      visibilityState: document.visibilityState,
      hidden: document.hidden,
      hasFocus: document.hasFocus(),
      activeElement: document.activeElement && document.activeElement.tagName,
      userActivation: !!(navigator.userActivation && navigator.userActivation.isActive),
      lastClickTrusted: window.__lastClickTrusted ?? null,
    })`,
  });
  console.log('signals =>', result.value);
  return result.value;
};

await send('Page.enable');
await send('Page.navigate', { url: SITE });
await new Promise((r) => setTimeout(r, 4000));

// captura isTrusted do próximo click na página
await send('Runtime.evaluate', {
  expression: `window.__lastClickTrusted = null;
    document.addEventListener('click', (e) => {
      window.__lastClickTrusted = e.isTrusted;
    }, true);`,
});

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
    return {
      href: a.href,
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
    };
  })()`,
});
const info = link.result.value;
if (!info) throw new Error('link Fingerprint Scanner não encontrado');

// manda o Chrome para trás (Cursor na frente) p/ simular background
try {
  execFileSync('osascript', ['-e', 'tell application "Cursor" to activate']);
} catch {
  execFileSync('osascript', ['-e', 'tell application "Terminal" to activate']);
}
await new Promise((r) => setTimeout(r, 800));

await readSignals('antes do click (Chrome em background?)');

await send('Input.dispatchMouseEvent', {
  type: 'mousePressed',
  x: info.x,
  y: info.y,
  button: 'left',
  clickCount: 1,
});
await send('Input.dispatchMouseEvent', {
  type: 'mouseReleased',
  x: info.x,
  y: info.y,
  button: 'left',
  clickCount: 1,
});
console.log('cdp click =>', { x: info.x, y: info.y, href: info.href });

await new Promise((r) => setTimeout(r, 500));
await readSignals('depois do click');
ws.close();
