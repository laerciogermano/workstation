/**
 * Criação de CDP LinkedIn (perfil + fingerprint).
 * Toda a lógica fica aqui; o CLI só chama createLinkedInCdp().
 */
import { randomInt } from 'node:crypto';
import {
  listCdps,
  createCdp,
  updateCdp,
  getCdp,
  isPortListening,
} from '../human-cdp/src/index.mjs';

const DEFAULT_URL = 'https://www.linkedin.com/signup';
const PORT_START = 9237;

function pick(arr) {
  return arr[randomInt(arr.length)];
}

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

/** Catálogo coerente OS ↔ UA ↔ Client Hints (desktop). */
const OS_PROFILES = [
  {
    platform: 'Win32',
    uaOs: 'Windows NT 10.0; Win64; x64',
    meta: {
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
  {
    platform: 'Win32',
    uaOs: 'Windows NT 10.0; Win64; x64',
    meta: {
      platform: 'Windows',
      platformVersion: '15.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
  {
    platform: 'MacIntel',
    uaOs: 'Macintosh; Intel Mac OS X 10_15_7',
    meta: {
      platform: 'macOS',
      platformVersion: '14.5.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
  {
    platform: 'MacIntel',
    uaOs: 'Macintosh; Intel Mac OS X 10_15_7',
    meta: {
      platform: 'macOS',
      platformVersion: '14.6.0',
      architecture: 'arm',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
];

const CHROME_BUILDS = [
  { major: '129', full: '129.0.6668.100', brandNot: { short: '8', full: '10.0.0.4', name: 'Not=A?Brand' } },
  { major: '130', full: '130.0.6723.117', brandNot: { short: '99', full: '10.0.1.4', name: 'Not?A_Brand' } },
  { major: '131', full: '131.0.6778.205', brandNot: { short: '24', full: '10.0.2.3', name: 'Not_A Brand' } },
  { major: '132', full: '132.0.6834.110', brandNot: { short: '99', full: '10.0.1.4', name: 'Not?A_Brand' } },
];

/** Cidade BR ↔ timezone ↔ geo (jitter leve na geração). */
const BR_LOCALES = [
  { timezone: 'America/Sao_Paulo', lat: -23.5505, lon: -46.6333 }, // SP
  { timezone: 'America/Sao_Paulo', lat: -22.9068, lon: -43.1729 }, // RJ
  { timezone: 'America/Sao_Paulo', lat: -25.4284, lon: -49.2733 }, // Curitiba
  { timezone: 'America/Sao_Paulo', lat: -19.9167, lon: -43.9345 }, // BH
  { timezone: 'America/Fortaleza', lat: -3.7319, lon: -38.5267 }, // Fortaleza
  { timezone: 'America/Recife', lat: -8.0476, lon: -34.877 }, // Recife
  { timezone: 'America/Bahia', lat: -12.9714, lon: -38.5014 }, // Salvador
  { timezone: 'America/Manaus', lat: -3.119, lon: -60.0217 }, // Manaus
  { timezone: 'America/Belem', lat: -1.4558, lon: -48.4902 }, // Belém
  { timezone: 'America/Cuiaba', lat: -15.601, lon: -56.0974 }, // Cuiabá
];

const HW_OPTS = [4, 6, 8, 12, 16];
const MEM_OPTS = [4, 8, 16];
const WEBRTC_OPTS = ['default_public_interface_only', 'disable_non_proxied_udp'];

function jitter(n, delta = 0.02) {
  return Number((n + (Math.random() * 2 - 1) * delta).toFixed(4));
}

function existingFpKeys() {
  const keys = new Set();
  for (const c of listCdps()) {
    const fp = c.fingerprint;
    if (!fp) continue;
    keys.add(`${fp.timezone}|${fp.userAgent}|${fp.hardwareConcurrency}|${fp.deviceMemory}`);
  }
  return keys;
}

/**
 * Fingerprint novo e coerente a cada chamada (sem viewport).
 * Evita colisão grosseira com CDPs já existentes (tz+UA+hw+mem).
 */
export function generateFingerprint() {
  const used = existingFpKeys();
  for (let i = 0; i < 40; i++) {
    const os = pick(OS_PROFILES);
    const chrome = pick(CHROME_BUILDS);
    const city = pick(BR_LOCALES);
    const hw = pick(HW_OPTS);
    const mem = pick(MEM_OPTS);
    const userAgent = `Mozilla/5.0 (${os.uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome.major}.0.0.0 Safari/537.36`;
    const key = `${city.timezone}|${userAgent}|${hw}|${mem}`;
    if (used.has(key) && i < 35) continue;

    return {
      userAgent,
      platform: os.platform,
      lang: 'pt-BR',
      acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      timezone: city.timezone,
      locale: 'pt-BR',
      geolocation: {
        latitude: jitter(city.lat),
        longitude: jitter(city.lon),
        accuracy: 30 + randomInt(40),
      },
      hardwareConcurrency: hw,
      deviceMemory: mem,
      maxTouchPoints: 0,
      touch: false,
      webrtcIpHandling: pick(WEBRTC_OPTS),
      userAgentMetadata: {
        ...os.meta,
        brands: [
          { brand: 'Chromium', version: chrome.major },
          { brand: chrome.brandNot.name, version: chrome.brandNot.short },
          { brand: 'Google Chrome', version: chrome.major },
        ],
        fullVersionList: [
          { brand: 'Chromium', version: chrome.full },
          { brand: chrome.brandNot.name, version: chrome.brandNot.full },
          { brand: 'Google Chrome', version: chrome.full },
        ],
      },
    };
  }
  throw new Error('generateFingerprint: não achou combinação distinta');
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
