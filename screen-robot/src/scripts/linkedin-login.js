#!/usr/bin/env node
/**
 * Provisiona, extrai textos (OCR) e navega na barra: Network → Post → Notifications → Jobs.
 * Após cada clique espera 5s.
 *
 * Uso:
 *   node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extract, findByText } from "../lib/extract.js";
import { screenshot, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_MS = 5_000;
const TABS = ["Network", "Post", "Notifications", "Jobs"];

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

function findTab(elements, label) {
  const re = new RegExp(`^${label}$`, "i");
  return elements.find((e) => re.test(String(e.text || "").trim())) || null;
}

async function tapTab(serial, outDir, label, step) {
  console.log(`${step}) Extrair + clicar "${label}"…`);
  const elements = await extract({ serial });
  const slug = label.toLowerCase();
  writeFileSync(
    resolve(outDir, `elements-antes-${slug}.json`),
    JSON.stringify(elements, null, 2),
    "utf8",
  );
  screenshot({ serial, path: resolve(outDir, `${String(step).padStart(2, "0")}-antes-${slug}.png`) });

  const hit = findTab(elements, label);
  if (!hit) throw new Error(`Texto "${label}" não encontrado no extract`);
  console.log(`   → "${hit.text}" x=${hit.x} y=${hit.y}`);
  tapElement({ serial, x: hit.x, y: hit.y });
  console.log(`   aguardando ${WAIT_MS / 1000}s…`);
  await sleep(WAIT_MS);
  screenshot({ serial, path: resolve(outDir, `${String(step).padStart(2, "0")}-apos-${slug}.png`) });
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

  console.log("1) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  let step = 2;
  for (const tab of TABS) {
    await tapTab(serial, outDir, tab, step);
    step += 1;
  }
  // Após navegar pelas abas, executar busca "comprador" e abrir Show all results
  console.log("OK — tabs: Network → Post → Notifications → Jobs");
  try {
    console.log("Executando busca 'comprador' e abrindo Show all results…");
    const els = await extract({ serial });
    const searchEl = els.find((e) => /^search$/i.test(String(e.text || ""))) || els.find((e) => /search/i.test(e.text || ""));
    if (searchEl) {
      tapElement({ serial, x: searchEl.x, y: searchEl.y });
      await sleep(1000);
      try {
        await type({ serial, text: "comprador", delayMs: 120 });
        await sleep(800);
        const after = await extract({ serial });
        const auto = after.find((e) => /^comprador$/i.test(String(e.text || "")));
        if (auto) {
          // clicar no item para remover teclado/autocomplete
          tapElement({ serial, x: auto.x, y: auto.y });
          await sleep(800);
        }
      } catch {
        // fallback: buscar autocomplete e tocar
        const after = await extract({ serial });
        const auto = after.find((e) => /^comprador$/i.test(String(e.text || "")));
        if (auto) {
          tapElement({ serial, x: auto.x, y: auto.y });
          await sleep(800);
        }
      }
      // procurar Show all results e clicar
      let show = await findByText(serial, "Show all", { minScore: 0.75 });
      if (!show) {
        const after2 = await extract({ serial });
        const s = after2.find((e) => /^show$/i.test(String(e.text || "")));
        const a = after2.find((e) => /^all$/i.test(String(e.text || "")) && Math.abs(e.y - (s?.y || 0)) < 40);
        if (s && a) show = { x: Math.floor((s.x + a.x) / 2), y: s.y };
      }
      if (show?.x != null) {
        tapElement({ serial, x: show.x, y: show.y });
        await sleep(1500);
        screenshot({ serial, path: resolve(outDir, "after-showall.png") });
      } else {
        console.log("Show all results não encontrado");
      }
    } else {
      console.log("Search não encontrado — pulando busca comprador");
    }
  } catch (e) {
    console.error("Erro na busca comprador:", e.message || e);
  }
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
