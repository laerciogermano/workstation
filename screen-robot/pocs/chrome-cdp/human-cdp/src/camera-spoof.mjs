/**
 * Renomeia devices/tracks de câmera virtual (OBS etc.) para um label fictício.
 * Persistido via Page.addScriptToEvaluateOnNewDocument + Runtime.evaluate
 * (mesmo caminho do fingerprint).
 */

const DEFAULT_LABEL = 'FaceTime HD Camera';
const DEFAULT_AUDIO_LABEL = 'MacBook Pro Microphone';
const DEFAULT_MATCH = [
  'obs',
  'virtual camera',
  'virtualcam',
  'obs-camera',
  'obs studio',
  // Chrome --use-fake-device-for-media-stream / --use-file-for-fake-video-capture
  'fake',
  'fake_device',
  'y4m',
  'mjpeg',
  // caminho absoluto do arquivo de captura
  '/users/',
  'chrome-cdp-media',
];
const SPOOF_VER = 3;

/**
 * @param {{ label?: string, audioLabel?: string, match?: string[] }} [opts]
 * @returns {string} IIFE para injetar na página
 */
export function cameraSpoofExpression(opts = {}) {
  const label = opts.label || DEFAULT_LABEL;
  const audioLabel = opts.audioLabel || DEFAULT_AUDIO_LABEL;
  const match = Array.isArray(opts.match) && opts.match.length
    ? opts.match
    : DEFAULT_MATCH;
  return `(() => {
    const VER = ${SPOOF_VER};
    if (window.__srCamSpoofVer === VER && window.__srCamSpoofInstalled) return 'already';
    window.__srCamSpoofVer = VER;
    window.__srCamSpoofInstalled = true;
    const LABEL = ${JSON.stringify(label)};
    const AUDIO_LABEL = ${JSON.stringify(audioLabel)};
    const MATCH = ${JSON.stringify(match)}.map((s) => String(s).toLowerCase());
    const hit = (v) => {
      const l = String(v || '').toLowerCase();
      return MATCH.some((m) => l.includes(m));
    };

    const cloakDevice = (d) => {
      if (!d || (d.kind !== 'videoinput' && d.kind !== 'audioinput')) return d;
      let rawLabel = '';
      try { rawLabel = d.label; } catch { return d; }
      if (!hit(rawLabel)) return d;
      const nextLabel = d.kind === 'audioinput' ? AUDIO_LABEL : LABEL;
      return new Proxy(d, {
        get(t, p) {
          if (p === 'label') return nextLabel;
          if (p === Symbol.toStringTag) return 'MediaDeviceInfo';
          const v = Reflect.get(t, p, t);
          return typeof v === 'function' ? v.bind(t) : v;
        },
      });
    };

    const cloakTrack = (track) => {
      if (!track || (track.kind !== 'video' && track.kind !== 'audio')) return track;
      let raw = '';
      try { raw = track.label; } catch { return track; }
      if (!hit(raw)) return track;
      const nextLabel = track.kind === 'audio' ? AUDIO_LABEL : LABEL;
      try {
        Object.defineProperty(track, 'label', {
          configurable: true,
          enumerable: true,
          get: () => nextLabel,
        });
      } catch { /* ignore */ }
      return track;
    };

    const cloakStream = (stream) => {
      if (!stream || typeof stream.getTracks !== 'function') return stream;
      try {
        for (const t of stream.getTracks()) cloakTrack(t);
      } catch { /* ignore */ }
      return stream;
    };

    const md = navigator.mediaDevices;
    if (!md) return 'no-mediaDevices';

    // Originais nativos (uma vez) — evita Illegal invocation.
    if (!window.__srCamOrig) {
      window.__srCamOrig = {
        enum: MediaDevices.prototype.enumerateDevices,
        gum: MediaDevices.prototype.getUserMedia,
      };
    }
    const origEnum = window.__srCamOrig.enum;
    const origGum = window.__srCamOrig.gum;

    const enumPatched = async function () {
      const list = await origEnum.call(md);
      return Array.from(list, cloakDevice);
    };
    const gumPatched = async function (constraints) {
      const stream = await origGum.call(md, constraints);
      return cloakStream(stream);
    };

    try {
      md.enumerateDevices = enumPatched;
      md.getUserMedia = gumPatched;
    } catch {
      try {
        Object.defineProperty(md, 'enumerateDevices', {
          configurable: true, writable: true, value: enumPatched,
        });
        Object.defineProperty(md, 'getUserMedia', {
          configurable: true, writable: true, value: gumPatched,
        });
      } catch { /* ignore */ }
    }

    return 'ok:' + LABEL;
  })()`;
}

/**
 * @param {{ send: (method: string, params?: object) => Promise<unknown> }} session
 * @param {{ label?: string, match?: string[], onNewDocument?: boolean }} [opts]
 */
export async function applyCameraSpoof(session, opts = {}) {
  const onNewDocument = opts.onNewDocument !== false;
  const source = cameraSpoofExpression(opts);
  const out = { applied: false, onNewDocument: false, now: false };

  if (onNewDocument) {
    try {
      await session.send('Page.addScriptToEvaluateOnNewDocument', { source });
      out.onNewDocument = true;
    } catch {
      /* ignore */
    }
  }
  try {
    const r = await session.send('Runtime.evaluate', {
      expression: source,
      returnByValue: true,
    });
    out.now = true;
    out.applied = true;
    out.result = r?.result?.value;
  } catch {
    /* ignore */
  }
  return out;
}

export { DEFAULT_LABEL, DEFAULT_AUDIO_LABEL, DEFAULT_MATCH, SPOOF_VER };
