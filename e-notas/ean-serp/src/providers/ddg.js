import * as cheerio from 'cheerio';
import { fetchText } from '../fetch.js';
import { extractEansFromText, normalizeEan, scoreDescricao } from '../normalize.js';

/**
 * SERP via DuckDuckGo HTML: query `EAN {descricao}`.
 * Extrai EAN de URLs/títulos (Cosmos, SI5, Systax, atacados…).
 */
export async function searchDdgEan(descricaoNorm) {
  const q = String(descricaoNorm || '').trim();
  if (!q) return [];
  const query = `EAN ${q}`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { ok, text } = await fetchText(url);
  if (!ok || !text) return [];

  const $ = cheerio.load(text);
  const map = new Map();

  const push = (ean, meta) => {
    const code = normalizeEan(ean);
    if (!code) return;
    const prev = map.get(code);
    const score = meta.score ?? 0.5;
    if (prev && prev.score >= score) {
      if (!prev.url && meta.url) prev.url = meta.url;
      if (!prev.nome_canonico && meta.nome_canonico) prev.nome_canonico = meta.nome_canonico;
      return;
    }
    map.set(code, {
      ean: code,
      nome_canonico: meta.nome_canonico || null,
      image_url: null,
      url: meta.url || null,
      fonte: meta.fonte || 'ddg-serp',
      score,
    });
  };

  $('a.result__a').each((_, el) => {
    const hrefRaw = String($(el).attr('href') || '');
    let dest = hrefRaw;
    const mUddg = hrefRaw.match(/[?&]uddg=([^&]+)/);
    if (mUddg) {
      try {
        dest = decodeURIComponent(mUddg[1]);
      } catch {
        dest = mUddg[1];
      }
    }
    const title = $(el).text().replace(/\s+/g, ' ').trim();
    const snippet = $(el)
      .closest('.result')
      .find('.result__snippet')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const blob = `${dest} ${title} ${snippet}`;

    const hostScore = hostBonus(dest);
    for (const ean of extractEansFromText(blob)) {
      const nameScore = title ? scoreDescricao(q, title) : 0.4;
      push(ean, {
        url: dest.startsWith('http') ? dest : null,
        nome_canonico: title || null,
        fonte: `ddg:${hostLabel(dest)}`,
        score: Math.min(1, Math.max(nameScore, 0.45) + hostScore),
      });
    }
  });

  // texto bruto (às vezes o EAN só no snippet)
  if (!map.size) {
    for (const ean of extractEansFromText(text)) {
      if (!ean.startsWith('789') && !ean.startsWith('790')) continue;
      push(ean, { fonte: 'ddg-serp', score: 0.4 });
    }
  }

  return [...map.values()].sort((a, b) => b.score - a.score);
}

function hostLabel(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    if (h.includes('si5')) return 'si5';
    if (h.includes('bluesoft') || h.includes('cosmos')) return 'cosmos';
    if (h.includes('systax')) return 'systax';
    if (h.includes('precomelhor')) return 'precomelhor';
    if (h.includes('consultaprodutos')) return 'consultaprodutos';
    return h.split('.').slice(-2).join('.');
  } catch {
    return 'web';
  }
}

function hostBonus(url) {
  const h = hostLabel(url);
  if (['si5', 'cosmos', 'systax', 'precomelhor', 'consultaprodutos'].includes(h)) return 0.15;
  if (/atacad|distrib|marsil|masterdist|arcofoods/i.test(url)) return 0.08;
  return 0;
}
