import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSameOcrHit, mergeOcrHits, normalizeOcrText } from "./ocr-merge.js";

describe("ocr-merge", () => {
  it("normalizeOcrText", () => {
    assert.equal(normalizeOcrText("Connect"), "connect");
    assert.equal(normalizeOcrText("•+ Connect"), "+ connect");
  });

  it("isSameOcrHit une Connect próximos", () => {
    assert.equal(
      isSameOcrHit(
        { text: "Connect", x: 440, y: 340 },
        { text: "+ Connect", x: 445, y: 344 },
      ),
      true,
    );
    assert.equal(
      isSameOcrHit(
        { text: "Connect", x: 440, y: 340 },
        { text: "Message", x: 440, y: 340 },
      ),
      false,
    );
  });

  it("mergeOcrHits une comuns e mantém diferenças", () => {
    const out = mergeOcrHits([
      {
        engine: "rapidocr",
        hits: [
          { text: "Connect", x: 440, y: 340 },
          { text: "People", x: 100, y: 150 },
        ],
      },
      {
        engine: "macos-vision",
        hits: [
          { text: "+ Connect", x: 445, y: 344 },
          { text: "Skip", x: 200, y: 800 },
        ],
      },
      {
        engine: "tesseract",
        hits: [{ text: "People", x: 102, y: 152 }],
      },
    ]);
    const texts = out.map((h) => h.text).sort();
    assert.ok(texts.some((t) => /connect/i.test(t)));
    assert.ok(texts.includes("People") || texts.some((t) => /people/i.test(t)));
    assert.ok(texts.includes("Skip"));
    // Connect + People + Skip = 3 (comuns unidos)
    assert.equal(out.length, 3);
  });
});
