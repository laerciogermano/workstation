#!/usr/bin/env node
/**
 * A/B foco: mesma trajetória CDP com tela em foco vs sem foco.
 * Sem foco → deve ser robô.
 *
 *   CDP_URL=http://127.0.0.1:9230 node test-cdp-focus.mjs
 */
import { execFileSync } from 'node:child_process';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const SITE = process.env.BOT_LAB_URL || 'http://127.0.0.1:8766/';

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page =
  targets.find((t) => t.type === 'page' && String(t.url || '').includes('8766')) ||
  targets.find((t) => t.type === 'page');
if (!page) throw new Error('sem page CDP — suba start-germano.sh');

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

const evalRv = async (expression) => {
  const { result } = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.subtype === 'error') throw new Error(result.description);
  return result.value;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const activate = (app) => {
  try {
    execFileSync('osascript', ['-e', `tell application "${app}" to activate`]);
  } catch {
    /* ignore */
  }
};

const snapshot = async (label) => {
  const s = await evalRv(`({
    label: ${JSON.stringify(label)},
    verdict: document.getElementById('score-verdict')?.textContent?.trim(),
    meta: document.getElementById('score-meta')?.textContent?.trim(),
    focusNow: document.getElementById('m-focus')?.textContent?.trim(),
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    trusted: document.getElementById('m-trusted')?.textContent?.trim(),
    points: document.getElementById('m-points')?.textContent?.trim(),
    clicks: document.getElementById('m-clicks')?.textContent?.trim(),
    behavior: [...document.querySelectorAll('#behavior-list li')].map((li) =>
      li.innerText.replace(/\\s+/g, ' ').trim(),
    ),
  })`);
  console.log(`\n======== ${label} ========`);
  console.log('veredicto:', s.verdict);
  console.log('meta:', s.meta);
  console.log('focusNow / hasFocus / vis:', s.focusNow, '/', s.hasFocus, '/', s.visibility);
  console.log('trusted / points / clicks:', s.trusted, '/', s.points, '/', s.clicks);
  for (const b of s.behavior) console.log(' ·', b);
  return s;
};

const centerOf = async (selector) =>
  evalRv(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);

const cdpMove = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
const cdpClick = async (x, y) => {
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
};

const humanishClicks = async () => {
  const start = { x: 40, y: 40 };
  const target = await centerOf('#btn-primary');
  if (!target) throw new Error('#btn-primary não encontrado');
  const steps = 25;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = start.x + (target.x - start.x) * e + (Math.random() * 2 - 1);
    const y = start.y + (target.y - start.y) * e + (Math.random() * 2 - 1);
    await cdpMove(x, y);
    await sleep(12 + Math.floor(Math.random() * 18));
  }
  for (let i = 0; i < 4; i++) {
    await cdpClick(target.x + (Math.random() * 4 - 2), target.y + (Math.random() * 4 - 2));
    await sleep(180 + Math.floor(Math.random() * 220));
  }
};

const reset = async () => {
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Page.navigate', { url: SITE });
  await sleep(1200);
  await evalRv(`document.getElementById('btn-reset')?.click(); 'ok'`);
  await sleep(200);
};

// --- COM FOCO ---
await reset();
activate('Google Chrome');
await send('Page.bringToFront');
await sleep(900);
await humanishClicks();
await sleep(400);
const withFocus = await snapshot('COM FOCO — trajetória CDP');

// --- SEM FOCO ---
await reset();
activate('Cursor');
await sleep(1000);
const pre = await evalRv(`({hasFocus:document.hasFocus(),vis:document.visibilityState})`);
console.log('\npre-sem-foco', pre);
await humanishClicks();
await sleep(400);
const noFocus = await snapshot('SEM FOCO — mesma trajetória CDP');

console.log('\n======== RESUMO FOCO ========');
console.log(`com foco  → ${withFocus.verdict}`);
console.log(`sem foco  → ${noFocus.verdict}`);

const okFocus = /humano/i.test(withFocus.verdict || '');
const okBot = /rob[oô]/i.test(noFocus.verdict || '');
if (!okFocus || !okBot) {
  console.error('FALHA aceite: esperado humano com foco e robô sem foco');
  process.exitCode = 1;
} else {
  console.log('ACEITE OK');
}

ws.close();
activate('Cursor');
