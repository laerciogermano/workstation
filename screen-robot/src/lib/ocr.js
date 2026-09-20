/**
 * OCR sobre imagem → palavras com bounds (tesseract.js).
 */
import Tesseract from "tesseract.js";

/**
 * @typedef {{ text: string, bounds: { x: number, y: number, w: number, h: number }, confidence: number }} OcrWord
 */

/**
 * @param {string} imagePath
 * @param {{ ocrRecognize?: Function, lang?: string }} [deps]
 * @returns {Promise<OcrWord[]>}
 */
export async function ocrWords(imagePath, deps = {}) {
  if (typeof deps.ocrRecognize === "function") {
    return deps.ocrRecognize(imagePath, deps);
  }
  try {
    const lang = deps.lang || "por+eng";
    const result = await Tesseract.recognize(imagePath, lang, {
      logger: () => {},
    });
    const words = result?.data?.words || [];
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
