#!/usr/bin/env node
/**
 * LinkedIn: lê profiles.json (saída de login-extract-profiles) e, para cada
 * perfil, faz pesquisa booleana → See all → abre o perfil → extract → BACK.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-visit-profiles -- --profiles screenshots/login-extract-profiles/<stamp>/profiles.json
 *   npm run login-visit-profiles   # usa o profiles.json mais recente
 */
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sleep } from "../lib/adb.js";
import { extractBySense, findByText } from "../lib/extract.js";
import { booleanQueryForProfile } from "../lib/linkedin-boolean-query.js";
import { key, launch, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
if (!process.env.OCR_MERGE_TIMEOUT_MS) {
  process.env.OCR_MERGE_TIMEOUT_MS = "20000";
}
const WAIT_AFTER_LINKEDIN_MS = 5_000;
const WAIT_AFTER_SEARCH_MS = 2_000;
const WAIT_AFTER_PROFILE_MS = 2_500;
const CLEAR_DEL_COUNT = 80;
const OCR_ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";
const SEE_ALL_QUERIES = [
  "See all results",
  "Show all results",
  "See all",
  "Show all",
];
const PEOPLE_QUERIES = [
  "Filter by People",
  "People",
  "Filter by Pessoas",
  "Pessoas",
];

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function loadProfiles(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`profiles.json não encontrado: ${abs}`);
  const data = JSON.parse(readFileSync(abs, "utf8"));
  if (!Array.isArray(data) || !data.length) {
    throw new Error(`profiles.json vazio ou inválido: ${abs}`);
  }
  return { path: abs, profiles: data };
}

/** Último `screenshots/login-extract-profiles/<stamp>/profiles.json` por mtime. */
function findLatestProfilesJson() {
  const base = resolve(ROOT, "screenshots", "login-extract-profiles");
  if (!existsSync(base)) return null;
  /** @type {{ path: string, mtime: number }[]} */
  const hits = [];
  for (const name of readdirSync(base)) {
    const p = join(base, name, "profiles.json");
    if (!existsSync(p)) continue;
    hits.push({ path: p, mtime: statSync(p).mtimeMs });
  }
  hits.sort((a, b) => b.mtime - a.mtime);
  return hits[0]?.path ?? null;
}

/** Uma passada de findByText nas queries; null se nenhuma bater. */
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

/** Busca texto via OCR e clica no x,y do hit. */
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
    console.log(`   ${label}: texto não encontrado (${attempt}/${attempts}) — ${list.join(" | ")}`);
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

/** Limpa o campo Search focado (Clear OCR ou DEL em massa). */
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
  // Campo já com query anterior (y baixo) — tenta tap na faixa do Search
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
  const early = await findFirstByText(serial, SEE_ALL_QUERIES);
  if (early) {
    const { hit, query } = early;
    console.log(
      `   → seeAll (teclado aberto) "${hit.text}" x=${hit.x} y=${hit.y} (query="${query}")`,
    );
    tapElement({ serial, x: hit.x, y: hit.y });
  } else {
    console.log("   baixar teclado…");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(800);
    await tapByText(serial, SEE_ALL_QUERIES, "seeAll");
  }
  await sleep(WAIT_AFTER_SEARCH_MS);
}

async function maybeTapPeople(serial) {
  const hit = await findFirstByText(serial, PEOPLE_QUERIES, { minScore: 0.8 });
  if (!hit) return false;
  // Só chip/tab People no topo (não "X people" no meio da lista)
  if (hit.hit.y > 200) return false;
  console.log(
    `   → People "${hit.hit.text}" x=${hit.hit.x} y=${hit.hit.y}`,
  );
  tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
  await sleep(1_500);
  return true;
}

/**
 * Localiza o nome na lista e abre o perfil (y>160 para evitar barra Search).
 */
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
        minScore: 0.72,
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
    console.log(`   nome na lista não achado (${attempt}/${attempts}): ${name}`);
    await sleep(1_000);
  }
  throw new Error(`perfil na lista não encontrado: ${name}`);
}

async function leaveProfile(serial) {
  for (let i = 0; i < 3; i++) {
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(700);
    const search = await findFirstByText(serial, ["Search", "See all results", "Show all results"], {
      minScore: 0.7,
    });
    if (search) return;
  }
}

/**
 * Um ciclo: Search → clear → type booleana → See all → People? → tap nome → extract.
 */
async function visitOneProfile(serial, profile, ctx) {
  const { outDir, index, total } = ctx;
  const name = String(profile.name || "").trim();
  const query = booleanQueryForProfile(profile);
  const slug = String(index).padStart(3, "0");
  console.log(`\n========== ${index}/${total} ${name} ==========`);
  console.log(`   boolean: ${query}`);

  await ensureSearchFocused(serial);
  await clearSearchField(serial);
  console.log(`   digitar query…`);
  await type({ serial, text: query });
  await sleep(1_000);

  await submitSeeAll(serial);
  await maybeTapPeople(serial);

  await openProfileByName(serial, name);
  await sleep(WAIT_AFTER_PROFILE_MS);

  let els = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      els = await extractBySense({ serial, engine: OCR_ENGINE });
      break;
    } catch (e) {
      console.log(`   extract perfil falhou (${attempt}/3): ${e.message || e}`);
      if (attempt === 3) throw e;
      await sleep(1_500);
    }
  }

  const visited = {
    index,
    name,
    booleanQuery: query,
    source: profile,
    visitedAt: new Date().toISOString(),
    elements: els,
  };
  const path = join(outDir, `visited-${slug}.json`);
  writeFileSync(path, JSON.stringify(visited, null, 2), "utf8");
  console.log(`   → ${path} (${els.length} elementos)`);

  await leaveProfile(serial);
  return visited;
}

function parseArgs(argv) {
  let configPath = resolve(ROOT, "device.config.json");
  let profilesPath = null;
  let limit = Infinity;
  let offset = 0;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
    else if (argv[i] === "--profiles") profilesPath = resolve(argv[++i]);
    else if (argv[i] === "--limit") limit = Number(argv[++i]);
    else if (argv[i] === "--offset") offset = Number(argv[++i]);
  }
  return { configPath, profilesPath, limit, offset };
}

async function main() {
  const { configPath, profilesPath, limit, offset } = parseArgs(
    process.argv.slice(2),
  );

  const cfg = loadConfig(configPath);
  const linkedinPkg = cfg.apps?.linkedin?.package;
  if (!linkedinPkg) throw new Error('App "linkedin" ausente em device.config.json');

  const resolvedProfiles =
    profilesPath || findLatestProfilesJson();
  if (!resolvedProfiles) {
    throw new Error(
      "Nenhum profiles.json — passe --profiles <path> ou rode login-extract-profiles antes",
    );
  }
  const { path: profilesFile, profiles: all } = loadProfiles(resolvedProfiles);
  const slice = all.slice(offset, offset + (Number.isFinite(limit) ? limit : all.length));
  console.log(`profiles: ${profilesFile} (${slice.length}/${all.length}; offset=${offset})`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(ROOT, "screenshots", "login-visit-profiles", stamp);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "source-profiles.json"),
    JSON.stringify({ source: profilesFile, offset, limit: slice.length, profiles: slice }, null, 2),
    "utf8",
  );
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

  /** @type {object[]} */
  const visited = [];
  /** @type {object[]} */
  const errors = [];

  for (let i = 0; i < slice.length; i++) {
    const profile = slice[i];
    const index = offset + i + 1;
    try {
      const row = await visitOneProfile(serial, profile, {
        outDir,
        index,
        total: offset + slice.length,
      });
      visited.push({
        index,
        name: row.name,
        booleanQuery: row.booleanQuery,
        file: `visited-${String(index).padStart(3, "0")}.json`,
        ok: true,
      });
    } catch (e) {
      const msg = e.message || String(e);
      console.log(`   ERRO: ${msg}`);
      errors.push({ index, name: profile.name || null, error: msg });
      visited.push({
        index,
        name: profile.name || null,
        booleanQuery: (() => {
          try {
            return booleanQueryForProfile(profile);
          } catch {
            return null;
          }
        })(),
        ok: false,
        error: msg,
      });
      try {
        await leaveProfile(serial);
      } catch {
        /* ignore */
      }
    }
    writeFileSync(
      join(outDir, "visited.json"),
      JSON.stringify({ source: profilesFile, visited, errors }, null, 2),
      "utf8",
    );
  }

  const ok = visited.filter((v) => v.ok).length;
  console.log(`\nOK — ${ok}/${slice.length} perfis visitados`);
  console.log(`visited.json: ${join(outDir, "visited.json")}`);
  if (errors.length) {
    console.log(`erros: ${errors.length}`);
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((e) => {
    console.error("Erro:", e.message || e);
    process.exit(1);
  });
}
