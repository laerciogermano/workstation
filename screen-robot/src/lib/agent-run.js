/**
 * EP-07 / US-25 — loop extract → decide → operate → log.
 */
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { extract } from "./extract.js";
import { decide } from "./agent-decide.js";
import { tapElement, scroll, type, key } from "./operate.js";
import { sleep as defaultSleep } from "./adb.js";

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

function dumpOcrStdout(ocr) {
  for (const e of ocr || []) {
    console.log(`${e.text}@${e.x},${e.y}`);
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
    case "type":
      await doType(
        { serial, text: a.text, engine: cfg.engine },
        deps,
      );
      return `type ${JSON.stringify(a.text)}`;
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
  const logDir = resolve(cfg.logDir || join(process.cwd(), "logs", "agent"));
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, `${stamp()}.md`);

  writeFileSync(
    logPath,
    [
      "# runAgent",
      "",
      `- serial: \`${serial}\``,
      `- engine: \`${engine}\``,
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
  let status = "max_steps";

  for (let i = 1; i <= maxSteps; i++) {
    let ocr = await runExtract({ serial, engine }, deps);
    dumpOcrStdout(ocr);

    if (looksLoading(ocr)) {
      await sleep(800);
      ocr = await runExtract({ serial, engine }, deps);
      dumpOcrStdout(ocr);
    }

    const decision = await runDecide(
      {
        prompt: cfg.prompt,
        ocr,
        history,
        model: cfg.model,
        apiKey: cfg.apiKey,
      },
      deps,
    );

    const { resumo, acao } = decision;
    let resultado = "";
    try {
      resultado = await executeAction(
        { serial, acao, engine },
        deps,
      );
    } catch (e) {
      resultado = `erro: ${e.message || e}`;
      appendStepLog(logPath, i, { resumo, acao, ocr, resultado });
      steps.push({ step: i, acao, resultado, error: true });
      status = "fail";
      break;
    }

    appendStepLog(logPath, i, { resumo, acao, ocr, resultado });
    steps.push({ step: i, acao, resultado });
    history.push({
      step: i,
      type: acao.type,
      motivo: acao.motivo,
      x: acao.x,
      y: acao.y,
    });

    if (acao.type === "done") {
      status = "done";
      break;
    }
    if (acao.type === "fail") {
      status = "fail";
      break;
    }

    await sleep(Number(cfg.stepDelayMs ?? 600));
  }

  appendFileSync(
    logPath,
    `\n---\n\n**status:** \`${status}\` · steps: ${steps.length} · ended: ${new Date().toISOString()}\n`,
    "utf8",
  );

  return { status, steps, logPath };
}
