#!/usr/bin/env node
const CDP = 'http://127.0.0.1:9222';
const SITE = 'https://bot.sannysoft.com/';

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
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

const click = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const a = [...document.querySelectorAll('a')].find((x) =>
      /fingerprint\\s*scanner/i.test(x.innerText || ''),
    );
    if (!a) return { ok: false, reason: 'link não encontrado' };
    a.click();
    return { ok: true, href: a.href, text: a.innerText.trim() };
  })()`,
});
console.log('click Fingerprint Scanner =>', click.result.value);
ws.close();
