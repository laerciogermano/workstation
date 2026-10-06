/**
 * raw-gpt: um caso por tela (PNG em fixtures) + mesmo prompt + OpenAI real.
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

async function runCase({ image, prompt, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  assert.ok(prompt.length >= 1, "prompt vazio");

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt, ocr });
  const action = parseActionTypeXY(out.raw);

  console.log({ action });
  assert.deepEqual(action, expected);
}

describe("raw-gpt-decide", () => {
  it(
    "LinkedIn People/Connect → tap Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-people-comprador-connect.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "LinkedIn tela inicial → passo 1",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-tela-inicial.png",
        prompt: PROMPT + "\nvoce esta no passo 1",
        expected: { type: "tap", x: 177, y: 78 },
      });
    },
  );
});
