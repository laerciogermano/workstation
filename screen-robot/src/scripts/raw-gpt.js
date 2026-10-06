#!/usr/bin/env node
/**
 * Chamada crua chat.completions + PNG via lib (compressFrame + buildUserContent).
 * Default: fixture LinkedIn (print).
 *
 *   npm run raw-gpt
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png
 *   npm run raw-gpt -- --prompt "liste os botões" --image …
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";
import { buildUserContent, sanitizeMessagesForLog } from "../lib/openai.js";
import { compressFrame } from "../lib/vision-frame.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const DEFAULT_IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-tela-inicial.png",
);
const DEFAULT_PROMPT =
  "Extraia o que aparece nesta tela do LinkedIn (textos, botões, seções).";

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
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!existsSync(imagePath)) {
  console.error(`PNG não encontrado: ${imagePath}`);
  process.exit(1);
}

const frame = await compressFrame(imagePath);
const content = buildUserContent(prompt, [
  { mimeType: frame.mimeType, base64: frame.base64 },
]);

const payload = {
  model,
  messages: [{ role: "user", content }],
};

console.log(sanitizeMessagesForLog(payload.messages));
console.log({
  imagePath,
  original: frame.original,
  compressed: { width: frame.width, height: frame.height, bytes: frame.outputBytes },
});

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
