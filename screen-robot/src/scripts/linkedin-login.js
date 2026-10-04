#!/usr/bin/env node
/**
 * Provisiona, extrai textos (OCR) e clica em "Network" pelo x,y do resultado.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { on } from "../lib/events.js";
import { extract } from "../lib/extract.js";
import { screenshot, tapElement } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function clearScreenshots(dir) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const outDir = resolve(ROOT, "screenshots");
  console.log("0) Limpar screenshots…");
  clearScreenshots(outDir);

  // console.log("0.5) Resetar instância do zero…");
  // const reset = await resetInstance(cfg);
  // console.log(`   OK ${reset.serial}`);

  console.log("1) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  console.log("2) Extrair textos (OCR)…");
  const elements = await extract({ serial });
  console.log(elements);
  writeFileSync(resolve(outDir, "elements.json"), JSON.stringify(elements, null, 2), "utf8");
  screenshot({ serial, path: resolve(outDir, "01-antes-network.png") });

  console.log('3) Clicar "Network" (x,y do extract)…');
  const network =
    elements.find((e) => /^network$/i.test(String(e.text || "").trim())) ||
    null;
  if (!network) {
    throw new Error('Texto "Network" não encontrado no extract');
  }
  console.log(`   → "${network.text}" x=${network.x} y=${network.y}`);
  tapElement({ serial, x: network.x, y: network.y });
  await sleep(3_000);
  await on({ serial, event: "ui_stable", timeoutMs: 60_000 }).catch(() => {});

  screenshot({ serial, path: resolve(outDir, "02-apos-network.png") });
  const after = await extract({ serial });
  writeFileSync(resolve(outDir, "elements-apos-network.json"), JSON.stringify(after, null, 2), "utf8");
  console.log("4) Após Network:");
  console.log(after);
  console.log(`OK → ${resolve(outDir, "02-apos-network.png")}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
