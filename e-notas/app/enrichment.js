/**
 * Enrichment: descrição → EAN → imagens (composição; sem auto-vínculo).
 * Fontes: base local (codigos_barras+itens) e Open Food/Beauty/Products Facts.
 */
import {
  buscarImagensEan,
  listLinkedNomeEan,
  listEanSugestoes,
  upsertEanSugestoes,
} from './db.js';

const UA =
  'notinhas.shop/0.1 (product enrichment; +https://notinhas.shop; contato@notinhas.shop)';
const FETCH_MS = 12_000;
const MAX_CANDIDATOS = 8;
/** Score mínimo para disparar busca de imagens por EAN sem confirmação. */
export const SCORE_IMAGENS_AUTO = 0.72;

const STOP = new Set([
  'LT',
  'LTS',
  'PCT',
  'PC',
  'PCTS',
  'UN',
  'UND',
  'CX',
  'KG',
  'GR',
  'G',
  'ML',
  'L',
  'DZ',
  'FD',
  'SC',
  'CPT',
  'CAP',
  'TP',
  'TPO',
  'REF',
  'C',
  'DE',
  'DA',
  'DO',
  'COM',
  'SEM',
]);

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
  const res = await fetchWithTimeout(url, { accept: 'application/json' });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Normaliza texto de NFC-e / busca para matching. */
export function normalizeDescricao(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => {
      if (!tok) return false;
      if (STOP.has(tok)) return false;
      if (/^\d+$/.test(tok) && tok.length <= 2) return false;
      return true;
    })
    .join(' ')
    .trim();
}

function tokens(norm) {
  return norm ? norm.split(/\s+/).filter(Boolean) : [];
}

/** Jaccard + bônus de inclusão; 0..1. */
export function scoreDescricao(queryNorm, candidateNorm) {
  const a = new Set(tokens(queryNorm));
  const b = new Set(tokens(candidateNorm));
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  let j = union ? inter / union : 0;
  if (candidateNorm.includes(queryNorm) || queryNorm.includes(candidateNorm)) {
    j = Math.max(j, 0.85);
  }
  const cover = inter / a.size;
  return Math.min(1, Math.max(j, cover * 0.95));
}

function pushEan(map, { ean, score, fonte, nome_canonico, image_url }) {
  const code = String(ean ?? '').replace(/\D/g, '');
  if (code.length < 8 || code.length > 14) return;
  const prev = map.get(code);
  if (prev && prev.score >= score) return;
  map.set(code, {
    ean: code,
    score: Number(score.toFixed(4)),
    fonte,
    nome_canonico: nome_canonico || null,
    image_url: image_url || null,
  });
}

async function fromLocalBase(queryNorm, map) {
  const rows = await listLinkedNomeEan();
  for (const row of rows) {
    const candNorm = normalizeDescricao(row.nome);
    if (!candNorm) continue;
    const s = scoreDescricao(queryNorm, candNorm);
    if (s < 0.45) continue;
    // reforço por usos comunitários
    const boost = Math.min(0.12, (Number(row.usos) || 1) * 0.02);
    pushEan(map, {
      ean: row.codigo_barras,
      score: Math.min(1, s + boost + 0.08),
      fonte: 'local',
      nome_canonico: row.nome,
    });
  }
}

async function fromCacheSugestoes(queryNorm, map) {
  const rows = await listEanSugestoes(queryNorm);
  for (const row of rows) {
    const conf = Number(row.confirmacoes) || 0;
    const rej = Number(row.rejeicoes) || 0;
    let s = Number(row.score) || 0;
    if (conf > 0) s = Math.min(1, s + 0.05 * conf);
    if (rej > conf) s *= 0.5;
    if (s < 0.4) continue;
    pushEan(map, {
      ean: row.ean,
      score: s,
      fonte: `cache:${row.fonte || 'sugestao'}`,
      nome_canonico: row.nome_canonico,
    });
  }
}

function productImage(product) {
  if (!product || typeof product !== 'object') return null;
  return (
    product.image_front_url ||
    product.image_url ||
    product.image_front_small_url ||
    product.image_small_url ||
    null
  );
}

async function searchOpenFacts(queryNorm, host, fonte, map) {
  const q = encodeURIComponent(queryNorm.toLowerCase());
  const url =
    `https://${host}/cgi/search.pl?search_terms=${q}` +
    `&search_simple=1&action=process&json=1&page_size=12`;
  const data = await fetchJson(url);
  const products = data?.products;
  if (!Array.isArray(products)) return;
  for (const p of products) {
    const code = String(p.code || p._id || '').replace(/\D/g, '');
    if (!code) continue;
    const name =
      p.product_name_pt ||
      p.product_name ||
      p.generic_name_pt ||
      p.generic_name ||
      '';
    const nameNorm = normalizeDescricao(name) || normalizeDescricao(p.brands || '');
    const s = Math.max(
      scoreDescricao(queryNorm, nameNorm),
      scoreDescricao(queryNorm, normalizeDescricao(`${p.brands || ''} ${name}`)),
    );
    if (s < 0.35) continue;
    pushEan(map, {
      ean: code,
      score: s,
      fonte,
      nome_canonico: name || null,
      image_url: productImage(p),
    });
  }
}

/**
 * Resolve candidatos EAN a partir da descrição.
 * @returns {{ descricao_norm: string, candidatos: object[] }}
 */
export async function resolveEanFromDescricao(descricao, { skipRemote = false } = {}) {
  const raw = String(descricao ?? '').trim();
  if (!raw) {
    throw Object.assign(new Error('descricao obrigatória'), { status: 400 });
  }
  const descricao_norm = normalizeDescricao(raw);
  if (!descricao_norm) {
    throw Object.assign(new Error('descricao sem tokens úteis'), { status: 400 });
  }

  const map = new Map();
  await fromCacheSugestoes(descricao_norm, map);
  await fromLocalBase(descricao_norm, map);

  if (!skipRemote) {
    await searchOpenFacts(
      descricao_norm,
      'world.openfoodfacts.org',
      'openfoodfacts',
      map,
    );
    await sleep(150);
    if (map.size < MAX_CANDIDATOS) {
      await searchOpenFacts(
        descricao_norm,
        'world.openbeautyfacts.org',
        'openbeautyfacts',
        map,
      );
      await sleep(150);
    }
    if (map.size < MAX_CANDIDATOS) {
      await searchOpenFacts(
        descricao_norm,
        'world.openproductsfacts.org',
        'openproductsfacts',
        map,
      );
    }
  }

  const candidatos = [...map.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATOS);

  try {
    await upsertEanSugestoes(
      candidatos.map((c) => ({
        descricao_norm,
        ean: c.ean,
        score: c.score,
        fonte: String(c.fonte).replace(/^cache:/, ''),
        nome_canonico: c.nome_canonico,
      })),
    );
  } catch (err) {
    console.warn('[enrichment] cache sugestões:', err.message);
  }

  return { descricao_norm, candidatos };
}

/**
 * Busca URLs de imagem por texto nas bases OFF (sem persistir).
 */
export async function collectImageUrlsByDescricao(descricao) {
  const descricao_norm = normalizeDescricao(descricao);
  if (!descricao_norm) return [];

  const hosts = [
    ['world.openfoodfacts.org', 'openfoodfacts'],
    ['world.openbeautyfacts.org', 'openbeautyfacts'],
    ['world.openproductsfacts.org', 'openproductsfacts'],
  ];
  const out = [];
  const seen = new Set();

  for (const [host, fonte] of hosts) {
    const q = encodeURIComponent(descricao_norm.toLowerCase());
    const url =
      `https://${host}/cgi/search.pl?search_terms=${q}` +
      `&search_simple=1&action=process&json=1&page_size=8`;
    const data = await fetchJson(url);
    for (const p of data?.products || []) {
      const img = productImage(p);
      if (!img || seen.has(img)) continue;
      const name =
        p.product_name_pt || p.product_name || p.generic_name || '';
      const s = scoreDescricao(
        descricao_norm,
        normalizeDescricao(`${p.brands || ''} ${name}`),
      );
      if (s < 0.3) continue;
      seen.add(img);
      out.push({
        url: img,
        fonte,
        ean: String(p.code || '').replace(/\D/g, '') || null,
        nome_canonico: name || null,
        score: Number(s.toFixed(4)),
      });
    }
    if (out.length >= 5) break;
    await sleep(150);
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 5);
}

/**
 * Descrição → imagens: se top EAN confiável, reusa pipeline EAN;
 * senão devolve URLs textuais (sem gravar vínculo).
 */
export async function imagensPorDescricao(descricao, { force = false } = {}) {
  const { descricao_norm, candidatos } = await resolveEanFromDescricao(descricao);
  const top = candidatos[0] || null;
  if (top && top.score >= SCORE_IMAGENS_AUTO) {
    const result = await buscarImagensEan(top.ean, { force });
    return {
      descricao_norm,
      modo: 'ean',
      ean: top.ean,
      score: top.score,
      candidatos,
      ...result,
      imagens_texto: [],
    };
  }
  const imagens_texto = await collectImageUrlsByDescricao(descricao);
  return {
    descricao_norm,
    modo: 'texto',
    ean: top?.ean || null,
    score: top?.score ?? null,
    candidatos,
    imagens: [],
    baixadas: 0,
    imagens_texto,
  };
}
