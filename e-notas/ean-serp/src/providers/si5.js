import * as cheerio from 'cheerio';
import { fetchJson, fetchText } from '../fetch.js';
import {
  extractEansFromText,
  normalizeEan,
  queryVariants,
  scoreDescricao,
} from '../normalize.js';

const BASE = 'https://global.si5.com.br';

function parseSi5SearchHtml(text, queryNorm) {
  const $ = cheerio.load(text);
  const map = new Map();

  $('a[href*="/produtos/"]').each((_, el) => {
    const href = String($(el).attr('href') || '');
    const m = href.match(/\/produtos\/(\d{8,14})/);
    if (!m) return;
    const ean = normalizeEan(m[1]);
    if (!ean) return;
    // GTIN-14 de caixa (indicador 1–8) — prioriza unidade EAN-13
    if (ean.length === 14 && !ean.startsWith('0')) {
      const unit = normalizeEan(ean.slice(1));
      if (unit && unit.length === 13) {
        /* keep packaging as separate only if no unit later */
      }
    }
    const abs = href.startsWith('http')
      ? href
      : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`;
    const nome = $(el).text().replace(/\s+/g, ' ').trim() || '';
    let score = nome ? scoreDescricao(queryNorm, nome) : 0.55;
    if (ean.length === 13 && (ean.startsWith('789') || ean.startsWith('790'))) {
      score = Math.min(1, score + 0.05);
    }
    if (ean.length === 14) score *= 0.85;
    const prev = map.get(ean);
    if (prev && prev.score >= score) return;
    map.set(ean, {
      ean,
      nome_canonico: nome || null,
      image_url: null,
      url: abs.split('?')[0],
      fonte: 'si5-html',
      score: Math.max(score, 0.5),
    });
  });

  if (!map.size) {
    for (const ean of extractEansFromText(text)) {
      if (!ean.startsWith('789') && !ean.startsWith('790')) continue;
      if (ean.length !== 13) continue;
      map.set(ean, {
        ean,
        nome_canonico: null,
        image_url: null,
        url: `${BASE}/produtos/${ean}`,
        fonte: 'si5-html',
        score: 0.45,
      });
    }
  }
  return map;
}

function looksMultipack(nome) {
  const n = String(nome || '');
  return /\b\d+\s*x\b/i.test(n) || /\b\d+\s*latas?\b/i.test(n) || /\bcombo\b/i.test(n);
}

/**
 * Busca por nome no HTML público do SI5 (sem token).
 * Roda **todas** as variantes, mergeia e devolve top `n` por score.
 * @param {string} descricaoNorm
 * @param {{ n?: number }} [opts]
 * @returns {Promise<Array<{ean, nome_canonico, image_url, url, fonte, score}>>}
 */
export async function searchSi5Html(descricaoNorm, opts = {}) {
  const n = Math.min(50, Math.max(1, Number(opts.n) || 20));
  const variants = queryVariants(descricaoNorm);
  const merged = new Map();

  for (const q of variants) {
    const url = `${BASE}/?q=${encodeURIComponent(q)}`;
    const { ok, text } = await fetchText(url);
    if (!ok || !text) continue;
    const map = parseSi5SearchHtml(text, String(descricaoNorm || q));
    for (const [ean, c] of map) {
      let score = c.score;
      if (looksMultipack(c.nome_canonico)) score *= 0.55;
      if (ean.length === 14) score *= 0.7;
      const next = { ...c, score: Math.max(0.35, score) };
      const prev = merged.get(ean);
      if (!prev || next.score > prev.score) merged.set(ean, next);
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** Detalhe do produto: nome canônico + foto (og:image). */
export async function enrichSi5Product(ean) {
  const code = normalizeEan(ean);
  if (!code) return null;
  const url = `${BASE}/produtos/${code}`;
  const { ok, text } = await fetchText(url);
  if (!ok || !text) return null;
  const $ = cheerio.load(text);
  const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim() || null;
  const title = $('title').text().replace(/\s+/g, ' ').trim();
  let nome = h1;
  if (!nome && title) {
    nome = title.split('|')[0].replace(/\s*-\s*[A-Z0-9].*$/, '').trim() || title;
  }
  const og =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="og:image"]').attr('content') ||
    null;
  let image_url = og;
  if (!image_url) {
    const m = text.match(/https:\/\/(?:cdn\d+\.si5\.com\.br|global\.si5\.com\.br)\/img\/[^"'\s]+\.webp/i);
    if (m && !/\/marcas\//i.test(m[0])) image_url = m[0];
  }
  return {
    ean: code,
    nome_canonico: nome,
    image_url,
    url,
    fonte: 'si5-produto',
  };
}

/** API oficial (opcional; requer SI5_TOKEN). */
export async function searchSi5Api(descricaoNorm, token, { perPage = 10 } = {}) {
  const q = String(descricaoNorm || '').trim();
  if (!q || !token) return [];
  const params = new URLSearchParams({ q, per_page: String(perPage) });
  const { ok, data } = await fetchJson(`${BASE}/api/produtos?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!ok || !data?.data) return [];
  return data.data
    .map((p) => {
      const ean = normalizeEan(p.codbar);
      if (!ean) return null;
      const nome = p.produto || '';
      return {
        ean,
        nome_canonico: nome || null,
        image_url: p.imagem_url || null,
        url: `${BASE}/produtos/${ean}`,
        fonte: 'si5-api',
        score: nome ? scoreDescricao(q, nome) : 0.6,
      };
    })
    .filter(Boolean);
}
