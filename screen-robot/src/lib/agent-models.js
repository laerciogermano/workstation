/**
 * Catálogo de modelos para o setup CLI do agent (EP-07).
 * IDs = valor passado a Gemini/OpenAI API.
 */

/** @typedef {{ id: string, provider: "gemini"|"openai", label: string }} AgentModel */

/** @type {AgentModel[]} */
export const AGENT_MODELS = [
  {
    id: "gemini-3.5-flash-lite",
    provider: "gemini",
    label: "Gemini 3.5 Flash-Lite (default / barato)",
  },
  {
    id: "gemini-3.1-flash-lite",
    provider: "gemini",
    label: "Gemini 3.1 Flash-Lite",
  },
  {
    id: "gemini-3-flash",
    provider: "gemini",
    label: "Gemini 3 Flash",
  },
  {
    id: "gemini-3.5-flash",
    provider: "gemini",
    label: "Gemini 3.5 Flash",
  },
  {
    id: "gemini-3.6-flash",
    provider: "gemini",
    label: "Gemini 3.6 Flash",
  },
  {
    id: "gemini-3.7-flash",
    provider: "gemini",
    label: "Gemini 3.7 Flash",
  },
  {
    id: "gemini-3.8-flash",
    provider: "gemini",
    label: "Gemini 3.8 Flash (aprovado POC)",
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
