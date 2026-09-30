/**
 * Um teste por PNG em screenshots/ — OCR, print e grava resultado ao lado da imagem.
 * Saída: screenshots/<nome>.txt (mesmo stem do .png)
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ocrWords } from "./ocr.js";

const SHOTS = resolve(dirname(fileURLToPath(import.meta.url)), "../screenshots");

const images = existsSync(SHOTS)
  ? readdirSync(SHOTS)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .sort()
  : [];

function outPathFor(pngName) {
  return resolve(SHOTS, `${basename(pngName, ".png")}.txt`);
}

describe("OCR screenshots/", () => {
  if (!images.length) {
    it("sem PNGs em screenshots/ — skip", { skip: "sem screenshots" }, () => {});
    return;
  }

  for (const name of images) {
    it(`extrai texto: ${name}`, { timeout: 180_000 }, async () => {
      const path = resolve(SHOTS, name);
      const words = await ocrWords(path);
      const text = words.map((w) => w.text).join(" ");
      const dest = outPathFor(name);
      writeFileSync(dest, text + "\n", "utf8");
      console.log(`\n=== ${name} ===\n${text}\n→ ${dest}\n`);
      assert.ok(Array.isArray(words));
      assert.ok(existsSync(dest));
    });
  }
});
