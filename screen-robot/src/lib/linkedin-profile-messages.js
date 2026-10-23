/**
 * Lista as últimas mensagens de um perfil LinkedIn.
 *
 * Fluxo: stopAllApps → VIEW url → Message → (scroll up se precisar) → dump.
 * Cada item: sender, message, time, from ("me"|"peer").
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, sleep } from "./adb.js";
import { dumpUiXml, extractPreferDump } from "./extract.js";
import {
  findMoreOverflow,
  normalizeLinkedInProfileUrl,
  notifyLinkedInMessages,
  openProfileByUrl,
  resolveAgentId,
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
/** Espera pós-scroll (lista lazy do LinkedIn). */
const SCROLL_MS = Number(process.env.LINKEDIN_PM_SCROLL_MS || 1_400);
/** Swipe na lista (px). */
const SCROLL_DIST = Number(process.env.LINKEDIN_PM_SCROLL_DIST || 420);
/**
 * Para no topo quando a **página visível** não muda N vezes seguidas
 * (antes: só olhava total merged + TOP_CONFIRM → scroll eterno no topo).
 */
const PAGE_STABLE_NEEDED = Number(process.env.LINKEDIN_PM_PAGE_STABLE || 3);
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
  /** avatar imediatamente acima do próximo body → peer (só aquela bolha / grupo) */
  let peerBubblePending = false;

  for (const ev of events) {
    if (ev.kind === "sender") {
      const p = parseSenderNameLine(ev.text || "");
      curSender = p.sender;
      curTime = p.time;
      curFrom =
        peer && curSender.toLowerCase() === peer.toLowerCase() ? "peer" : "me";
      peerBubblePending = curFrom === "peer";
      continue;
    }
    if (ev.kind === "avatar") {
      peerBubblePending = true;
      continue;
    }
    if (ev.kind === "receipt") {
      // recibo sozinho não vira "me" se o bloco atual é peer
      continue;
    }
    if (ev.kind !== "body") continue;

    let sender = curSender || "unknown";
    let from = curFrom;
    let time = curTime;

    // avatar logo acima deste body e sem sender_name "me" recente na mesma faixa
    const avatarJustAbove = events.some(
      (e) =>
        e.kind === "avatar" && e.y <= ev.y && ev.y - e.y <= 40,
    );
    const senderJustAbove = [...events]
      .filter((e) => e.kind === "sender" && e.y <= ev.y && ev.y - e.y <= 60)
      .sort((a, b) => b.y - a.y)[0];

    if (senderJustAbove) {
      const p = parseSenderNameLine(senderJustAbove.text || "");
      sender = p.sender;
      time = p.time ?? time;
      from =
        peer && sender.toLowerCase() === peer.toLowerCase() ? "peer" : "me";
      curSender = sender;
      curTime = time;
      curFrom = from;
      peerBubblePending = from === "peer";
    } else if (avatarJustAbove && peer) {
      // avatar à esquerda = bolha do peer
      sender = peer;
      from = "peer";
      curSender = peer;
      curFrom = "peer";
      peerBubblePending = true;
    } else if (peerBubblePending && peer && curFrom === "peer") {
      // corpos seguidos do peer (sem novo sender_name)
      sender = peer;
      from = "peer";
    } else if (from === "unknown" || sender === "unknown") {
      from = "unknown";
      sender = "unknown";
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

/** Texto estável p/ dedupe (acento/case/espaços) — alinha com vendas/api. */
export function normalizeMessageBody(message) {
  return String(message || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {{ sender: string, message: string, time: string|null, from?: string }} m */
export function messageKey(m) {
  // from+corpo: "oi" meu ≠ "oi" do peer
  const from = m.from === "me" || m.from === "peer" ? m.from : "x";
  return `${from}|${normalizeMessageBody(m.message).slice(0, 200)}`;
}

function rankMsg(m) {
  let s = 0;
  if (m.time) s += 2;
  if (m.sender && m.sender !== "unknown" && m.sender !== "me") s += 2;
  if (m.from === "me" || m.from === "peer") s += 1;
  return s;
}

/** Antes do POST: 1 bolha por (from+texto); preferir sender/time. */
export function dedupeMessagesForDb(messages) {
  const map = new Map();
  for (const m of messages || []) {
    const key = messageKey(m);
    if (!key || key.endsWith("|")) continue;
    const prev = map.get(key);
    if (!prev || rankMsg(m) >= rankMsg(prev)) map.set(key, m);
  }
  // se existe "me" com o mesmo texto, descarta peer/unknown sem hora (falso positivo)
  const meBodies = new Set(
    [...map.values()]
      .filter((m) => m.from === "me")
      .map((m) => normalizeMessageBody(m.message)),
  );
  for (const [key, m] of [...map.entries()]) {
    if (m.from === "me") continue;
    const body = normalizeMessageBody(m.message);
    if (!meBodies.has(body)) continue;
    if (!m.time || m.from === "unknown") map.delete(key);
  }
  return [...map.values()];
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

/**
 * Swipe na lista do chat. `up` = conteúdo sobe = mensagens mais antigas.
 * Duração maior que o `scroll()` genérico (300ms) p/ o RecyclerView carregar.
 */
function scrollMessages(serial, direction) {
  const x = 270;
  const y = 360;
  const dist = SCROLL_DIST;
  const durationMs = 450;
  if (direction === "down") {
    // dedo sobe → ver mais recentes
    adb(serial, [
      "shell",
      "input",
      "swipe",
      String(x),
      String(y),
      String(x),
      String(Math.max(40, y - dist)),
      String(durationMs),
    ]);
    return;
  }
  // up: dedo desce
  adb(serial, [
    "shell",
    "input",
    "swipe",
    String(x),
    String(Math.max(80, y - 80)),
    String(x),
    String(y - 80 + dist),
    String(durationMs),
  ]);
}

/** Chat real: toolbar/composer — evita falso positivo de dump antigo com só message_list. */
function isMessagingChatXml(xml) {
  const s = String(xml || "");
  return (
    /messaging_toolbar_title|messaging_keyboard|Write a message/i.test(s) ||
    (/message_list/i.test(s) && /sender_name|message_sender_image|:id\/body\b/i.test(s))
  );
}

async function openComposer(serial, steps, outDir) {
  for (let round = 0; round < 10; round++) {
    const xml = dumpUiXml(serial);
    if (isMessagingChatXml(xml)) {
      steps.push(`composer:round${round}`);
      return true;
    }
    const els = await extractPreferDump({
      serial,
      engine: OCR,
      icons: true,
    });
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
  for (let i = 0; i < 4; i++) {
    scrollMessages(serial, "down");
    await sleep(700);
  }
  steps.push("scroll:bottom");

  let peer = null;
  /** @type {Array<{ sender: string, message: string, time: string|null, from: string }>} */
  let merged = [];
  let prevPageSig = "";
  let pageStable = 0;
  let emptyPages = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const xml = dumpUiXml(serial);
    const page = messagesFromUiXml(xml);
    if (page.peer) peer = page.peer;
    const before = merged.length;
    merged = mergeMessagesChronological(merged, page.messages);
    const pageSig = (page.messages || []).map((m) => messageKey(m)).join("|");
    steps.push(
      `page:${round}:found=${page.messages.length}:total=${merged.length}`,
    );
    if (merged.length > before) {
      steps.push(`grew:+${merged.length - before}`);
    }

    if (merged.length >= maxResults) {
      steps.push("stop:maxResults");
      break;
    }

    // tela vazia (dump no meio do swipe) — 2 seguidas = topo/fim
    if (!page.messages.length) {
      emptyPages += 1;
      if (emptyPages >= 2 && merged.length) {
        steps.push("stop:empty-page");
        break;
      }
    } else {
      emptyPages = 0;
    }

    // mesma página visível após swipe = já no topo (lista não anda)
    if (pageSig && pageSig === prevPageSig) {
      pageStable += 1;
      if (pageStable >= PAGE_STABLE_NEEDED) {
        steps.push(`stop:page-unchanged:${pageStable}`);
        break;
      }
    } else {
      pageStable = 0;
      prevPageSig = pageSig;
    }

    scrollMessages(serial, "up");
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

  let db = null;
  const forDb = dedupeMessagesForDb(messages).filter(
    (m) => m.from === "me" || m.from === "peer",
  );
  if (forDb.length) {
    try {
      db = await notifyLinkedInMessages({
        profileUrl: url,
        agentId: resolveAgentId(),
        peerName: peer,
        messages: forDb.map((m) => ({
          direction: m.from === "me" ? "sent" : "received",
          message: m.message,
          sender: m.sender && m.sender !== "unknown" ? m.sender : null,
          time: m.time,
        })),
      });
      steps.push(
        db.notified
          ? `db:messages:${db.data?.count ?? forDb.length}`
          : `db:skip:${db.reason}`,
      );
    } catch (e) {
      steps.push(`db:error:${String(e?.message || e).slice(0, 120)}`);
    }
  } else if (messages.length) {
    steps.push("db:skip:só unknown após dedupe");
  }

  return {
    ok: true,
    status: "ok",
    url,
    peer,
    maxResults,
    count: messages.length,
    messages,
    steps,
    db,
  };
}
