import { parseMoney, stripTags } from './html-utils.js';

/** Totais por vendedor na página HTML. */
export function parseFaturamentoHtml(html) {
  const out = [];
  const rows = [
    ...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi),
  ];
  for (const m of rows) {
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
      stripTags(c[1]),
    );
    if (cells.length < 2) continue;
    if (/^vendedor$/i.test(cells[0]) || !cells[0]) continue;
    if (/^total/i.test(cells[0])) continue;
    const vendM = cells[0].match(/#(\d+)\s*-\s*(.+)/);
    out.push({
      vendedorId: vendM ? Number(vendM[1]) : null,
      vendedor: vendM ? vendM[2].trim() : cells[0],
      total: parseMoney(cells[1]),
      totalTexto: cells[1] || null,
    });
  }
  return out;
}

/** Detalhe do Excel (HTML table): Vendedor, Nota, Pedido, Data, Total. */
export function parseFaturamentoExcel(html) {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)].map(
    (m) => m[1],
  );
  const detalhe = [];
  let porVendedor = [];
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    let mode = null;
    for (const r of rows) {
      const cells = [
        ...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi),
      ].map((c) => stripTags(c[1]));
      if (!cells.length) continue;
      const head = cells.join('|').toLowerCase();
      if (head.includes('vendedor') && head.includes('faturamento') && !head.includes('nota')) {
        mode = 'totais';
        continue;
      }
      if (head.includes('vendedor') && head.includes('nota')) {
        mode = 'detalhe';
        continue;
      }
      if (mode === 'totais' && cells[0] && !/^total/i.test(cells[0])) {
        porVendedor.push({
          vendedor: cells[0],
          total: parseMoney(cells[1]),
          totalTexto: cells[1] || null,
        });
      }
      if (mode === 'detalhe' && cells.length >= 5 && /^\d+$/.test(cells[1] || '')) {
        detalhe.push({
          vendedor: cells[0] || null,
          nota: Number(cells[1]),
          pedido: Number(cells[2]) || null,
          data: cells[3] || null,
          total: parseMoney(cells[4]),
          totalTexto: cells[4] || null,
        });
      }
    }
  }
  if (!porVendedor.length) porVendedor = parseFaturamentoHtml(html);
  return { porVendedor, detalhe };
}
