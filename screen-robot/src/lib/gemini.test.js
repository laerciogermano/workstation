/**
 * Cliente Gemini — stub HTTP (sem rede).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateContent } from "./gemini.js";

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
      { fetch: fetchStub },
    );
    assert.equal(out.text, '{"ok":true}');
    assert.equal(out.usage.promptTokenCount, 5);
  });

  it("falha sem api key", async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await assert.rejects(
        () => generateContent({ prompt: "x" }, { fetch: async () => ({}) }),
        (e) => e.code === "GEMINI_NO_API_KEY",
      );
    } finally {
      if (prev != null) process.env.GEMINI_API_KEY = prev;
    }
  });
});
