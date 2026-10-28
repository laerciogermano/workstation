/**
 * Extrai as N conexões mais recentes (só dump/uiautomator):
 * 1) Se já na lista (Connected on…) → extrai
 * 2) Senão: abre perfil do agente (deep link) se houver URL
 * 3) Tap em "N connections" (número variável) → lista → scroll/extract
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { sleep } from "./adb.js";
import { extractBySense, findByText } from "./extract.js";
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
import { key, launch, scroll, screenshot, tapElement } from "./operate.js";

/** Sempre dump — não usa OCR neste fluxo. */
const SENSE = "dump";
const WAIT_MS = Number(process.env.LINKEDIN_CONN_WAIT_MS || 3_000);
const SCROLL_MS = Number(process.env.LINKEDIN_CONN_SCROLL_MS || 1_200);
const SCROLL_DIST = Number(process.env.LINKEDIN_CONN_SCROLL_DIST || 280);
const STABLE_NEEDED = Number(process.env.LINKEDIN_CONN_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_CONN_MAX_ROUNDS || 80);

/** "272 connections" / "1,204 Connections" — número abstrato. */
const CONNECTIONS_COUNT_RE = /^[\d,.]+?\+?\s*connections?$/i;

async function tapQueries(serial, queries, label, opts = {}) {
  const list = Array.isArray(queries) ? queries : [queries];
  const attempts = opts.attempts ?? 5;
  const minScore = opts.minScore ?? 0.75;
  for (let i = 1; i <= attempts; i++) {
    for (const q of list) {
      const hit = await findByText(serial, q, { sense: SENSE, minScore });
      if (hit?.x != null && hit?.y != null) {
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

/**
 * Tap no contador "N connections" do perfil (número qualquer).
 * @returns {Promise<{ text: string, x: number, y: number }>}
 */
async function tapConnectionsCount(serial, opts = {}) {
  const attempts = opts.attempts ?? 8;
  const maxY = opts.maxY ?? 700;
  for (let i = 1; i <= attempts; i++) {
    const els = await extractBySense({ serial, sense: SENSE });
    const hits = (els || [])
      .filter((e) => CONNECTIONS_COUNT_RE.test(String(e?.text || "").trim()))
      .filter((e) => e.x != null && e.y != null)
      .filter((e) => (opts.minY == null || e.y >= opts.minY) && e.y <= maxY)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    if (hits.length) {
      const hit = hits[0];
      tapElement({ serial, x: hit.x, y: hit.y });
      return { text: hit.text, x: hit.x, y: hit.y };
    }
    await sleep(800);
  }
  throw new Error('contador "N connections" não encontrado no dump');
}

function isConnectionsList(els) {
  const list = els || [];
  const connected = list.filter((e) =>
    /^connected\s*on/i.test(String(e?.text || "").replace(/\s+/g, " ").trim()),
  ).length;
  if (connected >= 1) return true;
  const header = list.some((e) => {
    const t = String(e?.text || "").trim();
    return /^connections$/i.test(t) && (e.y || 0) < 200;
  });
  const count = list.some((e) =>
    /^\d[\d,.]*\+?\s*connections?$/i.test(String(e?.text || "").trim()),
  );
  return header && count;
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

async function ensureLinkedInForeground(serial, pkg) {
  // Não dá stop — preserva sessão/tela. Só traz o app se preciso.
  await launch({ serial, package: pkg });
  await sleep(1_500);
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
 * }} opts
 */
export async function extractRecentConnections(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const n = Math.max(1, Math.floor(Number(opts.n) || 1));
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const profileUrl =
    normalizeLinkedInProfileUrl(
      opts.profileUrl ||
        process.env.LINKEDIN_PROFILE_URL ||
        process.env.AGENT_LINKEDIN_PROFILE_URL ||
        "",
    ) || null;
  const steps = [];

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });

  await ensureLinkedInForeground(serial, pkg);
  steps.push("foreground");
  await shot(serial, opts.outDir, "01-start.png");

  let els = await extractBySense({ serial, sense: SENSE });
  if (!isConnectionsList(els)) {
    if (profileUrl) {
      openProfileByUrl(serial, pkg, profileUrl);
      await sleep(WAIT_MS + 4_000);
      steps.push(`profile:${profileUrl}`);
      await shot(serial, opts.outDir, "02-profile.png");
    } else {
      // Sem URL: tenta tab Network e perfil já aberto com contador.
      const hasTab = (els || []).some(
        (e) =>
          /^network$/i.test(String(e?.text || "").trim()) &&
          (e.y || 0) >= 700,
      );
      if (hasTab) {
        await tapQueries(serial, ["Network", "My Network"], "Network", {
          minY: 700,
          minScore: 0.8,
        });
        await sleep(WAIT_MS);
        steps.push("network");
      } else {
        // Pode estar em sub-tela: BACK leve até achar tab ou contador
        for (let back = 0; back < 3; back++) {
          els = await extractBySense({ serial, sense: SENSE });
          if (isConnectionsList(els)) break;
          if (
            (els || []).some((e) =>
              CONNECTIONS_COUNT_RE.test(String(e?.text || "").trim()),
            )
          ) {
            break;
          }
          key({ serial, code: "KEYCODE_BACK" });
          await sleep(800);
        }
        steps.push("back_or_stay");
      }
      await shot(serial, opts.outDir, "02-before-count.png");
    }

    els = await extractBySense({ serial, sense: SENSE });
    if (!isConnectionsList(els)) {
      const hit = await tapConnectionsCount(serial, { maxY: 750 });
      await sleep(WAIT_MS + 1_500);
      steps.push(`tap_connections_count:${hit.text}`);
      await shot(serial, opts.outDir, "03-connections-list.png");
    } else {
      steps.push("already_connections_list");
    }
  } else {
    steps.push("already_connections_list");
  }

  /** @type {Array<{ name: string, title: string|null, connectedOn: string|null }>} */
  let list = [];
  let stable = 0;
  let round = 0;

  while (list.length < n && round < MAX_ROUNDS) {
    round++;
    els = await extractBySense({ serial, sense: SENSE });
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
