/**
 * Extrai as N conexões mais recentes (só dump/uiautomator):
 * deep link do perfil do agente → tap "N connections" → scroll/extract.
 *
 * URL: opts.profileUrl | LINKEDIN_PROFILE_URL | default https://www.linkedin.com/in/me/
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { extractBySense } from "./extract.js";
import {
  notifyRecentConnectionsAccepted,
  openProfileByUrl,
  normalizeLinkedInProfileUrl,
  resolveAgentId,
} from "./linkedin-connect.js";
import {
  connectionsFromExtract,
  mergeConnections,
} from "./linkedin-connections-list.js";
import {
  closeLinkedInApp,
  launch,
  scroll,
  screenshot,
  tapElement,
} from "./operate.js";

const SENSE = "dump";
const DEFAULT_PROFILE_URL = "https://www.linkedin.com/in/me/";
const WAIT_MS = Number(process.env.LINKEDIN_CONN_WAIT_MS || 3_000);
const SCROLL_MS = Number(process.env.LINKEDIN_CONN_SCROLL_MS || 1_200);
const SCROLL_DIST = Number(process.env.LINKEDIN_CONN_SCROLL_DIST || 280);
const STABLE_NEEDED = Number(process.env.LINKEDIN_CONN_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_CONN_MAX_ROUNDS || 80);

/** "272 connections" / "1,204 Connections" — número abstrato. */
const CONNECTIONS_COUNT_RE = /^[\d,.]+?\+?\s*connections?$/i;

async function tapConnectionsCount(serial, opts = {}) {
  const attempts = opts.attempts ?? 10;
  const maxY = opts.maxY ?? 800;
  for (let i = 1; i <= attempts; i++) {
    const els = await extractBySense({ serial, sense: SENSE });
    const hits = (els || [])
      .filter((e) => CONNECTIONS_COUNT_RE.test(String(e?.text || "").trim()))
      .filter((e) => e.x != null && e.y != null)
      .filter((e) => e.y <= maxY)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    if (hits.length) {
      const hit = hits[0];
      tapElement({ serial, x: hit.x, y: hit.y });
      return { text: hit.text, x: hit.x, y: hit.y };
    }
    await sleep(900);
  }
  throw new Error('contador "N connections" não encontrado no dump do perfil');
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

/**
 * @param {{
 *   serial: string,
 *   linkedinPackage?: string,
 *   n: number,
 *   outDir?: string|null,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   profileUrl?: string|null,
 *   closeApp?: boolean,
 * }} opts
 */
export async function extractRecentConnections(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const closeApp = opts.closeApp !== false;
  const steps = [];
  try {
    return await extractRecentConnectionsBody({
      ...opts,
      serial,
      pkg,
      steps,
    });
  } finally {
    if (closeApp) closeLinkedInApp({ serial, package: pkg, steps });
  }
}

/**
 * @param {{
 *   serial: string,
 *   pkg: string,
 *   n?: number,
 *   outDir?: string|null,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   profileUrl?: string|null,
 *   steps: string[],
 * }} opts
 */
async function extractRecentConnectionsBody(opts) {
  const { serial, pkg, steps } = opts;
  const n = Math.max(1, Math.floor(Number(opts.n) || 1));
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const profileUrl =
    normalizeLinkedInProfileUrl(
      opts.profileUrl ||
        process.env.LINKEDIN_PROFILE_URL ||
        process.env.AGENT_LINKEDIN_PROFILE_URL ||
        DEFAULT_PROFILE_URL,
    ) || DEFAULT_PROFILE_URL;

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  // Garante app; deep link abre o perfil (não usa menu/Network).
  await launch({ serial, package: pkg });
  await sleep(800);
  openProfileByUrl(serial, pkg, profileUrl);
  await sleep(WAIT_MS + 4_000);
  steps.push(`deeplink:${profileUrl}`);
  await shot(serial, opts.outDir, "01-profile.png");

  const hit = await tapConnectionsCount(serial);
  steps.push(`tap_connections_count:${hit.text}`);

  // Espera a lista (Connected on…) — dump do perfil ainda não tem cards.
  let listEls = [];
  for (let w = 1; w <= 15; w++) {
    await sleep(800);
    listEls = await extractBySense({ serial, sense: SENSE });
    const ready = (listEls || []).some((e) =>
      /^connected\s*on/i.test(String(e?.text || "").replace(/\s+/g, " ").trim()),
    );
    if (ready) {
      steps.push(`list_ready:wait${w}`);
      break;
    }
  }
  await shot(serial, opts.outDir, "02-connections-list.png");

  /** @type {Array<{ name: string, title: string|null, connectedOn: string|null }>} */
  let list = [];
  let stable = 0;
  let round = 0;

  while (list.length < n && round < MAX_ROUNDS) {
    round++;
    const els =
      round === 1 && listEls.length
        ? listEls
        : await extractBySense({ serial, sense: SENSE });
    const batch = connectionsFromExtract(els || []);
    const before = list.length;
    list = mergeConnections(list, batch);
    const gained = list.length - before;
    steps.push(`round${round}:+${gained}/total${list.length}`);

    if (list.length >= n) break;

    if (gained === 0) {
      stable++;
      if (stable >= STABLE_NEEDED) {
        steps.push("scroll_end");
        break;
      }
    } else {
      stable = 0;
    }

    scroll({ serial, direction: "down", distance: SCROLL_DIST });
    await sleep(SCROLL_MS);
  }

  const connections = list.slice(0, n).map(({ name, title, connectedOn }, i) => ({
    index: i + 1,
    name,
    title,
    connectedOn,
  }));

  await shot(serial, opts.outDir, "99-done.png");

  /** @type {{ notified: boolean, reason?: string, url?: string, data?: unknown, error?: string }} */
  let db = { notified: false, reason: "notify desligado" };
  if (notifyApi && connections.length) {
    try {
      db = await notifyRecentConnectionsAccepted({
        connections,
        agentId,
      });
      steps.push(
        db.notified
          ? `api:mark-accepted:ok:${db.data?.updated?.length ?? 0}`
          : `api:mark-accepted:skip:${db.reason}`,
      );
    } catch (e) {
      db = { notified: false, error: String(e?.message || e) };
      steps.push(`api:mark-accepted:fail:${db.error}`);
    }
  }

  return {
    ok: connections.length > 0,
    n,
    count: connections.length,
    connections,
    steps,
    truncated: connections.length < n,
    db,
    sense: SENSE,
    profileUrl,
  };
}
