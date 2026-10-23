/**
 * Crops de mídia LinkedIn.
 * Detail: prefer bounds do dump (Cover photo / Profile photo); fallback heurística 540×960.
 * Lista: avatar+card por coords do card.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { parseProfileMediaBoundsFromUiXml } from "./linkedin-profile-media-from-uidump.js";

/** Referência do emulator (só fallback sem dump). */
const REF_W = 540;
const REF_H = 960;

const COVER_FALLBACK = { left: 0, top: 117, width: 540, height: 135 };
const PHOTO_FALLBACK = { left: 24, top: 180, width: 156, height: 156 };

/** Avatar na lista People (à esquerda do nome). */
const LIST_AVATAR_SIZE = 92;
const LIST_AVATAR_LEFT = 16;
const LIST_AVATAR_Y_OFF = -10;

/**
 * Escala box do espaço dump → pixels do PNG.
 * @param {{ left: number, top: number, width: number, height: number }} box
 * @param {number} imgW
 * @param {number} imgH
 * @param {{ width: number, height: number }|null} dumpSize
 */
export function scaleDumpBoxToImage(box, imgW, imgH, dumpSize) {
  const dw = dumpSize?.width || imgW;
  const dh = dumpSize?.height || imgH;
  // Largura igual → bounds do dump já são px do screencap (hierarchy pode ser mais baixa que o PNG).
  const sameW = Math.abs(dw - imgW) <= 2;
  const sx = sameW ? 1 : imgW / dw;
  const sy = sameW ? 1 : imgH / dh;
  let left = Math.round(box.left * sx);
  let top = Math.round(box.top * sy);
  let width = Math.round(box.width * sx);
  let height = Math.round(box.height * sy);
  left = Math.max(0, Math.min(left, imgW - 1));
  top = Math.max(0, Math.min(top, imgH - 1));
  if (left + width > imgW) width = Math.max(1, imgW - left);
  if (top + height > imgH) height = Math.max(1, imgH - top);
  return { left, top, width, height };
}

function scaleBoxRef(box, w, h) {
  return scaleDumpBoxToImage(box, w, h, { width: REF_W, height: REF_H });
}

async function extractPng(srcPath, box) {
  return sharp(srcPath).extract(box).png().toBuffer();
}

/**
 * Detail: crop avatar + capa.
 * Se `opts.uiXml` tiver Cover/Profile photo → recorte exato desses bounds.
 *
 * @param {string} cardPngPath
 * @param {string} [outDir]
 * @param {{ uiXml?: string }} [opts]
 */
export async function cropProfilePhotoAndCover(cardPngPath, outDir, opts = {}) {
  const meta = await sharp(cardPngPath).metadata();
  const w = Number(meta.width) || REF_W;
  const h = Number(meta.height) || REF_H;

  let photoBox = scaleBoxRef(PHOTO_FALLBACK, w, h);
  let coverBox = scaleBoxRef(COVER_FALLBACK, w, h);
  let source = "fallback";

  const xml = opts.uiXml != null ? String(opts.uiXml) : "";
  if (xml.includes("<node")) {
    const media = parseProfileMediaBoundsFromUiXml(xml);
    if (media.photo) {
      photoBox = scaleDumpBoxToImage(media.photo, w, h, media.dumpSize);
      source = "dump";
    }
    if (media.cover) {
      coverBox = scaleDumpBoxToImage(media.cover, w, h, media.dumpSize);
      source = "dump";
    }
  }

  const photoBuf = await extractPng(cardPngPath, photoBox);
  const coverBuf = await extractPng(cardPngPath, coverBox);

  /** @type {{ photoBase64: string|null, coverBase64: string|null, cardBase64: string|null, photoPath?: string, coverPath?: string, cardPath?: string, source: string, photoBox: object, coverBox: object }} */
  const out = {
    photoBase64: photoBuf.toString("base64"),
    coverBase64: coverBuf.toString("base64"),
    cardBase64: null,
    source,
    photoBox,
    coverBox,
  };

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
 * @param {string} [filePrefix]
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
  const cardBox = scaleBoxRef(b, w, h);

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
