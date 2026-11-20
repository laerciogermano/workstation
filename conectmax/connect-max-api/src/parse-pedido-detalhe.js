import { stripTags } from './html-utils.js';

function inputValue(html, name) {
  const re1 = new RegExp(
    `name=["']${name}["'][^>]*value=["']([^"']*)["']`,
    'i',
  );
  const re2 = new RegExp(
    `value=["']([^"']*)["'][^>]*name=["']${name}["']`,
    'i',
  );
  const m = html.match(re1) || html.match(re2);
  return m ? stripTags(m[1]) || null : null;
}

function selectedOption(html, name) {
  const m = html.match(
    new RegExp(
      `<select[^>]*name=["']${name}["'][^>]*>([\\s\\S]*?)</select>`,
      'i',
    ),
  );
  if (!m) return null;
  return m[1].match(/<option([^>]*)>([\s\S]*?)<\/option>/i)
    ? [...m[1].matchAll(/<option([^>]*)>([\s\S]*?)<\/option>/gi)].find((o) =>
        /\bselected\b/i.test(o[1]),
      ) || null
    : null;
}

function selectLabel(html, name) {
  const sel = selectedOption(html, name);
  return sel ? stripTags(sel[2]) || null : null;
}

function selectValue(html, name) {
  const sel = selectedOption(html, name);
  if (!sel) return null;
  const vm = sel[1].match(/value=["']([^"']*)["']/i);
  return vm ? vm[1] || null : null;
}

function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '') || null;
}

/**
 * Parse HTML de ?page=pedidos_edicao&id_pedido=&action=visualizar
 * @param {string} html
 * @param {number} [idPedido]
 */
export function parsePedidoDetalheHtml(html, idPedido) {
  if (/name=["']usuario["']/i.test(html) && /senha/i.test(html)) {
    throw new Error('login requerido');
  }
  const id =
    Number(inputValue(html, 'id_pedido')) ||
    Number(idPedido) ||
    null;
  if (!id) throw new Error('pedido não encontrado');

  const email = inputValue(html, 'email');
  const telefone = inputValue(html, 'telefone');
  const telefoneDigits = digitsOnly(telefone);

  return {
    id,
    status: inputValue(html, 'status'),
    cliente: inputValue(html, 'nome'),
    cnpj: inputValue(html, 'cnpj_cpf'),
    email,
    telefone,
    /** Dígitos do telefone — útil para WhatsApp */
    whatsapp: telefoneDigits,
    vendedor: selectLabel(html, 'id_vendedor'),
    vendedorId: selectValue(html, 'id_vendedor'),
  };
}
