/**
 * raw-gpt: um caso por tela (PNG em fixtures) + mesmo prompt + OpenAI real.
 * Prompt único: test/fixtures/raw-gpt-decide.prompt.txt
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

const PROMPT = readFileSync(
  join(FIXTURES, "raw-gpt-decide.prompt.txt"),
  "utf8",
).trim();

async function runCase({ image, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  assert.ok(PROMPT.length >= 1, "prompt fixture vazio");

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt: PROMPT, ocr });
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
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "Android tela inicial → mesma jornada",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "android-tela-inicial.png",
        expected: { type: "scroll", x: null, y: null },
      });
    },
  );
});
