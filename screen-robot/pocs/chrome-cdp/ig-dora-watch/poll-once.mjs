#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const DIR = dirname(fileURLToPath(import.meta.url));
const STATE = join(DIR, 'state.json');

async function getJson(path) {
  const res = await fetch(`${CDP}${path}`);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
function cdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  async function send(method, params = {}) {
    await ready;
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  return { send, close: () => { try { ws.close(); } catch {} }, ready };
}

const OUR_SNIP = 'Ainda bem que já tá melhor';

const targets = await getJson('/json/list');
const page = targets.find((t) => t.type === 'page' && String(t.url || '').includes('instagram.com'));
if (!page?.webSocketDebuggerUrl) {
  console.log(JSON.stringify({ ok: false, err: 'sem IG' }));
  process.exit(0);
}
const s = cdpSession(page.webSocketDebuggerUrl);
await s.ready;
await s.send('Runtime.enable');
const r = await s.send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const msgs = [];
    for (const el of document.querySelectorAll('div[dir="auto"]')) {
      const rect = el.getBoundingClientRect();
      if (rect.left < 280 || rect.width < 5 || rect.y < 80) continue;
      const t = (el.innerText || '').trim();
      if (!t || t.length > 400) continue;
      if (/^(Mensagem|Enviar|Curtir|doraleao|\\d{1,2}:\\d{2})$/i.test(t)) continue;
      // mine = right side of chat pane (composer ~930)
      const mine = rect.x > 850 || t.includes(${JSON.stringify(OUR_SNIP)});
      msgs.push({ t, x: Math.round(rect.x), y: Math.round(rect.y), mine });
    }
    msgs.sort((a,b)=>a.y-b.y);
    const out = [];
    for (const m of msgs) {
      if (out.length && out[out.length-1].t === m.t) continue;
      out.push(m);
    }
    return { url: location.href, msgs: out.slice(-25) };
  })()`,
});
s.close();
const data = r.result?.value || { msgs: [] };
const state = existsSync(STATE)
  ? JSON.parse(readFileSync(STATE, 'utf8'))
  : { lastSeen: null, lastOurs: OUR_SNIP, notifiedFor: null };

const last = data.msgs[data.msgs.length - 1] || null;
const newFromHer = [];
for (let i = data.msgs.length - 1; i >= 0; i--) {
  const m = data.msgs[i];
  if (m.mine || m.t.includes(OUR_SNIP) || (state.lastOurs && m.t === state.lastOurs)) break;
  newFromHer.unshift(m.t);
}

const fingerprint = newFromHer.join(' || ') || null;
const hasNew =
  fingerprint &&
  fingerprint !== state.notifiedFor &&
  fingerprint !== state.lastSeen;

if (hasNew) {
  state.notifiedFor = fingerprint;
  state.pending = newFromHer;
  state.checkedAt = new Date().toISOString();
  writeFileSync(STATE, JSON.stringify(state, null, 2));
  console.log(
    'AGENT_LOOP_WAKE_dora ' +
      JSON.stringify({
        prompt:
          'Dora respondeu no Instagram. Leia ig-dora-watch/state.json pending, proponha a melhor resposta e PEÇA confirmação ao usuário antes de enviar.',
        pending: newFromHer,
      }),
  );
} else {
  state.checkedAt = new Date().toISOString();
  state.last = last;
  writeFileSync(STATE, JSON.stringify({ ...state, lastPreview: last }, null, 2));
  console.log(JSON.stringify({ ok: true, waiting: true, last: last?.t?.slice(0, 80), newFromHer }));
}
