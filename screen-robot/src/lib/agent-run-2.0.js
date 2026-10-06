/**
 * runAgent 2.0 — loop mínimo: extract → decide (provider) → operate.
 * Temporário no lugar do v1 (`agent-run-v1.js`). Rollback: agent-run.js → v1.
 */
import { extract } from "./extract.js";
import { decide, resolveDecideModel, resolveProvider } from "./agent-decide.js";
import { DEFAULT_MODEL as DEFAULT_GEMINI_MODEL } from "./gemini.js";
import { tapElement, scroll, type, typeViaAdb, key } from "./operate.js";
import { sleep as defaultSleep } from "./adb.js";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

function log(...args) {
  console.log(`[agent2 ${new Date().toISOString()}]`, ...args);
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
        const inject = deps.typeViaAdb ?? typeViaAdb;
        inject(serial, a.text, deps);
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
 *   noFallback?: boolean,
 *   fallbackModels?: string[]|string,
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
  const runDecide = deps.decide ?? decide;
  const provider = resolveProvider(cfg);
  const model = resolveDecideModel(cfg) || DEFAULT_GEMINI_MODEL;
  const steps = [];
  let status = "running";

  log(
    `2.0 serial=${serial} engine=${engine} provider=${provider} model=${model} maxSteps=${maxSteps}`,
  );

  for (let i = 1; i <= maxSteps; i++) {
    log(`── ${i}/${maxSteps} extract ──`);
    const ocr = await runExtract({ serial, engine, icons }, deps);

    log(`decide…`);
    const { acao, resumo } = await runDecide(
      {
        prompt: cfg.prompt,
        sense: "ocr",
        ocr,
        history: [],
        historySteps: 0,
        model: cfg.model,
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        noFallback: cfg.noFallback,
        fallbackModels: cfg.fallbackModels,
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
      {
        serial,
        acao,
        engine,
        typeMethod: cfg.typeMethod,
      },
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
