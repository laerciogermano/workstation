#!/usr/bin/env node
/**
 * 1 perfil da API → Search booleana → abre perfil → scroll + extract → POST /profile-details.
 *
 * Uso (cwd: screen-robot/src):
 *   PROFILES_API_URL=http://localhost:3000 npm run login-extract-profile-detail -- --id <uuid>
 *   # abre o perfil direto pelo link (pula busca):
 *   … -- --id <uuid> --from-profile --url https://www.linkedin.com/in/…
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
const PEOPLE_QUERIES = ["People"];
const WAIT_AFTER_PEOPLE_MS = 2_000;
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
 * Chip/tab People no topo da lista (após Show all) — não "X people" no meio.
 */
async function tapPeopleChip(serial) {
  console.log("   People…");
  for (let attempt = 1; attempt <= 6; attempt++) {
    const hit = await findFirstByText(serial, PEOPLE_QUERIES, {
      minScore: 0.78,
    });
    if (hit && hit.hit.y <= 220) {
      console.log(
        `   → People "${hit.hit.text}" x=${hit.hit.x} y=${hit.hit.y}`,
      );
      tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
      await sleep(WAIT_AFTER_PEOPLE_MS);
      return;
    }
    console.log(
      `   People não no topo (${attempt}/6)${hit ? ` y=${hit.hit.y}` : ""}`,
    );
    await sleep(1_000);
  }
  throw new Error("People: chip não encontrado no topo");
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

/** Canonicaliza URL do perfil (tira utm_* / query). */
function normalizeLinkedInProfileUrl(raw) {
  const s = String(raw || "");
  const m = s.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9._%-]+)/i,
  );
  if (!m) return null;
  return `https://www.linkedin.com/in/${m[1]}`;
}

/** Lê clipboard do device (best-effort) → URL /in/… */
function readDeviceClipboard(serial) {
  try {
    const r = adb(serial, ["shell", "dumpsys", "clipboard"]);
    const out = String(r.stdout || "");
    const url = normalizeLinkedInProfileUrl(out);
    if (url) return url;
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
 * ⋯ More → "Share via" → "Copy" → clipboard → fecha modais.
 * Ex. clipboard: linkedin.com/in/…?utm_source=share_via&…
 */
async function captureProfileUrl(serial, outDir) {
  console.log("   ⋯ → Share via → Copy…");

  // 1) Três pontos (header)
  let opened = false;
  for (const q of ["More", "More options"]) {
    const hit = await findFirstByText(serial, q, { minScore: 0.72 });
    if (!hit) continue;
    const label = String(hit.hit.text || "").trim();
    if (label.length > 20 || hit.hit.y > 160) continue;
    console.log(`   → more "${label}" x=${hit.hit.x} y=${hit.hit.y}`);
    tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
    opened = true;
    await sleep(1_400);
    break;
  }
  if (!opened) {
    console.log("   fallback: tap ⋯ canto superior direito…");
    tapElement({ serial, x: 500, y: 80 });
    await sleep(1_400);
  }

  // 2) Share via (obrigatório)
  const shareVia = await findFirstByText(
    serial,
    ["Share via", "Share Via", "Share profile via"],
    { minScore: 0.68 },
  );
  if (!shareVia) {
    console.log("   Share via não encontrado — fecha e segue");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(500);
    return null;
  }
  console.log(
    `   → Share via "${shareVia.hit.text}" x=${shareVia.hit.x} y=${shareVia.hit.y}`,
  );
  tapElement({ serial, x: shareVia.hit.x, y: shareVia.hit.y });
  await sleep(1_800);

  const sheetPng = join(outDir, "share-via-sheet.png");
  try {
    const els = await extract(
      { serial, engine: OCR_ENGINE },
      { outPath: sheetPng },
    );
    writeFileSync(
      join(outDir, "share-via-sheet.json"),
      JSON.stringify(els, null, 2),
      "utf8",
    );
  } catch (e) {
    console.log(`   share-via extract: ${e.message || e}`);
  }

  // 3) Copy no share sheet do Android
  const copyHit = await findFirstByText(
    serial,
    ["Copy", "Copy link", "Copy to clipboard", "Copy Link"],
    { minScore: 0.65 },
  );
  if (!copyHit) {
    console.log("   Copy não encontrado no share sheet");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(500);
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(500);
    return null;
  }
  console.log(
    `   → Copy "${copyHit.hit.text}" x=${copyHit.hit.x} y=${copyHit.hit.y}`,
  );
  tapElement({ serial, x: copyHit.hit.x, y: copyHit.hit.y });
  await sleep(1_000);

  let url = readDeviceClipboard(serial);
  if (!url) {
    // retry clipboard
    await sleep(800);
    url = readDeviceClipboard(serial);
  }
  if (url) console.log(`   URL (clipboard): ${url}`);
  else console.log("   clipboard sem linkedin.com/in/…");

  // Fecha residual (share / more)
  key({ serial, code: "KEYCODE_BACK" });
  await sleep(400);
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
  let fromProfile = false;
  let profileUrlArg = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
    else if (argv[i] === "--id") profileId = String(argv[++i] || "").trim();
    else if (argv[i] === "--from-profile") fromProfile = true;
    else if (argv[i] === "--url") profileUrlArg = String(argv[++i] || "").trim();
  }
  return { configPath, profileId, fromProfile, profileUrlArg };
}

/** Abre perfil LinkedIn via deep link (pula Search). */
function openProfileByUrl(serial, linkedinPkg, rawUrl) {
  const url =
    normalizeLinkedInProfileUrl(rawUrl) ||
    String(rawUrl || "").trim().replace(/\/$/, "");
  if (!/linkedin\.com\/in\//i.test(url)) {
    throw new Error(`--url inválida (precisa linkedin.com/in/…): ${rawUrl}`);
  }
  console.log(`   am start VIEW ${url}`);
  adb(serial, [
    "shell",
    "am",
    "start",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    url,
    "-p",
    linkedinPkg,
  ]);
}

async function fetchStoredProfileUrl(profileId) {
  try {
    const res = await fetch(`${PROFILES_API_URL}/profile-details/${profileId}`);
    if (!res.ok) return null;
    const row = await res.json();
    return normalizeLinkedInProfileUrl(row?.profileUrl) || null;
  } catch {
    return null;
  }
}

async function main() {
  const { configPath, profileId, fromProfile, profileUrlArg } = parseArgs(
    process.argv.slice(2),
  );
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
  console.log(`   name=${name}`);
  if (!fromProfile) {
    console.log(`   query: ${typeQueryFromProfile(profile)}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(ROOT, "screenshots", "login-extract-profile-detail", stamp);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "source-profile.json"),
    JSON.stringify({ ...profile, fromProfile, profileUrlArg }, null, 2),
    "utf8",
  );
  console.log(`saida: ${outDir}`);

  console.log("2) Provisionar…");
  const { serial } = await provisionEmulator(cfg);
  console.log(`   OK ${serial}`);

  let openedName = name;
  if (!fromProfile) {
    console.log("3) Remover apps em execução…");
    stopAllApps(serial, cfg.apps);
    key({ serial, code: "KEYCODE_HOME" });
    await sleep(500);

    console.log("4) Iniciar LinkedIn…");
    await launch({ serial, package: linkedinPkg });
    await sleep(WAIT_AFTER_LINKEDIN_MS);

    console.log("5) Digitar → Show all → People → 1ª pessoa…");
    await ensureSearchFocused(serial);
    await clearSearchField(serial);
    await typeSearchQuery(serial, typeQueryFromProfile(profile));
    await submitShowAllResults(serial);
    await tapPeopleChip(serial);
    const opened = await openFirstPerson(serial, { outDir });
    openedName = String(opened?.name || name).trim();
    await sleep(WAIT_AFTER_PROFILE_MS);
  /** URL conhecida (deep link) — fallback se Share via/clipboard falhar. */
  let knownProfileUrl = null;
  if (fromProfile) {
    console.log("3) Abrir perfil direto (deep link)…");
    knownProfileUrl =
      normalizeLinkedInProfileUrl(profileUrlArg) ||
      (await fetchStoredProfileUrl(profileId));
    if (!knownProfileUrl) {
      throw new Error(
        "--from-profile exige --url https://www.linkedin.com/in/… (ou profileUrl já salvo na API)",
      );
    }
    openProfileByUrl(serial, linkedinPkg, knownProfileUrl);
    await sleep(WAIT_AFTER_PROFILE_MS);
    console.log("4–5) skip busca (perfil aberto via URL)");
  }

  console.log("6) ⋯ → Share via → Copy → POST URL…");
  let profileUrl = null;
  try {
    profileUrl = await captureProfileUrl(serial, outDir);
  } catch (e) {
    console.log(`   URL: ${e.message || e}`);
  }
  if (!profileUrl && knownProfileUrl) {
    profileUrl = knownProfileUrl;
    console.log(`   URL (do --url / deep link): ${profileUrl}`);
  }
  if (profileUrl) {
    console.log(`   URL: ${profileUrl}`);
    try {
      const early = await postProfileDetail({
        profileId,
        name: openedName,
        profileUrl,
        connectionDegree: profile.level || null,
        location: profile.city || null,
        extractedAt: new Date().toISOString(),
      });
      console.log(
        `   POST URL ok id=${early.id} url=${early.profileUrl || "-"}`,
      );
    } catch (e) {
      console.log(`   POST URL falhou: ${e.message || e}`);
    }
  } else {
    console.log("   URL: (não obtida) — segue sem POST antecipado");
  }

  console.log("7) Extract + scroll down até o fim…");
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
