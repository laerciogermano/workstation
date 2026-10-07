#!/usr/bin/env node
/**
 * Loop raw-gpt (motor2): AVD/serial → screenshot → decideFromImage → executeAction → wait → repeat.
 *
 *   npm run raw-gpt:loop -- --avd ConnectMax_Cam --prompt test/fixtures/raw-gpt-decide.prompt.txt
 *   npm run raw-gpt:loop -- --prompt test/fixtures/raw-gpt-decide.prompt.txt --step 1
 *   npm run raw-gpt:loop -- --avd ConnectMax_Cam --prompt "…" --step 1 --max-steps 40 --wait-ms 5000
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { executeAction } from "../lib/agent-run.js";
import { sleep } from "../lib/adb.js";
import { loadEnvFiles } from "../lib/load-env.js";
import { screenshot } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";
import { decideFromImage } from "../lib/raw-gpt-from-image.js";
import { resolveSerial } from "../lib/run-action.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
}

function loadPrompt(raw) {
  if (!raw) return null;
  const asPath = resolve(process.cwd(), raw);
  if (existsSync(asPath) && !raw.includes("\n")) {
    return readFileSync(asPath, "utf8").trim();
  }
  const fromSrc = resolve(SRC_ROOT, raw);
  if (existsSync(fromSrc) && !raw.includes("\n")) {
    return readFileSync(fromSrc, "utf8").trim();
  }
  return String(raw).trim();
}

function loadDeviceCfg() {
  try {
    return JSON.parse(readFileSync(join(SRC_ROOT, "device.config.json"), "utf8"));
  } catch {
    return {};
  }
}

if (!process.env.OPENAI_API_KEY) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

const deviceCfg = loadDeviceCfg();
const promptRaw = argValue("--prompt");
const prompt =
  loadPrompt(promptRaw) ||
  loadPrompt(join(SRC_ROOT, "test/fixtures/raw-gpt-decide.prompt.txt"));
if (!prompt) {
  console.error("falta --prompt (texto ou path)");
  process.exit(1);
}

const avd =
  argValue("--avd") ||
  (process.argv[2] && !String(process.argv[2]).startsWith("-")
    ? process.argv[2]
    : null) ||
  deviceCfg.provision?.name ||
  null;

let serial;
if (avd) {
  console.log(`provision AVD=${avd}`);
  const out = await provisionEmulator({
    provision: {
      name: avd,
      kind: "avd",
      connectTimeoutMs: deviceCfg.provision?.connectTimeoutMs ?? 120_000,
    },
  });
  serial = out.serial;
} else {
  serial = resolveSerial({
    device: argValue("--device") || argValue("--serial") || undefined,
  });
}

const model = argValue("--model") || process.env.OPENAI_MODEL || "gpt-4o-mini";
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const waitMs = Number(argValue("--wait-ms") || 5000);
const maxSteps = Number(argValue("--max-steps") || 50);
let step =
  argValue("--step") != null && String(argValue("--step")).trim() !== ""
    ? String(argValue("--step")).trim()
    : "1";

const shotDir = join(SRC_ROOT, "screenshots", "raw-gpt-loop");
const usageDir = join(SRC_ROOT, "usage-2.0");
mkdirSync(shotDir, { recursive: true });
mkdirSync(usageDir, { recursive: true });

console.log(
  JSON.stringify(
    { avd: avd || undefined, serial, model, engine, waitMs, maxSteps, step },
    null,
    2,
  ),
);

for (let i = 1; i <= maxSteps; i++) {
  const imagePath = join(shotDir, `step-${String(i).padStart(3, "0")}.png`);
  screenshot({ serial, path: imagePath });
  console.log(`\n#${i} shot ${imagePath} step=${step}`);

  const out = await decideFromImage({
    imagePath,
    prompt,
    step,
    model,
    engine,
    usageDir,
  });

  const { action, proximoPasso, ocr, usagePath, resposta } = out;
  const u = resposta?.usage;
  console.log(
    JSON.stringify(
      {
        action,
        proximoPasso,
        ocrHits: ocr?.length,
        step,
        usagePath,
        tokens: u
          ? {
              prompt: u.prompt_tokens,
              completion: u.completion_tokens,
              total: u.total_tokens,
            }
          : undefined,
      },
      null,
      2,
    ),
  );

  if (!action?.type) {
    console.error("sem action");
    process.exit(1);
  }

  const result = await executeAction({
    serial,
    acao: action,
    engine,
    keyboardRegion: deviceCfg.type?.keyboardRegion,
  });
  console.log({ executed: result });

  if (action.type === "done" || action.type === "fail") {
    console.log(`fim: ${action.type}`);
    break;
  }

  if (proximoPasso != null && String(proximoPasso).trim()) {
    step = String(proximoPasso).trim();
  }

  console.log(`wait ${waitMs}ms…`);
  await sleep(waitMs);
}

console.log("loop encerrado");
