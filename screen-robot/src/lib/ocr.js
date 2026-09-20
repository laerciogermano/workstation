/**
 * OCR sobre imagem → palavras com bounds (tesseract.js).
 */
import Tesseract, { createWorker } from "tesseract.js";

/**
 * @typedef {{ text: string, bounds: { x: number, y: number, w: number, h: number }, confidence: number }} OcrWord
 * @typedef {{ left: number, top: number, width: number, height: number }} OcrRectangle
 */

/**
 * Normaliza região `{ x, y, width|w, height|h }` → retângulo tesseract.
 * @param {{ x?: number, y?: number, width?: number, w?: number, height?: number, h?: number, left?: number, top?: number } | null | undefined} region
 * @returns {OcrRectangle | null}
 */
export function regionToRectangle(region) {
  if (!region || typeof region !== "object") return null;
  const left = Number(region.left ?? region.x ?? 0);
  const top = Number(region.top ?? region.y ?? 0);
  const width = Number(region.width ?? region.w ?? 0);
  const height = Number(region.height ?? region.h ?? 0);
  if (!(width > 0 && height > 0)) return null;
  return {
    left: Math.max(0, Math.floor(left)),
    top: Math.max(0, Math.floor(top)),
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

/**
 * @param {string} imagePath
 * @param {{ ocrRecognize?: Function, lang?: string, rectangle?: OcrRectangle | object, region?: object }} [deps]
 * @returns {Promise<OcrWord[]>}
 */
export async function ocrWords(imagePath, deps = {}) {
  if (typeof deps.ocrRecognize === "function") {
    return deps.ocrRecognize(imagePath, deps);
  }
  const rectangle =
    regionToRectangle(deps.rectangle) || regionToRectangle(deps.region);
  try {
    const lang = deps.lang || (rectangle ? "eng" : "por+eng");
    let words;
    if (rectangle) {
      const worker = await createWorker(lang);
      try {
        await worker.setParameters({ tessedit_pageseg_mode: "11" });
        const r = await worker.recognize(imagePath, { rectangle });
        words = r?.data?.words || [];
      } finally {
        await worker.terminate();
      }
    } else {
      const result = await Tesseract.recognize(imagePath, lang, {
        logger: () => {},
      });
      words = result?.data?.words || [];
    }
    return words
      .filter((w) => w.text && String(w.text).trim() && (w.confidence ?? 0) >= 40)
      .map((w) => {
        const b = w.bbox || {};
        const x0 = Number(b.x0 ?? 0);
        const y0 = Number(b.y0 ?? 0);
        const x1 = Number(b.x1 ?? x0);
        const y1 = Number(b.y1 ?? y0);
        return {
          text: String(w.text).trim(),
          bounds: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) },
          confidence: Number(w.confidence ?? 0),
        };
      });
  } catch (e) {
    const err = new Error(`EXTRACT_OCR_FAILED: ${e.message || e}`);
    err.code = "EXTRACT_OCR_FAILED";
    throw err;
  }
}
