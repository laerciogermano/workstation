#!/usr/bin/env node
/**
 * Extract (lib) num PNG LinkedIn → OpenAI/Gemini cru (system = agente + JSON action).
 *
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png --prompt "conecte no comprador" --step 11
 *   npm run raw-gpt -- --engine all --prompt "conecte no comprador" --step "digite comprador" --model gpt-4o-mini
 *   npm run raw-gpt -- --prompt "…" --step 1 --model gemini-3.8-flash
 *
 * --model: ids do catálogo lib/agent-models.js (OpenAI gpt-* / Gemini gemini-*).
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_MODELS, providerForModel } from "../lib/agent-models.js";
import { loadEnvFiles } from "../lib/load-env.js";
import { compactOcr } from "../lib/agent-decide.js";
import { extractFromImage } from "../lib/extract-engines.js";
import { decideRawAction, resolveRawGptModel } from "../lib/raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const DEFAULT_IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);

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
const model = resolveRawGptModel(argValue("--model"));
const provider = providerForModel(model);
const needKey =
  provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
const apiKey = process.env[needKey];
if (!apiKey) {
  console.error(`falta ${needKey} (model=${model})`);
  console.error(
    `modelos: ${AGENT_MODELS.map((m) => `${m.id} (${m.provider})`).join(", ")}`,
  );
  process.exit(1);
}
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
console.log({ imagePath, engine, model, provider, hits: elements.length, ocr });

const out = await decideRawAction({
  prompt,
  ocr,
  step,
  apiKey,
  model,
  provider,
  usageDir: join(SRC_ROOT, "usage-2.0"),
});
console.log(out.payload);
const { raw, payload, resposta, usage, usagePath, ...action } = out;
const u = usage || resposta?.usage || resposta?.usageMetadata;
console.log({
  usagePath,
  model: out.model || model,
  provider: out.provider || provider,
  tokens: u
    ? {
        prompt: u.prompt_tokens ?? u.promptTokenCount,
        completion: u.completion_tokens ?? u.candidatesTokenCount,
        total: u.total_tokens ?? u.totalTokenCount,
      }
    : undefined,
});
process.stdout.write(JSON.stringify(action));
