/**
 * Cliente Gemini — stub HTTP + retry + fallback de modelo.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateContent,
  isRetryable,
  resolveModelChain,
} from "./gemini.js";

describe("gemini", () => {
  it("generateContent parseia texto e usage", async () => {
    const fetchStub = async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '{"ok":true}' }] } },
        ],
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
      }),
    });
    const out = await generateContent(
      { prompt: "hi", apiKey: "test-key", json: true },
      { fetch: fetchStub, log: () => {} },
    );
    assert.equal(out.text, '{"ok":true}');
    assert.equal(out.usage.promptTokenCount, 5);
    assert.equal(out.model, "gemini-3.8-flash");
  });

  it("falha sem api key", async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await assert.rejects(
        () =>
          generateContent(
            { prompt: "x" },
            { fetch: async () => ({}), log: () => {} },
          ),
        (e) => e.code === "GEMINI_NO_API_KEY",
      );
    } finally {
      if (prev != null) process.env.GEMINI_API_KEY = prev;
    }
  });

  it("isRetryable detecta high demand", () => {
    assert.equal(isRetryable(503, "high demand"), true);
    assert.equal(isRetryable(429, "quota"), true);
    assert.equal(isRetryable(400, "bad request"), false);
  });

  it("resolveModelChain coloca primary primeiro", () => {
    const c = resolveModelChain("gemini-3.8-flash", ["gemini-3-flash"]);
    assert.equal(c[0], "gemini-3.8-flash");
    assert.ok(c.includes("gemini-3-flash"));
  });

  it("retry em high demand e depois ok", async () => {
    let n = 0;
    const sleeps = [];
    const fetchStub = async () => {
      n += 1;
      if (n === 1) {
        return {
          ok: false,
          status: 503,
          statusText: "Unavailable",
          json: async () => ({
            error: {
              message:
                "This model is currently experiencing high demand. Please try again later.",
            },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"acao":1}' }] } }],
        }),
      };
    };
    const out = await generateContent(
      {
        prompt: "hi",
        apiKey: "k",
        retries: 2,
        retryMs: 10,
        fallbackModels: [],
      },
      {
        fetch: fetchStub,
        sleep: async (ms) => sleeps.push(ms),
        log: () => {},
      },
    );
    assert.equal(n, 2);
    assert.equal(sleeps.length, 1);
    assert.equal(out.text, '{"acao":1}');
  });

  it("fallback para outro modelo após high demand", async () => {
    const modelsHit = [];
    const fetchStub = async (url) => {
      const m = String(url).match(/models\/([^:]+)/)?.[1];
      modelsHit.push(decodeURIComponent(m));
      if (m.includes("3.8")) {
        return {
          ok: false,
          status: 503,
          json: async () => ({
            error: { message: "high demand" },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        }),
      };
    };
    const out = await generateContent(
      {
        prompt: "hi",
        apiKey: "k",
        model: "gemini-3.8-flash",
        fallbackModels: ["gemini-3-flash"],
        retries: 0,
        retryMs: 1,
      },
      { fetch: fetchStub, sleep: async () => {}, log: () => {} },
    );
    assert.equal(out.model, "gemini-3-flash");
    assert.ok(modelsHit.includes("gemini-3.8-flash"));
    assert.ok(modelsHit.includes("gemini-3-flash"));
  });
});
