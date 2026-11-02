#!/usr/bin/env node
/**
 * Baixa threads não lidas (e Dora/Luana) do IG via CDP + mídia.
 * Uso: CDP_URL=http://127.0.0.1:9230 node fetch-ig-unread-threads.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDP = process.env.CDP_URL || 'http://127.0.0.1:9230';
const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, 'instagram-unread-laerciogermano');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(name) {
  return (
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'thread'
  );
}

async function getJson(path) {
  const res = await fetch(`${CDP}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
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
  return {
    send,
    close: () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    },
    ready,
  };
}

async function main() {
  const targets = await getJson('/json/list');
  const page = targets.find(
    (t) => t.type === 'page' && String(t.url || '').includes('instagram.com'),
  );
  if (!page?.webSocketDebuggerUrl) throw new Error('sem pagina IG');

  const s = cdpSession(page.webSocketDebuggerUrl);
  await s.ready;
  await s.send('Page.enable');
  await s.send('Runtime.enable');

  async function ev(expression) {
    const r = await s.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  }

  await s.send('Page.navigate', {
    url: 'https://www.instagram.com/direct/inbox/',
  });
  await sleep(5000);

  const inbox = await ev(`(() => {
    const threads = [];
    for (const a of document.querySelectorAll('a[href*="/direct/t/"]')) {
      const href = a.href;
      const text = (a.innerText || '').trim();
      if (!text) continue;
      const lines = text.split('\\n').map((x) => x.trim()).filter(Boolean);
      threads.push({
        href,
        name: lines[0] || '',
        preview: lines.slice(1, 6).join(' | '),
        unread: /Unread|new message|\\d+ new messages|não lida/i.test(text),
      });
    }
    const seen = new Set();
    return threads.filter((t) => {
      if (seen.has(t.href)) return false;
      seen.add(t.href);
      return true;
    });
  })()`);

  console.log('inbox', JSON.stringify(inbox, null, 2));
  const unread = (inbox || []).filter((t) => t.unread);

  async function scrapeThread(label, url) {
    await s.send('Page.navigate', { url });
    await sleep(4500);
    for (let i = 0; i < 12; i++) {
      await ev(`(() => {
        const candidates = [...document.querySelectorAll('div')].filter((d) => {
          const st = getComputedStyle(d);
          return (st.overflowY === 'auto' || st.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 50 && d.clientHeight > 200;
        });
        let best = null, bestArea = 0;
        for (const d of candidates) {
          const r = d.getBoundingClientRect();
          if (r.left < window.innerWidth * 0.28) continue;
          const area = r.width * r.height;
          if (area > bestArea) { bestArea = area; best = d; }
        }
        if (best) best.scrollTop = Math.max(0, best.scrollTop - Math.floor(best.clientHeight * 0.9));
        return !!best;
      })()`);
      await sleep(600);
    }
    await sleep(1000);

    const data = await ev(`(() => {
      const url = location.href;
      const body = document.body.innerText || '';
      const composerIdx = Math.max(body.lastIndexOf('Mensagem...'), body.lastIndexOf('\\nMensagem\\n'));
      let block = composerIdx > 0 ? body.slice(Math.max(0, composerIdx - 5000), composerIdx) : body.slice(-5000);
      for (const m of ['\\nPedidos\\n', '\\nMensagens\\nPedidos\\n']) {
        const i = block.lastIndexOf(m);
        if (i >= 0) block = block.slice(i + m.length);
      }
      const lines = block.split('\\n').map((l) => l.trim()).filter(Boolean);
      const media = [];
      for (const el of document.querySelectorAll('img, video')) {
        const r = el.getBoundingClientRect();
        if (r.left < window.innerWidth * 0.28 || r.width < 40) continue;
        const src = el.currentSrc || el.src || '';
        if (!src || /emoji|static/i.test(src)) continue;
        media.push({
          tag: el.tagName,
          alt: el.alt || '',
          w: Math.round(r.width),
          h: Math.round(r.height),
          src: src.slice(0, 500),
        });
      }
      return { url, title: document.title, lines, transcript: lines.join('\\n'), media: media.slice(0, 50) };
    })()`);

    const slug = slugify(label);
    const dir = join(OUT, slug);
    mkdirSync(dir, { recursive: true });
    const savedMedia = [];
    let i = 0;
    for (const m of data.media || []) {
      if (!/^https?:/i.test(m.src)) continue;
      if (/s150x150|stp=dst-jpg_s150|profile_pic/i.test(m.src) && m.w < 100) continue;
      try {
        const res = await fetch(m.src);
        if (!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        const ext = ct.includes('mp4')
          ? 'mp4'
          : ct.includes('webp')
            ? 'webp'
            : ct.includes('png')
              ? 'png'
              : 'jpg';
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 2000 && m.w < 120) continue;
        const fname = join(dir, `${String(++i).padStart(2, '0')}.${ext}`);
        writeFileSync(fname, buf);
        savedMedia.push({ file: fname, bytes: buf.length, alt: m.alt, w: m.w, h: m.h });
      } catch (e) {
        savedMedia.push({ error: String(e), src: m.src.slice(0, 120) });
      }
    }

    const payload = { fetchedAt: new Date().toISOString(), label, ...data, savedMedia };
    writeFileSync(join(dir, 'thread.json'), JSON.stringify(payload, null, 2));
    writeFileSync(
      join(dir, 'thread.txt'),
      [`# ${label}`, `url: ${data.url}`, '', data.transcript].join('\n'),
    );
    return { label, url: data.url, transcript: data.transcript, savedMedia };
  }

  const results = [];
  const doraKnown = 'https://www.instagram.com/direct/t/106642984069414/';
  const doraFromList = (inbox || []).find((t) => /dora/i.test(t.name));
  results.push(await scrapeThread('Dora_Leao', doraFromList?.href || doraKnown));

  const luana = (inbox || []).find((t) => /luana/i.test(t.name));
  if (luana) results.push(await scrapeThread('Luana', luana.href));

  for (const t of unread) {
    if (/dora|luana/i.test(t.name)) continue;
    results.push(await scrapeThread(t.name, t.href));
  }

  writeFileSync(
    join(OUT, 'resumo.json'),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        inboxUnread: unread,
        results: results.map((r) => ({
          label: r.label,
          url: r.url,
          savedMedia: r.savedMedia,
          transcript: r.transcript,
        })),
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      results.map((r) => ({
        label: r.label,
        url: r.url,
        media: r.savedMedia?.length,
        transcript: r.transcript?.slice(0, 2500),
      })),
      null,
      2,
    ),
  );
  s.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
