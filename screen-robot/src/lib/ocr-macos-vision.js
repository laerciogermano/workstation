/**
 * OCR via Apple Vision (darwin) — bin/vision-ocr a partir de tools/vision-ocr.swift.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BIN = resolve(ROOT, "bin/vision-ocr");
const SWIFT = resolve(ROOT, "tools/vision-ocr.swift");

function ensureBinary() {
  if (existsSync(BIN)) return BIN;
  if (process.platform !== "darwin") {
    const err = new Error("ocr-macos-vision: só darwin");
    err.code = "OCR_ENGINE_UNAVAILABLE";
    throw err;
  }
  const r = spawnSync("swiftc", ["-O", SWIFT, "-o", BIN], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(BIN)) {
    const err = new Error(`ocr-macos-vision: falha ao compilar (${r.stderr || r.stdout || r.status})`);
    err.code = "OCR_ENGINE_UNAVAILABLE";
    throw err;
  }
  return BIN;
}

/**
 * @param {string} imagePath
 * @returns {Promise<{ text: string, bounds: { x:number,y:number,w:number,h:number }, confidence: number }[]>}
 */
export async function ocrWordsMacosVision(imagePath) {
  const bin = ensureBinary();
  const r = spawnSync(bin, [imagePath], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    const err = new Error(`EXTRACT_OCR_FAILED: macos-vision ${r.stderr || r.stdout || r.status}`);
    err.code = "EXTRACT_OCR_FAILED";
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(r.stdout || "[]");
  } catch (e) {
    const err = new Error(`EXTRACT_OCR_FAILED: macos-vision JSON inválido (${e.message})`);
    err.code = "EXTRACT_OCR_FAILED";
    throw err;
  }
  return (Array.isArray(parsed) ? parsed : []).map((w) => ({
    text: String(w.text || "").trim(),
    bounds: {
      x: Number(w.bounds?.x ?? 0),
      y: Number(w.bounds?.y ?? 0),
      w: Math.max(1, Number(w.bounds?.w ?? 1)),
      h: Math.max(1, Number(w.bounds?.h ?? 1)),
    },
    confidence: Number(w.confidence ?? 0) * (Number(w.confidence ?? 0) <= 1 ? 100 : 1),
  })).filter((w) => w.text);
}
