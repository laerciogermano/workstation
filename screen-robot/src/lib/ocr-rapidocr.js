/**
 * OCR via RapidOCR (Python rapidocr-onnxruntime) — tools/rapidocr_cli.py.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnCaptured } from "./spawn-captured.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = resolve(ROOT, "tools/rapidocr_cli.py");

/**
 * @param {string} imagePath
 * @param {{ python?: string, timeoutMs?: number, signal?: AbortSignal }} [deps]
 * @returns {Promise<{ text: string, bounds: { x:number,y:number,w:number,h:number }, confidence: number }[]>}
 */
export async function ocrWordsRapidocr(imagePath, deps = {}) {
  const python = deps.python || process.env.RAPIDOCR_PYTHON || "python3";
  const r = await spawnCaptured(python, [CLI, imagePath], {
    maxBuffer: 20 * 1024 * 1024,
    timeoutMs: deps.timeoutMs,
    signal: deps.signal,
  });
  if (r.status !== 0) {
    const err = new Error(
      `EXTRACT_OCR_FAILED: rapidocr (${r.stderr || r.stdout || r.status}). pip3 install --user rapidocr-onnxruntime`,
    );
    err.code = "EXTRACT_OCR_FAILED";
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(r.stdout || "[]");
  } catch (e) {
    const err = new Error(`EXTRACT_OCR_FAILED: rapidocr JSON inválido (${e.message})`);
    err.code = "EXTRACT_OCR_FAILED";
    throw err;
  }
  return (Array.isArray(parsed) ? parsed : [])
    .map((w) => ({
      text: String(w.text || "").trim(),
      bounds: {
        x: Number(w.bounds?.x ?? 0),
        y: Number(w.bounds?.y ?? 0),
        w: Math.max(1, Number(w.bounds?.w ?? 1)),
        h: Math.max(1, Number(w.bounds?.h ?? 1)),
      },
      confidence: Number(w.confidence ?? 0),
    }))
    .filter((w) => w.text);
}
