/**
 * Lista as últimas mensagens de um perfil LinkedIn.
 *
 * Fluxo: stopAllApps → VIEW url → Message → (scroll up se precisar) → dump.
 * Cada item: sender, message, time, from ("me"|"peer").
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { dumpUiXml, extract } from "./extract.js";
import {
  findMoreOverflow,
  normalizeLinkedInProfileUrl,
  openProfileByUrl,
} from "./linkedin-connect.js";
import {
  findHeaderMessage,
  findSendMessageInSheet,
} from "./linkedin-message.js";
import {
  key,
  screenshot,
  scroll,
  stopAllApps,
  tapElement,
} from "./operate.js";

const OCR = process.env.SCREEN_ROBOT_OCR || "rapidocr";
const WAIT_VIEW_MS = Number(process.env.LINKEDIN_PM_WAIT_VIEW_MS || 8_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_PM_WAIT_TAP_MS || 3_000);
const SCROLL_MS = Number(process.env.LINKEDIN_PM_SCROLL_MS || 1_200);
const SCROLL_DIST = Number(process.env.LINKEDIN_PM_SCROLL_DIST || 280);
const STABLE_NEEDED = Number(process.env.LINKEDIN_PM_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_PM_MAX_ROUNDS || 40);

/**
 * "Matheus ConectMax  •  8:47 AM" | "Laércio Germano x  •  8:49 AM"
 * @param {string} text
 * @returns {{ sender: string, time: string|null }}
 */
export function parseSenderNameLine(text) {
  const s = String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/&#10;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const m = s.match(/^(.+?)\s*[•·]\s*(.+)$/);
  if (!m) return { sender: s, time: null };
  const sender = m[1].replace(/\s+x$/i, "").trim();
  return { sender, time: m[2].trim() };
}

/**
 * @param {string} xml
 * @returns {{ peer: string|null, messages: Array<{ sender: string, message: string, time: string|null, from: "me"|"peer"|"unknown", y: number }> }}
 */
export function messagesFromUiXml(xml) {
  let peer = null;
  /** @type {Array<{ kind: string, text?: string, y: number }>} */
  const events = [];

  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const r = ((n.match(/resource-id="([^"]*)"/) || [])[1] || "").split("/").pop();
    const raw = (n.match(/\btext="([^"]*)"/) || [])[1] || "";
    const text = raw
      .replace(/&#10;/g, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    const y = b ? Number(b[2]) : 0;

    if (r === "messaging_toolbar_title" && text.trim()) {
      peer = text.trim();
      continue;
    }
    if (r === "sender_name" && text.trim()) {
      events.push({ kind: "sender", text: text.trim(), y });
      continue;
    }
    if (r === "message_sender_image") {
      events.push({ kind: "avatar", y });
      continue;
    }
    if (r === "messaging_send_receipt_indicator") {
      events.push({ kind: "receipt", y });
      continue;
    }
    if (r === "body" && text.trim()) {
      events.push({ kind: "body", text, y });
    }
  }

  events.sort((a, b) => a.y - b.y || (a.kind === "sender" || a.kind === "avatar" ? -1 : 1));

  /** @type {Array<{ sender: string, message: string, time: string|null, from: "me"|"peer"|"unknown", y: number }>} */
  const messages = [];
  let curSender = null;
  let curTime = null;
  let curFrom = /** @type {"me"|"peer"|"unknown"} */ ("unknown");

  for (const ev of events) {
    if (ev.kind === "sender") {
      const p = parseSenderNameLine(ev.text || "");
      curSender = p.sender;
      curTime = p.time;
      curFrom =
        peer && curSender.toLowerCase() === peer.toLowerCase() ? "peer" : "me";
      continue;
    }
    if (ev.kind === "avatar") {
      // avatar do interlocutor na bolha → mensagens seguintes sem label são dele
      if (peer) {
        curSender = peer;
        curFrom = "peer";
      }
      continue;
    }
    if (ev.kind === "receipt") {
      // LinkedIn marca "Message sent" também em bolhas do peer — só usa se unknown
      if (curFrom === "unknown") {
        curFrom = "me";
        if (!curSender || curSender === "unknown") curSender = "me";
      }
      continue;
    }
    if (ev.kind !== "body") continue;

    let sender = curSender || "unknown";
    let from = curFrom;
    let time = curTime;
    const nearAvatar = events.some(
      (e) => e.kind === "avatar" && Math.abs(e.y - ev.y) <= 80,
    );
    // avatar na bolha (ou herdado do grupo) → sempre peer
    if (nearAvatar && peer) {
      sender = peer;
      from = "peer";
      curSender = peer;
      curFrom = "peer";
    } else if (from === "unknown" || sender === "unknown") {
      const nearReceipt = events.some(
        (e) => e.kind === "receipt" && Math.abs(e.y - ev.y) <= 50,
      );
      if (nearReceipt) {
        from = "me";
        if (sender === "unknown") sender = "me";
      }
    }

    messages.push({
      sender,
      message: ev.text || "",
      time,
      from,
      y: ev.y,
    });
  }

  return { peer, messages };
}

/** @param {{ sender: string, message: string, time: string|null }} m */
export function messageKey(m) {
  // sem sender: mesma bolha pode aparecer como unknown após scroll
  return `${m.time || ""}|${String(m.message || "").slice(0, 160)}`;
}

function rankMsg(m) {
  let s = 0;
  if (m.time) s += 2;
  if (m.sender && m.sender !== "unknown" && m.sender !== "me") s += 2;
  if (m.from === "me" || m.from === "peer") s += 1;
  return s;
}

/**
 * Merge: mantém ordem cronológica (mais antigo → mais recente).
 * Página nova (após scroll up) traz mensagens mais antigas → prepend das inéditas.
 */
export function mergeMessagesChronological(existing, pageMsgs) {
  const map = new Map();
  const order = [];
  const upsert = (m, atStart) => {
    const k = messageKey(m);
    const row = {
      sender: m.sender,
      message: m.message,
      time: m.time,
      from: m.from,
    };
    if (map.has(k)) {
      const prev = map.get(k);
      if (rankMsg(row) > rankMsg(prev)) map.set(k, row);
      return;
    }
    map.set(k, row);
    if (atStart) order.unshift(k);
    else order.push(k);
  };
  for (const m of existing || []) upsert(m, false);
  const existingKeys = new Set((existing || []).map(messageKey));
  const novel = (pageMsgs || []).filter((m) => !existingKeys.has(messageKey(m)));
  if (novel.length && existing?.length) {
    for (let i = novel.length - 1; i >= 0; i--) upsert(novel[i], true);
  } else {
    for (const m of pageMsgs || []) upsert(m, false);
  }
  return order.map((k) => map.get(k));
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

async function openComposer(serial, steps, outDir) {
  for (let round = 0; round < 10; round++) {
    const xml = dumpUiXml(serial);
    if (/message_list|messaging_keyboard|Write a message/i.test(xml)) {
      steps.push(`composer:round${round}`);
      return true;
    }
    const els = await extract({ serial, engine: OCR, icons: true });
    const msg = findHeaderMessage(els || []);
    if (msg) {
      steps.push(`message@${msg.x},${msg.y}`);
      tapElement({ serial, x: msg.x, y: msg.y });
      await sleep(WAIT_TAP_MS);
      continue;
    }
    const sheet = findSendMessageInSheet(els || []);
    if (sheet) {
      steps.push(`sheet-message@${sheet.x},${sheet.y}`);
      tapElement({ serial, x: sheet.x, y: sheet.y });
      await sleep(WAIT_TAP_MS);
      continue;
    }
    const more = findMoreOverflow(els || []);
    if (more) {
      steps.push(`more@${more.x},${more.y}`);
      tapElement({ serial, x: more.x, y: more.y });
      await sleep(WAIT_TAP_MS);
      continue;
    }
    await sleep(1_000);
  }
  await shot(serial, outDir, "02-composer-fail.png");
  return false;
}

/**
 * @param {{
 *   serial: string,
 *   linkedinPackage?: string,
 *   url: string,
 *   maxResults: number,
 *   outDir?: string|null,
 *   apps?: Record<string, { package?: string }>,
 * }} opts
 */
export async function listProfileMessages(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const maxResults = Math.max(1, Math.floor(Number(opts.maxResults) || 1));
  const steps = [];

  if (!normalizeLinkedInProfileUrl(opts.url)) {
    throw new Error(`URL inválida: ${opts.url}`);
  }
  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  const extras = Object.values(opts.apps || {})
    .map((a) => a?.package)
    .filter(Boolean);
  const { stopped } = stopAllApps({
    serial,
    extraPackages: [...extras, pkg],
  });
  steps.push(`stop-all:${stopped.length}`);
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(600);
  await shot(serial, opts.outDir, "00-home.png");

  const url = openProfileByUrl(serial, pkg, opts.url);
  steps.push(`view:${url}`);
  await sleep(WAIT_VIEW_MS);
  await shot(serial, opts.outDir, "01-perfil.png");

  const opened = await openComposer(serial, steps, opts.outDir);
  if (!opened) {
    return {
      ok: false,
      status: "failed",
      url,
      maxResults,
      messages: [],
      steps,
      error: "não abriu o chat do perfil",
    };
  }
  await shot(serial, opts.outDir, "02-chat.png");

  // garante fundo (mensagens mais recentes)
  for (let i = 0; i < 3; i++) {
    scroll({
      serial,
      direction: "down",
      distance: SCROLL_DIST,
      x: 270,
      y: 320,
    });
    await sleep(600);
  }
  steps.push("scroll:bottom");

  let peer = null;
  /** @type {Array<{ sender: string, message: string, time: string|null, from: string }>} */
  let merged = [];
  let stable = 0;
  let prevLen = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const xml = dumpUiXml(serial);
    const page = messagesFromUiXml(xml);
    if (page.peer) peer = page.peer;
    merged = mergeMessagesChronological(merged, page.messages);
    steps.push(`page:${round}:found=${page.messages.length}:total=${merged.length}`);

    if (merged.length >= maxResults) break;
    if (merged.length === prevLen) {
      stable += 1;
      if (stable >= STABLE_NEEDED) break;
    } else {
      stable = 0;
      prevLen = merged.length;
    }

    // sobe para carregar mensagens mais antigas
    scroll({
      serial,
      direction: "up",
      distance: SCROLL_DIST,
      x: 270,
      y: 320,
    });
    await sleep(SCROLL_MS);
  }

  await shot(serial, opts.outDir, "03-list.png");

  // últimas maxResults (mais recentes = final da lista cronológica)
  const slice = merged.slice(-maxResults);
  const messages = slice.map(({ sender, message, time, from }) => ({
    sender,
    message,
    time,
    from,
  }));

  return {
    ok: true,
    status: "ok",
    url,
    peer,
    maxResults,
    count: messages.length,
    messages,
    steps,
  };
}
