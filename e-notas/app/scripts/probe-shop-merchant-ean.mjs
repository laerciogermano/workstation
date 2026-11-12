import { connect } from '../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await connect({
  cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9223',
  url:
    'https://www.google.com/search?udm=28&hl=pt-BR&gl=br&q=' +
    encodeURIComponent('COCA COLA 2L'),
});
await sleep(3000);

const card = await page.evaluate(`(() => {
  const nodes = [...document.querySelectorAll('div')];
  for (const el of nodes) {
    const t = (el.innerText || '').replace(/\\s+/g, ' ').trim();
    if (t.length < 20 || t.length > 160) continue;
    if (!/coca\\s*cola/i.test(t) || !/R\\$/.test(t)) continue;
    if (/Abaixo de|entre R|Acima de|Ordenar/.test(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 80 || r.top < 80) continue;
    return { t: t.slice(0, 100), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 40) };
  }
  return null;
})()`);
console.log('card', card);
if (!card) {
  page.close();
  process.exit(1);
}
await page.clickAt(card.x, card.y);
await sleep(3500);

const panel = await page.evaluate(`(() => {
  const links = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const t = (a.innerText || a.getAttribute('aria-label') || '')
      .replace(/\\s+/g, ' ')
      .trim();
    const href = a.href || '';
    if (!href) continue;
    const blob = (t + ' ' + href).toLowerCase();
    const external = /^https?:\\/\\//i.test(href) && !/\\.google\\./i.test(href);
    const interesting =
      external ||
      /visitar|loja|comprar|magalu|mercado|americanas|carrefour|oferta|site da loja/.test(
        blob,
      );
    if (!interesting) continue;
    const r = a.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    links.push({
      t: t.slice(0, 80),
      href: href.slice(0, 200),
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
      external,
    });
  }
  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  }).slice(0, 20);
})()`);
console.log('panel links', JSON.stringify(panel, null, 2));

let merchants = (panel || []).filter((l) => l.external).slice(0, 3);
if (!merchants.length) {
  merchants = (panel || [])
    .filter((l) => /visitar|comprar|loja|magalu|mercado/i.test(l.t + l.href))
    .slice(0, 3);
}
console.log('merchants', merchants.length, merchants.map((m) => m.t || m.href.slice(0, 60)));

const findings = [];
for (const m of merchants) {
  console.log('\nOPEN', m.t || '(sem texto)', m.href.slice(0, 120));
  const tabsBefore = await page.evaluate(`window.openTabsMarker = 1; location.href`);
  if (m.external) {
    await page.goto(m.href);
  } else {
    await page.clickAt(m.x, m.y);
    await sleep(5000);
  }
  await sleep(4000);

  const info = await page.evaluate(`(() => {
    const text = document.body?.innerText || '';
    const html = document.documentElement?.innerHTML || '';
    const eans = new Set();
    const push = (s) => {
      const d = String(s || '').replace(/\\D/g, '');
      if (d.length >= 8 && d.length <= 14) eans.add(d);
    };
    for (const m of text.matchAll(
      /(?:EAN|GTIN|UPC|código de barras|codigo de barras|Cód\\.? de barras)[^\\d]{0,40}(\\d{8,14})/gi,
    )) {
      push(m[1]);
    }
    for (const m of html.matchAll(
      /"(?:gtin13?|gtin|ean|upc|barcode)"\\s*:\\s*"?(\\d{8,14})"?/gi,
    )) {
      push(m[1]);
    }
    for (const m of text.matchAll(/\\b(789\\d{10})\\b/g)) push(m[1]);
    for (const m of html.matchAll(/\\b(789\\d{10})\\b/g)) push(m[1]);
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const walk = (o) => {
          if (!o || typeof o !== 'object') return;
          for (const [k, v] of Object.entries(o)) {
            if (/gtin|ean|upc|barcode/i.test(k)) push(v);
            else if (v && typeof v === 'object') walk(v);
          }
        };
        walk(JSON.parse(s.textContent || ''));
      } catch (_) {}
    }
    return {
      href: location.href,
      title: document.title,
      eans: [...eans],
      hasWord: /ean|gtin|código de barras|codigo de barras/i.test(text),
      img: document.querySelector('meta[property="og:image"]')?.content || null,
      sample: text.replace(/\\s+/g, ' ').trim().slice(0, 280),
    };
  })()`);
  console.log(JSON.stringify(info, null, 2));
  findings.push({ merchant: m.t, ...info });

  await page.goto(
    'https://www.google.com/search?udm=28&hl=pt-BR&gl=br&q=' +
      encodeURIComponent('COCA COLA 2L'),
  );
  await sleep(2800);
  await page.clickAt(card.x, card.y);
  await sleep(2800);
}

console.log('\n=== RESULTADO ===');
console.log(
  JSON.stringify(
    findings.map((f) => ({
      merchant: f.merchant,
      title: (f.title || '').slice(0, 90),
      href: (f.href || '').slice(0, 120),
      eans: f.eans,
      hasWord: f.hasWord,
      img: (f.img || '').slice(0, 100),
    })),
    null,
    2,
  ),
);
page.close();
process.exit(0);
