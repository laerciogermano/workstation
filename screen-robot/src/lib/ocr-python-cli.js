/**
 * OCR genérico via CLI Python (JSON stdout → OcrWord[]).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnCaptured } from "./spawn-captured.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} cliRel path relativo a src/ (ex. tools/easyocr_cli.py)
 * @param {string} engineName nome para erro
 * @param {string} imagePath
 * @param {{ python?: string, timeoutMs?: number, signal?: AbortSignal }} [deps]
 */
export async function ocrWordsPythonCli(cliRel, engineName, imagePath, deps = {}) {
  const python = deps.python || process.env.SCREEN_ROBOT_PYTHON || "python3";
  const cli = resolve(ROOT, cliRel);
  const timeoutMs = Number(deps.timeoutMs ?? process.env.OCR_CLI_TIMEOUT_MS ?? 180000);
  const r = await spawnCaptured(python, [cli, imagePath], {
    maxBuffer: 32 * 1024 * 1024,
    timeoutMs,
    signal: deps.signal,
    env: {
      ...process.env,
      PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True",
    },
  });
  if (r.status !== 0) {
    const err = new Error(
      `EXTRACT_OCR_FAILED: ${engineName} (${r.stderr || r.stdout || r.status})`,
    );
    err.code = "EXTRACT_OCR_FAILED";
    err.engine = engineName;
    throw err;
  }
  try {
    const data = JSON.parse(String(r.stdout || "[]"));
    return (Array.isArray(data) ? data : []).map((w) => ({
      text: String(w.text || "").trim(),
      confidence: Number(w.confidence ?? 0),
      bounds: {
        x: Number(w.bounds?.x ?? 0),
        y: Number(w.bounds?.y ?? 0),
        w: Number(w.bounds?.w ?? 0),
        h: Number(w.bounds?.h ?? 0),
      },
    }));
  } catch (e) {
    const err = new Error(
      `EXTRACT_OCR_FAILED: ${engineName} JSON inválido (${e.message})`,
    );
    err.code = "EXTRACT_OCR_FAILED";
    err.engine = engineName;
    throw err;
  }
}

export function ocrWordsEasyocr(imagePath, deps = {}) {
  return ocrWordsPythonCli("tools/easyocr_cli.py", "easyocr", imagePath, deps);
}

export function ocrWordsPaddleocr(imagePath, deps = {}) {
  return ocrWordsPythonCli(
    "tools/paddleocr_cli.py",
    "paddleocr",
    imagePath,
    deps,
  );
}

export function ocrWordsPytesseract(imagePath, deps = {}) {
  return ocrWordsPythonCli(
    "tools/pytesseract_cli.py",
    "pytesseract",
    imagePath,
    deps,
  );
}
