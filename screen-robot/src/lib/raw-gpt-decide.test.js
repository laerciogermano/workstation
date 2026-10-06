/**
 * raw-gpt: um caso por tela (PNG + .prompt.txt em fixtures) + OpenAI real.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";
import { loadEnvFiles } from "./load-env.js";
import { decideRawAction, parseActionTypeXY } from "./raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, "..");
const FIXTURES = join(SRC_ROOT, "test/fixtures");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

function readPrompt(name) {
  return readFileSync(join(FIXTURES, name), "utf8").trim();
}

async function runCase({ image, promptFile, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  const prompt = readPrompt(promptFile);
  assert.ok(prompt.length >= 1, `prompt vazio: ${promptFile}`);

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt, ocr });
  const action = { type: out.type, x: out.x, y: out.y };
  assert.deepEqual(action, expected);
  assert.deepEqual(Object.keys(parseActionTypeXY(out.raw)).sort(), [
    "type",
    "x",
    "y",
  ]);
}

describe("raw-gpt-decide", () => {
  it(
    "LinkedIn People/Connect → tap Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-people-comprador-connect.png",
        promptFile: "linkedin-people-comprador-connect.prompt.txt",
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "Android tela inicial → tap data",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "android-tela-inicial.png",
        promptFile: "android-tela-inicial.prompt.txt",
        expected: { type: "tap", x: 272, y: 118 },
      });
    },
  );
});
