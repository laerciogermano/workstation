/**
 * Extrai as N conexões mais recentes:
 * LinkedIn → Network → Manage my network → Connections → scroll (só dump/uiautomator).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { extractBySense, findByText } from "./extract.js";
import {
  notifyRecentConnectionsAccepted,
  resolveAgentId,
} from "./linkedin-connect.js";
import {
  connectionsFromExtract,
  mergeConnections,
} from "./linkedin-connections-list.js";
import { key, launch, scroll, screenshot, stop, tapElement } from "./operate.js";

/** Sempre dump — não usa OCR neste fluxo. */
const SENSE = "dump";
const WAIT_MS = Number(process.env.LINKEDIN_CONN_WAIT_MS || 3_000);
const SCROLL_MS = Number(process.env.LINKEDIN_CONN_SCROLL_MS || 1_200);
const SCROLL_DIST = Number(process.env.LINKEDIN_CONN_SCROLL_DIST || 280);
const STABLE_NEEDED = Number(process.env.LINKEDIN_CONN_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_CONN_MAX_ROUNDS || 80);

async function tapQueries(serial, queries, label, opts = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  const attempts = opts.attempts ?? 5;
  const minScore = opts.minScore ?? 0.75;
  for (let i = 1; i <= attempts; i++) {
    for (const q of list) {
      const hit = await findByText(serial, q, { sense: SENSE, minScore });
      if (hit?.x != null && hit?.y != null) {
        // Network da tab bar: y alto; evita "Network" em Settings etc.
        if (opts.minY != null && hit.y < opts.minY) continue;
        if (opts.maxY != null && hit.y > opts.maxY) continue;
        tapElement({ serial, x: hit.x, y: hit.y });
        return { ...hit, query: q, label };
      }
    }
    await sleep(800);
  }
  throw new Error(`${label}: não encontrado (${list.join(" | ")})`);
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
 * }} opts
 */
export async function extractRecentConnections(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const n = Math.max(1, Math.floor(Number(opts.n) || 1));
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const steps = [];

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  try {
    stop({ serial, package: pkg });
  } catch {
    /* ignore */
  }
  key({ serial, code: "KEYCODE_HOME" });
  await sleep(500);
  await launch({ serial, package: pkg });
  await sleep(WAIT_MS + 6_000);
  steps.push("launch");
  await shot(serial, opts.outDir, "01-home.png");

  // Garante tab bar (Home/Network) — se ainda em Connections, BACK até achar
  for (let back = 0; back < 4; back++) {
    const els = await extractBySense({ serial, sense: SENSE });
    const hasTab = (els || []).some(
      (e) =>
        /^network$/i.test(String(e?.text || "").trim()) &&
        (e.y || 0) >= 700,
    );
    if (hasTab) break;
    key({ serial, code: "KEYCODE_BACK" });
    await sleep(1_000);
  }

  await tapQueries(serial, ["Network", "My Network"], "Network", {
    minY: 700,
    minScore: 0.8,
  });
  await sleep(WAIT_MS);
  steps.push("network");
  await shot(serial, opts.outDir, "02-network.png");

  await tapQueries(
    serial,
    ["Manage my network", "Manage mynetwork", "Managemynetwork", "Manage"],
    "Manage my network",
    { minScore: 0.72 },
  );
  await sleep(WAIT_MS);
  steps.push("manage");
  await shot(serial, opts.outDir, "03-manage.png");

  await tapQueries(serial, ["Connections"], "Connections", {
    maxY: 400,
    minScore: 0.85,
  });
  await sleep(WAIT_MS + 1_000);
  steps.push("connections");
  await shot(serial, opts.outDir, "04-list.png");

  /** @type {Array<{ name: string, title: string|null, connectedOn: string|null }>} */
  let list = [];
  let stable = 0;
  let round = 0;

  while (list.length < n && round < MAX_ROUNDS) {
    round++;
    const els = await extractBySense({ serial, sense: SENSE });
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
  };
}
