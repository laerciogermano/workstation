/**
 * EP-07 / US-25 — loop (OCR ou vision) → decide → operate → log.
 */
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { extract } from "./extract.js";
import {
  decide,
  historyWindow,
  resolveHistorySteps,
  resolveDecideModel,
  resolveProvider,
  resolveSense,
  compactOcr,
} from "./agent-decide.js";
import { DEFAULT_MODEL as DEFAULT_GEMINI_MODEL } from "./gemini.js";
import { tapElement, scroll, type, typeViaAdb, key } from "./operate.js";
import { adb, sleep as defaultSleep } from "./adb.js";
import { captureFrame } from "./frame.js";
import { compressFrame } from "./vision-frame.js";

/** `AGENT_TYPE_METHOD=adb|ocr` ou cfg.typeMethod — default adb. */
function resolveTypeMethod(cfg = {}) {
  const raw = cfg.typeMethod ?? process.env.AGENT_TYPE_METHOD ?? "adb";
  return String(raw).toLowerCase() === "ocr" ? "ocr" : "adb";
}

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

/** Teclado QWERTY no OCR (teclas isoladas). */
export function ocrHasQwertyKeyboard(ocr) {
  const singles = new Set(
    (ocr || [])
      .map((e) => String(e.text || "").toLowerCase().trim())
      .filter((t) => t.length === 1),
  );
  return ["q", "w", "e"].every((k) => singles.has(k));
}

/** Strings `type "…"` do roteiro, na ordem. Ignora `PROIBIDO type "…"`. */
export function typeQuotesFromPrompt(prompt) {
  const out = [];
  const re = /type\s+"([^"]+)"/gi;
  const src = String(prompt || "");
  let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/PROIBIDO\s+$/i.test(before)) continue;
    out.push(m[1]);
  }
  return out;
}

/**
 * Sheet de cidade (Add location / Australia) → type da cidade; senão o primeiro type do roteiro (busca).
 * Chip "Location" da lista People NÃO conta — senão o guard injeta Campinas no Search.
 */
export function pickForcedTypeText(prompt, ocr) {
  const quotes = typeQuotesFromPrompt(prompt);
  const unique = [...new Set(quotes)];
  if (!unique.length) return null;
  const blob = (ocr || [])
    .map((e) => String(e.text || "").toLowerCase())
    .join(" ");
  const proper = unique.filter((q) => /^[A-ZÁÉÍÓÚÃÕ]/.test(q));
  const locUi = /(add\s*a?\s*locat|alocation|australia|united\s*states)/i.test(
    blob,
  );
  if (unique.length > 1 && locUi && proper.length) {
    return proper[proper.length - 1];
  }
  return unique[0];
}

export function ocrHasBottomTabs(ocr) {
  const bottom = (ocr || []).filter((e) => {
    const t = String(e.text || "").trim();
    return Number(e.y) > 850 && t.length > 0 && t.length <= 14;
  });
  if (bottom.length < 3) return false;
  const xs = bottom.map((e) => Number(e.x)).filter((n) => Number.isFinite(n));
  if (xs.length < 3) return false;
  return Math.max(...xs) - Math.min(...xs) > 280;
}

export function findOcrHit(ocr, re) {
  return (ocr || []).find((e) => re.test(String(e.text || "")));
}

function tapGroundOff(cfg = {}) {
  if (cfg.tapGround === false) return true;
  const raw = String(
    cfg.tapGround ?? process.env.AGENT_TAP_GROUND ?? "1",
  ).trim();
  return raw === "0" || /^off|false|no$/i.test(raw);
}

function distXy(ax, ay, bx, by) {
  return Math.hypot(Number(ax) - Number(bx), Number(ay) - Number(by));
}

function normLabel(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

/** Hit OCR (text) mais próximo de x,y, ou null se além de maxDist. */
export function ocrTextAt(ocr, x, y, maxDist = 8) {
  let best = null;
  for (const e of ocr || []) {
    if (e?.type === "icon") continue;
    const t = String(e?.text || "").trim();
    if (!t) continue;
    if (!Number.isFinite(Number(e.x)) || !Number.isFinite(Number(e.y))) continue;
    const d = distXy(x, y, e.x, e.y);
    if (d > maxDist) continue;
    if (!best || d < best.d) best = { ...e, text: t, d };
  }
  return best;
}

/**
 * Tap em coords de um text OCR cujo label declarado (elementos) não é esse text.
 * @returns {null|{ code: string, hit?: object, claimed?: string }}
 */
export function tapLabelMismatch(ocr, acao, elementos, maxDist = 8) {
  if (!acao || acao.type !== "tap") return null;
  const x = Number(acao.x);
  const y = Number(acao.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const hit = ocrTextAt(ocr, x, y, maxDist);
  if (!hit) {
    const nearIcon = (ocr || []).some(
      (e) =>
        e?.type === "icon" &&
        Number.isFinite(Number(e.x)) &&
        distXy(x, y, e.x, e.y) <= maxDist,
    );
    if (nearIcon) return null;
    return { code: "TAP_MISS" };
  }
  const claimedEl = (elementos || []).find(
    (el) =>
      el &&
      Number.isFinite(Number(el.x)) &&
      distXy(x, y, el.x, el.y) <= maxDist &&
      String(el.label || "").trim(),
  );
  const claimed = claimedEl ? String(claimedEl.label).trim() : "";
  if (claimed && normLabel(claimed) !== normLabel(hit.text)) {
    return { code: "TAP_LABEL_MISMATCH", hit, claimed };
  }
  return null;
}

function log(...args) {
  console.log(`[agent ${new Date().toISOString()}]`, ...args);
}

function dumpOcrStdout(ocr) {
  const list = Array.isArray(ocr) ? ocr : [];
  log(`OCR ${list.length} hits:`);
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const id = e?.id || `e${i}`;
    const label = e?.type === "icon" ? "icon" : e?.text;
    console.log(`  ${id} ${label}@${e?.x},${e?.y}`);
  }
  log(`extract return:`);
  console.log(JSON.stringify(list, null, 2));
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
      const typeMethod = resolveTypeMethod(cfg);
      const payload = {
        serial,
        text: a.text,
        method: typeMethod,
        engine: cfg.engine,
        region: cfg.keyboardRegion,
      };
      if (typeMethod === "adb") {
        const inject = deps.typeViaAdb ?? typeViaAdb;
        inject(serial, a.text, deps);
        return `type-adb ${JSON.stringify(a.text)}`;
      }
      const adbFallback =
        process.env.AGENT_TYPE_ADB_FALLBACK !== "0" &&
        cfg.adbTypeFallback !== false;
      try {
        await doType(payload, deps);
      } catch {
        try {
          await doType(payload, deps);
        } catch (e2) {
          if (!adbFallback) throw e2;
          const runAdb = deps.adb ?? adb;
          const inject = deps.typeViaAdb ?? typeViaAdb;
          log(`type OCR falhou (${e2.message}) — limpa campo e fallback adb input text`);
          runAdb(serial, ["shell", "input", "keyevent", "KEYCODE_MOVE_END"]);
          for (let i = 0; i < 40; i++) {
            runAdb(serial, ["shell", "input", "keyevent", "KEYCODE_DEL"]);
          }
          inject(serial, a.text, deps);
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

/** Nome único sob usage-2.0/: timestamp com ms; se colidir, sufixa -2, -3… */
function uniqueUsagePath(usageDir) {
  let base = stamp();
  let path = join(usageDir, `${base}.json`);
  let n = 1;
  while (existsSync(path)) {
    n += 1;
    path = join(usageDir, `${base}-${n}.json`);
  }
  return path;
}

function literalEntrada(req, call) {
  if (req?.entrada != null) return req.entrada;
  if (req?.input?.body != null) return req.input.body;
  if (call?.entrada != null) return call.entrada;
  return null;
}

function literalResposta(req, call) {
  if (req?.resposta !== undefined) return req.resposta;
  if (req?.output?.raw !== undefined) return req.output.raw;
  if (call?.resposta !== undefined) return call.resposta;
  return null;
}

/**
 * Um arquivo por request HTTP ao chat, flat em usage-2.0/<timestamp>.json
 * Só o payload literal: { entrada, resposta }.
 * @returns {string[]}
 */
function writeChatRequestFiles({ usageDir, call }) {
  const reqs =
    Array.isArray(call.requests) && call.requests.length > 0
      ? call.requests
      : [{}];
  const paths = [];
  for (const req of reqs) {
    const path = uniqueUsagePath(usageDir);
    writeUsageFile(path, {
      entrada: literalEntrada(req, call),
      resposta: literalResposta(req, call),
    });
    paths.push(path);
    log(`usage → ${path}`);
  }
  return paths;
}

function appendStepLog(logPath, step, { resumo, acao, ocr, vision, resultado, usage }) {
  const u = usage || null;
  const usageLine = u
    ? `- usage: in=${u.promptTokenCount ?? "?"} out=${u.candidatesTokenCount ?? "?"}` +
      (u.thoughtsTokenCount ? ` thoughts=${u.thoughtsTokenCount}` : "") +
      (u.totalTokenCount != null ? ` total=${u.totalTokenCount}` : "")
    : null;
  const senseBlock = vision
    ? [
        "### Vision (print comprimido)",
        "",
        "```json",
        JSON.stringify(vision, null, 2),
        "```",
        "",
      ]
    : [
        "### OCR usado na decisão",
        "",
        "```json",
        JSON.stringify(ocr, null, 2),
        "```",
        "",
      ];
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
    ...senseBlock,
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
 *   icons?: boolean,
 *   sense?: "ocr"|"vision",
 *   visionWidth?: number,
 *   visionQuality?: number,
 *   logDir?: string,
 *   usageDir?: string,
 *   keyboardRegion?: object,
 *   typeMethod?: "ocr"|"adb",
 *   model?: string,
 *   noFallback?: boolean,
 *   fallbackModels?: string[]|string,
 *   provider?: string,
 *   apiKey?: string,
 *   historySteps?: number,
 * }} cfg
 * @param {object} [deps]
 */
export async function runAgent(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) fail("AGENT_NO_SERIAL", "runAgent: falta serial");
  if (!cfg?.prompt) fail("AGENT_NO_PROMPT", "runAgent: falta prompt");

  const maxSteps = Number(cfg.maxSteps ?? 40);
  const historySteps = resolveHistorySteps(cfg);
  const sense = resolveSense(cfg);
  // all = merge paralelo top-5 OCR (só sense=ocr)
  const engine = cfg.engine || process.env.SCREEN_ROBOT_OCR || "all";
  const icons = cfg.icons;
  const sleep = deps.sleep ?? defaultSleep;
  const runExtract = deps.extract ?? extract;
  const runDecide = deps.decide ?? decide;
  const runCapture = deps.captureFrame ?? captureFrame;
  const runCompress = deps.compressFrame ?? compressFrame;
  const startedAt = new Date().toISOString();
  const runStamp = stamp();
  const logDir = resolve(cfg.logDir || join(process.cwd(), "logs", "agent"));
  const usageDir = resolve(cfg.usageDir || join(process.cwd(), "usage-2.0"));
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  if (!existsSync(usageDir)) mkdirSync(usageDir, { recursive: true });
  const logPath = join(logDir, `${runStamp}.md`);

  const provider = resolveProvider(cfg);
  const model = resolveDecideModel(cfg) || DEFAULT_GEMINI_MODEL;
  log(
    `início serial=${serial} sense=${sense}` +
      (sense === "ocr"
        ? ` engine=${engine} icons=${icons === true ? "true" : icons === false ? "false" : "default"}`
        : "") +
      ` provider=${provider} model=${model} maxSteps=${maxSteps} historySteps=${historySteps}`,
  );
  log(`log → ${logPath}`);
  log(`usage → ${usageDir}/<timestamp>.json (1 arquivo por request)`);

  writeFileSync(
    logPath,
    [
      "# runAgent",
      "",
      `- serial: \`${serial}\``,
      `- sense: \`${sense}\``,
      sense === "ocr" ? `- engine: \`${engine}\`` : null,
      sense === "ocr" && icons != null ? `- icons: \`${icons}\`` : null,
      `- provider: \`${provider}\``,
      `- model: \`${model}\``,
      `- maxSteps: ${maxSteps}`,
      `- historySteps: ${historySteps}`,
      `- started: ${new Date().toISOString()}`,
      "",
      "## Prompt",
      "",
      cfg.prompt.slice(0, 4000),
      cfg.prompt.length > 4000 ? "\n…(truncado)\n" : "",
      "",
    ]
      .filter((line) => line != null)
      .join("\n"),
    "utf8",
  );

  /** @type {object[]} */
  const history = [];
  /** @type {object[]} */
  const steps = [];
  /** @type {object[]} */
  const usageCalls = [];
  /** @type {string[]} */
  const requestFiles = [];
  let lastUsagePath = null;
  let status = "running";

  const recordChatCall = (call) => {
    usageCalls.push(call);
    const paths = writeChatRequestFiles({ usageDir, call });
    requestFiles.push(...paths);
    if (paths.length) lastUsagePath = paths[paths.length - 1];
  };

  const onSignal = (sig) => {
    status = `aborted_${sig}`;
    log(`sinal ${sig} — usage em ${usageDir} (${requestFiles.length} reqs)`);
    process.exit(130);
  };
  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));

  // recover entre falhas (device offline / extract). Default 2s. 0 = imediato (testes).
  const recoverMs = Number(cfg.recoverDelayMs ?? process.env.AGENT_RECOVER_MS ?? 2000);
  const stepDelayMs = Number(cfg.stepDelayMs ?? process.env.AGENT_STEP_DELAY_MS ?? 0);

  for (let i = 1; i <= maxSteps; i++) {
    log(`── passo ${i}/${maxSteps} ──`);
    /** @type {object[]} */
    let ocr = [];
    /** @type {object|null} */
    let visionMeta = null;
    /** @type {{ mimeType: string, data: string }|null} */
    let visionImage = null;

    if (sense === "vision") {
      log(`capture+compress (vision)…`);
      const tCap = Date.now();
      try {
        const framePath = await runCapture(serial, deps);
        const compressed = await runCompress(framePath, {
          width: cfg.visionWidth,
          quality: cfg.visionQuality,
        });
        visionMeta = {
          width: compressed.width,
          height: compressed.height,
          scaleToDevice: compressed.scaleToDevice,
          original: compressed.original,
          inputBytes: compressed.inputBytes,
          outputBytes: compressed.outputBytes,
        };
        visionImage = {
          mimeType: compressed.mimeType,
          data: compressed.base64,
        };
        log(
          `vision ok em ${Date.now() - tCap}ms ` +
            `${compressed.original.width}×${compressed.original.height} → ` +
            `${compressed.width}×${compressed.height} ` +
            `${compressed.outputBytes}B scale=${compressed.scaleToDevice}`,
        );
      } catch (e) {
        const resultado = `erro vision: ${e.code || ""} ${e.message || e}`;
        log(`${resultado} — recupera e continua`);
        appendStepLog(logPath, i, {
          resumo: "(vision falhou; processo segue)",
          acao: { type: "sleep", ms: recoverMs, motivo: String(e.message || e) },
          ocr: [],
          resultado,
        });
        steps.push({ step: i, error: true, resultado });
        history.push({
          step: i,
          type: "sleep",
          motivo: resultado,
          error: resultado,
          resultado,
          sense: "vision",
        });
        usageCalls.push({ step: i, error: resultado });
        await sleep(recoverMs);
        continue;
      }
    } else {
      log(`extract…`);
      const tExtract = Date.now();
      try {
        ocr = await runExtract({ serial, engine, icons }, deps);
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
        history.push({
          step: i,
          type: "sleep",
          motivo: resultado,
          error: resultado,
          resultado,
          ocr: [],
        });
        usageCalls.push({ step: i, error: resultado });
        await sleep(recoverMs);
        continue;
      }

      if (looksLoading(ocr)) {
        log(`tela loading — retry extract imediato`);
        try {
          ocr = await runExtract({ serial, engine, icons }, deps);
          dumpOcrStdout(ocr);
        } catch (e) {
          log(`extract retry falhou (${e.message}) — continua`);
        }
      }
    }

    log(`decide (${provider}, sense=${sense})…`);
    let decision;
    try {
      decision = await runDecide(
        sense === "vision"
          ? {
              prompt: cfg.prompt,
              sense: "vision",
              image: visionImage,
              imageMeta: visionMeta,
              history,
              historySteps,
              model: cfg.model,
              provider: cfg.provider,
              apiKey: cfg.apiKey,
              noFallback: cfg.noFallback,
              fallbackModels: cfg.fallbackModels,
            }
          : {
              prompt: cfg.prompt,
              sense: "ocr",
              ocr,
              history,
              historySteps,
              model: cfg.model,
              provider: cfg.provider,
              apiKey: cfg.apiKey,
              noFallback: cfg.noFallback,
              fallbackModels: cfg.fallbackModels,
            },
        deps,
      );
    } catch (e) {
      const resultado = `erro decide: ${e.code || ""} ${e.message || e}`;
      log(`${resultado} — recupera e continua`);
      const errUsage = (e.requests || []).map((r) => r?.usage).find(Boolean);
      appendStepLog(logPath, i, {
        resumo: "(decide falhou; processo segue)",
        acao: { type: "sleep", ms: recoverMs, motivo: String(e.message || e) },
        ocr,
        vision: visionMeta || undefined,
        resultado,
        usage: errUsage,
      });
      steps.push({ step: i, error: true, resultado });
      history.push({
        step: i,
        type: "sleep",
        motivo: resultado,
        error: resultado,
        resultado,
        sense,
        ocr: sense === "ocr" ? compactOcr(ocr) : undefined,
        vision: visionMeta || undefined,
      });
      {
        const hist = historyWindow({ history, historySteps });
        recordChatCall({
          step: i,
          error: resultado,
          model: e.model || model,
          usage: errUsage || undefined,
          requests: e.requests || undefined,
          historyCount: hist.historyCount,
          historySteps: hist.historySteps,
        });
      }
      await sleep(recoverMs);
      continue;
    }

    recordChatCall({
      step: i,
      model: decision.model || model,
      usage: decision.usage || undefined,
      requests: decision.requests || undefined,
      acao: decision.acao || undefined,
      resumo: decision.resumo || undefined,
      elementos: decision.elementos || undefined,
      historyCount: decision.historyCount ?? 0,
      historySteps: decision.historySteps ?? historySteps,
    });

    let { resumo, acao } = decision;
    if (sense === "ocr" && acao.type === "tap" && !tapGroundOff(cfg)) {
      const hasXy =
        Number.isFinite(Number(acao.x)) && Number.isFinite(Number(acao.y));
      if (!hasXy) {
        log(`guard: TAP_NO_XY — tap OCR exige x,y da IA`);
        acao = {
          type: "sleep",
          element: null,
          x: null,
          y: null,
          direction: null,
          text: null,
          code: null,
          ms: recoverMs,
          motivo: "TAP_NO_XY: tap OCR exige x,y",
        };
      } else {
        acao = { ...acao, element: null };
      }
    }
    // Guard: após tap no Search (y<120), scroll com OCR “só hora” digita lixo no teclado (ty/tyl).
    const lastHist = history[history.length - 1];
    const lastWasSearchTap =
      lastHist?.type === "tap" &&
      Number.isFinite(Number(lastHist.y)) &&
      Number(lastHist.y) < 120;
    if (acao.type === "scroll" && lastWasSearchTap) {
      const text = pickForcedTypeText(cfg.prompt, ocr);
      if (text) {
        log(
          `guard: bloqueia scroll após tap Search (y<120) — força type ${JSON.stringify(text)}`,
        );
        acao = {
          type: "type",
          x: lastHist.x ?? null,
          y: lastHist.y ?? null,
          direction: null,
          text,
          code: null,
          ms: null,
          motivo: `guard: type após Search (bloqueou scroll que digitaria no teclado)`,
        };
      } else {
        log(`guard: bloqueia scroll após tap Search — KEYCODE_BACK`);
        acao = {
          type: "key",
          x: null,
          y: null,
          direction: null,
          text: null,
          code: "KEYCODE_BACK",
          ms: null,
          motivo: "guard: BACK após Search (bloqueou scroll sobre teclado)",
        };
      }
    }
    if (
      acao.type === "scroll" &&
      String(acao.direction || "down") === "down" &&
      findOcrHit(ocr, /show\s*translation|following/i)
    ) {
      log(`guard: feed visível — scroll up (não down)`);
      acao = {
        type: "scroll",
        x: null,
        y: null,
        direction: "up",
        text: null,
        code: null,
        ms: null,
        motivo: "guard: feed; scroll up para o Search",
      };
    }
    if (
      acao.type === "scroll" &&
      String(acao.direction || "down") === "down" &&
      lastHist?.type === "tap" &&
      Number(lastHist.y) > 200 &&
      Number(lastHist.y) < 800 &&
      (ocr || []).length < 8
    ) {
      log(`guard: splash após tap no app — sleep 2000`);
      acao = {
        type: "sleep",
        x: null,
        y: null,
        direction: null,
        text: null,
        code: null,
        ms: 2000,
        motivo: "guard: app carregando; bloqueou scroll down",
      };
    }
    if (
      acao.type === "scroll" &&
      String(acao.direction || "down") === "down" &&
      ocrHasBottomTabs(ocr)
    ) {
      log(`guard: scroll down com tab bar no rodapé — sleep 1500`);
      acao = {
        type: "sleep",
        x: null,
        y: null,
        direction: null,
        text: null,
        code: null,
        ms: 1500,
        motivo: "guard: app aberto (tabs no rodapé); bloqueou scroll down da gaveta",
      };
    }
    if (acao.type === "type") {
      const forced = pickForcedTypeText(cfg.prompt, ocr);
      if (forced && forced !== acao.text) {
        log(
          `guard: type ${JSON.stringify(acao.text)} → ${JSON.stringify(forced)} (roteiro/tela)`,
        );
        acao = { ...acao, text: forced, motivo: `guard: type ${forced}` };
      }
    }
    if (
      acao.type === "tap" &&
      Number.isFinite(Number(acao.y)) &&
      Number(acao.y) < 120 &&
      ocrHasQwertyKeyboard(ocr)
    ) {
      const text = pickForcedTypeText(cfg.prompt, ocr);
      if (text) {
        log(
          `guard: teclado visível + tap y<120 — força type ${JSON.stringify(text)}`,
        );
        acao = {
          type: "type",
          x: acao.x ?? null,
          y: acao.y ?? null,
          direction: null,
          text,
          code: null,
          ms: null,
          motivo: `guard: type com teclado aberto (bloqueou tap no campo)`,
        };
      }
    }
    const addLoc = findOcrHit(ocr, /add\s*a\s*locat/i);
    if (
      acao.type === "tap" &&
      addLoc &&
      Number.isFinite(Number(addLoc.y)) &&
      Number(addLoc.y) > Number(acao.y) + 80
    ) {
      log(
        `guard: retarget tap ${acao.x},${acao.y} → Add a location @${addLoc.x},${addLoc.y}`,
      );
      acao = {
        type: "tap",
        element: String(addLoc.text || "Add a location"),
        x: addLoc.x,
        y: addLoc.y,
        direction: null,
        text: null,
        code: null,
        ms: null,
        motivo: "guard: tap no campo Add a location (não no chip)",
      };
    }
    const showRes = findOcrHit(ocr, /show\s*results/i);
    const sameTap =
      lastHist?.type === "tap" &&
      Number(lastHist.x) === Number(acao.x) &&
      Number(lastHist.y) === Number(acao.y);
    if (
      acao.type === "tap" &&
      sameTap &&
      showRes &&
      Number.isFinite(Number(showRes.y)) &&
      Number(showRes.y) > Number(acao.y) + 100
    ) {
      log(
        `guard: tap repetido → Show results @${showRes.x},${showRes.y}`,
      );
      acao = {
        type: "tap",
        element: String(showRes.text || "Show results"),
        x: showRes.x,
        y: showRes.y,
        direction: null,
        text: null,
        code: null,
        ms: null,
        motivo: "guard: tap Show results após sugestão repetida",
      };
    }
    if (sense === "ocr" && tapGroundOff(cfg) && acao.type === "tap") {
      const bad = tapLabelMismatch(ocr, acao, decision.elementos);
      if (bad?.code === "TAP_MISS") {
        log(`guard: TAP_MISS @${acao.x},${acao.y} — nenhum text OCR`);
        acao = {
          type: "sleep",
          x: acao.x,
          y: acao.y,
          direction: null,
          text: null,
          code: null,
          ms: recoverMs,
          motivo: `TAP_MISS: sem text OCR em ${acao.x},${acao.y}`,
        };
      } else if (bad?.code === "TAP_LABEL_MISMATCH") {
        log(
          `guard: TAP_LABEL_MISMATCH claimed=${JSON.stringify(bad.claimed)} ocr=${JSON.stringify(bad.hit.text)} @${acao.x},${acao.y}`,
        );
        acao = {
          type: "sleep",
          x: acao.x,
          y: acao.y,
          direction: null,
          text: null,
          code: null,
          ms: recoverMs,
          motivo: `TAP_LABEL_MISMATCH: OCR="${bad.hit.text}" ≠ label="${bad.claimed}"`,
        };
      }
    }
    log(
      `decisão: ${acao.type}` +
        (acao.element ? ` ${acao.element}` : "") +
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
        {
          serial,
          acao,
          engine,
          keyboardRegion: cfg.keyboardRegion,
          typeMethod: cfg.typeMethod,
          adbTypeFallback: cfg.adbTypeFallback,
        },
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
      vision: visionMeta || undefined,
      resultado,
      usage: decision.usage,
    });
    steps.push({ step: i, acao, resultado, error: stepError });
    history.push({
      step: i,
      type: acao.type,
      motivo: acao.motivo,
      element: acao.element,
      x: acao.x,
      y: acao.y,
      direction: acao.direction,
      text: acao.text,
      code: acao.code,
      resultado,
      error: stepError ? resultado : undefined,
      sense,
      ocr: sense === "ocr" ? compactOcr(ocr) : undefined,
      vision: visionMeta
        ? {
            width: visionMeta.width,
            height: visionMeta.height,
            scaleToDevice: visionMeta.scaleToDevice,
          }
        : undefined,
    });

    if (acao.type === "done") {
      status = "done";
      log(`done — objetivo cumprido`);
      break;
    }
    if (acao.type === "fail") {
      log(`fail da IA (${acao.motivo || "sem motivo"}) — ignora e continua`);
      await sleep(recoverMs);
      continue;
    }

    if (stepDelayMs > 0) await sleep(stepDelayMs);
  }

  if (status === "running") status = "max_steps";

  appendFileSync(
    logPath,
    `\n---\n\n**status:** \`${status}\` · steps: ${steps.length} · ended: ${new Date().toISOString()}\n`,
    "utf8",
  );

  log(
    `fim status=${status} steps=${steps.length} log=${logPath} usageFiles=${requestFiles.length}`,
  );
  return {
    status,
    steps,
    logPath,
    usagePath: lastUsagePath,
    usageDir,
    requestFiles,
    usage: sumUsage(usageCalls),
  };
}
