/**
 * Imagens por EAN/descrição via Chrome CDP.
 * 1) Google tbm=isch (lab REQ-042) — em IP de datacenter costuma cair em /sorry/
 * 2) Fallback Bing Images (mesma query) — estável na Contabo
 */
import puppeteer from 'puppeteer-core';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cdpBase() {
  return String(process.env.CDP_URL || 'http://127.0.0.1:9223').replace(/\/$/, '');
}

function clampN(n, fallback = 24) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(50, Math.floor(v));
}

function decodeUrl(raw) {
  return String(raw || '')
    .replace(/\\u003d/gi, '=')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/')
    .trim();
}

function isUsableImageUrl(u, { allowTbn = false } = {}) {
  if (!u || typeof u !== 'string') return false;
  if (!/^https:\/\//i.test(u)) return false;
  if (!allowTbn && /encrypted-tbn|gstatic\.com\/(images\?|gb\/|og\/)/i.test(u)) return false;
  if (/google\.[a-z.]+\/(tia\/|logos|images\/branding)|logo|sprite|favicon|data:image|al-icon/i.test(u)) {
    return false;
  }
  if (u.length > 2500) return false;
  return true;
}

const EXTRACT_GOOGLE_JS = `(() => {
  const seen = new Set();
  const out = [];
  const push = (u) => {
    if (!u || typeof u !== 'string') return;
    let s = u.trim();
    if (!/^https?:\\/\\//i.test(s)) return;
    if (/google\\.[a-z.]+\\/tia\\/|logo|favicon|data:image|al-icon/i.test(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  for (const img of document.querySelectorAll('img')) {
    push(img.currentSrc || img.src);
    push(img.getAttribute('data-src'));
    push(img.getAttribute('data-iurl'));
  }
  for (const a of document.querySelectorAll('a[href*="imgurl="]')) {
    try {
      const href = a.href || '';
      const m = href.match(/[?&]imgurl=([^&]+)/);
      if (m) push(decodeURIComponent(m[1]));
    } catch (_) {}
  }
  const html = document.documentElement.innerHTML;
  for (const m of html.matchAll(/"ou"\\s*:\\s*"(https?:[^"]+)"/g)) push(m[1]);
  for (const m of html.matchAll(/"(https?:\\/\\/[^"]+\\.(?:jpg|jpeg|png|webp|gif)(?:\\?[^"]*)?)"/gi)) {
    push(m[1]);
  }
  return { href: location.href, title: document.title, urls: out };
})()`;

const EXTRACT_BING_JS = `(() => {
  const seen = new Set();
  const out = [];
  const push = (u) => {
    if (!u || typeof u !== 'string') return;
    let s = u.trim();
    if (!/^https?:\\/\\//i.test(s)) return;
    if (/bing\\.com\\/(sa|rp|th)\\?id=OS|favicon|data:image/i.test(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  for (const a of document.querySelectorAll('a.iusc')) {
    try {
      const m = JSON.parse(a.getAttribute('m') || '{}');
      push(m.murl);
      push(m.turl);
    } catch (_) {}
  }
  for (const img of document.querySelectorAll('img.mimg')) push(img.currentSrc || img.src);
  return { href: location.href, title: document.title, urls: out };
})()`;

export async function cdpImagesAvailable() {
  try {
    const res = await fetch(`${cdpBase()}/json/version`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function withPage(fn) {
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: cdpBase(),
      defaultViewport: { width: 1280, height: 900 },
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    );
    try {
      return await fn(page);
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    try {
      browser?.disconnect();
    } catch {
      /* ignore */
    }
  }
}

function pack(urls, source, want, { allowTbn = false } = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of urls) {
    const url = decodeUrl(raw);
    if (!isUsableImageUrl(url, { allowTbn }) || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, source });
    if (out.length >= want) break;
  }
  return out;
}

async function scrapeGoogle(page, query, want) {
  const searchUrl =
    `https://www.google.com/search?tbm=isch` +
    `&q=${encodeURIComponent(query)}` +
    `&hl=pt-BR&gl=br&safe=active`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 });
  await sleep(1800);
  // consent
  try {
    const btn = await page.$('button[aria-label*="Aceitar"], button[aria-label*="Accept"], #L2AGLb');
    if (btn) {
      await btn.click();
      await sleep(1000);
    }
  } catch {
    /* ignore */
  }
  for (let i = 0; i < Math.min(3, Math.ceil(want / 16)); i += 1) {
    await page.evaluate(() => window.scrollBy(0, 1600));
    await sleep(500);
  }
  const raw = await page.evaluate(EXTRACT_GOOGLE_JS);
  const href = String(raw?.href || '');
  if (/\/sorry\/|unusual traffic|captcha/i.test(href) || /\/sorry\//i.test(String(raw?.title || ''))) {
    return { blocked: true, imagens: [] };
  }
  const prefer = pack(raw?.urls || [], 'Google', want, { allowTbn: false });
  if (prefer.length) return { blocked: false, imagens: prefer };
  // thumbs gstatic se não houver "ou"
  return { blocked: false, imagens: pack(raw?.urls || [], 'Google', want, { allowTbn: true }) };
}

async function scrapeBing(page, query, want) {
  const searchUrl =
    `https://www.bing.com/images/search?q=${encodeURIComponent(query)}` +
    `&form=HDRSC2&first=1&tsc=ImageHoverTitle`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 });
  await sleep(1800);
  try {
    const btn = await page.$('#bnp_btn_accept, button#bnp_btn_accept');
    if (btn) {
      await btn.click();
      await sleep(800);
    }
  } catch {
    /* ignore */
  }
  for (let i = 0; i < Math.min(3, Math.ceil(want / 20)); i += 1) {
    await page.evaluate(() => window.scrollBy(0, 1600));
    await sleep(500);
  }
  const raw = await page.evaluate(EXTRACT_BING_JS);
  return pack(raw?.urls || [], 'Bing', want);
}

/**
 * @param {string} query
 * @param {{ n?: number }} [opts]
 * @returns {Promise<{ url: string, source: string }[]>}
 */
export async function searchGoogleImagens(query, opts = {}) {
  const q = String(query ?? '').trim();
  if (!q) return [];
  const want = clampN(opts.n, 24);
  if (!(await cdpImagesAvailable())) return [];

  try {
    return await withPage(async (page) => {
      const google = await scrapeGoogle(page, q, want);
      if (!google.blocked && google.imagens.length) return google.imagens;
      if (google.blocked) {
        console.warn('[google-imagens] Google bloqueou IP (sorry/captcha) — fallback Bing');
      }
      const bing = await scrapeBing(page, q, want);
      return bing;
    });
  } catch (err) {
    console.warn('[google-imagens]', err.message || err);
    return [];
  }
}
