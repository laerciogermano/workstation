/** Cache em memória de contato por id_pedido (TTL). */
const store = new Map();
const TTL_MS = Number(process.env.CONTATO_CACHE_TTL_MS || 30 * 60 * 1000);

export function getContatoCached(pedidoId) {
  const hit = store.get(Number(pedidoId));
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(Number(pedidoId));
    return null;
  }
  return hit.data;
}

export function setContatoCached(pedidoId, data) {
  store.set(Number(pedidoId), { at: Date.now(), data });
}

export function clearContatoCache() {
  store.clear();
}
