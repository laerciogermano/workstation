#!/usr/bin/env node
/**
 * Extrai OCR de uma ou mais imagens e imprime o texto.
 *
 * Uso (a partir de screen-robot/src):
 *   npm run ocr -- screenshots/home.png
 *   npm run ocr -- home.png
 *   node scripts/ocr-image.js screenshots/*.png
 *
 * Sem diretório no nome → lê em screenshots/<nome>.
 */
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ocrWords } from "../lib/ocr.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHOTS = resolve(ROOT, "screenshots");

function usage(code = 1) {
  console.error(`Uso:
  npm run ocr -- <imagem.png> [mais.png…]
  npm run ocr -- --all
  node scripts/ocr-image.js screenshots/home.png

Opções:
  --all   processa todos os .png em screenshots/
  -h      ajuda

Sem path → resolve em screenshots/<nome>.`);
  process.exit(code);
}

function resolveImagePath(name) {
  if (isAbsolute(name) || name.includes("/") || name.includes("\\")) {
    return resolve(name);
  }
  return resolve(SHOTS, basename(name));
}

function listAllShots() {
  if (!existsSync(SHOTS)) return [];
  return readdirSync(SHOTS)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort()
    .map((f) => resolve(SHOTS, f));
}

function parseArgs(argv) {
  const files = [];
  let all = false;
  for (const a of argv) {
    if (a === "-h" || a === "--help") usage(0);
    if (a === "--all") {
      all = true;
      continue;
    }
    if (a.startsWith("-")) {
      console.error(`Flag desconhecida: ${a}`);
      usage(1);
    }
    files.push(a);
  }
  return { files, all };
}

async function runOne(path) {
  if (!existsSync(path)) {
    throw new Error(`Arquivo não encontrado: ${path}`);
  }
  const words = await ocrWords(path);
  const text = words.map((w) => w.text).join(" ");
  console.log(`\n=== ${basename(path)} ===`);
  console.log(text || "(sem texto)");
  return words;
}

async function main() {
  const { files, all } = parseArgs(process.argv.slice(2));
  const paths = all
    ? listAllShots()
    : files.map(resolveImagePath);

  if (!paths.length) usage(1);

  for (const path of paths) {
    await runOne(path);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
