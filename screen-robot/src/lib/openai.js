/**
 * EP-07 — cliente OpenAI chat.completions (texto → JSON).
 * Default: gpt-4o-mini.
 * Compatível com o contrato de gemini.generateContent (text, usage*, requests).
 */

const DEFAULT_MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_RETRIES = Number(process.env.OPENAI_RETRIES || process.env.GEMINI_RETRIES || 2);
const DEFAULT_RETRY_MS = Number(process.env.OPENAI_RETRY_MS || process.env.GEMINI_RETRY_MS || 0);
const DEFAULT_TIMEOUT_MS = Number(
  process.env.OPENAI_TIMEOUT_MS || process.env.GEMINI_TIMEOUT_MS || 30000,
);

function fail(code, msg, extra = {}) {
  const err = new Error(msg);
  err.code = code;
  Object.assign(err, extra);
  throw err;
}

function log(...args) {
  console.log(`[openai ${new Date().toISOString()}]`, ...args);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(status, message) {
  if (status === 429 || status === 503 || status === 500) return true;
  const m = String(message || "").toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("overloaded") ||
    m.includes("timeout") ||
    m.includes("abort") ||
    m.includes("try again")
  );
}

/** Normaliza usage OpenAI → formato Gemini (agent-run / usage files). */
export function normalizeUsage(u) {
  if (!u || typeof u !== "object") return undefined;
  return {
    promptTokenCount: u.prompt_tokens ?? u.promptTokenCount,
    candidatesTokenCount: u.completion_tokens ?? u.candidatesTokenCount,
    totalTokenCount: u.total_tokens ?? u.totalTokenCount,
    prompt_tokens: u.prompt_tokens,
    completion_tokens: u.completion_tokens,
    total_tokens: u.total_tokens,
  };
}

/**
 * @param {{
 *   prompt: string,
 *   system?: string,
 *   model?: string,
 *   apiKey?: string,
 *   json?: boolean,
 *   retries?: number,
 *   retryMs?: number,
 *   timeoutMs?: number,
 * }} opts
 * @param {{ fetch?: typeof fetch, sleep?: Function, log?: Function }} [deps]
 * @returns {Promise<{ text: string, usage?: object, raw?: object, model: string, requests: object[] }>}
 */
export async function generateContent(opts, deps = {}) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) fail("OPENAI_NO_API_KEY", "falta OPENAI_API_KEY");

  const model = opts.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const sleepFn = deps.sleep ?? sleep;
  const logFn = deps.log ?? log;
  if (typeof fetchFn !== "function") {
    fail("OPENAI_NO_FETCH", "fetch indisponível (Node ≥ 18)");
  }

  const retries = Number(opts.retries ?? DEFAULT_RETRIES);
  const retryMs = Number(opts.retryMs ?? DEFAULT_RETRY_MS);
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const promptText = String(opts.prompt || "");
  const systemText = String(opts.system || "");
  const promptChars = promptText.length;
  const systemChars = systemText.length;

  /** @type {object[]} */
  const messages = [];
  if (systemText) messages.push({ role: "system", content: systemText });
  messages.push({ role: "user", content: promptText });

  const body = {
    model,
    messages,
    temperature: 0,
  };
  if (opts.json !== false) {
    body.response_format = { type: "json_object" };
  }

  const baseReqMeta = {
    promptChars,
    systemChars,
    prompt: promptText,
    system: systemText || undefined,
    input: {
      system: systemText || undefined,
      prompt: promptText,
      body,
    },
  };

  logFn(`request model=${model} retries=${retries}`);

  /** @type {object[]} */
  const requests = [];
  let lastMsg = "";
  let lastStatus = 0;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    logFn(
      `request model=${model} attempt=${attempt}/${retries + 1} ` +
        `promptChars=${promptChars} systemChars=${systemChars}`,
    );
    const t0 = Date.now();
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer =
      ac && timeoutMs > 0 ? setTimeout(() => ac.abort(), timeoutMs) : null;
    let res;
    try {
      res = await fetchFn(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac?.signal,
      });
    } catch (e) {
      if (timer) clearTimeout(timer);
      lastMsg =
        e?.name === "AbortError" ? `timeout ${timeoutMs}ms` : e?.message || String(e);
      lastStatus = 0;
      logFn(`network error: ${lastMsg}`);
      requests.push({
        model,
        attempt,
        ok: false,
        error: lastMsg,
        ms: Date.now() - t0,
        ...baseReqMeta,
        output: { error: lastMsg },
      });
      if (attempt <= retries && isRetryable(0, lastMsg)) {
        if (retryMs > 0) await sleepFn(retryMs * attempt);
        else logFn(`retry imediato (rede)`);
        continue;
      }
      fail("OPENAI_REQUEST_FAILED", lastMsg, { status: lastStatus, model, requests });
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
      requests.push({
        model,
        attempt,
        ok: false,
        status: res.status,
        error: lastMsg,
        ms,
        ...baseReqMeta,
        usage: normalizeUsage(raw?.usage),
        output: { raw, error: lastMsg },
      });
      if (attempt <= retries && isRetryable(res.status, lastMsg)) {
        if (retryMs > 0) await sleepFn(retryMs * attempt);
        else logFn(`retry imediato (${res.status})`);
        continue;
      }
      fail("OPENAI_REQUEST_FAILED", lastMsg, { status: lastStatus, model, requests });
    }

    const text = String(raw?.choices?.[0]?.message?.content || "").trim();
    if (!text) {
      lastMsg = "empty response";
      logFn(`empty response em ${ms}ms finish=${raw?.choices?.[0]?.finish_reason}`);
      requests.push({
        model,
        attempt,
        ok: false,
        error: lastMsg,
        ms,
        ...baseReqMeta,
        usage: normalizeUsage(raw?.usage),
        output: { raw, error: lastMsg },
      });
      if (attempt <= retries) {
        if (retryMs > 0) await sleepFn(retryMs * attempt);
        continue;
      }
      fail("OPENAI_REQUEST_FAILED", lastMsg, { status: 0, model, requests });
    }

    const usage = normalizeUsage(raw?.usage);
    logFn(
      `ok model=${model} em ${ms}ms textChars=${text.length}` +
        (usage
          ? ` tokens in=${usage.promptTokenCount ?? "?"} out=${usage.candidatesTokenCount ?? "?"}`
          : ""),
    );
    requests.push({
      model,
      attempt,
      ok: true,
      ms,
      ...baseReqMeta,
      response: text,
      usage,
      output: { text, raw },
    });

    return { text, usage, raw, model, requests };
  }

  fail("OPENAI_REQUEST_FAILED", lastMsg || "falha OpenAI", {
    status: lastStatus,
    model,
    requests,
  });
}

export { DEFAULT_MODEL, isRetryable };
