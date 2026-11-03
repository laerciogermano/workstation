/**
 * Extrai as N conexões mais recentes (LinkedIn web / CDP).
 * Mesma interface de `../linkedin-extract-connections.js` (AVD).
 *
 * Lista: /mynetwork/invite-connect/connections/
 */
import {
  normalizeLinkedInProfileUrl,
  notifyRecentConnectionsAccepted,
  resolveAgentId,
} from "../linkedin-connect.js";
import { clickByTexts, shot, sleep } from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const CONNECTIONS_URL =
  "https://www.linkedin.com/mynetwork/invite-connect/connections/";
const DEFAULT_PROFILE_URL = "https://www.linkedin.com/in/me/";
const WAIT_MS = Number(process.env.LINKEDIN_CONN_WAIT_MS || 3_000);
const SCROLL_MS = Number(process.env.LINKEDIN_CONN_SCROLL_MS || 1_200);
const STABLE_NEEDED = Number(process.env.LINKEDIN_CONN_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_CONN_MAX_ROUNDS || 60);

function mergeConnections(list, batch) {
  const seen = new Set(
    list.map((c) => String(c.name || "").toLowerCase().trim()),
  );
  const out = [...list];
  for (const c of batch || []) {
    const key = String(c?.name || "")
      .toLowerCase()
      .trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

async function scrapeConnectionsPage(page) {
  return page.evaluate(`(() => {
    const out = [];
    const cards = [
      ...document.querySelectorAll(
        'li.mn-connection-card, .mn-connection-card, li.reusable-search__result-container, div.entity-result'
      ),
    ];
    const push = (name, title, connectedOn, href) => {
      const n = String(name || '').replace(/\\s+/g, ' ').trim();
      if (!n || n.length < 2) return;
      if (/^linkedin member$/i.test(n)) return;
      out.push({
        name: n,
        title: title ? String(title).replace(/\\s+/g, ' ').trim() : null,
        connectedOn: connectedOn ? String(connectedOn).replace(/\\s+/g, ' ').trim() : null,
        profileUrl: href || null,
      });
    };
    if (cards.length) {
      for (const card of cards) {
        const a = card.querySelector('a[href*="/in/"]');
        const href = a?.href || null;
        const name =
          card.querySelector('.mn-connection-card__name, .entity-result__title-text a, span[aria-hidden="true"]')?.textContent ||
          a?.textContent ||
          '';
        const title =
          card.querySelector('.mn-connection-card__occupation, .entity-result__primary-subtitle')?.textContent ||
          null;
        const connectedOn =
          card.querySelector('time, .mn-connection-card__connected-on, .entity-result__insights')?.textContent ||
          null;
        let connected = connectedOn;
        if (connected && /connected on/i.test(connected)) {
          connected = connected.replace(/^.*?connected on\\s*/i, '');
        }
        push(name, title, connected, href);
      }
      return out;
    }
    // fallback: linhas com /in/ + "Connected on"
    const links = [...document.querySelectorAll('a[href*="/in/"]')];
    for (const a of links) {
      const card = a.closest('li, div') || a.parentElement;
      if (!card) continue;
      const text = (card.innerText || '').replace(/\\s+/g, ' ').trim();
      const m = text.match(/connected on\\s+(.+?)(?:\\s{2}|$)/i);
      const name = (a.innerText || '').replace(/\\s+/g, ' ').trim().split('·')[0].trim();
      push(name, null, m ? m[1] : null, a.href);
    }
    return out;
  })()`);
}

/**
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   n?: number,
 *   outDir?: string|null,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   profileUrl?: string|null,
 *   closePage?: boolean,
 * }} opts
 */
export async function extractRecentConnections(opts) {
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
  const steps = [];

  return withLinkedInPage(opts, async (page) => {
    // Preferir lista canônica; se falhar, tenta contador no perfil.
    await page.goto(CONNECTIONS_URL);
    steps.push(`goto:${CONNECTIONS_URL}`);
    await sleep(WAIT_MS + 2_000);
    await shot(page, opts.outDir, "01-connections.png");

    let listReady = await page.evaluate(
      `!!document.querySelector('li.mn-connection-card, .mn-connection-card, a[href*="/in/"]')`,
    );
    if (!listReady) {
      await page.goto(profileUrl);
      steps.push(`deeplink:${profileUrl}`);
      await sleep(WAIT_MS + 2_000);
      await shot(page, opts.outDir, "01-profile.png");
      const tapped = await clickByTexts(
        page,
        ["connections", "conexões", "Connections", "Conexões"],
        { steps },
      );
      if (!tapped) {
        // link "N connections"
        const hit = await page.evaluate(`(() => {
          const a = [...document.querySelectorAll('a')].find((el) =>
            /\\d[\\d,.]*\\+?\\s*(connections|conexões)/i.test((el.innerText || '').trim())
          );
          if (!a) return null;
          const r = a.getBoundingClientRect();
          return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, text: (a.innerText || '').trim() };
        })()`);
        if (hit) {
          await page.clickAt(hit.cx, hit.cy);
          steps.push(`tap_connections_count:${hit.text}`);
        } else {
          return {
            ok: false,
            n,
            count: 0,
            connections: [],
            steps,
            truncated: true,
            db: { notified: false, reason: "lista inacessível" },
            profileUrl,
            error: 'contador "N connections" / lista não encontrados',
          };
        }
      }
      await sleep(WAIT_MS + 1_500);
      await shot(page, opts.outDir, "02-connections-list.png");
    }

    /** @type {Array<{ name: string, title: string|null, connectedOn: string|null }>} */
    let list = [];
    let stable = 0;
    let round = 0;

    while (list.length < n && round < MAX_ROUNDS) {
      round++;
      const batch = await scrapeConnectionsPage(page);
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
      await page.scroll({ dy: 480, steps: 10 });
      await sleep(SCROLL_MS);
    }

    const connections = list.slice(0, n).map(({ name, title, connectedOn }, i) => ({
      index: i + 1,
      name,
      title,
      connectedOn,
    }));

    await shot(page, opts.outDir, "99-done.png");

    let db = { notified: false, reason: "notify desligado" };
    if (notifyApi && connections.length) {
      try {
        db = await notifyRecentConnectionsAccepted({ connections, agentId });
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
      sense: "dom",
      profileUrl,
    };
  });
}
