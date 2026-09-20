#!/usr/bin/env node
/**
 * Abre LinkedIn, tira print da tela inicial e imprime a árvore de componentes.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

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

  console.log("5) Extrair árvore (5 passos)…");
  let tree;
  for (let i = 1; i <= 5; i++) {
    tree = await handle.extract();
    console.log(`   passo ${i}: children=${tree.children?.length ?? 0}`);
  }

  handle.screenshot(resolve(outDir, "tree-screen.png"));
  const json = JSON.stringify(tree, null, 2);
  const outJson = resolve(outDir, "component-tree.json");
  writeFileSync(outJson, json, "utf8");
  console.log(json);
  console.log(`\nOK → ${outJson}`);
  console.log(`OK → ${resolve(outDir, "tree-screen.png")}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
