/**
 * Configuração / onboarding LinkedIn pós-criação de conta.
 *
 * Tela "What’s your most recent experience?":
 * 1. Job title* → input abaixo → digita --job-title → Done
 * 2. Company / Employer* → input abaixo → digita company → 1º da lista → Done
 * 3. Continue
 *
 * Avatar:
 * - Onboarding: tela Add photo → Upload from photos → Downloads → SELECT → Done → Continue
 * - Pós-signup: /me → Add photo → Add profile photo → Upload from Photos → Downloads → crop
 * DocumentsUI (API 30+): seleção do arquivo via a11y (`uiautomator2` se instalado);
 * fallback long-press+SELECT / tap. Pré-req opcional: `pip3 install uiautomator2`.
 *
 * Asset default: assets/avatars/conectmax-black.jpg (logo sem "Belo Horizonte").
 * Rollback: omitir --avatar.
 *
 * Banner (capa): deep link https://www.linkedin.com/in/me/ → Add/Edit background
 * → Upload single photo → Downloads → SELECT → Done → Save.
 * Asset: assets/banners/conectmax-banner.jpg. Rollback: omitir --banner.
 *
 * About: /me → Add section → About (ou Add a summary) → paste → Save.
 * Texto default em DEFAULT_ABOUT / assets/profile-defaults.json.
 *
 * Privacy (e-mail): Menu → Settings & Privacy → Visibility → Email visibility
 * → **Only visible to me** + desliga export de e-mail. WebView: poll até opções
 * no dump (`LINKEDIN_SETUP_PRIVACY_TIMEOUT_MS`, default 45s).
 * Rollback: omitir `--privacy` / `--defaults` sem privacy / `--privacy-only`.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { openProfileByUrl } from "./linkedin-connect.js";
import { pasteCleanMessage } from "./linkedin-message.js";
import { launch, screenshot, tapElement, typeViaAdb } from "./operate.js";

/** Relativo a screen-robot/src — logo ConectMax preta (sem BH). */
export const DEFAULT_AVATAR_REL = "assets/avatars/conectmax-black.jpg";
/** Relativo a screen-robot/src — capa ConectMax (economiza+). */
export const DEFAULT_BANNER_REL = "assets/banners/conectmax-banner.jpg";
export const DEFAULT_ME_URL = "https://www.linkedin.com/in/me/";
export const DEFAULT_ABOUT =
  "A ConectMax chegou para facilitar o processo de compras da sua empresa, temos uma imensa variedade de produtos desde materiais básicos para o dia a dia até os itens mais atuais da tecnologia!";
export const DEFAULT_JOB_TITLE =
  "Especialista em suprimentos e itens corporativos";

const __libDir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__libDir, "..");
/** Absoluto do avatar padrão (assets/avatars/conectmax-black.jpg). */
export const DEFAULT_AVATAR_PATH = resolve(SRC_ROOT, DEFAULT_AVATAR_REL);
/** Absoluto do banner padrão. */
export const DEFAULT_BANNER_PATH = resolve(SRC_ROOT, DEFAULT_BANNER_REL);
export const PROFILE_DEFAULTS_PATH = resolve(
  SRC_ROOT,
  "assets/profile-defaults.json",
);

/** @returns {{ company: string, jobTitle: string, avatar: string, banner: string, about: string, profileUrl: string }} */
export function loadProfileDefaults() {
  const base = {
    company: "ConectMax",
    jobTitle: DEFAULT_JOB_TITLE,
    avatar: DEFAULT_AVATAR_PATH,
    banner: DEFAULT_BANNER_PATH,
    about: DEFAULT_ABOUT,
    profileUrl: DEFAULT_ME_URL,
  };
  try {
    if (!existsSync(PROFILE_DEFAULTS_PATH)) return base;
    const j = JSON.parse(readFileSync(PROFILE_DEFAULTS_PATH, "utf8"));
    return {
      company: String(j.company || base.company).trim() || base.company,
      jobTitle: String(j.jobTitle || base.jobTitle).trim() || base.jobTitle,
      avatar: resolve(SRC_ROOT, String(j.avatar || DEFAULT_AVATAR_REL)),
      banner: resolve(SRC_ROOT, String(j.banner || DEFAULT_BANNER_REL)),
      about: String(j.about || base.about).trim() || base.about,
      profileUrl: String(j.profileUrl || base.profileUrl).trim() || base.profileUrl,
    };
  } catch {
    return base;
  }
}

const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const LATIN_IME =
  "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME";
const WAIT_MS = Number(process.env.LINKEDIN_SETUP_WAIT_MS || 4_000);
const STEP_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SETUP_TIMEOUT_MS || 30_000,
);
const AVATAR_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SETUP_AVATAR_TIMEOUT_MS || 60_000,
);
const PRIVACY_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SETUP_PRIVACY_TIMEOUT_MS || 45_000,
);

async function shot(serial, outDir, name) {
  if (!outDir) return;
  try {
    screenshot({ serial, path: join(outDir, name) });
  } catch (e) {
    console.error(`aviso: screenshot ${name}: ${e.message || e}`);
  }
}

/** @param {string} xml @param {string} text */
function findNodeByText(xml, text) {
  const needle = `text="${text}"`;
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!n.includes(needle)) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text,
    };
  }
  return null;
}

/** Case-insensitive text match. */
function findNodeByTextI(xml, text) {
  const re =
    text instanceof RegExp
      ? text
      : new RegExp(
          `^${String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        );
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const m = n.match(/\btext="([^"]*)"/);
    if (!m) continue;
    const label = m[1].replace(/&amp;/g, "&");
    if (!re.test(label) && !re.test(m[1])) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text: m[1],
    };
  }
  return null;
}

function findNodeByContentDesc(xml, desc) {
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const m = n.match(/\bcontent-desc="([^"]*)"/);
    if (!m) continue;
    if (desc instanceof RegExp) {
      if (!desc.test(m[1])) continue;
    } else if (m[1] !== desc) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      y1: Number(b[2]),
      y2: Number(b[4]),
      desc: m[1],
    };
  }
  return null;
}

function findFirstEditText(xml) {
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!n.includes("android.widget.EditText")) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      y2: Number(b[4]),
    };
  }
  return null;
}

/**
 * 1º item da lista abaixo do EditText (Compose: texto pode não ser clickable).
 * @param {string} xml
 * @param {number} belowY
 */
function findFirstSuggestionBelow(xml, belowY) {
  /** @type {{ x: number, y: number, text: string, y1: number }[]} */
  const hits = [];
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const text = (n.match(/\btext="([^"]*)"/) || [])[1] || "";
    const desc = (n.match(/\bcontent-desc="([^"]*)"/) || [])[1] || "";
    const label = (text || desc).trim();
    if (!label || label.length < 2) continue;
    if (
      /^(done|back|job title|company\s*\/\s*employer|create company|add a new)/i.test(
        label,
      )
    ) {
      continue;
    }
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const y1 = Number(b[2]);
    const y2 = Number(b[4]);
    if (y1 < belowY + 16) continue;
    // ignora linhas minúsculas (ícones) e o próprio campo
    if (y2 - y1 < 24) continue;
    hits.push({
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((y1 + y2) / 2),
      y1,
      text: label,
    });
  }
  hits.sort((a, b) => a.y1 - b.y1 || b.text.length - a.text.length);
  return hits[0] || null;
}

async function dismissSoftKeyboard(serial) {
  try {
    adb(serial, ["shell", "ime", "enable", ADB_IME]);
    adb(serial, ["shell", "ime", "set", ADB_IME]);
    await sleep(350);
  } catch {
    /* ignore */
  }
}

/** @param {string} xml @param {RegExp|string} needle */
function findNodeByContentDescContains(xml, needle) {
  const re =
    needle instanceof RegExp
      ? needle
      : new RegExp(String(needle).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const m = n.match(/\bcontent-desc="([^"]*)"/);
    if (!m || !re.test(m[1])) continue;
    if (/^Preview the file/i.test(m[1])) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const x1 = Number(b[1]);
    const y1 = Number(b[2]);
    const x2 = Number(b[3]);
    const y2 = Number(b[4]);
    if (x2 <= x1 || y2 <= y1) continue;
    return {
      x: Math.floor((x1 + x2) / 2),
      y: Math.floor((y1 + y2) / 2),
      /** canto inferior-esquerdo — evita ícone Preview */
      longX: x1 + 20,
      longY: Math.max(y1 + 20, y2 - 20),
      desc: m[1],
    };
  }
  return null;
}

/**
 * Long-press via swipe parado (DocumentsUI: item_root não é clickable).
 * @param {string} serial
 * @param {number} x
 * @param {number} y
 * @param {number} [ms]
 */
function longPress(serial, x, y, ms = 1000) {
  adb(serial, [
    "shell",
    "input",
    "swipe",
    String(x),
    String(y),
    String(x),
    String(y),
    String(ms),
  ]);
}

/**
 * Click a11y em texto (DocumentsUI): usa uiautomator2 se instalado.
 * @param {string} serial
 * @param {string} text
 * @returns {boolean}
 */
function a11yClickText(serial, text) {
  const py = `
import sys
try:
  import uiautomator2 as u2
except ImportError:
  sys.exit(2)
d = u2.connect(${JSON.stringify(serial)})
ok = d(text=${JSON.stringify(text)}).click_exists(timeout=5)
sys.exit(0 if ok else 1)
`;
  try {
    const r = spawnSync("python3", ["-c", py], {
      encoding: "utf8",
      timeout: 30_000,
    });
    return r.status === 0;
  } catch {
    return false;
  }
}

/**
 * Push arquivo para /sdcard/Download e dispara media scan.
 * @param {string} serial
 * @param {string} localPath
 * @returns {string} fileName
 */
function pushToDownloads(serial, localPath) {
  const fileName = basename(localPath);
  const remote = `/sdcard/Download/${fileName}`;
  adb(serial, ["shell", "mkdir", "-p", "/sdcard/Download"]);
  adb(serial, ["push", localPath, remote]);
  adbOk(serial, [
    "shell",
    "am",
    "broadcast",
    "-a",
    "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
    "-d",
    `file://${remote}`,
  ]);
  return fileName;
}

/**
 * No DocumentsUI: Show roots → Downloads → long-press arquivo → SELECT.
 * @param {string} serial
 * @param {string} fileName
 * @param {string[]} steps
 * @param {string|null|undefined} outDir
 * @param {string} shotPrefix
 */
async function selectFromDownloadsPicker(serial, fileName, steps, outDir, shotPrefix) {
  await sleep(1_500);
  await shot(serial, outDir, `${shotPrefix}-picker.png`);

  const roots =
    findNodeByContentDesc(dumpUiXml(serial), /^Show roots$/i) ||
    findNodeByText(dumpUiXml(serial), "Show roots");
  if (roots) {
    tapElement({ serial, x: roots.x, y: roots.y });
    await sleep(900);
  }
  // Já em Downloads? senão abre
  let xml = dumpUiXml(serial);
  if (!/IMAGES IN DOWNLOADS|content-desc="[^"]*Download/i.test(xml)) {
    const downloads =
      findNodeByText(xml, "Downloads") ||
      findNodeByContentDesc(xml, /^Downloads$/i);
    if (!downloads) throw new Error("selectFromDownloadsPicker: Downloads");
    tapElement({ serial, x: downloads.x, y: downloads.y });
    steps.push("open-downloads");
    await sleep(1_500);
  }
  await shot(serial, outDir, `${shotPrefix}-downloads.png`);

  let file = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 20_000) {
    file = findNodeByContentDescContains(dumpUiXml(serial), fileName);
    if (file) break;
    await sleep(800);
  }
  if (!file) {
    throw new Error(
      `selectFromDownloadsPicker: ${fileName} não apareceu em Downloads`,
    );
  }

  // DocumentsUI (API 30+): item frequentemente NÃO é clickable no dump —
  // `input tap`/long-press falham; ACTION_CLICK via uiautomator2 funciona.
  // Ordem: a11y-click → long-press+SELECT → tap coords.
  let picked = false;
  if (a11yClickText(serial, fileName)) {
    steps.push(`a11y-click:${fileName}`);
    picked = true;
  } else {
    longPress(serial, file.longX, file.longY, 1100);
    steps.push(`long-press:${fileName}`);
    await sleep(900);
    let select =
      findNodeByText(dumpUiXml(serial), "SELECT") ||
      findNodeByText(dumpUiXml(serial), "Select");
    const tSel = Date.now();
    while (!select && Date.now() - tSel < 8_000) {
      await sleep(500);
      select =
        findNodeByText(dumpUiXml(serial), "SELECT") ||
        findNodeByText(dumpUiXml(serial), "Select");
    }
    if (select) {
      tapElement({ serial, x: select.x, y: select.y });
      steps.push("tap-select");
      picked = true;
    } else {
      tapElement({ serial, x: file.x, y: file.y });
      steps.push(`tap-file:${fileName}`);
      picked = true;
    }
  }
  if (!picked) throw new Error("selectFromDownloadsPicker: SELECT");
  await sleep(2_500);
  await shot(serial, outDir, `${shotPrefix}-crop.png`);
}

/**
 * Push avatar → (opcional /me → Add photo) → Upload from photos → SELECT → Done.
 * @param {{
 *   serial: string,
 *   avatarPath?: string|null,
 *   profileUrl?: string,
 *   linkedinPackage?: string,
 *   viaProfile?: boolean,
 *   outDir?: string|null,
 *   timeoutMs?: number,
 * }} opts
 */
export async function linkedinSetupAvatar(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupAvatar: falta serial");
  const avatarPath = resolve(
    String(opts.avatarPath || DEFAULT_AVATAR_PATH).trim(),
  );
  if (!existsSync(avatarPath)) {
    throw new Error(`linkedinSetupAvatar: arquivo não encontrado: ${avatarPath}`);
  }
  const waitPhotoMs = Number(opts.timeoutMs || AVATAR_TIMEOUT_MS);
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const profileUrl = String(opts.profileUrl || DEFAULT_ME_URL).trim();
  const viaProfile = opts.viaProfile !== false;
  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  const fileName = pushToDownloads(serial, avatarPath);
  steps.push(`push-avatar:${fileName}`);
  await sleep(800);

  let xml0 = dumpUiXml(serial);
  const alreadyOnPhoto =
    /Upload from photos|Adding a photo|Take a photo/i.test(xml0) ||
    (findNodeByContentDesc(xml0, /^Profile picture$/i) &&
      /Add photo|Adding a photo/i.test(xml0));

  if (!alreadyOnPhoto && viaProfile) {
    await launch({ serial, package: pkg });
    await sleep(800);
    openProfileByUrl(serial, pkg, profileUrl);
    await sleep(WAIT_MS + 3_000);
    steps.push(`deeplink:${profileUrl}`);
    await shot(serial, opts.outDir, "avatar-00-me.png");

    await waitForText(serial, ["Add photo", "Edit photo", "Profile picture"], {
      timeoutMs: STEP_TIMEOUT_MS,
      intervalMs: 1_200,
      sense: "dump",
    });
    const addPhoto =
      findNodeByContentDesc(dumpUiXml(serial), /^Add photo$/i) ||
      findNodeByContentDesc(dumpUiXml(serial), /^Edit photo$/i) ||
      findNodeByText(dumpUiXml(serial), "Add photo");
    if (!addPhoto) throw new Error("linkedinSetupAvatar: Add photo no /me");
    tapElement({ serial, x: addPhoto.x, y: addPhoto.y });
    steps.push("tap-add-photo-me");
    await sleep(1_800);

    // Sheet intermediário: Add profile photo | Add frame
    let sheet = dumpUiXml(serial);
    const addProfilePhoto =
      findNodeByTextI(sheet, /^Add profile photo$/i) ||
      findNodeByContentDesc(sheet, /^Add profile photo$/i);
    if (addProfilePhoto) {
      tapElement({ serial, x: addProfilePhoto.x, y: addProfilePhoto.y });
      steps.push("tap-add-profile-photo");
      await sleep(1_500);
    }
  }

  await waitForText(
    serial,
    [
      "Adding a photo",
      "Add photo",
      "Upload from photos",
      "Upload from Photos",
      "Profile picture",
      "Take a photo",
      "Choose a photo",
      "Add profile photo",
    ],
    { timeoutMs: waitPhotoMs, intervalMs: 1_200, sense: "dump" },
  );
  await shot(serial, opts.outDir, "avatar-00-tela.png");

  let xml = dumpUiXml(serial);
  // Se ainda no sheet Add profile photo | Add frame
  const addProfilePhoto2 =
    findNodeByTextI(xml, /^Add profile photo$/i) ||
    findNodeByContentDesc(xml, /^Add profile photo$/i);
  if (
    addProfilePhoto2 &&
    !findNodeByTextI(xml, /upload from photos/i) &&
    !findNodeByTextI(xml, /take a photo/i)
  ) {
    tapElement({ serial, x: addProfilePhoto2.x, y: addProfilePhoto2.y });
    steps.push("tap-add-profile-photo");
    await sleep(1_500);
    xml = dumpUiXml(serial);
  }

  if (
    !findNodeByTextI(xml, /upload from photos/i) &&
    !findNodeByTextI(xml, /^Choose a photo$/i)
  ) {
    const card = findNodeByContentDesc(xml, /^Profile picture$/i);
    if (card) {
      tapElement({ serial, x: card.x, y: card.y });
    } else {
      // card clicável típico ~[68,383][472,703] em 540×888
      tapElement({ serial, x: 270, y: 543 });
    }
    await sleep(1_200);
    steps.push("tap-photo-card");
  }

  const upload =
    findNodeByTextI(dumpUiXml(serial), /upload from photos/i) ||
    findNodeByContentDesc(dumpUiXml(serial), /Upload from photos/i) ||
    findNodeByTextI(dumpUiXml(serial), /^Choose a photo$/i) ||
    findNodeByContentDesc(dumpUiXml(serial), /Choose a photo/i);
  if (!upload) throw new Error("linkedinSetupAvatar: Upload from photos");
  tapElement({ serial, x: upload.x, y: upload.y });
  steps.push("tap-upload-from-photos");
  await selectFromDownloadsPicker(
    serial,
    fileName,
    steps,
    opts.outDir,
    "avatar",
  );

  const done =
    findNodeByText(dumpUiXml(serial), "Done") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Done$/i) ||
    findNodeByText(dumpUiXml(serial), "Save") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Save$/i);
  if (!done) throw new Error("linkedinSetupAvatar: Done no crop");
  tapElement({ serial, x: done.x, y: done.y });
  steps.push("tap-done-crop");
  await sleep(WAIT_MS + 2_000);
  await shot(serial, opts.outDir, "avatar-04-apos-done.png");

  // espera Saving / Uploading sumir; Continue (onboarding) ou volta ao /me
  const tUp = Date.now();
  while (Date.now() - tUp < 45_000) {
    const x = dumpUiXml(serial);
    if (/Uploading Media|\bSaving\b/i.test(x)) {
      await sleep(1_000);
      continue;
    }
    if (
      /Adding a photo|Profile picture/i.test(x) &&
      findNodeByText(x, "Continue")
    ) {
      break;
    }
    if (
      findNodeByContentDesc(x, /^Add photo$/i) ||
      findNodeByContentDesc(x, /^Edit photo$/i) ||
      findNodeByContentDesc(x, /^Cover photo$/i)
    ) {
      break;
    }
    await sleep(1_000);
  }

  const cont =
    findNodeByText(dumpUiXml(serial), "Continue") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Continue$/i);
  if (cont) {
    tapElement({ serial, x: cont.x, y: cont.y });
    steps.push("tap-continue-photo");
    await sleep(WAIT_MS + 1_000);
    await shot(serial, opts.outDir, "avatar-99-apos-continue.png");
  }

  return { steps, serial, avatarPath, profileUrl, outDir: opts.outDir || null };
}

/**
 * Capa/banner no perfil: deep link /me → Add/Edit background → upload.
 * @param {{
 *   serial: string,
 *   bannerPath?: string|null,
 *   profileUrl?: string,
 *   linkedinPackage?: string,
 *   outDir?: string|null,
 * }} opts
 */
export async function linkedinSetupBanner(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupBanner: falta serial");
  const bannerPath = resolve(
    String(opts.bannerPath || DEFAULT_BANNER_PATH).trim(),
  );
  if (!existsSync(bannerPath)) {
    throw new Error(`linkedinSetupBanner: arquivo não encontrado: ${bannerPath}`);
  }
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const profileUrl = String(opts.profileUrl || DEFAULT_ME_URL).trim();
  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  const fileName = pushToDownloads(serial, bannerPath);
  steps.push(`push-banner:${fileName}`);

  await launch({ serial, package: pkg });
  await sleep(800);
  openProfileByUrl(serial, pkg, profileUrl);
  await sleep(WAIT_MS + 3_000);
  steps.push(`deeplink:${profileUrl}`);
  await shot(serial, opts.outDir, "banner-00-me.png");

  await waitForText(
    serial,
    ["Cover photo", "Add background image", "Edit background image"],
    { timeoutMs: STEP_TIMEOUT_MS, intervalMs: 1_200, sense: "dump" },
  );

  const editBg =
    findNodeByContentDesc(dumpUiXml(serial), /^Add background image$/i) ||
    findNodeByContentDesc(dumpUiXml(serial), /^Edit background image$/i);
  if (editBg) {
    tapElement({ serial, x: editBg.x, y: editBg.y });
  } else {
    const cover = findNodeByContentDesc(dumpUiXml(serial), /^Cover photo$/i);
    if (!cover) throw new Error("linkedinSetupBanner: Cover photo / Add background");
    tapElement({ serial, x: cover.x, y: cover.y });
  }
  steps.push("tap-background");
  await sleep(1_500);
  await shot(serial, opts.outDir, "banner-01-sheet.png");

  // Sheet "Cover Image" → Add cover image (primeira vez / troca)
  let xml = dumpUiXml(serial);
  const addCover =
    findNodeByContentDesc(xml, /^Add cover image$/i) ||
    findNodeByText(xml, "Add cover image");
  if (addCover) {
    tapElement({ serial, x: addCover.x, y: addCover.y });
    steps.push("tap-add-cover-image");
    await sleep(1_800);
    await shot(serial, opts.outDir, "banner-02-editor.png");
  }

  xml = dumpUiXml(serial);
  const uploadSingle =
    findNodeByText(xml, "Upload single photo") ||
    findNodeByContentDesc(xml, /Upload single photo/i);
  if (!uploadSingle) {
    // fallback: Choose an image
    const choose =
      findNodeByText(xml, "Choose an image") ||
      findNodeByContentDesc(xml, /^Choose an image$/i);
    if (!choose) throw new Error("linkedinSetupBanner: Upload single photo");
    tapElement({ serial, x: choose.x, y: choose.y });
    steps.push("tap-choose-image");
  } else {
    tapElement({ serial, x: uploadSingle.x, y: uploadSingle.y });
    steps.push("tap-upload-single-photo");
  }

  await selectFromDownloadsPicker(
    serial,
    fileName,
    steps,
    opts.outDir,
    "banner",
  );

  const done =
    findNodeByText(dumpUiXml(serial), "Done") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Done$/i);
  if (!done) throw new Error("linkedinSetupBanner: Done no crop");
  tapElement({ serial, x: done.x, y: done.y });
  steps.push("tap-done-crop");
  await sleep(WAIT_MS + 2_000);
  await shot(serial, opts.outDir, "banner-03-apos-done.png");

  // Saving / Uploading → Save opcional → perfil com Edit background
  const tUp = Date.now();
  while (Date.now() - tUp < 60_000) {
    const x = dumpUiXml(serial);
    if (/Uploading Media|\bSaving\b/i.test(x)) {
      await sleep(1_000);
      continue;
    }
    const save = findNodeByText(x, "Save");
    if (save && /Add a cover image|Upload single photo/i.test(x)) {
      tapElement({ serial, x: save.x, y: save.y });
      steps.push("tap-save");
      await sleep(3_000);
      continue;
    }
    if (
      findNodeByContentDesc(x, /^Edit background image$/i) ||
      findNodeByContentDesc(x, /^Cover photo$/i)
    ) {
      break;
    }
    await sleep(1_000);
  }
  await shot(serial, opts.outDir, "banner-99-perfil.png");
  steps.push("banner-done");

  return { steps, serial, bannerPath, profileUrl, outDir: opts.outDir || null };
}

/**
 * About/summary no perfil: /me → Add section → About (ou Add a summary) → paste → Save.
 * @param {{
 *   serial: string,
 *   about?: string,
 *   profileUrl?: string,
 *   linkedinPackage?: string,
 *   outDir?: string|null,
 * }} opts
 */
export async function linkedinSetupAbout(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupAbout: falta serial");
  const about = String(opts.about || DEFAULT_ABOUT).trim();
  if (!about) throw new Error("linkedinSetupAbout: falta about");
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const profileUrl = String(opts.profileUrl || DEFAULT_ME_URL).trim();
  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await launch({ serial, package: pkg });
  await sleep(800);
  openProfileByUrl(serial, pkg, profileUrl);
  await sleep(WAIT_MS + 3_000);
  steps.push(`deeplink:${profileUrl}`);
  await shot(serial, opts.outDir, "about-00-me.png");

  await waitForText(
    serial,
    ["Add section", "Add a summary", "About", "Edit intro"],
    { timeoutMs: STEP_TIMEOUT_MS, intervalMs: 1_200, sense: "dump" },
  );

  let xml = dumpUiXml(serial);
  // Preferência: Add a summary (atalho) → senão Add section → About
  const addSummary =
    findNodeByText(xml, "Add a summary") ||
    findNodeByContentDesc(xml, /Add a summary/i);
  if (addSummary) {
    // botão + à direita costuma ser o clickable (x alto)
    tapElement({
      serial,
      x: Math.min(520, addSummary.x + 80),
      y: addSummary.y,
    });
    steps.push("tap-add-summary");
    await sleep(1_800);
  } else {
    const addSection = findNodeByText(xml, "Add section");
    if (!addSection) throw new Error("linkedinSetupAbout: Add section / summary");
    tapElement({ serial, x: addSection.x, y: addSection.y });
    steps.push("tap-add-section");
    await sleep(1_500);
    xml = dumpUiXml(serial);
    // scroll sheet se preciso
    let aboutItem = findNodeByText(xml, "About");
    if (!aboutItem) {
      adb(serial, ["shell", "input", "swipe", "270", "500", "270", "750", "300"]);
      await sleep(700);
      aboutItem = findNodeByText(dumpUiXml(serial), "About");
    }
    if (!aboutItem) throw new Error("linkedinSetupAbout: About no menu");
    tapElement({ serial, x: aboutItem.x, y: aboutItem.y });
    steps.push("tap-about-menu");
    await sleep(1_800);
  }
  await shot(serial, opts.outDir, "about-01-editor.png");

  await waitForText(serial, ["Edit about", "Save"], {
    timeoutMs: STEP_TIMEOUT_MS,
    intervalMs: 1_000,
    sense: "dump",
  });

  xml = dumpUiXml(serial);
  const edit = findFirstEditText(xml);
  if (!edit) throw new Error("linkedinSetupAbout: EditText");
  tapElement({ serial, x: edit.x, y: edit.y });
  await sleep(400);
  // campo vazio na 1ª vez — skipClear evita loop DEL lento
  await pasteCleanMessage(serial, about, {
    skipClear: true,
    restoreIme: false,
  });
  steps.push(`about-pasted:${about.length}`);
  await sleep(800);
  await shot(serial, opts.outDir, "about-02-typed.png");

  // dismiss teclado: tap no título
  const title =
    findNodeByText(dumpUiXml(serial), "Edit about") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Edit about$/i);
  if (title) {
    tapElement({ serial, x: title.x, y: title.y });
    await sleep(500);
  }

  const save =
    findNodeByText(dumpUiXml(serial), "Save") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Save$/i);
  if (!save) throw new Error("linkedinSetupAbout: Save");
  tapElement({ serial, x: 270, y: save.y });
  steps.push("tap-save-about");
  await sleep(WAIT_MS + 2_000);
  // Premium upsell eventual
  if (/Try Premium|Refine your profile/i.test(dumpUiXml(serial))) {
    adbOk(serial, ["shell", "input", "keyevent", "4"]);
    await sleep(800);
  }
  await shot(serial, opts.outDir, "about-99-apos-save.png");
  steps.push("about-done");

  return { steps, serial, about, profileUrl, outDir: opts.outDir || null };
}

/**
 * Radio/Check no dump com `checked="…"`.
 * @param {string} xml
 * @param {RegExp|string} textRe
 */
function findCheckableByText(xml, textRe) {
  const re =
    textRe instanceof RegExp
      ? textRe
      : new RegExp(
          `^${String(textRe).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        );
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const m = n.match(/\btext="([^"]*)"/);
    if (!m || !re.test(m[1].replace(/&amp;/g, "&"))) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const checked = /\bchecked="true"/.test(n);
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text: m[1],
      checked,
      clickable: /\bclickable="true"/.test(n),
    };
  }
  return null;
}

/**
 * Esconde e-mail do perfil: Settings → Visibility → Email visibility
 * → Only visible to me (+ export off).
 * @param {{
 *   serial: string,
 *   linkedinPackage?: string,
 *   outDir?: string|null,
 *   timeoutMs?: number,
 * }} opts
 */
export async function linkedinSetupPrivacyEmail(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupPrivacyEmail: falta serial");
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const waitMs = Number(opts.timeoutMs || PRIVACY_TIMEOUT_MS);
  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await launch({ serial, package: pkg });
  await sleep(1_200);
  steps.push("launch");

  // Feed / home: Menu → Settings & Privacy
  let menu =
    findNodeByContentDesc(
      dumpUiXml(serial),
      /Menu button: Access my profile/i,
    ) ||
    findNodeByContentDesc(dumpUiXml(serial), /^My Profile and Communities$/i);
  if (!menu) {
    // tenta HOME se estiver em outra tela
    adbOk(serial, ["shell", "input", "keyevent", "3"]);
    await sleep(400);
    await launch({ serial, package: pkg });
    await sleep(1_500);
    menu =
      findNodeByContentDesc(
        dumpUiXml(serial),
        /Menu button: Access my profile/i,
      ) ||
      findNodeByContentDesc(
        dumpUiXml(serial),
        /^My Profile and Communities$/i,
      );
  }
  if (!menu) throw new Error("linkedinSetupPrivacyEmail: Menu (profile)");
  tapElement({ serial, x: menu.x, y: menu.y });
  steps.push("tap-menu");
  await sleep(1_800);
  await shot(serial, opts.outDir, "privacy-00-menu.png");

  await waitForText(serial, ["Settings & Privacy", "Settings &amp; Privacy"], {
    timeoutMs: STEP_TIMEOUT_MS,
    intervalMs: 800,
    sense: "dump",
  });
  const settings =
    findNodeByTextI(dumpUiXml(serial), /Settings\s*&\s*Privacy/i) ||
    findNodeByContentDesc(dumpUiXml(serial), /Settings.*Privacy/i);
  if (!settings) throw new Error("linkedinSetupPrivacyEmail: Settings & Privacy");
  tapElement({ serial, x: settings.x, y: settings.y });
  steps.push("tap-settings-privacy");
  await sleep(2_000);
  await shot(serial, opts.outDir, "privacy-01-settings.png");

  await waitForText(serial, ["Visibility", "Account preferences"], {
    timeoutMs: STEP_TIMEOUT_MS,
    intervalMs: 800,
    sense: "dump",
  });
  const visibility = findNodeByText(dumpUiXml(serial), "Visibility");
  if (!visibility) throw new Error("linkedinSetupPrivacyEmail: Visibility");
  tapElement({ serial, x: visibility.x, y: visibility.y });
  steps.push("tap-visibility");
  await sleep(2_000);
  await shot(serial, opts.outDir, "privacy-02-visibility.png");

  await waitForText(serial, ["Email visibility"], {
    timeoutMs: STEP_TIMEOUT_MS,
    intervalMs: 800,
    sense: "dump",
  });
  const emailVis = findNodeByText(dumpUiXml(serial), "Email visibility");
  if (!emailVis) throw new Error("linkedinSetupPrivacyEmail: Email visibility");
  tapElement({ serial, x: emailVis.x, y: emailVis.y });
  steps.push("tap-email-visibility");
  await sleep(1_500);
  await shot(serial, opts.outDir, "privacy-03-email-loading.png");

  // WebView demora: poll até "Only visible to me"
  const t0 = Date.now();
  let onlyMe = null;
  while (Date.now() - t0 < waitMs) {
    const xml = dumpUiXml(serial);
    onlyMe = findCheckableByText(xml, /^Only visible to me$/i);
    if (onlyMe) break;
    await sleep(1_200);
  }
  if (!onlyMe) {
    await shot(serial, opts.outDir, "privacy-03-email-timeout.png");
    throw new Error(
      `linkedinSetupPrivacyEmail: WebView Email visibility não carregou em ${waitMs}ms`,
    );
  }
  await shot(serial, opts.outDir, "privacy-03-email-options.png");
  steps.push("email-visibility-loaded");

  if (!onlyMe.checked) {
    tapElement({ serial, x: onlyMe.x, y: onlyMe.y });
    steps.push("tap-only-visible-to-me");
    await sleep(1_200);
  } else {
    steps.push("only-visible-already");
  }

  // desliga export se estiver on
  let exportCb = findCheckableByText(
    dumpUiXml(serial),
    /Allow connection to export emails/i,
  );
  if (exportCb?.checked) {
    tapElement({ serial, x: exportCb.x, y: exportCb.y });
    steps.push("tap-export-off");
    await sleep(800);
  } else if (exportCb) {
    steps.push("export-already-off");
  }

  // assert
  const xmlFinal = dumpUiXml(serial);
  onlyMe = findCheckableByText(xmlFinal, /^Only visible to me$/i);
  exportCb = findCheckableByText(
    xmlFinal,
    /Allow connection to export emails/i,
  );
  if (!onlyMe?.checked) {
    await shot(serial, opts.outDir, "privacy-99-assert-fail.png");
    throw new Error(
      "linkedinSetupPrivacyEmail: Only visible to me não ficou checked",
    );
  }
  if (exportCb?.checked) {
    await shot(serial, opts.outDir, "privacy-99-export-still-on.png");
    throw new Error(
      "linkedinSetupPrivacyEmail: export de e-mail ainda checked",
    );
  }
  await shot(serial, opts.outDir, "privacy-99-done.png");
  steps.push("privacy-email-done");

  return {
    steps,
    serial,
    emailVisibility: "only-me",
    exportEmails: false,
    outDir: opts.outDir || null,
  };
}

/**
 * Abre sheet pelo input (content-desc), digita valor, opcionalmente 1º da lista, Done.
 * @param {{
 *   serial: string,
 *   openDescRe: RegExp,
 *   value: string,
 *   pickFirst: boolean,
 *   tag: string,
 *   steps: string[],
 *   outDir?: string|null,
 * }} opts
 */
async function fillOpenScreenField(opts) {
  const { serial, openDescRe, value, pickFirst, tag, steps, outDir } = opts;
  const want = String(value || "").trim();
  if (!want) throw new Error(`linkedin-setup: falta valor para ${tag}`);

  const input = findNodeByContentDesc(dumpUiXml(serial), openDescRe);
  if (!input) {
    throw new Error(
      `linkedin-setup: input abaixo de ${tag} não encontrado (${openDescRe})`,
    );
  }
  tapElement({ serial, x: input.x, y: input.y });
  steps.push(`tap-${tag}-input`);
  await sleep(2_000);
  await shot(serial, outDir, `${tag}-01-apos-tap.png`);

  let edit = null;
  const t0 = Date.now();
  while (Date.now() - t0 < STEP_TIMEOUT_MS) {
    edit = findFirstEditText(dumpUiXml(serial));
    if (edit) break;
    await sleep(800);
  }
  if (!edit) throw new Error(`linkedin-setup: sheet ${tag} sem EditText`);

  tapElement({ serial, x: edit.x, y: edit.y });
  await sleep(500);
  adbOk(serial, ["shell", "ime", "set", LATIN_IME]);
  await sleep(400);
  adb(serial, [
    "shell",
    "sh",
    "-c",
    "input keyevent KEYCODE_MOVE_END; i=0; while [ $i -lt 96 ]; do input keyevent KEYCODE_DEL; i=$((i+1)); done",
  ]);
  typeViaAdb(serial, want);
  await sleep(2_000);
  await shot(serial, outDir, `${tag}-02-apos-typed.png`);
  steps.push(`typed-${tag}:${want}`);

  if (pickFirst) {
    let sug = null;
    const tSug = Date.now();
    while (Date.now() - tSug < 12_000) {
      sug = findFirstSuggestionBelow(dumpUiXml(serial), edit.y2);
      if (sug) break;
      await sleep(800);
    }
    if (!sug) {
      throw new Error(
        `linkedin-setup: lista de ${tag} vazia após digitar "${want}"`,
      );
    }
    tapElement({ serial, x: sug.x, y: sug.y });
    steps.push(`pick-first-${tag}:${sug.text}`);
    await sleep(1_200);
    await shot(serial, outDir, `${tag}-03-apos-pick.png`);
  }

  const done =
    findNodeByText(dumpUiXml(serial), "Done") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Done$/i);
  if (done) {
    tapElement({ serial, x: done.x, y: done.y });
    steps.push(`tap-done-${tag}`);
    await sleep(WAIT_MS);
    await shot(serial, outDir, `${tag}-04-apos-done.png`);
  }
}

/**
 * @param {{
 *   serial: string,
 *   jobTitle: string,
 *   company?: string,
 *   outDir?: string|null,
 * }} opts
 */
export async function linkedinSetupJobTitle(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupJobTitle: falta serial");
  const jobTitle = String(opts.jobTitle || "").trim();
  if (!jobTitle) throw new Error("linkedinSetupJobTitle: falta jobTitle");
  const company = String(opts.company || "ConectMax").trim();

  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await waitForText(
    serial,
    [
      "most recent experience",
      "Job title*",
      "Job title",
      "Company / Employer",
      "I’m a student",
      "I'm a student",
      "search suggestion",
    ],
    { timeoutMs: STEP_TIMEOUT_MS, intervalMs: 1_200, sense: "dump" },
  );
  await shot(serial, opts.outDir, "00-antes-experience.png");
  steps.push("experience-screen");

  // Sheet Company já aberta (retomada)?
  let xmlNow = dumpUiXml(serial);
  const companySheetOpen =
    !!findFirstEditText(xmlNow) &&
    (/Company \/ Employer/i.test(xmlNow) ||
      /content-desc="Company \/ Employer"/i.test(xmlNow)) &&
    !findNodeByContentDesc(xmlNow, /^Job title,\s*open screen/i);

  if (companySheetOpen) {
    steps.push("resume-company-sheet");
    const edit = findFirstEditText(xmlNow);
    tapElement({ serial, x: edit.x, y: edit.y });
    await sleep(400);
    adbOk(serial, ["shell", "ime", "set", LATIN_IME]);
    await sleep(300);
    adb(serial, [
      "shell",
      "sh",
      "-c",
      "input keyevent KEYCODE_MOVE_END; i=0; while [ $i -lt 96 ]; do input keyevent KEYCODE_DEL; i=$((i+1)); done",
    ]);
    typeViaAdb(serial, company);
    await sleep(2_000);
    await shot(serial, opts.outDir, "company-02-apos-typed.png");
    steps.push(`typed-company:${company}`);
    let sug = null;
    const tSug = Date.now();
    while (Date.now() - tSug < 12_000) {
      sug = findFirstSuggestionBelow(dumpUiXml(serial), edit.y2);
      if (sug) break;
      await sleep(800);
    }
    if (!sug) {
      throw new Error(
        `linkedin-setup: lista de company vazia após digitar "${company}"`,
      );
    }
    tapElement({ serial, x: sug.x, y: sug.y });
    steps.push(`pick-first-company:${sug.text}`);
    await sleep(1_200);
    const done =
      findNodeByText(dumpUiXml(serial), "Done") ||
      findNodeByContentDesc(dumpUiXml(serial), /^Done$/i);
    if (done) {
      tapElement({ serial, x: done.x, y: done.y });
      steps.push("tap-done-company");
      await sleep(WAIT_MS);
    }
  } else {
    const hasJobValue = findNodeByText(xmlNow, jobTitle);
    if (!hasJobValue) {
      await fillOpenScreenField({
        serial,
        openDescRe: /^Job title,\s*open screen/i,
        value: jobTitle,
        pickFirst: true,
        tag: "job-title",
        steps,
        outDir: opts.outDir,
      });
    } else {
      steps.push(`job-title-already:${jobTitle}`);
    }

    await fillOpenScreenField({
      serial,
      openDescRe: /^Company \/ Employer,\s*open screen/i,
      value: company,
      pickFirst: true,
      tag: "company",
      steps,
      outDir: opts.outDir,
    });
  }

  await dismissSoftKeyboard(serial);
  const cont =
    findNodeByText(dumpUiXml(serial), "Continue") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Continue$/i);
  if (!cont) throw new Error("linkedin-setup: Continue após Company");
  tapElement({ serial, x: cont.x, y: cont.y });
  steps.push("tap-continue");
  await sleep(WAIT_MS + 1_000);
  await shot(serial, opts.outDir, "99-apos-continue.png");

  return { steps, serial, outDir: opts.outDir || null, company, jobTitle };
}
