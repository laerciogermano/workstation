/**
 * Decisão crua via chat.completions (mesmo contrato do scripts/raw-gpt.js).
 * Retorno: action sem atributos null (type + campos presentes).
 */

export const DEFAULT_PROMPT =
  "Na tela People do LinkedIn, encontre o comprador e toque em Connect.";

export const SYSTEM_PROMPT = `Você é uma IA agente autônoma que controla um smartphone Android.
Você recebe: (1) a jornada/objetivo e (2) o OCR da tela atual (lista extract: type, text, x, y).
Decida UMA próxima ação e responda APENAS um JSON válido (sem markdown, sem texto fora do JSON).

Formato (só campos com valor; PROIBIDO "motivo" e PROIBIDO atributos null):
{
  "action": {
    "type": "tap|scroll|type|key|sleep|done|fail"
  }
}

Campos opcionais conforme o type (inclua SOMENTE os necessários):
- tap: "x", "y" (números do OCR; centro do alvo)
- scroll: "direction" (up|down|left|right)
- type: "text"
- key: "code" (ex. KEYCODE_BACK, KEYCODE_ENTER)
- sleep: "ms"
- done / fail: só "type"

Exemplos:
{"action":{"type":"tap","x":455,"y":344}}
{"action":{"type":"scroll","direction":"down"}}
{"action":{"type":"sleep","ms":1000}}

Regras:
- NÃO inclua chaves com valor null ou undefined; omita o atributo
- tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords de outro contexto
- Cada item do OCR (text/icon) é clicável
- Sem alvo do passo → sleep ou scroll; evite fail
- Um único objeto JSON na resposta
- NUNCA inclua "motivo"`;

/**
 * @param {string} prompt
 * @param {unknown} ocr
 */
export function buildUserText(prompt, ocr) {
  return `Jornada:
${prompt}

OCR atual (JSON):
${JSON.stringify(ocr)}

Defina a próxima action.`;
}

/**
 * Extrai action omitindo nulls: type + campos presentes (x, y, direction, …).
 * @param {string} content
 * @returns {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number }}
 */
export function parseActionTypeXY(content) {
  const data = JSON.parse(String(content || ""));
  const a = data?.action ?? data?.acao ?? data;
  if (!a || typeof a !== "object") {
    const err = new Error("raw-gpt: falta action");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  const type = String(a.type || "").toLowerCase();
  if (!type) {
    const err = new Error("raw-gpt: action.type vazio");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  /** @type {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number }} */
  const out = { type };
  if (a.x != null && a.x !== "") {
    const x = Number(a.x);
    if (Number.isFinite(x)) out.x = x;
  }
  if (a.y != null && a.y !== "") {
    const y = Number(a.y);
    if (Number.isFinite(y)) out.y = y;
  }
  if (a.direction != null && a.direction !== "") {
    out.direction = String(a.direction).toLowerCase();
  }
  if (a.text != null && a.text !== "") out.text = String(a.text);
  if (a.code != null && a.code !== "") out.code = String(a.code);
  if (a.ms != null && a.ms !== "") {
    const ms = Number(a.ms);
    if (Number.isFinite(ms)) out.ms = ms;
  }
  if (type === "scroll" && !out.direction) {
    const err = new Error("raw-gpt: scroll sem direction");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  return out;
}

/**
 * @param {{
 *   prompt?: string,
 *   ocr: unknown,
 *   apiKey?: string,
 *   model?: string,
 * }} opts
 * @returns {Promise<{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, raw?: string, payload?: object }>}
 */
export async function decideRawAction(opts) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("falta OPENAI_API_KEY");
    err.code = "OPENAI_NO_API_KEY";
    throw err;
  }
  const prompt = opts.prompt ?? DEFAULT_PROMPT;
  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserText(prompt, opts.ocr) },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || JSON.stringify(data));
    err.code = "OPENAI_REQUEST_FAILED";
    throw err;
  }
  const raw = String(data.choices?.[0]?.message?.content ?? "");
  return { ...parseActionTypeXY(raw), raw, payload };
}
