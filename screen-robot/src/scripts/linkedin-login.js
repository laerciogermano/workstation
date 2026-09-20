#!/usr/bin/env node
/**
 * Abre LinkedIn: AGREE → “Already have an account? Sign in” → árvore.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extractElements } from "../lib/extract.js";
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

function findSignIn(elements) {
  const already = (s) =>
    /already\s+have\s+an\s+account/i.test(String(s || "")) &&
    /sign\s*in/i.test(String(s || ""));
  const isSignIn = (s) => {
    const t = String(s || "").trim();
    return /^(sign\s*in|entrar|log\s*in|login)$/i.test(t) || /sign\s*in/i.test(t);
  };
  return (
    elements.find((el) => el.clickable && (already(el.label) || already(el.text))) ||
    elements.find((el) => already(el.label) || already(el.text)) ||
    elements.find((el) => el.clickable && (isSignIn(el.label) || isSignIn(el.text))) ||
    elements.find((el) => isSignIn(el.label) || isSignIn(el.text))
  );
}

async function tapAndShot(handle, el, outPath, waitMs = 5_000) {
  handle.tapElement(el);
  await sleep(waitMs);
  handle.screenshot(outPath);
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
  handle.screenshot(resolve(outDir, "01-antes-agree.png"));

  console.log("4) Clicar AGREE (se existir)…");
  {
    const { elements } = extractElements(handle.serial);
    const agree = findAgree(elements);
    if (agree?.center) {
      console.log(`   → ${agree.label || agree.text}`);
      await tapAndShot(handle, agree, resolve(outDir, "02-apos-agree.png"));
    } else {
      console.log("   (AGREE não encontrado — segue)");
    }
  }

  console.log("5) Clicar Already have an account? Sign in…");
  {
    const { elements } = extractElements(handle.serial);
    const signIn = findSignIn(elements);
    if (signIn?.center) {
      console.log(`   → ${signIn.label || signIn.text}`);
      handle.tapElement(signIn);
      await sleep(5_000);
      handle.screenshot(resolve(outDir, "03-apos-login.png"));
    } else {
      console.log("   (Sign in não encontrado — segue)");
    }
  }

  console.log("6) Extrair árvore (5 passos)…");
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
