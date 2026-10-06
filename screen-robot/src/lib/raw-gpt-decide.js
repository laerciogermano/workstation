/**
 * Decisão crua via chat.completions (mesmo contrato do scripts/raw-gpt.js).
 * Retorno público do teste: { type, x, y } (sem motivo).
 */

export const DEFAULT_PROMPT =
  "Na tela People do LinkedIn, encontre o comprador e toque em Connect.";

export const SYSTEM_PROMPT = `Você é uma IA agente autônoma que controla um smartphone Android.
Você recebe: (1) a jornada/objetivo e (2) o OCR da tela atual (lista extract: type, text, x, y).
Decida UMA próxima ação e responda APENAS um JSON válido (sem markdown, sem texto fora do JSON).

Formato único:
{
  "action": {
    "type": "tap|scroll|type|key|sleep|done|fail",
    "x": null,
    "y": null,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null,
    "motivo": "passo em curso — ..."
  }
}

Tipos (lib screen-robot):
- tap: obrigatório x e y numéricos do OCR desta tela (centro do alvo)
- scroll: direction up|down|left|right
- type: text a digitar
- key: code (ex. KEYCODE_BACK, KEYCODE_ENTER)
- sleep: ms
- done: jornada concluída
- fail: só se impossível seguir

Regras:
- tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords de outro contexto
- Cada item do OCR (text/icon) é clicável
- Sem alvo do passo → sleep ou scroll; evite fail
- Um único objeto JSON na resposta`;

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
 * Extrai action e devolve só type, x, y (sem motivo nem extras).
 * @param {string} content
 * @returns {{ type: string, x: number|null, y: number|null }}
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
  const x = a.x == null || a.x === "" ? null : Number(a.x);
  const y = a.y == null || a.y === "" ? null : Number(a.y);
  return {
    type,
    x: Number.isFinite(x) ? x : null,
    y: Number.isFinite(y) ? y : null,
  };
}

/**
 * @param {{
 *   prompt?: string,
 *   ocr: unknown,
 *   apiKey?: string,
 *   model?: string,
 * }} opts
 * @param {{ fetch?: typeof fetch }} [deps]
 * @returns {Promise<{ type: string, x: number|null, y: number|null, raw?: string, payload?: object }>}
 */
export async function decideRawAction(opts, deps = {}) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("falta OPENAI_API_KEY");
    err.code = "OPENAI_NO_API_KEY";
    throw err;
  }
  const prompt = opts.prompt ?? DEFAULT_PROMPT;
  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const fetchFn = deps.fetch ?? globalThis.fetch;

  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserText(prompt, opts.ocr) },
    ],
  };

  const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
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
