#!/usr/bin/env node
/**
 * LinkedIn: mata apps → launch → Search → "comprador" → Show all →
 * extrai OCR, entra em cada perfil, salva e imprime quantidade + último
 * até não haver mais perfis (fim da lista).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-extract-profiles
 *   node scripts/login-extract-profiles.js --config ./device.config.json
 */
import { createHash } from "node:crypto";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extract } from "../lib/extract.js";
import { captureFrame } from "../lib/frame.js";
import {
  key,
  launch,
  scroll,
  screenshot,
  stop,
  tapElement,
  type,
} from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_AFTER_LINKEDIN_MS = 5_000;
const SCROLL_DELAY_MS = 400;
const SCROLL_DISTANCE = 700;
const SCROLL_BURST = 2;
const MAX_PROFILES = 80;
const MAX_ROUNDS = 60;
const STABLE_EMPTY_NEEDED = 2;

/** Coords OCR (extract --engine all) — recalibrar se resolução/layout mudar. */
const COORDS = {
  search: { x: 175, y: 79, text: "Search" },
  showAll: { x: 269, y: 850, text: "Show all results" },
  people: { x: 63, y: 154, text: "People" },
};

const ACTION_RE = /^(connect|\+?\s*connect|pending|message|follow)$/i;
const NOISE_RE =
  /^(people|posts|jobs|schools|courses|1st|2nd|3rd\+|past:|current:|mutual|connections?|connection|brazil|show|search|home|network|notifications|location|locatior|·|-|\+)$/i;

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function tapAt(serial, point, label) {
  console.log(`   → ${label} "${point.text}" x=${point.x} y=${point.y}`);
  tapElement({ serial, x: point.x, y: point.y });
}

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

/**
 * Cards da lista People: âncora Connect/Pending/Message + nome na faixa.
 * @param {{ text?: string, x: number, y: number }[]} elements
 */
function findListProfiles(elements) {
  const actions = elements
    .filter(
      (e) =>
        ACTION_RE.test(String(e.text || "").trim()) &&
        e.y > 170 &&
        e.y < 860,
    )
    .sort((a, b) => a.y - b.y);

  /** @type {{ name: string, key: string, x: number, y: number, action: string, card: object[] }[]} */
  const out = [];
  const seen = new Set();

  for (const act of actions) {
    const band = elements.filter(
      (e) => e.y >= act.y - 100 && e.y <= act.y + 60 && e.x < 400,
    );
    const nameParts = band
      .filter((e) => {
        const t = String(e.text || "").trim();
        if (t.length < 2 || NOISE_RE.test(t) || ACTION_RE.test(t)) return false;
        if (/^\d+$/.test(t) || /^[^\p{L}]+$/u.test(t)) return false;
        return /^[\p{L}]/u.test(t);
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (!nameParts.length) continue;
    const y0 = nameParts[0].y;
    const line = nameParts.filter((e) => Math.abs(e.y - y0) < 24);
    const name = line
      .map((e) => String(e.text).trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (name.length < 3) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      key,
      x: line[0].x,
      y: line[0].y,
      action: String(act.text),
      card: band.map((e) => ({ text: e.text, x: e.x, y: e.y })),
    });
  }
  return out;
}

function isListScreen(elements) {
  const texts = elements.map((e) => String(e.text || "").toLowerCase());
  const hasPeople = texts.some((t) => t === "people");
  const hasChip =
    texts.some((t) => t === "posts") || texts.some((t) => t === "jobs");
  return hasPeople && hasChip;
}

async function backToList(serial) {
  for (let i = 0; i < 4; i++) {
    const els = await extract({ serial, engine: "all" });
    if (isListScreen(els)) return els;
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(1_200);
  }
  return extract({ serial, engine: "all" });
}

/**
 * Abre o perfil, OCR completo, salva artefatos e volta à lista.
 */
async function openAndSaveProfile(serial, candidate, outDir, index) {
  console.log(`   abrir perfil #${index}: "${candidate.name}" x=${candidate.x} y=${candidate.y}`);
  tapElement({ serial, x: candidate.x, y: candidate.y });
  await sleep(2_500);

  const ocr = await extract({ serial, engine: "all" });
  const slug = String(index).padStart(3, "0");
  const shotPath = join(outDir, `profile-${slug}.png`);
  screenshot({ serial, path: shotPath });

  const profile = {
    index,
    listName: candidate.name,
    listAction: candidate.action,
    listCard: candidate.card,
    extractedAt: new Date().toISOString(),
    screenshot: shotPath,
    ocr,
    texts: ocr.map((e) => e.text),
  };
  writeFileSync(
    join(outDir, `profile-${slug}.json`),
    JSON.stringify(profile, null, 2),
    "utf8",
  );

  key({ serial, code: "KEYCODE_BACK" });
  await sleep(1_500);
  await backToList(serial);
  return profile;
}

function printProgress(saved) {
  const last = saved[saved.length - 1];
  console.log(`\n========== quantidade: ${saved.length} ==========`);
  console.log("ultimo perfil extraido:");
  console.log(
    JSON.stringify(
      {
        index: last.index,
        listName: last.listName,
        listAction: last.listAction,
        extractedAt: last.extractedAt,
        screenshot: last.screenshot,
        texts: last.texts,
        ocr: last.ocr,
      },
      null,
      2,
    ),
  );
  console.log("==============================================\n");
}

async function extractProfilesLoop(serial, outDir) {
  /** @type {object[]} */
  const saved = [];
  const seen = new Set();
  let stableEmpty = 0;
  let prevHash = await frameHash(serial);

  for (let round = 1; round <= MAX_ROUNDS && saved.length < MAX_PROFILES; round++) {
    console.log(`9.${round}) OCR lista…`);
    const els = await extract({ serial, engine: "all" });
    writeFileSync(
      join(outDir, `list-round-${String(round).padStart(3, "0")}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );

    const candidates = findListProfiles(els).filter((p) => !seen.has(p.key));
    console.log(`   candidatos novos: ${candidates.length}`);

    if (candidates.length === 0) {
      for (let b = 0; b < SCROLL_BURST; b++) {
        scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
        await sleep(SCROLL_DELAY_MS);
      }
      const nextHash = await frameHash(serial);
      if (nextHash === prevHash) {
        stableEmpty += 1;
        console.log(
          `   sem novos + frame estável (${stableEmpty}/${STABLE_EMPTY_NEEDED})`,
        );
        if (stableEmpty >= STABLE_EMPTY_NEEDED) {
          console.log("   fim: não há mais perfis");
          break;
        }
      } else {
        stableEmpty = 0;
        prevHash = nextHash;
        console.log("   scroll avançou — continua");
      }
      continue;
    }

    stableEmpty = 0;
    for (const c of candidates) {
      if (saved.length >= MAX_PROFILES) break;
      seen.add(c.key);
      const profile = await openAndSaveProfile(
        serial,
        c,
        outDir,
        saved.length + 1,
      );
      saved.push(profile);
      writeFileSync(
        join(outDir, "profiles.json"),
        JSON.stringify(saved, null, 2),
        "utf8",
      );
      printProgress(saved);
    }

    for (let b = 0; b < SCROLL_BURST; b++) {
      scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
      await sleep(SCROLL_DELAY_MS);
    }
    prevHash = await frameHash(serial);
  }

  return saved;
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

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(ROOT, "screenshots", "login-extract-profiles", stamp);
  mkdirSync(outDir, { recursive: true });
  console.log(`saida: ${outDir}`);

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

  console.log("8) Aba People…");
  tapAt(serial, COORDS.people, "people");
  await sleep(1_500);

  console.log("9) Extrair perfis até o fim…");
  const saved = await extractProfilesLoop(serial, outDir);

  console.log(`OK — ${saved.length} perfis em ${outDir}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
