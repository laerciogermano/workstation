/**
 * Criar conta LinkedIn (jornada signup) — passos incrementais com print.
 *
 * Fluxo: stop → Join now → nomes (ADBKeyboard + assert) → email → password → location → job title.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { pasteCleanMessage } from "./linkedin-message.js";
import {
  key,
  launch,
  screenshot,
  stopAllApps,
  tapElement,
  typeViaAdb,
} from "./operate.js";

const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const LATIN_IME =
  "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME";

const WAIT_MS = Number(process.env.LINKEDIN_SIGNUP_WAIT_MS || 4_000);
const JOIN_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SIGNUP_JOIN_TIMEOUT_MS || 45_000,
);
const NAME_TIMEOUT_MS = Number(
  process.env.LINKEDIN_SIGNUP_NAME_TIMEOUT_MS || 30_000,
);

const RID_FIRST = "growth_join_split_form_first_name";
const RID_LAST = "growth_join_split_form_last_name";
const RID_EMAIL = "growth_join_split_form_email_address";
const RID_PASSWORD = "growth_join_split_form_password";
const RID_CONTINUE = "growth_join_split_form_join_button";

async function shot(serial, outDir, name) {
  if (!outDir) return;
  try {
    screenshot({ serial, path: join(outDir, name) });
  } catch (e) {
    console.error(`aviso: screenshot ${name}: ${e.message || e}`);
  }
}

/**
 * Centro do node pelo resource-id (suffix após /).
 * @param {string} xml
 * @param {string} resourceIdSuffix
 * @returns {{ x: number, y: number, text: string }|null}
 */
/**
 * LinkedIn EditText no dump: `First name*, , Jacqueline` (label, erro, valor).
 * @param {string} text
 */
export function parseJoinEditValue(text) {
  const raw = String(text || "");
  const m = raw.match(/^[^,]*,\s*[^,]*,\s*(.*)$/);
  if (m) return m[1].replace(/\s+/g, " ").trim();
  return raw.replace(/\s+/g, " ").trim();
}

export function findEditByResourceId(xml, resourceIdSuffix) {
  const needle = `resource-id="com.linkedin.android:id/${resourceIdSuffix}"`;
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!n.includes(needle)) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const text = (n.match(/\btext="([^"]*)"/) || [])[1] || "";
    const focused = /\bfocused="true"/.test(n);
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text,
      value: parseJoinEditValue(text),
      focused,
    };
  }
  return null;
}

/** @param {string} serial @param {string} rid @param {string} label */
async function waitForResource(serial, rid, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < NAME_TIMEOUT_MS) {
    const xml = dumpUiXml(serial);
    const hit = findEditByResourceId(xml, rid);
    if (hit) return hit;
    await sleep(1_000);
  }
  throw new Error(`linkedin-signup: timeout ${NAME_TIMEOUT_MS}ms — ${label}`);
}

/** @param {string} serial */
async function waitForContinue(serial) {
  return waitForResource(serial, RID_CONTINUE, "Continue");
}

/**
 * Esconde teclado soft sem KEYCODE_BACK (BACK sai do Join).
 * Troca para ADBKeyboard (sem UI) + tap no título/logo.
 * @param {string} serial
 */
async function dismissKeyboard(serial) {
  try {
    adb(serial, ["shell", "ime", "enable", ADB_IME]);
    adb(serial, ["shell", "ime", "set", ADB_IME]);
    await sleep(400);
    const xml = dumpUiXml(serial);
    const title =
      findNodeByText(xml, "Add your name") ||
      findNodeByText(xml, "Create account") ||
      findNodeByText(xml, "Add your email or phone") ||
      findNodeByText(xml, "Add your email") ||
      findNodeByText(xml, "Add a password") ||
      findNodeByText(xml, "Add your location");
    if (title) tapElement({ serial, x: title.x, y: title.y });
    else tapElement({ serial, x: 90, y: 96 });
    await sleep(400);
  } catch {
    /* ignore */
  }
}

/** @param {string} serial @param {string[]} steps @param {string|null|undefined} outDir @param {string} shotName */
async function tapContinue(serial, steps, outDir, shotName) {
  await dismissKeyboard(serial);
  await shot(serial, outDir, `${shotName}-antes-continue.png`);
  const cont = await waitForContinue(serial);
  tapElement({ serial, x: cont.x, y: cont.y });
  steps.push("tap-continue");
  await sleep(WAIT_MS + 1_000);
  await shot(serial, outDir, `${shotName}-apos-continue.png`);
}

/**
 * Espera os campos de nome no dump.
 * @param {string} serial
 */
async function waitForNameFields(serial) {
  const t0 = Date.now();
  while (Date.now() - t0 < NAME_TIMEOUT_MS) {
    const xml = dumpUiXml(serial);
    const first = findEditByResourceId(xml, RID_FIRST);
    const last = findEditByResourceId(xml, RID_LAST);
    if (first && last) return { first, last, xml };
    await sleep(1_200);
  }
  throw new Error(
    `linkedin-signup: timeout ${NAME_TIMEOUT_MS}ms — First/Last name`,
  );
}

/**
 * Fecha teclado → re-dump do resource-id → tap → ADBKeyboard.
 * Sem dismiss, teclado cobre Last name e o paste cai no First (clear+Lima).
 * @param {string} serial
 * @param {string} resourceIdSuffix
 * @param {string} value
 * @param {string} label
 * @param {{ skipVerify?: boolean }} [opts]
 */
async function fillFieldExact(serial, resourceIdSuffix, value, label, opts = {}) {
  const want = String(value);
  for (let attempt = 1; attempt <= 2; attempt++) {
    await dismissKeyboard(serial);
    const field = await waitForResource(serial, resourceIdSuffix, label);
    tapElement({ serial, x: field.x, y: field.y });
    await sleep(700);
    // restoreIme:false — LatinIME cobria Last name; BACK pra fechar saía do form
    await pasteCleanMessage(serial, want, {
      forceClear: true,
      restoreIme: false,
    });
    await sleep(500);
    await dismissKeyboard(serial);
    if (opts.skipVerify) return field;
    const got = findEditByResourceId(dumpUiXml(serial), resourceIdSuffix);
    if (got && normFieldText(got.value) === normFieldText(want)) return got;
    console.error(
      `aviso: fill ${label} tentativa ${attempt}: dump="${got?.text || ""}"`,
    );
  }
  const final = findEditByResourceId(dumpUiXml(serial), resourceIdSuffix);
  throw new Error(
    `linkedin-signup: falha ao preencher ${label} (dump="${final?.text || ""}"; esperado "${want}")`,
  );
}

function normFieldText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Email/senha: dump LI não expõe o valor (fica só o hint) e ADBKeyboard
 * muitas vezes não injeta nesses campos — LatinIME + input text; `@` via KEYCODE_AT.
 * @param {string} serial
 * @param {string} resourceIdSuffix
 * @param {string} value
 * @param {string} label
 */
async function fillFieldViaAdb(serial, resourceIdSuffix, value, label) {
  const want = String(value);
  await dismissKeyboard(serial);
  adbOk(serial, ["shell", "ime", "set", LATIN_IME]);
  const field = await waitForResource(serial, resourceIdSuffix, label);
  tapElement({ serial, x: field.x, y: field.y });
  await sleep(700);
  adb(serial, [
    "shell",
    "sh",
    "-c",
    "input keyevent KEYCODE_MOVE_END; i=0; while [ $i -lt 96 ]; do input keyevent KEYCODE_DEL; i=$((i+1)); done",
  ]);
  await sleep(200);
  const parts = want.split("@");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) typeViaAdb(serial, parts[i]);
    if (i < parts.length - 1) key({ serial, code: "KEYCODE_AT" });
  }
  await sleep(500);
  await dismissKeyboard(serial);
}

/**
 * Confirma First/Last no dump antes do Continue (valor parseado do text LI).
 * @param {string} serial
 * @param {string} firstName
 * @param {string} lastName
 */
async function assertNameFields(serial, firstName, lastName) {
  await dismissKeyboard(serial);
  const { first, last } = await waitForNameFields(serial);
  const gotFirst = normFieldText(first.value);
  const gotLast = normFieldText(last.value);
  const wantFirst = normFieldText(firstName);
  const wantLast = normFieldText(lastName);
  if (gotFirst !== wantFirst || gotLast !== wantLast) {
    throw new Error(
      `linkedin-signup: nomes no dump ≠ args (first="${first.text}" last="${last.text}"; esperado "${firstName}" / "${lastName}")`,
    );
  }
  return { first, last };
}

/**
 * Centro do 1º EditText no dump (sheet Job title sem resource-id).
 * @param {string} xml
 */
function findFirstEditText(xml) {
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!n.includes("android.widget.EditText")) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text: (n.match(/\btext="([^"]*)"/) || [])[1] || "",
    };
  }
  return null;
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
    };
  }
  return null;
}

/**
 * Job title: abre sheet → digita palavra a palavra (`input text` trunca frases longas).
 * @param {string} serial
 * @param {string} jobTitle
 * @param {string[]} steps
 * @param {string|null|undefined} outDir
 */
async function fillJobTitle(serial, jobTitle, steps, outDir) {
  const title = String(jobTitle || "").trim();
  if (!title) throw new Error("fillJobTitle: falta jobTitle");

  await waitForText(serial, ["Job title*", "Job title", "most recent experience"], {
    timeoutMs: NAME_TIMEOUT_MS,
    intervalMs: 1_000,
    sense: "dump",
  });
  await shot(serial, outDir, "16-antes-job-title.png");

  const xml0 = dumpUiXml(serial);
  const label =
    findNodeByText(xml0, "Job title*") || findNodeByText(xml0, "Job title");
  if (label) tapElement({ serial, x: label.x, y: label.y + 80 });
  else tapElement({ serial, x: 540, y: 1000 });
  await sleep(2_000);

  let edit = null;
  const t0 = Date.now();
  while (Date.now() - t0 < NAME_TIMEOUT_MS) {
    edit = findFirstEditText(dumpUiXml(serial));
    if (edit) break;
    await sleep(800);
  }
  if (!edit) throw new Error("linkedin-signup: sheet Job title sem EditText");

  tapElement({ serial, x: edit.x, y: edit.y });
  await sleep(400);
  await pasteCleanMessage(serial, title, {
    forceClear: true,
    restoreIme: false,
  });
  await sleep(600);
  await shot(serial, outDir, "17-apos-job-title-typed.png");

  const done = findNodeByText(dumpUiXml(serial), "Done");
  if (!done) throw new Error("linkedin-signup: Done no sheet Job title");
  tapElement({ serial, x: done.x, y: done.y });
  steps.push(`job-title:${title}`);
  await sleep(WAIT_MS);
  await shot(serial, outDir, "18-apos-job-title-done.png");
}

/**
 * @param {{
 *   serial: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   password: string,
 *   jobTitle?: string,
 *   linkedinPackage?: string,
 *   outDir?: string|null,
 * }} opts
 * @returns {Promise<{ steps: string[], serial: string, outDir: string|null }>}
 */
export async function linkedinSignupJoinNow(opts) {
  const serial = opts.serial;
  if (!serial) throw new Error("linkedinSignupJoinNow: falta serial");
  const firstName = String(opts.firstName || "").trim();
  const lastName = String(opts.lastName || "").trim();
  const email = String(opts.email || "").trim();
  const password = String(opts.password || "");
  const jobTitle = String(opts.jobTitle || "").trim();
  if (!firstName) throw new Error("linkedinSignupJoinNow: falta firstName");
  if (!lastName) throw new Error("linkedinSignupJoinNow: falta lastName");
  if (!email) throw new Error("linkedinSignupJoinNow: falta email");
  if (!password) throw new Error("linkedinSignupJoinNow: falta password");
  if (!jobTitle) throw new Error("linkedinSignupJoinNow: falta jobTitle");

  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const steps = [];

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await shot(serial, opts.outDir, "00-antes-stop.png");

  const { stopped } = stopAllApps({
    serial,
    extraPackages: [pkg],
  });
  steps.push(`stop-all:${stopped.length}`);
  await sleep(800);
  await shot(serial, opts.outDir, "01-apos-stop-home.png");

  await launch({ serial, package: pkg });
  steps.push("launch");
  await sleep(WAIT_MS + 2_000);
  await shot(serial, opts.outDir, "02-apos-launch.png");

  const hit = await waitForText(
    serial,
    ["New to LinkedIn? Join now", "Join now", "Join Now"],
    {
      timeoutMs: JOIN_TIMEOUT_MS,
      intervalMs: 1_500,
      sense: "dump",
    },
  );
  steps.push(`join-now:${hit.text || "hit"}`);
  await shot(serial, opts.outDir, "03-antes-join-now.png");

  tapElement({ serial, x: hit.x, y: hit.y });
  await sleep(WAIT_MS);
  await shot(serial, opts.outDir, "04-apos-join-now.png");
  steps.push("tap-join-now");

  await waitForNameFields(serial);
  await shot(serial, opts.outDir, "05-antes-names.png");

  await fillFieldExact(serial, RID_FIRST, firstName, "first-name");
  steps.push(`first-name:${firstName}`);
  await shot(serial, opts.outDir, "06-apos-first-name.png");

  await fillFieldExact(serial, RID_LAST, lastName, "last-name");
  steps.push(`last-name:${lastName}`);
  await sleep(400);
  await shot(serial, opts.outDir, "07-apos-last-name.png");

  await assertNameFields(serial, firstName, lastName);
  steps.push("names-verified");

  await tapContinue(serial, steps, opts.outDir, "08");

  await waitForResource(serial, RID_EMAIL, "email");
  await shot(serial, opts.outDir, "09-antes-email.png");
  await fillFieldViaAdb(serial, RID_EMAIL, email, "email");
  steps.push(`email:${email}`);
  await sleep(400);
  await shot(serial, opts.outDir, "10-apos-email.png");

  await tapContinue(serial, steps, opts.outDir, "11");
  // dump do email não traz o valor — sucesso = chegou na senha
  await waitForResource(serial, RID_PASSWORD, "password");
  await shot(serial, opts.outDir, "12-antes-password.png");
  await fillFieldViaAdb(serial, RID_PASSWORD, password, "password");
  steps.push("password:set");
  await sleep(400);
  await shot(serial, opts.outDir, "13-apos-password.png");

  await tapContinue(serial, steps, opts.outDir, "14");

  // Location: usa sugestão pré-preenchida (ex. Curitiba) e Continue (TextView).
  await waitForText(serial, ["add your location", "Location*", "Location"], {
    timeoutMs: NAME_TIMEOUT_MS,
    intervalMs: 1_200,
    sense: "dump",
  });
  await shot(serial, opts.outDir, "15-antes-location.png");
  {
    const locDone =
      findNodeByText(dumpUiXml(serial), "Continue") ||
      (await waitForContinue(serial));
    tapElement({ serial, x: locDone.x, y: locDone.y });
    steps.push("tap-continue-location");
    await sleep(WAIT_MS + 1_500);
    await shot(serial, opts.outDir, "15-apos-location.png");
  }

  await fillJobTitle(serial, jobTitle, steps, opts.outDir);

  return { steps, serial, outDir: opts.outDir || null };
}
