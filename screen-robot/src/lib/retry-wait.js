/**
 * Espera em retry (429 / 503 high demand).
 * Default: 2s. Alta demanda: piso 10s (GEMINI_HIGH_DEMAND_MS).
 * Se a API disser "try again in 728ms", usa o maior entre isso e o piso.
 */

export const DEFAULT_RETRY_MS = Number(
  process.env.OPENAI_RETRY_MS ?? process.env.GEMINI_RETRY_MS ?? 2000,
);

export const DEFAULT_HIGH_DEMAND_MS = Number(
  process.env.GEMINI_HIGH_DEMAND_MS ?? process.env.OPENAI_HIGH_DEMAND_MS ?? 10000,
);

export function isHighDemandSignal(status, message) {
  if (status === 503) return true;
  const m = String(message || "").toLowerCase();
  return (
    m.includes("high demand") ||
    m.includes("overloaded") ||
    m.includes("unavailable") && m.includes("demand")
  );
}

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
  const highDemand = isHighDemandSignal(opts.status, opts.message);
  const highFloor = highDemand
    ? (Number.isFinite(DEFAULT_HIGH_DEMAND_MS) && DEFAULT_HIGH_DEMAND_MS > 0
        ? DEFAULT_HIGH_DEMAND_MS
        : 10000) * attempt
    : 0;
  const rateFloor =
    opts.status === 429 || /rate limit|resource exhausted/i.test(String(opts.message || ""))
      ? 2000 * attempt
      : 0;
  const minWait = Math.max(floor, rateFloor, highFloor);
  if (fromMsg != null && fromMsg > 0) {
    return Math.max(fromMsg, minWait || fromMsg);
  }
  return minWait;
}