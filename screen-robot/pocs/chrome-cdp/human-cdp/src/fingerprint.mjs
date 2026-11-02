/**
 * Fingerprint por CDP (meta.fingerprint).
 * Cobre o que Chrome CDP/flags permitem de forma estável.
 * Não altera canvas/WebGL/áudio reais nem IP de egress.
 */

/**
 * @typedef {object} ViewportConfig
 * @property {number} width
 * @property {number} height
 * @property {number} [deviceScaleFactor]
 * @property {boolean} [mobile]
 * @property {number} [screenWidth]
 * @property {number} [screenHeight]
 * @property {number} [positionX]
 * @property {number} [positionY]
 */

/**
 * @typedef {object} GeolocationConfig
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} [accuracy]
 */

/**
 * @typedef {object} UserAgentMetadata
 * @property {{brand: string, version: string}[]} [brands]
 * @property {{brand: string, version: string}[]} [fullVersionList]
 * @property {string} [fullVersion]
 * @property {string} [platform]
 * @property {string} [platformVersion]
 * @property {string} [architecture]
 * @property {string} [model]
 * @property {boolean} [mobile]
 * @property {string} [bitness]
 * @property {boolean} [wow64]
 */

/**
 * @typedef {object} FingerprintConfig
 * @property {string} [userAgent]
 * @property {string} [platform] navigator.platform / UA override platform
 * @property {string} [lang]
 * @property {string} [acceptLanguage]
 * @property {string} [timezone]
 * @property {string} [locale]
 * @property {ViewportConfig} [viewport]
 * @property {GeolocationConfig} [geolocation]
 * @property {number} [hardwareConcurrency]
 * @property {number} [deviceMemory]
 * @property {number} [maxTouchPoints]
 * @property {'light'|'dark'|'no-preference'} [colorScheme]
 * @property {'reduce'|'no-preference'} [reducedMotion]
 * @property {boolean} [touch]
 * @property {UserAgentMetadata} [userAgentMetadata]
 * @property {'disable_non_proxied_udp'|'default_public_interface_only'|'default_public_and_private_interfaces'} [webrtcIpHandling]
 * @property {string[]} [chromeArgs] flags extras no startCdp
 * @property {Array<{origin: string, permission: string, setting?: 'granted'|'denied'|'prompt'}>} [permissions]
 */

function num(v, { min = 0 } = {}) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : null;
}

function str(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/**
 * @param {unknown} raw
 * @returns {FingerprintConfig|null}
 */
export function normalizeFingerprint(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  /** @type {FingerprintConfig} */
  const out = {};

  const userAgent = str(o.userAgent);
  if (userAgent) out.userAgent = userAgent;
  const platform = str(o.platform);
  if (platform) out.platform = platform;
  const lang = str(o.lang);
  if (lang) out.lang = lang;
  const acceptLanguage = str(o.acceptLanguage);
  if (acceptLanguage) out.acceptLanguage = acceptLanguage;
  const timezone = str(o.timezone);
  if (timezone) out.timezone = timezone;
  const locale = str(o.locale);
  if (locale) out.locale = locale;

  if (o.viewport && typeof o.viewport === 'object') {
    const v = /** @type {Record<string, unknown>} */ (o.viewport);
    const width = num(v.width, { min: 1 });
    const height = num(v.height, { min: 1 });
    if (width && height) {
      /** @type {ViewportConfig} */
      const viewport = {
        width: Math.round(width),
        height: Math.round(height),
        deviceScaleFactor: num(v.deviceScaleFactor, { min: 0.1 }) ?? 1,
        mobile: v.mobile === true,
      };
      const sw = num(v.screenWidth, { min: 1 });
      const sh = num(v.screenHeight, { min: 1 });
      if (sw) viewport.screenWidth = Math.round(sw);
      if (sh) viewport.screenHeight = Math.round(sh);
      const px = num(v.positionX);
      const py = num(v.positionY);
      if (px != null) viewport.positionX = Math.round(px);
      if (py != null) viewport.positionY = Math.round(py);
      out.viewport = viewport;
    }
  }

  if (o.geolocation && typeof o.geolocation === 'object') {
    const g = /** @type {Record<string, unknown>} */ (o.geolocation);
    const latitude = num(g.latitude, { min: -90 });
    const longitude = num(g.longitude, { min: -180 });
    if (latitude != null && longitude != null && latitude <= 90 && longitude <= 180) {
      out.geolocation = {
        latitude,
        longitude,
        accuracy: num(g.accuracy, { min: 0 }) ?? 50,
      };
    }
  }

  const hc = num(o.hardwareConcurrency, { min: 1 });
  if (hc) out.hardwareConcurrency = Math.round(hc);
  const dm = num(o.deviceMemory, { min: 0.25 });
  if (dm) out.deviceMemory = dm;
  const mtp = num(o.maxTouchPoints, { min: 0 });
  if (mtp != null) out.maxTouchPoints = Math.round(mtp);

  if (o.colorScheme === 'light' || o.colorScheme === 'dark' || o.colorScheme === 'no-preference') {
    out.colorScheme = o.colorScheme;
  }
  if (o.reducedMotion === 'reduce' || o.reducedMotion === 'no-preference') {
    out.reducedMotion = o.reducedMotion;
  }
  if (typeof o.touch === 'boolean') out.touch = o.touch;

  if (o.userAgentMetadata && typeof o.userAgentMetadata === 'object') {
    out.userAgentMetadata = /** @type {UserAgentMetadata} */ (o.userAgentMetadata);
  }

  if (
    o.webrtcIpHandling === 'disable_non_proxied_udp' ||
    o.webrtcIpHandling === 'default_public_interface_only' ||
    o.webrtcIpHandling === 'default_public_and_private_interfaces'
  ) {
    out.webrtcIpHandling = o.webrtcIpHandling;
  }

  if (Array.isArray(o.chromeArgs)) {
    const args = o.chromeArgs.map((a) => str(a)).filter(Boolean);
    if (args.length) out.chromeArgs = /** @type {string[]} */ (args);
  }

  if (Array.isArray(o.permissions)) {
    const permissions = [];
    for (const p of o.permissions) {
      if (!p || typeof p !== 'object') continue;
      const row = /** @type {Record<string, unknown>} */ (p);
      const origin = str(row.origin);
      const permission = str(row.permission);
      if (!origin || !permission) continue;
      const setting =
        row.setting === 'denied' || row.setting === 'prompt' || row.setting === 'granted'
          ? row.setting
          : 'granted';
      permissions.push({ origin, permission, setting });
    }
    if (permissions.length) out.permissions = permissions;
  }

  return Object.keys(out).length ? out : null;
}

/**
 * Flags Chrome derivadas do fingerprint (startCdp).
 * @param {FingerprintConfig|null|undefined} fp
 * @returns {string[]}
 */
export function chromeArgsFromFingerprint(fp) {
  const n = normalizeFingerprint(fp);
  if (!n) return [];
  const args = [];
  // Só --lang. --force-webrtc-ip-handling-policy e AutomationControlled → infobar amarela.
  if (n.lang) args.push(`--lang=${n.lang}`);
  const blocked =
    /force-webrtc-ip-handling-policy|disable-blink-features\s*=\s*AutomationControlled|disable-web-security|no-sandbox|single-process/i;
  if (n.chromeArgs?.length) {
    for (const a of n.chromeArgs) {
      if (blocked.test(a)) continue;
      args.push(a);
    }
  }
  return args;
}

function patchNavigatorScript(n) {
  const patches = {};
  if (n.platform) patches.platform = n.platform;
  if (n.hardwareConcurrency) patches.hardwareConcurrency = n.hardwareConcurrency;
  if (n.deviceMemory) patches.deviceMemory = n.deviceMemory;
  if (n.maxTouchPoints != null) patches.maxTouchPoints = n.maxTouchPoints;
  if (n.lang) patches.language = n.lang;
  if (n.acceptLanguage || n.lang) {
    patches.languages = (n.acceptLanguage || `${n.lang},${String(n.lang).split('-')[0]};q=0.9`)
      .split(',')
      .map((x) => x.trim().split(';')[0])
      .filter(Boolean);
  }
  if (n.viewport?.screenWidth) patches.screenWidth = n.viewport.screenWidth;
  if (n.viewport?.screenHeight) patches.screenHeight = n.viewport.screenHeight;
  if (n.webrtcIpHandling) patches.webrtcIpHandling = n.webrtcIpHandling;

  return `(() => {
    const p = ${JSON.stringify(patches)};
    const def = (obj, key, value) => {
      try {
        Object.defineProperty(obj, key, { get: () => value, configurable: true });
      } catch {}
    };
    try { def(Navigator.prototype, 'webdriver', false); } catch {}
    if (p.platform != null) def(Navigator.prototype, 'platform', p.platform);
    if (p.hardwareConcurrency != null) def(Navigator.prototype, 'hardwareConcurrency', p.hardwareConcurrency);
    if (p.deviceMemory != null) def(Navigator.prototype, 'deviceMemory', p.deviceMemory);
    if (p.maxTouchPoints != null) def(Navigator.prototype, 'maxTouchPoints', p.maxTouchPoints);
    if (p.language != null) def(Navigator.prototype, 'language', p.language);
    if (p.languages != null) def(Navigator.prototype, 'languages', p.languages);
    if (p.screenWidth != null) def(Screen.prototype, 'width', p.screenWidth);
    if (p.screenHeight != null) def(Screen.prototype, 'height', p.screenHeight);
    if (p.screenWidth != null) def(Screen.prototype, 'availWidth', p.screenWidth);
    if (p.screenHeight != null) def(Screen.prototype, 'availHeight', p.screenHeight);
    if (p.webrtcIpHandling && window.RTCPeerConnection) {
      const mode = p.webrtcIpHandling;
      const Orig = window.RTCPeerConnection;
      window.RTCPeerConnection = function (...args) {
        const pc = new Orig(...args);
        if (mode === 'disable_non_proxied_udp') {
          pc.addEventListener('icecandidate', (ev) => {
            if (!ev.candidate) return;
            if (/typ host/.test(ev.candidate.candidate || '')) {
              try { Object.defineProperty(ev, 'candidate', { value: null }); } catch {}
            }
          });
        }
        return pc;
      };
      window.RTCPeerConnection.prototype = Orig.prototype;
      try { window.webkitRTCPeerConnection = window.RTCPeerConnection; } catch {}
    }
  })();`;
}

/**
 * @param {{ send: (method: string, params?: object) => Promise<unknown> }} session
 * @param {FingerprintConfig|null|undefined} fp
 */
export async function applyFingerprint(session, fp) {
  const n = normalizeFingerprint(fp);
  if (!n) return { applied: false };

  const applied = {};
  const softFail = async (label, fn) => {
    try {
      await fn();
      return true;
    } catch (err) {
      applied[`error:${label}`] = String(err?.message || err);
      return false;
    }
  };

  await softFail('Network.enable', () => session.send('Network.enable', {}));
  await softFail('Page.enable', () => session.send('Page.enable', {}));

  if (n.userAgent || n.acceptLanguage || n.platform || n.userAgentMetadata) {
    const params = {
      userAgent: n.userAgent || undefined,
      acceptLanguage:
        n.acceptLanguage ||
        (n.lang ? `${n.lang},${n.lang.split('-')[0]};q=0.9` : undefined),
      platform: n.platform || undefined,
    };
    if (n.userAgentMetadata) params.userAgentMetadata = n.userAgentMetadata;
    if (
      await softFail('Network.setUserAgentOverride', () =>
        session.send('Network.setUserAgentOverride', params),
      )
    ) {
      applied.userAgent = params.userAgent || null;
      applied.acceptLanguage = params.acceptLanguage || null;
      applied.platform = params.platform || null;
      if (n.userAgentMetadata) applied.userAgentMetadata = true;
    }
  }

  if (n.timezone) {
    if (
      await softFail('Emulation.setTimezoneOverride', () =>
        session.send('Emulation.setTimezoneOverride', { timezoneId: n.timezone }),
      )
    ) {
      applied.timezone = n.timezone;
    }
  }

  const locale = n.locale || n.lang;
  if (locale) {
    if (
      await softFail('Emulation.setLocaleOverride', () =>
        session.send('Emulation.setLocaleOverride', { locale }),
      )
    ) {
      applied.locale = locale;
    }
  }

  if (n.viewport) {
    const metrics = {
      width: n.viewport.width,
      height: n.viewport.height,
      deviceScaleFactor: n.viewport.deviceScaleFactor ?? 1,
      mobile: n.viewport.mobile === true,
    };
    if (n.viewport.screenWidth) metrics.screenWidth = n.viewport.screenWidth;
    if (n.viewport.screenHeight) metrics.screenHeight = n.viewport.screenHeight;
    if (n.viewport.positionX != null) metrics.positionX = n.viewport.positionX;
    if (n.viewport.positionY != null) metrics.positionY = n.viewport.positionY;
    if (
      await softFail('Emulation.setDeviceMetricsOverride', () =>
        session.send('Emulation.setDeviceMetricsOverride', metrics),
      )
    ) {
      applied.viewport = n.viewport;
    }
  }

  if (n.geolocation) {
    if (
      await softFail('Emulation.setGeolocationOverride', () =>
        session.send('Emulation.setGeolocationOverride', {
          latitude: n.geolocation.latitude,
          longitude: n.geolocation.longitude,
          accuracy: n.geolocation.accuracy ?? 50,
        }),
      )
    ) {
      applied.geolocation = n.geolocation;
    }
  }

  if (n.hardwareConcurrency) {
    if (
      await softFail('Emulation.setHardwareConcurrencyOverride', () =>
        session.send('Emulation.setHardwareConcurrencyOverride', {
          hardwareConcurrency: n.hardwareConcurrency,
        }),
      )
    ) {
      applied.hardwareConcurrency = n.hardwareConcurrency;
    }
  }

  if (n.colorScheme || n.reducedMotion) {
    const features = [];
    if (n.colorScheme) {
      features.push({ name: 'prefers-color-scheme', value: n.colorScheme });
    }
    if (n.reducedMotion) {
      features.push({ name: 'prefers-reduced-motion', value: n.reducedMotion });
    }
    if (
      await softFail('Emulation.setEmulatedMedia', () =>
        session.send('Emulation.setEmulatedMedia', { features }),
      )
    ) {
      applied.media = features;
    }
  }

  if (typeof n.touch === 'boolean') {
    if (
      await softFail('Emulation.setTouchEmulationEnabled', () =>
        session.send('Emulation.setTouchEmulationEnabled', {
          enabled: n.touch,
          maxTouchPoints: n.maxTouchPoints ?? (n.touch ? 1 : 0),
        }),
      )
    ) {
      applied.touch = n.touch;
    }
  }

  if (n.permissions?.length) {
    for (const p of n.permissions) {
      const ok = await softFail(`Browser.setPermission:${p.permission}`, () =>
        session.send('Browser.setPermission', {
          permission: { name: p.permission },
          setting: p.setting || 'granted',
          origin: p.origin,
        }),
      );
      if (ok) {
        applied.permissions = applied.permissions || [];
        applied.permissions.push(p);
      }
    }
  }

  const script = patchNavigatorScript(n);
  if (
    await softFail('Page.addScriptToEvaluateOnNewDocument', () =>
      session.send('Page.addScriptToEvaluateOnNewDocument', { source: script }),
    )
  ) {
    applied.navigatorPatchOnNewDocument = true;
  }
  if (
    await softFail('Runtime.evaluate:navigatorPatch', () =>
      session.send('Runtime.evaluate', { expression: script }),
    )
  ) {
    applied.navigatorPatchNow = true;
  }

  if (n.deviceMemory) applied.deviceMemory = n.deviceMemory;
  if (n.maxTouchPoints != null) applied.maxTouchPoints = n.maxTouchPoints;
  if (n.webrtcIpHandling) applied.webrtcIpHandling = n.webrtcIpHandling;

  return { applied: true, ...applied };
}
