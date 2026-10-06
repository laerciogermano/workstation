/**
 * extract com OCR pluggable + merge paralelo (engine=all).
 * Contrato de saída: [{ type:"text", text, x, y }].
 *
 * Top-5 (UI / mobile OCR):
 *  1. rapidocr — PP-OCR ONNX, bom em Connect
 *  2. macos-vision — Apple Vision
 *  3. paddleocr — PaddleOCR
 *  4. easyocr — EasyOCR
 *  5. tesseract — tesseract.js
 */
import { captureFrame } from "./frame.js";
import { ocrWords } from "./ocr.js";
import { ocrWordsMacosVision } from "./ocr-macos-vision.js";
import { ocrWordsRapidocr } from "./ocr-rapidocr.js";
import {
  ocrWordsEasyocr,
  ocrWordsPaddleocr,
} from "./ocr-python-cli.js";
import { mergeOcrHits } from "./ocr-merge.js";

/** @typedef {"tesseract"|"macos-vision"|"rapidocr"|"paddleocr"|"easyocr"|"all"} OcrEngine */

const ENGINES = {
  tesseract: ocrWords,
  "macos-vision": ocrWordsMacosVision,
  rapidocr: ocrWordsRapidocr,
  paddleocr: ocrWordsPaddleocr,
  easyocr: ocrWordsEasyocr,
};

/** Ordem / conjunto do merge `all` (as 5 melhores para UI). */
export const MERGE_ENGINES = [
  "rapidocr",
  "macos-vision",
  "paddleocr",
  "easyocr",
  "tesseract",
];

export function listOcrEngines() {
  return [...Object.keys(ENGINES), "all"];
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
 * @param {string} imagePath
 * @param {string} engine
 * @param {object} [deps]
 */
async function runOneEngine(imagePath, engine, deps = {}) {
  const recognize = ENGINES[engine];
  if (!recognize) {
    const err = new Error(`extract-engines: engine desconhecido: ${engine}`);
    err.code = "OCR_ENGINE_UNKNOWN";
    throw err;
  }
  const words = await recognize(imagePath, deps);
  return wordsToElements(words);
}

/**
 * Roda engines em paralelo e une hits (comuns + diferenças).
 * Engines que falham são ignorados (log opcional); precisa ≥1 ok.
 * @param {string} imagePath
 * @param {{ engines?: string[], keepEngines?: boolean, onEngineError?: Function }} [opts]
 * @param {object} [deps]
 */
export async function extractMergedFromImage(imagePath, opts = {}, deps = {}) {
  const engines = opts.engines?.length ? opts.engines : MERGE_ENGINES;
  const results = await Promise.all(
    engines.map(async (engine) => {
      const started = Date.now();
      try {
        const hits = await runOneEngine(imagePath, engine, deps);
        return {
          engine,
          ok: true,
          ms: Date.now() - started,
          hits,
          error: null,
        };
      } catch (e) {
        const error = String(e.message || e);
        if (typeof opts.onEngineError === "function") {
          opts.onEngineError({ engine, error });
        }
        return {
          engine,
          ok: false,
          ms: Date.now() - started,
          hits: [],
          error,
        };
      }
    }),
  );
  const okBatches = results.filter((r) => r.ok && r.hits.length >= 0);
  if (!okBatches.some((r) => r.ok)) {
    const detail = results.map((r) => `${r.engine}:${r.error}`).join("; ");
    const err = new Error(`EXTRACT_OCR_FAILED: nenhum engine ok (${detail})`);
    err.code = "EXTRACT_OCR_FAILED";
    err.results = results;
    throw err;
  }
  const merged = mergeOcrHits(
    okBatches.map((r) => ({ engine: r.engine, hits: r.hits })),
    { keepEngines: opts.keepEngines === true },
  );
  return { elements: merged, engines: results };
}

/**
 * OCR direto de um arquivo de imagem (sem device).
 * @param {string} imagePath
 * @param {{ engine?: OcrEngine, engines?: string[], keepEngines?: boolean }} [opts]
 */
export async function extractFromImage(imagePath, opts = {}) {
  const engine = opts.engine || "tesseract";
  if (engine === "all" || engine === "merge") {
    const { elements } = await extractMergedFromImage(imagePath, opts);
    return elements;
  }
  return runOneEngine(imagePath, engine, opts);
}

/**
 * Igual extract(), mas escolhe o backend OCR (ou all = merge paralelo).
 * @param {{ serial: string, engine?: OcrEngine, engines?: string[] }} cfg
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
  const capture = deps.captureFrame
    ? (s, d) => deps.captureFrame(s, d)
    : captureFrame;
  const framePath = await capture(serial, deps);

  if (engine === "all" || engine === "merge") {
    const log =
      typeof deps.log === "function" ? deps.log : () => {};
    const { elements, engines } = await extractMergedFromImage(
      framePath,
      {
        engines: cfg.engines,
        keepEngines: cfg.keepEngines,
        onEngineError: ({ engine: e, error }) =>
          log(`ocr ${e} falhou: ${error.slice(0, 160)}`),
      },
      deps,
    );
    if (deps.logMergeStats) {
      const ok = engines.filter((e) => e.ok).map((e) => `${e.engine}:${e.hits.length}/${e.ms}ms`);
      log(`ocr-merge ok=[${ok.join(", ")}] hits=${elements.length}`);
    }
    return elements;
  }

  if (!ENGINES[engine]) {
    const err = new Error(`extract-engines: engine desconhecido: ${engine}`);
    err.code = "OCR_ENGINE_UNKNOWN";
    throw err;
  }
  return runOneEngine(framePath, engine, deps);
}

/** Hits cujo texto é Connect (exato ou contém a palavra). */
export function findConnectHits(els) {
  return (els || []).filter((e) => {
    const t = String(e.text || "").trim();
    if (/^connect$/i.test(t)) return true;
    return /\bconnect\b/i.test(t);
  });
}
