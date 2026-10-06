/**
 * Unitário — extract.js extract (OCR/frame stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extract } from "./extract.js";

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

describe("extract (OCR)", () => {
  it("icons=false (default): só textos", async () => {
    const deps = {
      captureFrame: async () => "/tmp/fake.png",
      ocrRecognize: async () => WORDS,
      detectIcons: async () => [{ type: "icon", x: 80, y: 140 }],
    };
    const t1 = await extract({ serial: "s" }, deps);
    assert.equal(t1.length, 2);
    assert.ok(t1.every((e) => e.type === "text"));
  });

  it("icons=true: textos + ícones (deps.detectIcons)", async () => {
    const deps = {
      captureFrame: async () => "/tmp/fake.png",
      ocrRecognize: async () => WORDS,
      detectIcons: async () => [{ type: "icon", x: 80, y: 140 }],
    };
    const t1 = await extract({ serial: "s", icons: true }, deps);
    assert.ok(Array.isArray(t1));
    assert.equal(t1.length, 3);
    const texts = t1.filter((e) => e.type === "text");
    const icons = t1.filter((e) => e.type === "icon");
    assert.equal(texts.length, 2);
    assert.equal(icons.length, 1);
    assert.ok(t1.some((c) => c.text === "Entrar"));
    assert.equal(t1.every((e) => e.children === undefined), true);
    assert.equal(icons[0].text, undefined);
    assert.equal(icons[0].x, 80);
    assert.equal(icons[0].y, 140);

    const t2 = await extract({ serial: "s", icons: true }, deps);
    assert.equal(t2.length, t1.length);
    assert.ok(t2.every((e) => typeof e.x === "number" && typeof e.y === "number"));
    assert.ok(t2.every((e) => e.bounds === undefined && e.center === undefined));
    assert.equal(t2.find((e) => e.text === "Entrar").x, 500);
    assert.equal(t2.find((e) => e.text === "Entrar").y, 1850);
  });
});
