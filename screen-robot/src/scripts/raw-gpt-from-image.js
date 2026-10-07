#!/usr/bin/env node
/**
 * One-shot motor2: PNG → decideFromImage (extract + decideRawAction atual).
 * Não altera scripts/raw-gpt.js.
 *
 *   npm run raw-gpt:from-image -- --image test/fixtures/01-search.png --prompt test/fixtures/raw-gpt-decide.prompt.txt --step 1
 *   npm run raw-gpt:from-image -- --image test/fixtures/01-search.png --prompt test/fixtures/raw-gpt-decide.prompt.txt --step 1 --model gemini-3.8-flash
 *
 * --model: ids do catálogo lib/agent-models.js (OpenAI gpt-* / Gemini gemini-*).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_MODELS, providerForModel } from "../lib/agent-models.js";
import { loadEnvFiles } from "../lib/load-env.js";
import { decideFromImage } from "../lib/raw-gpt-from-image.js";
import { resolveRawGptModel } from "../lib/raw-gpt-decide.js";

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

const prompt = loadPrompt(argValue("--prompt"));
if (!prompt) {
  console.error("falta --prompt (texto ou path)");
  process.exit(1);
}
const imagePath = resolve(argValue("--image") || DEFAULT_IMAGE);
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const model = resolveRawGptModel(argValue("--model"));
const provider = providerForModel(model);
const needKey =
  provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
if (!process.env[needKey]) {
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

const out = await decideFromImage({
  imagePath,
  prompt,
  step,
  model,
  provider,
  engine,
  usageDir: join(SRC_ROOT, "usage-2.0"),
});
const u = out.usage || out.resposta?.usage || out.resposta?.usageMetadata;
console.log({
  imagePath,
  engine,
  model: out.model || model,
  provider: out.provider || provider,
  hits: out.elements.length,
  ocr: out.ocr,
  usagePath: out.usagePath,
  tokens: u
    ? {
        prompt: u.prompt_tokens ?? u.promptTokenCount,
        completion: u.completion_tokens ?? u.candidatesTokenCount,
        total: u.total_tokens ?? u.totalTokenCount,
      }
    : undefined,
});
console.log(out.payload);
process.stdout.write(
  JSON.stringify({ action: out.action, proximoPasso: out.proximoPasso }),
);
