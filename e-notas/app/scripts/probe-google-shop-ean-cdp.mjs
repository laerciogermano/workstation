/**
 * Probe: Google Shopping "COCA COLA 2L" via CDP → abre anúncios → procura EAN/GTIN.
 * CDP_URL=http://127.0.0.1:9223 node scripts/probe-google-shop-ean-cdp.mjs
 */
import {
  createCdpSession,
  getJson,
  openPage,
} from '../../../screen-robot/pocs/chrome-cdp/human-cdp/src/cdp.mjs';

const CDP = (process.env.CDP_URL || 'http://127.0.0.1:9223').replace(/\/$/, '');
const QUERY = process.env.Q || 'COCA COLA 2L';
const MAX_ADS = Number(process.env.MAX_ADS || 5);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function attach(url) {
  const target = await openPage(CDP, url);
  const session = createCdpSession(target.webSocketDebuggerUrl);
  await session.ready;
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await sleep(2200);
  return { session, target };
}

async function evaluate(session, expression, awaitPromise = false) {
  const r = await session.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (r?.exceptionDetails) {
    throw new Error(r.exceptionDetails.text || 'evaluate error');
  }
  return r?.result?.value;
}

async function closeTarget(target) {
  try {
    const ver = await getJson(CDP, '/json/version');
    const browser = createCdpSession(ver.webSocketDebuggerUrl);
    await browser.ready;
    const tid = target.id || target.targetId;
    if (tid) await browser.send('Target.closeTarget', { targetId: tid }).catch(() => {});
    browser.close();
  } catch {
    /* ignore */
  }
}

const shopUrl =
  `https://www.google.com/search?tbm=shop&hl=pt-BR&gl=br&q=${encodeURIComponent(QUERY)}`;

console.log('CDP', CDP);
console.log('QUERY', QUERY);
console.log('SHOP', shopUrl);

const { session, target } = await attach(shopUrl);
await evaluate(session, `window.scrollBy(0, 1200)`);
await sleep(1000);

const ads = await evaluate(
  session,
  `(() => {
    const out = [];
    const seen = new Set();
    const push = (title, href, price, img) => {
      if (!href || seen.has(href)) return;
      if (!/^https?:/i.test(href)) return;
      if (/google\\.[^/]+\\/search/i.test(href) && !/tbm=shop|shopping/i.test(href)) return;
      seen.add(href);
      out.push({
        title: (title || '').replace(/\\s+/g, ' ').trim().slice(0, 120),
        href,
        price: (price || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        img: img || null,
      });
    };

    // cards / links de produto
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.href || '';
      const t = (a.getAttribute('aria-label') || a.textContent || '').trim();
      if (t.length < 8) continue;
      if (!/coca|cola|refrigerante/i.test(t + ' ' + href)) continue;
      // shopping product links often go through google.com/url or merchant
      const img = a.querySelector('img')?.src || null;
      const priceEl = a.closest('div')?.innerText?.match(/R\\$\\s*[\\d.,]+/);
      push(t.slice(0, 120), href, priceEl ? priceEl[0] : '', img);
      if (out.length >= 30) break;
    }

    // fallback: qualquer link com img e preço próximo
    if (out.length < 3) {
      for (const a of document.querySelectorAll('a[href*="http"]')) {
        const img = a.querySelector('img');
        if (!img) continue;
        const block = (a.closest('div')?.innerText || a.textContent || '').slice(0, 200);
        if (!/R\\$|coca|cola/i.test(block)) continue;
        push(block.split('\\n')[0], a.href, (block.match(/R\\$\\s*[\\d.,]+/)||[])[0], img.src);
        if (out.length >= 20) break;
      }
    }
    return out.slice(0, 20);
  })()`,
);

console.log('\\nAnúncios/cards encontrados:', ads?.length || 0);
for (const [i, a] of (ads || []).entries()) {
  console.log(`  [${i}] ${a.price || '-'} | ${a.title.slice(0, 80)}`);
  console.log(`      ${a.href.slice(0, 140)}`);
}

session.close();
await closeTarget(target);

const pick = (ads || []).slice(0, MAX_ADS);
const findings = [];

for (const [i, ad] of pick.entries()) {
  console.log(`\\n--- Abrindo anúncio ${i + 1}/${pick.length} ---`);
  console.log(ad.title);
  console.log(ad.href.slice(0, 160));
  let page;
  try {
    page = await attach(ad.href);
    await sleep(2500);
    await page.session.send('Runtime.evaluate', {
      expression: 'window.scrollBy(0, 1800)',
      returnByValue: true,
    });
    await sleep(800);

    const info = await evaluate(
      page.session,
      `(() => {
        const text = document.body?.innerText || '';
        const html = document.documentElement?.innerHTML || '';
        const title = document.title || '';
        const url = location.href;

        const eans = new Set();
        const pushEan = (s) => {
          const d = String(s||'').replace(/\\D/g,'');
          if (d.length >= 8 && d.length <= 14) eans.add(d);
        };

        // padrões textuais
        const reLabel = /(?:\\\\bEAN\\\\b|\\\\bGTIN\\\\b|\\\\bUPC\\\\b|código de barras|codigo de barras|cód\\\\.? barras)[^\\d]{0,24}(\\d{8,14})/gi;
        for (const m of text.matchAll(reLabel)) pushEan(m[1]);
        for (const m of html.matchAll(reLabel)) pushEan(m[1]);

        // JSON-LD
        for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
          const raw = s.textContent || '';
          try {
            const data = JSON.parse(raw);
            const walk = (o) => {
              if (!o || typeof o !== 'object') return;
              for (const [k, v] of Object.entries(o)) {
                if (/gtin|ean|upc|barcode/i.test(k) && v != null) pushEan(v);
                if (Array.isArray(v)) v.forEach(walk);
                else if (v && typeof v === 'object') walk(v);
              }
            };
            walk(data);
          } catch (_) {
            for (const m of raw.matchAll(/"(?:gtin13?|gtin|ean|upc)"\\s*:\\s*"?(\\d{8,14})"?/gi)) {
              pushEan(m[1]);
            }
          }
        }

        // meta / itemprop
        for (const el of document.querySelectorAll('[itemprop="gtin13"],[itemprop="gtin"],[itemprop="ean"], meta[property*="gtin"], meta[name*="gtin"], meta[name*="ean"]')) {
          pushEan(el.content || el.getAttribute('content') || el.textContent);
        }

        // digitos soltos perto de "789" (BR)
        for (const m of text.matchAll(/\\\\b(789\\d{10})\\\\b/g)) pushEan(m[1]);
        for (const m of html.matchAll(/\\\\b(789\\d{10})\\\\b/g)) pushEan(m[1]);

        const img =
          document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector('img[src*=\"product\"], img[src*=\"arquivos\"]')?.src ||
          document.querySelector('img')?.src ||
          null;

        return {
          finalUrl: url,
          title,
          eans: [...eans],
          img,
          snippet: text.replace(/\\s+/g, ' ').trim().slice(0, 280),
          hasEanWord: /ean|gtin|código de barras|codigo de barras/i.test(text),
        };
      })()`,
    );

    findings.push({ ad, ...info });
    console.log('URL final:', info.finalUrl?.slice(0, 120));
    console.log('EANs:', info.eans?.length ? info.eans.join(', ') : '(nenhum)');
    console.log('menciona EAN/barras?', info.hasEanWord);
    console.log('foto:', (info.img || '').slice(0, 100));
  } catch (err) {
    console.log('ERRO', err.message);
    findings.push({ ad, error: err.message });
  } finally {
    if (page) {
      page.session.close();
      await closeTarget(page.target);
    }
  }
}

console.log('\\n========== RESUMO ==========');
console.log(JSON.stringify(findings.map((f) => ({
  titulo: f.ad?.title?.slice(0, 80),
  preco: f.ad?.price,
  eans: f.eans || [],
  hasEanWord: f.hasEanWord,
  finalUrl: (f.finalUrl || f.ad?.href || '').slice(0, 100),
  error: f.error || null,
})), null, 2));

process.exit(0);
