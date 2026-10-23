/**
 * Captura URL linkedin.com/in/… a partir do perfil aberto:
 * ⋯ → Share via → Copy (clipboard ou OCR da sheet).
 * Usado por login-extract-profiles e login-extract-profile-detail.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { adb, sleep } from "./adb.js";
import { extract, findByText } from "./extract.js";
import { normalizeLinkedInProfileUrl } from "./linkedin-connect.js";
import { key, tapElement } from "./operate.js";

const OCR_ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";

async function findFirstByText(serial, queries, opts = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  const minScore = opts.minScore ?? 0.75;
  for (const q of list) {
    const hit = await findByText(serial, q, {
      minScore,
      engine: opts.engine || OCR_ENGINE,
    });
    if (hit?.x != null && hit?.y != null) {
      return { hit, query: q };
    }
  }
  return null;
}

/** Lê clipboard do device (best-effort) → URL /in/… */
export function readDeviceClipboard(serial) {
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

/** Largura física do display (px). */
export function displayWidth(serial) {
  try {
    const r = adb(serial, ["shell", "wm", "size"]);
    const m = String(r.stdout || "").match(/(\d+)x(\d+)/);
    if (m) return Number(m[1]);
  } catch {
    /* ignore */
  }
  return 540;
}

/** Menu More aberto? (Share via / Send profile / Contact info). */
export async function moreMenuOpen(serial, opts = {}) {
  return Boolean(
    await findFirstByText(
      serial,
      [
        "Share via..",
        "Share via…",
        "Share via",
        "Send profile in a message",
        "Contact info",
        "About this member",
      ],
      { minScore: 0.6, engine: opts.engine },
    ),
  );
}

/**
 * ⋯ = mesma linha de Message/Connect (y dinâmico) + x à direita da tela.
 */
export async function tapProfileMoreButton(serial, opts = {}) {
  const engine = opts.engine || OCR_ENGINE;
  const w = displayWidth(serial);
  const msg = await findFirstByText(
    serial,
    ["Message", "1 Message", "Connect", "&+ Connect", "i+ Connect"],
    { minScore: 0.65, engine },
  );
  let y = 639;
  if (msg && Number(msg.hit.y) > 200 && Number(msg.hit.y) < 920) {
    y = Number(msg.hit.y);
  }
  const candidates = [w - 48, w - 36, w - 60, 492];

  const tried = new Set();
  for (const raw of candidates) {
    const x = Math.round(Number(raw));
    if (tried.has(x) || x < 400) continue;
    tried.add(x);
    console.log(
      `   → ⋯ x=${x} y=${y}${msg ? ` (âncora "${msg.hit.text}")` : " (fallback y)"}`,
    );
    tapElement({ serial, x, y });
    await sleep(1_400);
    if (await moreMenuOpen(serial, { engine })) return true;
    console.log("   ⋯ sem menu — tentar outro x");
  }
  return false;
}

/** URL /in/… a partir de linhas OCR (pode vir partida em 2). */
export function urlFromOcrEls(els) {
  const joined = (els || [])
    .map((e) => String(e?.text || "").trim())
    .filter(Boolean)
    .join("")
    .replace(/\s+/g, "");
  return normalizeLinkedInProfileUrl(joined);
}

/**
 * ⋯ → Share via → Copy → URL (clipboard ou OCR da sheet).
 * Não dá BACK se falhar no menu — evita voltar ao Search.
 * @returns {Promise<string|null>}
 */
export async function captureProfileUrl(serial, outDir, opts = {}) {
  const engine = opts.engine || OCR_ENGINE;
  console.log("   ⋯ → Share via → Copy…");

  const opened = await tapProfileMoreButton(serial, { engine });
  if (!opened) {
    console.log("   ⋯ não abriu menu — permanece no perfil");
    try {
      await extract(
        { serial, engine },
        { outPath: join(outDir, "more-menu-fail.png") },
      );
    } catch {
      /* ignore */
    }
    return null;
  }

  let shareVia = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    shareVia = await findFirstByText(
      serial,
      [
        "Share via..",
        "Share via…",
        "Share via",
        "Share Via",
        "Share profile via",
      ],
      { minScore: 0.58, engine },
    );
    if (shareVia) break;
    console.log(`   Share via não visível (${attempt}/4)`);
    await sleep(700);
  }
  if (!shareVia) {
    console.log("   Share via não encontrado — permanece no perfil (sem BACK)");
    try {
      await extract(
        { serial, engine },
        { outPath: join(outDir, "more-menu-fail.png") },
      );
    } catch {
      /* ignore */
    }
    return null;
  }
  console.log(
    `   → Share via "${shareVia.hit.text}" x=${shareVia.hit.x} y=${shareVia.hit.y}`,
  );
  tapElement({ serial, x: shareVia.hit.x, y: shareVia.hit.y });
  await sleep(1_800);

  const sheetPng = join(outDir, "share-via-sheet.png");
  let sheetEls = [];
  try {
    sheetEls = await extract({ serial, engine }, { outPath: sheetPng });
    writeFileSync(
      join(outDir, "share-via-sheet.json"),
      JSON.stringify(sheetEls, null, 2),
      "utf8",
    );
  } catch (e) {
    console.log(`   share-via extract: ${e.message || e}`);
  }

  let url = urlFromOcrEls(sheetEls);
  if (url) console.log(`   URL (OCR sheet): ${url}`);

  const copyHit = await findFirstByText(
    serial,
    ["Copy", "Copy link", "Copy to clipboard", "Copy Link"],
    { minScore: 0.65, engine },
  );
  if (!copyHit) {
    console.log("   Copy não encontrado — usa OCR se houver; BACK no sheet");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(600);
    return url;
  }
  console.log(
    `   → Copy "${copyHit.hit.text}" x=${copyHit.hit.x} y=${copyHit.hit.y}`,
  );
  tapElement({ serial, x: copyHit.hit.x, y: copyHit.hit.y });
  await sleep(1_000);

  let clip = readDeviceClipboard(serial);
  if (!clip) {
    await sleep(800);
    clip = readDeviceClipboard(serial);
  }
  if (clip) {
    console.log(`   URL (clipboard): ${clip}`);
    url = clip;
  } else if (!url) {
    console.log("   clipboard sem linkedin.com/in/…");
  }

  await sleep(400);
  return url;
}

/** KEYCODE_BACK até Search / lista de resultados. */
export async function leaveProfile(serial, opts = {}) {
  const engine = opts.engine || OCR_ENGINE;
  for (let i = 0; i < 4; i++) {
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(700);
    const search = await findFirstByText(
      serial,
      ["Search", "See all results", "Show all results", "People"],
      { minScore: 0.7, engine },
    );
    if (search) return true;
  }
  return false;
}
