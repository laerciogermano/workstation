/**
 * Única franquia permitida nesta API: ConnectMax Campinas.
 * Cliente não escolhe franquia (query ignorada / sobrescrita).
 */
const raw = Number(process.env.FRANQUIA_ID || 9);
export const LOCKED_FRANQUIA_ID =
  Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 9;
export const LOCKED_FRANQUIA_NOME =
  process.env.FRANQUIA_NOME || 'Campinas';

/** Sempre Campinas — ignora franquia_id / franquia da query. */
export function lockedFranquiaId() {
  return LOCKED_FRANQUIA_ID;
}

const FRANQUIA_QUERY_KEYS = new Set([
  'franquia_id',
  'franquia',
  'id_franqueado',
  'id_franqueado_rel',
]);

/** Remove tentativas de trocar franquia na query da API. */
export function stripClientFranquia(q = {}) {
  const out = { ...q };
  for (const k of FRANQUIA_QUERY_KEYS) delete out[k];
  return out;
}

/**
 * Força id de franquia nos params enviados ao portal.
 * Nunca propaga id de outra unidade.
 */
export function forcePortalFranquia(query = {}) {
  const out = { ...query };
  for (const k of FRANQUIA_QUERY_KEYS) delete out[k];
  out.id_franqueado = LOCKED_FRANQUIA_ID;
  out.id_franqueado_rel = LOCKED_FRANQUIA_ID;
  return out;
}
