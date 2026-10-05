/**
 * EP-07 / US-24 — decide próxima ação a partir de prompt + OCR (Gemini).
 */
import { generateContent, DEFAULT_MODEL } from "./gemini.js";

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
- type: digite text de uma vez.
- key: code tipo KEYCODE_BACK.
- sleep: ms quando a tela parece carregando.
- done: objetivo cumprido.
- fail: impossível continuar (motivo claro).
- Não peça screenshot; decida só com o OCR e o prompt.`;
}

function buildUserPrompt({ prompt, ocr, history }) {
  const hist =
    Array.isArray(history) && history.length
      ? `\nHistórico recente:\n${JSON.stringify(history.slice(-8), null, 0)}\n`
      : "";
  return `Objetivo / roteiro:
${String(prompt || "").trim()}
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
 *   model?: string,
 *   apiKey?: string,
 *   thinkingLevel?: "low"|"medium"|"high",
 * }} cfg
 * @param {{ generateContent?: Function }} [deps]
 */
export async function decide(cfg, deps = {}) {
  if (!cfg?.prompt) fail("AGENT_NO_PROMPT", "decide: falta prompt");
  if (!Array.isArray(cfg.ocr)) fail("AGENT_NO_OCR", "decide: falta ocr[]");

  const gen = deps.generateContent ?? generateContent;
  const { text, usage } = await gen(
    {
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(cfg),
      model: cfg.model || process.env.GEMINI_MODEL || DEFAULT_MODEL,
      apiKey: cfg.apiKey,
      json: true,
      thinkingLevel: cfg.thinkingLevel || "low",
    },
    deps,
  );

  const parsed = parseActionPayload(text);
  return { ...parsed, usage };
}

export { ACTION_TYPES };
