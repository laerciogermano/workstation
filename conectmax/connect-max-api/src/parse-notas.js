import {
  dataValueRows,
  parseMoney,
  parseStatus,
  stripTags,
  tdHtmls,
} from './html-utils.js';

export function parseNotasFiscaisHtml(html) {
  const out = [];
  for (const row of dataValueRows(html)) {
    const tds = tdHtmls(row.inner);
    const numTxt = tds[2] ? stripTags(tds[2]) : '';
    const numM = numTxt.match(/N[\u00BAºo°]:\s*(\d+)/i);
    const tipoPedido = /display\s*:\s*none/.test(tds[1] || '')
      ? null
      : /Pedido/i.test(tds[1] || '')
        ? 'Pedido'
        : null;
    out.push({
      id: row.id,
      status: parseStatus(row.inner) || (tds[1] ? stripTags(tds[1]).replace(/^Pedido\s*/i, '').trim() : null),
      tipo: tipoPedido,
      numero: numM ? Number(numM[1]) : null,
      cliente: tds[3] ? stripTags(tds[3]) || null : null,
      data: tds[4] ? stripTags(tds[4]) || null : null,
      transportadora: tds[5] ? stripTags(tds[5]) || null : null,
      total: parseMoney(tds[6]),
      totalTexto: tds[6] ? stripTags(tds[6]) : null,
      pdf: `/franqueado/ajax/notas_fiscais/pdf.php?id_nota=${row.id}`,
      xml: `/franqueado/ajax/notas_fiscais/xml.php?id_nota=${row.id}`,
    });
  }
  return out;
}
