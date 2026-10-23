/**
 * Criar conta LinkedIn (jornada signup) — passos incrementais com print.
 *
 * Fluxo: stop → Join now → nomes → email → password → Continue.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { dumpUiXml, waitForText } from "./extract.js";
import { pasteCleanMessage } from "./linkedin-message.js";
import {
  key,
  launch,
  screenshot,
  stopAllApps,
  tapElement,
  type,
} from "./operate.js";

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
export function findEditByResourceId(xml, resourceIdSuffix) {
  const needle = `resource-id="com.linkedin.android:id/${resourceIdSuffix}"`;
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!n.includes(needle)) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!b) continue;
    const text = (n.match(/\btext="([^"]*)"/) || [])[1] || "";
    return {
      x: Math.floor((Number(b[1]) + Number(b[3])) / 2),
      y: Math.floor((Number(b[2]) + Number(b[4])) / 2),
      text,
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

/** @param {string} serial */
async function dismissKeyboard(serial) {
  try {
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(600);
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
 * Tap no campo + injeta texto (`adb input text` — ok p/ nomes sem @).
 * @param {string} serial
 * @param {{ x: number, y: number }} field
 * @param {string} value
 */
async function fillField(serial, field, value) {
  tapElement({ serial, x: field.x, y: field.y });
  await sleep(400);
  await type({ serial, text: String(value) });
  await sleep(500);
}

/**
 * Email/@ via ADBKeyboard — `input text` deixa `%40` literal no EditText.
 * @param {string} serial
 * @param {{ x: number, y: number }} field
 * @param {string} value
 */
async function fillFieldExact(serial, field, value) {
  tapElement({ serial, x: field.x, y: field.y });
  await sleep(400);
  await pasteCleanMessage(serial, String(value), { forceClear: true });
  await sleep(500);
}

/**
 * @param {{
 *   serial: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   password: string,
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
  if (!firstName) throw new Error("linkedinSignupJoinNow: falta firstName");
  if (!lastName) throw new Error("linkedinSignupJoinNow: falta lastName");
  if (!email) throw new Error("linkedinSignupJoinNow: falta email");
  if (!password) throw new Error("linkedinSignupJoinNow: falta password");

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

  const fields = await waitForNameFields(serial);
  await shot(serial, opts.outDir, "05-antes-names.png");

  await fillField(serial, fields.first, firstName);
  steps.push(`first-name:${firstName}`);
  await shot(serial, opts.outDir, "06-apos-first-name.png");

  const afterFirst = await waitForNameFields(serial);
  await fillField(serial, afterFirst.last, lastName);
  steps.push(`last-name:${lastName}`);
  await sleep(800);
  await shot(serial, opts.outDir, "07-apos-last-name.png");

  await tapContinue(serial, steps, opts.outDir, "08");

  const emailField = await waitForResource(serial, RID_EMAIL, "email");
  await shot(serial, opts.outDir, "09-antes-email.png");
  await fillFieldExact(serial, emailField, email);
  steps.push(`email:${email}`);
  await sleep(800);
  await shot(serial, opts.outDir, "10-apos-email.png");

  await tapContinue(serial, steps, opts.outDir, "11");

  const passwordField = await waitForResource(serial, RID_PASSWORD, "password");
  await shot(serial, opts.outDir, "12-antes-password.png");
  await fillFieldExact(serial, passwordField, password);
  steps.push("password:set");
  await sleep(800);
  await shot(serial, opts.outDir, "13-apos-password.png");

  await tapContinue(serial, steps, opts.outDir, "14");

  return { steps, serial, outDir: opts.outDir || null };
}
