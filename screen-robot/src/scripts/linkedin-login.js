#!/usr/bin/env node
/**
 * Abre LinkedIn, clica “Sign in with Email” e imprime a lista de elementos.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { findByText } from "../lib/extract.js";
import { provisionEmulator } from "../lib/provision.js";
import { resetInstance } from "../lib/reset-instance.js";

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

  console.log("0.5) Resetar instância do zero…");
  const reset = await resetInstance(cfg);
  console.log(`   OK ${reset.serial}`);

  console.log("1) Provisionar…");
  const handle = await provisionEmulator(cfg);
  console.log(`   OK ${handle.serial}`);

  console.log("1.5) Abrir scrcpy…");
  const view = handle.openScrcpy({ title: `linkedin-login ${handle.serial}` });
  console.log(`   OK pid=${view.pid}`);

  console.log("2) Instalar LinkedIn…");
  const li = await handle.installApk(cfg.apps.linkedin);
  console.log(`   OK ${li.package} ${li.version || "?"}${li.skipped ? " (skip)" : ""}`);

  console.log("3) Abrir LinkedIn…");
  await handle.launch(cfg.apps.linkedin.package);
  await handle.on("ui_stable", { timeoutMs: 90_000 });

  console.log("4) Print da tela inicial…");
  const shotPath = resolve(outDir, "01-tela-inicial.png");
  handle.screenshot(shotPath);
  console.log(`   OK → ${shotPath}`);

  console.log("5) Clicar Sign in with Email…");
  {
    let hit = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      hit = await findByText(handle.serial, "Sign in with Email", {
        minScore: 0.75,
      });
      if (hit?.center) break;
      console.log(`   tentativa ${attempt}/8 — aguardando OCR…`);
      await sleep(3_000);
    }
    if (hit?.center) {
      console.log(
        `   → "${hit.text}" score=${hit.score.toFixed(2)} parts=${hit.elements.length}`,
      );
      handle.tapElement({ center: hit.center, bounds: hit.bounds });
      await sleep(5_000);
      handle.screenshot(resolve(outDir, "02-apos-sign-in-email.png"));
    } else {
      console.log("   (Sign in with Email não encontrado — segue)");
    }
  }

  console.log("6) Extrair lista (5 passos)…");
  let elements;
  for (let i = 1; i <= 5; i++) {
    elements = await handle.extract();
    console.log(`   passo ${i}: elements=${elements.length}`);
  }

  handle.screenshot(resolve(outDir, "frame-screen.png"));
  const json = JSON.stringify(elements, null, 2);
  const outJson = resolve(outDir, "elements.json");
  writeFileSync(outJson, json, "utf8");
  console.log(json);
  console.log(`\nOK → ${outJson}`);
  console.log(`OK → ${resolve(outDir, "frame-screen.png")}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
