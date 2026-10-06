/**
 * compressFrame + scale — fixture LinkedIn (piloto).
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  compressFrame,
  scalePointToDevice,
  DEFAULT_WIDTH,
} from "./vision-frame.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = resolve(
  ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);

describe("vision-frame", () => {
  it("scalePointToDevice multiplica x,y", () => {
    assert.deepEqual(scalePointToDevice({ x: 100, y: 200 }, 2), {
      x: 200,
      y: 400,
    });
  });

  it("compressFrame: fixture People → WebP menor + scale", async () => {
    assert.ok(existsSync(FIXTURE), `falta ${FIXTURE}`);
    const out = await compressFrame(FIXTURE, { width: DEFAULT_WIDTH, quality: 60 });
    assert.equal(out.mimeType, "image/webp");
    assert.ok(out.outputBytes < out.inputBytes);
    assert.ok(out.width <= DEFAULT_WIDTH);
    assert.ok(out.scaleToDevice >= 1);
    assert.ok(out.base64.length > 100);
    // Connect tipicamente ~455 device; na imagem ~455/scale
    const imgX = Math.round(455 / out.scaleToDevice);
    const back = scalePointToDevice({ x: imgX, y: 100 }, out.scaleToDevice);
    assert.ok(Math.abs(back.x - 455) <= 2);
  });
});
