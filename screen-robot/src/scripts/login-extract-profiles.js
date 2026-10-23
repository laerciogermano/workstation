#!/usr/bin/env node
/**
 * LinkedIn: stop apps → launch → waitForText(Search) → tap → colar "comprador" →
 * See all results → para cada card: tap → OCR 1ª tela + URL (⋯ Share/Copy) → BACK →
 * próximo, até `-n` / `--max-profiles` (default 500). Scroll quando a tela não tem novos.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-extract-profiles
 *   npm run login-extract-profiles -- -n 10
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
import { extract, findByText, waitForText } from "../lib/extract.js";
import { captureFrame } from "../lib/frame.js";
import {
  captureProfileUrl,
  leaveProfile,
} from "../lib/linkedin-capture-profile-url.js";
import { profilesFromExtract } from "../lib/linkedin-list-profiles.js";
import { parseProfileHeader } from "../lib/linkedin-profile-page.js";
import {
  cropListProfilePhotoAndCard,
  cropProfilePhotoAndCover,
} from "../lib/linkedin-profile-photo-crop.js";
import { searchQueryFromCard } from "../lib/linkedin-search-query.js";
import { pasteCleanMessage } from "../lib/linkedin-message.js";
import { key, launch, scroll, stop, tapElement } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
if (!process.env.OCR_MERGE_TIMEOUT_MS) {
  process.env.OCR_MERGE_TIMEOUT_MS = "20000";
}
const WAIT_TEXT_TIMEOUT_MS = 30_000;
const WAIT_TEXT_INTERVAL_MS = 1_000;
/** Primeira tentativa de See/Show all ainda com teclado aberto. */
const WAIT_SEE_ALL_KEYBOARD_MS = 8_000;
const WAIT_AFTER_PROFILE_MS = 3_000;
const SCROLL_DELAY_MS = 900;
const SCROLL_DISTANCE = 280;
const SCROLL_BURST = 1;
const MAX_PROFILES = 500;
const MAX_ROUNDS = 500;
/**
 * Rodadas seguidas sem avanço → fim.
 * Antes: 2 (conteúdo OU frame) — OCR fragmentado (“no padrão: 0” com nomes na tela)
 * fazia o extract parar cedo (~9 perfis) com code=0.
 * Agora: precisa conteúdo E frame estáveis (menos falso fim).
 */
const SCROLL_END_STABLE_NEEDED = Number(
  process.env.EXTRACT_SCROLL_STABLE || 4,
);
const OCR_ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";
/** Base da API Nest (ex.: http://localhost:3000). Vazio = só JSON local. */
const PROFILES_API_URL = (process.env.PROFILES_API_URL || "").replace(/\/$/, "");
const SEE_ALL_QUERIES = [
  "See all results",
  "Show all results",
  "See all",
  "Show all",
];

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
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

function profileRow(profile) {
  const f = profile.fields || {};
  const h = profile.header || {};
  const title = f.title || h.headline || null;
  const current = f.current || h.company || null;
  const searchQuery =
    searchQueryFromCard({ title, current }) || null;
  return {
    name: h.name || f.name || profile.name || null,
    title,
    searchQuery,
    level: h.connectionDegree || f.level || null,
    connection: f.connection || profile.action || null,
    city: h.location || f.city || null,
    mutualConnections:
      h.mutualConnections || f.mutualConnections || null,
    current,
    past: f.past || null,
    profileUrl: profile.profileUrl || null,
    headline: h.headline || null,
    company: h.company || null,
    connections: h.connections || null,
    inviteStatus: h.inviteStatus || null,
    canConnect: h.canConnect ?? null,
    canMessage: h.canMessage ?? null,
    photoBase64: profile.photoBase64 || null,
    cardBase64: profile.cardBase64 || null,
    coverBase64: profile.coverBase64 || null,
    rawOcr: profile.rawOcr || null,
  };
}

/** Payload HTTP alinhado a POST /profiles (vendas/api). */
function profileApiPayload(profile) {
  const row = profileRow(profile);
  return {
    name: row.name,
    title: row.title,
    searchQuery: row.searchQuery,
    level: row.level,
    connection: row.connection,
    city: row.city,
    mutualConnections: row.mutualConnections,
    current: row.current,
    past: row.past,
    photoBase64: row.photoBase64,
    cardBase64: row.cardBase64,
    rawOcr: row.rawOcr,
    extractedAt: profile.extractedAt || null,
    round: profile.round ?? null,
  };
}

/** Payload POST /profile-details (precisa profileId da API). */
function profileDetailApiPayload(profile, profileId) {
  const h = profile.header || {};
  return {
    profileId,
    name: h.name || profile.name || null,
    headline: h.headline || null,
    company: h.company || null,
    location: h.location || null,
    connections: h.connections || null,
    mutualConnections: h.mutualConnections || null,
    canConnect: h.canConnect ?? null,
    canMessage: h.canMessage ?? null,
    inviteStatus: h.inviteStatus || null,
    profileUrl: profile.profileUrl || null,
    connectionDegree: h.connectionDegree || null,
    photoBase64: profile.photoBase64 || null,
    coverBase64: profile.coverBase64 || null,
    cardBase64: profile.cardBase64 || null,
    rawOcr: profile.rawOcr || null,
    extractedAt: profile.extractedAt || null,
  };
}

/** Resumo sem base64 (logs / profiles.json). */
function profileRowForJson(profile) {
  const row = profileRow(profile);
  const els = row.rawOcr?.elements;
  return {
    ...row,
    photoBase64: row.photoBase64
      ? `[base64 ${row.photoBase64.length} chars]`
      : null,
    cardBase64: row.cardBase64
      ? `[base64 ${row.cardBase64.length} chars]`
      : null,
    coverBase64: row.coverBase64
      ? `[base64 ${row.coverBase64.length} chars]`
      : null,
    rawOcr: Array.isArray(els)
      ? { elements: els.length }
      : row.rawOcr
        ? { ok: true }
        : null,
  };
}

async function postProfileToApi(profile) {
  if (!PROFILES_API_URL) return null;
  const url = `${PROFILES_API_URL}/profiles`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profileApiPayload(profile)),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  return res.json().catch(() => null);
}

async function postProfileDetailToApi(profile, profileId) {
  if (!PROFILES_API_URL || !profileId) return null;
  const url = `${PROFILES_API_URL}/profile-details`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profileDetailApiPayload(profile, profileId)),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  return res.json().catch(() => null);
}

function writeProfilesJson(outDir, rows) {
  const path = join(outDir, "profiles.json");
  writeFileSync(path, JSON.stringify(rows, null, 2), "utf8");
  return path;
}

function printProfileSummary(profile, count) {
  console.log(`\n========== quantidade: ${count} ==========`);
  console.log(JSON.stringify(profileRowForJson(profile), null, 2));
  console.log("==============================================\n");
}

async function defaultOnProfile(profile, ctx) {
  const { outDir, rows, count } = ctx;
  writeFileSync(
    join(outDir, `profile-${String(count).padStart(3, "0")}.json`),
    JSON.stringify(profile, null, 2),
    "utf8",
  );
  const path = writeProfilesJson(outDir, rows);
  console.log(`   → ${path} (${rows.length})`);
  if (PROFILES_API_URL) {
    try {
      const saved = await postProfileToApi(profile);
      const profileId = saved?.id || null;
      console.log(
        `   → POST ${PROFILES_API_URL}/profiles${profileId ? ` id=${profileId}` : ""}`,
      );
      if (profileId && profile.profileUrl) {
        try {
          await postProfileDetailToApi(profile, profileId);
          console.log(`   → POST ${PROFILES_API_URL}/profile-details`);
        } catch (e) {
          console.error(`   ⚠ POST profile-details falhou (continua): ${e.message}`);
        }
      }
    } catch (e) {
      // JSON local já gravado; não abortar o scroll por falha pontual da API
      console.error(`   ⚠ POST API falhou (continua): ${e.message}`);
    }
  }
  printProfileSummary(profile, count);
}

/**
 * Abre o card da lista → OCR 1ª tela → URL → BACK para a lista.
 * @returns {Promise<{ header: object, profileUrl: string|null, photoBase64: string|null, coverBase64: string|null, cardBase64: string|null, rawOcr: object|null }>}
 */
async function openProfileAndExtract(serial, listCard, outDir, filePrefix) {
  const tapX = Number(listCard.x);
  const tapY = Number(listCard.y);
  if (!Number.isFinite(tapX) || !Number.isFinite(tapY)) {
    throw new Error(`coords inválidas para tap: x=${listCard.x} y=${listCard.y}`);
  }
  console.log(
    `   → abrir "${listCard.name}" x=${tapX} y=${tapY}`,
  );
  tapElement({ serial, x: tapX, y: tapY });
  await sleep(WAIT_AFTER_PROFILE_MS);

  const cardPng = join(outDir, `${filePrefix}-page.png`);
  /** @type {object} */
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
  try {
    cardEls = await extract(
      { serial, engine: OCR_ENGINE },
      { outPath: cardPng },
    );
    writeFileSync(
      join(outDir, `${filePrefix}-page.json`),
      JSON.stringify(cardEls, null, 2),
      "utf8",
    );
    header = parseProfileHeader(cardEls, { nameHint: listCard.name });
    console.log(
      `   page: name=${header.name || "-"} headline=${header.headline || "-"} company=${header.company || "-"} loc=${header.location || "-"} status=${header.inviteStatus || "-"}`,
    );
  } catch (e) {
    console.log(`   page OCR: ${e.message || e}`);
  }

  /** @type {string|null} */
  let photoBase64 = null;
  /** @type {string|null} */
  let coverBase64 = null;
  /** @type {string|null} */
  let cardBase64 = null;
  if (existsSync(cardPng)) {
    try {
      const media = await cropProfilePhotoAndCover(cardPng, outDir);
      photoBase64 = media.photoBase64;
      coverBase64 = media.coverBase64;
      cardBase64 = media.cardBase64;
      console.log(
        `   crop page: photo=${media.photoPath || "-"} cover=${media.coverPath || "-"}`,
      );
    } catch (e) {
      console.log(`   crop page: ${e.message || e}`);
    }
  }

  /** @type {string|null} */
  let profileUrl = null;
  try {
    profileUrl = await captureProfileUrl(serial, outDir, {
      engine: OCR_ENGINE,
    });
  } catch (e) {
    console.log(`   URL: ${e.message || e}`);
  }
  if (profileUrl) {
    console.log(`   URL: ${profileUrl}`);
  } else {
    console.log("   ⚠ URL linkedin.com/in/… não obtida");
  }

  const left = await leaveProfile(serial, { engine: OCR_ENGINE });
  if (!left) {
    console.log("   ⚠ leaveProfile: Search/lista não confirmada após BACK");
  }
  await sleep(800);

  return {
    header,
    profileUrl,
    photoBase64,
    coverBase64,
    cardBase64,
    rawOcr: cardEls ? { elements: cardEls } : null,
  };
}

async function frameHash(serial, outPath) {
  const path = await captureFrame(serial, outPath ? { outPath } : {});
  return createHash("sha1").update(readFileSync(path)).digest("hex");
}

/** Fingerprint estável da lista visível (keys dos cards; senão textos OCR). */
function contentFingerprint(els) {
  const keys = profilesFromExtract(els, { engine: OCR_ENGINE })
    .map((p) => p.key)
    .filter(Boolean)
    .sort()
    .join("\n");
  if (keys) {
    return createHash("sha1").update(keys).digest("hex");
  }
  const texts = (els || [])
    .map((e) => String(e?.text || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("\n");
  return createHash("sha1").update(texts).digest("hex");
}

/**
 * Scroll com retry: INJECT_EVENTS costuma aparecer com overlay / app sem foco.
 * Recupera com BACK + launch LinkedIn.
 */
async function safeScroll(serial, linkedinPkg) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
      return;
    } catch (e) {
      const msg = String(e.message || e);
      const inject =
        /INJECT_EVENTS|SecurityException|device offline/i.test(msg);
      console.log(
        `   scroll falhou (${attempt}/4): ${msg.split("\n")[0].slice(0, 120)}`,
      );
      if (!inject || attempt === 4) throw e;
      try {
        key({ serial, code: "KEYCODE_BACK" });
      } catch {
        /* ignore */
      }
      await sleep(600);
      if (linkedinPkg) {
        await launch({ serial, package: linkedinPkg });
        await sleep(1_500);
      }
    }
  }
}

async function extractProfilesLoop(serial, outDir, opts = {}) {
  const onProfile = opts.onProfile ?? defaultOnProfile;
  const linkedinPkg = opts.linkedinPkg;
  const maxRounds = opts.maxRounds ?? MAX_ROUNDS;
  const maxProfiles = opts.maxProfiles ?? MAX_PROFILES;
  /** @type {object[]} */
  const saved = [];
  /** @type {object[]} linhas limpas em profiles.json */
  const rows = [];
  const seen = new Set();
  let contentStable = 0;
  let frameStable = 0;
  let prevContentFp = null;
  let prevHash = await frameHash(serial, join(outDir, "frame-000.png"));
  writeProfilesJson(outDir, rows);

  for (let round = 1; round <= maxRounds && saved.length < maxProfiles; round++) {
    const roundPad = String(round).padStart(3, "0");
    const roundPng = join(outDir, `round-${roundPad}.png`);
    console.log(`${round}) extract lista… (${saved.length}/${maxProfiles})`);
    let els;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        els = await extract(
          { serial, engine: OCR_ENGINE },
          { outPath: roundPng },
        );
        break;
      } catch (e) {
        console.log(`   extract falhou (${attempt}/3): ${e.message || e}`);
        if (attempt === 3) throw e;
        await sleep(1_500);
      }
    }
    console.log(`   → ${roundPng}`);
    writeFileSync(
      join(outDir, `list-round-${roundPad}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );

    const parsed = profilesFromExtract(els, { engine: OCR_ENGINE });
    const fresh = parsed
      .filter((p) => !seen.has(p.key))
      .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    const contentFp = contentFingerprint(els);
    console.log(`   novos na tela: ${fresh.length}`);
    if (fresh.length) {
      console.log(`   nomes: ${fresh.map((p) => p.name).join(" | ")}`);
    }

    // Um perfil por rodada (topo → baixo): tap → page+URL → BACK → re-extract.
    if (fresh.length > 0) {
      const p = fresh[0];
      seen.add(p.key);
      const index = saved.length + 1;
      const filePrefix = `profile-${String(index).padStart(3, "0")}`;

      /** @type {string|null} */
      let listPhotoBase64 = null;
      /** @type {string|null} */
      let listCardBase64 = null;
      try {
        const media = await cropListProfilePhotoAndCard(
          roundPng,
          p,
          outDir,
          `${filePrefix}-list`,
        );
        listPhotoBase64 = media.photoBase64;
        listCardBase64 = media.cardBase64;
        console.log(
          `   crop lista ${p.name}: photo=${media.photoPath || "-"} card=${media.cardPath || "-"}`,
        );
      } catch (e) {
        console.log(`   crop lista ${p.name}: ${e.message || e}`);
      }

      /** @type {object} */
      let pageData = {
        header: {},
        profileUrl: null,
        photoBase64: null,
        coverBase64: null,
        cardBase64: null,
        rawOcr: null,
      };
      try {
        pageData = await openProfileAndExtract(
          serial,
          p,
          outDir,
          filePrefix,
        );
      } catch (e) {
        console.error(`   ⚠ abrir/extrair falhou (continua): ${e.message || e}`);
        try {
          await leaveProfile(serial, { engine: OCR_ENGINE });
        } catch {
          /* ignore */
        }
      }

      const profile = {
        index,
        name: pageData.header?.name || p.name,
        action: p.action,
        fields: p.fields,
        header: pageData.header || {},
        profileUrl: pageData.profileUrl || null,
        extractedAt: new Date().toISOString(),
        round,
        x: p.x,
        y: p.y,
        cardBounds: p.cardBounds,
        photoBase64: pageData.photoBase64 || listPhotoBase64,
        coverBase64: pageData.coverBase64 || null,
        cardBase64: pageData.cardBase64 || listCardBase64,
        texts: p.texts,
        ocr: p.ocr,
        rawOcr: pageData.rawOcr || { elements: p.ocr || [] },
      };
      saved.push(profile);
      rows.push(profileRowForJson(profile));
      writeProfilesJson(outDir, rows);
      await onProfile(profile, {
        count: saved.length,
        outDir,
        saved,
        rows,
        serial,
        round,
      });

      contentStable = 0;
      frameStable = 0;
      prevContentFp = null;
      // Sem scroll: próxima rodada re-extrai a lista (mesmo viewport) e pega o próximo.
      continue;
    }

    // Sem cards novos + mesma lista visível (parser). Sozinho não encerra — OCR
    // costuma falhar o padrão com nomes ainda na tela; exige frame estável também.
    if (prevContentFp != null && contentFp === prevContentFp) {
      contentStable += 1;
      console.log(
        `   fim do scroll? conteúdo igual sem novos (${contentStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
    } else {
      contentStable = 0;
      prevContentFp = contentFp;
    }

    for (let b = 0; b < SCROLL_BURST; b++) {
      await safeScroll(serial, linkedinPkg);
      await sleep(SCROLL_DELAY_MS);
    }

    const nextHash = await frameHash(
      serial,
      join(outDir, `frame-after-${roundPad}.png`),
    );
    if (nextHash === prevHash) {
      frameStable += 1;
      console.log(
        `   fim do scroll? frame igual (${frameStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
    } else {
      frameStable = 0;
      prevHash = nextHash;
    }

    if (
      contentStable >= SCROLL_END_STABLE_NEEDED &&
      frameStable >= SCROLL_END_STABLE_NEEDED
    ) {
      console.log(
        "   fim: scroll não avança mais (conteúdo + frame) — encerrando",
      );
      break;
    }
  }

  return saved;
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  let maxProfiles = MAX_PROFILES;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
    if (argv[i] === "--max-profiles" || argv[i] === "--limit" || argv[i] === "-n") {
      const n = Number(argv[++i]);
      if (Number.isFinite(n) && n >= 1) {
        maxProfiles = Math.min(500, Math.floor(n));
      }
    }
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

  console.log("4) Esperar Search e clicar…");
  const searchHit = await waitForText(serial, "Search", {
    timeoutMs: WAIT_TEXT_TIMEOUT_MS,
    intervalMs: WAIT_TEXT_INTERVAL_MS,
    engine: OCR_ENGINE,
  });
  console.log(
    `   → search "${searchHit.text}" x=${searchHit.x} y=${searchHit.y} (score=${searchHit.score?.toFixed?.(2) ?? searchHit.score})`,
  );
  tapElement({ serial, x: searchHit.x, y: searchHit.y });
  await sleep(1_000);

  console.log('5) Colar "comprador" (ADBKeyboard)…');
  await pasteCleanMessage(serial, "comprador", { forceClear: true });
  await sleep(800);

  console.log("6) Esperar See/Show all e clicar…");
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
  await sleep(2_000);

  console.log(
    `7) Lista → abrir cada perfil (OCR + URL) → BACK até ${maxProfiles}…`,
  );
  const saved = await extractProfilesLoop(serial, outDir, {
    onProfile: defaultOnProfile,
    linkedinPkg,
    maxProfiles,
  });

  writeProfilesJson(outDir, saved.map(profileRowForJson));
  console.log(`OK — ${saved.length} perfis`);
  console.log(`profiles.json: ${join(outDir, "profiles.json")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
