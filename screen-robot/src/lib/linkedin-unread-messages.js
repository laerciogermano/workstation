/**
 * Lista conversas unread no LinkedIn.
 *
 * Fluxo: stopAllApps → launch → Messaging → Unread → parse dump (até maxResults).
 * Cada item: name, message, unreadCount, time.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { dumpUiXml } from "./extract.js";
import {
  launch,
  screenshot,
  scroll,
  stopAllApps,
  tapElement,
} from "./operate.js";

const WAIT_MS = Number(process.env.LINKEDIN_UNREAD_WAIT_MS || 4_000);
const SCROLL_MS = Number(process.env.LINKEDIN_UNREAD_SCROLL_MS || 1_200);
const SCROLL_DIST = Number(process.env.LINKEDIN_UNREAD_SCROLL_DIST || 320);
const STABLE_NEEDED = Number(process.env.LINKEDIN_UNREAD_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_UNREAD_MAX_ROUNDS || 40);

/**
 * content-desc: "Button, Name, Message, Time, N unread message(s)"
 * @param {string} desc
 * @returns {{ name: string, message: string, unreadCount: number, time: string }|null}
 */
export function parseUnreadConversationDesc(desc) {
  const s = String(desc || "")
    .replace(/&#10;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const m = s.match(
    /^Button,\s*(.+?),\s*(.+?),\s*(.+?),\s*(\d+)\s+unread messages?$/i,
  );
  if (!m) return null;
  return {
    name: m[1].trim(),
    message: m[2].trim(),
    time: m[3].trim(),
    unreadCount: Number(m[4]),
  };
}

/**
 * @param {string} xml
 * @returns {Array<{ name: string, message: string, unreadCount: number, time: string, y: number }>}
 */
export function unreadConversationsFromUiXml(xml) {
  /** @type {Array<{ name: string, message: string, unreadCount: number, time: string, y: number }>} */
  const out = [];
  const seen = new Set();
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!/messaging_conversation_list_item_container/.test(n)) continue;
    if (!/clickable="true"/.test(n)) continue;
    const desc = (n.match(/content-desc="([^"]*)"/) || [])[1] || "";
    const parsed = parseUnreadConversationDesc(desc);
    if (!parsed) continue;
    const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    const y = b ? Number(b[2]) : 0;
    const keyName = parsed.name.toLowerCase();
    if (seen.has(keyName)) continue;
    seen.add(keyName);
    out.push({ ...parsed, y });
  }
  out.sort((a, b) => a.y - b.y);
  return out;
}

/** @param {string} xml @returns {{ x: number, y: number }|null} */
export function findMessagingIconInXml(xml) {
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!/home_messaging|content-desc="messaging/i.test(n)) continue;
    if (!/clickable="true"/.test(n)) continue;
    const m = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!m) continue;
    return {
      x: Math.floor((Number(m[1]) + Number(m[3])) / 2),
      y: Math.floor((Number(m[2]) + Number(m[4])) / 2),
    };
  }
  return null;
}

/** @param {string} xml @returns {{ x: number, y: number }|null} */
export function findUnreadChipInXml(xml) {
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    if (!/messaging_filter_chip/.test(n)) continue;
    if (!/\btext="Unread"/.test(n)) continue;
    if (!/clickable="true"/.test(n)) continue;
    const m = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!m) continue;
    return {
      x: Math.floor((Number(m[1]) + Number(m[3])) / 2),
      y: Math.floor((Number(m[2]) + Number(m[4])) / 2),
    };
  }
  return null;
}

/**
 * @param {Array<{ name: string }>} a
 * @param {Array<{ name: string }>} b
 */
export function mergeUnreadByName(a, b) {
  const map = new Map();
  for (const row of [...(a || []), ...(b || [])]) {
    const k = String(row?.name || "")
      .toLowerCase()
      .trim();
    if (!k) continue;
    if (!map.has(k)) map.set(k, row);
  }
  return [...map.values()];
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

/**
 * @param {{
 *   serial: string,
 *   linkedinPackage?: string,
 *   maxResults: number,
 *   outDir?: string|null,
 * }} opts
 */
export async function listUnreadMessages(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const maxResults = Math.max(1, Math.floor(Number(opts.maxResults) || 1));
  const steps = [];

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  const { stopped } = stopAllApps({
    serial,
    extraPackages: [pkg],
  });
  steps.push(`stop-all:${stopped.length}`);
  await sleep(600);

  await launch({ serial, package: pkg });
  await sleep(WAIT_MS + 4_000);
  steps.push("launch");
  await shot(serial, opts.outDir, "01-home.png");

  let xml = dumpUiXml(serial);
  let msgIcon = findMessagingIconInXml(xml);
  if (!msgIcon) {
    await sleep(2_000);
    xml = dumpUiXml(serial);
    msgIcon = findMessagingIconInXml(xml);
  }
  if (!msgIcon) {
    return {
      ok: false,
      status: "failed",
      maxResults,
      conversations: [],
      steps,
      error: "ícone Messaging não encontrado",
    };
  }
  steps.push(`messaging@${msgIcon.x},${msgIcon.y}`);
  tapElement({ serial, x: msgIcon.x, y: msgIcon.y });
  await sleep(WAIT_MS);
  await shot(serial, opts.outDir, "02-messaging.png");

  xml = dumpUiXml(serial);
  let unreadChip = findUnreadChipInXml(xml);
  if (!unreadChip) {
    await sleep(1_500);
    xml = dumpUiXml(serial);
    unreadChip = findUnreadChipInXml(xml);
  }
  if (!unreadChip) {
    return {
      ok: false,
      status: "failed",
      maxResults,
      conversations: [],
      steps,
      error: "filtro Unread não encontrado",
    };
  }
  steps.push(`unread@${unreadChip.x},${unreadChip.y}`);
  tapElement({ serial, x: unreadChip.x, y: unreadChip.y });
  await sleep(WAIT_MS);
  await shot(serial, opts.outDir, "03-unread.png");

  /** @type {Array<{ name: string, message: string, unreadCount: number, time: string }>} */
  let merged = [];
  let stable = 0;
  let prevCount = 0;

  for (let round = 0; round < MAX_ROUNDS && merged.length < maxResults; round++) {
    xml = dumpUiXml(serial);
    const page = unreadConversationsFromUiXml(xml);
    merged = mergeUnreadByName(merged, page);
    steps.push(`page:${round}:found=${page.length}:total=${merged.length}`);

    if (merged.length >= maxResults) break;
    if (merged.length === prevCount) {
      stable += 1;
      if (stable >= STABLE_NEEDED) break;
    } else {
      stable = 0;
      prevCount = merged.length;
    }

    scroll({
      serial,
      direction: "down",
      distance: SCROLL_DIST,
      x: 270,
      y: 550,
    });
    await sleep(SCROLL_MS);
  }

  await shot(serial, opts.outDir, "04-list.png");
  const conversations = merged.slice(0, maxResults).map((row) => ({
    name: row.name,
    message: row.message,
    unreadCount: row.unreadCount,
    time: row.time,
  }));

  return {
    ok: true,
    status: "ok",
    maxResults,
    count: conversations.length,
    conversations,
    steps,
  };
}
