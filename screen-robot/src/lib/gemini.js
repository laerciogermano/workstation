/**
 * EP-07 — cliente Gemini generateContent (texto → JSON).
 * Default model: gemini-3.8-flash (aprovado na POC visão).
 */

const DEFAULT_MODEL = "gemini-3.8-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

/**
 * @param {{
 *   prompt: string,
 *   system?: string,
 *   model?: string,
 *   apiKey?: string,
 *   json?: boolean,
 *   thinkingLevel?: "low"|"medium"|"high",
 * }} opts
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<{ text: string, usage?: object, raw?: object }>}
 */
export async function generateContent(opts, deps = {}) {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) fail("GEMINI_NO_API_KEY", "falta GEMINI_API_KEY");

  const model =
    opts.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fetchFn = deps.fetch ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    fail("GEMINI_NO_FETCH", "fetch indisponível (Node ≥ 18)");
  }

  const contents = [{ role: "user", parts: [{ text: String(opts.prompt || "") }] }];
  const body = {
    contents,
    generationConfig: {},
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: String(opts.system) }] };
  }
  if (opts.json !== false) {
    body.generationConfig.responseMimeType = "application/json";
  }
  if (opts.thinkingLevel) {
    body.generationConfig.thinkingConfig = {
      thinkingLevel: opts.thinkingLevel,
    };
  }

  const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent`;
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
    fail("GEMINI_REQUEST_FAILED", e?.message || String(e));
  }

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      raw?.error?.message ||
      `HTTP ${res.status} ${res.statusText || ""}`.trim();
    fail("GEMINI_REQUEST_FAILED", msg);
  }

  const parts = raw?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((p) => p?.text || "")
    .filter(Boolean)
    .join("");
  if (!text) {
    fail("GEMINI_EMPTY", "resposta Gemini sem texto");
  }

  return {
    text,
    usage: raw?.usageMetadata || undefined,
    raw,
  };
}

export { DEFAULT_MODEL };
