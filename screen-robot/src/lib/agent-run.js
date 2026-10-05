/**
 * EP-07 / US-25 — loop extract → decide → operate → log.
 */
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { extract } from "./extract.js";
import { decide } from "./agent-decide.js";
import { DEFAULT_MODEL } from "./gemini.js";
import { tapElement, scroll, type, key } from "./operate.js";
import { adb, sleep as defaultSleep } from "./adb.js";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function looksLoading(ocr) {
  const t = (ocr || [])
    .map((e) => String(e.text || "").toLowerCase())
    .join(" ");
  return /\b(loading|carregando|please wait|aguarde)\b/.test(t);
}

function log(...args) {
  console.log(`[agent ${new Date().toISOString()}]`, ...args);
}

function dumpOcrStdout(ocr) {
  log(`OCR ${ocr?.length ?? 0} hits:`);
  for (const e of ocr || []) {
    console.log(`  ${e.text}@${e.x},${e.y}`);
  }
}

/**
 * @param {{ serial: string, acao: object, engine?: string }} cfg
 * @param {object} deps
 */
export async function executeAction(cfg, deps = {}) {
  const serial = cfg.serial;
  const a = cfg.acao;
  const sleep = deps.sleep ?? defaultSleep;
  const doTap = deps.tapElement ?? tapElement;
  const doScroll = deps.scroll ?? scroll;
  const doType = deps.type ?? type;
  const doKey = deps.key ?? key;

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
      const payload = {
        serial,
        text: a.text,
        engine: cfg.engine,
        region: cfg.keyboardRegion,
      };
      const adbFallback =
        process.env.AGENT_TYPE_ADB_FALLBACK !== "0" &&
        cfg.adbTypeFallback !== false;
      try {
        await doType(payload, deps);
      } catch {
        await sleep(1200);
        try {
          await doType(payload, deps);
        } catch (e2) {
          if (!adbFallback) throw e2;
          const runAdb = deps.adb ?? adb;
          log(`type OCR falhou (${e2.message}) — limpa campo e fallback adb input text`);
          runAdb(serial, ["shell", "input", "keyevent", "KEYCODE_MOVE_END"]);
          for (let i = 0; i < 40; i++) {
            runAdb(serial, ["shell", "input", "keyevent", "KEYCODE_DEL"]);
          }
          const escaped = String(a.text).replace(/ /g, "%s");
          runAdb(serial, ["shell", "input", "text", escaped]);
          return `type-adb ${JSON.stringify(a.text)}`;
        }
      }
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

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sumUsage(calls) {
  const totals = {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    thoughtsTokenCount: 0,
    totalTokenCount: 0,
  };
  for (const c of calls) {
    const u = c?.usage || {};
    totals.promptTokenCount += num(u.promptTokenCount);
    totals.candidatesTokenCount += num(u.candidatesTokenCount);
    totals.thoughtsTokenCount += num(u.thoughtsTokenCount);
    totals.totalTokenCount += num(u.totalTokenCount);
  }
  return totals;
}

function writeUsageFile(usagePath, payload) {
  writeFileSync(usagePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function appendStepLog(logPath, step, { resumo, acao, ocr, resultado }) {
  const block = [
    "",
    `## Passo ${step} — ${acao.type} (${new Date().toISOString()})`,
    "",
    "### Decisão",
    "",
    resumo || "(sem resumo)",
    "",
    `- ação: \`${acao.type}\` ${acao.motivo ? `— ${acao.motivo}` : ""}`,
    acao.x != null ? `- coords: ${acao.x},${acao.y}` : null,
    acao.direction ? `- direction: ${acao.direction}` : null,
    acao.text ? `- text: ${acao.text}` : null,
    acao.code ? `- code: ${acao.code}` : null,
    "",
    "### OCR usado na decisão",
    "",
    "```json",
    JSON.stringify(ocr, null, 2),
    "```",
    "",
    "### Resultado",
    "",
    resultado || "",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
  appendFileSync(logPath, block, "utf8");
}

/**
 * @param {{
 *   serial: string,
 *   prompt: string,
 *   maxSteps?: number,
 *   engine?: string,
 *   logDir?: string,
 *   usageDir?: string,
 *   keyboardRegion?: object,
 *   model?: string,
 *   apiKey?: string,
 * }} cfg
 * @param {object} [deps]
 */
export async function runAgent(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) fail("AGENT_NO_SERIAL", "runAgent: falta serial");
  if (!cfg?.prompt) fail("AGENT_NO_PROMPT", "runAgent: falta prompt");

  const maxSteps = Number(cfg.maxSteps ?? 40);
  const engine = cfg.engine || "rapidocr";
  const sleep = deps.sleep ?? defaultSleep;
  const runExtract = deps.extract ?? extract;
  const runDecide = deps.decide ?? decide;
  const startedAt = new Date().toISOString();
  const runStamp = stamp();
  const logDir = resolve(cfg.logDir || join(process.cwd(), "logs", "agent"));
  const usageDir = resolve(cfg.usageDir || join(process.cwd(), "usage"));
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  if (!existsSync(usageDir)) mkdirSync(usageDir, { recursive: true });
  const logPath = join(logDir, `${runStamp}.md`);
  const usagePath = join(usageDir, `${runStamp}.json`);

  const model = cfg.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  log(`início serial=${serial} engine=${engine} model=${model} maxSteps=${maxSteps}`);
  log(`log → ${logPath}`);
  log(`usage → ${usagePath}`);

  writeFileSync(
    logPath,
    [
      "# runAgent",
      "",
      `- serial: \`${serial}\``,
      `- engine: \`${engine}\``,
      `- model: \`${model}\``,
      `- maxSteps: ${maxSteps}`,
      `- started: ${new Date().toISOString()}`,
      "",
      "## Prompt",
      "",
      cfg.prompt.slice(0, 4000),
      cfg.prompt.length > 4000 ? "\n…(truncado)\n" : "",
      "",
    ].join("\n"),
    "utf8",
  );

  /** @type {object[]} */
  const history = [];
  /** @type {object[]} */
  const steps = [];
  /** @type {object[]} */
  const usageCalls = [];
  let status = "max_steps";

  const flushUsage = (extra = {}) => {
    writeUsageFile(usagePath, {
      started: startedAt,
      ended: new Date().toISOString(),
      serial,
      engine,
      model,
      maxSteps,
      prompt: cfg.prompt,
      logPath,
      status,
      calls: usageCalls,
      totals: sumUsage(usageCalls),
      ...extra,
    });
  };
  flushUsage();

  for (let i = 1; i <= maxSteps; i++) {
    log(`── passo ${i}/${maxSteps} ──`);
    log(`extract…`);
    const tExtract = Date.now();
    let ocr = await runExtract({ serial, engine }, deps);
    log(`extract ok em ${Date.now() - tExtract}ms (${ocr.length} hits)`);
    dumpOcrStdout(ocr);

    if (looksLoading(ocr)) {
      log(`tela loading — retry extract em 800ms`);
      await sleep(800);
      ocr = await runExtract({ serial, engine }, deps);
      dumpOcrStdout(ocr);
    }

    log(`decide (Gemini)…`);
    let decision;
    try {
      decision = await runDecide(
        {
          prompt: cfg.prompt,
          ocr,
          history,
          model: cfg.model,
          apiKey: cfg.apiKey,
        },
        deps,
      );
    } catch (e) {
      const resultado = `erro decide: ${e.code || ""} ${e.message || e}`;
      log(resultado);
      appendStepLog(logPath, i, {
        resumo: "(falha na decisão)",
        acao: { type: "fail", motivo: String(e.message || e) },
        ocr,
        resultado,
      });
      steps.push({ step: i, error: true, resultado });
      status = "fail";
      flushUsage();
      break;
    }

    if (decision.usage) {
      usageCalls.push({ step: i, usage: decision.usage });
      flushUsage();
    }

    const { resumo, acao } = decision;
    log(
      `decisão: ${acao.type}` +
        (acao.x != null ? ` @${acao.x},${acao.y}` : "") +
        (acao.direction ? ` ${acao.direction}` : "") +
        (acao.motivo ? ` — ${acao.motivo}` : ""),
    );
    if (resumo) log(`resumo: ${resumo.slice(0, 200)}`);

    let resultado = "";
    let stepError = false;
    try {
      log(`executar ${acao.type}…`);
      resultado = await executeAction(
        { serial, acao, engine, keyboardRegion: cfg.keyboardRegion },
        deps,
      );
      log(`resultado: ${resultado}`);
    } catch (e) {
      resultado = `erro: ${e.message || e}`;
      stepError = true;
      log(resultado);
      // type/OCR falho: não aborta o loop — Gemini tenta recuperar no próximo passo
      if (!/^OPERATE_TYPE_FAILED|tecla .+ não encontrada/i.test(String(e.code || e.message || ""))) {
        appendStepLog(logPath, i, { resumo, acao, ocr, resultado });
        steps.push({ step: i, acao, resultado, error: true });
        status = "fail";
        break;
      }
      log(`erro recuperável — continua para o próximo passo`);
    }

    appendStepLog(logPath, i, { resumo, acao, ocr, resultado });
    steps.push({ step: i, acao, resultado, error: stepError });
    history.push({
      step: i,
      type: acao.type,
      motivo: acao.motivo,
      x: acao.x,
      y: acao.y,
      error: stepError ? resultado : undefined,
    });

    if (acao.type === "done") {
      status = "done";
      log(`done — objetivo cumprido`);
      break;
    }
    if (acao.type === "fail") {
      status = "fail";
      log(`fail — ${acao.motivo || "sem motivo"}`);
      break;
    }

    await sleep(Number(cfg.stepDelayMs ?? 600));
  }

  appendFileSync(
    logPath,
    `\n---\n\n**status:** \`${status}\` · steps: ${steps.length} · ended: ${new Date().toISOString()}\n`,
    "utf8",
  );

  flushUsage();
  log(`fim status=${status} steps=${steps.length} log=${logPath} usage=${usagePath}`);
  return { status, steps, logPath, usagePath, usage: sumUsage(usageCalls) };
}
