#!/usr/bin/env node
/**
 * Abre app até a tela inicial: print + extract.
 *
 * Uso:
 *   node scripts/app-home.js --app tinder
 *   node scripts/app-home.js --app instagram --config ./device.config.json
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

function clearDir(dir) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  let appKey = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
    if (argv[i] === "--app") appKey = argv[++i];
  }
  if (!appKey) throw new Error("Uso: node scripts/app-home.js --app <tinder|instagram|…>");

  const cfg = loadConfig(configPath);
  const appSpec = cfg.apps?.[appKey];
  if (!appSpec?.package) {
    throw new Error(`App "${appKey}" ausente em device.config.json (apps.${appKey})`);
  }

  const outDir = resolve(ROOT, "screenshots", appKey);
  console.log(`0) Limpar screenshots/${appKey}…`);
  clearDir(outDir);

  console.log("0.5) Resetar instância do zero…");
  const reset = await resetInstance(cfg);
  console.log(`   OK ${reset.serial}`);

  console.log("1) Provisionar…");
  const handle = await provisionEmulator(cfg);
  console.log(`   OK ${handle.serial}`);

  console.log(`1.5) Abrir scrcpy…`);
  const view = handle.openScrcpy({ title: `${appKey}-home ${handle.serial}` });
  console.log(`   OK pid=${view.pid}`);

  console.log(`2) Instalar ${appKey}…`);
  const installed = await handle.installApk(appSpec);
  console.log(
    `   OK ${installed.package} ${installed.version || "?"}${installed.skipped ? " (skip)" : ""}`,
  );

  console.log(`3) Abrir ${appKey}…`);
  await handle.launch(appSpec.package);
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
