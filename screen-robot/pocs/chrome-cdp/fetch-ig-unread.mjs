#!/usr/bin/env node
/**
 * Baixa conversas não lidas do Instagram (inbox) via CDP.
 * Uso: CDP_URL=http://127.0.0.1:9230 node fetch-ig-unread.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CDP_BASE = process.env.CDP_URL || 'http://127.0.0.1:9230';
const OUT = join(
  new URL('.', import.meta.url).pathname,
  'instagram-unread-laerciogermano',
);
mkdirSync(OUT, { recursive: true });

async function getJson(path) {
  const res = await fetch(`${CDP_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
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
  function close() {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }
  return { send, close, ready };
}

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

async function main() {
  const targets = await getJson('/json/list');
  const page = targets.find(
    (t) => t.type === 'page' && String(t.url || '').includes('instagram.com'),
  );
  if (!page?.webSocketDebuggerUrl) throw new Error('sem pagina IG no CDP');

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
  await sleep(4500);

  const unreadList = await ev(`(() => {
    const items = [];
    const nodes = [...document.querySelectorAll('div[role="listitem"], div[role="button"], a')];
    for (const el of nodes) {
      const raw = (el.innerText || '').trim();
      if (!raw || raw.length < 3) continue;
      const lines = raw.split('\\n').map((x) => x.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      const joined = lines.join(' | ');
      if (!/Unread|não lida|new message|nova mensagem|\\d+ new messages/i.test(joined) && !/Unread/i.test(raw)) continue;
      if (/conte as novidades|sua nota/i.test(raw)) continue;
      items.push({ name: lines[0], preview: lines.slice(1, 5).join(' | '), raw: raw.slice(0, 300) });
    }
    const seen = new Set();
    return items.filter((i) => {
      const k = i.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })()`);

  console.log('unreadList', JSON.stringify(unreadList, null, 2));

  async function openByName(nameHint) {
    return ev(`(() => {
      const want = ${JSON.stringify(nameHint)}.toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '');
      const strip = (s) => s.toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '').replace(/[^a-z0-9]/gi, '');
      const w2 = strip(want);
      const nodes = [...document.querySelectorAll('div[role="listitem"], div[role="button"], a')];
      for (const el of nodes) {
        const lines = (el.innerText || '').split('\\n').map((x) => x.trim()).filter(Boolean);
        if (lines.length < 2) continue;
        if (/conte as novidades|sua nota/i.test(lines.join(' '))) continue;
        const head = lines[0].toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '');
        if (head.includes(want) || strip(lines[0]).includes(w2)) {
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { ok: true, head: lines[0], preview: lines.slice(0, 6).join(' | ') };
        }
      }
      return { ok: false };
    })()`);
  }

  async function scrollChatUp(times = 8) {
    for (let i = 0; i < times; i++) {
      await ev(`(() => {
        const candidates = [...document.querySelectorAll('div')].filter((d) => {
          const st = getComputedStyle(d);
          return (st.overflowY === 'auto' || st.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 50 && d.clientHeight > 200;
        });
        let best = null, bestArea = 0;
        for (const d of candidates) {
          const r = d.getBoundingClientRect();
          if (r.left < window.innerWidth * 0.25) continue;
          const area = r.width * r.height;
          if (area > bestArea) { bestArea = area; best = d; }
        }
        if (best) best.scrollTop = Math.max(0, best.scrollTop - Math.floor(best.clientHeight * 0.85));
        return !!best;
      })()`);
      await sleep(700);
    }
  }

  async function scrapeChat() {
    return ev(`(() => {
      const url = location.href;
      const body = document.body.innerText || '';
      const media = [...document.querySelectorAll('img[src*="cdninstagram"], img[src*="fbcdn"], video source, video')]
        .map((el) => ({
          tag: el.tagName,
          alt: el.getAttribute('alt') || '',
          src: (el.currentSrc || el.src || el.getAttribute('src') || '').slice(0, 400),
        }))
        .filter((m) => m.src && !/profile|150x150|s150x150|emoji/i.test(m.src))
        .slice(0, 40);

      const composerIdx = body.lastIndexOf('Mensagem...');
      let transcript = composerIdx > 0
        ? body.slice(Math.max(0, composerIdx - 4500), composerIdx).trim()
        : body.slice(-4500);

      const noise = /^(Mensagens|Pedidos|Primary|Geral|Unread|New messages|Visto:|Conte as novidades|Sua nota)$/i;
      const cleaned = transcript.split('\\n').map((l) => l.trim()).filter((l) => l && !noise.test(l));

      return {
        url,
        title: document.title,
        transcript: cleaned.join('\\n').slice(0, 7000),
        media,
        rawTail: body.slice(-2500),
      };
    })()`);
  }

  const names =
    unreadList?.length > 0
      ? unreadList.map((u) => u.name)
      : ['Dora', 'Luana'];

  const dumps = [];
  for (const name of names) {
    await s.send('Page.navigate', {
      url: 'https://www.instagram.com/direct/inbox/',
    });
    await sleep(3500);

    const clicked = await openByName(name);
    console.log('open', name, clicked);
    await sleep(3000);
    if (!clicked?.ok) {
      dumps.push({ name, error: 'nao abriu' });
      continue;
    }
    await scrollChatUp(10);
    await sleep(1200);
    const chat = await scrapeChat();
    const slug = slugify(name);
    const jsonPath = join(OUT, `${slug}.json`);
    const txtPath = join(OUT, `${slug}.txt`);
    const payload = {
      fetchedAt: new Date().toISOString(),
      name,
      clicked,
      chat,
    };
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    writeFileSync(
      txtPath,
      [
        `# ${name}`,
        `url: ${chat.url}`,
        `fetched: ${payload.fetchedAt}`,
        '',
        chat.transcript,
        '',
        '## media',
        ...(chat.media || []).map((m) => `- ${m.tag} ${m.alt} ${m.src}`),
      ].join('\n'),
    );
    dumps.push({
      name,
      jsonPath,
      txtPath,
      url: chat.url,
      transcript: chat.transcript,
    });
  }

  writeFileSync(
    join(OUT, 'index.json'),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        unreadList,
        dumps: dumps.map((d) => ({
          name: d.name,
          jsonPath: d.jsonPath,
          txtPath: d.txtPath,
          url: d.url,
          error: d.error,
        })),
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        out: OUT,
        unreadList,
        dumps: dumps.map((d) => ({
          name: d.name,
          url: d.url,
          error: d.error,
          transcriptPreview: (d.transcript || '').slice(0, 1200),
        })),
      },
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
