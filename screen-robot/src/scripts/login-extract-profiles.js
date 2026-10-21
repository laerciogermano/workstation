#!/usr/bin/env node
/**
 * LinkedIn: stop apps → launch → waitForText(Search) → tap → "comprador" →
 * See all results → desce com `extract` por demanda até o fim do scroll.
 * Cada card no padrão dispara `onProfile(profile, ctx)`.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run login-extract-profiles
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
import { profilesFromExtract } from "../lib/linkedin-list-profiles.js";
import { key, launch, scroll, stop, tapElement, type } from "../lib/operate.js";
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
const SCROLL_DELAY_MS = 900;
const SCROLL_DISTANCE = 280;
const SCROLL_BURST = 1;
const MAX_PROFILES = 500;
const MAX_ROUNDS = 500;
/** Rodadas seguidas sem avanço (mesmo conteúdo OCR / frame) → fim. */
const SCROLL_END_STABLE_NEEDED = 2;
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
  return {
    name: f.name || profile.name || null,
    title: f.title || null,
    level: f.level || null,
    connection: f.connection || profile.action || null,
    city: f.city || null,
    mutualConnections: f.mutualConnections || null,
    current: f.current || null,
    past: f.past || null,
  };
}

/** Payload HTTP alinhado a POST /profiles (vendas/api). */
function profileApiPayload(profile) {
  return {
    ...profileRow(profile),
    extractedAt: profile.extractedAt || null,
    round: profile.round ?? null,
  };
}

async function postProfileToApi(profile) {
  if (!PROFILES_API_URL) return;
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
}

function writeProfilesJson(outDir, rows) {
  const path = join(outDir, "profiles.json");
  writeFileSync(path, JSON.stringify(rows, null, 2), "utf8");
  return path;
}

function printProfileSummary(profile, count) {
  console.log(`\n========== quantidade: ${count} ==========`);
  console.log(JSON.stringify(profileRow(profile), null, 2));
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
    await postProfileToApi(profile);
    console.log(`   → POST ${PROFILES_API_URL}/profiles`);
  }
  printProfileSummary(profile, count);
}

async function frameHash(serial) {
  const path = await captureFrame(serial);
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
  let prevHash = await frameHash(serial);
  writeProfilesJson(outDir, rows);

  for (let round = 1; round <= maxRounds && saved.length < maxProfiles; round++) {
    console.log(`${round}) extract…`);
    let els;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        els = await extract({ serial, engine: OCR_ENGINE });
        break;
      } catch (e) {
        console.log(`   extract falhou (${attempt}/3): ${e.message || e}`);
        if (attempt === 3) throw e;
        await sleep(1_500);
      }
    }
    writeFileSync(
      join(outDir, `list-round-${String(round).padStart(3, "0")}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );

    const parsed = profilesFromExtract(els, { engine: OCR_ENGINE });
    const fresh = parsed.filter((p) => !seen.has(p.key));
    const contentFp = contentFingerprint(els);
    console.log(`   no padrão: ${fresh.length}`);
    if (fresh.length) {
      console.log(`   nomes: ${fresh.map((p) => p.name).join(" | ")}`);
    }

    for (const p of fresh) {
      if (saved.length >= maxProfiles) break;
      seen.add(p.key);
      const profile = {
        index: saved.length + 1,
        name: p.name,
        action: p.action,
        fields: p.fields,
        extractedAt: new Date().toISOString(),
        round,
        x: p.x,
        y: p.y,
        texts: p.texts,
        ocr: p.ocr,
      };
      saved.push(profile);
      rows.push(profileRow(profile));
      writeProfilesJson(outDir, rows);
      await onProfile(profile, {
        count: saved.length,
        outDir,
        saved,
        rows,
        serial,
        round,
      });
    }

    // Sem cards novos + mesma lista visível → não dá mais pra descer (útil quando o SHA do frame oscila).
    if (fresh.length === 0 && prevContentFp != null && contentFp === prevContentFp) {
      contentStable += 1;
      console.log(
        `   fim do scroll? conteúdo igual sem novos (${contentStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
      if (contentStable >= SCROLL_END_STABLE_NEEDED) {
        console.log("   fim: scroll não avança mais (conteúdo) — encerrando");
        break;
      }
    } else {
      contentStable = 0;
      prevContentFp = contentFp;
    }

    for (let b = 0; b < SCROLL_BURST; b++) {
      await safeScroll(serial, linkedinPkg);
      await sleep(SCROLL_DELAY_MS);
    }

    const nextHash = await frameHash(serial);
    if (nextHash === prevHash) {
      frameStable += 1;
      console.log(
        `   fim do scroll? frame igual (${frameStable}/${SCROLL_END_STABLE_NEEDED})`,
      );
      if (frameStable >= SCROLL_END_STABLE_NEEDED) {
        console.log("   fim: scroll não avança mais (frame) — encerrando");
        break;
      }
    } else {
      frameStable = 0;
      prevHash = nextHash;
    }
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

  console.log('5) Digitar "comprador"…');
  await type({ serial, text: "comprador" });
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

  console.log("7) Descer + extract por demanda (callback onProfile)…");
  const saved = await extractProfilesLoop(serial, outDir, {
    onProfile: defaultOnProfile,
    linkedinPkg,
  });

  writeProfilesJson(outDir, saved.map(profileRow));
  console.log(`OK — ${saved.length} perfis`);
  console.log(`profiles.json: ${join(outDir, "profiles.json")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
