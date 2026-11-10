/**
 * Fansly — captura pública desktop (rápida; dismiss age/cookie só se precisar).
 * Uso: node capture-public.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectCdp, sleep } from '../../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'prints', 'desktop');
mkdirSync(OUT, { recursive: true });

const DESKTOP = {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
  screenWidth: 1440,
  screenHeight: 900,
};

async function dismissOnce(page) {
  const has = await page.evaluate(
    `/(Adult Content Warning|We use cookies)/.test(document.body?.innerText||'')`,
  );
  if (!has) return;
  await page.send('Accessibility.enable').catch(() => {});
  const ax = await page.send('Accessibility.getFullAXTree');
  for (const label of ['Enter', 'Accept All']) {
    const n = (ax.nodes || []).find((x) => x.name?.value === label && x.backendDOMNodeId);
    if (!n) continue;
    try {
      const { model } = await page.send('DOM.getBoxModel', { backendNodeId: n.backendDOMNodeId });
      const [x1, y1, , , x3, y3] = model.content;
      await page.clickAt(Math.round((x1 + x3) / 2), Math.round((y1 + y3) / 2));
      await sleep(600);
    } catch {}
  }
}

async function goto(page, url) {
  await page.send('Emulation.setDeviceMetricsOverride', DESKTOP);
  await page.goto(url, { waitUntil: 'complete', timeoutMs: 40000 });
  await sleep(1400);
  await dismissOnce(page);
}

async function shot(page, name) {
  const buf = await page.screenshot();
  writeFileSync(join(OUT, `${name}.png`), buf);
  const href = await page.evaluate('location.href');
  const text = await page.evaluate(`(document.body?.innerText||'').slice(0,4000)`);
  writeFileSync(join(OUT, `_${name}.txt`), `URL: ${href}\n\n${text}`);
  console.log('OK', name, href, buf.length);
  return { href, text };
}

const page = await connectCdp('fansly');
const pages = [
  ['09-dmca', 'https://fansly.com/dmca'],
  ['10-help', 'https://help.fansly.com/en/'],
  ['11-help-search-ai', 'https://help.fansly.com/en/?q=artificial%20intelligence'],
  ['12-help-search-ai2', 'https://help.fansly.com/en/?q=AI'],
  ['13-help-search-deepfake', 'https://help.fansly.com/en/?q=deepfake'],
  ['14-contact', 'https://fansly.com/contact'],
  ['15-usc2257', 'https://fansly.com/usc2257'],
];

for (const [name, url] of pages) {
  try {
    await goto(page, url);
    await shot(page, name);
  } catch (e) {
    console.log('FAIL', name, e.message);
  }
}

// Collect AI-related help article links from search pages already loaded + crawl known URLs
const knownAiUrls = [
  'https://help.fansly.com/en/articles/7940775-ai-generated-content-policy',
  'https://help.fansly.com/en/collections/3829480-policies',
  'https://help.fansly.com/en/articles/7940775-what-is-fansly-s-policy-on-ai-generated-content',
  'https://help.fansly.com/en/articles/8821239-ai-generated-content',
];

const aiHits = [];
for (const url of knownAiUrls) {
  try {
    await goto(page, url);
    const r = await shot(page, `20-ai-${aiHits.length}`);
    aiHits.push({ url: r.href, title: (r.text || '').split('\n')[0] });
  } catch (e) {
    console.log('AI url fail', url, e.message);
  }
}

// Search help via evaluate links on search page
await goto(page, 'https://help.fansly.com/en/');
await sleep(1000);
const links = await page.evaluate(`([...document.querySelectorAll('a[href]')].map(a=>({t:(a.innerText||'').trim().slice(0,120),h:a.href})).filter(x=>/ai|artificial|deepfake|generated|bot|automati/i.test(x.t+' '+x.h)).slice(0,50))`);
writeFileSync(join(__dirname, '_help-ai-links.json'), JSON.stringify({ links, aiHits }, null, 2));
console.log('links', links.length, links.slice(0, 15));

// Extract AI clauses from ToS text via page
await goto(page, 'https://fansly.com/tos');
await sleep(800);
const tosAi = await page.evaluate(`(() => {
  const t = document.body?.innerText || '';
  const idx = t.search(/artificial intelligence|AI[- ]generated|deepfake|machine learning|chatbot/i);
  if (idx < 0) return { found: false, snippet: '' };
  return { found: true, snippet: t.slice(Math.max(0, idx - 200), idx + 800) };
})()`);
writeFileSync(join(__dirname, '_tos-ai.json'), JSON.stringify(tosAi, null, 2));
console.log('tosAi', tosAi.found, (tosAi.snippet || '').slice(0, 200));

page.close();
console.log('DONE public');
