/**
 * Catálogo + geração de fingerprint coerente (UA ↔ CH ↔ tz ↔ hw/mem).
 * Usado pela UI de gestão e por createLinkedInCdp.
 */
import { randomInt } from 'node:crypto';
import { listCdps } from './registry.mjs';
import { normalizeFingerprint } from './fingerprint.mjs';

function pick(arr) {
  return arr[randomInt(arr.length)];
}

/** Catálogo conservador (coerente) + Linux. Sem WOW64 / Chrome antigo / extremos. */
export const OS_PROFILES = [
  {
    id: 'win10',
    label: 'Windows 10 · Win64',
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
    id: 'win11',
    label: 'Windows 11 · Win64',
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
    id: 'mac14-intel',
    label: 'macOS 14.5 · Intel',
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
    id: 'mac14-arm',
    label: 'macOS 14.6 · Apple Silicon',
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
    id: 'mac15-arm',
    label: 'macOS 15 · Apple Silicon',
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
    id: 'linux',
    label: 'Linux x86_64',
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
    id: 'ubuntu',
    label: 'Ubuntu · Linux x86_64',
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

export const CHROME_BUILDS = [
  { id: '129.0.6668.100', major: '129', full: '129.0.6668.100', label: 'Chrome 129.0.6668.100' },
  { id: '130.0.6723.91', major: '130', full: '130.0.6723.91', label: 'Chrome 130.0.6723.91' },
  { id: '130.0.6723.117', major: '130', full: '130.0.6723.117', label: 'Chrome 130.0.6723.117' },
  { id: '131.0.6778.109', major: '131', full: '131.0.6778.109', label: 'Chrome 131.0.6778.109' },
  { id: '131.0.6778.205', major: '131', full: '131.0.6778.205', label: 'Chrome 131.0.6778.205' },
  { id: '132.0.6834.110', major: '132', full: '132.0.6834.110', label: 'Chrome 132.0.6834.110' },
  { id: '132.0.6834.159', major: '132', full: '132.0.6834.159', label: 'Chrome 132.0.6834.159' },
];

export const BR_LOCALES = [
  { id: 'sp', label: 'São Paulo', timezone: 'America/Sao_Paulo', lat: -23.5505, lon: -46.6333 },
  { id: 'rj', label: 'Rio de Janeiro', timezone: 'America/Sao_Paulo', lat: -22.9068, lon: -43.1729 },
  { id: 'curitiba', label: 'Curitiba', timezone: 'America/Sao_Paulo', lat: -25.4284, lon: -49.2733 },
  { id: 'bh', label: 'Belo Horizonte', timezone: 'America/Sao_Paulo', lat: -19.9167, lon: -43.9345 },
  { id: 'poa', label: 'Porto Alegre', timezone: 'America/Sao_Paulo', lat: -30.0346, lon: -51.2177 },
  { id: 'campinas', label: 'Campinas', timezone: 'America/Sao_Paulo', lat: -22.9099, lon: -47.0626 },
  { id: 'bsb', label: 'Brasília', timezone: 'America/Sao_Paulo', lat: -15.8267, lon: -47.9218 },
  { id: 'fortaleza', label: 'Fortaleza', timezone: 'America/Fortaleza', lat: -3.7319, lon: -38.5267 },
  { id: 'recife', label: 'Recife', timezone: 'America/Recife', lat: -8.0476, lon: -34.877 },
  { id: 'salvador', label: 'Salvador', timezone: 'America/Bahia', lat: -12.9714, lon: -38.5014 },
  { id: 'manaus', label: 'Manaus', timezone: 'America/Manaus', lat: -3.119, lon: -60.0217 },
  { id: 'belem', label: 'Belém', timezone: 'America/Belem', lat: -1.4558, lon: -48.4902 },
  { id: 'cuiaba', label: 'Cuiabá', timezone: 'America/Cuiaba', lat: -15.601, lon: -56.0974 },
];

export const HW_OPTS = [4, 6, 8, 12, 16];
export const MEM_OPTS = [4, 8, 16];
export const WEBRTC_OPTS = ['default_public_interface_only'];
export const COLOR_SCHEME_OPTS = ['light', 'dark', 'no-preference'];
export const REDUCED_MOTION_OPTS = ['no-preference', 'reduce'];

export const LANG_OPTS = [
  {
    id: 'pt-BR',
    label: 'pt-BR',
    lang: 'pt-BR',
    locale: 'pt-BR',
    acceptLanguage: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },
  {
    id: 'en-US',
    label: 'en-US',
    lang: 'en-US',
    locale: 'en-US',
    acceptLanguage: 'en-US,en;q=0.9',
  },
];

/** Campos do contrato FingerprintConfig (lib). */
export const FINGERPRINT_FIELDS = [
  'userAgent',
  'platform',
  'lang',
  'acceptLanguage',
  'timezone',
  'locale',
  'viewport',
  'geolocation',
  'hardwareConcurrency',
  'deviceMemory',
  'maxTouchPoints',
  'colorScheme',
  'reducedMotion',
  'touch',
  'userAgentMetadata',
  'webrtcIpHandling',
  'chromeArgs',
  'cameraLabel',
  'cameraVideo',
  'cameraCaptureFile',
  'permissions',
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

function filterById(list, id) {
  if (!id) return list;
  const hit = list.filter((x) => x.id === id);
  return hit.length ? hit : list;
}

/**
 * Opções do catálogo para a UI (selects + campos do contrato).
 */
export function listFingerprintOptions() {
  return {
    fields: FINGERPRINT_FIELDS,
    os: OS_PROFILES.map(({ id, label, platform }) => ({ id, label, platform })),
    chrome: CHROME_BUILDS.map(({ id, label, major, full }) => ({ id, label, major, full })),
    locale: BR_LOCALES.map(({ id, label, timezone }) => ({ id, label, timezone })),
    hardwareConcurrency: HW_OPTS,
    deviceMemory: MEM_OPTS,
    lang: LANG_OPTS.map(({ id, label }) => ({ id, label })),
    webrtcIpHandling: WEBRTC_OPTS,
    colorScheme: COLOR_SCHEME_OPTS,
    reducedMotion: REDUCED_MOTION_OPTS,
  };
}

/**
 * Gera fingerprint coerente. Filtros opcionais (ids do catálogo / valores).
 * Sem viewport (padrão lab LinkedIn); sem colisão tz+UA+platformVersion+hw+mem.
 *
 * @param {{
 *   os?: string,
 *   chrome?: string,
 *   locale?: string,
 *   hardwareConcurrency?: number,
 *   deviceMemory?: number,
 *   lang?: string,
 *   colorScheme?: string,
 *   reducedMotion?: string,
 *   webrtcIpHandling?: string,
 * }} [opts]
 */
export function generateFingerprint(opts = {}) {
  const used = existingFpKeys();
  const osPool = filterById(OS_PROFILES, opts.os);
  const chromePool = filterById(CHROME_BUILDS, opts.chrome);
  const cityPool = filterById(BR_LOCALES, opts.locale);
  const langPool = filterById(LANG_OPTS, opts.lang);
  const hwPool =
    opts.hardwareConcurrency != null && HW_OPTS.includes(Number(opts.hardwareConcurrency))
      ? [Number(opts.hardwareConcurrency)]
      : HW_OPTS;
  const memPool =
    opts.deviceMemory != null && MEM_OPTS.includes(Number(opts.deviceMemory))
      ? [Number(opts.deviceMemory)]
      : MEM_OPTS;
  const webrtc =
    WEBRTC_OPTS.includes(opts.webrtcIpHandling)
      ? opts.webrtcIpHandling
      : pick(WEBRTC_OPTS);
  const colorScheme =
    COLOR_SCHEME_OPTS.includes(opts.colorScheme) ? opts.colorScheme : 'light';
  const reducedMotion =
    REDUCED_MOTION_OPTS.includes(opts.reducedMotion)
      ? opts.reducedMotion
      : 'no-preference';

  for (let i = 0; i < 80; i++) {
    const os = pick(osPool);
    const chrome = pick(chromePool);
    const brandNot = pick(BRAND_NOT);
    const city = pick(cityPool);
    const hw = pick(hwPool);
    const mem = pick(memPool);
    const lang = pick(langPool);
    const userAgent = `Mozilla/5.0 (${os.uaOs}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome.major}.0.0.0 Safari/537.36`;
    const key = `${city.timezone}|${userAgent}|${os.platform}|${os.meta.platformVersion}|${hw}|${mem}`;
    if (used.has(key) && i < 70) continue;

    const raw = {
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
      colorScheme,
      reducedMotion,
      webrtcIpHandling: webrtc,
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
    return normalizeFingerprint(raw);
  }
  throw new Error('generateFingerprint: não achou combinação distinta');
}
