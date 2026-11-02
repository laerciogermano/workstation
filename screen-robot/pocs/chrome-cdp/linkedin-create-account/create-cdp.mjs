/**
 * Criação de CDP LinkedIn (perfil + fingerprint).
 * Toda a lógica fica aqui; o CLI só chama createLinkedInCdp().
 */
import {
  listCdps,
  createCdp,
  updateCdp,
  getCdp,
  isPortListening,
} from '../human-cdp/src/index.mjs';

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

/** Fingerprint default LinkedIn: Win/Chrome130/Curitiba — sem viewport. */
function defaultFingerprint() {
  return {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32',
    lang: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    geolocation: { latitude: -25.4284, longitude: -49.2733, accuracy: 45 },
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    touch: false,
    webrtcIpHandling: 'default_public_interface_only',
    userAgentMetadata: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
      brands: [
        { brand: 'Chromium', version: '130' },
        { brand: 'Not?A_Brand', version: '99' },
        { brand: 'Google Chrome', version: '130' },
      ],
      fullVersionList: [
        { brand: 'Chromium', version: '130.0.6723.117' },
        { brand: 'Not?A_Brand', version: '10.0.1.4' },
        { brand: 'Google Chrome', version: '130.0.6723.117' },
      ],
    },
  };
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
  const fingerprint = opts.fingerprint || defaultFingerprint();
  const debug = opts.debug !== false;
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
    profile: `~/chrome-profiles/${id}`,
  };
}
