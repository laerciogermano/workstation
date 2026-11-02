/**
 * OCR da viewport do browser via CDP screenshot + engines do screen-robot.
 *
 * session.screenshot() → PNG
 * session.ocr() → { text, words[], imagePath }
 * session.findByOcr(query) → { text, bounds, cx, cy } | null
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SCREEN_ROBOT_LIB = resolve(__dir, '../../../../src/lib');

/**
 * @typedef {{ text: string, bounds: { x: number, y: number, w: number, h: number }, confidence: number }} OcrWord
 */

function defaultEngine() {
  return (
    process.env.HUMAN_CDP_OCR ||
    process.env.SCREEN_ROBOT_OCR ||
    (process.platform === 'darwin' ? 'macos-vision' : 'tesseract')
  );
}

/**
 * @param {{ send: (method: string, params?: object) => Promise<any> }} session
 * @param {{ format?: 'png'|'jpeg', quality?: number, clip?: object, fromSurface?: boolean }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function captureScreenshot(session, opts = {}) {
  const params = {
    format: opts.format || 'png',
    fromSurface: opts.fromSurface !== false,
  };
  if (opts.format === 'jpeg' && opts.quality != null) params.quality = opts.quality;
  if (opts.clip) params.clip = opts.clip;
  const res = await session.send('Page.captureScreenshot', params);
  if (!res?.data) throw new Error('Page.captureScreenshot sem data');
  return Buffer.from(res.data, 'base64');
}

/**
 * @param {string} imagePath
 * @param {{ engine?: string, lang?: string }} [opts]
 * @returns {Promise<OcrWord[]>}
 */
export async function ocrImage(imagePath, opts = {}) {
  const engine = String(opts.engine || defaultEngine()).toLowerCase();
  if (engine === 'macos-vision') {
    const { ocrWordsMacosVision } = await import(
      join(SCREEN_ROBOT_LIB, 'ocr-macos-vision.js')
    );
    return ocrWordsMacosVision(imagePath);
  }
  if (engine === 'rapidocr') {
    const { ocrWordsRapidocr } = await import(
      join(SCREEN_ROBOT_LIB, 'ocr-rapidocr.js')
    );
    return ocrWordsRapidocr(imagePath);
  }
  if (engine === 'tesseract') {
    return ocrWordsTesseractCli(imagePath, opts.lang || 'por+eng');
  }
  throw new Error(`OCR engine desconhecido: ${engine}`);
}

/**
 * Fallback: tesseract CLI (brew) → TSV.
 * @param {string} imagePath
 * @param {string} lang
 * @returns {OcrWord[]}
 */
function ocrWordsTesseractCli(imagePath, lang) {
  const r = spawnSync(
    'tesseract',
    [imagePath, 'stdout', '-l', lang, 'tsv'],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    const err = new Error(`EXTRACT_OCR_FAILED: tesseract ${r.stderr || r.status}`);
    err.code = 'EXTRACT_OCR_FAILED';
    throw err;
  }
  const lines = String(r.stdout || '').split('\n').slice(1);
  /** @type {OcrWord[]} */
  const words = [];
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 12) continue;
    const conf = Number(cols[10]);
    const text = String(cols[11] || '').trim();
    if (!text || !(conf >= 40)) continue;
    const left = Number(cols[6]);
    const top = Number(cols[7]);
    const width = Number(cols[8]);
    const height = Number(cols[9]);
    if (!(width > 0 && height > 0)) continue;
    words.push({
      text,
      bounds: { x: left, y: top, w: width, h: height },
      confidence: conf,
    });
  }
  return words;
}

/**
 * Screenshot CDP + OCR.
 * @param {{ send: Function }} session
 * @param {{ engine?: string, lang?: string, path?: string, keepFile?: boolean, clip?: object }} [opts]
 */
export async function ocrFromSession(session, opts = {}) {
  const buf = await captureScreenshot(session, { clip: opts.clip });
  let imagePath = opts.path;
  let tmpDir = null;
  if (!imagePath) {
    tmpDir = mkdtempSync(join(tmpdir(), 'human-cdp-ocr-'));
    imagePath = join(tmpDir, 'viewport.png');
  }
  writeFileSync(imagePath, buf);

  const engine = opts.engine || defaultEngine();
  let words;
  try {
    words = await ocrImage(imagePath, { engine, lang: opts.lang });
  } catch (e) {
    // fallback darwin → tesseract se vision falhar
    if (engine === 'macos-vision') {
      try {
        words = await ocrImage(imagePath, { engine: 'tesseract', lang: opts.lang });
      } catch {
        throw e;
      }
    } else {
      throw e;
    }
  }

  const text = words.map((w) => w.text).join(' ');
  const result = {
    engine: opts.engine || defaultEngine(),
    imagePath,
    text,
    words,
  };

  if (!opts.keepFile && !opts.path && existsSync(imagePath)) {
    try {
      unlinkSync(imagePath);
    } catch {
      /* ignore */
    }
    result.imagePath = null;
  }

  return result;
}

/**
 * Primeira palavra/frase que contém `query` (case-insensitive).
 * @param {OcrWord[]} words
 * @param {string} query
 */
export function findOcrWord(words, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q || !words?.length) return null;
  // match exato preferencial
  let hit = words.find((w) => w.text.toLowerCase() === q);
  if (!hit) hit = words.find((w) => w.text.toLowerCase().includes(q));
  if (!hit) return null;
  const b = hit.bounds;
  return {
    text: hit.text,
    bounds: b,
    confidence: hit.confidence,
    cx: b.x + b.w / 2,
    cy: b.y + b.h / 2,
  };
}
