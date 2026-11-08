/**
 * Busca candidatas de foto por EAN (APIs de produto + Google Imagens CDP).
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
export const DESC_FOTOS_DIR = path.join(__dirname, 'public', 'desc-fotos');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UA_API =
  'notinhas.shop/0.1 (ean image lookup; +https://notinhas.shop; contato@notinhas.shop)';
const MAX_CANDIDATAS = 50;
const MAX_GOOGLE = 50;
const FETCH_MS = 12_000;
const DOWNLOAD_MS = 8_000;
const DOWNLOAD_CONCURRENCY = 6;

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
        'User-Agent': UA_API,
        Accept: opts.accept || '*/*',
        ...(opts.headers || {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Pool simples: até `concurrency` promessas ao mesmo tempo. */
export async function mapPool(items, concurrency, fn) {
  const list = Array.isArray(items) ? items : [];
  const limit = Math.max(1, Number(concurrency) || 1);
  const out = new Array(list.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= list.length) return;
      out[i] = await fn(list[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, () => worker()),
  );
  return out;
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

/** Query Google: EAN + descrição do item (melhor recall que só dígitos). */
export function googleQueryForEan(ean, descricao) {
  const code = String(ean ?? '').trim();
  const nome = String(descricao ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (code && nome) return `${code} ${nome}`;
  return code || nome;
}

/** Sempre consulta Google Imagens (CDP, sem API key) e mistura no pool. */
async function fromGoogleImagens(ean, descricao, list, { force = false } = {}) {
  const q = googleQueryForEan(ean, descricao);
  if (!q) return { added: 0 };
  const { items } = await searchGoogleImages(q, { n: MAX_GOOGLE, force });
  let i = 0;
  const before = list.length;
  for (const item of items) {
    // prioridade atrás das APIs de produto, mas acima de “lixo”
    pushCandidate(list, item.url, 'google-imagens', 40 + i);
    i += 1;
  }
  return { added: list.length - before, query: q };
}

/**
 * @param {string} ean
 * @param {{ descricao?: string, forceGoogle?: boolean, apis?: boolean }} [opts]
 * @returns {Promise<{ candidates: object[], googleError?: string, googleAdded: number }>}
 */
export async function collectImageCandidates(ean, opts = {}) {
  const code = String(ean ?? '').trim();
  const descricao = String(opts.descricao ?? '').trim();
  const wantApis = opts.apis !== false;
  const list = [];
  let googleError;
  let googleAdded = 0;
  if (!code) return { candidates: list, googleAdded: 0 };

  if (wantApis) {
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
  }

  // Google sempre entra no pool (não só quando as APIs falham).
  try {
    const g = await fromGoogleImagens(code, descricao, list, {
      force: Boolean(opts.forceGoogle),
    });
    googleAdded = g?.added || 0;
  } catch (err) {
    googleError = err.message || String(err);
    console.warn('[ean-imagens] google-imagens:', googleError);
  }

  list.sort((a, b) => a.prioridade - b.prioridade);
  return {
    candidates: list.slice(0, MAX_CANDIDATAS),
    googleError,
    googleAdded,
  };
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
function httpGetBuffer(url, { timeoutMs = DOWNLOAD_MS, redirects = 5 } = {}) {
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
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
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

function writeImageBuffer(dir, relPrefix, url, ordem) {
  return httpGetBuffer(url, { timeoutMs: DOWNLOAD_MS }).then(({ buf, contentType }) => {
    if (buf.length < 200) return null;
    fs.mkdirSync(dir, { recursive: true });
    const ext = extFromContentType(contentType, url);
    const nn = String(ordem).padStart(2, '0');
    const file = `${nn}.${ext}`;
    const abs = path.join(dir, file);
    fs.writeFileSync(abs, buf);
    const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
    return {
      pathLocal: `${relPrefix}/${file}`,
      bytes: buf.length,
      sha1,
    };
  });
}

/**
 * Baixa imagem para ean-fotos/{ean}/{nn}.{ext}.
 * @returns {{ pathLocal: string, bytes: number, sha1: string } | null}
 */
export async function downloadEanImage(ean, url, ordem) {
  const code = String(ean).trim();
  if (!code || !url) return null;
  return writeImageBuffer(
    path.join(EAN_FOTOS_DIR, code),
    `ean-fotos/${code}`,
    url,
    ordem,
  );
}

/**
 * Baixa imagem sem EAN para desc-fotos/{slug}/{nn}.{ext}.
 * @returns {{ pathLocal: string, bytes: number, sha1: string } | null}
 */
export async function downloadDescImage(slug, url, ordem) {
  const key = String(slug || 'q')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'q';
  if (!url) return null;
  return writeImageBuffer(
    path.join(DESC_FOTOS_DIR, key),
    `desc-fotos/${key}`,
    url,
    ordem,
  );
}

/** True se a URL ainda aponta para terceiros. */
export function isRemoteImageUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

/** Normaliza path público local (sem host). */
export function toPublicImagePath(pathLocal) {
  const p = String(pathLocal || '')
    .trim()
    .replace(/^\/+/, '');
  return p || null;
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
