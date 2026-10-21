#!/usr/bin/env node
/**
 * 1 perfil da API → Search booleana → abre perfil → scroll + extract → POST /profile-details.
 *
 * Uso (cwd: screen-robot/src):
 *   PROFILES_API_URL=http://localhost:3000 npm run login-extract-profile-detail -- --id <uuid>
 */
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extract, findByText, waitForText } from "../lib/extract.js";
import { booleanQueryForProfile } from "../lib/linkedin-boolean-query.js";
import { profilesFromExtract } from "../lib/linkedin-list-profiles.js";
import { parseProfilePageOcr } from "../lib/linkedin-profile-page.js";
import { key, launch, scroll, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
if (!process.env.OCR_MERGE_TIMEOUT_MS) {
  process.env.OCR_MERGE_TIMEOUT_MS = "20000";
}

const WAIT_AFTER_LINKEDIN_MS = 5_000;
const WAIT_AFTER_SEARCH_MS = 2_000;
const WAIT_AFTER_PROFILE_MS = 2_500;
const WAIT_SEE_ALL_KEYBOARD_MS = 8_000;
const WAIT_TEXT_TIMEOUT_MS = 30_000;
const WAIT_TEXT_INTERVAL_MS = 1_000;
const CLEAR_DEL_COUNT = 80;
const PROFILE_SCROLLS = 3;
const SCROLL_DISTANCE = 320;
const SCROLL_DELAY_MS = 900;
const OCR_ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";
const PROFILES_API_URL = (process.env.PROFILES_API_URL || "").replace(/\/$/, "");
const SEE_ALL_QUERIES = [
  "See all results",
  "Show all results",
  "See all",
  "Show all",
];
const PEOPLE_QUERIES = ["People"];

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

async function findFirstByText(serial, queries, opts = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  const minScore = opts.minScore ?? 0.75;
  for (const q of list) {
    const hit = await findByText(serial, q, {
      minScore,
      engine: OCR_ENGINE,
    });
    if (hit?.x != null && hit?.y != null) {
      return { hit, query: q };
    }
  }
  return null;
}

async function tapByText(serial, queries, label, opts = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  const attempts = opts.attempts ?? 4;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const found = await findFirstByText(serial, list, opts);
    if (found) {
      const { hit, query } = found;
      console.log(
        `   → ${label} "${hit.text}" x=${hit.x} y=${hit.y} (query="${query}" score=${hit.score?.toFixed?.(2) ?? hit.score})`,
      );
      tapElement({ serial, x: hit.x, y: hit.y });
      return hit;
    }
    console.log(
      `   ${label}: texto não encontrado (${attempt}/${attempts}) — ${list.join(" | ")}`,
    );
    await sleep(1_000);
  }
  throw new Error(`${label}: não encontrado — ${list.join(" | ")}`);
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

async function clearSearchField(serial) {
  const clearHit = await findFirstByText(
    serial,
    ["Clear text", "Clear", "×"],
    { minScore: 0.65 },
  );
  if (clearHit) {
    const { hit } = clearHit;
    console.log(`   → clear "${hit.text}" x=${hit.x} y=${hit.y}`);
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(400);
    return;
  }
  try {
    key({ serial, code: "KEYCODE_MOVE_END" });
  } catch {
    /* ignore */
  }
  for (let i = 0; i < CLEAR_DEL_COUNT; i++) {
    key({ serial, code: "KEYCODE_DEL" });
  }
  await sleep(300);
}

async function ensureSearchFocused(serial) {
  const bar = await findFirstByText(serial, ["Search", "Search people"], {
    minScore: 0.7,
  });
  if (bar) {
    tapElement({ serial, x: bar.hit.x, y: bar.hit.y });
    await sleep(800);
    return;
  }
  const any = await findFirstByText(serial, ["AND", "See all", "Show all"], {
    minScore: 0.6,
  });
  if (any && any.hit.y < 160) {
    tapElement({ serial, x: any.hit.x, y: any.hit.y });
    await sleep(800);
    return;
  }
  await tapByText(serial, "Search", "search");
  await sleep(800);
}

async function submitSeeAll(serial) {
  let seeAllHit;
  try {
    seeAllHit = await waitForText(serial, SEE_ALL_QUERIES, {
      timeoutMs: WAIT_SEE_ALL_KEYBOARD_MS,
      intervalMs: WAIT_TEXT_INTERVAL_MS,
      engine: OCR_ENGINE,
    });
    console.log("   (com teclado aberto)");
  } catch {
    console.log("   não achou com teclado — KEYCODE_BACK…");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(800);
    seeAllHit = await waitForText(serial, SEE_ALL_QUERIES, {
      timeoutMs: WAIT_TEXT_TIMEOUT_MS,
      intervalMs: WAIT_TEXT_INTERVAL_MS,
      engine: OCR_ENGINE,
    });
  }
  console.log(
    `   → seeAll "${seeAllHit.text}" x=${seeAllHit.x} y=${seeAllHit.y} (query="${seeAllHit.query}" score=${seeAllHit.score?.toFixed?.(2) ?? seeAllHit.score})`,
  );
  tapElement({ serial, x: seeAllHit.x, y: seeAllHit.y });
  await sleep(WAIT_AFTER_SEARCH_MS);
}

async function maybeTapPeople(serial, opts = {}) {
  const attempts = opts.attempts ?? 4;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const hit = await findFirstByText(serial, PEOPLE_QUERIES, {
      minScore: 0.7,
    });
    if (hit && hit.hit.y <= 220) {
      console.log(
        `   → People "${hit.hit.text}" x=${hit.hit.x} y=${hit.hit.y}`,
      );
      tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
      await sleep(1_800);
      return true;
    }
    console.log(`   People chip não visto (${attempt}/${attempts})`);
    await sleep(800);
  }
  return false;
}

/** Mobile LinkedIn: aspas da booleana viram lixo (%22) no campo — tipar sem aspas. */
function typeQueryFromProfile(profile) {
  return booleanQueryForProfile(profile).replace(/"/g, "");
}

function nameMatchScore(candidate, target) {
  const a = String(candidate || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const b = String(target || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const ap = a.split(/\s+/);
  const bp = b.split(/\s+/);
  const overlap = ap.filter((p) => bp.includes(p)).length;
  return overlap / Math.max(ap.length, bp.length);
}

async function openProfileByName(serial, name, opts = {}) {
  const attempts = opts.attempts ?? 5;
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const queries = [name];
  if (parts.length >= 2) {
    queries.push(`${parts[0]} ${parts[parts.length - 1]}`);
  }
  if (parts[0]) queries.push(parts[0]);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    for (const q of queries) {
      const hit = await findByText(serial, q, {
        minScore: 0.65,
        engine: OCR_ENGINE,
      });
      if (hit?.x == null || hit?.y == null) continue;
      if (hit.y < 160) continue;
      console.log(
        `   → abrir perfil "${hit.text}" x=${hit.x} y=${hit.y} (q="${q}" score=${hit.score?.toFixed?.(2) ?? hit.score})`,
      );
      tapElement({ serial, x: hit.x, y: hit.y });
      return hit;
    }

    // Fallback: extract da lista → tap no card com melhor match de nome
    console.log(`   fallback extract lista (${attempt}/${attempts})…`);
    try {
      const listPng = join(
        opts.outDir || ROOT,
        `list-fallback-${String(attempt).padStart(2, "0")}.png`,
      );
      const els = await extract(
        { serial, engine: OCR_ENGINE },
        opts.outDir ? { outPath: listPng } : {},
      );
      if (opts.outDir) {
        writeFileSync(
          join(opts.outDir, `list-fallback-${String(attempt).padStart(2, "0")}.json`),
          JSON.stringify(els, null, 2),
          "utf8",
        );
        console.log(`   → ${listPng}`);
      }
      const peopleEl = els.find(
        (e) =>
          /^people$/i.test(String(e?.text || "").trim()) &&
          Number(e.y) <= 220,
      );
      if (peopleEl?.x != null) {
        console.log(
          `   → People (fallback OCR) x=${peopleEl.x} y=${peopleEl.y}`,
        );
        tapElement({ serial, x: peopleEl.x, y: peopleEl.y });
        await sleep(1_800);
        continue;
      }
      const cards = profilesFromExtract(els, { engine: OCR_ENGINE });
      let best = null;
      for (const c of cards) {
        const score = nameMatchScore(c.name, name);
        if (score < 0.45) continue;
        if (!best || score > best.score) best = { card: c, score };
      }
      // Sem match forte: 1º card da lista (1º caso — destravar fluxo)
      if (!best && cards.length && cards[0].x != null && cards[0].y >= 160) {
        best = { card: cards[0], score: 0 };
        console.log(`   sem match de nome — abrindo 1º card "${cards[0].name}"`);
      }
      if (best?.card?.x != null && best.card.y != null && best.card.y >= 160) {
        console.log(
          `   → abrir perfil (lista) "${best.card.name}" x=${best.card.x} y=${best.card.y} score=${best.score.toFixed(2)}`,
        );
        tapElement({ serial, x: best.card.x, y: best.card.y });
        return best.card;
      }
      console.log(
        `   cards na lista: ${cards.map((c) => c.name).join(" | ") || "(nenhum)"}`,
      );
      const sample = els
        .slice(0, 12)
        .map((e) => e.text)
        .filter(Boolean)
        .join(" | ");
      if (sample) console.log(`   ocr sample: ${sample}`);
    } catch (e) {
      console.log(`   fallback extract: ${e.message || e}`);
    }

    console.log(`   nome na lista não achado (${attempt}/${attempts}): ${name}`);
    await sleep(1_200);
  }
  throw new Error(`perfil na lista não encontrado: ${name}`);
}

async function leaveProfile(serial) {
  for (let i = 0; i < 3; i++) {
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(700);
    const search = await findFirstByText(
      serial,
      ["Search", "See all results", "Show all results"],
      { minScore: 0.7 },
    );
    if (search) return;
  }
}

async function fetchProfileById(profileId) {
  if (!PROFILES_API_URL) {
    throw new Error("PROFILES_API_URL obrigatória (ex. http://localhost:3000)");
  }
  const url = `${PROFILES_API_URL}/profiles`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const row = list.find((p) => p?.id === profileId);
  if (!row) throw new Error(`perfil id=${profileId} não encontrado em GET /profiles`);
  return row;
}

async function postProfileDetail(payload) {
  const url = `${PROFILES_API_URL}/profile-details`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 240)}` : ""}`,
    );
  }
  return res.json();
}

async function extractWithPng(serial, outPath) {
  let els = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      els = await extract(
        { serial, engine: OCR_ENGINE },
        { outPath },
      );
      break;
    } catch (e) {
      console.log(`   extract falhou (${attempt}/3): ${e.message || e}`);
      if (attempt === 3) throw e;
      await sleep(1_500);
    }
  }
  return els;
}

function parseArgs(argv) {
  let configPath = resolve(ROOT, "device.config.json");
  let profileId = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
    else if (argv[i] === "--id") profileId = String(argv[++i] || "").trim();
  }
  return { configPath, profileId };
}

async function main() {
  const { configPath, profileId } = parseArgs(process.argv.slice(2));
  if (!profileId) {
    throw new Error("passe --id <uuid> (id em linkedin_profiles / GET /profiles)");
  }

  const cfg = loadConfig(configPath);
  const linkedinPkg = cfg.apps?.linkedin?.package;
  if (!linkedinPkg) throw new Error('App "linkedin" ausente em device.config.json');

  console.log(`1) Buscar perfil ${profileId} na API…`);
  const profile = await fetchProfileById(profileId);
  const name = String(profile.name || "").trim();
  if (!name) throw new Error("perfil sem name");
  const query = typeQueryFromProfile(profile);
  console.log(`   name=${name}`);
  console.log(`   query (sem aspas): ${query}`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(ROOT, "screenshots", "login-extract-profile-detail", stamp);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "source-profile.json"),
    JSON.stringify(profile, null, 2),
    "utf8",
  );
  console.log(`saida: ${outDir}`);

  console.log("2) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  console.log("3) Remover apps em execução…");
  stopAllApps(serial, cfg.apps);
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(500);

  console.log("4) Iniciar LinkedIn…");
  await launch({ serial, package: linkedinPkg });
  await sleep(WAIT_AFTER_LINKEDIN_MS);

  console.log("5) Search + abrir perfil…");
  await ensureSearchFocused(serial);
  await clearSearchField(serial);
  await type({ serial, text: query });
  await sleep(1_000);
  await submitSeeAll(serial);
  await sleep(1_500);
  const people = await maybeTapPeople(serial, { attempts: 5 });
  if (!people) {
    console.log("   People chip não visto — seguindo na lista atual");
  }
  await sleep(1_200);
  await openProfileByName(serial, name, { outDir });
  await sleep(WAIT_AFTER_PROFILE_MS);

  console.log("6) Extract + scroll na página…");
  /** @type {object[]} */
  const allEls = [];
  for (let i = 0; i <= PROFILE_SCROLLS; i++) {
    const pad = String(i).padStart(2, "0");
    const png = join(outDir, `page-${pad}.png`);
    const els = await extractWithPng(serial, png);
    console.log(`   page-${pad}: ${els.length} els → ${png}`);
    allEls.push(...els);
    writeFileSync(
      join(outDir, `page-${pad}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );
    if (i < PROFILE_SCROLLS) {
      try {
        scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
      } catch (e) {
        console.log(`   scroll: ${e.message || e}`);
      }
      await sleep(SCROLL_DELAY_MS);
    }
  }

  const parsed = parseProfilePageOcr(allEls, { nameHint: name });
  const payload = {
    profileId,
    name,
    headline: parsed.headline || profile.title || null,
    location: parsed.location || profile.city || null,
    about: parsed.about,
    experience: parsed.experience,
    education: parsed.education,
    rawOcr: { elements: allEls },
    extractedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(outDir, "detail.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log(`   → ${join(outDir, "detail.json")}`);

  console.log("7) POST /profile-details…");
  const saved = await postProfileDetail(payload);
  console.log(`   OK id=${saved.id} profileId=${saved.profileId}`);

  await leaveProfile(serial);
  console.log("OK — detalhe persistido");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
