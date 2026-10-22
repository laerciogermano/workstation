/**
 * Crop da foto (avatar) e capa a partir do PNG do cartão (1ª tela do perfil).
 * Coordenadas calibradas em 540×960 (LinkedIn mobile); escalam com o tamanho real.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/** Referência do emulator (card-00 típico). */
const REF_W = 540;
const REF_H = 960;

/** Capa: faixa do banner abaixo da search, acima do avatar. */
const COVER = { left: 0, top: 100, width: 540, height: 110 };
/** Foto: círculo do avatar (bounding box quadrado). */
const PHOTO = { left: 24, top: 220, width: 140, height: 140 };

function scaleBox(box, w, h) {
  const sx = w / REF_W;
  const sy = h / REF_H;
  const left = Math.max(0, Math.round(box.left * sx));
  const top = Math.max(0, Math.round(box.top * sy));
  let width = Math.round(box.width * sx);
  let height = Math.round(box.height * sy);
  if (left + width > w) width = w - left;
  if (top + height > h) height = h - top;
  return { left, top, width, height };
}

/**
 * @param {string} cardPngPath
 * @param {string} [outDir] — grava photo.png + cover.png se passado
 * @returns {Promise<{ photoBase64: string|null, coverBase64: string|null, photoPath?: string, coverPath?: string }>}
 */
export async function cropProfilePhotoAndCover(cardPngPath, outDir) {
  const img = sharp(cardPngPath);
  const meta = await img.metadata();
  const w = Number(meta.width) || REF_W;
  const h = Number(meta.height) || REF_H;

  const photoBox = scaleBox(PHOTO, w, h);
  const coverBox = scaleBox(COVER, w, h);

  const photoBuf = await sharp(cardPngPath).extract(photoBox).png().toBuffer();
  const coverBuf = await sharp(cardPngPath).extract(coverBox).png().toBuffer();

  /** @type {{ photoBase64: string|null, coverBase64: string|null, photoPath?: string, coverPath?: string }} */
  const out = {
    photoBase64: photoBuf.toString("base64"),
    coverBase64: coverBuf.toString("base64"),
  };

  if (outDir) {
    const photoPath = join(outDir, "photo.png");
    const coverPath = join(outDir, "cover.png");
    writeFileSync(photoPath, photoBuf);
    writeFileSync(coverPath, coverBuf);
    out.photoPath = photoPath;
    out.coverPath = coverPath;
  }
  return out;
}
