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

async function runCase({ image, prompt, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  const promptText = readFileSync(join(FIXTURES, prompt), "utf8").trim();
  assert.ok(promptText.length >= 1, `prompt vazio: ${prompt}`);

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt: promptText, ocr });
  const action = {
    type: out.type,
    x: out.x,
    y: out.y,
    direction: out.direction,
  };

  console.log({ action });
  assert.deepEqual(action, expected);
  assert.deepEqual(Object.keys(parseActionTypeXY(out.raw)).sort(), [
    "direction",
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
        prompt: PROMPT_PATH,
        expected: { type: "tap", x: 455, y: 344, direction: null },
      });
    },
  );

  it(
    "Android tela inicial → mesma jornada",
    { timeout: 300_000 },
    async () => {
      assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
      const promptText = readFileSync(
        join(FIXTURES, PROMPT_PATH),
        "utf8",
      ).trim();
      const elements = await extractFromImage(
        join(FIXTURES, "android-tela-inicial.png"),
        {
          engine: "all",
          timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
        },
      );
      const ocr = compactOcr(elements);
      const out = await decideRawAction({ prompt: promptText, ocr });
      const action = {
        type: out.type,
        x: out.x,
        y: out.y,
        direction: out.direction,
      };
      console.log({ action });
      assert.ok(
        action.type === "scroll" || action.type === "sleep",
        `esperado scroll|sleep, veio ${action.type}`,
      );
      if (action.type === "scroll") {
        assert.ok(
          ["up", "down", "left", "right"].includes(action.direction),
          `scroll sem direction válida: ${action.direction}`,
        );
        assert.equal(action.x, null);
        assert.equal(action.y, null);
      }
    },
  );
});
