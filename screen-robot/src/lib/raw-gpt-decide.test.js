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

const PROMPT_PATH = "raw-gpt-decide.prompt.txt";

async function runCase({ image, prompt, step, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  const promptText = readFileSync(join(FIXTURES, prompt), "utf8").trim();
  assert.ok(promptText.length >= 1, `prompt vazio: ${prompt}`);

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt: promptText, ocr, step });
  const action = parseActionTypeXY(out.raw);

  console.log({ step, action });
  assert.deepEqual(action, expected);
}

describe("raw-gpt-decide", () => {
  it(
    "LinkedIn People/Connect (passo 11) → tap Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-people-comprador-connect.png",
        prompt: PROMPT_PATH,
        step: 11,
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "LinkedIn tela inicial (passo 11) → scroll|sleep",
    { timeout: 300_000 },
    async () => {
      assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
      const promptText = readFileSync(
        join(FIXTURES, PROMPT_PATH),
        "utf8",
      ).trim();
      const elements = await extractFromImage(
        join(FIXTURES, "linkedin-tela-inicial.png"),
        {
          engine: "all",
          timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
        },
      );
      const ocr = compactOcr(elements);
      const out = await decideRawAction({
        prompt: promptText,
        ocr,
        step: 11,
      });
      const action = parseActionTypeXY(out.raw);
      console.log({ step: 11, action });
      assert.ok(
        action.type === "scroll" || action.type === "sleep",
        `esperado scroll|sleep (sem Connect na login), veio ${action.type}`,
      );
      if (action.type === "scroll") {
        assert.equal(action.direction, "down");
      }
    },
  );
});
