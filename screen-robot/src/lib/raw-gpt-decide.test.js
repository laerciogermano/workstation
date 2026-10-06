/**
 * raw-gpt: extract PNG + OpenAI real (sem mock) — espelha:
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png \
 *     --engine all --prompt "se estiver na tela do comprador..."
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";
import { loadEnvFiles } from "./load-env.js";
import { decideRawAction, parseActionTypeXY } from "./raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);
const PROMPT =
  "se estiver na tela do comprador e com o people selecionado, entao eve buscar o botao connect para poder clicar";

describe("raw-gpt-decide", () => {
  it(
    "OpenAI real: image+engine all+prompt → action tap Connect",
    { timeout: 300_000 },
    async () => {
      assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");

      const elements = await extractFromImage(IMAGE, {
        engine: "all",
        timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
      });
      const ocr = compactOcr(elements);
      assert.ok(ocr.length >= 1, "OCR vazio");

      const out = await decideRawAction({ prompt: PROMPT, ocr });
      const action = { type: out.type, x: out.x, y: out.y };

      assert.deepEqual(action, { type: "tap", x: 455, y: 344 });
      assert.equal("motivo" in out, false);
      assert.deepEqual(Object.keys(parseActionTypeXY(out.raw)).sort(), [
        "type",
        "x",
        "y",
      ]);
    },
  );
});
