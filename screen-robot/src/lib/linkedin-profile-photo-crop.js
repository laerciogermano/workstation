/**
 * Crops de mídia LinkedIn (detail: avatar+capa; lista: avatar+card inteiro).
 * Coordenadas calibradas em 540×960; escalam com o tamanho real.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/** Referência do emulator. */
const REF_W = 540;
const REF_H = 960;

/** Capa (detail): banner abaixo da search, acima do avatar. */
const COVER = { left: 0, top: 100, width: 540, height: 110 };
/** Foto (detail): círculo do avatar. */
const PHOTO = { left: 24, top: 220, width: 140, height: 140 };

/** Avatar na lista People (à esquerda do nome). */
const LIST_AVATAR_SIZE = 92;
const LIST_AVATAR_LEFT = 16;
/** Avatar top ≈ name.y − offset (OCR do nome fica um pouco abaixo do centro). */
const LIST_AVATAR_Y_OFF = -10;

function scaleBox(box, w, h) {
  const sx = w / REF_W;
  const sy = h / REF_H;
  const left = Math.max(0, Math.round(box.left * sx));
  const top = Math.max(0, Math.round(box.top * sy));
  let width = Math.round(box.width * sx);
  let height = Math.round(box.height * sy);
  if (left + width > w) width = Math.max(1, w - left);
  if (top + height > h) height = Math.max(1, h - top);
  return { left, top, width, height };
}

async function extractPng(srcPath, box) {
  return sharp(srcPath).extract(box).png().toBuffer();
}

/**
 * Detail: crop avatar + capa a partir do card-00.png.
 * @param {string} cardPngPath
 * @param {string} [outDir]
 */
export async function cropProfilePhotoAndCover(cardPngPath, outDir) {
  const meta = await sharp(cardPngPath).metadata();
  const w = Number(meta.width) || REF_W;
  const h = Number(meta.height) || REF_H;

  const photoBuf = await extractPng(cardPngPath, scaleBox(PHOTO, w, h));
  const coverBuf = await extractPng(cardPngPath, scaleBox(COVER, w, h));

  /** @type {{ photoBase64: string|null, coverBase64: string|null, cardBase64: string|null, photoPath?: string, coverPath?: string, cardPath?: string }} */
  const out = {
    photoBase64: photoBuf.toString("base64"),
    coverBase64: coverBuf.toString("base64"),
    cardBase64: null,
  };

  // Card inteiro = o próprio frame do cartão (1ª tela)
  try {
    const cardBuf = await sharp(cardPngPath).png().toBuffer();
    out.cardBase64 = cardBuf.toString("base64");
  } catch {
    /* ignore */
  }

  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    const photoPath = join(outDir, "photo.png");
    const coverPath = join(outDir, "cover.png");
    const cardPath = join(outDir, "card-full.png");
    writeFileSync(photoPath, photoBuf);
    writeFileSync(coverPath, coverBuf);
    if (out.cardBase64) {
      writeFileSync(cardPath, Buffer.from(out.cardBase64, "base64"));
      out.cardPath = cardPath;
    }
    out.photoPath = photoPath;
    out.coverPath = coverPath;
  }
  return out;
}

/**
 * Lista People: crop avatar + card inteiro a partir do round-NNN.png.
 * @param {string} roundPngPath
 * @param {{ y: number, cardBounds?: { left: number, top: number, width: number, height: number } }} profile
 * @param {string} [outDir]
 * @param {string} [filePrefix] — ex. profile-001
 */
export async function cropListProfilePhotoAndCard(
  roundPngPath,
  profile,
  outDir,
  filePrefix = "profile",
) {
  const meta = await sharp(roundPngPath).metadata();
  const w = Number(meta.width) || REF_W;
  const h = Number(meta.height) || REF_H;
  const sx = w / REF_W;
  const sy = h / REF_H;

  const size = Math.round(LIST_AVATAR_SIZE * Math.min(sx, sy));
  const avLeft = Math.round(LIST_AVATAR_LEFT * sx);
  const avTop = Math.max(
    0,
    Math.min(
      h - size,
      Math.round((Number(profile.y) + LIST_AVATAR_Y_OFF) * sy),
    ),
  );
  const photoBox = {
    left: avLeft,
    top: avTop,
    width: size,
    height: size,
  };

  const b = profile.cardBounds || {
    left: 8,
    top: Math.max(0, Number(profile.y) - 24),
    width: 524,
    height: 220,
  };
  const cardBox = scaleBox(b, w, h);

  const photoBuf = await extractPng(roundPngPath, photoBox);
  const cardBuf = await extractPng(roundPngPath, cardBox);

  /** @type {{ photoBase64: string, cardBase64: string, photoPath?: string, cardPath?: string }} */
  const out = {
    photoBase64: photoBuf.toString("base64"),
    cardBase64: cardBuf.toString("base64"),
  };

  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    const photoPath = join(outDir, `${filePrefix}-photo.png`);
    const cardPath = join(outDir, `${filePrefix}-card.png`);
    writeFileSync(photoPath, photoBuf);
    writeFileSync(cardPath, cardBuf);
    out.photoPath = photoPath;
    out.cardPath = cardPath;
  }
  return out;
}
