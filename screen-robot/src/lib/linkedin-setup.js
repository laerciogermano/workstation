/**
 * Configuração / onboarding LinkedIn pós-criação de conta.
 *
 * 1º caso: tela "What’s your most recent experience?" → Job title → Continue.
 * (Compose: campo abre sheet; sem resource-id clássico.)
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { pasteCleanMessage } from "./linkedin-message.js";
import { screenshot, tapElement } from "./operate.js";

const ADB_IME = "com.android.adbkeyboard/.AdbIME";
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
  const re =
    desc instanceof RegExp
      ? desc
      : new RegExp(
          `content-desc="${String(desc).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        );
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
    };
  }
  return null;
}

/** Esconde soft keyboard sem BACK (troca p/ ADBKeyboard). */
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
 * Preenche Job title no onboarding Compose e Continua.
 * @param {{
 *   serial: string,
 *   jobTitle: string,
 *   outDir?: string|null,
 * }} opts
 */
export async function linkedinSetupJobTitle(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSetupJobTitle: falta serial");
  const jobTitle = String(opts.jobTitle || "").trim();
  if (!jobTitle) throw new Error("linkedinSetupJobTitle: falta jobTitle");

  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await waitForText(
    serial,
    [
      "most recent experience",
      "Job title*",
      "Job title",
      "I’m a student",
      "I'm a student",
    ],
    { timeoutMs: STEP_TIMEOUT_MS, intervalMs: 1_200, sense: "dump" },
  );
  await shot(serial, opts.outDir, "00-antes-job-title.png");
  steps.push("job-title-screen");

  const xml0 = dumpUiXml(serial);
  // input **abaixo** do label Job title* (não o TextView do label)
  const field =
    findNodeByContentDesc(xml0, /^Job title,\s*open screen/i) ||
    findNodeByContentDesc(xml0, /Job title.*open screen/i);
  if (!field) {
    throw new Error(
      'linkedin-setup: input abaixo de Job title não encontrado (content-desc open screen)',
    );
  }
  tapElement({ serial, x: field.x, y: field.y });
  steps.push("tap-job-title-input");
  await sleep(2_000);
  await shot(serial, opts.outDir, "01-apos-tap-job-title.png");

  let edit = null;
  const t0 = Date.now();
  while (Date.now() - t0 < STEP_TIMEOUT_MS) {
    edit = findFirstEditText(dumpUiXml(serial));
    if (edit) break;
    await sleep(800);
  }
  if (!edit) throw new Error("linkedin-setup: sheet Job title sem EditText");

  tapElement({ serial, x: edit.x, y: edit.y });
  await sleep(400);
  await pasteCleanMessage(serial, jobTitle, {
    forceClear: true,
    restoreIme: false,
  });
  await sleep(500);
  await shot(serial, opts.outDir, "02-apos-job-title-typed.png");
  steps.push(`job-title:${jobTitle}`);

  const done =
    findNodeByText(dumpUiXml(serial), "Done") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Done$/i);
  if (!done) throw new Error("linkedin-setup: Done no sheet Job title");
  tapElement({ serial, x: done.x, y: done.y });
  await sleep(WAIT_MS);
  await shot(serial, opts.outDir, "03-apos-job-title-done.png");
  steps.push("tap-done");

  await dismissSoftKeyboard(serial);
  const cont =
    findNodeByText(dumpUiXml(serial), "Continue") ||
    findNodeByContentDesc(dumpUiXml(serial), /^Continue$/i);
  if (!cont) throw new Error("linkedin-setup: Continue após Job title");
  tapElement({ serial, x: cont.x, y: cont.y });
  steps.push("tap-continue");
  await sleep(WAIT_MS + 1_000);
  await shot(serial, opts.outDir, "04-apos-continue.png");

  return { steps, serial, outDir: opts.outDir || null };
}
