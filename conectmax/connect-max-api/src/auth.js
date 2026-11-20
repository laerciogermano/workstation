import { timingSafeEqual } from 'node:crypto';

/** Docs/spec públicas (Swagger no browser); dados continuam com API key. */
const PUBLIC_PATHS = new Set([
  '/health',
  '/docs',
  '/openapi.json',
  '/openapi.yaml',
]);

function expectedKey() {
  const key = process.env.API_KEY || '';
  return key.trim();
}

function extractKey(req) {
  const h = req.headers || {};
  const x = h['x-api-key'];
  if (typeof x === 'string' && x.trim()) return x.trim();
  const auth = h.authorization;
  if (typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  return '';
}

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function authorize(req, path) {
  if (PUBLIC_PATHS.has(path)) return { ok: true };
  const expected = expectedKey();
  if (!expected) {
    return { ok: false, status: 503, error: 'API_KEY não configurada' };
  }
  const got = extractKey(req);
  if (!got || !safeEqual(got, expected)) {
    return { ok: false, status: 401, error: 'unauthorized' };
  }
  return { ok: true };
}
