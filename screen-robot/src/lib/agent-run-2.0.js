/**
 * runAgent 2.0 — loop mínimo: extract → provider → operate.
 * Sem agent-decide. Rollback: agent-run.js → agent-run-v1.js.
 */
import { extract } from "./extract.js";
import {
  generateContent as generateGemini,
  DEFAULT_MODEL as DEFAULT_GEMINI_MODEL,
} from "./gemini.js";
import {
  generateContent as generateOpenAI,
  DEFAULT_MODEL as DEFAULT_OPENAI_MODEL,
} from "./openai.js";
import { tapElement, scroll, type, typeViaAdb, key } from "./operate.js";
import { sleep as defaultSleep } from "./adb.js";

const ACTIONS = new Set([
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

function log(...args) {
  console.log(`[agent2 ${new Date().toISOString()}]`, ...args);
}

function resolveProvider(cfg) {
  const p = String(cfg?.provider || process.env.AGENT_PROVIDER || "")
    .trim()
    .toLowerCase();
  if (p === "openai" || p === "gpt") return "openai";
  if (p === "gemini" || p === "google") return "gemini";
  const model = String(cfg?.model || process.env.OPENAI_MODEL || "");
  if (/^gpt-/i.test(model)) return "openai";
  return "gemini";
}

function resolveModel(cfg) {
  if (cfg?.model) return cfg.model;
  return resolveProvider(cfg) === "openai"
    ? process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
    : process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

/** JSON da IA → { acao, resumo } */
function parseAcao(raw) {
  let data = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    data = JSON.parse(fence ? fence[1].trim() : t);
  }
  const a = data?.acao;
  if (!a || typeof a !== "object") fail("AGENT_BAD_ACTION", "falta acao");
  const type = String(a.type || "").toLowerCase();
  if (!ACTIONS.has(type)) fail("AGENT_BAD_ACTION", `type inválido: ${a.type}`);
  const acao = {
    type,
    x: a.x == null ? null : Number(a.x),
    y: a.y == null ? null : Number(a.y),
    direction: a.direction == null ? null : String(a.direction),
    text: a.text == null ? null : String(a.text),
    code: a.code == null ? null : String(a.code),
    ms: a.ms == null ? null : Number(a.ms),
    motivo: a.motivo == null ? "" : String(a.motivo),
  };
  if (type === "tap" && !(Number.isFinite(acao.x) && Number.isFinite(acao.y))) {
    fail("AGENT_BAD_ACTION", "tap exige x,y");
  }
  if (type === "type" && !acao.text) fail("AGENT_BAD_ACTION", "type exige text");
  if (type === "key" && !acao.code) fail("AGENT_BAD_ACTION", "key exige code");
  return {
    resumo: data.resumo == null ? "" : String(data.resumo),
    acao,
  };
}

/**
 * Envia roteiro + OCR ao provider; devolve ação parseada.
 * @param {{ prompt: string, ocr: object[], model?: string, provider?: string, apiKey?: string }} cfg
 */
export async function askProvider(cfg, deps = {}) {
  const provider = resolveProvider(cfg);
  const model = resolveModel(cfg);
  const gen =
    deps.generateContent ??
    (provider === "openai" ? generateOpenAI : generateGemini);
  const ocr = (cfg.ocr || []).map((e) =>
    e?.type === "icon"
      ? { type: "icon", x: Number(e.x), y: Number(e.y) }
      : { type: "text", text: String(e?.text ?? ""), x: Number(e?.x), y: Number(e?.y) },
  );
  const system = `Você opera Android só com a lista OCR (text,x,y). Responda APENAS JSON:
{"resumo":"...","acao":{"type":"tap|scroll|type|key|sleep|done|fail","x":null,"y":null,"direction":null,"text":null,"code":null,"ms":null,"motivo":"..."}}
tap: copie x,y do OCR. 1 ação por turno.`;
  const prompt = `Roteiro:\n${cfg.prompt}\n\nOCR:\n${JSON.stringify(ocr)}\n\nPróxima ação.`;

  log(`provider ${provider}/${model}…`);
  const out = await gen(
    {
      model,
      apiKey: cfg.apiKey,
      json: true,
      thinkingLevel: "low",
      fallbackModels: [],
      chainRounds: 1,
      retries: 0,
      system,
      prompt,
    },
    deps,
  );
  return parseAcao(out.text);
}

/** @param {{ serial: string, acao: object, engine?: string, typeMethod?: string }} cfg */
export async function executeAction(cfg, deps = {}) {
  const serial = cfg.serial;
  const a = cfg.acao;
  const sleep = deps.sleep ?? defaultSleep;
  const doTap = deps.tapElement ?? tapElement;
  const doScroll = deps.scroll ?? scroll;
  const doType = deps.type ?? type;
  const doKey = deps.key ?? key;
  const typeMethod = String(
    cfg.typeMethod ?? process.env.AGENT_TYPE_METHOD ?? "adb",
  ).toLowerCase();

  switch (a.type) {
    case "tap":
      doTap({ serial, x: a.x, y: a.y }, deps);
      return `tap ${a.x},${a.y}`;
    case "scroll":
      doScroll(
        { serial, direction: a.direction || "down", distance: a.distance },
        deps,
      );
      return `scroll ${a.direction || "down"}`;
    case "type": {
      if (typeMethod !== "ocr") {
        (deps.typeViaAdb ?? typeViaAdb)(serial, a.text, deps);
        return `type-adb ${JSON.stringify(a.text)}`;
      }
      await doType(
        { serial, text: a.text, method: "ocr", engine: cfg.engine },
        deps,
      );
      return `type ${JSON.stringify(a.text)}`;
    }
    case "key":
      doKey({ serial, code: a.code }, deps);
      return `key ${a.code}`;
    case "sleep": {
      const ms = Number(a.ms ?? 1000);
      await sleep(ms);
      return `sleep ${ms}ms`;
    }
    case "done":
    case "fail":
      return a.type;
    default:
      fail("AGENT_BAD_ACTION", `execute: type ${a.type}`);
  }
}

/**
 * @param {{
 *   serial: string,
 *   prompt: string,
 *   maxSteps?: number,
 *   engine?: string,
 *   icons?: boolean,
 *   model?: string,
 *   provider?: string,
 *   apiKey?: string,
 *   typeMethod?: string,
 * }} cfg
 */
export async function runAgent(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) fail("AGENT_NO_SERIAL", "runAgent: falta serial");
  if (!cfg?.prompt) fail("AGENT_NO_PROMPT", "runAgent: falta prompt");

  const maxSteps = Number(cfg.maxSteps ?? 40);
  const engine = cfg.engine || process.env.SCREEN_ROBOT_OCR || "all";
  const icons = cfg.icons;
  const runExtract = deps.extract ?? extract;
  const ask = deps.askProvider ?? askProvider;
  const provider = resolveProvider(cfg);
  const model = resolveModel(cfg);
  const steps = [];
  let status = "running";

  log(
    `2.0 serial=${serial} engine=${engine} provider=${provider} model=${model} maxSteps=${maxSteps}`,
  );

  for (let i = 1; i <= maxSteps; i++) {
    log(`── ${i}/${maxSteps} extract ──`);
    const ocr = await runExtract({ serial, engine, icons }, deps);

    const { acao, resumo } = await ask(
      {
        prompt: cfg.prompt,
        ocr,
        model: cfg.model,
        provider: cfg.provider,
        apiKey: cfg.apiKey,
      },
      deps,
    );

    log(
      `${acao.type}` +
        (acao.x != null ? ` @${acao.x},${acao.y}` : "") +
        (acao.text ? ` ${JSON.stringify(acao.text)}` : "") +
        (acao.direction ? ` ${acao.direction}` : "") +
        (acao.motivo ? ` — ${acao.motivo}` : ""),
    );
    if (resumo) log(resumo.slice(0, 200));

    const resultado = await executeAction(
      { serial, acao, engine, typeMethod: cfg.typeMethod },
      deps,
    );
    steps.push({ step: i, acao, resultado });
    log(`ok ${resultado}`);

    if (acao.type === "done") {
      status = "done";
      break;
    }
    if (acao.type === "fail") {
      status = "fail";
      break;
    }
  }

  if (status === "running") status = "max_steps";
  log(`fim status=${status} steps=${steps.length}`);
  return { status, steps };
}
