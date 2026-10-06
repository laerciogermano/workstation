/**
 * Catálogo de modelos para o setup CLI do agent (EP-07).
 * IDs = valor passado a Gemini/OpenAI API.
 */

/** @typedef {{ id: string, provider: "gemini"|"openai", label: string }} AgentModel */

/**
 * Escada default (mais novo → mais barato) até gpt-4o-mini.
 * `decide` começa no modelo escolhido e desce o resto.
 * @type {string[]}
 */
export const FALLBACK_LADDER = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gpt-4o-mini",
];

/** @type {AgentModel[]} */
export const AGENT_MODELS = [
  {
    id: "gemini-3.8-flash",
    provider: "gemini",
    label: "Gemini 3.8 Flash (aprovado POC)",
  },
  {
    id: "gemini-3.7-flash",
    provider: "gemini",
    label: "Gemini 3.7 Flash",
  },
  {
    id: "gemini-3.6-flash",
    provider: "gemini",
    label: "Gemini 3.6 Flash",
  },
  {
    id: "gemini-3.5-flash",
    provider: "gemini",
    label: "Gemini 3.5 Flash",
  },
  {
    id: "gemini-3-flash-preview",
    provider: "gemini",
    label: "Gemini 3 Flash (preview)",
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
  },
  {
    id: "gemini-3.5-flash-lite",
    provider: "gemini",
    label: "Gemini 3.5 Flash-Lite (barato)",
  },
  {
    id: "gemini-3.1-flash-lite",
    provider: "gemini",
    label: "Gemini 3.1 Flash-Lite",
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    label: "OpenAI GPT-5 mini",
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    label: "OpenAI GPT-4o mini",
  },
];

export function findAgentModel(id) {
  const key = String(id || "").trim();
  return AGENT_MODELS.find((m) => m.id === key) || null;
}

/**
 * @param {string} id
 * @returns {"gemini"|"openai"}
 */
export function providerForModel(id) {
  const hit = findAgentModel(id);
  if (hit) return hit.provider;
  if (/^gpt-/i.test(id) || /openai/i.test(id)) return "openai";
  return "gemini";
}

function uniqueIds(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const m = String(id || "").trim();
    if (!m || seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

function parseFallbackList(raw) {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return null;
}

export function isTruthyEnv(v) {
  return /^(1|true|on|yes)$/i.test(String(v ?? "").trim());
}

/**
 * @param {{ noFallback?: boolean, env?: NodeJS.ProcessEnv }} [opts]
 */
export function resolveNoFallback(opts = {}) {
  if (opts.noFallback === true) return true;
  if (opts.noFallback === false) return false;
  return isTruthyEnv((opts.env || process.env).AGENT_NO_FALLBACK);
}

/**
 * Cadeia de fallback: primary + o que está abaixo na escada, até gpt-4o-mini.
 * Override: `cfg.fallbackModels` / `AGENT_FALLBACK_MODELS` (lista CSV).
 * Desliga: `noFallback` / `AGENT_NO_FALLBACK=1` / `AGENT_FALLBACK_MODELS=off` (ou `0` / `none`).
 * @param {string} primary
 * @param {{ fallbackModels?: string[]|string, noFallback?: boolean, env?: NodeJS.ProcessEnv }} [opts]
 * @returns {string[]}
 */
export function resolveFallbackLadder(primary, opts = {}) {
  const p = String(primary || "").trim();
  const env = opts.env || process.env;
  if (resolveNoFallback({ noFallback: opts.noFallback, env })) {
    return p ? [p] : [];
  }
  const raw =
    opts.fallbackModels !== undefined
      ? opts.fallbackModels
      : env.AGENT_FALLBACK_MODELS;
  if (raw === "0" || raw === "none" || raw === "off") {
    return p ? [p] : [];
  }
  const explicit = parseFallbackList(raw);
  if (explicit) return uniqueIds([p, ...explicit]);

  const idx = FALLBACK_LADDER.indexOf(p);
  if (idx >= 0) return FALLBACK_LADDER.slice(idx);
  if (!p) return [...FALLBACK_LADDER];
  return uniqueIds([p, ...FALLBACK_LADDER]);
}

/**
 * Resolve escolha a partir de string: "1", "1,3", "a"/"all", ou id do modelo.
 * @param {string} raw
 * @param {AgentModel[]} [models]
 * @returns {AgentModel[]}
 */
export function parseModelSelection(raw, models = AGENT_MODELS) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return [];
  if (s === "a" || s === "all" || s === "*") return [...models];

  const byId = findAgentModel(s);
  if (byId) return [byId];

  const parts = s.split(/[\s,;]+/).filter(Boolean);
  /** @type {AgentModel[]} */
  const out = [];
  const seen = new Set();
  for (const p of parts) {
    const n = Number(p);
    if (Number.isInteger(n) && n >= 1 && n <= models.length) {
      const m = models[n - 1];
      if (!seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
      continue;
    }
    const hit = findAgentModel(p);
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      out.push(hit);
    }
  }
  return out;
}
