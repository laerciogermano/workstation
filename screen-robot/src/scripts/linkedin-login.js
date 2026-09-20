#!/usr/bin/env node
/**
 * Abre LinkedIn, clica AGREE ou JOIN NOW (se houver) e imprime a árvore.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extractElements } from "../lib/extract.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function findAgree(elements) {
  return (
    elements.find(
      (el) =>
        el.clickable &&
        /^(agree|aceitar|aceito|concordo)$/i.test(String(el.label || "").trim()),
    ) ||
    elements.find(
      (el) => el.clickable && /^agree$/i.test(String(el.text || "").trim()),
    ) ||
    elements.find((el) => /agree/i.test(String(el.label || "")))
  );
}

function findJoinNow(elements) {
  const isJoin = (s) =>
    /^(join\s*now|cadastre[- ]?se|inscreva[- ]?se)$/i.test(String(s || "").trim());
  return (
    elements.find((el) => el.clickable && (isJoin(el.label) || isJoin(el.text))) ||
    elements.find((el) => isJoin(el.label) || isJoin(el.text)) ||
    elements.find((el) => /join\s*now/i.test(String(el.label || "")))
  );
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const outDir = resolve(ROOT, "screenshots");
  mkdirSync(outDir, { recursive: true });

  console.log("1) Provisionar…");
  const handle = await provisionEmulator(cfg);
  console.log(`   OK ${handle.serial}`);

  console.log("2) Instalar LinkedIn…");
  const li = await handle.installApk(cfg.apps.linkedin);
  console.log(`   OK ${li.package} ${li.version || "?"}${li.skipped ? " (skip)" : ""}`);

  console.log("3) Abrir LinkedIn…");
  await handle.launch(cfg.apps.linkedin.package);
  await handle.on("ui_stable", { timeoutMs: 90_000 });
  handle.screenshot(resolve(outDir, "01-antes-agree.png"));

  console.log("4) Clicar AGREE ou JOIN NOW…");
  const { elements } = extractElements(handle.serial);
  const agree = findAgree(elements);
  if (agree?.center) {
    console.log(`   → AGREE: ${agree.label || agree.text}`);
    handle.tapElement(agree);
    await sleep(5_000);
    handle.screenshot(resolve(outDir, "02-apos-agree.png"));
  } else {
    const join = findJoinNow(elements);
    if (join?.center) {
      console.log(`   → JOIN NOW: ${join.label || join.text}`);
      handle.tapElement(join);
      await sleep(5_000);
      handle.screenshot(resolve(outDir, "02-apos-join-now.png"));
    } else {
      console.log("   (AGREE e JOIN NOW não encontrados — segue)");
    }
  }

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
