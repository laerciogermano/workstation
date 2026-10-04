/**
 * extract com OCR pluggable (tesseract | macos-vision | rapidocr).
 * Contrato de saída igual a extract(): [{ type:"text", text, x, y }].
 */
import { captureFrame } from "./frame.js";
import { ocrWords } from "./ocr.js";
import { ocrWordsMacosVision } from "./ocr-macos-vision.js";
import { ocrWordsRapidocr } from "./ocr-rapidocr.js";

/** @typedef {"tesseract"|"macos-vision"|"rapidocr"} OcrEngine */

const ENGINES = {
  tesseract: ocrWords,
  "macos-vision": ocrWordsMacosVision,
  rapidocr: ocrWordsRapidocr,
};

export function listOcrEngines() {
  return Object.keys(ENGINES);
}

function pointFromBounds(b) {
  const box = b || { x: 0, y: 0, w: 0, h: 0 };
  return {
    x: Math.floor(box.x + box.w / 2),
    y: Math.floor(box.y + box.h / 2),
  };
}

function wordsToElements(words) {
  return (words || []).map((w) => {
    const p = pointFromBounds(w.bounds);
    return { type: "text", text: w.text, x: p.x, y: p.y };
  });
}

/**
 * OCR direto de um arquivo de imagem (sem device).
 * @param {string} imagePath
 * @param {{ engine?: OcrEngine }} [opts]
 */
export async function extractFromImage(imagePath, opts = {}) {
  const engine = opts.engine || "tesseract";
  const recognize = ENGINES[engine];
  if (!recognize) {
    const err = new Error(`extract-engines: engine desconhecido: ${engine}`);
    err.code = "OCR_ENGINE_UNKNOWN";
    throw err;
  }
  const words = await recognize(imagePath, opts);
  return wordsToElements(words);
}

/**
 * Igual extract(), mas escolhe o backend OCR.
 * @param {{ serial: string, engine?: OcrEngine }} cfg
 * @param {object} [deps]
 */
export async function extractWithEngine(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) {
    const err = new Error("extract: falta serial");
    err.code = "EXTRACT_NO_SERIAL";
    throw err;
  }
  const engine = cfg.engine || "tesseract";
  const recognize = ENGINES[engine];
  if (!recognize) {
    const err = new Error(`extract-engines: engine desconhecido: ${engine}`);
    err.code = "OCR_ENGINE_UNKNOWN";
    throw err;
  }
  const capture = deps.captureFrame
    ? (s, d) => deps.captureFrame(s, d)
    : captureFrame;
  const framePath = await capture(serial, deps);
  const words = await recognize(framePath, deps);
  return wordsToElements(words);
}

/** Hits cujo texto é Connect (exato ou contém a palavra). */
export function findConnectHits(els) {
  return (els || []).filter((e) => {
    const t = String(e.text || "").trim();
    if (/^connect$/i.test(t)) return true;
    return /\bconnect\b/i.test(t);
  });
}
