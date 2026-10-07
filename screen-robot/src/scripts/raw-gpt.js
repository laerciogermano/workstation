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
import { decideFromImage } from "../lib/raw-gpt-decide.js";

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

const out = await decideFromImage({
  imagePath,
  prompt,
  step,
  apiKey,
  model,
  engine,
});
console.log({
  imagePath,
  engine,
  hits: out.elements.length,
  ocr: out.ocr,
});
console.log(out.payload);
const { raw, payload, ocr, elements, ...action } = out;
process.stdout.write(JSON.stringify(action));
