/**
 * Configuração / onboarding LinkedIn pós-criação de conta.
 *
 * Tela "What’s your most recent experience?":
 * 1. Job title* → input abaixo → digita --job-title → Done
 * 2. Company / Employer* → input abaixo → digita company → 1º da lista → Done
 * 3. Continue
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { screenshot, tapElement, typeViaAdb } from "./operate.js";

const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const LATIN_IME =
  "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME";
const WAIT_MS = Number(process.env.LINKEDIN_SETUP_WAIT_MS || 4_000);
const STEP_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SETUP_TIMEOUT_MS || 30_000,
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
 * 1º item clicável da lista abaixo do EditText (sugestões do sheet).
 * @param {string} xml
 * @param {number} belowY
 */
function findFirstSuggestionBelow(xml, belowY) {
  /** @type {{ x: number, y: number, text: string, y1: number }[]} */
  const hits = [];
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!/clickable="true"/.test(n)) continue;
    const text = (n.match(/\btext="([^"]*)"/) || [])[1] || "";
    const desc = (n.match(/\bcontent-desc="([^"]*)"/) || [])[1] || "";
    const label = (text || desc).trim();
    if (!label) continue;
    if (/^(done|back|job title|company)/i.test(label)) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const y1 = Number(b[2]);
    if (y1 < belowY + 20) continue;
    hits.push({
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((y1 + Number(b[4])) / 2),
      y1,
      text: label,
    });
  }
  hits.sort((a, b) => a.y1 - b.y1);
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
  await sleep(1_200);
  await shot(serial, outDir, `${tag}-02-apos-typed.png`);
  steps.push(`typed-${tag}:${want}`);

  if (pickFirst) {
    const sug = findFirstSuggestionBelow(dumpUiXml(serial), edit.y2);
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
  const company = String(opts.company || "conectmax").trim();

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
    ],
    { timeoutMs: STEP_TIMEOUT_MS, intervalMs: 1_200, sense: "dump" },
  );
  await shot(serial, opts.outDir, "00-antes-experience.png");
  steps.push("experience-screen");

  const hasJobValue = findNodeByText(dumpUiXml(serial), jobTitle);
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
