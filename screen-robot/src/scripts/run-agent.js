#!/usr/bin/env node
/**
 * CLI — EP-07 runAgent (prompt como input; zero jornada embutida).
 *
 *   npm run agent -- --prompt ../roteiros/jornada-completa.md
 *   npm run agent -- --model gemini-3.8-flash --engine all --icons true --prompt ../roteiros/jornada-comprador.md
 *   npm run agent -- --prompt ./meu.txt --force-model gemini-2.5-flash  # só esse; sem fallback
 *   npm run agent -- --prompt ./meu.txt --model gemini-2.5-flash --no-fallback
 *   npm run agent -- --prompt ./meu.txt --no-prompt   # sem menu (env/default)
 *   npm run agent -- --prompt ./meu.txt --all-models  # todos do catálogo
 *   npm run agent -- --provider openai --model gpt-4o-mini --prompt …
 *   npm run agent -- --sense vision --prompt ../roteiros/teste.md   # print→WebP→IA
 *   npm run agent -- --vision --prompt …                            # atalho sense=vision
 *
 * Sem --model em TTY: menu interativo para escolher 1+ modelos.
 * Env: GEMINI_API_KEY / OPENAI_API_KEY · AGENT_PROVIDER · GEMINI_MODEL / OPENAI_MODEL
 *      AGENT_SENSE=ocr|vision · VISION_WIDTH · VISION_QUALITY
 * Keys também em src/.env (gitignored) — ver .env.example
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";
import { runAgent } from "../lib/agent-run.js";
import { resolveProvider } from "../lib/agent-decide.js";
import {
  AGENT_MODELS,
  findAgentModel,
  parseModelSelection,
} from "../lib/agent-models.js";
import {
  selectModelsInteractive,
  shouldPromptModels,
} from "../lib/select-models.js";
import { parseIconsFlag } from "../lib/extract-icons.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");

loadEnvFiles([
  join(SRC_ROOT, ".env"),
  join(SRC_ROOT, ".env.local"),
]);

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
}

/** Mesmo contrato do extract: `--icons` / `--icons true` / `--no-icons`. */
function parseAgentIcons() {
  if (hasFlag("--no-icons")) return false;
  const i = process.argv.indexOf("--icons");
  if (i < 0) return undefined;
  const parsed = parseIconsFlag(process.argv[i + 1]);
  if (parsed != null) return parsed;
  return true;
}

function loadPrompt(raw) {
  if (!raw) return null;
  const asPath = resolve(process.cwd(), raw);
  if (existsSync(asPath) && !raw.includes("\n")) {
    return readFileSync(asPath, "utf8");
  }
  const fromSrc = resolve(SRC_ROOT, raw);
  if (existsSync(fromSrc) && !raw.includes("\n")) {
    return readFileSync(fromSrc, "utf8");
  }
  return raw;
}

function loadDeviceCfg() {
  try {
    return JSON.parse(readFileSync(join(SRC_ROOT, "device.config.json"), "utf8"));
  } catch {
    return {};
  }
}

function loadSerial() {
  const fromArg = argValue("--device") || argValue("--serial");
  if (fromArg) return fromArg;
  if (process.env.ANDROID_SERIAL) return process.env.ANDROID_SERIAL;
  const cfg = loadDeviceCfg();
  return cfg.device || cfg.provision?.serial || null;
}

function requireKey(provider) {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      console.error("falta OPENAI_API_KEY (provider=openai)");
      process.exit(2);
    }
  } else if (!process.env.GEMINI_API_KEY) {
    console.error("falta GEMINI_API_KEY (provider=gemini)");
    process.exit(2);
  }
}

/**
 * @returns {Promise<import("../lib/agent-models.js").AgentModel[]>}
 */
async function resolveModels() {
  const allModels = hasFlag("--all-models");
  const noPrompt = hasFlag("--no-prompt") || hasFlag("-y");
  const forceModel = argValue("--force-model");
  const modelArg = forceModel || argValue("--model");
  const providerArg = argValue("--provider") || undefined;

  if (forceModel) {
    const known = findAgentModel(forceModel);
    if (known) return [known];
    const provider =
      providerArg ||
      (String(forceModel).startsWith("gpt") ? "openai" : "gemini");
    return [{ id: forceModel, provider, label: forceModel }];
  }

  if (allModels) return [...AGENT_MODELS];

  if (modelArg) {
    const known = findAgentModel(modelArg);
    if (known) return [known];
    const provider =
      providerArg ||
      (String(modelArg).startsWith("gpt") ? "openai" : "gemini");
    return [{ id: modelArg, provider, label: modelArg }];
  }

  if (
    shouldPromptModels({
      model: modelArg,
      noPrompt,
      isTTY: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    })
  ) {
    return selectModelsInteractive();
  }

  // não-interativo: env / default
  const fromEnv =
    process.env.OPENAI_MODEL ||
    process.env.GEMINI_MODEL ||
    AGENT_MODELS[0].id;
  const picked = parseModelSelection(fromEnv);
  if (picked.length) return picked;
  const provider =
    providerArg ||
    (String(fromEnv).startsWith("gpt") ? "openai" : "gemini");
  return [{ id: fromEnv, provider, label: fromEnv }];
}

const promptRaw = argValue("--prompt") || argValue("-p");
const prompt = loadPrompt(promptRaw);
const serial = loadSerial();
const maxSteps = Number(argValue("--max-steps") || "40");
const historyStepsRaw = argValue("--history-steps");
const historySteps = historyStepsRaw != null ? Number(historyStepsRaw) : undefined;
const engine =
  argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const icons = parseAgentIcons();
const senseRaw =
  argValue("--sense") ||
  (hasFlag("--vision") ? "vision" : null) ||
  process.env.AGENT_SENSE ||
  "ocr";
const sense = String(senseRaw).toLowerCase() === "vision" ||
  String(senseRaw).toLowerCase() === "image"
  ? "vision"
  : "ocr";
const visionWidth = argValue("--vision-width")
  ? Number(argValue("--vision-width"))
  : undefined;
const visionQuality = argValue("--vision-quality")
  ? Number(argValue("--vision-quality"))
  : undefined;
const baseLogDir = argValue("--log-dir") || join(SRC_ROOT, "logs", "agent");
const usageDir = argValue("--usage-dir") || join(SRC_ROOT, "usage");
const keyboardRegion = loadDeviceCfg().type?.keyboardRegion;

if (!prompt) {
  console.error("uso: npm run agent -- --prompt <texto|arquivo.md>");
  console.error("      (TTY) menu de modelos · --model ID · --force-model ID · --no-fallback · --all-models · --no-prompt");
  console.error("      --sense ocr|vision · --vision (atalho) · --engine all · --icons true · --no-icons");
  process.exit(2);
}
if (!serial) {
  console.error("falta serial (--device / ANDROID_SERIAL / device.config.json)");
  process.exit(2);
}

const models = await resolveModels();
const noFallback =
  Boolean(argValue("--force-model")) ||
  hasFlag("--no-fallback");
/** @type {object[]} */
const results = [];
let exitOk = true;

for (let i = 0; i < models.length; i++) {
  const m = models[i];
  const provider = resolveProvider({ provider: m.provider, model: m.id });
  requireKey(provider);
  const logDir =
    models.length > 1 ? join(baseLogDir, m.id) : baseLogDir;

  console.log(
    `\n======== [${i + 1}/${models.length}] ${m.id} (${provider}) ========`,
  );
  console.log(
    `runAgent serial=${serial} sense=${sense}` +
      (sense === "ocr" ? ` engine=${engine}` : "") +
      (sense === "ocr" && icons != null ? ` icons=${icons}` : "") +
      ` provider=${provider}` +
      ` model=${m.id}` +
      (noFallback ? " noFallback" : "") +
      ` maxSteps=${maxSteps}` +
      (historySteps != null ? ` historySteps=${historySteps}` : "") +
      ` logDir=${logDir}`,
  );

  const result = await runAgent({
    serial,
    prompt,
    maxSteps,
    historySteps,
    provider,
    model: m.id,
    noFallback: noFallback || undefined,
    sense,
    engine,
    icons,
    visionWidth,
    visionQuality,
    logDir,
    usageDir,
    keyboardRegion,
  });
  results.push({
    model: m.id,
    provider,
    status: result.status,
    steps: result.steps.length,
    logPath: result.logPath,
    usagePath: result.usagePath,
    usage: result.usage,
  });
  if (result.status !== "done") exitOk = false;
}

console.log(
  JSON.stringify(models.length === 1 ? results[0] : { runs: results }, null, 2),
);
process.exit(exitOk ? 0 : 1);
