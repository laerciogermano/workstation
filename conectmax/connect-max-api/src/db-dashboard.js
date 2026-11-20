import { query } from './db.js';
import { capExtract } from './extract-limit.js';
import {
  LOCKED_FRANQUIA_ID,
  LOCKED_FRANQUIA_NOME,
  lockedFranquiaId,
} from './franquia.js';

function franquiaId(_q) {
  return lockedFranquiaId();
}

export function parseBrDate(s) {
  const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function inRange(dateStr, fromBr, toBr) {
  const d = parseBrDate(dateStr);
  const a = parseBrDate(fromBr);
  const b = parseBrDate(toBr);
  if (!d || !a || !b) return true;
  return d >= a && d <= b;
}

function porStatus(items) {
  const out = {};
  for (const x of items) {
    const k = x.status || 'desconhecido';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function sumField(items, field) {
  return (
    Math.round(
      items.reduce((s, x) => s + (Number(x[field]) || 0), 0) * 100,
    ) / 100
  );
}

function filterStatus(items, status) {
  if (!status) return items;
  const needle = String(status).trim().toLowerCase();
  return items.filter((x) => String(x.status || '').toLowerCase() === needle);
}

async function metaFranquia(fid) {
  const { rows } = await query(
    `SELECT id, COALESCE(nome, razao_social) AS nome, razao_social, cnpj, synced_at
     FROM portal_franqueado.franquia WHERE id = $1`,
    [fid],
  );
  return rows[0] || null;
}

function wrapList(fid, meta, range, listKey, valueField, items, fonte) {
  const capped = capExtract(items);
  return {
    fonte,
    franquiaId: fid,
    franquiaNome: meta?.nome || null,
    syncedAt: meta?.synced_at || null,
    dataInicial: range.data_inicial,
    dataFinal: range.data_final,
    total: capped.length,
    totalValor: sumField(capped, valueField),
    porStatus: porStatus(capped),
    [listKey]: capped,
  };
}

/** Shape dashboard /orcamentos */
export async function dbOrcamentos(q, range) {
  const fid = franquiaId(q);
  const meta = await metaFranquia(fid);
  const { rows } = await query(
    `SELECT id, numero, data, status, cliente_nome, vendedor_nome, total, total_texto
     FROM portal_franqueado.orcamento
     WHERE franquia_id = $1
     ORDER BY id DESC`,
    [fid],
  );
  let items = rows.map((r) => ({
    id: Number(r.id),
    numero: r.numero,
    data: r.data,
    status: r.status,
    cliente: r.cliente_nome,
    vendedor: r.vendedor_nome,
    total: r.total,
    totalTexto: r.total_texto,
  }));
  items = items.filter((x) => inRange(x.data, range.data_inicial, range.data_final));
  items = filterStatus(items, q.status);
  return wrapList(
    fid,
    meta,
    range,
    'orcamentos',
    'total',
    items,
    'postgres · portal_franqueado.orcamento',
  );
}

/** Shape dashboard /pedidos */
export async function dbPedidos(q, range) {
  const fid = franquiaId(q);
  const meta = await metaFranquia(fid);
  const { rows } = await query(
    `SELECT id, numero, data, orcamento_id, status, cliente_nome, vendedor_nome, total, total_texto
     FROM portal_franqueado.pedido
     WHERE franquia_id = $1
     ORDER BY id DESC`,
    [fid],
  );
  let items = rows.map((r) => ({
    id: Number(r.id),
    numero: r.numero,
    data: r.data,
    orcamento: r.orcamento_id != null ? Number(r.orcamento_id) : null,
    status: r.status,
    cliente: r.cliente_nome,
    vendedor: r.vendedor_nome,
    total: r.total,
    totalTexto: r.total_texto,
  }));
  items = items.filter((x) => inRange(x.data, range.data_inicial, range.data_final));
  items = filterStatus(items, q.status);
  return wrapList(
    fid,
    meta,
    range,
    'pedidos',
    'total',
    items,
    'postgres · portal_franqueado.pedido',
  );
}

/** Shape dashboard /notas-fiscais */
export async function dbNotasFiscais(q, range) {
  const fid = franquiaId(q);
  const meta = await metaFranquia(fid);
  const { rows } = await query(
    `SELECT id, numero, status, tipo, cliente_nome, data, transportadora, total, total_texto, pdf, xml_url
     FROM portal_franqueado.nota_fiscal
     WHERE franquia_id = $1
     ORDER BY id DESC`,
    [fid],
  );
  let items = rows.map((r) => ({
    id: Number(r.id),
    status: r.status,
    tipo: r.tipo,
    numero: r.numero,
    cliente: r.cliente_nome,
    data: r.data,
    transportadora: r.transportadora,
    total: r.total,
    totalTexto: r.total_texto,
    pdf: r.pdf,
    xml: r.xml_url,
  }));
  items = items.filter((x) => inRange(x.data, range.data_inicial, range.data_final));
  items = filterStatus(items, q.status);
  return wrapList(
    fid,
    meta,
    range,
    'notasFiscais',
    'total',
    items,
    'postgres · portal_franqueado.nota_fiscal',
  );
}

/** Shape dashboard /faturas */
export async function dbFaturas(q, range) {
  const fid = franquiaId(q);
  const meta = await metaFranquia(fid);
  const { rows } = await query(
    `SELECT id, status, vencimento, titulo, fatura_n, nf_numero, nota_id, pedido_id,
            cliente_nome, cnpj, descricao, valor, valor_texto, email, telefone, whatsapp
     FROM portal_franqueado.conta_receber
     WHERE franquia_id = $1
     ORDER BY id DESC`,
    [fid],
  );
  let items = rows.map((r) => ({
    id: Number(r.id),
    status: r.status,
    vencimento: r.vencimento,
    titulo: r.titulo,
    faturaN: r.fatura_n,
    nfNumero: r.nf_numero,
    idNota: r.nota_id != null ? Number(r.nota_id) : null,
    pedido: r.pedido_id != null ? Number(r.pedido_id) : null,
    cliente: r.cliente_nome,
    cnpj: r.cnpj,
    descricao: r.descricao,
    valor: r.valor,
    valorTexto: r.valor_texto,
    email: r.email,
    telefone: r.telefone,
    whatsapp: r.whatsapp,
  }));
  items = items.filter((x) =>
    inRange(x.vencimento, range.data_inicial, range.data_final),
  );
  items = filterStatus(items, q.status);
  return wrapList(
    fid,
    meta,
    range,
    'faturas',
    'valor',
    items,
    'postgres · portal_franqueado.conta_receber',
  );
}

export async function dbAtrasados(q, range) {
  const base = await dbFaturas({ ...q, status: 'Vencida' }, range);
  return {
    ...base,
    fonte: 'postgres · portal_franqueado.conta_receber · status=Vencida',
  };
}

export async function dbVendedores(q) {
  const fid = franquiaId(q);
  const { rows } = await query(
    `SELECT id, portal_id AS "portalId", nome
     FROM portal_franqueado.vendedor
     WHERE franquia_id = $1
     ORDER BY nome`,
    [fid],
  );
  const vendedores = capExtract(rows);
  return {
    fonte: 'postgres · portal_franqueado.vendedor',
    franquiaId: fid,
    total: vendedores.length,
    vendedores,
  };
}

export async function dbClientes(q) {
  const fid = franquiaId(q);
  const { rows } = await query(
    `SELECT id, cnpj, nome, email, telefone, whatsapp
     FROM portal_franqueado.cliente
     WHERE franquia_id = $1
     ORDER BY nome`,
    [fid],
  );
  const clientes = capExtract(rows);
  return {
    fonte: 'postgres · portal_franqueado.cliente',
    franquiaId: fid,
    total: clientes.length,
    clientes,
  };
}

export async function dbPedidoItens(q) {
  const fid = franquiaId(q);
  const pedidoId = Number(q.pedido_id || q.id_pedido || q.id);
  if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
    throw new Error('pedido_id obrigatório');
  }
  const { rows } = await query(
    `SELECT pedido_id AS "pedidoId", seq, id_produto AS "idProduto", produto, ncm,
            quantidade, valor_unitario AS "valorUnitario",
            lucro_percentual AS "lucroPercentual", valor_extra AS "valorExtra",
            total, total_unidade AS "totalUnidade"
     FROM portal_franqueado.pedido_item
     WHERE franquia_id = $1 AND pedido_id = $2
     ORDER BY seq`,
    [fid, pedidoId],
  );
  const itens = capExtract(rows);
  return {
    fonte: 'postgres · portal_franqueado.pedido_item',
    franquiaId: fid,
    pedidoId,
    total: itens.length,
    itens,
  };
}

export async function dbFaturamentoLinhas(q, range) {
  const fid = franquiaId(q);
  const { rows } = await query(
    `SELECT id, vendedor_nome AS vendedor, nota, pedido, data, total
     FROM portal_franqueado.faturamento_linha
     WHERE franquia_id = $1
     ORDER BY id`,
    [fid],
  );
  let items = rows.map((r) => ({
    id: Number(r.id),
    vendedor: r.vendedor,
    nota: r.nota,
    pedido: r.pedido,
    data: r.data,
    total: r.total,
  }));
  items = capExtract(
    items.filter((x) => inRange(x.data, range.data_inicial, range.data_final)),
  );
  return {
    fonte: 'postgres · portal_franqueado.faturamento_linha',
    franquiaId: fid,
    dataInicial: range.data_inicial,
    dataFinal: range.data_final,
    total: items.length,
    totalValor: sumField(items, 'total'),
    detalhe: items,
  };
}

export async function assertCampinasPedido(pedidoId) {
  const fid = lockedFranquiaId();
  const id = Number(pedidoId);
  if (!Number.isFinite(id) || id <= 0) {
    const err = new Error('id de pedido inválido');
    err.status = 400;
    throw err;
  }
  const { rows } = await query(
    `SELECT id FROM portal_franqueado.pedido
     WHERE franquia_id = $1 AND id = $2
     LIMIT 1`,
    [fid, id],
  );
  if (!rows.length) {
    const err = new Error(
      `pedido fora da franquia ${LOCKED_FRANQUIA_NOME} (${fid})`,
    );
    err.status = 403;
    throw err;
  }
  return id;
}

export async function dbHealth() {
  const fid = lockedFranquiaId();
  const { rows } = await query(
    `
    SELECT f.id,
      COALESCE(f.nome, f.razao_social) AS nome,
      f.razao_social,
      f.cnpj,
      f.synced_at,
      (SELECT count(*)::int FROM portal_franqueado.vendedor v WHERE v.franquia_id=f.id) AS vendedores,
      (SELECT count(*)::int FROM portal_franqueado.cliente c WHERE c.franquia_id=f.id) AS clientes,
      (SELECT count(*)::int FROM portal_franqueado.orcamento o WHERE o.franquia_id=f.id) AS orcamentos,
      (SELECT count(*)::int FROM portal_franqueado.pedido p WHERE p.franquia_id=f.id) AS pedidos,
      (SELECT count(*)::int FROM portal_franqueado.pedido_item i WHERE i.franquia_id=f.id) AS pedido_itens,
      (SELECT count(*)::int FROM portal_franqueado.nota_fiscal n WHERE n.franquia_id=f.id) AS notas,
      (SELECT count(*)::int FROM portal_franqueado.conta_receber r WHERE r.franquia_id=f.id) AS contas,
      (SELECT count(*)::int FROM portal_franqueado.faturamento_linha l WHERE l.franquia_id=f.id) AS faturamento_linhas
    FROM portal_franqueado.franquia f
    WHERE f.id = $1
  `,
    [fid],
  );
  return {
    ok: true,
    fonte: 'postgres · portal_franqueado (normalizado)',
    franquiaTravada: {
      id: LOCKED_FRANQUIA_ID,
      nome: LOCKED_FRANQUIA_NOME,
    },
    franquias: rows,
  };
}
