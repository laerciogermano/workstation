import { stripTags } from './html-utils.js';

function moneyBr(text) {
  const t = stripTags(text).replace(/R\$\s*/i, '').trim();
  if (!t) return null;
  // 3.600,00 or 2600,00
  if (t.includes(',')) {
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function inputIn(block, name) {
  const esc = name.replace(/[[\]]/g, '\\$&');
  // primeiro value= após o name (há inputs com value duplicado, ex. lucro[])
  const re1 = new RegExp(
    `name=["']${esc}["'][^>]*?\\bvalue=["']([^"']*)["']`,
    'i',
  );
  const re2 = new RegExp(
    `\\bvalue=["']([^"']*)["'][^>]*?name=["']${esc}["']`,
    'i',
  );
  const re3 = new RegExp(
    `name=["']${esc}["'][^>]*?\\bvalue='([^']*)'`,
    'i',
  );
  const m = block.match(re1) || block.match(re2) || block.match(re3);
  return m ? stripTags(m[1]) || null : null;
}

/**
 * Parse HTML de POST ajax/pedidos/produtos.php
 * @param {string} html
 */
export function parsePedidoItensHtml(html) {
  const out = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const block = m[1];
    if (!/name=["']produto\[]["']/i.test(block)) continue;
    // pular linhas só de fornecedor aninhado sem produto principal
    const nome = inputIn(block, 'produto[]');
    if (!nome) continue;

    const qtd = moneyBr(inputIn(block, 'quantidade[]') || '0');
    const valorUnitario = moneyBr(inputIn(block, 'valor[]'));
    const valorExtra = moneyBr(inputIn(block, 'valor_extra[]'));
    const lucro = moneyBr(inputIn(block, 'lucro[]'));
    const totalM = block.match(
      /class=["']valor-produto["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i,
    );
    const unitM = block.match(
      /class=["']valor-unitario["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i,
    );
    const total = totalM ? moneyBr(totalM[1]) : null;
    const totalUnidade = unitM ? moneyBr(unitM[1]) : null;

    out.push({
      idProduto: (() => {
        const v = inputIn(block, 'id_produto[]');
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
      })(),
      produto: nome,
      ncm: inputIn(block, 'ncm[]'),
      quantidade: qtd,
      valorUnitario,
      lucroPercentual: lucro,
      valorExtra,
      total,
      totalUnidade,
    });
  }
  return out;
}
