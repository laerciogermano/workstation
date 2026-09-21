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
];

describe("createExtract (OCR)", () => {
  it("devolve só textos (type=text) a cada chamada", async () => {
    const extract = createExtract("s", {
      captureFrame: async () => "/tmp/fake.png",
      ocrRecognize: async () => WORDS,
      frameSize: { w: 1080, h: 2400 },
    });
    const t1 = await extract();
    assert.ok(Array.isArray(t1));
    assert.equal(t1.length, 2);
    assert.ok(t1.every((e) => e.type === "text"));
    assert.ok(t1.some((c) => c.text === "Entrar"));
    assert.equal(t1.every((e) => e.children === undefined), true);

    const t2 = await extract();
    assert.equal(t2.length, t1.length);
    assert.ok(t2.every((e) => e.type === "text"));
    assert.ok(t2.every((e) => Array.isArray(e.center) && e.center.length === 2));
  });
});
