/**
 * Unitário — extract.js createExtract (OCR/frame stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createExtract } from "./extract.js";

const WORDS = [
  {
    text: "Entrar",
    bounds: { x: 100, y: 1800, w: 800, h: 100 },
    confidence: 90,
  },
  {
    text: "Item1",
    bounds: { x: 40, y: 1200, w: 200, h: 40 },
    confidence: 88,
  },
  {
    text: "Item2",
    bounds: { x: 40, y: 1280, w: 200, h: 40 },
    confidence: 88,
  },
  {
    text: "Item3",
    bounds: { x: 40, y: 1360, w: 200, h: 40 },
    confidence: 88,
  },
];

describe("createExtract (OCR)", () => {
  it("enriquece lista plana a cada chamada via frame→OCR", async () => {
    const extract = createExtract("s", {
      captureFrame: async () => "/tmp/fake.png",
      ocrRecognize: async () => WORDS,
      frameSize: { w: 1080, h: 2400 },
    });
    const t1 = await extract();
    assert.ok(Array.isArray(t1));
    assert.ok(t1.some((c) => c.type === "text" && c.text === "Entrar"));
    assert.equal(t1.every((e) => e.children === undefined), true);

    const t2 = await extract();
    assert.ok(t2.some((e) => e.type === "other"));

    const t3 = await extract();
    assert.ok(t3.some((e) => e.type === "icon"));

    const t4 = await extract();
    assert.ok(t4.some((e) => e.type === "list"));

    const t5 = await extract();
    assert.ok(t5.some((e) => e.type === "image"));
    assert.ok(t5.every((e) => Array.isArray(e.center) && e.center.length === 2));
  });
});
