/**
 * EP-07 — cliente Gemini generateContent (texto → JSON).
 * Default: gemini-3.8-flash · high demand → retry + fallback de modelo.
 */

const DEFAULT_MODEL = "gemini-3.8-flash";
/** Flash elegíveis (POC custos) — usados se o primary estiver em high demand. */
const DEFAULT_FALLBACKS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3-flash",
  "gemini-2.5-flash",
];
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_RETRIES = 2; // por modelo
const DEFAULT_RETRY_MS = 1500;

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function supportsThinkingLevel(model) {
  return /^gemini-3(\.|-)/.test(String(model || ""));
}

/**
 * @param {string} primary
 * @param {string[]|string|undefined} fallbacks
 */
export function resolveModelChain(primary, fallbacks) {
  let list = DEFAULT_FALLBACKS;
  if (typeof fallbacks === "string" && fallbacks.trim()) {
    list = fallbacks.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(fallbacks)) {
    list = fallbacks;
  } else if (process.env.GEMINI_FALLBACK_MODELS) {
    list = process.env.GEMINI_FALLBACK_MODELS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
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

  const promptChars = String(opts.prompt || "").length;
  const systemChars = String(opts.system || "").length;
  logFn(`cadeia modelos: ${models.join(" → ")}`);

  let lastMsg = "";
  let lastStatus = 0;

  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi];
    const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent`;

    const body = {
      contents: [{ role: "user", parts: [{ text: String(opts.prompt || "") }] }],
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
          `modelIdx=${mi + 1}/${models.length} ` +
          `promptChars=${promptChars} systemChars=${systemChars}`,
      );
      const t0 = Date.now();
      let res;
      try {
        res = await fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        lastMsg = e?.message || String(e);
        lastStatus = 0;
        logFn(`network error: ${lastMsg}`);
        if (attempt <= retries && isRetryable(0, lastMsg)) {
          const wait = retryMs * attempt;
          logFn(`retry em ${wait}ms (rede)`);
          await sleepFn(wait);
          continue;
        }
        break; // próximo modelo
      }

      const raw = await res.json().catch(() => ({}));
      const ms = Date.now() - t0;

      if (!res.ok) {
        lastStatus = res.status;
        lastMsg =
          raw?.error?.message ||
          `HTTP ${res.status} ${res.statusText || ""}`.trim();
        logFn(`HTTP ${res.status} em ${ms}ms: ${lastMsg}`);
        if (attempt <= retries && isRetryable(res.status, lastMsg)) {
          const wait = retryMs * attempt;
          logFn(`retry em ${wait}ms (high demand / ${res.status})`);
          await sleepFn(wait);
          continue;
        }
        if (isRetryable(res.status, lastMsg) && mi < models.length - 1) {
          logFn(`fallback → ${models[mi + 1]} (high demand em ${model})`);
          break;
        }
        fail("GEMINI_REQUEST_FAILED", lastMsg, {
          status: res.status,
          attempt,
          model,
        });
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
        fail("GEMINI_EMPTY", "resposta Gemini sem texto", { attempt, model });
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

  fail(
    "GEMINI_REQUEST_FAILED",
    lastMsg || `falha após retries/fallbacks (${models.join(", ")})`,
    { status: lastStatus, models },
  );
}

export { DEFAULT_MODEL, DEFAULT_FALLBACKS, isRetryable };
