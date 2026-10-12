#!/usr/bin/env node
/**
 * LinkedIn: mata apps → launch → Search → "comprador" → Show all.
 * Cliques usam coords OCR fixas (engine=all, AVD 720×1280).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-extract-profiles
 *   node scripts/login-extract-profiles.js --config ./device.config.json
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { key, launch, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_AFTER_LINKEDIN_MS = 5_000;

/** Coords OCR (extract --engine all) — recalibrar se resolução/layout mudar. */
const COORDS = {
  search: { x: 175, y: 79, text: "Search" },
  showAll: { x: 269, y: 850, text: "Show all results" },
};

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function tapAt(serial, point, label) {
  console.log(`   → ${label} "${point.text}" x=${point.x} y=${point.y}`);
  tapElement({ serial, x: point.x, y: point.y });
}

/** Force-stop de todos os packages em cfg.apps. */
function stopAllApps(serial, apps) {
  const pkgs = Object.values(apps || {})
    .map((a) => a?.package)
    .filter(Boolean);
  for (const pkg of pkgs) {
    try {
      stop({ serial, package: pkg });
      console.log(`   force-stop ${pkg}`);
    } catch (e) {
      console.log(`   force-stop ${pkg} (ignorado: ${e.message || e})`);
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const linkedinPkg = cfg.apps?.linkedin?.package;
  if (!linkedinPkg) throw new Error('App "linkedin" ausente em device.config.json');

  console.log("1) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  console.log("2) Remover apps em execução…");
  stopAllApps(serial, cfg.apps);
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(500);

  console.log("3) Iniciar LinkedIn…");
  await launch({ serial, package: linkedinPkg });

  console.log(`4) Esperar ${WAIT_AFTER_LINKEDIN_MS / 1000}s…`);
  await sleep(WAIT_AFTER_LINKEDIN_MS);

  console.log("5) Clicar em Search…");
  tapAt(serial, COORDS.search, "search");
  await sleep(1_000);

  console.log('6) Digitar "comprador"…');
  await type({ serial, text: "comprador" });
  await sleep(1_000);

  console.log("7) Clicar em Show all…");
  tapAt(serial, COORDS.showAll, "showAll");

  console.log("OK — login-extract-profiles (até Show all)");
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
