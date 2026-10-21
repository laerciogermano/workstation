#!/usr/bin/env node
/**
 * 1 perfil da API → Search booleana → abre perfil → scroll + extract → POST /profile-details.
 *
 * Uso (cwd: screen-robot/src):
 *   PROFILES_API_URL=http://localhost:3000 npm run login-extract-profile-detail -- --id <uuid>
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

import { adb, sleep } from "../lib/adb.js";
import { extract, findByText, waitForText } from "../lib/extract.js";
import { captureFrame } from "../lib/frame.js";
import { booleanQueryForProfile } from "../lib/linkedin-boolean-query.js";
import { profilesFromExtract } from "../lib/linkedin-list-profiles.js";
import {
  findLinkedInProfileUrl,
  parseProfilePageOcr,
} from "../lib/linkedin-profile-page.js";
import { key, launch, scroll, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
if (!process.env.OCR_MERGE_TIMEOUT_MS) {
  process.env.OCR_MERGE_TIMEOUT_MS = "20000";
}

const WAIT_AFTER_LINKEDIN_MS = 5_000;
const WAIT_AFTER_PROFILE_MS = 2_500;
const WAIT_AFTER_TYPE_MS = 1_200;
const WAIT_AFTER_SHOW_ALL_MS = 2_500;
const CLEAR_DEL_COUNT = 40;
const SHOW_ALL_QUERIES = [
  "Show all results",
  "See all results",
  "Show all",
  "See all",
];
/** Máximo de páginas OCR no perfil (safety). Fim real = conteúdo/frame estável. */
const MAX_PROFILE_PAGES = 40;
const SCROLL_END_STABLE_NEEDED = 2;
const SCROLL_DISTANCE = 320;
const SCROLL_DELAY_MS = 900;
/** Resultados do dropdown de busca começam abaixo da barra. */
const LIST_MIN_Y = 130;
const OCR_ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";
const PROFILES_API_URL = (process.env.PROFILES_API_URL || "").replace(/\/$/, "");
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
    ["Clear text", "Clear"],
    { minScore: 0.7 },
  );
  if (clearHit && clearHit.hit.y < 160) {
    const { hit } = clearHit;
    console.log(`   → clear "${hit.text}" x=${hit.x} y=${hit.y}`);
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(400);
    return;
  }
  // Só DEL se o campo já parece ter texto (evita 40 DEL com foco perdido).
  const bar = await findFirstByText(
    serial,
    ["Search", "Search people", "AND"],
    { minScore: 0.55 },
  );
  const looksEmpty =
    bar &&
    /^(search|search people)$/i.test(String(bar.hit.text || "").trim());
  if (looksEmpty) {
    console.log("   campo parece vazio — skip clear");
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
  // Preferir "Search people" (vai direto a pessoas, sem chip People).
  const peopleSearch = await findFirstByText(serial, ["Search people"], {
    minScore: 0.7,
  });
  if (peopleSearch) {
    console.log(
      `   → search people "${peopleSearch.hit.text}" x=${peopleSearch.hit.x} y=${peopleSearch.hit.y}`,
    );
    tapElement({ serial, x: peopleSearch.hit.x, y: peopleSearch.hit.y });
    await sleep(1_200);
    return;
  }
  const bar = await findFirstByText(serial, ["Search"], { minScore: 0.7 });
  if (bar) {
    console.log(
      `   → search "${bar.hit.text}" x=${bar.hit.x} y=${bar.hit.y}`,
    );
    tapElement({ serial, x: bar.hit.x, y: bar.hit.y });
    await sleep(1_200);
    // 2º tap no campo (às vezes o 1º só abre a tela de busca)
    const again = await findFirstByText(serial, ["Search", "Search people"], {
      minScore: 0.65,
    });
    if (again && again.hit.y < 160) {
      tapElement({ serial, x: again.hit.x, y: again.hit.y });
      await sleep(600);
    }
    return;
  }
  await tapByText(serial, "Search", "search");
  await sleep(1_200);
}

/** Digita a query e segue — sem revalidar OCR / sem procurar Search de novo. */
async function typeSearchQuery(serial, query) {
  const q = String(query || "").trim();
  if (!q) throw new Error("query vazia");
  console.log(`   digitar: ${q}`);
  await type({ serial, text: q });
  await sleep(WAIT_AFTER_TYPE_MS);
}

/**
 * Texto de campo p/ busca: ASCII letras/números/espaço.
 * Sem acentos (adb `input text` vira %XX e o LinkedIn mostra `sa%fade`).
 * Sem %, aspas e pontuação — o AND fica só entre campos.
 */
function sanitizeSearchText(raw) {
  return String(raw || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/%[0-9A-Fa-f]{2}/g, " ")
    .replace(/%/g, " ")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Campos do perfil úteis na busca (definidos + pesquisáveis). */
const SEARCH_PROFILE_FIELDS = ["title", "current", "past", "city"];

/**
 * Query: `Nome AND titulo AND current AND past AND cidade`
 * (só partes definidas; sem level/connection/mutual).
 */
function typeQueryFromProfile(profile) {
  const name = sanitizeSearchText(profile?.name);
  if (!name) throw new Error("perfil sem name");

  const seen = new Set([name.toLowerCase()]);
  const parts = [name];
  for (const key of SEARCH_PROFILE_FIELDS) {
    const v = sanitizeSearchText(profile?.[key]);
    if (!v) continue;
    const low = v.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    parts.push(v);
  }

  const q = parts.join(" AND ");
  try {
    console.log(`   boolean ref: ${booleanQueryForProfile(profile)}`);
  } catch {
    /* ignore */
  }
  console.log(`   query: ${q}`);
  return q;
}

/**
 * Sugestões do dropdown de busca LinkedIn: "Nome • 2nd • Empresa…"
 * (não têm Connect — profilesFromExtract não serve aqui).
 * Ordenadas por y crescente — [0] = primeira opção visível.
 */
function searchSuggestionsFromExtract(els) {
  /** @type {{ name: string, x: number, y: number, text: string }[]} */
  const out = [];
  for (const e of els || []) {
    const text = String(e?.text || "").trim();
    const y = Number(e?.y);
    const x = Number(e?.x);
    if (!text || x == null || Number.isNaN(y)) continue;
    if (y < LIST_MIN_Y || y > 820) continue; // barra / teclado residual
    if (/^show all/i.test(text)) continue;
    if (!/•/.test(text) && !/\b(1st|2nd|3rd\+?)\b/i.test(text)) continue;
    const namePart = text.split(/•/)[0].replace(/\s+/g, " ").trim();
    if (namePart.length < 5) continue;
    out.push({ name: namePart, x, y, text });
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

/**
 * Clica Show/See all results logo após digitar (sem voltar a procurar Search).
 * Com teclado → OCR; se falhar, BACK e tenta de novo; senão tap na faixa inferior.
 */
async function submitShowAllResults(serial) {
  console.log("   Show all results…");
  try {
    const hit = await waitForText(serial, SHOW_ALL_QUERIES, {
      timeoutMs: 8_000,
      intervalMs: 1_000,
      engine: OCR_ENGINE,
      minScore: 0.68,
    });
    console.log(
      `   → showAll "${hit.text}" x=${hit.x} y=${hit.y} (query="${hit.query}")`,
    );
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(WAIT_AFTER_SHOW_ALL_MS);
    return;
  } catch {
    console.log("   não achou com teclado — KEYCODE_BACK…");
  }
  key({ serial, code: "KEYCODE_BACK" });
  await sleep(900);
  try {
    const hit = await waitForText(serial, SHOW_ALL_QUERIES, {
      timeoutMs: 12_000,
      intervalMs: 1_000,
      engine: OCR_ENGINE,
      minScore: 0.68,
    });
    console.log(
      `   → showAll "${hit.text}" x=${hit.x} y=${hit.y} (query="${hit.query}")`,
    );
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(WAIT_AFTER_SHOW_ALL_MS);
    return;
  } catch {
    /* fallback geometria */
  }
  // Faixa inferior onde o botão costuma ficar (ex. y≈836 em 888).
  console.log("   fallback: tap faixa inferior (Show all)…");
  tapElement({ serial, x: 270, y: 850 });
  await sleep(WAIT_AFTER_SHOW_ALL_MS);
}

/**
 * Abre a 1ª pessoa na lista pós-submit — sempre menor y.
 */
async function openFirstPerson(serial, opts = {}) {
  const attempts = opts.attempts ?? 8;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`   sugestões pesquisa (${attempt}/${attempts})…`);
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
          join(
            opts.outDir,
            `list-fallback-${String(attempt).padStart(2, "0")}.json`,
          ),
          JSON.stringify(els, null, 2),
          "utf8",
        );
        console.log(`   → ${listPng}`);
      }

      // Após Show all: cards da lista; senão sugestões do dropdown.
      const cards = profilesFromExtract(els, { engine: OCR_ENGINE })
        .filter((c) => c?.x != null && Number(c.y) >= LIST_MIN_Y)
        .sort((a, b) => Number(a.y) - Number(b.y));
      const suggestions = searchSuggestionsFromExtract(els);
      console.log(
        `   cards: ${cards.map((c) => `${c.name}@y${c.y}`).join(" | ") || "(nenhum)"}`,
      );
      console.log(
        `   sugestões: ${suggestions.map((s) => `${s.name}@y${s.y}`).join(" | ") || "(nenhuma)"}`,
      );
      let pick = cards[0] || suggestions[0] || null;

      if (pick) {
        console.log(
          `   → abrir 1ª pessoa "${pick.name}" x=${pick.x} y=${pick.y}`,
        );
        tapElement({ serial, x: pick.x, y: pick.y });
        await sleep(800);
        return pick;
      }

      const sample = els
        .filter((e) => Number(e.y) >= LIST_MIN_Y && Number(e.y) < 820)
        .slice(0, 8)
        .map((e) => e.text)
        .join(" | ");
      if (sample) console.log(`   ocr sample: ${sample}`);
    } catch (e) {
      console.log(`   lista: ${e.message || e}`);
    }
    await sleep(1_500);
  }
  throw new Error("nenhuma pessoa na lista de resultados");
}

/** Lê clipboard do device (best-effort). */
function readDeviceClipboard(serial) {
  try {
    const r = adb(serial, ["shell", "dumpsys", "clipboard"]);
    const out = String(r.stdout || "");
    const m = out.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._%-]+/i);
    if (m) {
      let url = m[0];
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      return url.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function frameHash(serial, outPath) {
  const path = await captureFrame(serial, outPath ? { outPath } : {});
  return createHash("sha1").update(readFileSync(path)).digest("hex");
}

/** Fingerprint do OCR visível (textos) — detecta fim do scroll no perfil. */
function pageContentFingerprint(els) {
  const texts = (els || [])
    .map((e) => String(e?.text || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("\n");
  return createHash("sha1").update(texts).digest("hex");
}

/**
 * Abre menu ⋯ (More) no topo → Share / Copy link → URL → fecha modal.
 * Rodar no topo do perfil, antes do scroll de extract.
 */
async function captureProfileUrl(serial, outDir) {
  console.log("   URL via ⋯ / More…");

  // 1) Abrir overflow (3 pontos) — OCR "More" ou tap canto superior direito.
  let opened = false;
  for (const q of ["More", "More options", "Overflow"]) {
    const hit = await findFirstByText(serial, q, { minScore: 0.72 });
    if (!hit) continue;
    const label = String(hit.hit.text || "").trim();
    if (label.length > 20) continue;
    if (hit.hit.y > 160) continue; // só header
    console.log(`   → more "${label}" x=${hit.hit.x} y=${hit.hit.y}`);
    tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
    opened = true;
    await sleep(1_200);
    break;
  }
  if (!opened) {
    console.log("   fallback: tap ⋯ canto superior direito…");
    tapElement({ serial, x: 500, y: 80 });
    await sleep(1_200);
  }

  // 2) Opção Share / Copy no sheet
  const menuQueries = [
    "Share via",
    "Share profile",
    "Send profile in a message",
    "Copy link to profile",
    "Copy link",
    "Share",
  ];
  let tappedShare = false;
  for (const q of menuQueries) {
    const hit = await findFirstByText(serial, q, { minScore: 0.7 });
    if (!hit) continue;
    const label = String(hit.hit.text || "").trim();
    if (label.length > 40) continue;
    console.log(`   → menu "${label}" x=${hit.hit.x} y=${hit.hit.y}`);
    tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
    tappedShare = true;
    await sleep(1_500);
    break;
  }
  if (!tappedShare) {
    console.log("   menu Share/Copy não visível — fecha e segue");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(600);
    return null;
  }

  const sheetPng = join(outDir, "share-sheet.png");
  let els = [];
  try {
    els = await extract(
      { serial, engine: OCR_ENGINE },
      { outPath: sheetPng },
    );
    writeFileSync(
      join(outDir, "share-sheet.json"),
      JSON.stringify(els, null, 2),
      "utf8",
    );
  } catch (e) {
    console.log(`   share extract: ${e.message || e}`);
  }

  let url = findLinkedInProfileUrl(els.map((e) => e.text));
  if (url) {
    console.log(`   URL (OCR sheet): ${url}`);
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(600);
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(500);
    return url;
  }

  const copyHit = await findFirstByText(
    serial,
    ["Copy link", "Copy to clipboard", "Copy Link", "Copy link to profile", "Copy"],
    { minScore: 0.65 },
  );
  if (copyHit) {
    console.log(
      `   → copy "${copyHit.hit.text}" x=${copyHit.hit.x} y=${copyHit.hit.y}`,
    );
    tapElement({ serial, x: copyHit.hit.x, y: copyHit.hit.y });
    await sleep(800);
    url = readDeviceClipboard(serial);
    if (url) console.log(`   URL (clipboard): ${url}`);
  }

  // Fecha modal(s)
  key({ serial, code: "KEYCODE_BACK" });
  await sleep(500);
  key({ serial, code: "KEYCODE_BACK" });
  await sleep(600);
  return url;
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

  console.log("5) Digitar → Show all → 1ª pessoa…");
  await ensureSearchFocused(serial);
  await clearSearchField(serial);
  await typeSearchQuery(serial, query);
  await submitShowAllResults(serial);
  const opened = await openFirstPerson(serial, { outDir });
  const openedName = String(opened?.name || name).trim();
  await sleep(WAIT_AFTER_PROFILE_MS);

  console.log("6) ⋯ More → URL do perfil (antes do scroll)…");
  let profileUrl = null;
  try {
    profileUrl = await captureProfileUrl(serial, outDir);
  } catch (e) {
    console.log(`   URL: ${e.message || e}`);
  }
  if (profileUrl) console.log(`   URL: ${profileUrl}`);
  else console.log("   URL: (não obtida)");

  console.log("7) Extract + scroll down até o fim (só então finaliza)…");
  /** @type {object[]} */
  const allEls = [];
  let contentStable = 0;
  let frameStable = 0;
  let prevContentFp = null;
  let prevHash = await frameHash(serial, join(outDir, "frame-000.png"));

  for (let i = 0; i < MAX_PROFILE_PAGES; i++) {
    const pad = String(i).padStart(2, "0");
    const png = join(outDir, `page-${pad}.png`);
    const els = await extractWithPng(serial, png);
    const contentFp = pageContentFingerprint(els);
    console.log(`   page-${pad}: ${els.length} els → ${png}`);
    allEls.push(...els);
    writeFileSync(
      join(outDir, `page-${pad}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );

    if (prevContentFp != null && contentFp === prevContentFp) {
      contentStable += 1;
      console.log(
        `   fim do scroll? conteúdo igual (${contentStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
      if (contentStable >= SCROLL_END_STABLE_NEEDED) {
        console.log("   fim: scroll não avança mais (conteúdo)");
        break;
      }
    } else {
      contentStable = 0;
      prevContentFp = contentFp;
    }

    try {
      scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
    } catch (e) {
      console.log(`   scroll: ${e.message || e}`);
      break;
    }
    await sleep(SCROLL_DELAY_MS);

    const nextHash = await frameHash(
      serial,
      join(outDir, `frame-after-${pad}.png`),
    );
    if (nextHash === prevHash) {
      frameStable += 1;
      console.log(
        `   fim do scroll? frame igual (${frameStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
      if (frameStable >= SCROLL_END_STABLE_NEEDED) {
        console.log("   fim: scroll não avança mais (frame)");
        break;
      }
    } else {
      frameStable = 0;
      prevHash = nextHash;
    }
  }

  console.log("   fim do scroll — montando payload");
  const parsed = parseProfilePageOcr(allEls, { nameHint: openedName });
  if (!profileUrl && parsed.profileUrl) profileUrl = parsed.profileUrl;

  const payload = {
    profileId,
    name: openedName,
    headline: parsed.headline || profile.title || null,
    location: parsed.location || profile.city || null,
    profileUrl: profileUrl || null,
    connectionDegree: parsed.connectionDegree || profile.level || null,
    about: parsed.about,
    experience: parsed.experience,
    education: parsed.education,
    skills: parsed.skills,
    rawOcr: { elements: allEls },
    extractedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(outDir, "detail.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log(`   → ${join(outDir, "detail.json")}`);
  console.log(
    `   campos: headline=${!!payload.headline} about=${!!payload.about} exp=${!!payload.experience} edu=${!!payload.education} skills=${!!payload.skills} url=${payload.profileUrl || "-"}`,
  );

  console.log("8) POST /profile-details e encerrar…");
  const saved = await postProfileDetail(payload);
  console.log(
    `   OK id=${saved.id} profileId=${saved.profileId} url=${saved.profileUrl || "-"}`,
  );

  console.log("OK — detalhe persistido — encerrando processo");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
