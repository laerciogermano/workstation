/**
 * Parse HTML da página ?page=contasareceber do portal franqueado.
 * Cada <tr data-value valor> = uma fatura (título a receber).
 */

const ROW_RE =
  /<tr[^>]*data-value=["'](\d+)["'][^>]*valor=["']([^"']+)["'][^>]*>([\s\S]*?)<\/tr>/gi;

function stripTags(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseStatus(inner) {
  const visible = [
    ...inner.matchAll(/<div class="status[^"]*"[^>]*>([\s\S]*?)<\/div>/gi),
  ];
  for (const m of visible) {
    if (/\bd-none\b/.test(m[0])) continue;
    if (/\bd-block\b/.test(m[0]) || !/\bd-none\b/.test(m[0])) {
      const t = stripTags(m[1]);
      if (t) return t;
    }
  }
  return null;
}

/**
 * @param {string} html
 * @returns {Array<Record<string, unknown>>}
 */
export function parseFaturasHtml(html) {
  const out = [];
  for (const m of html.matchAll(ROW_RE)) {
    const id = Number(m[1]);
    const valor = Number(m[2]);
    const inner = m[3];
    const tds = [...inner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1]);
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
      id,
      status: parseStatus(inner),
      vencimento,
      titulo: titulo || null,
      faturaN: faturaM ? Number(faturaM[1]) : null,
      nfNumero: faturaM ? Number(faturaM[2]) : null,
      idNota: idNotaM ? Number(idNotaM[1]) : null,
      pedido: pedidoM ? Number(pedidoM[1]) : null,
      cliente: clienteM ? stripTags(clienteM[1]) : null,
      cnpj: cnpjM ? cnpjM[1].trim() : null,
      descricao: descricaoRaw || null,
      valor,
      valorTexto,
    });
  }
  return out;
}
