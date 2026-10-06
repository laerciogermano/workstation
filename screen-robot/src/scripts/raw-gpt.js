#!/usr/bin/env node
/**
 * Extract (lib) num PNG LinkedIn → chat.completions cru com o OCR no prompt.
 *
 *   npm run raw-gpt
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png
 *   npm run raw-gpt -- --engine macos-vision --prompt "o que fazer?"
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";
import { compactOcr } from "../lib/agent-decide.js";
import { extractFromImage } from "../lib/extract-engines.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const DEFAULT_IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);
const DEFAULT_PROMPT =
  "Com base neste OCR da tela LinkedIn, diga o que aparece e o próximo passo.";

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

const prompt = argValue("--prompt") || DEFAULT_PROMPT;
const imagePath = resolve(argValue("--image") || DEFAULT_IMAGE);
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "macos-vision";
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!existsSync(imagePath)) {
  console.error(`PNG não encontrado: ${imagePath}`);
  process.exit(1);
}

const elements = await extractFromImage(imagePath, { engine });
const ocr = compactOcr(elements);
console.log({ imagePath, engine, hits: elements.length, ocr });

const userText = `${prompt}\n\nOCR:\n${JSON.stringify(ocr)}`;
const payload = {
  model,
  messages: [{ role: "user", content: userText }],
};
console.log(payload);

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await res.json();
if (!res.ok) {
  console.error(data?.error?.message || JSON.stringify(data));
  process.exit(1);
}

process.stdout.write(String(data.choices?.[0]?.message?.content ?? ""));
