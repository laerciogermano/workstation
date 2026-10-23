#!/usr/bin/env node
/**
 * 1 perfil da API → Search (ou deep link) → cartão dump|ocr (--sense)
 * → crop avatar → POST /profile-details. Com --url, não captura Share/Copy (URL já conhecida).
 *
 * Uso (cwd: screen-robot/src):
 *   PROFILES_API_URL=http://localhost:3000 npm run login-extract-profile-detail -- --id <uuid>
 *   … -- --id <uuid> --from-profile --url https://www.linkedin.com/in/…
 *   # ou API: GET /extract/by-url/start?url=…
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { adb, sleep } from "../lib/adb.js";
import {
  dumpUiXml,
  extract,
  extractBySense,
  findByText,
} from "../lib/extract.js";
import { captureFrame } from "../lib/frame.js";
import { booleanQueryForProfile } from "../lib/linkedin-boolean-query.js";
import { captureProfileUrl } from "../lib/linkedin-capture-profile-url.js";
import { normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";
import { profilesFromExtract } from "../lib/linkedin-list-profiles.js";
import { parseProfileHeaderFromUiXml } from "../lib/linkedin-profile-from-uidump.js";
import { cropProfilePhotoAndCover } from "../lib/linkedin-profile-photo-crop.js";
import {
  nameHintFromLinkedInUrl,
  parseProfileHeader,
} from "../lib/linkedin-profile-page.js";
import { takeSenseArg } from "../lib/sense.js";
import {
  sanitizeSearchText,
  typeQueryFromProfile as buildTypeQuery,
} from "../lib/linkedin-search-query.js";
import { key, launch, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
if (!process.env.OCR_MERGE_TIMEOUT_MS) {
  process.env.OCR_MERGE_TIMEOUT_MS = "20000";
}

const WAIT_AFTER_LINKEDIN_MS = 8_000;
const WAIT_AFTER_PROFILE_MS = 4_000;
const WAIT_AFTER_DEEPLINK_MS = 5_000;
const WAIT_AFTER_TYPE_MS = 1_200;
const WAIT_AFTER_SHOW_ALL_MS = 2_500;
const CLEAR_DEL_COUNT = 40;
const SHOW_ALL_QUERIES = [
  "Show all results",
  "See all results",
  "Show all",
  "See all",
];
/** Show all fica acima do teclado — "Clear all" (Recent y≈80) não pode casar. */
const SHOW_ALL_MIN_Y = 620;
const PEOPLE_QUERIES = ["People"];
const WAIT_AFTER_PEOPLE_MS = 2_000;
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
  // LinkedIn lento: poll até Search / Search people (não falhar em 4 taps).
  const t0 = Date.now();
  const timeoutMs = 45_000;
  while (Date.now() - t0 < timeoutMs) {
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
    if (bar && Number(bar.hit.y) < 200) {
      console.log(
        `   → search "${bar.hit.text}" x=${bar.hit.x} y=${bar.hit.y}`,
      );
      tapElement({ serial, x: bar.hit.x, y: bar.hit.y });
      await sleep(1_200);
      const again = await findFirstByText(serial, ["Search", "Search people"], {
        minScore: 0.65,
      });
      if (again && again.hit.y < 160) {
        tapElement({ serial, x: again.hit.x, y: again.hit.y });
        await sleep(600);
      }
      return;
    }
    console.log(
      `   Search ainda não visível (${Math.round((Date.now() - t0) / 1000)}s)…`,
    );
    await sleep(1_500);
  }
  // Último recurso: ícone lupa (topo)
  console.log("   fallback: tap lupa Search (x=270 y=80)…");
  tapElement({ serial, x: 270, y: 80 });
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

/** Query: nome + searchQuery + 1ª palavra da cidade. */
function typeQueryFromProfile(profile) {
  const q = buildTypeQuery(profile);
  try {
    console.log(`   boolean ref: ${booleanQueryForProfile(profile)}`);
  } catch {
    /* ignore */
  }
  console.log(`   query: ${q}`);
  return q;
}

/** Termo p/ filtrar cargo na lista (searchQuery ou 1ª palavra do title). */
function titleForSearch(profile) {
  const sq = sanitizeSearchText(profile?.searchQuery);
  if (sq) return sq.split(/\s+/).filter(Boolean)[0] || "";
  const fromTitle =
    sanitizeSearchText(profile?.title).split(/\s+/).filter(Boolean)[0] || "";
  if (fromTitle) return fromTitle;
  const current = String(profile?.current || "").trim();
  if (!current) return "";
  return (
    sanitizeSearchText(current.split(/\s+(?:at|@)\s+/i)[0])
      .split(/\s+/)
      .filter(Boolean)[0] || ""
  );
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

/** Hit de Show all válido (não "Clear all" da tela Recent). */
function isValidShowAllHit(hit) {
  if (!hit || hit.x == null || hit.y == null) return false;
  const t = String(hit.text || "").trim();
  if (/clear\s*all/i.test(t)) return false;
  if (!/show\s*all|see\s*all/i.test(t)) return false;
  if (Number(hit.y) < SHOW_ALL_MIN_Y) return false;
  return true;
}

/** Varre OCR cru por "Show all" / "Show all →" (findByText às vezes erra). */
function findShowAllInElements(els) {
  const list = els || [];
  const cands = [];
  for (const e of list) {
    const t = String(e.text || "").trim();
    const y = Number(e.y);
    const x = Number(e.x);
    if (!t || Number.isNaN(y) || x == null) continue;
    if (/clear\s*all/i.test(t)) continue;
    if (!/show\s*all|see\s*all/i.test(t)) continue;
    if (y < SHOW_ALL_MIN_Y) continue;
    cands.push({ text: t, x, y, query: "ocr-scan" });
  }
  // OCR parte "Show" + "all" na mesma linha
  for (const s of list) {
    if (!/^show$|^see$/i.test(String(s.text || "").trim())) continue;
    const a = list.find(
      (e) =>
        /^all\b/i.test(String(e.text || "").trim()) &&
        Math.abs(Number(e.y) - Number(s.y)) < 40 &&
        Number(e.y) >= SHOW_ALL_MIN_Y,
    );
    if (a) {
      cands.push({
        text: `${s.text} ${a.text}`,
        x: Math.floor((Number(s.x) + Number(a.x)) / 2),
        y: Number(s.y),
        query: "ocr-split",
      });
    }
  }
  cands.sort((a, b) => b.y - a.y);
  return cands[0] || null;
}

/**
 * Clica Show/See all results logo após digitar.
 * Sem KEYCODE_BACK (sai da busca → Home/Post). Ignora Clear all@Recent.
 */
async function submitShowAllResults(serial) {
  console.log("   Show all results…");
  const tryFind = async (timeoutMs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      try {
        const els = await extractBySense({ serial, engine: OCR_ENGINE });
        const fromScan = findShowAllInElements(els);
        if (fromScan) return fromScan;
      } catch {
        /* ignore */
      }
      for (const q of SHOW_ALL_QUERIES) {
        const hit = await findByText(serial, q, {
          minScore: 0.72,
          engine: OCR_ENGINE,
        });
        if (isValidShowAllHit(hit)) {
          return { ...hit, query: q };
        }
        if (hit && /clear\s*all/i.test(String(hit.text || ""))) {
          console.log(
            `   ignore showAll-falso "${hit.text}" y=${hit.y} (query="${q}")`,
          );
        }
      }
      await sleep(800);
    }
    return null;
  };

  let hit = await tryFind(10_000);
  if (!hit) {
    console.log("   Show all sumiu — KEYCODE_ENTER…");
    key({ serial, code: "KEYCODE_ENTER" });
    await sleep(1_200);
    hit = await tryFind(6_000);
  }
  if (hit) {
    console.log(
      `   → showAll "${hit.text}" x=${hit.x} y=${hit.y} (query="${hit.query}")`,
    );
    tapElement({ serial, x: hit.x, y: hit.y });
    await sleep(WAIT_AFTER_SHOW_ALL_MS);
    return;
  }
  // Só fallback geométrico se ainda parece busca (não Home/Post)
  try {
    const els = await extractBySense({ serial, engine: OCR_ENGINE });
    const blob = (els || []).map((e) => e.text).join(" ");
    if (/collaborative posts|recommended for you|^home$/i.test(blob)) {
      console.log("   saiu da busca — não tap fallback");
      return;
    }
  } catch {
    /* ignore */
  }
  console.log("   fallback: tap faixa Show all (y=780)…");
  tapElement({ serial, x: 270, y: 780 });
  await sleep(WAIT_AFTER_SHOW_ALL_MS);
}

/** Tela "Recent" / "Clear all" — histórico, não resultados. */
function isRecentSearchScreen(els) {
  const top = (els || [])
    .filter((e) => Number(e.y) < 160)
    .map((e) => String(e.text || "").trim())
    .join(" ");
  return /\brecent\b/i.test(top) && /clear\s*all/i.test(top);
}

/** Home / compose / recommended — não é lista de busca. */
function isOffSearchResults(els) {
  const blob = (els || [])
    .map((e) => String(e.text || ""))
    .join(" ");
  return /collaborative posts|recommended for you|share your thoughts/i.test(
    blob,
  );
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

/** Nome de pessoa (não cargo/filtro/feed/chrome). */
function looksLikePersonName(name, opts = {}) {
  const n = String(name || "")
    .replace(/\s+/g, " ")
    .trim();
  if (n.length < 5 || n.length > 70) return false;
  if (/^(current|past|comprador|compradora)\b/i.test(n)) return false;
  if (/\b(ago|yesterday|today|hour|minute|edited|viewed)\b/i.test(n)) {
    return false;
  }
  if (/^\d+\s*(month|year|day|hr|min)/i.test(n)) return false;
  // chips / feed / UI (Andrey: clicou "From my network")
  if (
    /\b(from my network|past\s+\d|view full profile|view my newsletter|other similar|show (all|translation)|people you may|collaborative posts|follow|newsletter|parceria|fornecedor)\b/i.test(
      n,
    )
  ) {
    return false;
  }
  const title = String(opts.excludeTitle || "").trim();
  if (title && n.toLowerCase() === title.toLowerCase()) return false;
  if (!/\s/.test(n) && /^(analyst|engineer|manager|buyer|seller)$/i.test(n)) {
    return false;
  }
  const tokens = n.split(/\s+/).filter((t) => /[A-Za-zÀ-ÿ]/.test(t));
  if (tokens.length < 2 || tokens.length > 5) return false;
  // cada token de nome começa com maiúscula (OCR de pessoa)
  if (!tokens.every((t) => /^[\p{Lu}]/u.test(t) || /^(de|da|do|dos|das|e)$/i.test(t))) {
    return false;
  }
  return true;
}

/**
 * Após Show all: clica a 1ª pessoa da lista (menor y) — nunca cargo/filtro/Recent.
 */
async function openFirstPerson(serial, opts = {}) {
  const attempts = opts.attempts ?? 8;
  const excludeTitle = titleForSearch(opts.profile || {});
  const preferred = sanitizeSearchText(opts.profile?.name || "").toLowerCase();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`   1ª aparição (${attempt}/${attempts})…`);
    try {
      const listPng = join(
        opts.outDir || ROOT,
        `list-fallback-${String(attempt).padStart(2, "0")}.png`,
      );
      const els = await extractBySense(
        { serial, engine: OCR_ENGINE },
        opts.outDir ? { outPath: listPng } : {},
      );
      if (opts.outDir && !existsSync(listPng)) {
        await captureFrame(serial, { outPath: listPng });
      }
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

      if (isRecentSearchScreen(els) || isOffSearchResults(els)) {
        console.log(
          `   fora da lista (${isRecentSearchScreen(els) ? "Recent" : "Home/Post"}) — refocus + Show all…`,
        );
        const q = typeQueryFromProfile(opts.profile || {});
        await ensureSearchFocused(serial);
        await clearSearchField(serial);
        await typeSearchQuery(serial, q);
        await submitShowAllResults(serial);
        await sleep(1_000);
        continue;
      }

      // Card em destaque: OCR do nome mesmo se profilesFromExtract falhar.
      const ocrNameHits = (els || [])
        .filter((e) => Number(e.y) >= LIST_MIN_Y && Number(e.y) < 900)
        .map((e) => ({
          name: String(e.text || "")
            .replace(/[©®•·].*$/g, "")
            .replace(/\s+[A-Za-z]$/g, "")
            .trim(),
          x: e.x,
          y: e.y,
        }))
        .filter((c) => looksLikePersonName(c.name, { excludeTitle }))
        .filter((c) => {
          const n = c.name;
          if (/[|…]|\.\.\./.test(n)) return false;
          if (/\b(connect|follow|message|mutual|brazil|brasil|gest[aã]o|coordenador|assistente)\b/i.test(n)) {
            return false;
          }
          if (/,/.test(n)) return false;
          // histórico de query ("Nome Cargo Cidade") sem grau — não é perfil
          if (excludeTitle && new RegExp(`\\b${excludeTitle}\\b`, "i").test(n)) {
            return false;
          }
          return true;
        });

      // Só Connect/Message/Pending — não Follow (Recommended for you)
      const cards = profilesFromExtract(els, { engine: OCR_ENGINE })
        .filter((c) => c?.x != null && Number(c.y) >= LIST_MIN_Y)
        .filter((c) => /^(Connect|Message|Pending)$/i.test(String(c.action || "")))
        .filter((c) => looksLikePersonName(c.name, { excludeTitle }));
      const suggestions = searchSuggestionsFromExtract(els).filter((s) =>
        looksLikePersonName(s.name, { excludeTitle }),
      );
      console.log(
        `   cards: ${cards.map((c) => `${c.name}@y${c.y}`).join(" | ") || "(nenhum)"}`,
      );
      console.log(
        `   sugestões: ${suggestions.map((s) => `${s.name}@y${s.y}`).join(" | ") || "(nenhuma)"}`,
      );
      if (ocrNameHits.length) {
        console.log(
          `   ocr-nome: ${ocrNameHits.map((c) => `${c.name}@y${c.y}`).join(" | ")}`,
        );
      }
      const byY = (a, b) => Number(a.y) - Number(b.y);
      const nameTokens = preferred
        .split(/\s+/)
        .filter((t) => t.length >= 3);
      const matchesPreferred = (c) => {
        if (!nameTokens.length) return false;
        const n = sanitizeSearchText(c.name).toLowerCase();
        return nameTokens.every((t) => n.includes(t));
      };
      const preferName = (list, { requireMatch = false } = {}) => {
        const sorted = [...list].sort(byY);
        const hit = sorted.find(matchesPreferred);
        if (hit) return hit;
        if (requireMatch) return null;
        return sorted[0] || null;
      };
      // Prefer nome do perfil; senão 1ª card Connect / sugestão •
      const pick =
        preferName(cards, { requireMatch: true }) ||
        preferName(suggestions, { requireMatch: true }) ||
        preferName(ocrNameHits, { requireMatch: true }) ||
        preferName(cards) ||
        preferName(suggestions);

      if (pick) {
        const x = Math.min(Number(pick.x), 280);
        console.log(
          `   → abrir 1ª pessoa "${pick.name}" x=${x} y=${pick.y}`,
        );
        tapElement({ serial, x, y: pick.y });
        await sleep(800);
        return pick;
      }

      const sample = els
        .filter((e) => Number(e.y) >= LIST_MIN_Y && Number(e.y) < 820)
        .slice(0, 8)
        .map((e) => e.text)
        .join(" | ");
      if (sample) console.log(`   ocr sample: ${sample}`);
      if (/from my network|newsletter|show translation/i.test(sample)) {
        console.log("   parece feed/Posts — Show all de novo…");
        try {
          await submitShowAllResults(serial);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      console.log(`   lista: ${e.message || e}`);
    }
    await sleep(1_500);
  }
  throw new Error("nenhuma pessoa na lista de resultados");
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

function parseArgs(rawArgv) {
  const { sense, argv } = takeSenseArg(rawArgv);
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
  return { configPath, profileId, fromProfile, profileUrlArg, sense };
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
  const { configPath, profileId, fromProfile, profileUrlArg, sense } = parseArgs(
    process.argv.slice(2),
  );
  console.log(`sense: ${sense} (SCREEN_ROBOT_SENSE / --sense ocr|dump)`);
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
  } else {
    console.log("   modo --from-profile (deep link)");
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
  /** @type {string|null} */
  let knownProfileUrl = null;

  if (!fromProfile) {
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
    await typeSearchQuery(serial, typeQueryFromProfile(profile));
    await submitShowAllResults(serial);
    // Nunca People — 1ª pessoa após Show all (não cargo/filtro/Jobs).
    const opened = await openFirstPerson(serial, { outDir, profile });
    openedName = String(opened?.name || name).trim();
    await sleep(WAIT_AFTER_PROFILE_MS);
  } else {
    console.log("3) Abrir perfil direto (deep link)…");
    knownProfileUrl =
      normalizeLinkedInProfileUrl(profileUrlArg) ||
      (await fetchStoredProfileUrl(profileId));
    if (!knownProfileUrl) {
      throw new Error(
        "--from-profile exige --url https://www.linkedin.com/in/… (ou profileUrl já salvo)",
      );
    }
    openProfileByUrl(serial, linkedinPkg, knownProfileUrl);
    await sleep(WAIT_AFTER_DEEPLINK_MS);
    console.log("4–5) skip busca (deep link)");
  }

  console.log(`6) cartão (1ª tela, sense=${sense})…`);
  const cardPng = join(outDir, "card-00.png");
  let header = {
    name: null,
    headline: null,
    company: null,
    location: null,
    connections: null,
    mutualConnections: null,
    connectionDegree: null,
    canConnect: false,
    canMessage: false,
    inviteStatus: null,
  };
  /** @type {object[]|null} */
  let cardEls = null;
  /** @type {string} */
  let pageXml = "";
  const nameHint =
    nameHintFromLinkedInUrl(knownProfileUrl || profileUrlArg || "") ||
    openedName ||
    name;
  try {
    pageXml = dumpUiXml(serial);
    writeFileSync(join(outDir, "card-00.xml"), pageXml, "utf8");
    if (sense === "dump") {
      const parsed = parseProfileHeaderFromUiXml(pageXml, { nameHint });
      header = parsed.header;
      cardEls = parsed.elements;
    } else {
      cardEls = await extract(
        { serial, engine: OCR_ENGINE },
        { outPath: cardPng },
      );
      header = parseProfileHeader(cardEls, { nameHint });
    }
    writeFileSync(
      join(outDir, "card-00.json"),
      JSON.stringify(cardEls, null, 2),
      "utf8",
    );
    console.log(
      `   card (${sense}): name=${header.name || "-"} headline=${header.headline || "-"} company=${header.company || "-"} loc=${header.location || "-"} conn=${header.connections || "-"} mutual=${header.mutualConnections || "-"} status=${header.inviteStatus || "-"} connect=${header.canConnect} msg=${header.canMessage} grau=${header.connectionDegree || "-"}`,
    );
  } catch (e) {
    console.log(`   card: ${e.message || e}`);
  }

  /** @type {string|null} */
  let photoBase64 = null;
  /** @type {string|null} */
  let coverBase64 = null;
  /** @type {string|null} */
  let cardBase64 = null;
  try {
    if (!existsSync(cardPng)) {
      await captureFrame(serial, { outPath: cardPng });
    }
    if (existsSync(cardPng)) {
      console.log("6b) Crop foto + capa (bounds dump)…");
      const media = await cropProfilePhotoAndCover(cardPng, outDir, {
        uiXml: pageXml,
      });
      photoBase64 = media.photoBase64;
      coverBase64 = media.coverBase64;
      cardBase64 = media.cardBase64;
      console.log(
        `   crop (${media.source}): photo=${media.photoPath || "-"} ${JSON.stringify(media.photoBox)} cover=${media.coverPath || "-"} ${JSON.stringify(media.coverBox)}`,
      );
    }
  } catch (e) {
    console.log(`   crop: ${e.message || e}`);
  }

  /** URL: se já veio no --url / deep link, não abre Share/Copy. */
  let profileUrl = knownProfileUrl || null;
  if (profileUrl) {
    console.log(`7) URL já conhecida — skip Share/Copy: ${profileUrl}`);
  } else {
    console.log("7) ⋯ → Share via → Copy → URL…");
    try {
      profileUrl = await captureProfileUrl(serial, outDir, {
        engine: OCR_ENGINE,
      });
    } catch (e) {
      console.log(`   URL: ${e.message || e}`);
    }
    if (!profileUrl) {
      throw new Error("URL linkedin.com/in/… não obtida");
    }
    console.log(`   URL: ${profileUrl}`);
  }

  const payload = {
    profileId,
    name: header.name || nameHint || openedName || profile.name || null,
    headline: header.headline || null,
    company: header.company || null,
    location: header.location || profile.city || null,
    connections: header.connections || null,
    mutualConnections: header.mutualConnections || null,
    canConnect: header.canConnect ?? null,
    canMessage: header.canMessage ?? null,
    inviteStatus: header.inviteStatus || null,
    profileUrl,
    connectionDegree:
      header.connectionDegree || profile.level || null,
    photoBase64,
    coverBase64,
    cardBase64,
    rawOcr: cardEls ? { elements: cardEls } : null,
    extractedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(outDir, "detail.json"),
    JSON.stringify(
      {
        ...payload,
        photoBase64: photoBase64 ? `[base64 ${photoBase64.length} chars]` : null,
        coverBase64: coverBase64 ? `[base64 ${coverBase64.length} chars]` : null,
        cardBase64: cardBase64 ? `[base64 ${cardBase64.length} chars]` : null,
        rawOcr: cardEls ? { elements: cardEls.length } : null,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`   → ${join(outDir, "detail.json")}`);

  console.log("8) POST /profile-details (cartão + mídia) e encerrar…");
  const saved = await postProfileDetail(payload);
  console.log(
    `   OK id=${saved.id} profileId=${saved.profileId} name=${saved.name || "-"} headline=${saved.headline || "-"} status=${saved.inviteStatus || "-"} msg=${saved.canMessage} photo=${saved.photoBase64 ? "sim" : "não"}`,
  );
  console.log("OK — cartão persistido — encerrando processo");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
