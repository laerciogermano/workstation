/**
 * Um teste por PNG em screenshots/ — OCR + extração de ícones/imagens.
 * Saídas:
 *   screenshots/<nome>.txt
 *   screenshots/<nome>/icon-NN.png | image-NN.png
 *   screenshots/<nome>/manifest.json  ({ file, type, bounds, label })
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import sharp from "sharp";
import { ocrWords } from "./ocr.js";
import { detectIconBoxes } from "./extract-icons.js";

const SHOTS = resolve(dirname(fileURLToPath(import.meta.url)), "../screenshots");

const images = existsSync(SHOTS)
  ? readdirSync(SHOTS)
      .filter((f) => f.toLowerCase().endsWith(".png"))
      .sort()
  : [];

function outPathFor(pngName) {
  return resolve(SHOTS, `${basename(pngName, ".png")}.txt`);
}

function visualsDirFor(pngName) {
  return resolve(SHOTS, basename(pngName, ".png"));
}

/**
 * Junta palavras OCR em ordem de leitura (linhas por Y, depois X).
 * @param {import("./ocr.js").OcrWord[]} words
 */
function joinReadingOrder(words) {
  if (!words.length) return "";
  const sorted = [...words].sort(
    (a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x,
  );
  /** @type {import("./ocr.js").OcrWord[][]} */
  const lines = [];
  let cur = [sorted[0]];
  let lineY = sorted[0].bounds.y;
  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (Math.abs(w.bounds.y - lineY) <= 20) {
      cur.push(w);
    } else {
      lines.push(cur.sort((a, b) => a.bounds.x - b.bounds.x));
      cur = [w];
      lineY = w.bounds.y;
    }
  }
  lines.push(cur.sort((a, b) => a.bounds.x - b.bounds.x));
  return lines
    .flat()
    .map((p) => p.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/(?:^|\s)[@:.*·>]+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Texto OCR à direita do visual, na faixa vertical da linha (até o próximo avatar).
 * @param {{ type: string, bounds: { x: number, y: number, w: number, h: number } }} visual
 * @param {import("./ocr.js").OcrWord[]} words
 * @param {number | null} nextImageY
 */
function labelFor(visual, words, nextImageY) {
  const { x, y, w, h } = visual.bounds;
  const y0 = y - 10;
  const y1 =
    nextImageY != null
      ? nextImageY - 4
      : visual.type === "image"
        ? y + Math.max(h * 2.8, 120)
        : y + h + 24;
  const near = words.filter((p) => {
    const cy = p.bounds.y + p.bounds.h / 2;
    return cy >= y0 && cy < y1 && p.bounds.x >= x + w * 0.35;
  });
  return joinReadingOrder(near);
}

/**
 * Anexa `label` a cada visual com OCR vizinho.
 * Ícones herdam o label do avatar da mesma linha (texto fica à esquerda do ícone).
 * @param {{ type: string, bounds: object, path: string }[]} visuals
 * @param {import("./ocr.js").OcrWord[]} words
 */
function attachLabels(visuals, words) {
  const images = visuals.filter((v) => v.type === "image");
  const labeledImages = new Map();
  for (const img of images) {
    const next = images.find((o) => o.bounds.y > img.bounds.y + 8);
    labeledImages.set(img.path, labelFor(img, words, next ? next.bounds.y : null));
  }
  return visuals.map((v) => {
    if (v.type === "image") {
      return { ...v, label: labeledImages.get(v.path) || "" };
    }
    const sameRow = images
      .filter((img) => Math.abs(img.bounds.y - v.bounds.y) < Math.max(img.bounds.h, 56))
      .sort(
        (a, b) =>
          Math.abs(a.bounds.y - v.bounds.y) - Math.abs(b.bounds.y - v.bounds.y) ||
          Math.abs(a.bounds.x - v.bounds.x) - Math.abs(b.bounds.x - v.bounds.x),
      )[0];
    if (sameRow) {
      return { ...v, label: labeledImages.get(sameRow.path) || "" };
    }
    const next = images.find((img) => img.bounds.y > v.bounds.y + 8);
    return { ...v, label: labelFor(v, words, next ? next.bounds.y : null) };
  });
}

/**
 * Extrai ícones e imagens sem coordenadas manuais (componentes ≠ fundo).
 * Grava em outDir: icon-NN.png | image-NN.png
 * @returns {Promise<{ type: string, bounds: object, path: string }[]>}
 */
async function extractVisuals(imagePath, outDir) {
  const boxes = await detectIconBoxes(imagePath);

  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const out = [];
  let iIcon = 0;
  let iImg = 0;
  for (const b of boxes) {
    const type = Math.min(b.w, b.h) >= 64 ? "image" : "icon";
    const name =
      type === "image"
        ? `image-${String(iImg++).padStart(2, "0")}.png`
        : `icon-${String(iIcon++).padStart(2, "0")}.png`;
    const dest = resolve(outDir, name);
    await sharp(imagePath)
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .png()
      .toFile(dest);
    out.push({ type, bounds: b, path: dest });
  }
  return out;
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

describe("visuals screenshots/", () => {
  if (!images.length) {
    it("sem PNGs em screenshots/ — skip", { skip: "sem screenshots" }, () => {});
    return;
  }

  for (const name of images) {
    it(`extrai ícones/imagens: ${name}`, { timeout: 180_000 }, async () => {
      const path = resolve(SHOTS, name);
      const outDir = visualsDirFor(name);
      const [visualsRaw, words] = await Promise.all([
        extractVisuals(path, outDir),
        ocrWords(path),
      ]);
      const visuals = attachLabels(visualsRaw, words);
      const manifest = visuals.map((v) => ({
        file: basename(v.path),
        type: v.type,
        bounds: v.bounds,
        label: v.label,
      }));
      const manifestPath = resolve(outDir, "manifest.json");
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
      console.log(
        `\n=== visuals ${name} → ${outDir} (${visuals.length}) ===\n` +
          visuals
            .map(
              (v) =>
                `${v.type} ${v.bounds.w}x${v.bounds.h} → ${basename(v.path)}` +
                (v.label ? `\n  label: ${v.label}` : ""),
            )
            .join("\n") +
          `\n→ ${manifestPath}\n`,
      );
      assert.ok(existsSync(outDir));
      assert.ok(existsSync(manifestPath));
      assert.ok(Array.isArray(visuals));
    });
  }
});
