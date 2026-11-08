import { normalizeDescricao } from './normalize.js';
import { searchDdgEan } from './providers/ddg.js';
import { cdpAvailable, searchGoogleCdpEan } from './providers/google-cdp.js';
import { enrichSi5Product, searchSi5Api, searchSi5Html } from './providers/si5.js';

const MAX_DEFAULT = 8;
const MAX_LIMIT = 50;
const ENRICH_TOP = 5;

function requireDescricao(descricao) {
  const raw = String(descricao ?? '').trim();
  if (!raw) {
    throw Object.assign(new Error('descricao obrigatória'), { status: 400 });
  }
  return raw;
}

function parseLimit(opts) {
  return Math.min(MAX_LIMIT, Math.max(1, Number(opts.limit ?? opts.n) || MAX_DEFAULT));
}

function mergeCandidates(list, map) {
  for (const c of list) {
    if (!c?.ean) continue;
    const prev = map.get(c.ean);
    if (!prev) {
      map.set(c.ean, { ...c });
      continue;
    }
    if (c.score > prev.score) {
      map.set(c.ean, {
        ...prev,
        ...c,
        fontes: [...new Set([...(prev.fontes || [prev.fonte]), c.fonte])],
        score: c.score,
      });
    } else {
      if (!prev.image_url && c.image_url) prev.image_url = c.image_url;
      if (!prev.nome_canonico && c.nome_canonico) prev.nome_canonico = c.nome_canonico;
      if (!prev.url && c.url) prev.url = c.url;
      prev.fontes = [...new Set([...(prev.fontes || [prev.fonte]), c.fonte])];
    }
  }
}

function sortPreferUnit(candidatos) {
  return [...candidatos].sort((a, b) => {
    const rank = (c) => {
      const multipack = /\b\d+\s*x\b|\b\d+\s*latas?\b|\bcombo\b/i.test(
        c.nome_canonico || '',
      );
      const unit13 =
        c.ean?.length === 13 &&
        (c.ean.startsWith('789') || c.ean.startsWith('790'));
      return (
        (unit13 && !multipack ? 4 : 0) +
        (c.ean?.length === 14 || multipack ? -3 : 0) +
        (c.image_url ? 1 : 0) +
        (c.score || 0)
      );
    };
    return rank(b) - rank(a);
  });
}

function filterPackWhenUnit(candidatos) {
  const hasUnit = candidatos.some(
    (c) => c.ean.length === 13 && (c.ean.startsWith('789') || c.ean.startsWith('790')),
  );
  if (!hasUnit) return candidatos;
  return candidatos.filter((c) => c.ean.length <= 13);
}

async function enrichTop(candidatos, enrich) {
  if (!enrich || !candidatos.length) return;
  const top = candidatos.slice(0, Math.min(ENRICH_TOP, candidatos.length));
  await Promise.all(
    top.map(async (c) => {
      try {
        const det = await enrichSi5Product(c.ean);
        if (!det) return;
        if (det.nome_canonico) c.nome_canonico = c.nome_canonico || det.nome_canonico;
        if (det.image_url) c.image_url = det.image_url;
        if (det.url) c.url = c.url || det.url;
        c.fontes = [...new Set([...(c.fontes || [c.fonte]), 'si5-produto'])];
      } catch {
        /* ignore */
      }
    }),
  );
}

function formatCandidatos(list) {
  return list.map((c) => ({
    ean: c.ean,
    score: Number((c.score || 0).toFixed(3)),
    fonte: c.fonte,
    fontes: c.fontes || [c.fonte],
    nome_canonico: c.nome_canonico || null,
    image_url: c.image_url || null,
    url: c.url || null,
  }));
}

function finalize(map, limit, enrich) {
  let candidatos = [...map.values()].sort((a, b) => b.score - a.score);
  candidatos = filterPackWhenUnit(candidatos).slice(0, limit);
  return enrichTop(candidatos, enrich).then(() => {
    candidatos = sortPreferUnit(candidatos);
    return formatCandidatos(candidatos);
  });
}

/**
 * Só SI5 (HTML + API opcional). Todas as variantes; top `n`/`limit` por score.
 * @param {string} descricao
 * @param {{ limit?: number, n?: number, enrich?: boolean }} [opts]
 */
export async function resolveEanSi5(descricao, opts = {}) {
  const raw = requireDescricao(descricao);
  const descricao_norm = normalizeDescricao(raw);
  const limit = parseLimit(opts);
  const enrich = opts.enrich !== false;
  const map = new Map();
  const providers = [];
  const errors = [];

  const token = String(process.env.SI5_TOKEN || '').trim();
  if (token) {
    try {
      const apiHits = await searchSi5Api(descricao_norm, token, { perPage: limit });
      mergeCandidates(apiHits, map);
      providers.push({ id: 'si5-api', n: apiHits.length });
    } catch (err) {
      errors.push({ id: 'si5-api', message: err.message });
    }
  }

  try {
    const si5 = await searchSi5Html(descricao_norm, {
      n: Math.max(limit, Math.min(MAX_LIMIT, limit * 2)),
    });
    mergeCandidates(si5, map);
    providers.push({ id: 'si5-html', n: si5.length });
  } catch (err) {
    errors.push({ id: 'si5-html', message: err.message });
  }

  const candidatos = await finalize(map, limit, enrich);
  return {
    ok: true,
    fonte: 'si5',
    descricao: raw,
    descricao_norm,
    candidatos,
    providers,
    errors: errors.length ? errors : undefined,
  };
}

/**
 * Só Google SERP via Chrome CDP (`EAN {descricao}`).
 * @param {string} descricao
 * @param {{ limit?: number, n?: number, enrich?: boolean }} [opts]
 */
export async function resolveEanGoogleCdp(descricao, opts = {}) {
  const raw = requireDescricao(descricao);
  const descricao_norm = normalizeDescricao(raw);
  const limit = parseLimit(opts);
  const enrich = opts.enrich !== false;
  const map = new Map();
  const providers = [];
  const errors = [];

  if (!(await cdpAvailable())) {
    throw Object.assign(
      new Error(
        `Chrome CDP indisponível em ${String(process.env.CDP_URL || 'http://127.0.0.1:9223')}`,
      ),
      { status: 503 },
    );
  }

  try {
    const g = await searchGoogleCdpEan(descricao_norm);
    mergeCandidates(g, map);
    providers.push({ id: 'google-cdp', n: g.length });
  } catch (err) {
    const status = err.status || 500;
    throw Object.assign(new Error(err.message || String(err)), { status });
  }

  const candidatos = await finalize(map, limit, enrich);
  return {
    ok: true,
    fonte: 'google-cdp',
    descricao: raw,
    descricao_norm,
    candidatos,
    providers,
    errors: errors.length ? errors : undefined,
  };
}

/**
 * Orquestra SI5 + DDG (+ Google CDP se pedido). Mantido em `/ean` para o app legado.
 * @param {string} descricao
 * @param {{ limit?: number, n?: number, enrich?: boolean, googleCdp?: boolean }} [opts]
 */
export async function resolveEanByDescricao(descricao, opts = {}) {
  const raw = requireDescricao(descricao);
  const descricao_norm = normalizeDescricao(raw);
  const limit = parseLimit(opts);
  const enrich = opts.enrich !== false;
  const wantGoogle =
    opts.googleCdp === true || String(process.env.GOOGLE_CDP || '') === '1';

  const map = new Map();
  const providers = [];
  const errors = [];

  const si5 = await resolveEanSi5(raw, { limit: Math.max(limit, 12), enrich: false });
  mergeCandidates(
    (si5.candidatos || []).map((c) => ({ ...c, fonte: c.fonte || 'si5-html' })),
    map,
  );
  providers.push(...(si5.providers || []));
  if (si5.errors?.length) errors.push(...si5.errors);

  try {
    const ddg = await searchDdgEan(descricao_norm);
    mergeCandidates(ddg, map);
    providers.push({ id: 'ddg-serp', n: ddg.length });
  } catch (err) {
    errors.push({ id: 'ddg-serp', message: err.message });
  }

  if (wantGoogle) {
    try {
      const g = await resolveEanGoogleCdp(raw, { limit, enrich: false });
      mergeCandidates(
        (g.candidatos || []).map((c) => ({ ...c, fonte: c.fonte || 'google-cdp' })),
        map,
      );
      providers.push(...(g.providers || []));
    } catch (err) {
      if (err.status === 503) {
        providers.push({ id: 'google-cdp', n: 0, skipped: 'cdp-down' });
      } else {
        errors.push({ id: 'google-cdp', message: err.message });
      }
    }
  }

  const candidatos = await finalize(map, limit, enrich);
  return {
    ok: true,
    descricao: raw,
    descricao_norm,
    candidatos,
    providers,
    errors: errors.length ? errors : undefined,
  };
}
