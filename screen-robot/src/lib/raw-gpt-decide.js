/**
 * Decisão crua via chat.completions (mesmo contrato do scripts/raw-gpt.js).
 * Retorno: action só com chaves presentes na resposta da IA.
 */

export const SYSTEM_PROMPT = `Você é uma IA agente autônoma que controla um smartphone Android.
Você recebe: (1) a jornada/objetivo, (2) o OCR da tela atual (lista extract: type, text, x, y) e (3) o passo atual ("voce esta no passo N").
Decida UMA próxima ação e responda APENAS um JSON válido (sem markdown, sem texto fora do JSON).
O JSON raiz OBRIGATÓRIO é exatamente { "action": { ... }, "passo": N } — proibido devolver o objeto da ação na raiz.

Formato único:
{
  "action": {
    "type": "tap|scroll|type|key|sleep|done|fail",
    "x": null,
    "y": null,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null
  },
  "motivo": null,
  "passo": null
}

Tipos (lib screen-robot):
- tap: obrigatório x e y numéricos do OCR desta tela (centro do alvo); demais campos null
- scroll: direction up|down|left|right (obrigatório; x/y null)
- type: text a digitar
- key: code (ex. KEYCODE_BACK, KEYCODE_ENTER)
- sleep: ms
- done: jornada concluída
- fail: só se impossível seguir

passo (raiz, numérico, obrigatório):
- número a usar no PRÓXIMO turno (o runtime reenvia como step)
- se esta ação cumpriu o passo atual → avance (N+1, ou o indicado pela jornada)
- se ainda no mesmo passo (sleep/scroll/retry) → devolva o mesmo N
- NUNCA invente passo fora da jornada

Regras:
- NÃO retorne atributos com valor null; omita a chave
- tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords de outro contexto
- Cada item do OCR (text/icon) é clicável
- Sem alvo do passo → sleep ou scroll; evite fail
- Um único objeto JSON na resposta, no formato { "action": { ... }, "passo": N }"`;

/**
 * @param {string} prompt
 * @param {unknown} ocr
 * @param {number|string|null|undefined} [step]
 */
export function buildUserText(prompt, ocr, step) {
  const list = Array.isArray(ocr) ? ocr : [];
  const connectOrder = list
    .map((h, i) =>
      h && typeof h === "object" && String(h.text || "") === "Connect"
        ? { i, x: h.x, y: h.y }
        : null,
    )
    .filter(Boolean);
  const connectHint =
    connectOrder.length >= 1
      ? `\nBotões "Connect" na tela, de cima para baixo: ${JSON.stringify(connectOrder)}. No passo 11 toque SOMENTE no primeiro (${JSON.stringify(connectOrder[0])}).\n`
      : "";
  const stepNum = step != null && step !== "" ? Number(step) : NaN;
  const stepLine = Number.isFinite(stepNum)
    ? `\nvoce esta no passo ${stepNum}\n`
    : "";

  return `Jornada:


OCR atual (JSON):
${JSON.stringify(ocr)}
${connectHint}${stepLine}
Defina a próxima action com base no OCR e no prompt abaixo.

${prompt}`;
}

/**
 * Extrai action (+ passo raiz) do JSON da IA: só as chaves presentes (não inventa null).
 * @param {string} content
 * @returns {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, passo?: number }}
 */
export function parseActionTypeXY(content) {
  const data = JSON.parse(String(content || ""));
  if (!data || typeof data !== "object" || !("action" in data)) {
    const err = new Error('raw-gpt: resposta deve ser { "action": ... }');
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  const a = data.action;
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
  /** @type {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, passo?: number }} */
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
  if (data.passo != null && data.passo !== "") {
    const passo = Number(data.passo);
    if (Number.isFinite(passo)) out.passo = passo;
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
 *   step?: number|string|null,
 *   apiKey?: string,
 *   model?: string,
 * }} opts
 * @returns {Promise<{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, passo?: number, raw?: string, payload?: object }>}
 */
export async function decideRawAction(opts) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("falta OPENAI_API_KEY");
    err.code = "OPENAI_NO_API_KEY";
    throw err;
  }
  const prompt = opts.prompt;
  if (!prompt) {
    const err = new Error("falta prompt");
    err.code = "RAW_GPT_NO_PROMPT";
    throw err;
  }
  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserText(prompt, opts.ocr, opts.step) },
    ],
  };
  // gpt-5* só aceita temperature default; 0 → HTTP 400.
  if (!/^gpt-5/i.test(model)) payload.temperature = 0;
  console.log({ payload: JSON.stringify(payload, null, 2) });

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
  console.log({ raw });
  return { ...parseActionTypeXY(raw), raw, payload };
}
