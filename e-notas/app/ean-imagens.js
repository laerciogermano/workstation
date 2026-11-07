/**
 * Busca candidatas de foto por EAN (APIs de produto; Google CSE opcional).
 * Persistência e seleção ficam em db.js.
 */
import dns from 'dns';
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { URL } from 'url';
import { searchGoogleImages } from './google-imagens.js';

// images.openfoodfacts.org às vezes resolve IPv6 inacessível neste lab
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* Node antigo */
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EAN_FOTOS_DIR = path.join(__dirname, 'public', 'ean-fotos');

const UA =
  'notinhas.shop/0.1 (ean image lookup; +https://notinhas.shop; contato@notinhas.shop)';
const MAX_CANDIDATAS = 5;
const FETCH_MS = 12_000;

/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? FETCH_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        Accept: opts.accept || '*/*',
        ...(opts.headers || {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url) {
  const res = await fetchWithTimeout(url, {
    accept: 'application/json',
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pushCandidate(list, url, fonte, prioridade) {
  const u = String(url || '').trim();
  if (!u || !/^https?:\/\//i.test(u)) return;
  if (list.some((c) => c.url === u)) return;
  list.push({ url: u, fonte, prioridade });
}

function collectOffImages(product, fonte, list) {
  if (!product || typeof product !== 'object') return;
  const keys = [
    'image_front_url',
    'image_url',
    'image_front_small_url',
    'image_small_url',
    'image_ingredients_url',
    'image_nutrition_url',
    'image_packaging_url',
  ];
  for (const k of keys) {
    pushCandidate(
      list,
      product[k],
      fonte,
      k.includes('front') ? 10 : k.includes('packaging') ? 22 : 20,
    );
  }
  const selected = product.selected_images;
  if (selected && typeof selected === 'object') {
    for (const kind of ['front', 'packaging', 'ingredients', 'nutrition', 'other']) {
      const block = selected[kind];
      const display = block?.display || block?.small || block?.thumb;
      if (!display || typeof display !== 'object') continue;
      for (const lang of Object.keys(display)) {
        pushCandidate(
          list,
          display[lang],
          fonte,
          kind === 'front' ? 11 : 25,
        );
      }
    }
  }
}

async function fromOpenFacts(ean, host, fonte, list) {
  const data = await fetchJson(
    `https://${host}/api/v2/product/${encodeURIComponent(ean)}.json`,
  );
  if (!data || data.status !== 1 || !data.product) return;
  collectOffImages(data.product, fonte, list);
}

async function fromUpcitemdb(ean, list) {
  const data = await fetchJson(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(ean)}`,
  );
  const items = data?.items;
  if (!Array.isArray(items)) return;
  for (const item of items) {
    for (const img of item.images || []) {
      pushCandidate(list, img, 'upcitemdb', 30);
    }
  }
}

/** Fallback: scraping Google Imagens (sem API key). */
async function fromGoogleCse(ean, list) {
  try {
    const { items } = await searchGoogleImages(ean, { n: 5 });
    for (const item of items) {
      pushCandidate(list, item.url, 'google-imagens', 90);
    }
  } catch (err) {
    console.warn('[ean-imagens] google-imagens:', err.message);
  }
}

export async function collectImageCandidates(ean) {
  const code = String(ean ?? '').trim();
  const list = [];
  if (!code) return list;

  await fromOpenFacts(code, 'world.openfoodfacts.org', 'openfoodfacts', list);
  await sleep(200);
  if (list.length < MAX_CANDIDATAS) {
    await fromOpenFacts(
      code,
      'world.openbeautyfacts.org',
      'openbeautyfacts',
      list,
    );
    await sleep(200);
  }
  if (list.length < MAX_CANDIDATAS) {
    await fromOpenFacts(
      code,
      'world.openproductsfacts.org',
      'openproductsfacts',
      list,
    );
    await sleep(200);
  }
  if (list.length < MAX_CANDIDATAS) {
    try {
      await fromUpcitemdb(code, list);
    } catch (err) {
      console.warn('[ean-imagens] upcitemdb:', err.message);
    }
  }
  if (list.length < MAX_CANDIDATAS) {
    try {
      await fromGoogleCse(code, list);
    } catch (err) {
      console.warn('[ean-imagens] google-cse:', err.message);
    }
  }

  list.sort((a, b) => a.prioridade - b.prioridade);
  return list.slice(0, MAX_CANDIDATAS);
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

/** GET binário com family IPv4 (evita timeout no CDN OFF). */
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
        headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
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

/**
 * Baixa imagem para ean-fotos/{ean}/{nn}.{ext}.
 * @returns {{ pathLocal: string, bytes: number, sha1: string } | null}
 */
export async function downloadEanImage(ean, url, ordem) {
  const code = String(ean).trim();
  const dir = path.join(EAN_FOTOS_DIR, code);
  fs.mkdirSync(dir, { recursive: true });

  const { buf, contentType } = await httpGetBuffer(url, { timeoutMs: 20_000 });
  if (buf.length < 200) return null;
  const ext = extFromContentType(contentType, url);
  const nn = String(ordem).padStart(2, '0');
  const file = `${nn}.${ext}`;
  const abs = path.join(dir, file);
  fs.writeFileSync(abs, buf);
  const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
  return {
    pathLocal: `ean-fotos/${code}/${file}`,
    bytes: buf.length,
    sha1,
  };
}

/** Evita buscas paralelas duplicadas do mesmo EAN. */
export function withEanSearchLock(ean, fn) {
  const key = String(ean).trim();
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = Promise.resolve()
    .then(fn)
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

export { MAX_CANDIDATAS };
