#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const CDP = 'http://127.0.0.1:9223';
const OUT =
  '/Users/laerciogermano/Documents/works/screen-robot/pocs/android-studio/assets-alex-romao';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) throw new Error('sem página CDP');

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

const q = encodeURIComponent('Alex Romão');
await send('Page.navigate', {
  url: `https://www.linkedin.com/search/results/people/?keywords=${q}`,
});
await sleep(4000);

const results = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const links = [...document.querySelectorAll('a[href*="/in/"]')].map((a) => ({
      href: a.href.split('?')[0],
      text: (a.innerText || a.getAttribute('aria-label') || '')
        .replace(/\\s+/g, ' ')
        .trim()
        .slice(0, 120),
    })).filter((x) => /\\/in\\//.test(x.href) && x.text);
    const seen = new Set();
    const uniq = [];
    for (const L of links) {
      if (seen.has(L.href)) continue;
      seen.add(L.href);
      uniq.push(L);
    }
    return {
      href: location.href,
      body: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 400),
      links: uniq.slice(0, 25),
    };
  })()`,
});
console.log('search', JSON.stringify(results.result.value, null, 2));

const links = results.result.value.links || [];
const hit =
  links.find((l) => /alex\s*rom[aã]o/i.test(l.text)) ||
  links.find((l) => /alex-romao|alexromao/i.test(l.href)) ||
  links[0];
if (!hit) throw new Error('perfil Alex não encontrado');
console.log('opening', hit);

await send('Page.navigate', { url: hit.href });
await sleep(4500);

const media = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const imgs = [...document.querySelectorAll('img')]
      .map((img) => {
        const r = img.getBoundingClientRect();
        return {
          alt: (img.alt || '').slice(0, 100),
          src: img.currentSrc || img.src || '',
          cls: String(img.className || '').slice(0, 140),
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.x),
          y: Math.round(r.y),
        };
      })
      .filter((i) => i.src && !i.src.startsWith('data:') && i.w > 20);

    const banner =
      imgs.find((i) =>
        /profile-displaybackground|background-display|profileBanner|top-card-background/i.test(
          i.src + i.cls + i.alt,
        ),
      ) ||
      imgs.filter((i) => i.y < 360 && i.w > 480).sort((a, b) => b.w * b.h - a.w * a.h)[0] ||
      null;

    const avatar =
      imgs.find((i) =>
        /profile-displayphoto|profilePicture|pv-top-card-profile-picture|presence-entity__image|EntityPhoto/i.test(
          i.src + i.cls + i.alt,
        ),
      ) ||
      imgs
        .filter(
          (i) =>
            i.y < 480 && i.w >= 64 && i.w <= 360 && Math.abs(i.w - i.h) <= 40,
        )
        .sort((a, b) => b.w - a.w)[0] ||
      null;

    const hi = (u) => {
      if (!u) return u;
      return u
        .replace(/shrink_\\d+_\\d+/, 'shrink_800_800')
        .replace(/\\/100_100\\//, '/800_800/')
        .replace(/\\/200_200\\//, '/800_800/')
        .replace(/\\/400_400\\//, '/800_800/');
    };

    return {
      href: location.href,
      title: document.title,
      h1: document.querySelector('h1')?.innerText?.trim() || '',
      avatar: avatar && { ...avatar, hi: hi(avatar.src) },
      banner: banner && { ...banner, hi: hi(banner.src) },
      topImgs: imgs.filter((i) => i.y < 520).slice(0, 18),
    };
  })()`,
});
console.log('media', JSON.stringify(media.result.value, null, 2));
const m = media.result.value;

async function download(url, base) {
  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    awaitPromise: true,
    expression: `(!async function(){
      const r = await fetch(${JSON.stringify(url)}, { credentials: 'include' });
      if (!r.ok) return { ok:false, status: r.status };
      const buf = await r.arrayBuffer();
      return { ok:true, ct: r.headers.get('content-type')||'', bytes: Array.from(new Uint8Array(buf)) };
    })()`,
  });
  const v = res.result.value;
  if (!v?.ok) throw new Error('dl fail ' + JSON.stringify(v));
  let ext = '.jpg';
  if (/png/i.test(v.ct)) ext = '.png';
  if (/webp/i.test(v.ct)) ext = '.webp';
  const file = path.join(OUT, base + ext);
  fs.writeFileSync(file, Buffer.from(v.bytes));
  return { file, bytes: v.bytes.length, ct: v.ct };
}

const saved = {};
if (m.avatar?.src) {
  saved.avatar = await download(m.avatar.hi || m.avatar.src, 'avatar');
  console.log('avatar', saved.avatar);
}
if (m.banner?.src) {
  saved.banner = await download(m.banner.hi || m.banner.src, 'banner');
  console.log('banner', saved.banner);
}

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
});
fs.writeFileSync(path.join(OUT, 'profile.png'), Buffer.from(shot.data, 'base64'));

fs.writeFileSync(
  path.join(OUT, 'meta.json'),
  JSON.stringify(
    {
      profile: m.href,
      title: m.title,
      name: m.h1,
      saved,
      avatar: m.avatar,
      banner: m.banner,
    },
    null,
    2,
  ),
);

ws.close();
if (!saved.avatar && !saved.banner) process.exit(3);
console.log('DONE', saved);
