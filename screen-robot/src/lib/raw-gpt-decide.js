/**
 * Decisão crua via chat.completions (mesmo contrato do scripts/raw-gpt.js).
 * System/user vão à API como JSON (seções = chaves do objeto).
 * Retorno: action só com chaves presentes na resposta da IA.
 */

import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";

/** Regras system padrão (entrada de decideFromImage / decideRawAction). */
export const DEFAULT_SYSTEM = {
  papel:
    "IA agente autônoma que controla um smartphone Android via lib screen-robot",
  recebe: ["jornada", "ocr", "step"],
  resposta: {
    raizObrigatoria: { action: {}, proximoPasso: "…" },
    formato: {
      action: {
        type: "tap|scroll|type|key|sleep|done|fail",
        x: null,
        y: null,
        direction: null,
        text: null,
        code: null,
        ms: null,
      },
      motivo: null,
      proximoPasso: null,
    },
    soJson: true,
    omitirNull: true,
    proibidoActionNaRaiz: true,
    proximoPassoNuncaVazio: true,
  },
  tipos: {
    tap: "obrigatório x e y numéricos do OCR desta tela (centro do alvo)",
    scroll: "direction up|down|left|right (obrigatório; x/y omitidos)",
    type: "text a digitar",
    key: "code (ex. KEYCODE_BACK, KEYCODE_ENTER)",
    sleep: "ms",
    done: "jornada concluída",
    fail: "só se impossível seguir",
  },
  step: {
    tipo: "texto livre (mesmo de proximoPasso)",
    exemplos: ["3", "connect", "digite comprador", "14", "done"],
    proximoPassoViraStepDoProximoTurno: true,
    seCumpriuAvance: true,
    seSleepScrollRetryMesmoTexto: true,
    proibidoInventarPassoForaDaJornada: true,
    aposUltimoPasso: "proximoPasso = \"14\" ou \"done\" (nunca \"\")",
  },
  regras: [
    "voce esta no passo … = execute SOMENTE esse passo; PROIBIDO refazer passos já cumpridos",
    "proximoPasso do turno N = step do turno N+1 (copiar o valor); se cumpriu → avance; sleep/scroll/retry → mesmo texto",
    "proximoPasso OBRIGATÓRIO e não vazio; PROIBIDO \"\" / null",
    "tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords",
    "Cada item do OCR (text/icon) é clicável",
    "Sem alvo do passo → sleep ou scroll; evite fail",
    "Um único objeto JSON na resposta: { action, proximoPasso }",
  ],
};

/** Regras user padrão (seção `regras` do input user). */
export const DEFAULT_USER_REGRAS = [
  "Defina a próxima action com base no OCR e na jornada",
  "Em cada ação, diga no motivo qual passo (1–13) está em curso",
  "Ordem obrigatória 1→X (X=ultimo passo). Uma ação por turno",
  "Após cumprir o último passo, proximoPasso = \"14\" ou \"done\" (nunca string vazia)",
  "Toque só em textos ou ícones que estão na tela agora",
  "PROIBIDO fail se o texto do passo atual estiver na tela",
  "fail só se for impossível após tentar de novo; falhas antigas NÃO impedem um novo toque",
];

/**
 * Monta o objeto user enviado à IA (seções = chaves).
 * @param {{
 *   jornada?: string,
 *   prompt?: string,
 *   ocr?: unknown,
 *   step?: string|null,
 *   regras?: string[],
 *   [key: string]: unknown,
 * }} opts
 */
export function buildUserInput(opts = {}) {
  const list = Array.isArray(opts.ocr) ? opts.ocr : [];
  const connectOrder = list
    .map((h, i) =>
      h && typeof h === "object" && String(h.text || "") === "Connect"
        ? { i, x: h.x, y: h.y }
        : null,
    )
    .filter(Boolean);

  const stepText =
    opts.step == null || opts.step === ""
      ? undefined
      : String(opts.step).trim() || undefined;

  const {
    jornada: _j,
    prompt: _p,
    ocr: _o,
    step: _s,
    regras: _r,
    connectOrder: _c,
    ...extra
  } = opts;

  /** @type {Record<string, unknown>} */
  const user = {
    jornada: opts.jornada ?? opts.prompt ?? "",
    ocr: opts.ocr ?? [],
    regras: opts.regras ?? DEFAULT_USER_REGRAS,
    ...extra,
  };
  if (stepText) {
    user.step = stepText;
    user.instrucaoStep = `voce esta no passo ${stepText}. Execute APENAS esse passo. PROIBIDO voltar a passos anteriores (ex. no 2 NÃO tap Search; faça type).`;
  }
  if (connectOrder.length >= 1) {
    user.connectOrder = connectOrder;
    user.instrucaoConnect = `Botões Connect de cima para baixo. No passo 11 toque SOMENTE no primeiro: ${JSON.stringify(connectOrder[0])}`;
  }
  return user;
}

/** @deprecated use buildUserInput + JSON.stringify; mantido para callers antigos */
export function buildUserText(prompt, ocr, step) {
  return JSON.stringify(buildUserInput({ prompt, ocr, step }));
}

/** @deprecated use DEFAULT_SYSTEM + JSON.stringify */
export const SYSTEM_PROMPT = JSON.stringify(DEFAULT_SYSTEM);

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
  const type = String(a.type || "").toLowerCase();
  if (!type) {
    const err = new Error("raw-gpt: action.type vazio");
    err.code = "RAW_GPT_BAD_ACTION";
    throw err;
  }
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

/**
 * @param {{
 *   system?: object,
 *   user?: object,
 *   prompt?: string,
 *   jornada?: string,
 *   ocr?: unknown,
 *   step?: string|null,
 *   apiKey?: string,
 *   model?: string,
 * }} opts
 */
export async function decideRawAction(opts) {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("falta OPENAI_API_KEY");
    err.code = "OPENAI_NO_API_KEY";
    throw err;
  }
  const system = opts.system ?? DEFAULT_SYSTEM;
  if (!system || typeof system !== "object") {
    const err = new Error("falta system (objeto JSON)");
    err.code = "RAW_GPT_NO_SYSTEM";
    throw err;
  }

  const user = buildUserInput({
    ...(opts.user && typeof opts.user === "object" ? opts.user : {}),
    jornada:
      opts.user?.jornada ??
      opts.user?.prompt ??
      opts.jornada ??
      opts.prompt,
    ocr: opts.ocr ?? opts.user?.ocr,
    step: opts.step ?? opts.user?.step,
  });
  if (!String(user.jornada || "").trim()) {
    const err = new Error("falta user.jornada / prompt");
    err.code = "RAW_GPT_NO_PROMPT";
    throw err;
  }

  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JSON.stringify(system) },
      { role: "user", content: JSON.stringify(user) },
    ],
  };
  // gpt-5* só aceita temperature default; 0 → HTTP 400.
  if (!/^gpt-5/i.test(model)) payload.temperature = 0;

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
  return { ...parseActionTypeXY(raw), raw, payload, system, user };
}

/**
 * extractFromImage → compactOcr → decideRawAction.
 * Entrada: system/user como objetos JSON (seções = chaves); OCR preenchido aqui.
 * @param {{
 *   imagePath: string,
 *   system?: object,
 *   user?: object,
 *   prompt?: string,
 *   jornada?: string,
 *   step?: string|null,
 *   apiKey?: string,
 *   model?: string,
 *   engine?: string,
 *   timeoutMs?: number,
 * }} opts
 * @returns {Promise<{
 *   action: { type: string, x?: number, y?: number, direction?: string, text?: string, code?: string, ms?: number },
 *   proximoPasso?: string,
 *   ocr: object[],
 *   elements: object[],
 *   raw?: string,
 *   payload?: object,
 *   system?: object,
 *   user?: object,
 * }>}
 */
export async function decideFromImage(opts) {
  const imagePath = opts.imagePath;
  if (!imagePath) {
    const err = new Error("falta imagePath");
    err.code = "RAW_GPT_NO_IMAGE";
    throw err;
  }
  const system = opts.system ?? DEFAULT_SYSTEM;
  if (!system || typeof system !== "object") {
    const err = new Error("falta system (objeto JSON)");
    err.code = "RAW_GPT_NO_SYSTEM";
    throw err;
  }
  const engine = opts.engine || process.env.SCREEN_ROBOT_OCR || "all";
  const timeoutMs =
    opts.timeoutMs ?? Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000);
  const elements = await extractFromImage(imagePath, { engine, timeoutMs });
  const ocr = compactOcr(elements);
  const out = await decideRawAction({
    system,
    user: opts.user,
    prompt: opts.prompt,
    jornada: opts.jornada,
    ocr,
    step: opts.step,
    apiKey: opts.apiKey,
    model: opts.model,
  });
  const { raw, payload, proximoPasso, system: sys, user, ...action } = out;
  return {
    action,
    proximoPasso,
    ocr,
    elements,
    raw,
    payload,
    system: sys,
    user,
  };
}
