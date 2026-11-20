/**
 * Teto duro de itens por resposta (listagens / enriquecimentos).
 * Só via env — sem query param nem paginação exposta.
 * Sempre mantém os mais recentes (data ↓, depois numero/id ↓).
 */
const raw = Number(process.env.EXTRACT_LIMIT || process.env.MAX_EXTRACT || 50);
export const EXTRACT_LIMIT = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50;

function parseBrDateMs(s) {
  const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return 0;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function itemDateMs(x) {
  return parseBrDateMs(x?.data || x?.vencimento || x?.dataEmissao);
}

function itemRank(x) {
  const n = Number(x?.numero);
  if (Number.isFinite(n) && n > 0) return n;
  const id = Number(x?.id);
  return Number.isFinite(id) ? id : 0;
}

/** Mais novos primeiro (data BR ↓, numero/id ↓). */
export function sortNewestFirst(items) {
  if (!Array.isArray(items) || items.length < 2) return items || [];
  return [...items].sort((a, b) => {
    const byDate = itemDateMs(b) - itemDateMs(a);
    if (byDate) return byDate;
    const byNum = itemRank(b) - itemRank(a);
    if (byNum) return byNum;
    return Number(b?.id || 0) - Number(a?.id || 0);
  });
}

/** Ordena do último → primeiro e corta no teto; nunca supera EXTRACT_LIMIT. */
export function capExtract(items) {
  if (!Array.isArray(items)) return items;
  const sorted = sortNewestFirst(items);
  if (sorted.length <= EXTRACT_LIMIT) return sorted;
  return sorted.slice(0, EXTRACT_LIMIT);
}
