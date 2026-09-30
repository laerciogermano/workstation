/**
 * Um teste por PNG em screenshots/ — OCR + extração de ícones/imagens.
 * Saídas:
 *   screenshots/<nome>.txt
 *   screenshots/<nome>/icon-NN.png | image-NN.png
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import sharp from "sharp";
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

function visualsDirFor(pngName) {
  return resolve(SHOTS, basename(pngName, ".png"));
}

/** Média RGB das bordas → cor de fundo. */
function sampleBg(data, W, H) {
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  const add = (x, y) => {
    const o = (y * W + x) * 4;
    r += data[o];
    g += data[o + 1];
    b += data[o + 2];
    n++;
  };
  for (let x = 0; x < W; x++) {
    add(x, 0);
    add(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    add(0, y);
    add(W - 1, y);
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Componentes conectados (4-vizinhos) → bboxes.
 * @returns {{ x: number, y: number, w: number, h: number, area: number }[]}
 */
function connectedComponents(mask, W, H) {
  const labels = new Int32Array(W * H);
  const parent = [0];
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const unite = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[b] = a;
  };

  let next = 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!mask[i]) continue;
      const left = x > 0 ? labels[i - 1] : 0;
      const up = y > 0 ? labels[i - W] : 0;
      if (left && up) {
        labels[i] = left;
        unite(left, up);
      } else if (left) {
        labels[i] = left;
      } else if (up) {
        labels[i] = up;
      } else {
        parent[next] = next;
        labels[i] = next++;
      }
    }
  }

  /** @type {Map<number, { minX: number, minY: number, maxX: number, maxY: number, area: number }>} */
  const boxes = new Map();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!labels[i]) continue;
      const root = find(labels[i]);
      let b = boxes.get(root);
      if (!b) {
        b = { minX: x, minY: y, maxX: x, maxY: y, area: 0 };
        boxes.set(root, b);
      }
      if (x < b.minX) b.minX = x;
      if (y < b.minY) b.minY = y;
      if (x > b.maxX) b.maxX = x;
      if (y > b.maxY) b.maxY = y;
      b.area++;
    }
  }

  return [...boxes.values()].map((b) => ({
    x: b.minX,
    y: b.minY,
    w: b.maxX - b.minX + 1,
    h: b.maxY - b.minY + 1,
    area: b.area,
  }));
}

/**
 * Extrai ícones e imagens sem coordenadas manuais (componentes ≠ fundo).
 * Grava em outDir: icon-NN.png | image-NN.png
 * @returns {Promise<{ type: string, bounds: object, path: string }[]>}
 */
async function extractVisuals(imagePath, outDir) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const bg = sampleBg(data, W, H);
  const tol = 28;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const d =
      Math.abs(data[o] - bg[0]) +
      Math.abs(data[o + 1] - bg[1]) +
      Math.abs(data[o + 2] - bg[2]);
    if (d > tol) mask[i] = 1;
  }

  const minArea = Math.max(400, Math.floor(W * H * 0.00015));
  const maxArea = Math.floor(W * H * 0.35);
  const boxes = connectedComponents(mask, W, H)
    .filter((b) => {
      const boxArea = b.w * b.h;
      const fill = b.area / boxArea;
      const ar = b.w / b.h;
      // descarta faixa full-width (status/nav/teclado) e blobs minúsculos
      if (b.w > W * 0.85 && b.h < H * 0.2) return false;
      return (
        b.area >= minArea &&
        boxArea <= maxArea &&
        ar > 0.35 &&
        ar < 2.8 &&
        fill > 0.12 &&
        b.w >= 16 &&
        b.h >= 16
      );
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);

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
    it(`extrai ícones/imagens: ${name}`, { timeout: 60_000 }, async () => {
      const path = resolve(SHOTS, name);
      const outDir = visualsDirFor(name);
      const visuals = await extractVisuals(path, outDir);
      console.log(
        `\n=== visuals ${name} → ${outDir} (${visuals.length}) ===\n` +
          visuals.map((v) => `${v.type} ${v.bounds.w}x${v.bounds.h} → ${basename(v.path)}`).join("\n") +
          "\n",
      );
      assert.ok(existsSync(outDir));
      // splash/loading podem não ter ícones isolados — só exige pasta criada
      assert.ok(Array.isArray(visuals));
    });
  }
});
