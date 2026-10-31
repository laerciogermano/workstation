#!/usr/bin/env node
const CDP = 'http://127.0.0.1:9223';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) throw new Error('sem página');
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
await send('Page.bringToFront');

const queries = [
  'Alex Romão Clozzy',
  'Alex Romão ConectMax',
  'alex.romao@clozzy.com.br',
];

for (const q of queries) {
  await send('Page.navigate', {
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`,
  });
  await sleep(3500);
  const r = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const links = [...document.querySelectorAll('a[href*="/in/"]')].map((a) => ({
        href: a.href.split('?')[0],
        text: (a.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 140),
      }));
      const seen = new Set();
      const uniq = [];
      for (const L of links) {
        if (seen.has(L.href) || !L.text) continue;
        seen.add(L.href);
        uniq.push(L);
      }
      return {
        q: ${JSON.stringify(q)},
        body: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 400),
        links: uniq.slice(0, 12),
      };
    })()`,
  });
  console.log(JSON.stringify(r.result.value, null, 2));
}
ws.close();
