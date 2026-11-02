/**
 * Fingerprint por CDP (meta.fingerprint).
 * Só o essencial: UA, locale/tz, viewport, geo, cores, WebGL, WebRTC.
 * Não muda IP de egress nem TLS/JA3.
 */

/**
 * @typedef {object} ViewportConfig
 * @property {number} width
 * @property {number} height
 * @property {number} [deviceScaleFactor]
 * @property {boolean} [mobile]
 * @property {number} [screenWidth]
 * @property {number} [screenHeight]
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
 * @property {string} [platform]
 * @property {string} [platformVersion]
 * @property {string} [architecture]
 * @property {string} [model]
 * @property {boolean} [mobile]
 * @property {string} [bitness]
 */

/**
 * @typedef {object} WebglConfig
 * @property {string} [vendor]
 * @property {string} [renderer]
 */

/**
 * @typedef {object} FingerprintConfig
 * @property {string} [userAgent]
 * @property {string} [platform]
 * @property {string} [lang]
 * @property {string} [acceptLanguage]
 * @property {string} [timezone]
 * @property {string} [locale]
 * @property {ViewportConfig} [viewport]
 * @property {GeolocationConfig} [geolocation]
 * @property {number} [hardwareConcurrency]
 * @property {UserAgentMetadata} [userAgentMetadata]
 * @property {'disable_non_proxied_udp'|'default_public_interface_only'|'default_public_and_private_interfaces'} [webrtcIpHandling]
 * @property {WebglConfig} [webgl]
 * @property {string[]} [chromeArgs]
 */

function num(v, { min = Number.NEGATIVE_INFINITY } = {}) {
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

  for (const k of ['userAgent', 'platform', 'lang', 'acceptLanguage', 'timezone', 'locale']) {
    const v = str(o[k]);
    if (v) out[k] = v;
  }

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
      for (const key of ['screenWidth', 'screenHeight']) {
        const n = num(v[key], { min: 1 });
        if (n != null) viewport[key] = Math.round(n);
      }
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

  if (o.webgl && typeof o.webgl === 'object') {
    const w = /** @type {Record<string, unknown>} */ (o.webgl);
    /** @type {WebglConfig} */
    const webgl = {};
    const vendor = str(w.vendor);
    const renderer = str(w.renderer);
    if (vendor) webgl.vendor = vendor;
    if (renderer) webgl.renderer = renderer;
    if (Object.keys(webgl).length) out.webgl = webgl;
  }

  return Object.keys(out).length ? out : null;
}

/**
 * @param {FingerprintConfig|null|undefined} fp
 * @returns {string[]}
 */
export function chromeArgsFromFingerprint(fp) {
  const n = normalizeFingerprint(fp);
  if (!n) return [];
  const args = [];
  // Só --lang automático. Flags webrtc/AutomationControlled → infobar amarela.
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

function buildInjectScript(n) {
  const cfg = {
    platform: n.platform,
    hardwareConcurrency: n.hardwareConcurrency,
    language: n.lang,
    languages: (n.acceptLanguage || (n.lang ? `${n.lang},${String(n.lang).split('-')[0]};q=0.9` : ''))
      .split(',')
      .map((x) => x.trim().split(';')[0])
      .filter(Boolean),
    screenWidth: n.viewport?.screenWidth,
    screenHeight: n.viewport?.screenHeight,
    webgl: n.webgl,
    webrtcIpHandling: n.webrtcIpHandling,
  };

  return `(() => {
    const cfg = ${JSON.stringify(cfg)};
    const def = (obj, key, value) => {
      try { Object.defineProperty(obj, key, { get: () => value, configurable: true }); } catch {}
    };
    try { def(Navigator.prototype, 'webdriver', false); } catch {}
    if (cfg.platform != null) def(Navigator.prototype, 'platform', cfg.platform);
    if (cfg.hardwareConcurrency != null) def(Navigator.prototype, 'hardwareConcurrency', cfg.hardwareConcurrency);
    if (cfg.language != null) def(Navigator.prototype, 'language', cfg.language);
    if (cfg.languages && cfg.languages.length) def(Navigator.prototype, 'languages', cfg.languages);
    if (cfg.screenWidth != null) {
      def(Screen.prototype, 'width', cfg.screenWidth);
      def(Screen.prototype, 'availWidth', cfg.screenWidth);
    }
    if (cfg.screenHeight != null) {
      def(Screen.prototype, 'height', cfg.screenHeight);
      def(Screen.prototype, 'availHeight', cfg.screenHeight);
    }

    if (cfg.webgl) {
      const patchCtx = (proto) => {
        if (!proto || !proto.getParameter) return;
        const orig = proto.getParameter;
        proto.getParameter = function (param) {
          const dbg = this.getExtension && this.getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
            if (param === dbg.UNMASKED_VENDOR_WEBGL && cfg.webgl.vendor) return cfg.webgl.vendor;
            if (param === dbg.UNMASKED_RENDERER_WEBGL && cfg.webgl.renderer) return cfg.webgl.renderer;
          }
          return orig.call(this, param);
        };
      };
      try { patchCtx(WebGLRenderingContext && WebGLRenderingContext.prototype); } catch {}
      try { patchCtx(WebGL2RenderingContext && WebGL2RenderingContext.prototype); } catch {}
    }

    if (cfg.webrtcIpHandling && window.RTCPeerConnection) {
      const mode = cfg.webrtcIpHandling;
      const Orig = window.RTCPeerConnection;
      window.RTCPeerConnection = function (...args) {
        const pc = new Orig(...args);
        if (mode === 'disable_non_proxied_udp' || mode === 'default_public_interface_only') {
          pc.addEventListener('icecandidate', (ev) => {
            if (!ev.candidate) return;
            const s = ev.candidate.candidate || '';
            if (mode === 'disable_non_proxied_udp' && /typ host/.test(s)) {
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

  const script = buildInjectScript(n);
  if (
    await softFail('Page.addScriptToEvaluateOnNewDocument', () =>
      session.send('Page.addScriptToEvaluateOnNewDocument', { source: script }),
    )
  ) {
    applied.injectOnNewDocument = true;
  }
  if (
    await softFail('Runtime.evaluate:inject', () =>
      session.send('Runtime.evaluate', { expression: script }),
    )
  ) {
    applied.injectNow = true;
  }

  if (n.webgl) applied.webgl = n.webgl;
  if (n.webrtcIpHandling) applied.webrtcIpHandling = n.webrtcIpHandling;

  return { applied: true, ...applied };
}
