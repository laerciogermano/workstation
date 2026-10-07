/**
 * Decisão crua via OpenAI chat.completions ou Gemini generateContent.
 * Retorno: action só com chaves presentes na resposta da IA.
 * Cada request grava usage-2.0/<timestamp>.json ({ entrada, resposta }).
 * Modelos: catálogo em agent-models.js (gpt-* / gemini-*).
 */
import { providerForModel } from "./agent-models.js";
import { generateContent as generateGemini } from "./gemini.js";
import { generateContent as generateOpenAI } from "./openai.js";
import { writeUsage20 } from "./usage-write.js";

export const SYSTEM_PROMPT = `Você é uma IA agente autônoma que controla um smartphone Android.
Você recebe: (1) a jornada/objetivo, (2) o OCR da tela atual (lista extract: type, text, x, y) e (3) o passo atual ("voce esta no passo …").
Decida UMA próxima ação e responda APENAS um JSON válido (sem markdown, sem texto fora do JSON).
O JSON raiz OBRIGATÓRIO é exatamente { "action": { ... }, "proximoPasso": "…" } — proibido devolver o objeto da ação na raiz.

Formato único:
{
  "action": {
    "type": "tap|scroll|type|key|esperar|sleep|done|fail",
    "x": null,
    "y": null,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null
  },
  "motivo": null,
  "proximoPasso": null
}

Tipos (lib screen-robot):
- tap: obrigatório x e y numéricos do OCR desta tela (centro do alvo); demais campos null
- scroll: direction up|down|left|right (obrigatório; x/y null)
- type: text a digitar
- key: code (ex. KEYCODE_BACK, KEYCODE_ENTER)
- esperar: ms (obrigatório; ex. 1000). Use para aguardar UI/carregamento — NÃO há delay fixo entre turnos
- sleep: alias de esperar (mesmo contrato: ms)
- done: jornada concluída
- fail: só se impossível seguir

proximoPasso (raiz, texto, obrigatório):
- valor a usar no PRÓXIMO turno (o runtime reenvia como step)
- formato livre, alinhado à jornada: número ("3"), id ("connect"), ou resumo curto em linguagem natural ("digite comprador")
- se esta ação cumpriu o passo atual → avance para o próximo da jornada
- se ainda no mesmo passo (esperar/scroll/retry) → devolva o mesmo step
- NUNCA invente passo fora da jornada

Regras:
- "voce esta no passo …" = execute SOMENTE esse passo; PROIBIDO refazer passos já cumpridos
- NÃO retorne atributos com valor null; omita a chave
- tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords de outro contexto
- Cada item do OCR (text/icon) é clicável
- Sem alvo do passo / UI ainda carregando → esperar (ms) ou scroll; evite fail
- Prefira type "esperar" (não sleep) quando for aguardar
- Um único objeto JSON na resposta, no formato { "action": { ... }, "proximoPasso": "…" }"`;

/**
 * @param {string} [model]
 * @returns {string}
 */
export function resolveRawGptModel(model) {
  return String(
    (model != null && String(model).trim()) ||
      process.env.RAW_GPT_MODEL ||
      process.env.OPENAI_MODEL ||
      process.env.GEMINI_MODEL ||
      "gpt-4o-mini",
  ).trim();
}

/**
 * @param {string} prompt
 * @param {unknown} ocr
 * @param {string|number|null|undefined} [step]
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
  const stepText =
    step != null && String(step).trim() !== "" ? String(step).trim() : "";
  const stepLine = stepText
    ? `\nvoce esta no passo ${stepText}. Execute APENAS esse passo. PROIBIDO voltar a passos anteriores (ex. no 2 NÃO tap Search; faça type).\n`
    : "";

  return `Jornada:


OCR atual (JSON):
${JSON.stringify(ocr)}
${connectHint}${stepLine}
Defina a próxima action com base no OCR e no prompt abaixo.

Em cada ação, diga no motivo qual passo (1–13) está em curso.

Ordem obrigatória 1→N (N=último passo). Uma ação por turno. Toque só em textos ou ícones que estão na tela agora.
PROIBIDO fail se o texto do passo atual estiver na tela (ex. texto do passo atual → toque; não fail).
fail só se for impossível após tentar de novo; falhas antigas NÃO impedem um novo toque.

${prompt}`;
}

/**
 * Extrai action (+ proximoPasso raiz) do JSON da IA: só as chaves presentes (não inventa null).
 * @param {string} content
 * @returns {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, proximoPasso?: string }}
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
  let type = String(a.type || "").toLowerCase();
  if (!type) {
    const err = new Error("raw-gpt: action.type vazio");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  if (type === "sleep") type = "esperar";
  /** @type {{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, proximoPasso?: string }} */
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
  if (data.proximoPasso != null && data.proximoPasso !== "") {
    const proximoPasso = String(data.proximoPasso).trim();
    if (proximoPasso) out.proximoPasso = proximoPasso;
  }
  if (type === "scroll" && !out.direction) {
    const err = new Error("raw-gpt: scroll sem direction");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
  return out;
}

function usageTokens(usage) {
  if (!usage || typeof usage !== "object") return undefined;
  return {
    prompt_tokens: usage.prompt_tokens ?? usage.promptTokenCount,
    completion_tokens: usage.completion_tokens ?? usage.candidatesTokenCount,
    total_tokens: usage.total_tokens ?? usage.totalTokenCount,
    promptTokenCount: usage.promptTokenCount ?? usage.prompt_tokens,
    candidatesTokenCount: usage.candidatesTokenCount ?? usage.completion_tokens,
    totalTokenCount: usage.totalTokenCount ?? usage.total_tokens,
  };
}

/**
 * @param {{
 *   prompt?: string,
 *   ocr: unknown,
 *   step?: string|number|null,
 *   apiKey?: string,
 *   model?: string,
 *   provider?: "openai"|"gemini"|string,
 *   usageDir?: string,
 *   thinkingLevel?: string,
 *   retries?: number,
 * }} opts
 * @param {{ generateContent?: Function, fetch?: typeof fetch, sleep?: Function, log?: Function }} [deps]
 * @returns {Promise<{ type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number, proximoPasso?: string, raw?: string, payload?: object, resposta?: object, usage?: object, provider?: string, model?: string, usagePath?: string }>}
 */
export async function decideRawAction(opts, deps = {}) {
  const prompt = opts.prompt;
  if (!prompt) {
    const err = new Error("falta prompt");
    err.code = "RAW_GPT_NO_PROMPT";
    throw err;
  }
  const model = resolveRawGptModel(opts.model);
  const provider =
    opts.provider === "openai" || opts.provider === "gemini"
      ? opts.provider
      : providerForModel(model);

  const apiKey =
    opts.apiKey ??
    (provider === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.GEMINI_API_KEY);
  if (!apiKey) {
    const err = new Error(
      provider === "openai" ? "falta OPENAI_API_KEY" : "falta GEMINI_API_KEY",
    );
    err.code = provider === "openai" ? "OPENAI_NO_API_KEY" : "GEMINI_NO_API_KEY";
    throw err;
  }

  const userText = buildUserText(prompt, opts.ocr, opts.step);
  const gen =
    deps.generateContent ??
    (provider === "openai" ? generateOpenAI : generateGemini);

  let out;
  try {
    out = await gen(
      {
        model,
        apiKey,
        json: true,
        system: SYSTEM_PROMPT,
        prompt: userText,
        thinkingLevel: opts.thinkingLevel || "low",
        fallbackModels: [],
        chainRounds: 1,
        retries: opts.retries ?? 0,
      },
      deps,
    );
  } catch (e) {
    const lastReq = Array.isArray(e.requests) ? e.requests.at(-1) : null;
    if (lastReq) {
      const usagePath = writeUsage20({
        usageDir: opts.usageDir,
        entrada: lastReq.entrada ?? { model, provider },
        resposta: lastReq.resposta ?? { error: e.message },
      });
      e.usagePath = usagePath;
      console.log(`usage → ${usagePath}`);
    }
    throw e;
  }

  const lastReq = Array.isArray(out.requests) ? out.requests.at(-1) : null;
  const payload =
    lastReq?.entrada ??
    { model, provider, system: SYSTEM_PROMPT, prompt: userText };
  const resposta = lastReq?.resposta ?? out.raw ?? {};
  const usage = usageTokens(out.usage || lastReq?.usage || resposta?.usage || resposta?.usageMetadata);
  const usagePath = writeUsage20({
    usageDir: opts.usageDir,
    entrada: payload,
    resposta,
  });
  console.log(`usage → ${usagePath}`);

  const raw = String(out.text || "");
  console.log({ provider, model: out.model || model, raw });
  return {
    ...parseActionTypeXY(raw),
    raw,
    payload,
    resposta,
    usage,
    provider,
    model: out.model || model,
    usagePath,
  };
}
