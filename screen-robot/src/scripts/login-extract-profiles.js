#!/usr/bin/env node
/**
 * LinkedIn: stop apps → launch → Search → "comprador" → Show all →
 * desce com `extract` por demanda até o fim do scroll (frame estável).
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
import { extract } from "../lib/extract.js";
import { captureFrame } from "../lib/frame.js";
import { key, launch, scroll, stop, tapElement, type } from "../lib/operate.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WAIT_AFTER_LINKEDIN_MS = 5_000;
/** Scroll curto e lento — evita pular cards entre extracts. */
const SCROLL_DELAY_MS = 900;
const SCROLL_DISTANCE = 280;
const SCROLL_BURST = 1;
const MAX_PROFILES = 500;
/** Só segurança; a saída real é fim do scroll (frame estável). */
const MAX_ROUNDS = 500;
const SCROLL_END_STABLE_NEEDED = 3;
const OCR_ENGINE = "all";

/** Coords OCR — recalibrar se resolução/layout mudar. */
const COORDS = {
  search: { x: 175, y: 79, text: "Search" },
  showAll: { x: 269, y: 850, text: "Show all results" },
};

/** Partículas de nome BR/PT (OCR traz "de"/"da" em minúsculo). */
const NAME_PARTICLES = new Set([
  "de",
  "da",
  "do",
  "dos",
  "das",
  "e",
  "di",
  "del",
  "van",
  "von",
]);
const BAD_NAME_RE =
  /\b(month|cancel|premium|try|free|dismiss|skip|ignore|linkedin|connect|pending|message|follow|current|past|mutual|connection|comprador|gest[aã]o|university|pramet|dormer|construtora|brazil|location)\b/i;

/**
 * OCR do botão: "© Pending", "i+ Connect", "+ Connect", "+ Follow".
 * Ignora "mutual connections".
 * @returns {"Connect"|"Pending"|"Message"|"Follow"|null}
 */
function parseActionLabel(text) {
  const raw = String(text || "").trim();
  if (!raw || /mutual|connection/i.test(raw)) return null;
  if (!/\b(connect|pending|message|follow)\b/i.test(raw)) return null;
  if (/\bpending\b/i.test(raw)) return "Pending";
  if (/\bconnect\b/i.test(raw)) return "Connect";
  if (/\bfollow\b/i.test(raw)) return "Follow";
  if (/\bmessage\b/i.test(raw)) return "Message";
  return null;
}

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

function cleanName(raw) {
  const words = String(raw || "")
    .trim()
    .replace(/[·•].*$/, "")
    .replace(/\s*[-–]\s*\d*(st|nd|rd|th)?\+?.*$/i, "")
    .replace(/\s+[A-Za-z]$/, "") // lixo OCR final ("Mendes O")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  for (const w of words) {
    if (out.length && out[out.length - 1].toLowerCase() === w.toLowerCase()) {
      continue;
    }
    out.push(w);
  }
  return out.join(" ");
}

function isValidProfileName(name) {
  const n = cleanName(name);
  if (n.length < 5 || n.length > 70) return false;
  if (BAD_NAME_RE.test(n)) return false;
  if (/[a-z][A-Z]/.test(n)) return false;
  if (/current:|past:|,/i.test(n)) return false;
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  if (!words.every((w) => /^[\p{L}']+$/u.test(w))) return false;
  if (!/^[\p{Lu}]/u.test(words[0])) return false;
  for (const w of words.slice(1)) {
    if (NAME_PARTICLES.has(w.toLowerCase())) continue;
    if (!/^[\p{Lu}]/u.test(w)) return false;
  }
  return true;
}

function pickNameAboveAction(elements, act) {
  const band = elements.filter(
    (e) => e.y >= act.y - 140 && e.y <= act.y + 20 && e.x < 420 && e.y > 160,
  );
  /** @type {{ name: string, x: number, y: number, score: number }[]} */
  const scored = [];
  for (const e of band) {
    const raw = String(e.text || "");
    if (parseActionLabel(raw)) continue;
    const name = cleanName(raw);
    if (!isValidProfileName(name)) continue;
    let score = name.length;
    if (/\s/.test(raw)) score += 40;
    if (name.split(/\s+/).length >= 2) score += 20;
    // linha típica LinkedIn: "Nome Sobrenome • 2nd"
    if (/[•·]/.test(raw) || /\b(1st|2nd|3rd)/i.test(raw)) score += 60;
    scored.push({ name, x: e.x, y: e.y, score });
  }
  scored.sort((a, b) => b.score - a.score || a.y - b.y);
  return scored[0] || null;
}

/**
 * Campos legíveis a partir do OCR do card.
 * @param {{ name: string, action: string, texts: string[], ocr: object[] }} card
 */
function parseCardFields(card) {
  const texts = (card.texts || []).map((t) => String(t || "").trim()).filter(Boolean);
  const joined = texts.join(" | ");

  let nivel = null;
  const nivelHit = joined.match(/\b(1st|2nd|3rd\+)\b/i);
  if (nivelHit) nivel = nivelHit[1].replace(/^\w/, (c) => c.toLowerCase()) === "3rd+"
    ? "3rd+"
    : nivelHit[1].toLowerCase().replace("rd+", "rd+");
  // normaliza 1st/2nd/3rd+
  if (nivelHit) {
    const n = nivelHit[1].toLowerCase();
    nivel = n.startsWith("1") ? "1st" : n.startsWith("2") ? "2nd" : "3rd+";
  }

  const status =
    parseActionLabel(card.action) || String(card.action || "").trim() || null;

  let mutualConnections = null;
  const mutualJoined = texts.find((t) => /mutual\s*connections?/i.test(t));
  if (mutualJoined) {
    const m = mutualJoined.match(/(\d+)\s*mutual/i);
    mutualConnections = m
      ? `${m[1]} mutual connections`
      : mutualJoined.replace(/\s+/g, " ");
  } else {
    const hasMutual = texts.some((t) => /^mutual$/i.test(t) || /^connections?$/i.test(t));
    if (hasMutual) {
      const num = texts.find((t) => /^\d+$/.test(t));
      mutualConnections = num
        ? `${num} mutual connections`
        : "mutual connections";
    }
  }

  let cidade = null;
  const cityLine = texts.find(
    (t) =>
      /,\s*(Brazil|Brasil|SP|RJ|MG|PR|RS|BA|PE|CE)/i.test(t) ||
      /\b(São Paulo|Sao Paulo|Campinas|Belo Horizonte|Rio de Janeiro|Curitiba|Porto Alegre|Brasília|Brasilia)\b/i.test(
        t,
      ),
  );
  if (cityLine) {
    cidade = cityLine.replace(/\s+/g, " ").trim();
  } else {
    // fragmentos OCR: "Belo" + "Horizonte, Minas" + "Gerais,Brazil"
    const cityish = texts.filter(
      (t) =>
        /\b(paulo|horizonte|campinas|janeiro|curitiba|alegre|bras[ií]lia|minas|gerais|brazil|brasil)\b/i.test(
          t,
        ) && !/premium|cancel|month|activate/i.test(t),
    );
    if (cityish.length) {
      cidade = [...new Set(cityish.map((t) => t.replace(/\s+/g, " ").trim()))]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  let headline = null;
  const headlineHit = texts.find(
    (t) =>
      /\|/.test(t) &&
      t.length >= 8 &&
      !/premium|cancel|mutual|brazil|paulo|horizonte/i.test(t) &&
      !parseActionLabel(t),
  );
  if (headlineHit) headline = headlineHit.replace(/\s+/g, " ").trim();

  let current = null;
  const currentHit = texts.find((t) => /^current:\s*/i.test(t) || /current:\s*\S/i.test(t));
  if (currentHit) current = currentHit.replace(/\s+/g, " ").trim();

  let past = null;
  const pastHit = texts.find((t) => /^past:\s*/i.test(t) || /past:\s*\S/i.test(t));
  if (pastHit) past = pastHit.replace(/\s+/g, " ").trim();

  return {
    name: card.name,
    nivel,
    status,
    cidade,
    mutualConnections,
    headline,
    current,
    past,
  };
}

function printProfileSummary(profile, count) {
  const f = profile.fields || {};
  console.log(`\n========== quantidade: ${count} ==========`);
  console.log(`nome:                 ${f.name || profile.name || "—"}`);
  console.log(`nivel:                ${f.nivel || "—"}`);
  console.log(`conexao / status:     ${f.status || profile.action || "—"}`);
  console.log(`cidade:               ${f.cidade || "—"}`);
  console.log(`mutual connections:   ${f.mutualConnections || "—"}`);
  console.log(`headline:             ${f.headline || "—"}`);
  console.log(`current:              ${f.current || "—"}`);
  console.log(`past:                 ${f.past || "—"}`);
  console.log("==============================================\n");
}

/** Cards no padrão (botão Connect/Pending/Message/Follow + nome válido). */
function profilesFromExtract(elements) {
  const actions = elements
    .map((e) => {
      const label = parseActionLabel(e.text);
      if (!label || e.y <= 160 || e.y >= 980) return null;
      return { ...e, actionLabel: label };
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);

  /** @type {object[]} */
  const out = [];
  const seen = new Set();

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const picked = pickNameAboveAction(elements, act);
    if (!picked) continue;

    const yTop =
      i === 0
        ? Math.max(160, act.y - 160)
        : Math.floor((actions[i - 1].y + act.y) / 2);
    const yBot =
      i === actions.length - 1
        ? act.y + 120
        : Math.floor((act.y + actions[i + 1].y) / 2);

    const card = elements
      .filter((e) => e.y >= yTop && e.y < yBot && e.x < 540)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((e) => ({ text: e.text, x: e.x, y: e.y }));

    const key = picked.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const base = {
      name: picked.name,
      key,
      action: act.actionLabel,
      x: picked.x,
      y: picked.y,
      texts: card.map((e) => e.text),
      ocr: card,
    };
    out.push({
      ...base,
      fields: parseCardFields(base),
    });
  }
  return out;
}

/**
 * Callback default: salva JSON + imprime resumo (nome, nível, status, cidade…).
 * @param {object} profile
 * @param {{ count: number, outDir: string, saved: object[] }} ctx
 */
async function defaultOnProfile(profile, ctx) {
  const { outDir, saved, count } = ctx;
  writeFileSync(
    join(outDir, `profile-${String(count).padStart(3, "0")}.json`),
    JSON.stringify(profile, null, 2),
    "utf8",
  );
  writeFileSync(join(outDir, "profiles.json"), JSON.stringify(saved, null, 2), "utf8");
  printProfileSummary(profile, count);
}

async function frameHash(serial) {
  const path = await captureFrame(serial);
  return createHash("sha1").update(readFileSync(path)).digest("hex");
}

/**
 * Desce a lista: extract → callback nos que batem o padrão → scroll.
 * Para só no fim do scroll (frame sem mudança N vezes) ou teto de segurança.
 *
 * @param {string} serial
 * @param {string} outDir
 * @param {{ onProfile?: Function, maxRounds?: number, maxProfiles?: number }} [opts]
 */
async function extractProfilesLoop(serial, outDir, opts = {}) {
  const onProfile = opts.onProfile ?? defaultOnProfile;
  const maxRounds = opts.maxRounds ?? MAX_ROUNDS;
  const maxProfiles = opts.maxProfiles ?? MAX_PROFILES;
  /** @type {object[]} */
  const saved = [];
  const seen = new Set();
  let stableEnd = 0;
  let prevHash = await frameHash(serial);

  for (let round = 1; round <= maxRounds && saved.length < maxProfiles; round++) {
    console.log(`${round}) extract…`);
    const els = await extract({ serial, engine: OCR_ENGINE });
    writeFileSync(
      join(outDir, `list-round-${String(round).padStart(3, "0")}.json`),
      JSON.stringify(els, null, 2),
      "utf8",
    );

    const fresh = profilesFromExtract(els).filter((p) => !seen.has(p.key));
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
      await onProfile(profile, {
        count: saved.length,
        outDir,
        saved,
        serial,
        round,
      });
    }

    for (let b = 0; b < SCROLL_BURST; b++) {
      scroll({ serial, direction: "down", distance: SCROLL_DISTANCE });
      await sleep(SCROLL_DELAY_MS);
    }

    const nextHash = await frameHash(serial);
    if (nextHash === prevHash) {
      stableEnd += 1;
      console.log(
        `   fim do scroll? frame igual (${stableEnd}/${SCROLL_END_STABLE_NEEDED})`,
      );
      if (stableEnd >= SCROLL_END_STABLE_NEEDED) {
        console.log("   fim: scroll não avança mais — encerrando");
        break;
      }
    } else {
      stableEnd = 0;
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

  console.log("8) Descer + extract por demanda (callback onProfile)…");
  const saved = await extractProfilesLoop(serial, outDir, {
    onProfile: defaultOnProfile,
  });

  console.log(`OK — ${saved.length} perfis em ${outDir}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
