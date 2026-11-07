/**
 * Google Imagens por scraping no Chrome CDP (sem API key).
 * Query = descrição OU EAN → abre tbm=isch, lê as N primeiras e baixa.
 * Requer Chrome com --remote-debugging-port (CDP_URL, default :9223).
 */
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { URL } from 'url';
import {
  createCdpSession,
  getJson,
  openPage,
} from '../../screen-robot/pocs/chrome-cdp/human-cdp/src/cdp.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const GOOGLE_IMAGENS_DIR = path.join(__dirname, 'public', 'google-imagens');
export const SCRAPE_HARD_MAX = 100;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clampN(n, fallback = 50) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(SCRAPE_HARD_MAX, Math.floor(v));
}

function cdpBase() {
  return String(process.env.CDP_URL || 'http://127.0.0.1:9223').replace(/\/$/, '');
}

function decodeUrl(raw) {
  let s = String(raw || '');
  try {
    s = s
      .replace(/\\u003d/g, '=')
      .replace(/\\u0026/g, '&')
      .replace(/\\u002F/gi, '/')
      .replace(/\\\//g, '/');
  } catch {
    /* ignore */
  }
  return s.trim();
}

function isUsableImageUrl(u) {
  if (!/^https?:\/\//i.test(u)) return false;
  if (/encrypted-tbn\d*\.gstatic\.com/i.test(u)) return false;
  if (/gstatic\.com\/(images\?|gb\/|og\/)/i.test(u)) return false;
  if (/google\.[a-z.]+\/(tia\/|logos|images\/branding|\/xjs\/)/i.test(u)) return false;
  if (/\/tia\/tia\.png/i.test(u)) return false;
  if (/logo|sprite|favicon|data:image|al-icon/i.test(u)) return false;
  if (u.length > 2500) return false;
  // thumbs muito pequenas / UI chrome
  if (/\b(w|h|width|height)=([1-9]|[1-4]\d)\b/i.test(u) && /gstatic|google/i.test(u)) {
    return false;
  }
  return true;
}

export function extractImageUrlsFromHtml(html) {
  const text = String(html || '');
  const seen = new Set();
  const out = [];
  const push = (raw) => {
    const u = decodeUrl(raw);
    if (!isUsableImageUrl(u) || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  for (const m of text.matchAll(/"ou"\s*:\s*"(https?:[^"]+)"/g)) push(m[1]);
  for (const m of text.matchAll(/"ou"\s*:\s*"(https?:\\\/\\\/[^"]+)"/g)) push(m[1]);
  for (const m of text.matchAll(
    /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)",\s*\d+,\s*\d+\]/gi,
  )) {
    push(m[1]);
  }
  for (const m of text.matchAll(
    /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"]*)?)"/gi,
  )) {
    push(m[1]);
  }
  for (const m of text.matchAll(/[?&]imgurl=(https?[^&"']+)/gi)) {
    try {
      push(decodeURIComponent(m[1]));
    } catch {
      push(m[1]);
    }
  }
  return out;
}

const EXTRACT_JS = `(() => {
  const seen = new Set();
  const out = [];
  const push = (u) => {
    if (!u || typeof u !== 'string') return;
    let s = u.trim();
    if (!/^https?:\\/\\//i.test(s)) return;
    if (/encrypted-tbn|gstatic\\.com\\/(images\\?|gb\\/)|google\\.[a-z.]+\\/tia\\/|logo|favicon|data:image|al-icon/i.test(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  for (const img of document.querySelectorAll('img')) {
    push(img.currentSrc || img.src);
    push(img.getAttribute('data-src'));
    push(img.getAttribute('data-iurl'));
  };
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
  return out;
})()`;

async function withCdpPage(url, fn) {
  const base = cdpBase();
  try {
    await getJson(base, '/json/version');
  } catch {
    throw Object.assign(
      new Error(
        `Chrome CDP indisponível em ${base}. Suba com --remote-debugging-port (ex.: start-laercio-germano.sh)`,
      ),
      { status: 503 },
    );
  }

  const target = await openPage(base, url);
  const ws = target.webSocketDebuggerUrl;
  if (!ws) throw Object.assign(new Error('aba CDP sem WebSocket'), { status: 502 });
  const session = createCdpSession(ws);
  await session.ready;
  try {
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Network.enable').catch(() => {});
    // openPage já navega; garante reload se about:blank
    const cur = await session.send('Runtime.evaluate', {
      expression: 'location.href',
      returnByValue: true,
    });
    const href = cur?.result?.value || '';
    if (!String(href).includes('tbm=isch')) {
      await session.send('Page.navigate', { url });
      await sleep(2500);
    } else {
      await sleep(1800);
    }
    // scroll para carregar mais thumbs
    await session.send('Runtime.evaluate', {
      expression:
        `(() => { window.scrollBy(0, Math.min(document.body.scrollHeight, 2400)); return true; })()`,
      returnByValue: true,
    });
    await sleep(1200);
    return await fn(session, target);
  } finally {
    try {
      const browserVer = await getJson(base, '/json/version');
      const browser = createCdpSession(browserVer.webSocketDebuggerUrl);
      await browser.ready;
      const tid = target.id || target.targetId;
      if (tid) {
        await browser.send('Target.closeTarget', { targetId: tid }).catch(() => {});
      }
      browser.close();
    } catch {
      /* ignore */
    }
    session.close();
  }
}

async function googleCacheDb() {
  return import('./db.js');
}

/**
 * Scraping Google Imagens via Chrome (JS renderizado).
 * Sem `force`, devolve URLs já cacheadas no banco (não reabre CDP).
 */
export async function searchGoogleImages(query, { n = 50, force = false } = {}) {
  const q = String(query ?? '').trim();
  if (!q) {
    throw Object.assign(new Error('query obrigatória (descricao ou ean)'), {
      status: 400,
    });
  }
  const want = clampN(n, 50);
  const {
    normalizeGoogleQuery,
    getGoogleImagensBusca,
    listGoogleImagensCache,
    saveGoogleImagensCache,
  } = await googleCacheDb();
  const queryNorm = normalizeGoogleQuery(q);
  const slug = slugFor({ query: q });

  if (!force) {
    const busca = await getGoogleImagensBusca(queryNorm);
    if (busca) {
      const rows = await listGoogleImagensCache(queryNorm);
      const items = rows
        .map((r) => ({
          url: r.url_origem,
          title: '',
          fonte: r.fonte || 'google-imagens',
          path_local: r.path_local || null,
        }))
        .filter((it) => it.url)
        .slice(0, want);
      return {
        query: q,
        n: want,
        items,
        cached: true,
        query_norm: queryNorm,
      };
    }
  }

  const searchUrl =
    `https://www.google.com/search?tbm=isch` +
    `&q=${encodeURIComponent(q)}` +
    `&hl=pt-BR&gl=br&safe=active`;

  const urls = await withCdpPage(searchUrl, async (session) => {
    // mais scroll se pedir muitas imagens
    const scrolls = Math.min(6, Math.ceil(want / 20));
    for (let i = 0; i < scrolls; i += 1) {
      await session.send('Runtime.evaluate', {
        expression: `window.scrollBy(0, 1600)`,
        returnByValue: true,
      });
      await sleep(700);
    }
    const evaled = await session.send('Runtime.evaluate', {
      expression: EXTRACT_JS,
      returnByValue: true,
      awaitPromise: false,
    });
    let list = evaled?.result?.value;
    if (!Array.isArray(list) || list.length < Math.min(5, want)) {
      const htmlEval = await session.send('Runtime.evaluate', {
        expression: 'document.documentElement.outerHTML',
        returnByValue: true,
      });
      const html = htmlEval?.result?.value || '';
      const fromHtml = extractImageUrlsFromHtml(html);
      const merged = [...new Set([...(list || []), ...fromHtml])];
      list = merged;
    }
    return Array.isArray(list) ? list : [];
  });

  const items = [];
  const seen = new Set();
  for (const u of urls) {
    const url = decodeUrl(u);
    if (!isUsableImageUrl(url) || seen.has(url)) continue;
    seen.add(url);
    items.push({ url, title: '', fonte: 'google-imagens' });
    if (items.length >= want) break;
  }

  try {
    await saveGoogleImagensCache({
      queryNorm,
      slug,
      n: want,
      imagens: items.map((it, i) => ({
        ordem: i + 1,
        url_origem: it.url,
        path_local: null,
        fonte: it.fonte,
      })),
    });
  } catch (err) {
    console.warn('[google-imagens] cache urls:', err.message);
  }

  return {
    query: q,
    n: want,
    items,
    cached: false,
    query_norm: queryNorm,
  };
}

/** Compat: scraping CDP não precisa de chave. */
export function cseConfigured() {
  return true;
}

function extFromContentType(ct, url) {
  const c = String(ct || '').toLowerCase();
  if (c.includes('png')) return 'png';
  if (c.includes('webp')) return 'webp';
  if (c.includes('gif')) return 'gif';
  if (c.includes('jpeg') || c.includes('jpg')) return 'jpg';
  const m = String(url).match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function httpGetBuffer(url, { timeoutMs = 20_000, redirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const req = lib.get(
      url,
      {
        family: 4,
        headers: {
          'User-Agent': UA,
          Accept: 'image/avif,image/webp,image/*,*/*',
          Referer: 'https://www.google.com/',
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects > 0
        ) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          httpGetBuffer(next, { timeoutMs, redirects: redirects - 1 }).then(
            resolve,
            reject,
          );
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({
            buf: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || '',
          }),
        );
        res.on('error', reject);
      },
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.on('error', reject);
  });
}

function slugFor({ ean, descricao, query }) {
  const code = String(ean || '').replace(/\D/g, '');
  if (code) return `ean-${code}`;
  const raw = String(descricao || query || 'q')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const hash = crypto
    .createHash('sha1')
    .update(String(descricao || query || ''))
    .digest('hex')
    .slice(0, 8);
  return `q-${raw || 'busca'}-${hash}`;
}

export async function baixarGoogleImagens({
  descricao,
  ean,
  n = 50,
  download = true,
  force = false,
} = {}) {
  const query = String(ean || descricao || '').trim();
  if (!query) {
    throw Object.assign(new Error('informe descricao ou ean'), { status: 400 });
  }
  const modo = ean ? 'ean' : 'descricao';
  const {
    normalizeGoogleQuery,
    getGoogleImagensBusca,
    listGoogleImagensCache,
    clearGoogleImagensCache,
    saveGoogleImagensCache,
  } = await googleCacheDb();
  const queryNorm = normalizeGoogleQuery(query);
  const slug = slugFor({ ean, descricao, query });

  if (force) {
    await clearGoogleImagensCache(queryNorm);
  } else {
    const busca = await getGoogleImagensBusca(queryNorm);
    if (busca) {
      const rows = await listGoogleImagensCache(queryNorm);
      const withPath = rows.filter((r) => r.path_local);
      if (!download) {
        return {
          ok: true,
          modo,
          fonte: 'google-imagens-cdp',
          query,
          query_norm: queryNorm,
          n: Number(busca.n_solicitado) || clampN(n, 50),
          encontradas: rows.length,
          baixadas: 0,
          slug: busca.slug || slug,
          cached: true,
          skipped: true,
          imagens: rows.map((r, i) => ({
            ordem: r.ordem || i + 1,
            url_origem: r.url_origem,
            title: '',
            fonte: r.fonte || 'google-imagens',
            path_local: r.path_local,
          })),
        };
      }
      if (withPath.length > 0 || rows.length === 0) {
        return {
          ok: true,
          modo,
          fonte: 'google-imagens-cdp',
          query,
          query_norm: queryNorm,
          n: Number(busca.n_solicitado) || clampN(n, 50),
          encontradas: rows.length,
          baixadas: 0,
          slug: busca.slug || slug,
          cached: true,
          skipped: true,
          imagens: withPath.map((r, i) => ({
            ordem: r.ordem || i + 1,
            url_origem: r.url_origem,
            title: '',
            fonte: r.fonte || 'google-imagens',
            path_local: r.path_local,
          })),
        };
      }
      // Cache só com URL: baixa arquivo sem reabrir o Google.
      const fromUrls = await downloadGoogleItems(
        rows
          .filter((r) => r.url_origem)
          .map((r) => ({
            url: r.url_origem,
            title: '',
            fonte: r.fonte || 'google-imagens',
          })),
        slug,
      );
      await saveGoogleImagensCache({
        queryNorm,
        slug: busca.slug || slug,
        n: Number(busca.n_solicitado) || clampN(n, 50),
        imagens: fromUrls.imagens,
      });
      return {
        ok: true,
        modo,
        fonte: 'google-imagens-cdp',
        query,
        query_norm: queryNorm,
        n: Number(busca.n_solicitado) || clampN(n, 50),
        encontradas: fromUrls.imagens.length,
        baixadas: fromUrls.baixadas,
        slug: busca.slug || slug,
        cached: true,
        skipped: false,
        imagens: fromUrls.imagens,
      };
    }
  }

  const searched = await searchGoogleImages(query, { n, force: true });
  const out = {
    ok: true,
    modo,
    fonte: 'google-imagens-cdp',
    query: searched.query,
    query_norm: queryNorm,
    n: searched.n,
    encontradas: searched.items.length,
    baixadas: 0,
    slug,
    cached: false,
    skipped: false,
    imagens: [],
  };

  if (!download) {
    out.imagens = searched.items.map((it, i) => ({
      ordem: i + 1,
      url_origem: it.url,
      title: it.title,
      fonte: it.fonte,
      path_local: null,
    }));
    return out;
  }

  const dl = await downloadGoogleItems(searched.items, slug);
  out.imagens = dl.imagens;
  out.baixadas = dl.baixadas;

  try {
    await saveGoogleImagensCache({
      queryNorm,
      slug,
      n: out.n,
      imagens: out.imagens.length
        ? out.imagens
        : searched.items.map((it, i) => ({
            ordem: i + 1,
            url_origem: it.url,
            path_local: null,
            fonte: it.fonte,
          })),
    });
  } catch (err) {
    console.warn('[google-imagens] cache download:', err.message);
  }

  return out;
}

async function downloadGoogleItems(items, slug) {
  const dir = path.join(GOOGLE_IMAGENS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  const imagens = [];
  let baixadas = 0;
  let ordem = 1;
  for (const it of items) {
    try {
      const { buf, contentType } = await httpGetBuffer(it.url);
      if (buf.length < 200) continue;
      const ext = extFromContentType(contentType, it.url);
      const file = `${String(ordem).padStart(2, '0')}.${ext}`;
      fs.writeFileSync(path.join(dir, file), buf);
      const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
      imagens.push({
        ordem,
        url_origem: it.url,
        title: it.title || '',
        fonte: it.fonte || 'google-imagens',
        path_local: `google-imagens/${slug}/${file}`,
        bytes: buf.length,
        sha1,
      });
      baixadas += 1;
      ordem += 1;
    } catch (err) {
      console.warn('[google-imagens] download:', err.message);
    }
  }
  return { imagens, baixadas };
}
