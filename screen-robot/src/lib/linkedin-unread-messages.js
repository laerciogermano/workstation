/**
 * Lista conversas unread no LinkedIn.
 *
 * Fluxo: stopAllApps → launch → Messaging → Unread → parse dump (até maxResults).
 * Cada item: name, message, unreadCount, time.
 * Com `sync: true`: resolve URL na API e abre cada chat → `client_linkedin_message`.
 * Ao finalizar → force-stop LinkedIn (`closeApp: false` para pular).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { dumpUiXml } from "./extract.js";
import {
  messagesApiBase,
  normalizeLinkedInProfileUrl,
} from "./linkedin-connect.js";
import { listProfileMessages } from "./linkedin-profile-messages.js";
import {
  closeLinkedInApp,
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
const CHAT_MAX = Number(process.env.LINKEDIN_UNREAD_CHAT_MAX_RESULTS || 20);

/** Sponsored / ads na lista Unread — não abrir. */
export function isSponsoredUnread(row) {
  const msg = String(row?.message || "");
  return /^sponsored\b/i.test(msg.trim());
}

/**
 * Resolve profileUrl via GET /clientes?q=nome (match exato case-insensitive).
 * @param {string} name
 * @returns {Promise<string|null>}
 */
export async function resolveProfileUrlByPeerName(name) {
  const peer = String(name || "").replace(/\s+/g, " ").trim();
  if (!peer) return null;
  const base = messagesApiBase();
  if (!base) return null;
  const url = `${base}/clientes?q=${encodeURIComponent(peer)}&limit=20`;
  const headers = {};
  const apiKey = String(process.env.AGENT_API_KEY || "").trim();
  if (apiKey) headers["x-api-key"] = apiKey;
  let res;
  try {
    res = await fetch(url, { headers });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  const rows = Array.isArray(data) ? data : data?.data || [];
  const want = peer.toLowerCase();
  const exact = rows.find(
    (r) => String(r?.nome || "").replace(/\s+/g, " ").trim().toLowerCase() === want,
  );
  const hit = exact || rows[0];
  const raw = hit?.linkedin?.profileUrl || hit?.profileUrl || null;
  return normalizeLinkedInProfileUrl(raw);
}

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
 *   sync?: boolean,
 *   apps?: object,
 * }} opts
 */
export async function listUnreadMessages(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const closeApp = opts.closeApp !== false;
  const steps = [];
  try {
    return await listUnreadMessagesBody({ ...opts, serial, pkg, steps });
  } finally {
    if (closeApp) closeLinkedInApp({ serial, package: pkg, steps });
  }
}

/**
 * @param {{
 *   serial: string,
 *   pkg: string,
 *   maxResults?: number,
 *   outDir?: string|null,
 *   sync?: boolean,
 *   apps?: object,
 *   steps: string[],
 * }} opts
 */
async function listUnreadMessagesBody(opts) {
  const { serial, pkg, steps } = opts;
  const maxResults = Math.max(1, Math.floor(Number(opts.maxResults) || 1));

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

  /** @type {Array<object>} */
  const synced = [];
  if (opts.sync) {
    for (const row of conversations) {
      if (isSponsoredUnread(row)) {
        steps.push(`sync:skip-sponsored:${row.name}`);
        synced.push({ name: row.name, skipped: "sponsored" });
        continue;
      }
      const profileUrl = await resolveProfileUrlByPeerName(row.name);
      if (!profileUrl) {
        steps.push(`sync:no-url:${row.name}`);
        synced.push({ name: row.name, skipped: "no-url" });
        continue;
      }
      steps.push(`sync:open:${row.name}`);
      try {
        const chat = await listProfileMessages({
          serial,
          linkedinPackage: pkg,
          url: profileUrl,
          maxResults: CHAT_MAX,
          outDir: null,
          apps: opts.apps,
          closeApp: false,
        });
        steps.push(
          `sync:done:${row.name}:msgs=${chat.count ?? 0}:db=${
            chat.db?.notified ? "ok" : chat.db?.reason || "no"
          }`,
        );
        synced.push({
          name: row.name,
          profileUrl,
          ok: Boolean(chat.ok),
          count: chat.count ?? 0,
          db: chat.db || null,
          error: chat.error || null,
        });
      } catch (e) {
        const err = String(e?.message || e).slice(0, 160);
        steps.push(`sync:error:${row.name}:${err}`);
        synced.push({ name: row.name, profileUrl, ok: false, error: err });
      }
    }
  }

  return {
    ok: true,
    status: "ok",
    maxResults,
    count: conversations.length,
    conversations,
    steps,
    ...(opts.sync ? { synced } : {}),
  };
}
