import {
  dataValueRows,
  parseMoney,
  parseStatus,
  stripTags,
  tdHtmls,
} from './html-utils.js';

export function parsePedidosHtml(html) {
  const out = [];
  for (const row of dataValueRows(html)) {
    const tds = tdHtmls(row.inner);
    const meta = tds[1] || '';
    const metaTxt = stripTags(meta);
    const dataM = metaTxt.match(/(\d{2}\/\d{2}\/\d{4})/);
    const orcM = meta.match(/Orçamento:\s*(\d+)/i) || metaTxt.match(/Orçamento:\s*(\d+)/i);
    out.push({
      id: row.id,
      numero: row.id,
      data: dataM ? dataM[1] : null,
      orcamento: orcM ? Number(orcM[1]) : null,
      status: parseStatus(row.inner),
      cliente: tds[3] ? stripTags(tds[3]) || null : null,
      vendedor: tds[4] ? stripTags(tds[4]) || null : null,
      total: parseMoney(tds[5]),
      totalTexto: tds[5] ? stripTags(tds[5]) : null,
    });
  }
  return out;
}
