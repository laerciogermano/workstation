#!/usr/bin/env node
/**
 * Loop gpt-4o-mini: screenshot → decideFromImage → executeAction → wait 5s → repeat.
 *
 *   npm run raw-gpt:loop -- --prompt test/fixtures/raw-gpt-decide.prompt.txt --step 1
 *   npm run raw-gpt:loop -- --prompt "…" --step 1 --max-steps 40 --wait-ms 5000
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { executeAction } from "../lib/agent-run.js";
import { sleep } from "../lib/adb.js";
import { loadEnvFiles } from "../lib/load-env.js";
import { screenshot } from "../lib/operate.js";
import {
  DEFAULT_SYSTEM,
  DEFAULT_USER_RULES,
  decideFromImage,
} from "../lib/raw-gpt-decide.js";
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

if (!process.env.OPENAI_API_KEY) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

const promptRaw = argValue("--prompt");
const journey = loadPrompt(promptRaw);
if (!journey) {
  console.error("falta --prompt (texto ou path)");
  process.exit(1);
}

const serial = resolveSerial({
  device: argValue("--device") || argValue("--serial") || undefined,
});
const model = argValue("--model") || process.env.OPENAI_MODEL || "gpt-4o-mini";
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const waitMs = Number(argValue("--wait-ms") || 5000);
const maxSteps = Number(argValue("--max-steps") || 50);
let step =
  argValue("--step") != null && String(argValue("--step")).trim() !== ""
    ? String(argValue("--step")).trim()
    : "1";

const shotDir = join(SRC_ROOT, "screenshots", "raw-gpt-loop");
mkdirSync(shotDir, { recursive: true });

console.log(
  JSON.stringify({ serial, model, engine, waitMs, maxSteps, step }, null, 2),
);

for (let i = 1; i <= maxSteps; i++) {
  const imagePath = join(shotDir, `step-${String(i).padStart(3, "0")}.png`);
  screenshot({ serial, path: imagePath });
  console.log(`\n#${i} shot ${imagePath} step=${step}`);

  const out = await decideFromImage({
    imagePath,
    system: DEFAULT_SYSTEM,
    user: {
      journey,
      step,
      rules: DEFAULT_USER_RULES,
    },
    model,
    engine,
  });

  const { action, nextStep, ocr } = out;
  console.log(
    JSON.stringify(
      { action, nextStep, ocrHits: ocr?.length, step },
      null,
      2,
    ),
  );

  if (!action?.type) {
    console.error("sem action");
    process.exit(1);
  }

  const result = await executeAction({ serial, acao: action });
  console.log({ executed: result });

  if (action.type === "done" || action.type === "fail") {
    console.log(`fim: ${action.type}`);
    break;
  }

  if (nextStep != null && String(nextStep).trim()) {
    step = String(nextStep).trim();
  }

  console.log(`wait ${waitMs}ms…`);
  await sleep(waitMs);
}

console.log("loop encerrado");
