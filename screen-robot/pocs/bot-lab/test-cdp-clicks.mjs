#!/usr/bin/env node
/**
 * Testa bot-lab via CDP: cliques JS (el.click / dispatchEvent) vs Input.dispatchMouseEvent.
 *
 *   CDP_URL=http://127.0.0.1:9230 node test-cdp-clicks.mjs
 */
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

const snapshot = async (label) => {
  const s = await evalRv(`({
    label: ${JSON.stringify(label)},
    verdict: document.getElementById('score-verdict')?.textContent?.trim(),
    meta: document.getElementById('score-meta')?.textContent?.trim(),
    trusted: document.getElementById('m-trusted')?.textContent?.trim(),
    points: document.getElementById('m-points')?.textContent?.trim(),
    clicks: document.getElementById('m-clicks')?.textContent?.trim(),
    log: document.getElementById('ui-log')?.textContent?.trim(),
    behavior: [...document.querySelectorAll('#behavior-list li')].map((li) =>
      li.innerText.replace(/\\s+/g, ' ').trim(),
    ),
  })`);
  console.log(`\n======== ${label} ========`);
  console.log('veredicto:', s.verdict);
  console.log('meta:', s.meta);
  console.log('trusted / points / clicks:', s.trusted, '/', s.points, '/', s.clicks);
  console.log('log:', s.log);
  for (const b of s.behavior) console.log(' ·', b);
  return s;
};

const resetPage = async () => {
  await send('Page.enable');
  await send('Page.navigate', { url: SITE });
  await sleep(1200);
  await evalRv(`document.getElementById('btn-reset')?.click(); 'ok'`);
  await sleep(200);
};

const centerOf = async (selector) =>
  evalRv(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);

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

const cdpMove = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
};

await resetPage();
await snapshot('baseline (após reload)');

// TEST 1 — JS el.click
await evalRv(`(() => {
  const b = document.getElementById('btn-primary');
  for (let i = 0; i < 5; i++) b.click();
  document.getElementById('btn-secondary').click();
  document.getElementById('link-demo').click();
  return 'js-clicks-done';
})()`);
await sleep(400);
const t1 = await snapshot('TEST1 JS el.click() ×5+2 (sem mouse)');

// TEST 2 — JS dispatchEvent
await evalRv(`document.getElementById('btn-reset')?.click(); 'reset'`);
await sleep(150);
await evalRv(`(() => {
  const fire = (sel) => {
    const el = document.querySelector(sel);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  };
  for (let i = 0; i < 4; i++) fire('#btn-primary');
  fire('#btn-secondary');
  return 'dispatch-done';
})()`);
await sleep(300);
const t2 = await snapshot('TEST2 JS dispatchEvent(MouseEvent) ×5');

// TEST 3 — CDP sem mouseMoved
await evalRv(`document.getElementById('btn-reset')?.click(); 'reset'`);
await sleep(150);
const p = await centerOf('#btn-primary');
if (!p) throw new Error('btn-primary não encontrado');
for (let i = 0; i < 5; i++) {
  await cdpClick(p.x, p.y);
  await sleep(30);
}
const sec = await centerOf('#btn-secondary');
await cdpClick(sec.x, sec.y);
await sleep(300);
const t3 = await snapshot('TEST3 CDP dispatchMouseEvent sem mouseMoved ×6');

// TEST 4 — CDP com trajetória
await evalRv(`document.getElementById('btn-reset')?.click(); 'reset'`);
await sleep(150);
const start = { x: 40, y: 40 };
const target = await centerOf('#btn-primary');
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
const handle = await centerOf('#drag-handle');
if (handle) {
  await cdpMove(handle.x, handle.y);
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: handle.x,
    y: handle.y,
    button: 'left',
    clickCount: 1,
  });
  for (let i = 1; i <= 20; i++) {
    await cdpMove(handle.x + (i / 20) * 160, handle.y);
    await sleep(15);
  }
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: handle.x + 160,
    y: handle.y,
    button: 'left',
    clickCount: 1,
  });
}
await sleep(400);
const t4 = await snapshot('TEST4 CDP mouseMoved + cliques espaçados + drag');

console.log('\n======== RESUMO ========');
for (const [name, s] of [
  ['JS el.click', t1],
  ['JS dispatchEvent', t2],
  ['CDP sem move', t3],
  ['CDP com trajetória', t4],
]) {
  console.log(`${name.padEnd(22)} → ${s.verdict} | trusted=${s.trusted} | ${s.meta}`);
}

ws.close();
