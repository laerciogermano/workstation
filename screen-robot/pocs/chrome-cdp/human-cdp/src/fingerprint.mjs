/**
 * Overrides leves de fingerprint por CDP (meta.fingerprint).
 * Não cobre canvas/WebGL/áudio — só UA, lang, timezone, viewport.
 */

/**
 * @typedef {object} FingerprintConfig
 * @property {string} [userAgent]
 * @property {string} [lang] BCP-47 / Chrome --lang (ex.: pt-BR, en-US)
 * @property {string} [acceptLanguage] header Accept-Language
 * @property {string} [timezone] IANA (ex.: America/Sao_Paulo)
 * @property {string} [locale] Emulation.setLocaleOverride
 * @property {{ width: number, height: number, deviceScaleFactor?: number, mobile?: boolean }} [viewport]
 */

/**
 * @param {unknown} raw
 * @returns {FingerprintConfig|null}
 */
export function normalizeFingerprint(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  /** @type {FingerprintConfig} */
  const out = {};
  if (typeof o.userAgent === 'string' && o.userAgent.trim()) {
    out.userAgent = o.userAgent.trim();
  }
  if (typeof o.lang === 'string' && o.lang.trim()) {
    out.lang = o.lang.trim();
  }
  if (typeof o.acceptLanguage === 'string' && o.acceptLanguage.trim()) {
    out.acceptLanguage = o.acceptLanguage.trim();
  }
  if (typeof o.timezone === 'string' && o.timezone.trim()) {
    out.timezone = o.timezone.trim();
  }
  if (typeof o.locale === 'string' && o.locale.trim()) {
    out.locale = o.locale.trim();
  }
  if (o.viewport && typeof o.viewport === 'object') {
    const v = /** @type {Record<string, unknown>} */ (o.viewport);
    const width = Number(v.width);
    const height = Number(v.height);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      out.viewport = {
        width: Math.round(width),
        height: Math.round(height),
        deviceScaleFactor:
          Number.isFinite(Number(v.deviceScaleFactor)) && Number(v.deviceScaleFactor) > 0
            ? Number(v.deviceScaleFactor)
            : 1,
        mobile: v.mobile === true,
      };
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Aplica overrides CDP na sessão atual.
 * @param {{ send: (method: string, params?: object) => Promise<unknown> }} session
 * @param {FingerprintConfig|null|undefined} fp
 */
export async function applyFingerprint(session, fp) {
  const n = normalizeFingerprint(fp);
  if (!n) return { applied: false };

  const applied = {};

  if (n.userAgent || n.acceptLanguage) {
    await session.send('Network.enable', {}).catch(() => {});
    const params = {
      userAgent: n.userAgent || undefined,
      acceptLanguage:
        n.acceptLanguage ||
        (n.lang ? `${n.lang},${n.lang.split('-')[0]};q=0.9` : undefined),
    };
    await session.send('Network.setUserAgentOverride', params);
    applied.userAgent = params.userAgent || null;
    applied.acceptLanguage = params.acceptLanguage || null;
  }

  if (n.timezone) {
    await session.send('Emulation.setTimezoneOverride', {
      timezoneId: n.timezone,
    });
    applied.timezone = n.timezone;
  }

  const locale = n.locale || n.lang;
  if (locale) {
    try {
      await session.send('Emulation.setLocaleOverride', { locale });
      applied.locale = locale;
    } catch {
      /* Chrome antigo / sem suporte */
    }
  }

  if (n.viewport) {
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: n.viewport.width,
      height: n.viewport.height,
      deviceScaleFactor: n.viewport.deviceScaleFactor ?? 1,
      mobile: n.viewport.mobile === true,
    });
    applied.viewport = n.viewport;
  }

  return { applied: true, ...applied };
}
