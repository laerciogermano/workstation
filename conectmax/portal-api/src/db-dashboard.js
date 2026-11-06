import { query } from './db.js';

const DEFAULT_FRANQUIA = 9;

function franquiaId(q) {
  const n = Number(q.franquia_id || q.franquia || DEFAULT_FRANQUIA);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_FRANQUIA;
}

/** "05/11/2026" ou "01/04/2025 às 09:42:38" → Date local */
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

/**
 * @param {string} table
 * @param {string} dateField campo no payload: data | vencimento
 * @param {string} listKey
 * @param {string} valueField
 */
async function listFromDb(table, dateField, listKey, valueField, q, range) {
  const fid = franquiaId(q);
  const { rows } = await query(
    `SELECT payload FROM portal_franqueado.${table}
     WHERE franquia_id = $1
     ORDER BY id DESC`,
    [fid],
  );
  let items = rows.map((r) => r.payload);
  items = items.filter((x) => inRange(x?.[dateField], range.data_inicial, range.data_final));
  items = filterStatus(items, q.status);

  const { rows: meta } = await query(
    `SELECT id, nome, synced_at FROM portal_franqueado.franquia WHERE id = $1`,
    [fid],
  );

  return {
    fonte: `postgres · portal_franqueado.${table}`,
    franquiaId: fid,
    franquiaNome: meta[0]?.nome || null,
    syncedAt: meta[0]?.synced_at || null,
    dataInicial: range.data_inicial,
    dataFinal: range.data_final,
    total: items.length,
    totalValor: sumField(items, valueField),
    porStatus: porStatus(items),
    [listKey]: items,
  };
}

export async function dbOrcamentos(q, range) {
  return listFromDb('orcamentos', 'data', 'orcamentos', 'total', q, range);
}

export async function dbPedidos(q, range) {
  return listFromDb('pedidos', 'data', 'pedidos', 'total', q, range);
}

export async function dbNotasFiscais(q, range) {
  return listFromDb('notas_fiscais', 'data', 'notasFiscais', 'total', q, range);
}

export async function dbFaturas(q, range) {
  return listFromDb('faturas', 'vencimento', 'faturas', 'valor', q, range);
}

export async function dbAtrasados(q, range) {
  const base = await dbFaturas({ ...q, status: 'Vencida' }, range);
  return {
    ...base,
    fonte: 'postgres · portal_franqueado.faturas · status=Vencida',
  };
}

export async function dbHealth() {
  const { rows } = await query(`
    SELECT f.id, f.nome, f.synced_at,
      (SELECT count(*)::int FROM portal_franqueado.orcamentos o WHERE o.franquia_id=f.id) AS orcamentos,
      (SELECT count(*)::int FROM portal_franqueado.pedidos p WHERE p.franquia_id=f.id) AS pedidos,
      (SELECT count(*)::int FROM portal_franqueado.notas_fiscais n WHERE n.franquia_id=f.id) AS notas,
      (SELECT count(*)::int FROM portal_franqueado.faturas c WHERE c.franquia_id=f.id) AS faturas
    FROM portal_franqueado.franquia f
    ORDER BY f.id
  `);
  return { ok: true, fonte: 'postgres · portal_franqueado', franquias: rows };
}
