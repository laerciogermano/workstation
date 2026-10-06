/**
 * raw-gpt: chamada direta OpenAI — mesmo prompt → { type, x, y }.
 * Requer OPENAI_API_KEY (.env).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { compactOcr } from "./agent-decide.js";
import { loadEnvFiles } from "./load-env.js";
import {
  DEFAULT_PROMPT,
  decideRawAction,
  parseActionTypeXY,
} from "./raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const OCR_FIXTURE = join(
  __dirname,
  "../test/fixtures/agent-ocr-people-connect.json",
);

describe("raw-gpt-decide", () => {
  it("OpenAI real: mesmo prompt/OCR → action { type, x, y }", async () => {
    assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");

    const ocr = compactOcr(JSON.parse(readFileSync(OCR_FIXTURE, "utf8")));
    const out = await decideRawAction({ prompt: DEFAULT_PROMPT, ocr });

    const action = { type: out.type, x: out.x, y: out.y };
    assert.deepEqual(Object.keys(action).sort(), ["type", "x", "y"]);
    assert.equal("motivo" in out, false);
    assert.equal(action.type, "tap");
    assert.ok(Number.isFinite(action.x), `x inválido: ${action.x}`);
    assert.ok(Number.isFinite(action.y), `y inválido: ${action.y}`);

    const connects = ocr.filter((e) => /connect/i.test(String(e.text || "")));
    assert.ok(connects.length >= 1, "fixture sem Connect");
    const near = connects.some(
      (c) => Math.hypot(c.x - action.x, c.y - action.y) <= 48,
    );
    assert.ok(
      near,
      `tap (${action.x},${action.y}) longe de Connect: ${JSON.stringify(connects)}`,
    );

    assert.deepEqual(Object.keys(parseActionTypeXY(out.raw)).sort(), [
      "type",
      "x",
      "y",
    ]);
  });
});
