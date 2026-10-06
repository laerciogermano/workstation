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

/**
 * Compacta extract para o prompt: text → { type, text, x, y }; icon → { type, x, y }.
 * @param {Array<{ text?: string, type?: string, x?: number, y?: number }>} ocr
 */
export function compactOcr(ocr) {
  return (ocr || []).map((e) => {
    if (e?.type === "icon") {
      return { type: "icon", x: Number(e?.x), y: Number(e?.y) };
    }
    return {
      type: "text",
      text: String(e?.text ?? ""),
      x: Number(e?.x),
      y: Number(e?.y),
    };
  });
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

export function buildSystemPrompt() {
  return `Você opera um smartphone Android olhando só a lista extract da tela (text + icon, x,y na escala do device).

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

Regras (só SO/launcher e o contrato de ação; nomes de app, botões e done vêm do roteiro do usuário):
- Coords de tap = mesma escala da lista (device). Não invente scale. Tap só em x,y de um item existente (type text ou type icon); NUNCA 0,0. icon não tem text — tap no centro do visual (avatar, nav, glyph).
- scroll: direction down|up|left|right quando o próximo alvo do roteiro não está visível.
- Se o histórico mostrar vários scrolls com o mesmo OCR (tela não mudou), NÃO scroll de novo: mude de estratégia (tap em outro elemento, type, key BACK).
- Painel de notificações / overlay de setup do sistema (ex. Notifications, Clear all, AndroidSetup) SEM UI do app (abas, busca, conteúdo do roteiro) → KEYCODE_BACK. NÃO scroll.
- UI do app visível (barra de abas, campo de busca, textos do roteiro) → o app está aberto. Ignore tokens de overlay de sistema misturados. PROIBIDO KEYCODE_HOME.
- Tela de carregamento (logo / poucos tokens, sem lista de apps) → sleep. PROIBIDO scroll (abre a gaveta por cima) e HOME.
- Launcher: OCR só hora/data, sem nomes de apps e sem UI do app, e o histórico NÃO tem tap recente em campo no topo (y baixo) → scroll down abre a gaveta. scroll up reabre o shade — evite.
- Histórico com tap em y baixo (campo no topo) + OCR só hora/data = teclado cobrindo o app, NÃO é launcher. PROIBIDO scroll (swipe injeta lixo no campo). type do texto do roteiro ou KEYCODE_BACK 1× — sem loop de BACK.
- Alvos, filtros e CTAs: só o que o roteiro pedir e que existir na lista (texto OCR ou ícone). Sem o alvo → scroll ou sleep; não chute coords. Não repita tap nas mesmas coords se a tela não mudou.
- type: digite text de uma vez (campo acao.text obrigatório). Se o histórico mostrar erro de tecla OCR, sleep e tente type de novo, ou KEYCODE_BACK e reabra o campo.
- key: KEYCODE_BACK / KEYCODE_HOME. sleep: ms se loading. done / fail conforme o roteiro.
- Não peça screenshot; decida só com a lista extract (text+icon) e o prompt do usuário.`;
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

Regras (só SO/launcher e o contrato de ação; nomes de app, botões e done vêm do roteiro do usuário):
- Coords de tap/elementos = escala DESTA imagem (${w}×${h}). Centro do alvo. Não invente scale nem peça outra screenshot. NUNCA tap 0,0.
- scroll: direction down|up|left|right quando o alvo do roteiro não está visível.
- Se vários scrolls e a tela parece igual, mude de estratégia (outro tap, type, KEYCODE_BACK).
- Painel de notificações / overlay de setup SEM UI do app → KEYCODE_BACK (não scroll). UI do app visível → não HOME.
- Carregamento (logo / tela quase vazia) → sleep; não scroll nem HOME.
- Launcher (só hora/data, sem apps) → scroll down (gaveta). Após tap em campo no topo + teclado: PROIBIDO scroll — type do roteiro ou BACK 1×.
- Alvos só os do roteiro, visíveis. Sem o alvo → scroll/sleep; não chute coords.
- type: acao.text obrigatório. key: KEYCODE_BACK/HOME. sleep: ms se loading. done / fail conforme o roteiro.
- Histórico traz ações já executadas (coords já em device); use só como contexto.`;
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
  if (sense === "vision" && parsed.acao.type === "tap") {
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
