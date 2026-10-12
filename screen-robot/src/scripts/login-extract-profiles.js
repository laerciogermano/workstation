#!/usr/bin/env node
/**
 * LinkedIn: gaveta → app → Search → "comprador" → Show all.
 *
 * Uso:
 *   node scripts/login-extract-profiles.js
 *   npm run login-extract-profiles
 *   node scripts/login-extract-profiles.js --config ./device.config.json
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { findByText } from "../lib/extract.js";
import { key, scroll, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_AFTER_LINKEDIN_MS = 5_000;

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

/**
 * @param {string} serial
 * @param {string[]} queries
 * @param {{ minScore?: number, attempts?: number, delayMs?: number }} [opts]
 */
async function waitFind(serial, queries, opts = {}) {
  const attempts = opts.attempts ?? 8;
  const delayMs = opts.delayMs ?? 1_500;
  const minScore = opts.minScore ?? 0.75;
  for (let i = 1; i <= attempts; i++) {
    for (const q of queries) {
      const hit = await findByText(serial, q, { minScore });
      if (hit?.x != null) return hit;
    }
    console.log(`   tentativa ${i}/${attempts} — aguardando: ${queries.join(" | ")}`);
    await sleep(delayMs);
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);

  console.log("1) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  console.log("2) Abrir gaveta de apps (HOME + scroll down)…");
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(800);
  scroll({ serial, direction: "down" });
  await sleep(1_000);

  console.log("3) Clicar no LinkedIn…");
  {
    const hit = await waitFind(serial, ["LinkedIn", "Linkedln"]);
    if (!hit) throw new Error('LinkedIn não encontrado na gaveta');
    console.log(`   → "${hit.text}" x=${hit.x} y=${hit.y}`);
    tapElement({ serial, x: hit.x, y: hit.y });
  }

  console.log(`4) Esperar ${WAIT_AFTER_LINKEDIN_MS / 1000}s…`);
  await sleep(WAIT_AFTER_LINKEDIN_MS);

  console.log("5) Clicar em Search…");
  {
    const hit = await waitFind(serial, ["Search"]);
    if (!hit) throw new Error("Search não encontrado");
    console.log(`   → "${hit.text}" x=${hit.x} y=${hit.y}`);
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(1_000);
  }

  console.log('6) Digitar "comprador"…');
  await type({ serial, text: "comprador" });
  await sleep(1_000);

  console.log("7) Clicar em Show all…");
  {
    let hit = await waitFind(serial, ["Show all results", "Show all", "Showall"], {
      attempts: 4,
      delayMs: 1_000,
    });
    if (!hit) {
      // teclado pode cobrir o link — BACK revela Show all sem fechar a busca se o campo já tem texto
      key({ serial, code: "KEYCODE_BACK" });
      await sleep(800);
      hit = await waitFind(serial, ["Show all results", "Show all", "Showall"]);
    }
    if (!hit) throw new Error("Show all não encontrado");
    console.log(`   → "${hit.text}" x=${hit.x} y=${hit.y}`);
    tapElement({ serial, x: hit.x, y: hit.y });
  }

  console.log("OK — login-extract-profiles (até Show all)");
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
