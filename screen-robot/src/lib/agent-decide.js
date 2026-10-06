/**
 * EP-07 / US-24 — decide próxima ação a partir de prompt + OCR ou imagem (vision).
 */
import {
  generateContent as generateGemini,
  DEFAULT_MODEL as DEFAULT_GEMINI_MODEL,
} from "./gemini.js";
import {
  generateContent as generateOpenAI,
  DEFAULT_MODEL as DEFAULT_OPENAI_MODEL,
} from "./openai.js";
import { scalePointToDevice } from "./vision-frame.js";
import {
  providerForModel,
  resolveFallbackLadder,
} from "./agent-models.js";

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

function hasApiKey(provider, cfg) {
  if (cfg?.apiKey) return true;
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.GEMINI_API_KEY);
}

function normElementKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

/**
 * Compacta extract para o prompt: type + text + x,y (sem id — IA devolve x,y no tap).
 * @param {Array<{ text?: string, type?: string, x?: number, y?: number }>} ocr
 */
export function compactOcr(ocr) {
  return (ocr || []).map((e) => {
    const x = Number(e?.x);
    const y = Number(e?.y);
    if (e?.type === "icon") {
      return { type: "icon", x, y };
    }
    return {
      type: "text",
      text: String(e?.text ?? ""),
      x,
      y,
    };
  });
}

/**
 * Encontra o item do extract a partir de acao.element (id `eN`, índice ou text).
 * @returns {{ id: string, index: number, x: number, y: number, text?: string, type?: string } | null}
 */
export function resolveTapElement(ocr, element) {
  const key = String(element ?? "").trim();
  if (!key) return null;
  const list = Array.isArray(ocr) ? ocr : [];

  let idx = -1;
  const idm = /^e(\d+)$/i.exec(key);
  if (idm) idx = Number(idm[1]);
  else if (/^\d+$/.test(key)) idx = Number(key);

  const asHit = (e, i) => {
    if (!e) return null;
    const x = Number(e.x);
    const y = Number(e.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { ...e, id: `e${i}`, index: i, x, y };
  };

  if (idx >= 0 && idx < list.length) return asHit(list[idx], idx);

  const n = normElementKey(key);
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (e?.type === "icon") continue;
    if (normElementKey(e?.text) === n) {
      const hit = asHit(e, i);
      if (hit) return hit;
    }
  }
  return null;
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
    element: acao.element == null ? null : String(acao.element),
    x: acao.x == null ? null : Number(acao.x),
    y: acao.y == null ? null : Number(acao.y),
    direction: acao.direction == null ? null : String(acao.direction),
    text: acao.text == null ? null : String(acao.text),
    code: acao.code == null ? null : String(acao.code),
    ms: acao.ms == null ? null : Number(acao.ms),
    motivo: acao.motivo == null ? "" : String(acao.motivo),
  };
  if (type === "tap") {
    const hasXy = Number.isFinite(out.x) && Number.isFinite(out.y);
    if (!hasXy) {
      fail("AGENT_BAD_ACTION", "tap exige x,y numéricos (decididos pela IA a partir do extract)");
    }
    // OCR/visão: resposta de tap é só x,y — não usar id/element da IA.
    out.element = null;
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

export function buildSystemPrompt() {
  return `Você opera um smartphone Android olhando só a lista extract da tela (type, text, x, y). Sem id.

Responda APENAS JSON válido (sem markdown) no formato:
{
  "resumo": "2-4 frases do que tem na tela",
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

Regras de tap (OCR):
- tap: acao.x e acao.y = as coords que VOCÊ escolhe para clicar (use os x,y do extract ATUAL como referência; pode ser o centro do item alvo).
- NÃO use estritamente coords do roteiro/prompt/histórico: x,y de passos antigos ou exemplos do texto NÃO são válidos. Só o extract desta tela.
- PROIBIDO mandar id / element / e0 / e1. Só x,y.
- Sem alvo claro no extract → não tap.`;
}

/**
 * System prompt modo visão (imagem anexada; coords na escala da imagem).
 * @param {{ width: number, height: number }} size
 */
export function buildSystemPromptVision(size) {
  const w = size?.width || 540;
  const h = size?.height || 960;
  return `Você opera um smartphone Android olhando a captura de tela anexada (imagem ${w}×${h} px). Sem OCR.

Responda APENAS JSON válido (sem markdown) no formato:
{
  "resumo": "2-4 frases do que tem na tela",
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

Regras de tap (visão): acao.x e acao.y na escala DESTA imagem. NÃO copie coords do roteiro/prompt/histórico. PROIBIDO id/element.`;
}

/**
 * @param {"ocr"|"vision"|string|undefined} sense
 */
export function resolveSense(cfg) {
  const raw = String(
    cfg?.sense || process.env.AGENT_SENSE || "ocr",
  )
    .trim()
    .toLowerCase();
  if (raw === "vision" || raw === "image" || raw === "screenshot") {
    return "vision";
  }
  return "ocr";
}

const MAX_PROMPT_CHARS = Number(process.env.GEMINI_MAX_PROMPT_CHARS || 6000);
/** Janela de passos recentes no prompt (antes: 8 fixo). Env: AGENT_HISTORY_STEPS. */
export const DEFAULT_HISTORY_STEPS = 12;

/**
 * Resolve N da janela de histórico (≥0; 0 = sem histórico no prompt). cfg > env > default.
 * @param {{ historySteps?: number } | null | undefined} [cfg]
 */
export function resolveHistorySteps(cfg) {
  const raw =
    cfg?.historySteps ??
    process.env.AGENT_HISTORY_STEPS ??
    DEFAULT_HISTORY_STEPS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_HISTORY_STEPS;
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

export function historyWindow(cfg) {
  const n = resolveHistorySteps(cfg);
  const history = cfg.history;
  if (!(n > 0 && Array.isArray(history) && history.length)) {
    return { n, window: [], historyCount: 0, historySteps: n };
  }
  const window = history.slice(-n);
  return { n, window, historyCount: window.length, historySteps: n };
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
  const { prompt, ocr } = cfg;
  const { n, window } = historyWindow(cfg);
  const slim = window.map((h) => {
    if (!h || typeof h !== "object") return h;
    const { x: _x, y: _y, ...rest } = h;
    return rest;
  });
  const hist = slim.length
    ? `\nHistórico recente (últimos ${slim.length}/${n}):\n${JSON.stringify(slim, null, 0)}\n`
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
 *   history?: object[],
 *   historySteps?: number,
 *   imageMeta?: { width?: number, height?: number, scaleToDevice?: number },
 * }} cfg
 */
export function buildUserPromptVision(cfg) {
  const { prompt, imageMeta } = cfg;
  const { n, window } = historyWindow(cfg);
  // histórico vision: sem ocr[] (pesado / irrelevante)
  const slim = window.map((h) => {
    if (!h || typeof h !== "object") return h;
    const { ocr: _o, ...rest } = h;
    return rest;
  });
  const hist = slim.length
    ? `\nHistórico recente (últimos ${slim.length}/${n}):\n${JSON.stringify(slim, null, 0)}\n`
    : "";
  const w = imageMeta?.width ?? "?";
  const h = imageMeta?.height ?? "?";
  return `Objetivo / roteiro:
${clipPrompt(prompt)}
${hist}
Imagem anexada: captura da tela ${w}×${h} px (WebP). Use só ela + o roteiro.
Defina a próxima ação (coords na escala da imagem).`;
}

/**
 * @param {{
 *   prompt: string,
 *   ocr?: Array<{ text?: string, x?: number, y?: number }>,
 *   sense?: "ocr"|"vision",
 *   image?: { mimeType?: string, data?: string, base64?: string },
 *   imageMeta?: { width?: number, height?: number, scaleToDevice?: number },
 *   history?: object[],
 *   historySteps?: number,
   *   model?: string,
   *   provider?: string,
   *   fallbackModels?: string[]|string,
   *   noFallback?: boolean,
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
  const sense = resolveSense(cfg);
  if (sense === "ocr" && !Array.isArray(cfg.ocr)) {
    fail("AGENT_NO_OCR", "decide: falta ocr[]");
  }
  if (sense === "vision") {
    const data = cfg.image?.data || cfg.image?.base64;
    if (!data) fail("AGENT_NO_IMAGE", "decide vision: falta image.data");
    if (!cfg.imageMeta?.scaleToDevice) {
      fail("AGENT_NO_SCALE", "decide vision: falta imageMeta.scaleToDevice");
    }
  }

  const logFn = deps.log ?? log;
  const provider = resolveProvider(cfg);
  const model = resolveDecideModel(cfg);
  const historySteps = resolveHistorySteps(cfg);
  const chain = resolveFallbackLadder(model, {
    fallbackModels: cfg.fallbackModels,
    noFallback: cfg.noFallback,
  });
  logFn(
    `início sense=${sense} provider=${provider} model=${model}` +
      ` cadeia=${chain.join(" → ")}` +
      (sense === "ocr"
        ? ` ocrHits=${(cfg.ocr || []).length}`
        : ` image=${cfg.imageMeta?.width}x${cfg.imageMeta?.height} scale=${cfg.imageMeta?.scaleToDevice}`) +
      ` history=${(cfg.history || []).length} historySteps=${historySteps}`,
  );

  const system =
    sense === "vision"
      ? buildSystemPromptVision({
          width: cfg.imageMeta.width,
          height: cfg.imageMeta.height,
        })
      : buildSystemPrompt();
  const prompt =
    sense === "vision"
      ? buildUserPromptVision({ ...cfg, historySteps })
      : buildUserPrompt({ ...cfg, historySteps });
  const images =
    sense === "vision"
      ? [
          {
            mimeType: cfg.image.mimeType || "image/webp",
            data: cfg.image.data || cfg.image.base64,
          },
        ]
      : undefined;

  let text;
  let usage;
  let usedModel = model;
  let usedProvider = provider;
  /** @type {object[]} */
  const requests = [];
  /** @type {Error|null} */
  let lastErr = null;

  for (let i = 0; i < chain.length; i++) {
    const stepModel = chain[i];
    const stepProvider = providerForModel(stepModel);
    const gen =
      deps.generateContent ??
      (stepProvider === "openai" ? generateOpenAI : generateGemini);
    if (!deps.generateContent && !hasApiKey(stepProvider, cfg)) {
      logFn(`pula ${stepModel}: sem API key (${stepProvider})`);
      continue;
    }
    try {
      const out = await gen(
        {
          model: stepModel,
          apiKey: cfg.apiKey,
          json: true,
          thinkingLevel: cfg.thinkingLevel || "low",
          fallbackModels: [],
          chainRounds: 1,
          retries: 0,
          system,
          prompt,
          images,
        },
        deps,
      );
      text = out.text;
      usage = out.usage;
      usedModel = out.model || stepModel;
      usedProvider = providerForModel(usedModel);
      if (Array.isArray(out.requests)) requests.push(...out.requests);
      if (i > 0) {
        logFn(`ok fallback model=${usedModel} provider=${usedProvider}`);
      }
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      if (Array.isArray(e.requests)) requests.push(...e.requests);
      const next = chain[i + 1];
      logFn(
        `erro ${stepProvider}/${stepModel}: ${e.code || ""} ${e.message}` +
          (next ? ` — fallback → ${next}` : ""),
      );
    }
  }

  if (!text) {
    if (lastErr) {
      lastErr.requests = requests;
      throw lastErr;
    }
    fail(
      "AGENT_NO_MODEL",
      `nenhum modelo da cadeia disponível (${chain.join(", ")})`,
    );
  }

  const parsed = parseActionPayload(text);
  if (sense === "ocr" && parsed.acao.type === "tap") {
    // OCR: IA copia x,y do extract; não recalcular no runtime.
    if (!Number.isFinite(parsed.acao.x) || !Number.isFinite(parsed.acao.y)) {
      fail(
        "AGENT_BAD_ACTION",
        "tap OCR exige x,y copiados do extract",
      );
    }
  }
  if (sense === "vision" && parsed.acao.type === "tap") {
    if (!Number.isFinite(parsed.acao.x) || !Number.isFinite(parsed.acao.y)) {
      fail("AGENT_BAD_ACTION", "tap vision exige x,y numéricos");
    }
    const scaled = scalePointToDevice(
      { x: parsed.acao.x, y: parsed.acao.y },
      cfg.imageMeta.scaleToDevice,
    );
    logFn(
      `scale tap ${parsed.acao.x},${parsed.acao.y} ×${cfg.imageMeta.scaleToDevice} → ${scaled.x},${scaled.y}`,
    );
    parsed.acao.x = scaled.x;
    parsed.acao.y = scaled.y;
    if (Array.isArray(parsed.elementos)) {
      parsed.elementos = parsed.elementos.map((el) => {
        if (!el || typeof el !== "object") return el;
        const p = scalePointToDevice(
          { x: el.x, y: el.y },
          cfg.imageMeta.scaleToDevice,
        );
        return { ...el, x: p.x, y: p.y };
      });
    }
  }
  logFn(
    `ação=${parsed.acao.type}` +
      (parsed.acao.element ? ` element=${parsed.acao.element}` : "") +
      (parsed.acao.x != null ? ` @${parsed.acao.x},${parsed.acao.y}` : "") +
      (parsed.acao.direction ? ` dir=${parsed.acao.direction}` : "") +
      (parsed.acao.motivo ? ` — ${parsed.acao.motivo}` : ""),
  );
  const hist = historyWindow({ ...cfg, historySteps });
  return {
    ...parsed,
    usage,
    model: usedModel,
    provider: usedProvider,
    requests,
    sense,
    historyCount: hist.historyCount,
    historySteps: hist.historySteps,
  };
}

export {
  ACTION_TYPES,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  resolveFallbackLadder,
};
