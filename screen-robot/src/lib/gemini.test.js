/**
 * Cliente Gemini — stub HTTP + retry + fallback de modelo.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateContent,
  isRetryable,
  isModelUnavailable,
  resolveModelChain,
  DEFAULT_MODEL,
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
      {
        prompt: "hi",
        apiKey: "test-key",
        json: true,
        model: DEFAULT_MODEL,
        fallbackModels: [],
      },
      { fetch: fetchStub, log: () => {} },
    );
    assert.equal(out.text, '{"ok":true}');
    assert.equal(out.usage.promptTokenCount, 5);
    assert.equal(out.model, DEFAULT_MODEL);
    assert.ok(out.requests?.length);
    assert.equal(out.requests[0].prompt, "hi");
    assert.equal(out.requests[0].response, '{"ok":true}');
    assert.equal(out.requests[0].input.prompt, "hi");
    assert.equal(out.requests[0].output.text, '{"ok":true}');
    assert.ok(out.requests[0].output.raw);
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

  it("resolveModelChain: sem fallbacks = só o primary", () => {
    assert.equal(DEFAULT_MODEL, "gemini-3.5-flash-lite");
    assert.deepEqual(resolveModelChain(DEFAULT_MODEL), [
      "gemini-3.5-flash-lite",
    ]);
    assert.deepEqual(resolveModelChain("gemini-3.1-flash-lite", []), [
      "gemini-3.1-flash-lite",
    ]);
    const c = resolveModelChain("gemini-3.8-flash", ["gemini-3.1-flash-lite"]);
    assert.equal(c[0], "gemini-3.8-flash");
    assert.ok(c.includes("gemini-3.1-flash-lite"));
  });

  it("high demand com fallback desce na hora (não retria o mesmo)", async () => {
    const modelsHit = [];
    const fetchStub = async (url) => {
      const m = decodeURIComponent(String(url).match(/models\/([^:]+)/)?.[1]);
      modelsHit.push(m);
      if (m.includes("3.8")) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: { message: "high demand" } }),
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
        fallbackModels: ["gemini-3.1-flash-lite"],
        retries: 2,
      },
      { fetch: fetchStub, sleep: async () => {}, log: () => {} },
    );
    assert.equal(out.model, "gemini-3.1-flash-lite");
    assert.deepEqual(modelsHit, ["gemini-3.8-flash", "gemini-3.1-flash-lite"]);
  });

  it("último da cadeia: 1 falha e para (sem retry no mesmo id)", async () => {
    const modelsHit = [];
    const fetchStub = async (url) => {
      const m = decodeURIComponent(String(url).match(/models\/([^:]+)/)?.[1]);
      modelsHit.push(m);
      return {
        ok: false,
        status: 503,
        json: async () => ({ error: { message: "high demand" } }),
      };
    };
    await assert.rejects(
      () =>
        generateContent(
          {
            prompt: "hi",
            apiKey: "k",
            model: "gemini-3.8-flash",
            fallbackModels: [],
            chainRounds: 1,
          },
          { fetch: fetchStub, sleep: async () => {}, log: () => {} },
        ),
      (e) => e.code === "GEMINI_REQUEST_FAILED",
    );
    assert.deepEqual(modelsHit, ["gemini-3.8-flash"]);
  });

  it("isModelUnavailable detecta 404 / no longer available", () => {
    assert.equal(isModelUnavailable(404, "no longer available"), true);
    assert.equal(isModelUnavailable(400, "bad"), false);
  });

  it("fallback quando modelo 404 no longer available", async () => {
    const modelsHit = [];
    const fetchStub = async (url) => {
      const m = decodeURIComponent(String(url).match(/models\/([^:]+)/)?.[1]);
      modelsHit.push(m);
      if (m.includes("2.5")) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            error: { message: "This model is no longer available to new users" },
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
        model: "gemini-2.5-flash",
        fallbackModels: ["gemini-3.1-flash-lite"],
        retries: 0,
      },
      { fetch: fetchStub, sleep: async () => {}, log: () => {} },
    );
    assert.equal(out.model, "gemini-3.1-flash-lite");
    assert.deepEqual(modelsHit, ["gemini-2.5-flash", "gemini-3.1-flash-lite"]);
  });
});
