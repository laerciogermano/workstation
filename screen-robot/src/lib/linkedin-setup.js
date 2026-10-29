/**
 * Configuração / onboarding LinkedIn pós-criação de conta.
 *
 * Tela "What’s your most recent experience?":
 * 1. Job title* → input abaixo → digita --job-title → Done
 * 2. Company / Employer* → input abaixo → digita company → 1º da lista → Done
 * 3. Continue
 *
 * Avatar (tela Add photo):
 * --avatar path → push Download → Upload from photos → long-press → SELECT → Done → Continue
 *
 * Asset default: assets/avatars/conectmax-black.jpg (logo sem "Belo Horizonte").
 * Rollback: omitir --avatar.
 */
import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { screenshot, tapElement, typeViaAdb } from "./operate.js";

/** Relativo a screen-robot/src — logo ConectMax preta (sem BH). */
export const DEFAULT_AVATAR_REL = "assets/avatars/conectmax-black.jpg";

const __libDir = dirname(fileURLToPath(import.meta.url));
/** Absoluto do avatar padrão (assets/avatars/conectmax-black.jpg). */
export const DEFAULT_AVATAR_PATH = resolve(__libDir, "..", DEFAULT_AVATAR_REL);

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

/** @param {string} xml @param {RegExp|string} desc */
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
 * Push avatar → DocumentsUI Downloads → SELECT → crop Done → Continue.
 * @param {{
 *   serial: string,
 *   avatarPath?: string|null,
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
  const fileName = basename(avatarPath);
  const remote = `/sdcard/Download/${fileName}`;
  const waitPhotoMs = Number(opts.timeoutMs || AVATAR_TIMEOUT_MS);
  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  adb(serial, ["shell", "mkdir", "-p", "/sdcard/Download"]);
  adb(serial, ["push", avatarPath, remote]);
  adbOk(serial, [
    "shell",
    "am",
    "broadcast",
    "-a",
    "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
    "-d",
    `file://${remote}`,
  ]);
  steps.push(`push-avatar:${fileName}`);
  await sleep(800);

  await waitForText(
    serial,
    [
      "Adding a photo",
      "Add photo",
      "Upload from photos",
      "Profile picture",
      "Take a photo",
    ],
    { timeoutMs: waitPhotoMs, intervalMs: 1_200, sense: "dump" },
  );
  await shot(serial, opts.outDir, "avatar-00-tela.png");

  let xml = dumpUiXml(serial);
  if (!findNodeByText(xml, "Upload from photos")) {
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
    findNodeByText(dumpUiXml(serial), "Upload from photos") ||
    findNodeByContentDesc(dumpUiXml(serial), /Upload from photos/i);
  if (!upload) throw new Error("linkedinSetupAvatar: Upload from photos");
  tapElement({ serial, x: upload.x, y: upload.y });
  steps.push("tap-upload-from-photos");
  await sleep(2_000);
  await shot(serial, opts.outDir, "avatar-01-picker.png");

  const roots =
    findNodeByContentDesc(dumpUiXml(serial), /^Show roots$/i) ||
    findNodeByText(dumpUiXml(serial), "Show roots");
  if (roots) {
    tapElement({ serial, x: roots.x, y: roots.y });
    await sleep(900);
  }
  const downloads =
    findNodeByText(dumpUiXml(serial), "Downloads") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Downloads$/i);
  if (!downloads) throw new Error("linkedinSetupAvatar: Downloads no picker");
  tapElement({ serial, x: downloads.x, y: downloads.y });
  steps.push("open-downloads");
  await sleep(1_500);
  await shot(serial, opts.outDir, "avatar-02-downloads.png");

  let file = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 20_000) {
    file = findNodeByContentDescContains(dumpUiXml(serial), fileName);
    if (file) break;
    await sleep(800);
  }
  if (!file) {
    throw new Error(
      `linkedinSetupAvatar: ${fileName} não apareceu em Downloads`,
    );
  }
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
  if (!select) throw new Error("linkedinSetupAvatar: SELECT após long-press");
  tapElement({ serial, x: select.x, y: select.y });
  steps.push("tap-select");
  await sleep(2_500);
  await shot(serial, opts.outDir, "avatar-03-crop.png");

  const done =
    findNodeByText(dumpUiXml(serial), "Done") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Done$/i);
  if (!done) throw new Error("linkedinSetupAvatar: Done no crop");
  tapElement({ serial, x: done.x, y: done.y });
  steps.push("tap-done-crop");
  await sleep(WAIT_MS + 2_000);
  await shot(serial, opts.outDir, "avatar-04-apos-done.png");

  // espera Saving / Uploading sumir e Continue da tela de foto
  const tUp = Date.now();
  while (Date.now() - tUp < 45_000) {
    const x = dumpUiXml(serial);
    if (
      /Adding a photo|Profile picture/i.test(x) &&
      findNodeByText(x, "Continue") &&
      !/Uploading Media|\bSaving\b/i.test(x)
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

  return { steps, serial, avatarPath, outDir: opts.outDir || null };
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
