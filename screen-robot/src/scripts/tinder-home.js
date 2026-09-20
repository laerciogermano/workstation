#!/usr/bin/env node
/**
 * Abre Tinder: ALLOW → Continue with Phone Number → lista da tela seguinte.
 *
 * Uso:
 *   node scripts/tinder-home.js
 *   npm run tinder-home
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { captureFrame } from "../lib/frame.js";
import {
  createExtract,
  extractElements,
  findByText,
  matchByText,
} from "../lib/extract.js";
import { provisionEmulator } from "../lib/provision.js";
import { resetInstance } from "../lib/reset-instance.js";
import { createWorker } from "tesseract.js";
import { spawnSync } from "node:child_process";

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

function pngSize(path) {
  const r = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], {
    encoding: "utf8",
  });
  const w = Number(/pixelWidth:\s*(\d+)/.exec(r.stdout || "")?.[1] || 720);
  const h = Number(/pixelHeight:\s*(\d+)/.exec(r.stdout || "")?.[1] || 1280);
  return { w, h };
}

/**
 * Busca obrigatória por texto: "Continue with Phone Number".
 * findByText primeiro; fallback OCR em faixa (botão branco falha no full-frame).
 */
async function findContinueWithPhoneNumber(serial) {
  const query = "Continue with Phone Number";
  console.log(`   buscar texto: "${query}"`);

  let hit = await findByText(serial, query, { minScore: 0.75 });
  if (hit?.center) {
    console.log(`   findByText → "${hit.text}" score=${hit.score.toFixed(2)}`);
    return inflateButtonHit(hit);
  }

  const framePath = await captureFrame(serial);
  const { w, h } = pngSize(framePath);
  const rect = {
    left: Math.floor(w * 0.02),
    top: Math.floor(h * 0.5),
    width: Math.floor(w * 0.96),
    height: Math.floor(h * 0.4),
  };
  console.log(
    `   findByText vazio — OCR faixa y=${rect.top}..${rect.top + rect.height}`,
  );
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "11" });
    const r = await worker.recognize(framePath, { rectangle: rect });
    const elements = (r.data.words || [])
      .filter((word) => word.text?.trim() && (word.confidence ?? 0) >= 40)
      .map((word, i) => {
        const b = word.bbox || {};
        const x0 = Number(b.x0 ?? 0);
        const y0 = Number(b.y0 ?? 0);
        const x1 = Number(b.x1 ?? x0);
        const y1 = Number(b.y1 ?? y0);
        return {
          id: `b${i}`,
          kind: "text",
          label: String(word.text).trim(),
          text: String(word.text).trim(),
          bbox: [x0, y0, x1, y1],
          bounds: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) },
          center: [Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2)],
          source: "ocr-band",
        };
      });
    const texts = elements.map((e) => e.text).join(" ");
    console.log(`   OCR faixa: ${texts.slice(0, 120)}${texts.length > 120 ? "…" : ""}`);
    hit = matchByText(elements, query, { minScore: 0.75 });
    if (hit?.center) return inflateButtonHit(hit);
    return null;
  } finally {
    await worker.terminate();
  }
}

/** Amplia bounds do texto OCR para cobrir o botão pill (mais alto que a linha). */
function inflateButtonHit(hit) {
  const b = hit.bounds || { x: 0, y: 0, w: 0, h: 0 };
  const padY = Math.max(24, Math.floor(b.h * 1.5));
  const padX = Math.max(16, Math.floor(b.w * 0.05));
  const bounds = {
    x: Math.max(0, b.x - padX),
    y: Math.max(0, b.y - padY),
    w: b.w + padX * 2,
    h: b.h + padY * 2,
  };
  const center = [
    Math.floor(bounds.x + bounds.w / 2),
    Math.floor(bounds.y + bounds.h / 2),
  ];
  return { ...hit, bounds, center };
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
  writeFileSync(resolve(outDir, "02-elements.json"), JSON.stringify(list2, null, 2), "utf8");
  console.log(JSON.stringify(list2, null, 2));

  console.log("9) Clicar Continue with Phone Number…");
  {
    let hit = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      hit = await findContinueWithPhoneNumber(handle.serial);
      if (hit?.center) break;
      console.log(`   tentativa ${attempt}/8 — aguardando OCR…`);
      await sleep(2_000);
    }
    if (hit?.center) {
      console.log(
        `   → "${hit.text}" score=${hit.score.toFixed(2)} parts=${hit.elements.length} center=${JSON.stringify(hit.center)}`,
      );
      handle.tapElement({ center: hit.center, bounds: hit.bounds });
      await sleep(5_000);
      await handle.on("ui_stable", { timeoutMs: 60_000 }).catch(() => {});
    } else {
      console.log("   (Continue with Phone Number não encontrado — segue)");
    }
  }

  console.log("10) Print após Phone Number…");
  const shot3 = resolve(outDir, "03-apos-phone-number.png");
  handle.screenshot(shot3);
  console.log(`   OK → ${shot3}`);

  const list3 = await extractList(handle.serial, "11)");
  handle.screenshot(resolve(outDir, "frame-screen.png"));
  const outJson = resolve(outDir, "elements.json");
  writeFileSync(outJson, JSON.stringify(list3, null, 2), "utf8");
  writeFileSync(resolve(outDir, "03-elements.json"), JSON.stringify(list3, null, 2), "utf8");
  console.log(JSON.stringify(list3, null, 2));
  console.log(`\nOK → ${outJson}`);
  console.log(`OK → ${shot3}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
