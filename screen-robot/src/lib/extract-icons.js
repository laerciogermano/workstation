/**
 * Ícones no extract — blobs ≠ fundo (componentes conectados), sem IA.
 * Público: { type: "icon", x, y } (centro). Blobs que cobrem um hit OCR são ignorados.
 */
import { existsSync } from "node:fs";
import sharp from "sharp";

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

function containsPoint(b, x, y) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

/**
 * Remove blobs cujo interior já tem um hit OCR (botão com texto ≠ ícone).
 * @param {{ x: number, y: number, w: number, h: number }[]} boxes
 * @param {{ x?: number, y?: number, type?: string }[]} [texts]
 */
export function excludeTextOverlap(boxes, texts) {
  const pts = (texts || []).filter(
    (t) => t && t.type !== "icon" && t.x != null && t.y != null,
  );
  return (boxes || []).filter(
    (b) =>
      !pts.some((t) => containsPoint(b, Number(t.x), Number(t.y))),
  );
}

export function boxesToIconElements(boxes) {
  return (boxes || []).map((b) => ({
    type: "icon",
    x: Math.round(b.x + b.w / 2),
    y: Math.round(b.y + b.h / 2),
  }));
}

/**
 * @param {string} imagePath
 * @returns {Promise<{ x: number, y: number, w: number, h: number, area: number }[]>}
 */
export async function detectIconBoxes(imagePath) {
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
  return connectedComponents(mask, W, H)
    .filter((b) => {
      const boxArea = b.w * b.h;
      const fill = b.area / boxArea;
      const ar = b.w / b.h;
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
}

export function iconsEnabled(deps = {}) {
  if (deps.icons === false) return false;
  const v = String(process.env.SCREEN_ROBOT_ICONS || "").toLowerCase();
  if (v === "0" || v === "off" || v === "false") return false;
  return true;
}

/**
 * @param {string} imagePath
 * @param {{ texts?: object[] }} [opts]
 * @returns {Promise<{ type: "icon", x: number, y: number }[]>}
 */
export async function detectIconsFromImage(imagePath, opts = {}) {
  if (!imagePath || !existsSync(imagePath)) return [];
  const boxes = excludeTextOverlap(
    await detectIconBoxes(imagePath),
    opts.texts,
  );
  return boxesToIconElements(boxes);
}

/**
 * Anexa ícones depois dos textos. Falha de blob → só textos.
 * @param {string} imagePath
 * @param {object[]} texts
 * @param {object} [deps]
 */
export async function appendIcons(imagePath, texts, deps = {}) {
  const list = Array.isArray(texts) ? texts : [];
  if (!iconsEnabled(deps)) return list;
  try {
    if (typeof deps.detectIcons === "function") {
      const extra = await deps.detectIcons(imagePath, { texts: list });
      return [...list, ...(extra || [])];
    }
    const icons = await detectIconsFromImage(imagePath, { texts: list });
    return [...list, ...icons];
  } catch {
    return list;
  }
}
