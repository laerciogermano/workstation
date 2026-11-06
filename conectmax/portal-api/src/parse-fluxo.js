import { stripTags } from './html-utils.js';

function parseJsArray(raw) {
  return String(raw)
    .replace(/[\[\]]/g, '')
    .split(',')
    .map((x) => {
      const t = x.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    });
}

export function parseFluxoPrevistoHtml(html) {
  const labelsM = html.match(/labels\s*:\s*(\[[^\]]+\])/i);
  const labels = labelsM
    ? [...labelsM[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
    : [];

  const series = [];
  for (const m of html.matchAll(
    /\{\s*label\s*:\s*['"]([^'"]+)['"][\s\S]*?data\s*:\s*(\[[^\]]*\])/gi,
  )) {
    series.push({ label: m[1], data: parseJsArray(m[2]) });
  }

  const meses = labels.map((label, i) => {
    const row = { mes: label, indice: i + 1 };
    for (const s of series) {
      const key = s.label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_');
      row[key] = s.data[i] ?? null;
    }
    return row;
  });

  const dataParam =
    html.match(/<option[^>]*value=["'](\d{4}-\d{2})["'][^>]*selected/i)?.[1] ||
    html.match(/name=["']data["'][\s\S]*?value=["'](\d{4}-\d{2})["']/i)?.[1] ||
    null;

  return {
    dataRef: dataParam,
    labels,
    series,
    meses,
    texto: stripTags(
      html.match(/<div class="card-body[^"]*">([\s\S]*?)<\/div>/i)?.[1] || '',
    ).slice(0, 200) || null,
  };
}
