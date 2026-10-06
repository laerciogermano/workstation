/**
 * Captura → WebP comprimido para decide multimodal (sem OCR).
 * Escala: coords da IA na imagem × scaleToDevice = device.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const DEFAULT_WIDTH = Number(process.env.VISION_WIDTH || 540);
const DEFAULT_QUALITY = Number(process.env.VISION_QUALITY || 60);

/**
 * @param {string|Buffer} input path PNG/JPEG ou buffer
 * @param {{ width?: number, quality?: number }} [opts]
 * @returns {Promise<{
 *   buffer: Buffer,
 *   mimeType: "image/webp",
 *   base64: string,
 *   width: number,
 *   height: number,
 *   original: { width: number, height: number },
 *   scaleToDevice: number,
 *   inputBytes: number,
 *   outputBytes: number,
 * }>}
 */
export async function compressFrame(input, opts = {}) {
  const width = Number(opts.width ?? DEFAULT_WIDTH);
  const quality = Number(opts.quality ?? DEFAULT_QUALITY);
  if (!Number.isFinite(width) || width < 64) {
    const err = new Error("compressFrame: width inválido");
    err.code = "VISION_BAD_WIDTH";
    throw err;
  }

  const raw = Buffer.isBuffer(input) ? input : readFileSync(input);
  const metaIn = await sharp(raw).metadata();
  if (!metaIn.width || !metaIn.height) {
    const err = new Error("compressFrame: imagem sem dimensões");
    err.code = "VISION_BAD_IMAGE";
    throw err;
  }

  const buffer = await sharp(raw)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  const outMeta = await sharp(buffer).metadata();
  const outW = outMeta.width || width;
  const outH = outMeta.height || 1;
  const scaleToDevice = metaIn.width / outW;

  return {
    buffer,
    mimeType: "image/webp",
    base64: buffer.toString("base64"),
    width: outW,
    height: outH,
    original: { width: metaIn.width, height: metaIn.height },
    scaleToDevice: Number(scaleToDevice.toFixed(4)),
    inputBytes: raw.length,
    outputBytes: buffer.length,
  };
}

/**
 * Escala coords da imagem comprimida → device.
 * @param {{ x?: number|null, y?: number|null }} pt
 * @param {number} scale
 */
export function scalePointToDevice(pt, scale) {
  const s = Number(scale);
  if (!Number.isFinite(s) || s <= 0) return { ...pt };
  const out = { ...pt };
  if (pt.x != null && Number.isFinite(Number(pt.x))) {
    out.x = Math.round(Number(pt.x) * s);
  }
  if (pt.y != null && Number.isFinite(Number(pt.y))) {
    out.y = Math.round(Number(pt.y) * s);
  }
  return out;
}

export { DEFAULT_WIDTH, DEFAULT_QUALITY };
