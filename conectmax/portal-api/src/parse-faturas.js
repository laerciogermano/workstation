import {
  dataValueRows,
  parseMoney,
  parseStatus,
  stripTags,
  tdHtmls,
} from './html-utils.js';

/** Contas a receber — cada <tr data-value valor>. */
export function parseFaturasHtml(html) {
  const out = [];
  for (const row of dataValueRows(html)) {
    const valorAttr = row.attrs.match(/valor=["']([^"']+)["']/i);
    const valor = valorAttr ? Number(valorAttr[1]) : null;
    const tds = tdHtmls(row.inner);
    const vencimento = tds[2] ? stripTags(tds[2]) : null;
    const tituloHtml = tds[3] || '';
    const descricaoRaw = tds[4] ? stripTags(tds[4]) : '';
    const valorTexto = tds[5] ? stripTags(tds[5]) : null;

    const faturaM = tituloHtml.match(
      /Fatura\s+(\d+)\s+da nota fiscal n[\u00BAºo°]\s*(\d+)/i,
    );
    const idNotaM = tituloHtml.match(/id_nota=(\d+)/i);
    const pedidoM = tituloHtml.match(/Pedido\s+(\d+)/i);
    const clienteM = tituloHtml.match(/Cliente:\s*([^<\n]+)/i);
    const cnpjM = tituloHtml.match(/CNPJ:\s*([\d./-]+)/i);
    const titulo = stripTags(
      faturaM
        ? `Fatura ${faturaM[1]} da nota fiscal nº ${faturaM[2]}`
        : tituloHtml.split(/Pedido\s+\d+/i)[0] || '',
    );

    out.push({
      id: row.id,
      status: parseStatus(row.inner),
      vencimento,
      titulo: titulo || null,
      faturaN: faturaM ? Number(faturaM[1]) : null,
      nfNumero: faturaM ? Number(faturaM[2]) : null,
      idNota: idNotaM ? Number(idNotaM[1]) : null,
      pedido: pedidoM ? Number(pedidoM[1]) : null,
      cliente: clienteM ? stripTags(clienteM[1]) : null,
      cnpj: cnpjM ? cnpjM[1].trim() : null,
      descricao: descricaoRaw || null,
      valor: valor ?? parseMoney(valorTexto),
      valorTexto,
    });
  }
  return out;
}
