/**
 * Extrair leads LinkedIn via People search (CDP / web).
 * Espelho do job AVD `login-extract-profiles` / CLI `linkedin-extract-leads-cdp.mjs`.
 *
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   query?: string,
 *   n?: number,
 *   maxProfiles?: number,
 *   outDir?: string|null,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   closePage?: boolean,
 * }} opts
 * @returns {Promise<{ ok: boolean, query: string, count: number, profiles: object[], steps: string[], truncated?: boolean }>}
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  connectionStatusFromInviteStatus,
  normalizeLinkedInProfileUrl,
  resolveAgentId,
  syncConnectionFromInviteStatus,
} from "../linkedin-connect.js";
import { shot, sleep } from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const SCROLL_STABLE = Number(process.env.EXTRACT_SCROLL_STABLE || 4);
const MAX_ROUNDS = 80;

function peopleSearchUrl(query) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

function apiBase() {
  return (
    process.env.PROFILES_API_URL ||
    process.env.INVITES_API_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

async function scrapeSearchCards(page) {
  return page.evaluate(`(() => {
    const out = [];
    const seen = new Set();
    const links = [...document.querySelectorAll('a[href*="/in/"]')];
    for (const a of links) {
      try {
        const u = new URL(a.href, location.origin);
        const m = u.pathname.match(/\\/in\\/([^/?#]+)/i);
        if (!m) continue;
        const slug = decodeURIComponent(m[1]).replace(/\\/+$/, '');
        if (!slug || /^(me|edit|detail)$/i.test(slug)) continue;
        const profileUrl = 'https://www.linkedin.com/in/' + slug + '/';
        if (seen.has(profileUrl)) continue;
        const card = a.closest('li') || a.closest('div') || a.parentElement;
        const text = (card?.innerText || a.innerText || '').replace(/\\s+/g, ' ').trim();
        if (!text || text.length < 3) continue;
        let action = null;
        if (/\\bpending\\b|pendente/i.test(text)) action = 'Pending';
        else if (/\\bmessage\\b|mensagem/i.test(text)) action = 'Message';
        else if (/\\bconnect\\b|conectar|convidar/i.test(text)) action = 'Connect';
        if (!action) continue;
        const name = (a.innerText || '')
          .replace(/\\s+/g, ' ')
          .trim()
          .split('·')[0]
          .replace(/\\s+(Conectar|Connect|Pendente|Pending|Mensagem|Message|Seguir|Follow)\\b.*$/i, '')
          .trim();
        if (!name || /^linkedin member$/i.test(name)) continue;
        seen.add(profileUrl);
        const lines = text.split(/(?<=\\.)\\s+|\\s{2,}/).map((s) => s.trim()).filter(Boolean);
        out.push({
          name,
          title: lines[1] || null,
          location: lines[2] || null,
          action,
          profileUrl,
        });
      } catch { /* ignore */ }
    }
    return out;
  })()`);
}

async function scrapeProfileHeader(page) {
  return page.evaluate(`(() => {
    const main = document.querySelector('main') || document.body;
    const lines = (main?.innerText || '')
      .split('\\n')
      .map((s) => s.replace(/\\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 40);
    const name = lines[0] || null;
    let title = null;
    let location = null;
    let mutualConnections = null;
    let inviteStatus = null;
    let canConnect = false;
    let canMessage = false;
    for (const line of lines.slice(1, 12)) {
      if (!title && line.length > 2 && !/^(connect|message|more|seguir|follow)/i.test(line)) {
        title = line;
        continue;
      }
      if (!location && /(brasil|brazil|,\\s*[A-Z]{2}\\b|remote|híbrido|hybrid)/i.test(line)) {
        location = line;
      }
      if (/mutual|em comum/i.test(line)) mutualConnections = line;
    }
    for (const el of document.querySelectorAll('button, [role=button], a')) {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || ''))
        .replace(/\\s+/g, ' ')
        .trim();
      if (/^pending\\b/i.test(t) || /^pendente\\b/i.test(t)) inviteStatus = 'pending';
      if (/^connect$/i.test(t) || /^conectar$/i.test(t) || /invite .+ to connect/i.test(t)) canConnect = true;
      if (/^message\\b/i.test(t) || /^mensagem\\b/i.test(t)) canMessage = true;
    }
    if (canConnect && !inviteStatus) inviteStatus = 'connect';
    if (canMessage && !canConnect && !inviteStatus) inviteStatus = 'connected';
    let profileUrl = null;
    try {
      const m = location.pathname.match(/\\/in\\/([^/?#]+)/i);
      if (m) profileUrl = 'https://www.linkedin.com/in/' + decodeURIComponent(m[1]).replace(/\\/+$/, '') + '/';
    } catch { /* */ }
    return {
      name,
      title,
      location,
      mutualConnections,
      inviteStatus,
      canConnect,
      canMessage,
      profileUrl,
      href: location.href,
    };
  })()`);
}

async function postProfile(profile, agentId) {
  const base = apiBase();
  if (!base) return { notified: false, reason: "sem API" };
  const headers = { "content-type": "application/json" };
  const key = String(process.env.AGENT_API_KEY || "").trim();
  if (key) headers["x-api-key"] = key;
  const res = await fetch(`${base}/profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...profile,
      agentId: agentId || resolveAgentId(),
    }),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return { notified: false, error: `${res.status} ${text.slice(0, 120)}` };
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { notified: true, data };
}

/**
 * @param {object} opts
 */
export async function extractLeads(opts = {}) {
  const query = String(opts.query || opts.q || "comprador").trim() || "comprador";
  const n = Math.max(
    1,
    Math.floor(Number(opts.n ?? opts.maxProfiles) || 5),
  );
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const steps = [];
  const searchUrl = peopleSearchUrl(query);

  return withLinkedInPage(opts, async (page) => {
    await page.goto(searchUrl);
    steps.push(`search:${query}`);
    await sleep(4_000);
    await shot(page, opts.outDir, "01-search.png");

    /** @type {object[]} */
    const profiles = [];
    const seen = new Set();
    let stable = 0;
    let prevVisible = 0;
    let round = 0;

    while (profiles.length < n && round < MAX_ROUNDS) {
      round++;
      const cards = await scrapeSearchCards(page);
      steps.push(`list-round:${round}:cards=${cards.length}`);
      if (opts.outDir) {
        mkdirSync(opts.outDir, { recursive: true });
        writeFileSync(
          join(opts.outDir, `list-round-${String(round).padStart(3, "0")}.json`),
          JSON.stringify(cards, null, 2),
        );
      }

      for (const card of cards) {
        if (profiles.length >= n) break;
        const url = normalizeLinkedInProfileUrl(card.profileUrl);
        if (!url || seen.has(url)) continue;
        seen.add(url);

        await page.goto(url);
        await sleep(2_500);
        const header = await scrapeProfileHeader(page);
        const profile = {
          name: header.name || card.name,
          title: header.title || card.title,
          location: header.location || card.location,
          profileUrl: header.profileUrl || url,
          mutualConnections: header.mutualConnections || null,
          inviteStatus: header.inviteStatus || null,
          canConnect: header.canConnect ?? null,
          canMessage: header.canMessage ?? null,
          action: card.action,
          query,
        };
        profiles.push(profile);
        steps.push(`profile:${profiles.length}:${profile.name}`);
        if (opts.outDir) {
          writeFileSync(
            join(
              opts.outDir,
              `profile-${String(profiles.length).padStart(3, "0")}-page.json`,
            ),
            JSON.stringify(profile, null, 2),
          );
        }

        if (notifyApi) {
          try {
            const posted = await postProfile(profile, agentId);
            steps.push(
              posted.notified
                ? "api:profiles:ok"
                : `api:profiles:skip:${posted.reason || posted.error}`,
            );
            const status = connectionStatusFromInviteStatus(
              profile.inviteStatus,
            );
            if (status != null) {
              await syncConnectionFromInviteStatus({
                profileUrl: profile.profileUrl,
                inviteStatus: profile.inviteStatus,
                agentId,
              });
              steps.push(`api:connection:${status}`);
            }
          } catch (e) {
            steps.push(`api:fail:${String(e?.message || e).slice(0, 80)}`);
          }
        }

        await page.goto(searchUrl);
        await sleep(2_000);
        // re-scroll até a profundidade atual
        for (let s = 0; s < round; s++) {
          await page.scroll({ dy: 500, steps: 8 });
          await sleep(400);
        }
      }

      if (profiles.length >= n) break;

      if (cards.length === prevVisible) {
        stable++;
        if (stable >= SCROLL_STABLE) {
          steps.push("scroll_end");
          break;
        }
      } else {
        stable = 0;
        prevVisible = cards.length;
      }
      await page.scroll({ dy: 520, steps: 10 });
      await sleep(1_200);
    }

    if (opts.outDir) {
      mkdirSync(opts.outDir, { recursive: true });
      writeFileSync(
        join(opts.outDir, "profiles.json"),
        JSON.stringify({ query, count: profiles.length, profiles }, null, 2),
      );
    }
    await shot(page, opts.outDir, "99-done.png");

    return {
      ok: profiles.length > 0,
      query,
      n,
      count: profiles.length,
      profiles,
      steps,
      truncated: profiles.length < n,
    };
  });
}
