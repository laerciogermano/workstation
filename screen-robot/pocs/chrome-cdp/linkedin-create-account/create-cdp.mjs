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

/** Catálogo conservador (coerente) + Linux. Sem WOW64 / Chrome antigo / extremos. */
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
  {
    platform: 'MacIntel',
    uaOs: 'Macintosh; Intel Mac OS X 10_15_7',
    meta: {
      platform: 'macOS',
      platformVersion: '15.0.0',
      architecture: 'arm',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
  {
    platform: 'Linux x86_64',
    uaOs: 'X11; Linux x86_64',
    meta: {
      platform: 'Linux',
      platformVersion: '6.5.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
  {
    platform: 'Linux x86_64',
    uaOs: 'X11; Ubuntu; Linux x86_64',
    meta: {
      platform: 'Linux',
      platformVersion: '6.8.0',
      architecture: 'x86',
      model: '',
      mobile: false,
      bitness: '64',
    },
  },
];

const BRAND_NOT = [
  { short: '8', full: '10.0.0.4', name: 'Not=A?Brand' },
  { short: '99', full: '10.0.1.4', name: 'Not?A_Brand' },
  { short: '24', full: '10.0.2.3', name: 'Not_A Brand' },
];

const CHROME_BUILDS = [
  { major: '129', full: '129.0.6668.100' },
  { major: '130', full: '130.0.6723.91' },
  { major: '130', full: '130.0.6723.117' },
  { major: '131', full: '131.0.6778.109' },
  { major: '131', full: '131.0.6778.205' },
  { major: '132', full: '132.0.6834.110' },
  { major: '132', full: '132.0.6834.159' },
];

const BR_LOCALES = [
  { timezone: 'America/Sao_Paulo', lat: -23.5505, lon: -46.6333 }, // SP
  { timezone: 'America/Sao_Paulo', lat: -22.9068, lon: -43.1729 }, // RJ
  { timezone: 'America/Sao_Paulo', lat: -25.4284, lon: -49.2733 }, // Curitiba
  { timezone: 'America/Sao_Paulo', lat: -19.9167, lon: -43.9345 }, // BH
  { timezone: 'America/Sao_Paulo', lat: -30.0346, lon: -51.2177 }, // Porto Alegre
  { timezone: 'America/Sao_Paulo', lat: -22.9099, lon: -47.0626 }, // Campinas
  { timezone: 'America/Sao_Paulo', lat: -15.8267, lon: -47.9218 }, // Brasília
  { timezone: 'America/Fortaleza', lat: -3.7319, lon: -38.5267 }, // Fortaleza
  { timezone: 'America/Recife', lat: -8.0476, lon: -34.877 }, // Recife
  { timezone: 'America/Bahia', lat: -12.9714, lon: -38.5014 }, // Salvador
  { timezone: 'America/Manaus', lat: -3.119, lon: -60.0217 }, // Manaus
  { timezone: 'America/Belem', lat: -1.4558, lon: -48.4902 }, // Belém
  { timezone: 'America/Cuiaba', lat: -15.601, lon: -56.0974 }, // Cuiabá
];

const HW_OPTS = [4, 6, 8, 12, 16];
const MEM_OPTS = [4, 8, 16];
const WEBRTC_OPTS = ['default_public_interface_only'];

const LANG_OPTS = [
  {
    lang: 'pt-BR',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },
];

function jitter(n, delta = 0.035) {
  return Number((n + (Math.random() * 2 - 1) * delta).toFixed(4));
}

function existingFpKeys() {
  const keys = new Set();
  for (const c of listCdps()) {
    const fp = c.fingerprint;
    if (!fp) continue;
    const pv = fp.userAgentMetadata?.platformVersion || '';
    keys.add(
      `${fp.timezone}|${fp.userAgent}|${fp.platform}|${pv}|${fp.hardwareConcurrency}|${fp.deviceMemory}`,
    );
  }
  return keys;
}

/**
 * Fingerprint novo e coerente a cada chamada (sem viewport).
 * Sorteia Mozilla/OS/Chrome/cidade/hw entre o catálogo ampliado.
 */
export function generateFingerprint() {
  const used = existingFpKeys();
  for (let i = 0; i < 80; i++) {
    const os = pick(OS_PROFILES);
    const chrome = pick(CHROME_BUILDS);
    const brandNot = pick(BRAND_NOT);
    const city = pick(BR_LOCALES);
    const hw = pick(HW_OPTS);
    const mem = pick(MEM_OPTS);
    const lang = pick(LANG_OPTS);
    const userAgent = `Mozilla/5.0 (${os.uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome.major}.0.0.0 Safari/537.36`;
    const key = `${city.timezone}|${userAgent}|${os.platform}|${os.meta.platformVersion}|${hw}|${mem}`;
    if (used.has(key) && i < 70) continue;

    return {
      userAgent,
      platform: os.platform,
      lang: lang.lang,
      acceptLanguage: lang.acceptLanguage,
      timezone: city.timezone,
      locale: lang.locale,
      geolocation: {
        latitude: jitter(city.lat),
        longitude: jitter(city.lon),
        accuracy: 20 + randomInt(80),
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
          { brand: brandNot.name, version: brandNot.short },
          { brand: 'Google Chrome', version: chrome.major },
        ],
        fullVersionList: [
          { brand: 'Chromium', version: chrome.full },
          { brand: brandNot.name, version: brandNot.full },
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
