/**
 * Cliente OpenAI — stub HTTP + usage normalizado.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateContent,
  normalizeUsage,
  DEFAULT_MODEL,
} from "./openai.js";

describe("openai", () => {
  it("generateContent parseia texto e usage", async () => {
    const fetchStub = async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.model, DEFAULT_MODEL);
      assert.equal(body.response_format.type, "json_object");
      assert.equal(body.messages[0].role, "system");
      assert.equal(body.messages[1].role, "user");
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":true}' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      };
    };
    const out = await generateContent(
      {
        prompt: "hi",
        system: "sys",
        apiKey: "test-key",
        json: true,
        model: DEFAULT_MODEL,
      },
      { fetch: fetchStub, log: () => {} },
    );
    assert.equal(out.text, '{"ok":true}');
    assert.equal(out.usage.promptTokenCount, 5);
    assert.equal(out.usage.candidatesTokenCount, 3);
    assert.equal(out.model, DEFAULT_MODEL);
    assert.ok(out.requests?.length);
    assert.equal(out.requests[0].response, '{"ok":true}');
  });

  it("429 espera try again in / piso 2s", async () => {
    let n = 0;
    const waits = [];
    const fetchStub = async () => {
      n += 1;
      if (n === 1) {
        return {
          ok: false,
          status: 429,
          json: async () => ({
            error: {
              message:
                "Rate limit reached for gpt-4o-mini. Please try again in 728ms.",
            },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
      };
    };
    const out = await generateContent(
      {
        prompt: "hi",
        apiKey: "k",
        retries: 2,
        retryMs: 2000,
      },
      {
        fetch: fetchStub,
        sleep: async (ms) => waits.push(ms),
        log: () => {},
      },
    );
    assert.equal(out.text, '{"ok":true}');
    assert.equal(waits[0], 2000);
  });

  it("falha sem api key", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await assert.rejects(
        () =>
          generateContent(
            { prompt: "x" },
            { fetch: async () => ({}), log: () => {} },
          ),
        (e) => e.code === "OPENAI_NO_API_KEY",
      );
    } finally {
      if (prev != null) process.env.OPENAI_API_KEY = prev;
    }
  });

  it("normalizeUsage mapeia campos OpenAI", () => {
    const u = normalizeUsage({
      prompt_tokens: 1,
      completion_tokens: 2,
      total_tokens: 3,
    });
    assert.equal(u.promptTokenCount, 1);
    assert.equal(u.candidatesTokenCount, 2);
    assert.equal(u.totalTokenCount, 3);
  });
});
