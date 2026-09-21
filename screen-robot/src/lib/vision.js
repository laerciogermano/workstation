/**
 * Legado — heurísticas icon/list/image (não usadas por `extract()`).
 * `extract()` devolve só textos OCR. Visão ativa: template match (US-12 / matchImage).
 */

/**
 * @param {import("./ocr.js").OcrWord[]} words
 * @param {{ w: number, h: number }} frameSize
 */
export function detectIcons(words, frameSize) {
  const icons = [];
  const occupied = words.map((w) => w.bounds);
  const step = 48;
  const maxIcons = 12;
  for (let y = 24; y < frameSize.h * 0.25 && icons.length < maxIcons; y += step) {
    for (let x = 24; x < frameSize.w - 24 && icons.length < maxIcons; x += step) {
      const cand = { x, y, w: 40, h: 40 };
      const overlapsText = occupied.some((b) => overlap(cand, b));
      if (!overlapsText && nearCornerOrTop(cand, frameSize)) {
        icons.push({ type: "icon", bounds: cand });
        occupied.push(cand);
      }
    }
  }
  return icons.slice(0, 6);
}

/**
 * @param {import("./ocr.js").OcrWord[]} words
 */
export function detectLists(words) {
  if (words.length < 3) return [];
  const sorted = [...words].sort((a, b) => a.bounds.y - b.bounds.y);
  const cols = {};
  for (const w of sorted) {
    const key = Math.round(w.bounds.x / 40) * 40;
    (cols[key] ||= []).push(w);
  }
  const lists = [];
  for (const group of Object.values(cols)) {
    if (group.length < 3) continue;
    const ys = group.map((g) => g.bounds.y);
    const gaps = [];
    for (let i = 1; i < ys.length; i++) gaps.push(ys[i] - ys[i - 1]);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap > 20 && avgGap < 200) {
      const x1 = Math.min(...group.map((g) => g.bounds.x));
      const y1 = Math.min(...group.map((g) => g.bounds.y));
      const x2 = Math.max(...group.map((g) => g.bounds.x + g.bounds.w));
      const y2 = Math.max(...group.map((g) => g.bounds.y + g.bounds.h));
      lists.push({
        type: "list",
        bounds: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
      });
    }
  }
  return lists.slice(0, 3);
}

/**
 * @param {import("./ocr.js").OcrWord[]} words
 * @param {{ w: number, h: number }} frameSize
 */
export function detectImages(words, frameSize) {
  const images = [];
  const band = {
    x: Math.floor(frameSize.w * 0.1),
    y: Math.floor(frameSize.h * 0.15),
    w: Math.floor(frameSize.w * 0.8),
    h: Math.floor(frameSize.h * 0.25),
  };
  const textInBand = words.filter((w) => overlap(band, w.bounds));
  if (textInBand.length <= 2) {
    images.push({ type: "image", bounds: band });
  }
  return images;
}

function overlap(a, b) {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

function nearCornerOrTop(b, frameSize) {
  return b.y < frameSize.h * 0.2 || b.x < 80 || b.x + b.w > frameSize.w - 80;
}
