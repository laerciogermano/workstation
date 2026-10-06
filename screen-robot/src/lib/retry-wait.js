/**
 * Espera em retry (rate limit / 429).
 * Default: 2s (antes: 0 = reenvio imediato, estoura TPM).
 * Se a API disser "try again in 728ms", usa esse valor (mínimo do piso).
 */

export const DEFAULT_RETRY_MS = Number(
  process.env.OPENAI_RETRY_MS ?? process.env.GEMINI_RETRY_MS ?? 2000,
);

/**
 * @param {unknown} message
 * @returns {number|null} ms
 */
export function parseRetryAfterMs(message) {
  const s = String(message || "");
  const m = s.match(/try again in\s+([\d.]+)\s*(ms|s|sec|seconds?)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = String(m[2] || "ms").toLowerCase();
  const ms = unit.startsWith("s") ? n * 1000 : n;
  return Math.ceil(ms);
}

/**
 * @param {{
 *   baseMs?: number,
 *   attempt?: number,
 *   message?: string,
 *   status?: number,
 * }} [opts]
 */
export function resolveRetryWaitMs(opts = {}) {
  const base = Number(opts.baseMs ?? DEFAULT_RETRY_MS);
  const attempt = Math.max(1, Number(opts.attempt) || 1);
  const fromMsg = parseRetryAfterMs(opts.message);
  const floor = Number.isFinite(base) && base > 0 ? base * attempt : 0;
  const rateFloor =
    opts.status === 429 || /rate limit|resource exhausted/i.test(String(opts.message || ""))
      ? 2000 * attempt
      : 0;
  const minWait = Math.max(floor, rateFloor);
  if (fromMsg != null && fromMsg > 0) {
    return Math.max(fromMsg, minWait || fromMsg);
  }
  return minWait;
}