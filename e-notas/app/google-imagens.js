/**
 * Google Imagens via Custom Search (Programmable Search).
 * Um serviço: query = descrição OU EAN; baixa até N imagens (máx. 100 — limite da API).
 * Env: GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX (+ opcional GOOGLE_CSE_CX_2).
 */
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const GOOGLE_IMAGENS_DIR = path.join(__dirname, 'public', 'google-imagens');
export const CSE_HARD_MAX = 100; // start + num ≤ 100 na JSON API
const PAGE_SIZE = 10;
const UA =
  'notinhas.shop/0.1 (google image search; +https://notinhas.shop; contato@notinhas.shop)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function cseCredentials() {
  const key = String(process.env.GOOGLE_CSE_API_KEY || '').trim();
  const cx1 = String(process.env.GOOGLE_CSE_CX || '').trim();
  const cx2 = String(process.env.GOOGLE_CSE_CX_2 || '').trim();
  const cxs = [...new Set([cx1, cx2].filter(Boolean))];
  return { key, cxs };
}

export function cseConfigured() {
  const { key, cxs } = cseCredentials();
  return Boolean(key && cxs.length);
}

function clampN(n, fallback = 10) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(CSE_HARD_MAX, Math.floor(v));
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw Object.assign(
        new Error(`Google CSE HTTP ${res.status}: ${body.slice(0, 200)}`),
        { status: res.status === 403 || res.status === 429 ? 502 : 502 },
      );
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lista URLs de imagem no Google (paginado). Usa até 2 CX se configurados.
 * @returns {Promise<{ query: string, n: number, items: { url: string, title: string, cx: string }[] }>}
 */
export async function searchGoogleImages(query, { n = 10 } = {}) {
  const q = String(query ?? '').trim();
  if (!q) {
    throw Object.assign(new Error('query obrigatória (descricao ou ean)'), {
      status: 400,
    });
  }
  const { key, cxs } = cseCredentials();
  if (!key || !cxs.length) {
    throw Object.assign(
      new Error(
        'Google CSE não configurado: defina GOOGLE_CSE_API_KEY e GOOGLE_CSE_CX (opcional GOOGLE_CSE_CX_2)',
      ),
      { status: 503 },
    );
  }

  const want = clampN(n, 10);
  const seen = new Set();
  const items = [];

  for (const cx of cxs) {
    if (items.length >= want) break;
    for (let start = 1; items.length < want && start <= 91; start += PAGE_SIZE) {
      const num = Math.min(PAGE_SIZE, want - items.length);
      const url =
        `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}` +
        `&cx=${encodeURIComponent(cx)}` +
        `&q=${encodeURIComponent(q)}` +
        `&searchType=image&safe=active` +
        `&num=${num}&start=${start}`;
      let data;
      try {
        data = await fetchJson(url);
      } catch (err) {
        console.warn(`[google-imagens] cx=${cx} start=${start}:`, err.message);
        break;
      }
      const page = data?.items;
      if (!Array.isArray(page) || !page.length) break;
      for (const it of page) {
        const link = String(it.link || '').trim();
        if (!link || seen.has(link)) continue;
        seen.add(link);
        items.push({
          url: link,
          title: String(it.title || '').slice(0, 200),
          cx,
        });
        if (items.length >= want) break;
      }
      if (page.length < num) break;
      await sleep(120);
    }
  }

  return { query: q, n: want, items };
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

/**
 * Busca no Google Imagens e opcionalmente baixa N arquivos.
 * @param {{ descricao?: string, ean?: string, n?: number|string, download?: boolean }} opts
 */
export async function baixarGoogleImagens({
  descricao,
  ean,
  n = 10,
  download = true,
} = {}) {
  const query = String(ean || descricao || '').trim();
  if (!query) {
    throw Object.assign(
      new Error('informe descricao ou ean'),
      { status: 400 },
    );
  }
  const modo = ean ? 'ean' : 'descricao';
  const searched = await searchGoogleImages(query, { n });
  const slug = slugFor({ ean, descricao, query });
  const out = {
    ok: true,
    modo,
    query: searched.query,
    n: searched.n,
    encontradas: searched.items.length,
    baixadas: 0,
    slug,
    imagens: [],
  };

  if (!download) {
    out.imagens = searched.items.map((it, i) => ({
      ordem: i + 1,
      url_origem: it.url,
      title: it.title,
      cx: it.cx,
      path_local: null,
    }));
    return out;
  }

  const dir = path.join(GOOGLE_IMAGENS_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  let ordem = 1;
  for (const it of searched.items) {
    try {
      const { buf, contentType } = await httpGetBuffer(it.url);
      if (buf.length < 200) continue;
      const ext = extFromContentType(contentType, it.url);
      const file = `${String(ordem).padStart(2, '0')}.${ext}`;
      fs.writeFileSync(path.join(dir, file), buf);
      const pathLocal = `google-imagens/${slug}/${file}`;
      out.imagens.push({
        ordem,
        url_origem: it.url,
        title: it.title,
        cx: it.cx,
        path_local: pathLocal,
        bytes: buf.length,
      });
      out.baixadas += 1;
      ordem += 1;
    } catch (err) {
      console.warn('[google-imagens] download:', err.message);
    }
  }
  return out;
}
