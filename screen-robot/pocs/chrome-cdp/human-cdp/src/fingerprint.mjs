/**
 * Fingerprint por CDP (meta.fingerprint).
 * CDP/flags + inject JS. Não muda IP de egress nem TLS/JA3.
 */

/**
 * @typedef {object} ViewportConfig
 * @property {number} width
 * @property {number} height
 * @property {number} [deviceScaleFactor]
 * @property {boolean} [mobile]
 * @property {number} [screenWidth]
 * @property {number} [screenHeight]
 * @property {number} [outerWidth]
 * @property {number} [outerHeight]
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
 * @typedef {object} ConnectionConfig
 * @property {string} [effectiveType]
 * @property {number} [rtt]
 * @property {number} [downlink]
 * @property {boolean} [saveData]
 */

/**
 * @typedef {object} BatteryConfig
 * @property {boolean} [charging]
 * @property {number} [level]
 * @property {number} [chargingTime]
 * @property {number} [dischargingTime]
 */

/**
 * @typedef {object} WebglConfig
 * @property {string} [vendor]
 * @property {string} [renderer]
 */

/**
 * @typedef {object} MediaDeviceConfig
 * @property {string} [deviceId]
 * @property {string} [kind]
 * @property {string} [label]
 * @property {string} [groupId]
 */

/**
 * @typedef {object} FingerprintConfig
 * @property {string} [userAgent]
 * @property {string} [platform]
 * @property {string} [vendor]
 * @property {string} [product]
 * @property {string} [productSub]
 * @property {string} [appVersion]
 * @property {string|null} [doNotTrack]
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
 * @property {string[]} [chromeArgs]
 * @property {Array<{origin: string, permission: string, setting?: 'granted'|'denied'|'prompt'}>} [permissions]
 * @property {ConnectionConfig} [connection]
 * @property {BatteryConfig} [battery]
 * @property {string[]} [plugins]
 * @property {string[]} [mimeTypes]
 * @property {string} [keyboardLayout]
 * @property {MediaDeviceConfig[]} [mediaDevices]
 * @property {WebglConfig} [webgl]
 * @property {number} [canvasNoise]
 * @property {number} [audioNoise]
 * @property {string[]} [fonts]
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

  for (const k of [
    'userAgent',
    'platform',
    'vendor',
    'product',
    'productSub',
    'appVersion',
    'lang',
    'acceptLanguage',
    'timezone',
    'locale',
    'keyboardLayout',
  ]) {
    const v = str(o[k]);
    if (v) out[k] = v;
  }
  if (o.doNotTrack === null) out.doNotTrack = null;
  else if (o.doNotTrack === '1' || o.doNotTrack === '0' || o.doNotTrack === 'unspecified') {
    out.doNotTrack = o.doNotTrack;
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
      for (const key of ['screenWidth', 'screenHeight', 'outerWidth', 'outerHeight', 'positionX', 'positionY']) {
        const n = num(v[key], { min: key.startsWith('position') ? Number.NEGATIVE_INFINITY : 1 });
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

  if (o.connection && typeof o.connection === 'object') {
    const c = /** @type {Record<string, unknown>} */ (o.connection);
    /** @type {ConnectionConfig} */
    const connection = {};
    const et = str(c.effectiveType);
    if (et) connection.effectiveType = et;
    const rtt = num(c.rtt, { min: 0 });
    if (rtt != null) connection.rtt = Math.round(rtt);
    const downlink = num(c.downlink, { min: 0 });
    if (downlink != null) connection.downlink = downlink;
    if (typeof c.saveData === 'boolean') connection.saveData = c.saveData;
    if (Object.keys(connection).length) out.connection = connection;
  }

  if (o.battery && typeof o.battery === 'object') {
    const b = /** @type {Record<string, unknown>} */ (o.battery);
    /** @type {BatteryConfig} */
    const battery = {};
    if (typeof b.charging === 'boolean') battery.charging = b.charging;
    const level = num(b.level, { min: 0 });
    if (level != null) battery.level = Math.min(1, level);
    const ct = num(b.chargingTime, { min: 0 });
    if (ct != null) battery.chargingTime = ct;
    const dt = num(b.dischargingTime, { min: 0 });
    if (dt != null) battery.dischargingTime = dt;
    if (Object.keys(battery).length) out.battery = battery;
  }

  if (Array.isArray(o.plugins)) {
    const plugins = o.plugins.map((x) => str(x)).filter(Boolean);
    if (plugins.length) out.plugins = /** @type {string[]} */ (plugins);
  }
  if (Array.isArray(o.mimeTypes)) {
    const mimeTypes = o.mimeTypes.map((x) => str(x)).filter(Boolean);
    if (mimeTypes.length) out.mimeTypes = /** @type {string[]} */ (mimeTypes);
  }
  if (Array.isArray(o.fonts)) {
    const fonts = o.fonts.map((x) => str(x)).filter(Boolean);
    if (fonts.length) out.fonts = /** @type {string[]} */ (fonts);
  }

  if (Array.isArray(o.mediaDevices)) {
    const mediaDevices = [];
    for (const d of o.mediaDevices) {
      if (!d || typeof d !== 'object') continue;
      const row = /** @type {Record<string, unknown>} */ (d);
      const kind = str(row.kind);
      if (!kind) continue;
      mediaDevices.push({
        deviceId: str(row.deviceId) || `id-${mediaDevices.length}`,
        kind,
        label: str(row.label) || '',
        groupId: str(row.groupId) || `group-${mediaDevices.length}`,
      });
    }
    if (mediaDevices.length) out.mediaDevices = mediaDevices;
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

  const canvasNoise = num(o.canvasNoise);
  if (canvasNoise != null) out.canvasNoise = canvasNoise;
  const audioNoise = num(o.audioNoise);
  if (audioNoise != null) out.audioNoise = audioNoise;

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
  if (n.lang) args.push(`--lang=${n.lang}`);
  if (n.webrtcIpHandling) {
    args.push(`--force-webrtc-ip-handling-policy=${n.webrtcIpHandling}`);
  }
  if (n.chromeArgs?.length) args.push(...n.chromeArgs);
  return args;
}

function buildInjectScript(n) {
  const cfg = {
    platform: n.platform,
    vendor: n.vendor,
    product: n.product,
    productSub: n.productSub,
    appVersion: n.appVersion,
    doNotTrack: n.doNotTrack,
    hardwareConcurrency: n.hardwareConcurrency,
    deviceMemory: n.deviceMemory,
    maxTouchPoints: n.maxTouchPoints,
    language: n.lang,
    languages: (n.acceptLanguage || (n.lang ? `${n.lang},${String(n.lang).split('-')[0]};q=0.9` : ''))
      .split(',')
      .map((x) => x.trim().split(';')[0])
      .filter(Boolean),
    screenWidth: n.viewport?.screenWidth,
    screenHeight: n.viewport?.screenHeight,
    outerWidth: n.viewport?.outerWidth ?? (n.viewport ? n.viewport.width + 16 : undefined),
    outerHeight: n.viewport?.outerHeight ?? (n.viewport ? n.viewport.height + 88 : undefined),
    connection: n.connection,
    battery: n.battery,
    plugins: n.plugins,
    mimeTypes: n.mimeTypes,
    keyboardLayout: n.keyboardLayout,
    mediaDevices: n.mediaDevices,
    webgl: n.webgl,
    canvasNoise: n.canvasNoise,
    audioNoise: n.audioNoise,
    fonts: n.fonts,
  };

  return `(() => {
    const cfg = ${JSON.stringify(cfg)};
    const def = (obj, key, value) => {
      try { Object.defineProperty(obj, key, { get: () => value, configurable: true }); } catch {}
    };
    if (cfg.platform != null) def(Navigator.prototype, 'platform', cfg.platform);
    if (cfg.vendor != null) def(Navigator.prototype, 'vendor', cfg.vendor);
    if (cfg.product != null) def(Navigator.prototype, 'product', cfg.product);
    if (cfg.productSub != null) def(Navigator.prototype, 'productSub', cfg.productSub);
    if (cfg.appVersion != null) def(Navigator.prototype, 'appVersion', cfg.appVersion);
    if ('doNotTrack' in cfg) def(Navigator.prototype, 'doNotTrack', cfg.doNotTrack);
    if (cfg.hardwareConcurrency != null) def(Navigator.prototype, 'hardwareConcurrency', cfg.hardwareConcurrency);
    if (cfg.deviceMemory != null) def(Navigator.prototype, 'deviceMemory', cfg.deviceMemory);
    if (cfg.maxTouchPoints != null) def(Navigator.prototype, 'maxTouchPoints', cfg.maxTouchPoints);
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
    if (cfg.outerWidth != null) def(window, 'outerWidth', cfg.outerWidth);
    if (cfg.outerHeight != null) def(window, 'outerHeight', cfg.outerHeight);

    if (cfg.connection) {
      const c = Object.assign({}, navigator.connection || {}, cfg.connection);
      def(Navigator.prototype, 'connection', c);
      def(Navigator.prototype, 'mozConnection', c);
      def(Navigator.prototype, 'webkitConnection', c);
    }

    if (cfg.battery) {
      const batt = {
        charging: cfg.battery.charging !== false,
        chargingTime: cfg.battery.chargingTime ?? (cfg.battery.charging === false ? Infinity : 0),
        dischargingTime: cfg.battery.dischargingTime ?? (cfg.battery.charging === false ? 12000 : Infinity),
        level: cfg.battery.level ?? 0.87,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() { return false; },
        onchargingchange: null,
        onchargingtimechange: null,
        ondischargingtimechange: null,
        onlevelchange: null,
      };
      Navigator.prototype.getBattery = () => Promise.resolve(batt);
    }

    if (cfg.plugins && cfg.plugins.length) {
      const fakePlugins = cfg.plugins.map((name, i) => ({
        name,
        filename: name.toLowerCase().replace(/\\s+/g, '-') + '.plugin',
        description: name,
        length: 1,
        item: () => null,
        namedItem: () => null,
      }));
      fakePlugins.item = (i) => fakePlugins[i] || null;
      fakePlugins.namedItem = (n) => fakePlugins.find((p) => p.name === n) || null;
      fakePlugins.refresh = () => {};
      def(Navigator.prototype, 'plugins', fakePlugins);
    }
    if (cfg.mimeTypes && cfg.mimeTypes.length) {
      const fakeMimes = cfg.mimeTypes.map((type) => ({
        type,
        suffixes: type.includes('pdf') ? 'pdf' : '',
        description: type,
        enabledPlugin: null,
      }));
      fakeMimes.item = (i) => fakeMimes[i] || null;
      fakeMimes.namedItem = (n) => fakeMimes.find((m) => m.type === n) || null;
      def(Navigator.prototype, 'mimeTypes', fakeMimes);
    }

    if (cfg.keyboardLayout) {
      const kb = {
        getLayoutMap: async () => {
          const map = new Map();
          map.set('KeyA', cfg.keyboardLayout === 'en-US' ? 'a' : 'a');
          return map;
        },
        lock: async () => {},
        unlock: () => {},
        addEventListener() {},
        removeEventListener() {},
      };
      def(Navigator.prototype, 'keyboard', kb);
    }

    if (cfg.mediaDevices && cfg.mediaDevices.length && navigator.mediaDevices) {
      const devices = cfg.mediaDevices.slice();
      const orig = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      navigator.mediaDevices.enumerateDevices = async () => {
        try { await orig(); } catch {}
        return devices.map((d) => ({ ...d, toJSON() { return this; } }));
      };
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

    if (typeof cfg.canvasNoise === 'number' && cfg.canvasNoise !== 0) {
      const noise = cfg.canvasNoise;
      const patch = (proto, method) => {
        if (!proto || !proto[method]) return;
        const orig = proto[method];
        proto[method] = function (...args) {
          const ret = orig.apply(this, args);
          try {
            if (method === 'toDataURL' || method === 'toBlob') {
              const ctx = this.getContext && this.getContext('2d');
              if (ctx) {
                const img = ctx.getImageData(0, 0, Math.min(8, this.width || 8), Math.min(8, this.height || 8));
                for (let i = 0; i < img.data.length; i += 4) {
                  img.data[i] = (img.data[i] + (noise * 7 + i) % 3) % 256;
                }
                ctx.putImageData(img, 0, 0);
              }
            }
          } catch {}
          return method === 'toDataURL' ? orig.apply(this, args) : ret;
        };
      };
      try { patch(HTMLCanvasElement.prototype, 'toDataURL'); } catch {}
      try { patch(HTMLCanvasElement.prototype, 'toBlob'); } catch {}
    }

    if (typeof cfg.audioNoise === 'number' && cfg.audioNoise !== 0) {
      const noise = cfg.audioNoise;
      const wrap = (Orig) => {
        if (!Orig) return Orig;
        return function (...args) {
          const ctx = new Orig(...args);
          try {
            const origCreate = ctx.createAnalyser.bind(ctx);
            ctx.createAnalyser = (...a) => {
              const node = origCreate(...a);
              const origGet = node.getFloatFrequencyData.bind(node);
              node.getFloatFrequencyData = (arr) => {
                origGet(arr);
                for (let i = 0; i < arr.length; i++) arr[i] = arr[i] + noise * 0.0001 * ((i % 5) - 2);
              };
              return node;
            };
          } catch {}
          return ctx;
        };
      };
      try {
        if (window.AudioContext) window.AudioContext = wrap(window.AudioContext);
        if (window.webkitAudioContext) window.webkitAudioContext = wrap(window.webkitAudioContext);
      } catch {}
    }

    if (cfg.fonts && cfg.fonts.length && document.fonts) {
      try {
        const wanted = new Set(cfg.fonts.map((f) => f.toLowerCase()));
        const origCheck = document.fonts.check.bind(document.fonts);
        document.fonts.check = (font, text) => {
          const family = String(font).toLowerCase();
          for (const w of wanted) {
            if (family.includes(w.toLowerCase())) return true;
          }
          return origCheck(font, text);
        };
      } catch {}
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
    if (n.colorScheme) features.push({ name: 'prefers-color-scheme', value: n.colorScheme });
    if (n.reducedMotion) features.push({ name: 'prefers-reduced-motion', value: n.reducedMotion });
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

  for (const k of [
    'vendor',
    'product',
    'connection',
    'battery',
    'plugins',
    'mimeTypes',
    'keyboardLayout',
    'mediaDevices',
    'webgl',
    'canvasNoise',
    'audioNoise',
    'fonts',
    'deviceMemory',
    'maxTouchPoints',
    'webrtcIpHandling',
  ]) {
    if (n[k] != null) applied[k] = n[k];
  }

  return { applied: true, ...applied };
}
