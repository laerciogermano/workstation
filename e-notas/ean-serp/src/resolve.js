import { normalizeDescricao } from './normalize.js';
import { searchDdgEan } from './providers/ddg.js';
import { cdpAvailable, searchGoogleCdpEan } from './providers/google-cdp.js';
import { enrichSi5Product, searchSi5Api, searchSi5Html } from './providers/si5.js';

const MAX_DEFAULT = 8;
const ENRICH_TOP = 5;

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

/**
 * Resolve EAN a partir do descritivo: SI5 + SERP (`EAN` + nome) + enrich foto/nome.
 *
 * @param {string} descricao
 * @param {{ limit?: number, enrich?: boolean, googleCdp?: boolean }} [opts]
 */
export async function resolveEanByDescricao(descricao, opts = {}) {
  const raw = String(descricao ?? '').trim();
  if (!raw) {
    throw Object.assign(new Error('descricao obrigatória'), { status: 400 });
  }
  const descricao_norm = normalizeDescricao(raw);
  const limit = Math.min(20, Math.max(1, Number(opts.limit) || MAX_DEFAULT));
  const enrich = opts.enrich !== false;
  const wantGoogle =
    opts.googleCdp === true ||
    String(process.env.GOOGLE_CDP || '') === '1';

  const map = new Map();
  const providers = [];
  const errors = [];

  // 1) SI5 API (se token) + HTML público
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
    const si5 = await searchSi5Html(descricao_norm);
    mergeCandidates(si5, map);
    providers.push({ id: 'si5-html', n: si5.length });
  } catch (err) {
    errors.push({ id: 'si5-html', message: err.message });
  }

  // 2) DuckDuckGo: "EAN {descricao}" — sites que publicam código de barras
  try {
    const ddg = await searchDdgEan(descricao_norm);
    mergeCandidates(ddg, map);
    providers.push({ id: 'ddg-serp', n: ddg.length });
  } catch (err) {
    errors.push({ id: 'ddg-serp', message: err.message });
  }

  // 3) Google CDP opcional
  if (wantGoogle) {
    try {
      if (await cdpAvailable()) {
        const g = await searchGoogleCdpEan(descricao_norm);
        mergeCandidates(g, map);
        providers.push({ id: 'google-cdp', n: g.length });
      } else {
        providers.push({ id: 'google-cdp', n: 0, skipped: 'cdp-down' });
      }
    } catch (err) {
      errors.push({ id: 'google-cdp', message: err.message });
    }
  }

  let candidatos = [...map.values()].sort((a, b) => b.score - a.score);

  // se já há EAN-13 de varejo, descarta GTIN-14 de caixa/agrupamento
  const hasUnit = candidatos.some(
    (c) => c.ean.length === 13 && (c.ean.startsWith('789') || c.ean.startsWith('790')),
  );
  if (hasUnit) {
    candidatos = candidatos.filter((c) => c.ean.length <= 13);
  }
  candidatos = candidatos.slice(0, limit);

  // 4) Enrich top via ficha SI5 (nome + foto)
  if (enrich && candidatos.length) {
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

  // prioriza unidade EAN-13 BR com foto/nome
  candidatos.sort((a, b) => {
    const rank = (c) =>
      (c.image_url ? 2 : 0) +
      (c.ean?.length === 13 ? 1 : 0) +
      (c.ean?.startsWith('789') || c.ean?.startsWith('790') ? 0.5 : 0) +
      (c.score || 0);
    return rank(b) - rank(a);
  });

  candidatos = candidatos.map((c) => ({
    ean: c.ean,
    score: Number(c.score.toFixed(3)),
    fonte: c.fonte,
    fontes: c.fontes || [c.fonte],
    nome_canonico: c.nome_canonico || null,
    image_url: c.image_url || null,
    url: c.url || null,
  }));

  return {
    ok: true,
    descricao: raw,
    descricao_norm,
    candidatos,
    providers,
    errors: errors.length ? errors : undefined,
  };
}
