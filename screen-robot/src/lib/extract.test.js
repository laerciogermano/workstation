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
  it("enriquece árvore a cada chamada via frame→OCR", async () => {
    const extract = createExtract("s", {
      captureFrame: async () => "/tmp/fake.png",
      ocrRecognize: async () => WORDS,
      frameSize: { w: 1080, h: 2400 },
    });
    const t1 = await extract();
    assert.equal(t1.type, "root");
    assert.ok(t1.children.some((c) => c.type === "text" && c.text === "Entrar"));

    const t2 = await extract();
    assert.equal(t2.children[0]?.type, "other");

    const types = [];
    const walk = (n) => {
      types.push(n.type);
      (n.children || []).forEach(walk);
    };

    const t3 = await extract();
    walk(t3);
    assert.ok(types.includes("icon"));

    const types4 = [];
    const w4 = (n) => {
      types4.push(n.type);
      (n.children || []).forEach(w4);
    };
    const t4 = await extract();
    w4(t4);
    assert.ok(types4.includes("list"));

    const types5 = [];
    const w5 = (n) => {
      types5.push(n.type);
      (n.children || []).forEach(w5);
    };
    const t5 = await extract();
    w5(t5);
    assert.ok(types5.includes("image"));
  });
});
