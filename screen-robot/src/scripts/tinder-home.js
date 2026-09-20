#!/usr/bin/env node
/**
 * Abre Tinder até a tela inicial, clica ALLOW (permissão) e imprime a lista.
 *
 * Uso:
 *   node scripts/tinder-home.js
 *   npm run tinder-home
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { createExtract, extractElements, findByText } from "../lib/extract.js";
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

/** Botão ALLOW (maiúsculo), não o "Allow" do título nem o ALLOW de DON'T ALLOW. */
async function findAllowButton(serial) {
  const { elements } = await extractElements(serial);
  const allows = elements
    .filter((e) => String(e.text || e.label || "") === "ALLOW")
    .map((e) => {
      const b = e.bounds || {
        x: e.bbox[0],
        y: e.bbox[1],
        w: e.bbox[2] - e.bbox[0],
        h: e.bbox[3] - e.bbox[1],
      };
      const center = e.center || [
        Math.floor(b.x + b.w / 2),
        Math.floor(b.y + b.h / 2),
      ];
      return { text: "ALLOW", bounds: b, center, score: 1, elements: [e] };
    })
    .sort((a, b) => a.bounds.y - b.bounds.y);
  // O botão ALLOW fica acima do ALLOW de "DON'T ALLOW"
  return allows[0] || null;
}

/** Nova sessão OCR/visão (frame fresco — extract do handle reusa cache). */
async function extractList(serial, label) {
  console.log(`${label} Extrair lista (5 passos)…`);
  const extract = createExtract(serial);
  let elements;
  for (let i = 1; i <= 5; i++) {
    elements = await extract();
    console.log(`   passo ${i}: elements=${elements.length}`);
  }
  return elements;
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const appSpec = cfg.apps?.tinder;
  if (!appSpec?.package) throw new Error('App "tinder" ausente em device.config.json');

  const outDir = resolve(ROOT, "screenshots", "tinder");
  console.log("0) Limpar screenshots/tinder…");
  clearDir(outDir);

  console.log("0.5) Resetar instância do zero…");
  const reset = await resetInstance(cfg);
  console.log(`   OK ${reset.serial}`);

  console.log("1) Provisionar…");
  const handle = await provisionEmulator(cfg);
  console.log(`   OK ${handle.serial}`);

  console.log("1.5) Abrir scrcpy…");
  const view = handle.openScrcpy({ title: `tinder-home ${handle.serial}` });
  console.log(`   OK pid=${view.pid}`);

  console.log("2) Instalar tinder…");
  const installed = await handle.installApk(appSpec);
  console.log(
    `   OK ${installed.package} ${installed.version || "?"}${installed.skipped ? " (skip)" : ""}`,
  );

  console.log("3) Abrir tinder…");
  await handle.launch(appSpec.package);
  await handle.on("ui_stable", { timeoutMs: 90_000 });

  console.log("4) Print da tela inicial…");
  const shot1 = resolve(outDir, "01-tela-inicial.png");
  handle.screenshot(shot1);
  console.log(`   OK → ${shot1}`);

  const list1 = await extractList(handle.serial, "5)");
  writeFileSync(resolve(outDir, "01-elements.json"), JSON.stringify(list1, null, 2), "utf8");
  console.log(JSON.stringify(list1, null, 2));

  console.log("6) Clicar ALLOW…");
  {
    let hit = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      hit = await findAllowButton(handle.serial);
      if (hit?.center) break;
      // fallback findByText se OCR variar
      const fb = await findByText(handle.serial, "ALLOW", { minScore: 0.9 });
      if (fb?.center && String(fb.elements?.[0]?.text || fb.elements?.[0]?.label) === "ALLOW") {
        hit = fb;
        break;
      }
      console.log(`   tentativa ${attempt}/8 — aguardando OCR ALLOW…`);
      await sleep(2_000);
    }
    if (hit?.center) {
      console.log(
        `   → "${hit.text}" center=${JSON.stringify(hit.center)} y=${hit.bounds.y}`,
      );
      handle.tapElement({ center: hit.center, bounds: hit.bounds });
      await sleep(5_000);
      await handle.on("ui_stable", { timeoutMs: 60_000 }).catch(() => {});
    } else {
      console.log("   (ALLOW botão não encontrado — segue)");
    }
  }

  console.log("7) Print após ALLOW…");
  const shot2 = resolve(outDir, "02-apos-allow.png");
  handle.screenshot(shot2);
  console.log(`   OK → ${shot2}`);

  const list2 = await extractList(handle.serial, "8)");
  handle.screenshot(resolve(outDir, "frame-screen.png"));
  const outJson = resolve(outDir, "elements.json");
  writeFileSync(outJson, JSON.stringify(list2, null, 2), "utf8");
  writeFileSync(resolve(outDir, "02-elements.json"), JSON.stringify(list2, null, 2), "utf8");
  console.log(JSON.stringify(list2, null, 2));
  console.log(`\nOK → ${outJson}`);
  console.log(`OK → ${shot2}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
