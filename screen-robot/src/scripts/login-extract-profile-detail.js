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
import { extract, findByText } from "../lib/extract.js";
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
const WAIT_AFTER_TYPE_MS = 1_800;
const CLEAR_DEL_COUNT = 40;
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

/** Confirma via OCR que o início do nome está no campo (y baixo). */
async function searchBarContains(serial, needle) {
  const token = String(needle || "")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
  if (!token) return false;
  try {
    const els = await extract({ serial, engine: OCR_ENGINE });
    const top = els
      .filter((e) => Number(e.y) < 140)
      .map((e) => String(e.text || "").toLowerCase())
      .join(" ");
    console.log(`   barra OCR: ${top.slice(0, 120)}`);
    return top.includes(token);
  } catch (e) {
    console.log(`   barra OCR falhou: ${e.message || e}`);
    return false;
  }
}

async function typeSearchQuery(serial, query) {
  const q = String(query || "").trim();
  if (!q) throw new Error("query vazia");
  console.log(`   digitar: ${q}`);
  await type({ serial, text: q });
  await sleep(1_200);
  if (await searchBarContains(serial, q)) return;
  console.log("   query não apareceu — refocus + digitar de novo");
  await ensureSearchFocused(serial);
  await sleep(400);
  await type({ serial, text: q });
  await sleep(1_200);
  if (!(await searchBarContains(serial, q))) {
    throw new Error(`digitação falhou — campo sem "${q.split(/\s+/)[0]}"`);
  }
}

/**
 * Texto seguro p/ busca LinkedIn mobile: só letras/números/espaço.
 * Remove %, aspas, boolean e pontuação que quebra a pesquisa.
 */
function sanitizeSearchText(raw) {
  return String(raw || "")
    .normalize("NFKC")
    .replace(/[%&|"'<>()[\]{}\\/*+=!?.;:@#^~`]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Título do cargo: `title` ou trecho antes de " at "/" @" em `current`. */
function titleForSearch(profile) {
  const direct = sanitizeSearchText(profile?.title);
  if (direct) return direct;
  const current = String(profile?.current || "").trim();
  if (!current) return "";
  const beforeAt = current.split(/\s+(?:at|@)\s+/i)[0];
  return sanitizeSearchText(beforeAt);
}

/**
 * Query: nome + título limpo + cidade (se houver). Sem % / boolean / especiais.
 */
function typeQueryFromProfile(profile) {
  const name = sanitizeSearchText(profile?.name);
  if (!name) throw new Error("perfil sem name");
  const title = titleForSearch(profile);
  const city = sanitizeSearchText(profile?.city);
  const parts = [name];
  if (title && title.toLowerCase() !== name.toLowerCase()) parts.push(title);
  if (city) parts.push(city);
  const q = parts.join(" ").replace(/\s+/g, " ").trim();
  try {
    console.log(`   boolean ref: ${booleanQueryForProfile(profile)}`);
  } catch {
    /* ignore */
  }
  console.log(`   query sanitize: ${q}`);
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
    if (y < LIST_MIN_Y || y > 520) continue; // barra / teclado
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
 * Abre a 1ª pessoa que aparecer na pesquisa (dropdown) — sempre menor y.
 */
async function openFirstPerson(serial, opts = {}) {
  const attempts = opts.attempts ?? 5;

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

      const suggestions = searchSuggestionsFromExtract(els);
      console.log(
        `   sugestões: ${suggestions.map((s) => `${s.name}@y${s.y}`).join(" | ") || "(nenhuma)"}`,
      );

      // Sempre a 1ª sugestão (menor y) — não trocar por match de nome.
      let pick = suggestions[0] || null;

      // Fallback: cards People (Connect) se já estiver em lista full
      if (!pick) {
        const cards = profilesFromExtract(els, { engine: OCR_ENGINE })
          .filter((c) => c?.x != null && Number(c.y) >= LIST_MIN_Y)
          .sort((a, b) => Number(a.y) - Number(b.y));
        console.log(
          `   cards: ${cards.map((c) => `${c.name}@y${c.y}`).join(" | ") || "(nenhum)"}`,
        );
        pick = cards[0] || null;
      }

      if (pick) {
        console.log(
          `   → abrir 1ª pessoa "${pick.name}" x=${pick.x} y=${pick.y}`,
        );
        tapElement({ serial, x: pick.x, y: pick.y });
        await sleep(800);
        return pick;
      }

      const sample = els
        .filter((e) => Number(e.y) >= LIST_MIN_Y && Number(e.y) < 520)
        .slice(0, 8)
        .map((e) => e.text)
        .join(" | ");
      if (sample) console.log(`   ocr sample: ${sample}`);
    } catch (e) {
      console.log(`   lista: ${e.message || e}`);
    }
    await sleep(1_200);
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
 * Share no perfil → Copy link / OCR da sheet com linkedin.com/in/…
 * Chamar no topo (antes do scroll down). Sem scroll up.
 */
async function captureProfileUrl(serial, outDir) {
  console.log("   capturar URL (Share)…");

  const shareQueries = [
    "Share profile",
    "Share via",
    "Send profile",
    "Share",
    "More",
  ];
  let opened = false;
  for (const q of shareQueries) {
    const hit = await findFirstByText(serial, q, { minScore: 0.78 });
    if (!hit) continue;
    const label = String(hit.hit.text || "").trim();
    // Evita post do feed ("…shares will be…"): só rótulos curtos de botão.
    if (label.length > 24) continue;
    if (!/^(share(\s+(profile|via))?|send profile|more)$/i.test(label)) continue;
    // Header / ações do perfil (não Activity/feed)
    if (hit.hit.y > 420) continue;
    console.log(`   → ${q} "${label}" x=${hit.hit.x} y=${hit.hit.y}`);
    tapElement({ serial, x: hit.hit.x, y: hit.hit.y });
    opened = true;
    await sleep(1_500);
    break;
  }
  if (!opened) {
    console.log("   Share/More (botão) não visível no OCR — URL fica null");
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
    return url;
  }

  const copyHit = await findFirstByText(
    serial,
    ["Copy link", "Copy to clipboard", "Copy Link", "Copy"],
    { minScore: 0.68 },
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

  console.log("5) Search + digitar + abrir 1ª pessoa (sem See all)…");
  await ensureSearchFocused(serial);
  await clearSearchField(serial);
  await typeSearchQuery(serial, query);
  await sleep(WAIT_AFTER_TYPE_MS);
  const opened = await openFirstPerson(serial, { outDir });
  const openedName = String(opened?.name || name).trim();
  await sleep(WAIT_AFTER_PROFILE_MS);

  // Share no topo (antes de descer) — evita scroll up depois.
  console.log("6) URL do perfil (Share no topo)…");
  let profileUrl = null;
  try {
    profileUrl = await captureProfileUrl(serial, outDir);
  } catch (e) {
    console.log(`   URL: ${e.message || e}`);
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

  const parsed = parseProfilePageOcr(allEls, { nameHint: openedName });
  if (!profileUrl && parsed.profileUrl) profileUrl = parsed.profileUrl;
  if (profileUrl) console.log(`   URL final: ${profileUrl}`);
  else console.log("   URL final: (não obtida)");

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
