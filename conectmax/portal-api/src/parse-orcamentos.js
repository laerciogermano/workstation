import {
  dataValueRows,
  parseMoney,
  parseStatus,
  stripTags,
  tdHtmls,
} from './html-utils.js';

export function parseOrcamentosHtml(html) {
  const out = [];
  for (const row of dataValueRows(html)) {
    const tds = tdHtmls(row.inner);
    const meta = tds[1] ? stripTags(tds[1]) : '';
    const numM = meta.match(/N[\u00BAºo°]\s*(\d+)/i);
    const dataM = meta.match(/(\d{2}\/\d{2}\/\d{4})/);
    out.push({
      id: row.id,
      numero: numM ? Number(numM[1]) : null,
      data: dataM ? dataM[1] : null,
      status: parseStatus(row.inner),
      cliente: tds[3] ? stripTags(tds[3]) || null : null,
      vendedor: tds[4] ? stripTags(tds[4]) || null : null,
      total: parseMoney(tds[5]),
      totalTexto: tds[5] ? stripTags(tds[5]) : null,
    });
  }
  return out;
}
