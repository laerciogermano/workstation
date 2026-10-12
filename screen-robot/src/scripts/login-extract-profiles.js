#!/usr/bin/env node
/**
 * LinkedIn: mata apps → launch → Search → "comprador" → Show all → scroll até o fim.
 * Cliques usam coords OCR fixas (engine=all, AVD 720×1280).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-extract-profiles
 *   node scripts/login-extract-profiles.js --config ./device.config.json
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { captureFrame } from "../lib/frame.js";
import { key, launch, scroll, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_AFTER_LINKEDIN_MS = 5_000;
const SCROLL_MAX = 25;
const SCROLL_STABLE_NEEDED = 2;
const SCROLL_DELAY_MS = 350;
/** Quase uma tela (AVD 1280 de altura); default da lib é ~0.35h. */
const SCROLL_DISTANCE = 1_000;
/** Scrolls por checagem de fim (menos screenshots = mais rápido). */
const SCROLL_BURST = 3;

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

async function frameHash(serial) {
  const path = await captureFrame(serial);
  return createHash("sha1").update(readFileSync(path)).digest("hex");
}

/** Scroll down (grande + rápido) até o frame não mudar N vezes seguidas. */
async function scrollToEnd(serial) {
  let prev = await frameHash(serial);
  let stable = 0;
  let n = 0;
  while (n < SCROLL_MAX) {
    for (let b = 0; b < SCROLL_BURST && n < SCROLL_MAX; b++) {
      n += 1;
      scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
      await sleep(SCROLL_DELAY_MS);
    }
    const next = await frameHash(serial);
    if (next === prev) {
      stable += 1;
      console.log(`   após ${n} scrolls: sem mudança (${stable}/${SCROLL_STABLE_NEEDED})`);
      if (stable >= SCROLL_STABLE_NEEDED) {
        console.log("   fim da página");
        return;
      }
    } else {
      stable = 0;
      prev = next;
      console.log(`   após ${n} scrolls: avançou`);
    }
  }
  console.log(`   limite de ${SCROLL_MAX} scrolls — para`);
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
  await sleep(2_000);

  console.log("8) Rolar até o fim da página…");
  await scrollToEnd(serial);

  console.log("OK — login-extract-profiles (Show all + fim da lista)");
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
