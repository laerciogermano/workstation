/**
 * Criação de CDP LinkedIn (perfil + fingerprint).
 * Toda a lógica fica aqui; o CLI só chama createLinkedInCdp().
 *
 * Fingerprint: catálogo/geração em human-cdp (`generateFingerprint`).
 */
import {
  listCdps,
  createCdp,
  updateCdp,
  getCdp,
  isPortListening,
  generateFingerprint,
} from '../human-cdp/src/index.mjs';

export { generateFingerprint } from '../human-cdp/src/index.mjs';

const DEFAULT_URL = 'https://www.linkedin.com/signup';
const PORT_START = 9237;

function slugId(first, last) {
  return `${first}-${last}`
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
}

function freePort(start = PORT_START) {
  const used = new Set();
  for (const c of listCdps()) {
    if (c.port != null) used.add(c.port);
    if (c.preferredPort != null) used.add(c.preferredPort);
  }
  let port = start;
  while (used.has(port) || isPortListening(port)) port += 1;
  return port;
}

/**
 * Cria o CDP (perfil ~/chrome-profiles/<id> + meta + fingerprint).
 *
 * @param {{
 *   first?: string,
 *   last?: string,
 *   id?: string,
 *   name?: string,
 *   port?: number,
 *   fingerprint?: object,
 *   debug?: boolean,
 *   dryRun?: boolean,
 * }} opts
 */
export function createLinkedInCdp(opts = {}) {
  const first = String(opts.first || opts.nome || '').trim();
  const last = String(opts.last || opts.sobrenome || '').trim();
  const name =
    String(opts.name || opts.nomeCompleto || '').trim() ||
    (first && last ? `${first} ${last}` : '');
  const id = String(opts.id || (first && last ? slugId(first, last) : '')).trim();

  if (!id || !name) {
    throw new Error('createLinkedInCdp: informe first+last (ou id+name)');
  }

  const port = opts.port != null ? Number(opts.port) : freePort();
  const fingerprint = opts.fingerprint || generateFingerprint();
  // Default off — overlay no LinkedIn/signup só se pedir debug: true.
  const debug = opts.debug === true;
  const dryRun = !!opts.dryRun;

  if (dryRun) {
    return {
      id,
      name,
      port,
      dryRun: true,
      created: false,
      existed: false,
      fingerprint,
      debug,
    };
  }

  const existing = getCdp(id);
  if (existing?.hasMeta) {
    return {
      id,
      name: existing.name || name,
      port: existing.preferredPort || existing.port,
      created: false,
      existed: true,
      debug: existing.debug === true || debug,
    };
  }

  createCdp({
    id,
    name,
    port,
    defaultUrl: DEFAULT_URL,
    obs: `${name} / LinkedIn CDP`,
    fingerprint,
  });
  if (debug) updateCdp(id, { debug: true });

  const row = getCdp(id);
  return {
    id,
    name,
    port: row?.preferredPort || port,
    created: true,
    existed: false,
    fingerprint,
    debug,
    profile: `~/chrome-profiles/${id}`,
  };
}
