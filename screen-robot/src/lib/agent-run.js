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
  // inclui ms para não sobrescrever 2 runs no mesmo segundo
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23);
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

function appendStepLog(logPath, step, { resumo, acao, ocr, resultado, usage }) {
  const u = usage || null;
  const usageLine = u
    ? `- usage: in=${u.promptTokenCount ?? "?"} out=${u.candidatesTokenCount ?? "?"}` +
      (u.thoughtsTokenCount ? ` thoughts=${u.thoughtsTokenCount}` : "") +
      (u.totalTokenCount != null ? ` total=${u.totalTokenCount}` : "")
    : null;
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
    usageLine,
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
  // 1 execução / 1 arquivo único (timestamp), não agregar por nome do roteiro
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
  let status = "running";

  const flushUsage = () => {
    // Ordem: totals/calls primeiro — prompt completo fica no log .md (não esconde o usage).
    const prompt = String(cfg.prompt || "");
    writeUsageFile(usagePath, {
      started: startedAt,
      ended: new Date().toISOString(),
      serial,
      engine,
      model,
      maxSteps,
      logPath,
      status,
      totals: sumUsage(usageCalls),
      calls: usageCalls,
      promptChars: prompt.length,
      promptPreview: prompt.slice(0, 240),
    });
  };
  flushUsage();

  const onSignal = (sig) => {
    status = `aborted_${sig}`;
    try {
      flushUsage();
    } catch {
      /* ignore */
    }
    log(`sinal ${sig} — usage salvo em ${usagePath}`);
    process.exit(130);
  };
  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));

  const recoverMs = Number(cfg.recoverDelayMs ?? process.env.AGENT_RECOVER_MS ?? 1500);

  for (let i = 1; i <= maxSteps; i++) {
    log(`── passo ${i}/${maxSteps} ──`);
    log(`extract…`);
    const tExtract = Date.now();
    let ocr;
    try {
      ocr = await runExtract({ serial, engine }, deps);
      log(`extract ok em ${Date.now() - tExtract}ms (${ocr.length} hits)`);
      dumpOcrStdout(ocr);
    } catch (e) {
      const resultado = `erro extract: ${e.code || ""} ${e.message || e}`;
      log(`${resultado} — recupera e continua`);
      appendStepLog(logPath, i, {
        resumo: "(extract falhou; processo segue)",
        acao: { type: "sleep", ms: recoverMs, motivo: String(e.message || e) },
        ocr: [],
        resultado,
      });
      steps.push({ step: i, error: true, resultado });
      history.push({ step: i, type: "sleep", motivo: resultado, error: resultado });
      usageCalls.push({ step: i, error: resultado });
      flushUsage();
      await sleep(recoverMs);
      continue;
    }

    if (looksLoading(ocr)) {
      log(`tela loading — retry extract em 800ms`);
      await sleep(800);
      try {
        ocr = await runExtract({ serial, engine }, deps);
        dumpOcrStdout(ocr);
      } catch (e) {
        log(`extract retry falhou (${e.message}) — continua`);
      }
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
      // Jamais abortar a run por timeout/503/rede — só registra e tenta de novo.
      log(`${resultado} — recupera e continua`);
      const errUsage = (e.requests || []).map((r) => r?.usage).find(Boolean);
      appendStepLog(logPath, i, {
        resumo: "(decide falhou; processo segue)",
        acao: { type: "sleep", ms: recoverMs, motivo: String(e.message || e) },
        ocr,
        resultado,
        usage: errUsage,
      });
      steps.push({ step: i, error: true, resultado });
      history.push({ step: i, type: "sleep", motivo: resultado, error: resultado });
      usageCalls.push({
        step: i,
        error: resultado,
        model: e.model || model,
        usage: errUsage || undefined,
        requests: e.requests || undefined,
      });
      flushUsage();
      await sleep(recoverMs);
      continue;
    }

    // Sempre registra o passo (mesmo sem usageMetadata) — cada decide = 1 entry
    usageCalls.push({
      step: i,
      model: decision.model || model,
      usage: decision.usage || undefined,
      requests: decision.requests || undefined,
      acao: decision.acao?.type,
    });
    flushUsage();

    const { resumo, acao } = decision;
    log(
      `decisão: ${acao.type}` +
        (acao.x != null ? ` @${acao.x},${acao.y}` : "") +
        (acao.direction ? ` ${acao.direction}` : "") +
        (acao.motivo ? ` — ${acao.motivo}` : ""),
    );
    if (resumo) log(`resumo: ${resumo.slice(0, 200)}`);
    if (decision.usage) {
      const u = decision.usage;
      log(
        `usage in=${u.promptTokenCount ?? "?"} out=${u.candidatesTokenCount ?? "?"}` +
          (u.totalTokenCount != null ? ` total=${u.totalTokenCount}` : ""),
      );
    }

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
      log(`${resultado} — recupera e continua`);
    }

    appendStepLog(logPath, i, {
      resumo,
      acao,
      ocr,
      resultado,
      usage: decision.usage,
    });
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
    // fail da IA = intenção explícita; ainda assim não mata — só registra e segue
    if (acao.type === "fail") {
      log(`fail da IA (${acao.motivo || "sem motivo"}) — ignora e continua`);
      await sleep(recoverMs);
      continue;
    }

    await sleep(Number(cfg.stepDelayMs ?? 600));
  }

  if (status === "running") status = "max_steps";

  appendFileSync(
    logPath,
    `\n---\n\n**status:** \`${status}\` · steps: ${steps.length} · ended: ${new Date().toISOString()}\n`,
    "utf8",
  );

  flushUsage();
  log(`fim status=${status} steps=${steps.length} log=${logPath} usage=${usagePath}`);
  return { status, steps, logPath, usagePath, usage: sumUsage(usageCalls) };
}
