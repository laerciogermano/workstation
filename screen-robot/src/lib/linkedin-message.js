/**
 * Enviar mensagem LinkedIn via URL de perfil.
 *
 * Fluxo (prints: screenshots/jornada-enviar-mensagem/):
 * 1. am start VIEW linkedin.com/in/…
 * 2. Message no header → tap; senão ⋮ → Send a message / Message
 * 3. Tap "Write a message…"
 * 4. **Cola** o texto (clipboard host → KEYCODE_PASTE) — sem `input text` / %XX
 * 5. Tap Send
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

import { adb, sleep } from "./adb.js";
import { extract } from "./extract.js";
import {
  findMoreOverflow,
  normalizeLinkedInProfileUrl,
  openProfileByUrl,
} from "./linkedin-connect.js";
import { screenshot, tapElement } from "./operate.js";

const OCR = process.env.SCREEN_ROBOT_OCR || "rapidocr";
const WAIT_VIEW_MS = Number(process.env.LINKEDIN_MSG_WAIT_VIEW_MS || 8_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_MSG_WAIT_TAP_MS || 3_000);
const WAIT_CLIP_MS = Number(process.env.LINKEDIN_MSG_WAIT_CLIP_MS || 800);
const MAX_ROUNDS = 12;

/** Copia texto para o clipboard do host (AVD costuma espelhar no Mac). */
export function copyToHostClipboard(text) {
  const s = String(text ?? "");
  const os = platform();
  if (os === "darwin") {
    const r = spawnSync("pbcopy", [], { input: s, encoding: "utf8" });
    if (r.status !== 0) {
      throw new Error(`pbcopy falhou: ${(r.stderr || r.error || "").toString()}`);
    }
    return { via: "pbcopy" };
  }
  if (os === "linux") {
    const r = spawnSync("xclip", ["-selection", "clipboard"], {
      input: s,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      const r2 = spawnSync("wl-copy", [], { input: s, encoding: "utf8" });
      if (r2.status !== 0) {
        throw new Error("clipboard: instale xclip ou wl-copy");
      }
      return { via: "wl-copy" };
    }
    return { via: "xclip" };
  }
  throw new Error(`clipboard host não suportado em ${os}`);
}

/**
 * Limpa o campo e cola a mensagem (acentos OK: Laércio, escritório…).
 * Requer espelhamento de clipboard do emulador (default no AVD Mac).
 */
export async function pasteCleanMessage(serial, text) {
  const s = String(text ?? "");
  if (!s.trim()) return;
  copyToHostClipboard(s);
  await sleep(WAIT_CLIP_MS);
  // limpa campo anterior
  for (let i = 0; i < 80; i++) {
    adb(serial, ["shell", "input", "keyevent", "KEYCODE_DEL"]);
  }
  adb(serial, ["shell", "input", "keyevent", "KEYCODE_PASTE"]);
  await sleep(400);
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

export function findSendButton(els, writeY = null) {
  for (const el of els || []) {
    const t = String(el?.text || "").trim();
    if (!/^send$/i.test(t)) continue;
    if (el.x == null || el.y == null) continue;
    return { text: t, x: el.x, y: el.y, via: "text" };
  }
  // Ícone avião à direita do campo (prints: ~x=500, mesma y do Write a message)
  const y0 = writeY != null ? writeY : 460;
  const icons = (els || []).filter(
    (e) =>
      e?.type === "icon" &&
      e.x != null &&
      e.y != null &&
      e.x >= 420 &&
      Math.abs(e.y - y0) <= 100,
  );
  if (icons.length) {
    icons.sort((a, b) => b.x - a.x);
    return { text: "icon", x: icons[0].x, y: icons[0].y, via: "icon" };
  }
  return { text: "geom", x: 500, y: y0, via: "geom" };
}

function isComposer(els) {
  return Boolean(
    findWriteAMessage(els) ||
      (els || []).some((e) => /new\s*message/i.test(String(e?.text || ""))),
  );
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

  const steps = [];
  const url = openProfileByUrl(serial, pkg, opts.url);
  steps.push(`view:${url}`);
  await sleep(WAIT_VIEW_MS);
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });
  await shot(serial, opts.outDir, "01-perfil.png");

  let openedComposer = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const els = await extract({ serial, engine: OCR, icons: true });
    const list = els || [];

    if (isComposer(list) && !openedComposer) {
      openedComposer = true;
      steps.push("composer");
      await shot(serial, opts.outDir, "02-composer.png");
    }

    // Já no composer: Write a message → type → Send
    if (openedComposer || isComposer(list)) {
      openedComposer = true;
      const write = findWriteAMessage(list);
      if (write) {
        steps.push(`write@${write.x},${write.y}`);
        if (!dryRun) {
          tapElement({ serial, x: write.x, y: write.y });
          await sleep(800);
          await pasteCleanMessage(serial, message);
          await sleep(WAIT_TAP_MS);
        }
        await shot(serial, opts.outDir, "03-typed.png");

        const after = await extract({ serial, engine: OCR, icons: true });
        const sendBtn = findSendButton(after || [], write.y);
        steps.push(`send@${sendBtn.x},${sendBtn.y}:${sendBtn.via}`);
        await shot(serial, opts.outDir, "04-before-send.png");
        if (!dryRun) {
          tapElement({ serial, x: sendBtn.x, y: sendBtn.y });
          await sleep(WAIT_TAP_MS);
        }
        await shot(serial, opts.outDir, "05-sent.png");
        return {
          ok: true,
          status: "sent",
          url,
          text: message,
          steps,
        };
      }
      // composer sem placeholder — campo já focado
      if (!dryRun && /new\s*message/i.test(JSON.stringify(list))) {
        steps.push("paste:focused");
        await pasteCleanMessage(serial, message);
        await sleep(WAIT_TAP_MS);
        const after = await extract({ serial, engine: OCR, icons: true });
        const sendBtn = findSendButton(after || [], 460);
        steps.push(`send@${sendBtn.x},${sendBtn.y}:${sendBtn.via}`);
        tapElement({ serial, x: sendBtn.x, y: sendBtn.y });
        await sleep(WAIT_TAP_MS);
        await shot(serial, opts.outDir, "05-sent.png");
        return { ok: true, status: "sent", url, text: message, steps };
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
