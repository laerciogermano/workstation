/**
 * Enrichment: descrição → EAN → imagens (composição; sem auto-vínculo).
 * Fontes EAN: local, Open*Facts, serviço **ean-serp** (SI5 + SERP `EAN`+nome;
 * Google CDP no ean-serp se `EAN_SERP_GOOGLE_CDP=1` ou fallback sem unidade).
 * Google Imagens só no pipeline de fotos (não substitui o ean-serp).
 */
import {
  buscarImagensEan,
  ensureDescImageLocal,
  ensureEanImageLocal,
  getEanResolveBusca,
  listLinkedNomeEan,
  listEanSugestoes,
  saveEanResolveBusca,
  upsertEanSugestoes,
} from './db.js';
import { isRemoteImageUrl } from './ean-imagens.js';
import { searchGoogleImages } from './google-imagens.js';

const UA =
  'notinhas.shop/0.1 (product enrichment; +https://notinhas.shop; contato@notinhas.shop)';
const FETCH_MS = 12_000;
const MAX_CANDIDATOS = 8;
/** Score mínimo para disparar busca de imagens por EAN sem confirmação. */
export const SCORE_IMAGENS_AUTO = 0.72;

/** Após 1º timeout/recusa do Postgres, evita N×8s no mesmo processo. */
let dbReachableMemo = true;
function dbOk() {
  if (process.env.ENOTAS_DB === '0') return false;
  return dbReachableMemo;
}
function markDbDown(err) {
  const msg = String(err?.message || err || '');
  if (/timeout|ECONNREFUSED|ENOTFOUND|Connection terminated|connect ETIMEDOUT/i.test(msg)) {
    dbReachableMemo = false;
    process.env.ENOTAS_DB = '0';
  }
}

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

/** Expande abreviações comuns de NFC-e / atacado. */
export function expandAbreviacoes(raw) {
  let s = String(raw ?? '');
  const rules = [
    [/\bABS\.?\b/gi, 'ABSORVENTE '],
    [/\bABSORV\.?\b/gi, 'ABSORVENTE '],
    [/\bREFRIG\.?\b/gi, 'REFRIGERANTE '],
    [/\bREFRI\.?\b/gi, 'REFRIGERANTE '],
    [/\bSAB\.?\b/gi, 'SABONETE '],
    [/\bDET\.?\b/gi, 'DETERGENTE '],
    [/\bAMAC\.?\b/gi, 'AMACIANTE '],
    [/\bDESOD\.?\b/gi, 'DESODORANTE '],
    [/\bSHAMP\.?\b/gi, 'SHAMPOO '],
    [/\bCOND\.?\b/gi, 'CONDICIONADOR '],
    [/\bBISN\.?\b/gi, 'BISNAGA '],
    [/\bLIMP\.?\b/gi, 'LIMPADOR '],
    [/\bPAP\.?\b/gi, 'PAPEL '],
    [/\bTOALH\.?\b/gi, 'TOALHA '],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  return s.replace(/\s+/g, ' ').trim();
}

/** Normaliza texto de NFC-e / busca para matching. */
export function normalizeDescricao(raw) {
  return expandAbreviacoes(raw)
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
  if (prev && prev.score >= score) {
    if (!prev.image_url && image_url) prev.image_url = image_url;
    if (!prev.nome_canonico && nome_canonico) prev.nome_canonico = nome_canonico;
    return;
  }
  map.set(code, {
    ean: code,
    score: Number(score.toFixed(4)),
    fonte,
    nome_canonico: nome_canonico || prev?.nome_canonico || null,
    image_url: image_url || prev?.image_url || null,
  });
}

/**
 * Garante image_url local (baixa terceiros → ean-fotos + ean_imagens).
 * Com DB down, mantém URL remota (SI5 etc.) para a UI não ficar sem thumb.
 */
async function attachImagesToCandidatos(candidatos) {
  for (const c of candidatos) {
    let remote = isRemoteImageUrl(c.image_url) ? c.image_url : null;
    if (!remote) {
      try {
        const data = await fetchJson(
          `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(c.ean)}.json`,
        );
        if (data?.status === 1 && data.product) {
          remote = productImage(data.product);
        }
      } catch {
        /* ignore */
      }
      await sleep(80);
    }
    if (!dbOk()) {
      c.image_url = remote || c.image_url || null;
      continue;
    }
    try {
      const pathLocal = await ensureEanImageLocal(c.ean, remote, {
        fonte: remote ? 'ean-serp' : 'local',
      });
      c.image_url = pathLocal
        ? `/${pathLocal.replace(/^\//, '')}`
        : remote || null;
    } catch (err) {
      markDbDown(err);
      console.warn('[enrichment] localize imagem:', err.message);
      c.image_url = remote || null;
    }
  }
  return candidatos;
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

function eanSerpBase() {
  return String(process.env.EAN_SERP_URL || 'http://127.0.0.1:4180').replace(
    /\/$/,
    '',
  );
}

function hasSerpFonte(map) {
  for (const c of map.values()) {
    if (/si5|ddg|ean-serp|cosmos|systax|precomelhor|consultaprodutos/i.test(c.fonte || '')) {
      return true;
    }
  }
  return false;
}

async function pullEanSerpRoute(path, descricao, map, { timeoutMs = 25_000, tag } = {}) {
  const base = eanSerpBase();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        descricao,
        limit: MAX_CANDIDATOS,
        n: MAX_CANDIDATOS,
        enrich: true,
      }),
    });
    if (!res.ok) {
      console.warn(`[enrichment] ean-serp ${path} HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    for (const c of data?.candidatos || []) {
      const score = Number(c.score) || 0;
      if (score < 0.35) continue;
      pushEan(map, {
        ean: c.ean,
        score: Math.min(1, score + 0.04),
        fonte: `ean-serp:${c.fonte || tag || 'serp'}`,
        nome_canonico: c.nome_canonico,
        image_url: c.image_url,
      });
    }
  } catch (err) {
    console.warn(`[enrichment] ean-serp ${path}:`, err.message);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Microserviço ean-serp (REQ-044): APIs separadas SI5 e Google CDP.
 * Falha soft se :4180 estiver down.
 */
async function fromEanSerp(descricao, map) {
  await pullEanSerpRoute('/ean/si5', descricao, map, { tag: 'si5' });
  const googleCdp = ['1', 'true', 'yes'].includes(
    String(process.env.EAN_SERP_GOOGLE_CDP || '').toLowerCase(),
  );
  if (googleCdp) {
    await pullEanSerpRoute('/ean/google-cdp', descricao, map, {
      timeoutMs: 45_000,
      tag: 'google-cdp',
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
  try {
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
      const nameNorm =
        normalizeDescricao(name) || normalizeDescricao(p.brands || '');
      const s = Math.max(
        scoreDescricao(queryNorm, nameNorm),
        scoreDescricao(
          queryNorm,
          normalizeDescricao(`${p.brands || ''} ${name}`),
        ),
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
  } catch (err) {
    console.warn(`[enrichment] ${fonte}:`, err.message);
  }
}

/**
 * Resolve candidatos EAN a partir da descrição.
 * @returns {{ descricao_norm: string, candidatos: object[], cached?: boolean }}
 */
export async function resolveEanFromDescricao(
  descricao,
  { skipRemote = false, force = false } = {},
) {
  const raw = String(descricao ?? '').trim();
  if (!raw) {
    throw Object.assign(new Error('descricao obrigatória'), { status: 400 });
  }
  const descricao_norm = normalizeDescricao(raw);
  if (!descricao_norm) {
    throw Object.assign(new Error('descricao sem tokens úteis'), { status: 400 });
  }

  const map = new Map();
  if (dbOk()) {
    try {
      await fromCacheSugestoes(descricao_norm, map);
    } catch (err) {
      markDbDown(err);
      console.warn('[enrichment] cache sugestões:', err.message);
    }
  }
  if (dbOk()) {
    try {
      await fromLocalBase(descricao_norm, map);
    } catch (err) {
      markDbDown(err);
      console.warn('[enrichment] base local:', err.message);
    }
  }

  let usedCacheBusca = false;
  if (dbOk() && !skipRemote && !force) {
    try {
      const busca = await getEanResolveBusca(descricao_norm);
      // busca vazia não trava retry (SI5/variantes podem passar a achar)
      if (busca && Number(busca.candidatos) > 0) usedCacheBusca = true;
    } catch (err) {
      markDbDown(err);
    }
  }

  if (!skipRemote && !usedCacheBusca) {
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

  // ean-serp: independente do marker OFF — roda se ainda não há fonte SERP/SI5
  if (!skipRemote && (force || !hasSerpFonte(map))) {
    await fromEanSerp(raw, map);
  }

  if (dbOk() && !skipRemote && !usedCacheBusca) {
    try {
      await saveEanResolveBusca(descricao_norm, map.size);
    } catch (err) {
      markDbDown(err);
      console.warn('[enrichment] busca marker:', err.message);
    }
  }

  let candidatos = [...map.values()]
    .sort((a, b) => {
      const rank = (c) =>
        (c.image_url ? 0.08 : 0) +
        (String(c.ean).length === 13 ? 0.03 : 0) +
        (c.score || 0);
      return rank(b) - rank(a);
    })
    .slice(0, MAX_CANDIDATOS);

  await attachImagesToCandidatos(candidatos);

  if (dbOk()) {
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
      markDbDown(err);
      console.warn('[enrichment] cache sugestões:', err.message);
    }
  }

  return {
    descricao_norm,
    candidatos,
    cached: usedCacheBusca,
  };
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

  // Google Imagens (CDP) completa o pool textual.
  if (out.length < 5) {
    try {
      const { items } = await searchGoogleImages(descricao_norm, {
        n: 5 - out.length,
      });
      for (const it of items) {
        if (!it.url || seen.has(it.url)) continue;
        seen.add(it.url);
        out.push({
          url: it.url,
          fonte: 'google-imagens',
          ean: null,
          nome_canonico: null,
          score: 0.55,
        });
        if (out.length >= 5) break;
      }
    } catch (err) {
      console.warn('[enrichment] google-imagens texto:', err.message);
    }
  }

  out.sort((a, b) => b.score - a.score);
  const localized = [];
  let ordem = 1;
  for (const it of out.slice(0, 5)) {
    let pathLocal = null;
    if (it.ean) {
      pathLocal = await ensureEanImageLocal(it.ean, it.url, { fonte: it.fonte });
    } else {
      pathLocal = await ensureDescImageLocal(descricao_norm, it.url, {
        fonte: it.fonte,
        ordem,
      });
    }
    ordem += 1;
    if (!pathLocal) continue;
    localized.push({
      ...it,
      url_origem: isRemoteImageUrl(it.url) ? it.url : null,
      url: `/${pathLocal.replace(/^\//, '')}`,
      path_local: pathLocal,
    });
  }
  return localized;
}

/**
 * Descrição → imagens: se top EAN confiável, reusa pipeline EAN;
 * senão devolve URLs textuais (sem gravar vínculo).
 */
export async function imagensPorDescricao(descricao, { force = false } = {}) {
  const { descricao_norm, candidatos } = await resolveEanFromDescricao(descricao);
  const top = candidatos[0] || null;
  if (top && top.score >= SCORE_IMAGENS_AUTO) {
    const result = await buscarImagensEan(top.ean, {
      force,
      descricao: descricao_norm || descricao,
    });
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
