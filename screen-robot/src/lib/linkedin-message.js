/**
 * Enviar mensagem LinkedIn via URL de perfil.
 *
 * Fluxo:
 * 1. am start VIEW linkedin.com/in/…
 * 2. Message (ou ⋮ → Send a message)
 * 3. Write a message…
 * 4. Injeta texto **exato** via ADBKeyboard (ADB_INPUT_B64) — sem clipboard Mac↔AVD
 * 5. Send
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml, extractPreferDump } from "./extract.js";
import {
  assertConnectionAcceptedForSend,
  findMoreOverflow,
  normalizeLinkedInProfileUrl,
  notifyLinkedInMessages,
  openProfileByUrl,
  resolveAgentId,
} from "./linkedin-connect.js";
import { key, screenshot, stopAllApps, tapElement } from "./operate.js";

const OCR = process.env.SCREEN_ROBOT_OCR || "rapidocr";
const WAIT_VIEW_MS = Number(process.env.LINKEDIN_MSG_WAIT_VIEW_MS || 8_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_MSG_WAIT_TAP_MS || 3_000);
const MAX_ROUNDS = 12;

const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const LATIN_IME =
  "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME";

/** Campo vazio = placeholder "Write a message…" no OCR. */
export function isMessageFieldEmpty(els) {
  return (els || []).some((e) => {
    const t = String(e?.text || "").replace(/\s+/g, " ").trim();
    const glued = t.replace(/\s+/g, "");
    return (
      /write\s*a\s*message/i.test(t) || /^writeamessage/i.test(glued)
    );
  });
}

function enableAdbIme(serial) {
  const cur = String(
    adb(serial, ["shell", "settings", "get", "secure", "default_input_method"])
      .stdout || "",
  ).trim();
  adbOk(serial, [
    "shell",
    "settings",
    "put",
    "secure",
    "enabled_input_methods",
    `${ADB_IME}:${LATIN_IME}`,
  ]);
  adbOk(serial, ["shell", "ime", "enable", ADB_IME]);
  adb(serial, ["shell", "ime", "set", ADB_IME]);
  return cur || LATIN_IME;
}

function restoreIme(serial, imeId) {
  const id = imeId || LATIN_IME;
  adbOk(serial, ["shell", "ime", "set", id]);
}

/** Limpa via ADBKeyboard (exato) ou fallback DEL. */
function clearFocusedField(serial) {
  adbOk(serial, [
    "shell",
    "am",
    "broadcast",
    "-a",
    "ADB_CLEAR_TEXT",
  ]);
  // fallback curto
  for (let i = 0; i < 8; i++) {
    adbOk(serial, ["shell", "input", "keyevent", "KEYCODE_DEL"]);
  }
}

/**
 * Injeta o texto **exatamente** (UTF-8) via ADBKeyboard base64.
 * - campo vazio → só injeta
 * - campo com texto → limpa, depois injeta
 * Não usa clipboard do Mac (evita √ß / mojibake).
 */
export async function pasteCleanMessage(serial, text, opts = {}) {
  const s = String(text ?? "");
  if (!s.trim()) return;

  let shouldClear = true;
  if (opts.skipClear) shouldClear = false;
  else if (opts.forceClear) shouldClear = true;
  else if (opts.els) shouldClear = !isMessageFieldEmpty(opts.els);

  const prevIme = enableAdbIme(serial);
  await sleep(400);
  try {
    if (shouldClear) clearFocusedField(serial);
    const b64 = Buffer.from(s, "utf8").toString("base64");
    adb(serial, [
      "shell",
      "am",
      "broadcast",
      "-a",
      "ADB_INPUT_B64",
      "--es",
      "msg",
      b64,
    ]);
    await sleep(600);
  } finally {
    restoreIme(serial, prevIme);
  }
}

/** OCR do composer não deve ter nomes errados; deve ter um token do texto. */
export function pasteLooksWrong(els, expectedText) {
  const blob = (els || [])
    .map((e) => String(e?.text || ""))
    .join(" ")
    .toLowerCase();
  if (/iracema/.test(blob)) return "ainda Iracema no composer";
  const expect = String(expectedText || "").toLowerCase();
  if (/laércio|laercio/.test(expect) && !/laércio|laercio/.test(blob)) {
    return "Laércio não apareceu após paste";
  }
  return null;
}

/** @deprecated use pasteCleanMessage — mantido p/ testes de escape legado */
export function escapeMessageForAdb(text) {
  return [...String(text).replace(/\r?\n+/g, " ").trim()]
    .map((ch) => {
      if (ch === " ") return "%s";
      if (ch === "%") return "%25";
      return ch;
    })
    .join("");
}

/** Botão Message do perfil (não "Send profile in a message"). */
export function findHeaderMessage(els) {
  for (const el of els || []) {
    const t = String(el?.text || "").trim();
    if (!/^message$/i.test(t) && !/^7?message$/i.test(t)) continue;
    if (/send profile/i.test(t)) continue;
    if (el.x == null || el.y == null) continue;
    // CTA do header (~y 500–750), não tab bar
    if (el.y < 200 || el.y > 820) continue;
    return { text: t, x: el.x, y: el.y };
  }
  return null;
}

/** Opção no sheet More. */
export function findSendMessageInSheet(els) {
  const prefs = [
    /^send\s*a\s*message$/i,
    /^send\s*message$/i,
    /^message$/i,
  ];
  for (const re of prefs) {
    for (const el of els || []) {
      const t = String(el?.text || "").replace(/\s+/g, " ").trim();
      const glued = t.replace(/\s+/g, "");
      if (re.test(t) || re.test(glued)) {
        if (/send profile|personalize|report|block/i.test(t)) continue;
        if (el.x == null || el.y == null) continue;
        return { text: t, x: el.x, y: el.y };
      }
    }
  }
  // OCR cola: "Senda message"
  for (const el of els || []) {
    const t = String(el?.text || "").replace(/\s+/g, "");
    if (/^sendamessage$/i.test(t) && el.x != null) {
      return { text: el.text, x: el.x, y: el.y };
    }
  }
  return null;
}

export function findWriteAMessage(els) {
  for (const el of els || []) {
    const t = String(el?.text || "").replace(/\s+/g, " ").trim();
    const glued = t.replace(/\s+/g, "");
    if (
      /write\s*a\s*message/i.test(t) ||
      /^writeamessage/i.test(glued)
    ) {
      if (el.x == null || el.y == null) continue;
      return { text: t, x: el.x, y: el.y };
    }
  }
  return null;
}

/**
 * Estado do draft no EditText do composer.
 * @returns {"empty"|"draft"|"unknown"}
 */
export function composerDraftState(serial) {
  const xml = dumpUiXml(serial);
  for (const n of xml.match(/<node\b[^>]*>/g) || []) {
    if (!/messaging_keyboard_text_input_container/.test(n)) continue;
    const m = n.match(/\btext="([^"]*)"/);
    const t = (m?.[1] || "")
      .replace(/&#10;/g, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .trim();
    // hint "Write a message…" às vezes vem no text=
    if (!t || /^write\s*a\s*message/i.test(t)) return "empty";
    return "draft";
  }
  return "unknown";
}

export function composerDraftNonEmpty(serial) {
  return composerDraftState(serial) === "draft";
}

/**
 * Centro do botão Send (só content-desc=Send / send_button).
 * Com campo vazio o LinkedIn troca por mic — não clicar nisso.
 */
export function findSendViaUiDump(serial) {
  const xml = dumpUiXml(serial);
  const center = (n, via) => {
    const m = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!m) return null;
    return {
      x: Math.floor((Number(m[1]) + Number(m[3])) / 2),
      y: Math.floor((Number(m[2]) + Number(m[4])) / 2),
      via,
    };
  };

  for (const n of xml.match(/<node\b[^>]*>/g) || []) {
    if (/content-desc="Send"/.test(n) && /clickable="true"/.test(n)) {
      const hit = center(n, "uiautomator-Send");
      if (hit) return hit;
    }
  }
  for (const n of xml.match(/<node\b[^>]*>/g) || []) {
    if (!/messaging_keyboard_send_button|keyboard_send_button/.test(n)) continue;
    if (!/clickable="true"/.test(n)) continue;
    if (/content-desc="(Record|Voice|microphone)/i.test(n)) continue;
    const hit = center(n, "uiautomator-send_button");
    if (hit) return hit;
  }
  // geom do avião (campo com texto, teclado aberto) — último recurso
  if (/messaging_keyboard_text_input_container/.test(xml)) {
    const draft = composerDraftState(serial);
    if (draft === "draft") {
      return { x: 504, y: 475, via: "geom-send" };
    }
  }
  return null;
}

function isComposer(els) {
  const blob = (els || []).map((e) => String(e?.text || "")).join(" ");
  return Boolean(
    findWriteAMessage(els) ||
      /new\s*message/i.test(blob) ||
      /active\s*now/i.test(blob) ||
      /writeamessage/i.test(blob.replace(/\s+/g, "")),
  );
}

async function pasteAndConfirm(serial, message, steps, writeY, elsBefore = null) {
  let els = elsBefore;
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (!els) {
      els = await extractPreferDump({ serial, engine: OCR, icons: true });
    }
    const empty = isMessageFieldEmpty(els);
    steps.push(empty ? `paste:campo-vazio:try${attempt}` : `paste:limpa:try${attempt}`);
    await pasteCleanMessage(serial, message, {
      els,
      // retry: força limpar o que colou errado
      forceClear: attempt > 1 && !empty ? false : undefined,
      skipClear: empty,
    });
    await sleep(1_200);
    const after = await extractPreferDump({ serial, engine: OCR, icons: true });
    const wrong = pasteLooksWrong(after || [], message);
    if (!wrong) {
      steps.push(`paste:ok:try${attempt}`);
      return { ok: true, els: after, writeY };
    }
    steps.push(`paste:retry${attempt}:${wrong}`);
    // falhou → próximo round limpa
    els = after;
    await pasteCleanMessage(serial, message, { forceClear: true });
    els = null;
    await sleep(300);
  }
  return { ok: false, els: null, writeY };
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

/**
 * @param {{
 *   serial: string,
 *   linkedinPackage?: string,
 *   url: string,
 *   text: string,
 *   outDir?: string|null,
 *   dryRun?: boolean,
 *   apps?: Record<string, { package?: string }>,
 * }} opts
 */
export async function sendLinkedInMessage(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const dryRun = Boolean(opts.dryRun);
  const message = String(opts.text || "").trim();
  if (!message) throw new Error("texto da mensagem vazio");
  if (!normalizeLinkedInProfileUrl(opts.url)) {
    throw new Error(`URL inválida: ${opts.url}`);
  }

  await assertConnectionAcceptedForSend({
    profileUrl: opts.url,
    agentId: resolveAgentId(),
  });

  const steps = [];
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  // 1) Fecha todos os apps de terceiros → HOME → 2) abre LinkedIn pela URL
  const extras = Object.values(opts.apps || {})
    .map((a) => a?.package)
    .filter(Boolean);
  const { stopped } = stopAllApps({
    serial,
    extraPackages: [...extras, pkg],
  });
  steps.push(`stop-all:${stopped.length}`);
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(800);
  await shot(serial, opts.outDir, "00-home.png");

  const url = openProfileByUrl(serial, pkg, opts.url);
  steps.push(`view:${url}`);
  await sleep(WAIT_VIEW_MS);
  await shot(serial, opts.outDir, "01-perfil.png");

  let openedComposer = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const els = await extractPreferDump({ serial, engine: OCR, icons: true });
    const list = els || [];

    if (isComposer(list) && !openedComposer) {
      openedComposer = true;
      steps.push("composer");
      await shot(serial, opts.outDir, "02-composer.png");
    }

    // Já no composer / chat: Write a message → cola (só Laércio) → Send
    if (openedComposer || isComposer(list)) {
      openedComposer = true;
      let write = findWriteAMessage(list);
      // chat já aberto: campo costuma ficar no rodapé (~y 800+)
      if (!write && /active\s*now|new\s*message/i.test(
        (list || []).map((e) => e.text).join(" "),
      )) {
        write = { text: "geom-field", x: 270, y: 860 };
      }
      if (write) {
        steps.push(`write@${write.x},${write.y}`);
        if (!dryRun) {
          tapElement({ serial, x: write.x, y: write.y });
          await sleep(800);
          // OCR pós-tap: decide limpar ou só colar
          const afterTap = await extractPreferDump({ serial, engine: OCR, icons: true });
          const pasted = await pasteAndConfirm(
            serial,
            message,
            steps,
            write.y,
            afterTap || list,
          );
          if (!pasted.ok) {
            return {
              ok: false,
              status: "failed",
              url,
              text: message,
              steps,
              error: "paste não confirmou texto do Laércio (evitou Iracema)",
            };
          }
          await shot(serial, opts.outDir, "03-pasted.png");
          await shot(serial, opts.outDir, "04-before-send.png");
          // ENTER no multiline NÃO envia. Só content-desc=Send (nunca o mic).
          let sentOk = false;
          for (let attempt = 1; attempt <= 2; attempt++) {
            const sendBtn = findSendViaUiDump(serial);
            if (!sendBtn) {
              steps.push(`send:missing:try${attempt}`);
              break;
            }
            steps.push(`send@${sendBtn.x},${sendBtn.y}:${sendBtn.via}:try${attempt}`);
            tapElement({ serial, x: sendBtn.x, y: sendBtn.y });
            await sleep(WAIT_TAP_MS);
            const st = composerDraftState(serial);
            steps.push(`send:state:${st}`);
            if (st === "empty") {
              sentOk = true;
              break;
            }
            if (st === "unknown") {
              // dialog/overlay — BACK e reavalia
              key({ serial, code: "KEYCODE_BACK" });
              await sleep(800);
              if (composerDraftState(serial) === "empty") {
                sentOk = true;
                break;
              }
            }
          }
          if (!sentOk) {
            return {
              ok: false,
              status: "failed",
              url,
              text: message,
              steps,
              error: "tap Send (uiautomator) não limpou o draft",
            };
          }
          steps.push("send:confirmed-empty");
        }
        await shot(serial, opts.outDir, "05-sent.png");
        let db = null;
        try {
          db = await notifyLinkedInMessages({
            profileUrl: url,
            agentId: resolveAgentId(),
            direction: "sent",
            message,
            occurredAt: new Date().toISOString(),
          });
          steps.push(db.notified ? "db:message:sent" : `db:skip:${db.reason}`);
        } catch (e) {
          steps.push(`db:error:${String(e?.message || e).slice(0, 120)}`);
        }
        return {
          ok: true,
          status: "sent",
          url,
          text: message,
          steps,
          db,
        };
      }
      await sleep(1_000);
      continue;
    }

    const msg = findHeaderMessage(list);
    if (msg) {
      steps.push(`message@${msg.x},${msg.y}`);
      await shot(serial, opts.outDir, "01b-message-btn.png");
      if (!dryRun) {
        tapElement({ serial, x: msg.x, y: msg.y });
        await sleep(WAIT_TAP_MS);
      }
      continue;
    }

    const sheetMsg = findSendMessageInSheet(list);
    if (sheetMsg) {
      steps.push(`sheet-message@${sheetMsg.x},${sheetMsg.y}`);
      if (!dryRun) {
        tapElement({ serial, x: sheetMsg.x, y: sheetMsg.y });
        await sleep(WAIT_TAP_MS);
      }
      continue;
    }

    // Sem Message no header → ⋮
    const more = findMoreOverflow(list);
    if (more) {
      steps.push(`more@${more.x},${more.y}:${more.via}`);
      await shot(serial, opts.outDir, "01c-more.png");
      if (!dryRun) {
        tapElement({ serial, x: more.x, y: more.y });
        await sleep(WAIT_TAP_MS);
      }
      continue;
    }

    steps.push(`wait:round${round}`);
    await sleep(1_500);
  }

  return {
    ok: false,
    status: "failed",
    url,
    text: message,
    steps,
    error: "não abriu composer / não enviou",
  };
}
