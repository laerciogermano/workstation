/**
 * Unit: decideRawAction roteia OpenAI vs Gemini pelo --model / id.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { decideRawAction, resolveRawGptModel } from "./raw-gpt-decide.js";

describe("raw-gpt-decide provider", () => {
  it("resolveRawGptModel: default gpt-4o-mini", () => {
    const prev = {
      RAW_GPT_MODEL: process.env.RAW_GPT_MODEL,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    };
    delete process.env.RAW_GPT_MODEL;
    delete process.env.OPENAI_MODEL;
    delete process.env.GEMINI_MODEL;
    try {
      assert.equal(resolveRawGptModel(), "gpt-4o-mini");
      assert.equal(resolveRawGptModel("gemini-3.8-flash"), "gemini-3.8-flash");
    } finally {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it("decideRawAction: gpt-* chama generateContent openai", async () => {
    const usageDir = mkdtempSync(join(tmpdir(), "raw-gpt-"));
    /** @type {object[]} */
    const seen = [];
    try {
      const out = await decideRawAction(
        {
          prompt: "jornada",
          ocr: [{ type: "text", text: "Search", x: 1, y: 2 }],
          step: "1",
          model: "gpt-4o-mini",
          apiKey: "sk-test",
          usageDir,
        },
        {
          generateContent: async (opts) => {
            seen.push(opts);
            return {
              text: JSON.stringify({
                action: { type: "tap", x: 1, y: 2 },
                proximoPasso: "2",
              }),
              model: opts.model,
              usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
              requests: [
                {
                  entrada: { model: opts.model },
                  resposta: { ok: true },
                  usage: { prompt_tokens: 1 },
                },
              ],
            };
          },
        },
      );
      assert.equal(seen.length, 1);
      assert.equal(seen[0].model, "gpt-4o-mini");
      assert.equal(out.provider, "openai");
      assert.equal(out.type, "tap");
      assert.equal(out.x, 1);
      assert.equal(out.proximoPasso, "2");
      assert.equal(out.usage?.prompt_tokens, 1);
    } finally {
      rmSync(usageDir, { recursive: true, force: true });
    }
  });

  it("decideRawAction: gemini-* chama generateContent gemini", async () => {
    const usageDir = mkdtempSync(join(tmpdir(), "raw-gpt-"));
    /** @type {object[]} */
    const seen = [];
    try {
      const out = await decideRawAction(
        {
          prompt: "jornada",
          ocr: [{ type: "text", text: "Search", x: 10, y: 20 }],
          step: "1",
          model: "gemini-3.8-flash",
          apiKey: "gem-test",
          usageDir,
        },
        {
          generateContent: async (opts) => {
            seen.push(opts);
            return {
              text: JSON.stringify({
                action: { type: "sleep", ms: 500 },
                proximoPasso: "1",
              }),
              model: opts.model,
              usage: {
                promptTokenCount: 4,
                candidatesTokenCount: 5,
                totalTokenCount: 9,
              },
              requests: [
                {
                  entrada: { model: opts.model },
                  resposta: { candidates: [] },
                },
              ],
            };
          },
        },
      );
      assert.equal(seen[0].model, "gemini-3.8-flash");
      assert.equal(out.provider, "gemini");
      assert.equal(out.type, "esperar");
      assert.equal(out.ms, 500);
      assert.equal(out.usage?.prompt_tokens, 4);
      assert.equal(out.usage?.total_tokens, 9);
    } finally {
      rmSync(usageDir, { recursive: true, force: true });
    }
  });
});
