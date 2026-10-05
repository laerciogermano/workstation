/**
 * EP-07 / US-24 — decide próxima ação a partir de prompt + OCR (Gemini ou OpenAI).
 */
import {
  generateContent as generateGemini,
  DEFAULT_MODEL as DEFAULT_GEMINI_MODEL,
} from "./gemini.js";
import {
  generateContent as generateOpenAI,
  DEFAULT_MODEL as DEFAULT_OPENAI_MODEL,
} from "./openai.js";

const ACTION_TYPES = new Set([
  "tap",
  "scroll",
  "type",
  "key",
  "sleep",
  "done",
  "fail",
]);

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

/**
 * @param {{ provider?: string, model?: string } | null | undefined} [cfg]
 * @returns {"gemini"|"openai"}
 */
export function resolveProvider(cfg) {
  const explicit = String(cfg?.provider || process.env.AGENT_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (explicit === "openai" || explicit === "gpt") return "openai";
  if (explicit === "gemini" || explicit === "google") return "gemini";
  const model = String(
    cfg?.model || process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || "",
  );
  if (/^gpt-/i.test(model) || /openai/i.test(model)) return "openai";
  return "gemini";
}

/**
 * @param {{ provider?: string, model?: string } | null | undefined} [cfg]
 */
export function resolveDecideModel(cfg) {
  const provider = resolveProvider(cfg);
  if (cfg?.model) return cfg.model;
  if (provider === "openai") {
    return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
  }
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

/**
 * Compacta OCR para o prompt (só text,x,y).
 * @param {Array<{ text?: string, type?: string, x?: number, y?: number }>} ocr
 */
export function compactOcr(ocr) {
  return (ocr || []).map((e) => ({
    text: String(e?.text ?? ""),
    x: Number(e?.x),
    y: Number(e?.y),
  }));
}

/**
 * @param {unknown} raw
 */
export function parseActionPayload(raw) {
  let data = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fence ? fence[1].trim() : trimmed;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      fail("AGENT_BAD_JSON", `JSON inválido: ${e.message}`);
    }
  }
  if (!data || typeof data !== "object") {
    fail("AGENT_BAD_JSON", "payload não é objeto");
  }
  const acao = data.acao;
  if (!acao || typeof acao !== "object") {
    fail("AGENT_BAD_ACTION", "falta acao");
  }
  const type = String(acao.type || "").toLowerCase();
  if (!ACTION_TYPES.has(type)) {
    fail("AGENT_BAD_ACTION", `acao.type inválido: ${acao.type}`);
  }
  const out = {
    type,
    x: acao.x == null ? null : Number(acao.x),
    y: acao.y == null ? null : Number(acao.y),
    direction: acao.direction == null ? null : String(acao.direction),
    text: acao.text == null ? null : String(acao.text),
    code: acao.code == null ? null : String(acao.code),
    ms: acao.ms == null ? null : Number(acao.ms),
    motivo: acao.motivo == null ? "" : String(acao.motivo),
  };
  if (type === "tap") {
    if (!Number.isFinite(out.x) || !Number.isFinite(out.y)) {
      fail("AGENT_BAD_ACTION", "tap exige x,y numéricos");
    }
  }
  if (type === "type" && !out.text) {
    const m = String(out.motivo || "").match(/'([^']+)'|"([^"]+)"/);
    if (m) out.text = m[1] || m[2];
  }
  if (type === "type" && !out.text) {
    fail("AGENT_BAD_ACTION", "type exige text");
  }
  if (type === "key" && !out.code) {
    fail("AGENT_BAD_ACTION", "key exige code");
  }
  return {
    resumo: data.resumo == null ? "" : String(data.resumo),
    elementos: Array.isArray(data.elementos) ? data.elementos : [],
    acao: out,
  };
}

function buildSystemPrompt() {
  return `Você opera um smartphone Android olhando só a lista OCR da tela (textos + coordenadas x,y na escala do device).

Responda APENAS JSON válido (sem markdown) no formato:
{
  "resumo": "2-4 frases do que tem na tela",
  "elementos": [{ "label": "...", "tipo": "button|chip|card|text", "x": 0, "y": 0 }],
  "acao": {
    "type": "tap|scroll|type|key|sleep|done|fail",
    "x": null,
    "y": null,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null,
    "motivo": "..."
  }
}

Regras:
- Coords de tap = mesma escala do OCR (device). Não invente scale.
- tap: use x,y de um item OCR existente (centro do texto alvo).
- scroll: direction down|up|left|right quando o próximo alvo não está visível.
- Se o histórico mostrar vários scrolls com o mesmo OCR (tela não mudou), NÃO scroll de novo: mude de estratégia (tap em outro elemento, type, key BACK).
- Home / Settings (AVD Nexus Launcher):
  - OCR com "Notifications" / "Clear all" / "AndroidSetup" = shade aberto → key KEYCODE_BACK ou KEYCODE_HOME (NÃO scroll).
  - Tela inicial (só hora/data, sem apps) → scroll direction=down abre a gaveta. scroll up reabre o shade — evite.
  - Texto "Settings" no OCR → tap nessas coords. done só com Settings aberto (Search settings / Network / Apps / Battery).
- Filtro de localização LinkedIn: se OCR tiver "Add a location" / "Add alocation" e a cidade alvo do roteiro (ex. Campinas) NÃO estiver na lista, faça tap em Add a location e depois type da cidade — NÃO fique só scrollando a lista.
- Connect: só tap se text exato "Connect" e tipicamente 180 < y < 850. Se o histórico já tem tap nas mesmas coords e a tela não mudou, scroll ou outro Connect — não repita o mesmo tap.
- type: digite text de uma vez (campo acao.text obrigatório). Se o histórico mostrar erro de tecla OCR, espere (sleep) e tente type de novo, ou key KEYCODE_BACK e reabra o campo.
- key: code tipo KEYCODE_BACK / KEYCODE_HOME.
- sleep: ms quando a tela parece carregando.
- done: objetivo cumprido.
- fail: impossível continuar (motivo claro).
- Não peça screenshot; decida só com o OCR e o prompt.`;
}

const MAX_PROMPT_CHARS = Number(process.env.GEMINI_MAX_PROMPT_CHARS || 6000);
/** Janela de passos recentes no prompt (antes: 8 fixo). Env: AGENT_HISTORY_STEPS. */
export const DEFAULT_HISTORY_STEPS = 12;

/**
 * Resolve N da janela de histórico (≥1). cfg > env > default.
 * @param {{ historySteps?: number } | null | undefined} [cfg]
 */
export function resolveHistorySteps(cfg) {
  const raw =
    cfg?.historySteps ??
    process.env.AGENT_HISTORY_STEPS ??
    DEFAULT_HISTORY_STEPS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_HISTORY_STEPS;
  return Math.floor(n);
}

function clipPrompt(prompt) {
  const s = String(prompt || "").trim();
  if (s.length <= MAX_PROMPT_CHARS) return s;
  return (
    s.slice(0, MAX_PROMPT_CHARS) +
    `\n…(roteiro truncado ${s.length}→${MAX_PROMPT_CHARS} chars)`
  );
}

/**
 * @param {{
 *   prompt: string,
 *   ocr: Array<{ text?: string, x?: number, y?: number }>,
 *   history?: object[],
 *   historySteps?: number,
 * }} cfg
 */
export function buildUserPrompt(cfg) {
  const { prompt, ocr, history } = cfg;
  const n = resolveHistorySteps(cfg);
  const window =
    Array.isArray(history) && history.length ? history.slice(-n) : [];
  const hist = window.length
    ? `\nHistórico recente (últimos ${window.length}/${n}):\n${JSON.stringify(window, null, 0)}\n`
    : "";
  return `Objetivo / roteiro:
${clipPrompt(prompt)}
${hist}
OCR atual (JSON):
${JSON.stringify(compactOcr(ocr))}

Defina a próxima ação.`;
}

/**
 * @param {{
 *   prompt: string,
 *   ocr: Array<{ text?: string, x?: number, y?: number }>,
 *   history?: object[],
 *   historySteps?: number,
 *   model?: string,
 *   provider?: string,
 *   apiKey?: string,
 *   thinkingLevel?: "low"|"medium"|"high",
 * }} cfg
 * @param {{ generateContent?: Function }} [deps]
 */
function log(...args) {
  console.log(`[decide ${new Date().toISOString()}]`, ...args);
}

export async function decide(cfg, deps = {}) {
  if (!cfg?.prompt) fail("AGENT_NO_PROMPT", "decide: falta prompt");
  if (!Array.isArray(cfg.ocr)) fail("AGENT_NO_OCR", "decide: falta ocr[]");

  const logFn = deps.log ?? log;
  const provider = resolveProvider(cfg);
  const model = resolveDecideModel(cfg);
  const historySteps = resolveHistorySteps(cfg);
  logFn(
    `início provider=${provider} model=${model} ocrHits=${cfg.ocr.length} history=${(cfg.history || []).length} historySteps=${historySteps}`,
  );

  const gen =
    deps.generateContent ??
    (provider === "openai" ? generateOpenAI : generateGemini);
  let text;
  let usage;
  let usedModel = model;
  let requests;
  try {
    const out = await gen(
      {
        system: buildSystemPrompt(),
        prompt: buildUserPrompt({ ...cfg, historySteps }),
        model,
        apiKey: cfg.apiKey,
        json: true,
        thinkingLevel: cfg.thinkingLevel || "low",
      },
      deps,
    );
    text = out.text;
    usage = out.usage;
    usedModel = out.model || model;
    requests = out.requests;
  } catch (e) {
    logFn(`erro ${provider}: ${e.code || ""} ${e.message}`);
    throw e;
  }

  const parsed = parseActionPayload(text);
  logFn(
    `ação=${parsed.acao.type}` +
      (parsed.acao.x != null ? ` @${parsed.acao.x},${parsed.acao.y}` : "") +
      (parsed.acao.direction ? ` dir=${parsed.acao.direction}` : "") +
      (parsed.acao.motivo ? ` — ${parsed.acao.motivo}` : ""),
  );
  return { ...parsed, usage, model: usedModel, provider, requests };
}

export { ACTION_TYPES, DEFAULT_GEMINI_MODEL, DEFAULT_OPENAI_MODEL };
