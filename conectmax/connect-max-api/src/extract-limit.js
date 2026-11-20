/**
 * Teto duro de itens por resposta (listagens / enriquecimentos).
 * Só via env — sem query param nem paginação exposta.
 */
const raw = Number(process.env.EXTRACT_LIMIT || process.env.MAX_EXTRACT || 100);
export const EXTRACT_LIMIT = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 100;

/** Corta o array no teto; nunca supera EXTRACT_LIMIT. */
export function capExtract(items) {
  if (!Array.isArray(items)) return items;
  if (items.length <= EXTRACT_LIMIT) return items;
  return items.slice(0, EXTRACT_LIMIT);
}
