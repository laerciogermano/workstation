/**
 * EP-07 — cliente Gemini generateContent (texto → JSON).
 * Default: gemini-3.1-flash-lite (estável nesta conta).
 * High demand (503) → fallback imediato (sem ficar minutos no mesmo modelo).
 */

const DEFAULT_MODEL = "gemini-3.1-flash-lite";
/** Cadeia validada na conta (2.5 e gemini-3-flash = 404). */
const DEFAULT_FALLBACKS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Retries só para erro de rede; 503 troca de modelo na hora. */
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_MS = 800;
/** Timeout por request — evita ficar 30–50s num 503 lento. */
const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 12000);
/** Se todos os modelos derem 503, espera e re-tenta a cadeia. */
const DEFAULT_CHAIN_ROUNDS = Number(process.env.GEMINI_CHAIN_ROUNDS || 2);

function fail(code, msg, extra = {}) {
  const err = new Error(msg);
  err.code = code;
  Object.assign(err, extra);
  throw err;
}

function log(...args) {
  console.log(`[gemini ${new Date().toISOString()}]`, ...args);
}

function isRetryable(status, message) {
  if (status === 429 || status === 503 || status === 500) return true;
  const m = String(message || "").toLowerCase();
  return (
    m.includes("high demand") ||
    m.includes("try again") ||
    m.includes("resource exhausted") ||
    m.includes("unavailable") ||
    m.includes("overloaded") ||
    m.includes("quota")
  );
}

function isHighDemand(status, message) {
  if (status === 503) return true;
  const m = String(message || "").toLowerCase();
  return m.includes("high demand") || m.includes("overloaded");
}

/** Modelo removido / bloqueado para a conta → pular para o próximo da cadeia. */
function isModelUnavailable(status, message) {
  if (status === 404) return true;
  const m = String(message || "").toLowerCase();
  return (
    m.includes("no longer available") ||
    m.includes("not found") ||
    m.includes("is not found") ||
    m.includes("invalid model")
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function supportsThinkingLevel(model) {
  // flash-lite: sem thinkingConfig (evita 400 em alguns IDs)
  if (String(model || "").includes("lite")) return false;
  return /^gemini-3(\.|-)/.test(String(model || ""));
}

/**
 * Modelo fixo = `GEMINI_MODEL` / opts.model (sem fallback automático).
 * Fallback só se `fallbackModels` ou `GEMINI_FALLBACK_MODELS` for passado explicitamente.
 * @param {string} primary
 * @param {string[]|string|undefined} fallbacks
 */
export function resolveModelChain(primary, fallbacks) {
  /** @type {string[]} */
  let list = [];
  if (typeof fallbacks === "string" && fallbacks.trim()) {
    list = fallbacks.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(fallbacks)) {
    list = fallbacks;
  } else if (process.env.GEMINI_FALLBACK_MODELS) {
    list = process.env.GEMINI_FALLBACK_MODELS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // lista vazia = modelo único (export GEMINI_MODEL)
  const seen = new Set();
  const chain = [];
  for (const m of [primary, ...list]) {
    if (!m || seen.has(m)) continue;
    seen.add(m);
    chain.push(m);
  }
  return chain;
}

/**
 * @param {{
 *   prompt: string,
 *   system?: string,
 *   model?: string,
 *   fallbackModels?: string[]|string,
 *   apiKey?: string,
 *   json?: boolean,
 *   thinkingLevel?: "low"|"medium"|"high",
 *   retries?: number,
 *   retryMs?: number,
 * }} opts
 * @param {{ fetch?: typeof fetch, sleep?: Function, log?: Function }} [deps]
 * @returns {Promise<{ text: string, usage?: object, raw?: object, model: string }>}
 */
export async function generateContent(opts, deps = {}) {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) fail("GEMINI_NO_API_KEY", "falta GEMINI_API_KEY");

  const primary =
    opts.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const models = resolveModelChain(primary, opts.fallbackModels);
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const sleepFn = deps.sleep ?? sleep;
  const logFn = deps.log ?? log;
  if (typeof fetchFn !== "function") {
    fail("GEMINI_NO_FETCH", "fetch indisponível (Node ≥ 18)");
  }

  const retries = Number(
    opts.retries ?? process.env.GEMINI_RETRIES ?? DEFAULT_RETRIES,
  );
  const retryMs = Number(
    opts.retryMs ?? process.env.GEMINI_RETRY_MS ?? DEFAULT_RETRY_MS,
  );
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const chainRounds = Number(opts.chainRounds ?? DEFAULT_CHAIN_ROUNDS);

  const promptChars = String(opts.prompt || "").length;
  const systemChars = String(opts.system || "").length;
  logFn(`cadeia modelos: ${models.join(" → ")} (rounds=${chainRounds})`);

  let lastMsg = "";
  let lastStatus = 0;

  for (let round = 1; round <= chainRounds; round++) {
    if (round > 1) {
      const wait = 4000 * round;
      logFn(`round ${round}/${chainRounds}: aguardando ${wait}ms (API saturada)`);
      await sleepFn(wait);
    }

    for (let mi = 0; mi < models.length; mi++) {
      const model = models[mi];
      const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent`;

      const body = {
        contents: [
          { role: "user", parts: [{ text: String(opts.prompt || "") }] },
        ],
        generationConfig: {},
      };
      if (opts.system) {
        body.systemInstruction = { parts: [{ text: String(opts.system) }] };
      }
      if (opts.json !== false) {
        body.generationConfig.responseMimeType = "application/json";
      }
      if (opts.thinkingLevel && supportsThinkingLevel(model)) {
        body.generationConfig.thinkingConfig = {
          thinkingLevel: opts.thinkingLevel,
        };
      }

      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        logFn(
          `request model=${model} attempt=${attempt}/${retries + 1} ` +
            `modelIdx=${mi + 1}/${models.length} round=${round} ` +
            `promptChars=${promptChars} systemChars=${systemChars}`,
        );
        const t0 = Date.now();
        let res;
        const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer =
          ac && timeoutMs > 0
            ? setTimeout(() => ac.abort(), timeoutMs)
            : null;
        try {
          res = await fetchFn(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(body),
            signal: ac?.signal,
          });
        } catch (e) {
          if (timer) clearTimeout(timer);
          lastMsg = e?.name === "AbortError" ? `timeout ${timeoutMs}ms` : e?.message || String(e);
          lastStatus = 0;
          logFn(`network error: ${lastMsg}`);
          if (isHighDemand(0, lastMsg) || /timeout/i.test(lastMsg)) {
            if (mi < models.length - 1) {
              logFn(`fallback → ${models[mi + 1]} (${lastMsg})`);
              break;
            }
          }
          if (attempt <= retries && isRetryable(0, lastMsg)) {
            const wait = retryMs * attempt;
            logFn(`retry em ${wait}ms (rede)`);
            await sleepFn(wait);
            continue;
          }
          break;
        }
        if (timer) clearTimeout(timer);

        const raw = await res.json().catch(() => ({}));
        const ms = Date.now() - t0;

        if (!res.ok) {
          lastStatus = res.status;
          lastMsg =
            raw?.error?.message ||
            `HTTP ${res.status} ${res.statusText || ""}`.trim();
          logFn(`HTTP ${res.status} em ${ms}ms: ${lastMsg}`);

          if (isModelUnavailable(res.status, lastMsg) && mi < models.length - 1) {
            logFn(`fallback → ${models[mi + 1]} (modelo indisponível: ${model})`);
            break;
          }
          if (isHighDemand(res.status, lastMsg) && mi < models.length - 1) {
            logFn(`fallback → ${models[mi + 1]} (high demand em ${model})`);
            break;
          }
          if (attempt <= retries && isRetryable(res.status, lastMsg)) {
            const wait = retryMs * attempt;
            logFn(`retry em ${wait}ms (${res.status})`);
            await sleepFn(wait);
            continue;
          }
          if (isRetryable(res.status, lastMsg) && mi < models.length - 1) {
            logFn(`fallback → ${models[mi + 1]}`);
            break;
          }
          // último modelo do round: sai para próximo round
          break;
        }

        const parts = raw?.candidates?.[0]?.content?.parts || [];
        const text = parts
          .map((p) => p?.text || "")
          .filter(Boolean)
          .join("");
        if (!text) {
          logFn(
            `empty response em ${ms}ms finishReason=${raw?.candidates?.[0]?.finishReason}`,
          );
          if (mi < models.length - 1) {
            logFn(`fallback → ${models[mi + 1]} (resposta vazia)`);
            break;
          }
          continue;
        }

        const usage = raw?.usageMetadata || undefined;
        logFn(
          `ok model=${model} em ${ms}ms textChars=${text.length}` +
            (usage
              ? ` tokens in=${usage.promptTokenCount ?? "?"} out=${usage.candidatesTokenCount ?? "?"}`
              : ""),
        );

        return {
          text,
          usage,
          raw,
          model,
        };
      }
    }
  }

  fail(
    "GEMINI_REQUEST_FAILED",
    lastMsg || `falha após retries/fallbacks (${models.join(", ")})`,
    { status: lastStatus, models },
  );
}

export {
  DEFAULT_MODEL,
  DEFAULT_FALLBACKS,
  isRetryable,
  isHighDemand,
  isModelUnavailable,
};
