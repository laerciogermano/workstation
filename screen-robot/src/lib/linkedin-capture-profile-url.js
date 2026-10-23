/**
 * Captura URL linkedin.com/in/… a partir do perfil aberto:
 * ⋯ → Share via → Copy → só clipboard (nunca OCR).
 * Usado por login-extract-profiles e login-extract-profile-detail.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { adb, sleep } from "./adb.js";
import { extractBySense, findByText } from "./extract.js";
import { captureFrame } from "./frame.js";
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

const SHARE_VIA_QUERIES = [
  "Share via..",
  "Share via…",
  "Share via",
  "Share Via",
  "Share profile via",
];

const COPY_QUERIES = [
  "Copy",
  "Copy link",
  "Copy to clipboard",
  "Copy Link",
];

/** Abre Share via a partir do menu More (ou reabre se sheet fechou). */
async function openShareViaSheet(serial, engine) {
  if (!(await moreMenuOpen(serial, { engine }))) {
    const opened = await tapProfileMoreButton(serial, { engine });
    if (!opened) return null;
  }

  let shareVia = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    shareVia = await findFirstByText(serial, SHARE_VIA_QUERIES, {
      minScore: 0.58,
      engine,
    });
    if (shareVia) break;
    console.log(`   Share via não visível (${attempt}/4)`);
    await sleep(700);
  }
  if (!shareVia) return null;

  console.log(
    `   → Share via "${shareVia.hit.text}" x=${shareVia.hit.x} y=${shareVia.hit.y}`,
  );
  tapElement({ serial, x: shareVia.hit.x, y: shareVia.hit.y });
  await sleep(1_800);
  return shareVia;
}

/**
 * ⋯ → Share via → Copy → URL só via clipboard (nunca OCR).
 * Se clipboard vazio, clica Copy de novo até obter URL ou esgotar tentativas.
 * Não dá BACK se falhar no menu — evita voltar ao Search.
 * @returns {Promise<string|null>}
 */
export async function captureProfileUrl(serial, outDir, opts = {}) {
  const engine = opts.engine || OCR_ENGINE;
  const maxCopyAttempts = Math.max(
    1,
    Number(opts.copyAttempts || process.env.CAPTURE_URL_COPY_ATTEMPTS || 10) ||
      10,
  );
  console.log("   ⋯ → Share via → Copy (só clipboard)…");

  const shareVia = await openShareViaSheet(serial, engine);
  if (!shareVia) {
    console.log("   Share via / ⋯ falhou — permanece no perfil (sem BACK)");
    try {
      await captureFrame(serial, {
        outPath: join(outDir, "more-menu-fail.png"),
      });
    } catch {
      /* ignore */
    }
    return null;
  }

  const sheetPng = join(outDir, "share-via-sheet.png");
  try {
    const sheetEls = await extractBySense(
      { serial, engine },
      { outPath: sheetPng },
    );
    if (!existsSync(sheetPng)) {
      await captureFrame(serial, { outPath: sheetPng });
    }
    writeFileSync(
      join(outDir, "share-via-sheet.json"),
      JSON.stringify(sheetEls, null, 2),
      "utf8",
    );
  } catch (e) {
    console.log(`   share-via extract: ${e.message || e}`);
  }

  let url = null;
  for (let attempt = 1; attempt <= maxCopyAttempts; attempt++) {
    if (!(await shareSheetOpen(serial, { engine }))) {
      console.log(
        `   sheet fechada (${attempt}/${maxCopyAttempts}) — reabre Share via`,
      );
      const again = await openShareViaSheet(serial, engine);
      if (!again) {
        console.log("   não reabriu Share via");
        break;
      }
    }

    const copyHit = await findFirstByText(serial, COPY_QUERIES, {
      minScore: 0.65,
      engine,
    });
    if (!copyHit) {
      console.log(`   Copy não encontrado (${attempt}/${maxCopyAttempts})`);
      await sleep(700);
      continue;
    }
    console.log(
      `   → Copy "${copyHit.hit.text}" x=${copyHit.hit.x} y=${copyHit.hit.y} (${attempt}/${maxCopyAttempts})`,
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
      break;
    }
    console.log(
      `   clipboard sem linkedin.com/in/… (${attempt}/${maxCopyAttempts}) — Copy de novo`,
    );
  }

  if (!url) {
    console.log(
      `   falhou: clipboard sem URL após ${maxCopyAttempts}× Copy (sem OCR)`,
    );
  }

  // Fecha sheet só se ainda estiver aberta — BACK cego sai do perfil.
  if (await shareSheetOpen(serial, { engine })) {
    console.log("   sheet ainda aberta após Copy — KEYCODE_BACK");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(600);
  }

  await sleep(400);
  return url;
}

/** Textos normalizados do extract/dump. */
function elTexts(els) {
  return (els || [])
    .map((e) => String(e?.text || "").trim())
    .filter(Boolean);
}

/** Share sheet (Copy / apps) ainda visível? */
export async function shareSheetOpen(serial, opts = {}) {
  return Boolean(
    await findFirstByText(
      serial,
      [
        "Copy link",
        "Copy to clipboard",
        "Copy Link",
        "WhatsApp",
        "Messenger",
        "Gmail",
        "Nearby Share",
      ],
      { minScore: 0.62, engine: opts.engine || OCR_ENGINE },
    ),
  );
}

/**
 * Tela de digitar busca / sugestões (não é a lista People).
 * "Search" sozinho NÃO basta — aparece no chrome de quase toda tela.
 */
export function isSearchComposeScreen(els) {
  const texts = elTexts(els);
  const blob = texts.join("\n");
  if (/show all results|see all results/i.test(blob)) return true;
  if (/\brecent\b/i.test(blob) && /clear\s*all/i.test(blob)) return true;
  if (/try searching for|no results found|search results/i.test(blob)) {
    return true;
  }
  return false;
}

/** Contagem de graus 1st/2nd/3rd (linha "Nome • 2nd" ou só "2nd"). */
function countDegreeMarkers(texts) {
  return texts.filter(
    (t) =>
      /^(1st|2nd|3rd\+?)$/i.test(t.replace(/[•·].*$/, "").trim()) ||
      /\b(1st|2nd|3rd\+?)\b/i.test(t),
  ).length;
}

/**
 * Lista People (cards Connect/Pending/Invite + graus) após Show all.
 * Não usar \bskills\b no blob — headline de card tem "Skills" e gerava falso perfil.
 */
export function isPeopleResultsScreen(els) {
  if (isSearchComposeScreen(els)) return false;
  if (isProfileScreen(els)) return false;
  const texts = elTexts(els);
  const pills = countListActionPills(texts);
  const degrees = countDegreeMarkers(texts);
  if (pills >= 2 || degrees >= 2) return true;
  const peopleChip = texts.some(
    (t) => /^people$/i.test(t) || /^filter by people$/i.test(t),
  );
  return peopleChip && (pills >= 1 || degrees >= 1);
}

/**
 * Perfil aberto (seções About/Activity…), não lista.
 * Só labels de seção no início da linha — evita "Skills" no cargo.
 */
export function isProfileScreen(els) {
  if (isSearchComposeScreen(els)) return false;
  const texts = elTexts(els);
  const section = texts.some((t) =>
    /^(about|activity|featured|experience|education|skills)\b/i.test(t),
  );
  if (!section) return false;
  const pills = countListActionPills(texts);
  const degrees = countDegreeMarkers(texts);
  // lista com vários cards não é perfil mesmo se um cargo diga Experience
  if (pills >= 2 || degrees >= 2) return false;
  return true;
}

function countListActionPills(texts) {
  let n = 0;
  for (const raw of texts) {
    const t = String(raw)
      .replace(/^[&+i]+\s*/i, "")
      .trim();
    if (/^(connect|pending)$/i.test(t)) n += 1;
    else if (/^\+?\s*connect$/i.test(t)) n += 1;
    else if (/\binvite\b.+\bconnect\b/i.test(t)) n += 1;
    else if (/^pending\b/i.test(t) || /\bpending,.+withdraw\b/i.test(t)) {
      n += 1;
    }
  }
  return n;
}

async function recoverShowAll(serial, engine) {
  console.log(
    "   leaveProfile: caiu na busca (Show all/Recent) — recupera Show all",
  );
  const show = await findFirstByText(
    serial,
    ["Show all results", "See all results", "Show all", "See all"],
    { minScore: 0.65, engine },
  );
  if (!show) return false;
  console.log(
    `   → Show all "${show.hit.text}" x=${show.hit.x} y=${show.hit.y}`,
  );
  tapElement({ serial, x: show.hit.x, y: show.hit.y });
  await sleep(1_500);
  try {
    return isPeopleResultsScreen(await extractBySense({ serial, engine }));
  } catch {
    return false;
  }
}

/**
 * KEYCODE_BACK até a lista People.
 * 2º BACK só se ainda for perfil — evita BACK a mais → busca do comprador.
 * @returns {Promise<boolean>}
 */
export async function leaveProfile(serial, opts = {}) {
  const engine = opts.engine || OCR_ENGINE;

  const snap = async () => {
    try {
      return await extractBySense({ serial, engine });
    } catch {
      return [];
    }
  };

  // Fecha menu/sheet antes de sair do perfil (não conta como leave)
  if (
    (await moreMenuOpen(serial, { engine })) ||
    (await shareSheetOpen(serial, { engine }))
  ) {
    console.log("   leaveProfile: fecha menu/sheet");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(700);
  }

  let els = await snap();
  if (isPeopleResultsScreen(els)) {
    console.log("   leaveProfile: já na lista People");
    return true;
  }

  console.log("   leaveProfile: KEYCODE_BACK (1/2)");
  key({ serial, code: "KEYCODE_BACK" });
  await sleep(900);
  els = await snap();
  if (isPeopleResultsScreen(els)) {
    console.log("   leaveProfile: lista People ok");
    return true;
  }
  if (isSearchComposeScreen(els)) {
    return recoverShowAll(serial, engine);
  }

  // 2º BACK só se ainda parece perfil (sheet/overlay fechou no 1º)
  if (isProfileScreen(els)) {
    console.log("   leaveProfile: ainda no perfil — KEYCODE_BACK (2/2)");
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(900);
    els = await snap();
    if (isPeopleResultsScreen(els)) {
      console.log("   leaveProfile: lista People ok");
      return true;
    }
    if (isSearchComposeScreen(els)) {
      return recoverShowAll(serial, engine);
    }
  } else {
    // não-perfil / não-compose após 1 BACK → assume lista (sinais fracos)
    console.log("   leaveProfile: após 1 BACK não-perfil — assume lista");
    return true;
  }
  return false;
}
