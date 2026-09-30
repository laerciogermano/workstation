/**
 * Um teste por PNG em screenshots/ — OCR, print e grava resultado em arquivo.
 * Saída: screenshots/ocr/<nome-sem-ext>.txt
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ocrWords } from "./ocr.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = resolve(ROOT, "screenshots");
const OUT = resolve(SHOTS, "ocr");

const images = existsSync(SHOTS)
  ? readdirSync(SHOTS)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .sort()
  : [];

function outPathFor(pngName) {
  const stem = basename(pngName, ".png");
  return resolve(OUT, `${stem}.txt`);
}

describe("OCR screenshots/", () => {
  if (!images.length) {
    it("sem PNGs em screenshots/ — skip", { skip: "sem screenshots" }, () => {});
    return;
  }

  mkdirSync(OUT, { recursive: true });

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
