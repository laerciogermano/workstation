#!/usr/bin/env node
/**
 * Extract (lib) num PNG LinkedIn → chat.completions cru (system = agente + JSON action).
 *
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png --prompt "conecte no comprador" --step 11
 *   npm run raw-gpt -- --engine all --prompt "conecte no comprador" --step "digite comprador"
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";
import { compactOcr } from "../lib/agent-decide.js";
import { extractFromImage } from "../lib/extract-engines.js";
import { decideRawAction } from "../lib/raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const DEFAULT_IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
}

const prompt = argValue("--prompt");
if (!prompt) {
  console.error("falta --prompt");
  process.exit(1);
}
const imagePath = resolve(argValue("--image") || DEFAULT_IMAGE);
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const stepRaw = argValue("--step");
const step =
  stepRaw != null && String(stepRaw).trim() !== ""
    ? String(stepRaw).trim()
    : undefined;

if (!existsSync(imagePath)) {
  console.error(`PNG não encontrado: ${imagePath}`);
  process.exit(1);
}

const elements = await extractFromImage(imagePath, {
  engine,
  timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
});
const ocr = compactOcr(elements);
console.log({ imagePath, engine, hits: elements.length, ocr });

const out = await decideRawAction({
  prompt,
  ocr,
  step,
  apiKey,
  model,
  usageDir: join(SRC_ROOT, "usage-2.0"),
});
console.log(out.payload);
const { raw, payload, resposta, usagePath, ...action } = out;
console.log({
  usagePath,
  tokens: resposta?.usage
    ? {
        prompt: resposta.usage.prompt_tokens,
        completion: resposta.usage.completion_tokens,
        total: resposta.usage.total_tokens,
      }
    : undefined,
});
process.stdout.write(JSON.stringify(action));
