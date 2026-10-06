/**
 * Blobs → { type: "icon", x, y } sem OCR/IA.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  appendIcons,
  detectIconsFromImage,
  excludeTextOverlap,
} from "./extract-icons.js";

describe("extract-icons", () => {
  it("quadrado escuro em fundo claro → um icon no centro", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sr-icons-"));
    const path = join(dir, "dot.png");
    const W = 200;
    const H = 200;
    const buf = Buffer.alloc(W * H * 3, 255);
    for (let y = 40; y < 80; y++) {
      for (let x = 40; x < 80; x++) {
        const o = (y * W + x) * 3;
        buf[o] = 20;
        buf[o + 1] = 20;
        buf[o + 2] = 20;
      }
    }
    await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
      .png()
      .toFile(path);

    const icons = await detectIconsFromImage(path);
    rmSync(dir, { recursive: true, force: true });

    assert.equal(icons.length, 1);
    assert.equal(icons[0].type, "icon");
    assert.ok(Math.abs(icons[0].x - 60) <= 2);
    assert.ok(Math.abs(icons[0].y - 60) <= 2);
    assert.equal(icons[0].text, undefined);
  });

  it("excludeTextOverlap descarta blob que contém ponto OCR", () => {
    const boxes = [{ x: 10, y: 10, w: 40, h: 40 }];
    const kept = excludeTextOverlap(boxes, [{ type: "text", text: "A", x: 20, y: 20 }]);
    const all = excludeTextOverlap(boxes, [{ type: "text", text: "A", x: 200, y: 200 }]);
    assert.equal(kept.length, 0);
    assert.equal(all.length, 1);
  });

  it("appendIcons icons=false não detecta", async () => {
    const out = await appendIcons("/nope.png", [{ type: "text", text: "A", x: 1, y: 2 }], {
      icons: false,
    });
    assert.deepEqual(out, [{ type: "text", text: "A", x: 1, y: 2 }]);
  });

  it("appendIcons default (sem flag) não detecta", async () => {
    const out = await appendIcons("/nope.png", [{ type: "text", text: "A", x: 1, y: 2 }]);
    assert.deepEqual(out, [{ type: "text", text: "A", x: 1, y: 2 }]);
  });
});
