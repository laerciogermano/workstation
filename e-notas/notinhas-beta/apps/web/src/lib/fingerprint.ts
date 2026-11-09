/**
 * REQ-050: identificador temporário do navegador, enviado em X-Client-Fingerprint.
 * Mistura sinais estáveis do dispositivo com uma semente aleatória local (evita colisão entre
 * aparelhos iguais). O servidor guarda só um HMAC disso — nunca o valor cru.
 */
const SEED_KEY = 'nt_fp_seed';
let cached: Promise<string> | null = null;

function seed(): string {
  try {
    let s = localStorage.getItem(SEED_KEY);
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(SEED_KEY, s);
    }
    return s;
  } catch {
    return 'no-storage';
  }
}

export function getFingerprint(): Promise<string> {
  cached ??= (async () => {
    const n = navigator as Navigator & { deviceMemory?: number };
    const parts = [
      seed(),
      n.userAgent,
      n.language,
      String(n.hardwareConcurrency ?? ''),
      String(n.deviceMemory ?? ''),
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts));
    return 'fp1-' + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  })();
  return cached;
}
