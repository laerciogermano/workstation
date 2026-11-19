/**
 * Lista conversas unread no LinkedIn (CDP / web).
 * Mesma interface de `../linkedin-unread-messages.js` (AVD).
 */
import { resolveProfileUrlByPeerName } from "../linkedin-unread-messages.js";
import { clickByTexts, shot, sleep } from "./linkedin-dom.js";
import { listProfileMessages } from "./linkedin-profile-messages.js";
import { withLinkedInPage } from "./session.js";

const UNREAD_URL = "https://www.linkedin.com/messaging/?filter=unread";
const MESSAGING_URL = "https://www.linkedin.com/messaging/";
const WAIT_MS = Number(process.env.LINKEDIN_UNREAD_WAIT_MS || 3_500);
const SCROLL_MS = Number(process.env.LINKEDIN_UNREAD_SCROLL_MS || 1_200);
const STABLE_NEEDED = Number(process.env.LINKEDIN_UNREAD_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_UNREAD_MAX_ROUNDS || 40);
const CHAT_MAX = Number(process.env.LINKEDIN_UNREAD_CHAT_MAX_RESULTS || 20);

export function isSponsoredUnread(row) {
  const msg = String(row?.message || "");
  return /^sponsored\b/i.test(msg.trim());
}

function mergeUnreadByName(merged, page) {
  const seen = new Set(
    merged.map((r) => String(r.name || "").toLowerCase().trim()),
  );
  const out = [...merged];
  for (const row of page || []) {
    const key = String(row?.name || "")
      .toLowerCase()
      .trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * Nome limpo do card unread.
 * Antes: `querySelector('…, .msg-conversation-listitem__link')` pegava o DIV
 * pai (1º no DOM) com a11y ("O status está off-line Nome … mensagem"), e o
 * sync falhava com `no-url` na API. Depois: só participant-names / h3 / aria.
 * @param {string} raw
 */
export function cleanUnreadPeerName(raw) {
  let s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  const aria = s.match(/^Selecionar conversa com\s+(.+)$/i);
  if (aria) s = aria[1].trim();
  s = s
    .replace(/^O status está (?:off-line|disponível|ausente)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  // Se ainda veio o bloco a11y inteiro, corta no 1º carimbo de data ("18 de nov.")
  const cut = s.match(
    /^(.+?)\s+\d{1,2}\s+de\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?/i,
  );
  if (cut) s = cut[1].trim();
  return s;
}

async function scrapeUnreadList(page) {
  return page.evaluate(`(() => {
    const clean = (raw) => {
      let s = String(raw || '').replace(/\\s+/g, ' ').trim();
      if (!s) return '';
      const aria = s.match(/^Selecionar conversa com\\s+(.+)$/i);
      if (aria) s = aria[1].trim();
      s = s
        .replace(/^O status está (?:off-line|disponível|ausente)\\s+/i, '')
        .replace(/\\s+/g, ' ')
        .trim();
      const cut = s.match(
        /^(.+?)\\s+\\d{1,2}\\s+de\\s+(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\\.?/i,
      );
      if (cut) s = cut[1].trim();
      return s;
    };
    const out = [];
    const items = [
      ...document.querySelectorAll(
        'li.msg-conversation-listitem, .msg-conversation-listitem, li.msg-conversation-card'
      ),
    ];
    for (const li of items) {
      // NÃO incluir .msg-conversation-listitem__link: é ancestral e vence o h3 no querySelector.
      const nameEl = li.querySelector(
        '.msg-conversation-listitem__participant-names, .msg-conversation-card__participant-names, h3.msg-conversation-listitem__participant-names, h3',
      );
      let name = clean(nameEl?.textContent || '');
      if (!name) {
        const aria =
          li.getAttribute('aria-label') ||
          li.querySelector('[aria-label]')?.getAttribute('aria-label') ||
          '';
        name = clean(aria);
      }
      if (!name) continue;
      const message =
        (
          li.querySelector(
            '.msg-conversation-listitem__message-snippet, .msg-conversation-card__message-snippet, .msg-conversation-listitem__summary p'
          )?.textContent || ''
        )
          .replace(/\\s+/g, ' ')
          .trim();
      const time =
        (
          li.querySelector('time, .msg-conversation-listitem__time-stamp')?.textContent ||
          ''
        )
          .replace(/\\s+/g, ' ')
          .trim();
      const badge =
        li.querySelector(
          '.notification-badge, .msg-conversation-card__unread-count, [class*="unread"]'
        )?.textContent || '';
      const unreadCount = Number(String(badge).replace(/\\D+/g, '')) || 1;
      const y = li.getBoundingClientRect().top;
      out.push({ name, message, unreadCount, time, y });
    }
    out.sort((a, b) => a.y - b.y);
    return out.map(({ name, message, unreadCount, time }) => ({
      name,
      message,
      unreadCount,
      time,
    }));
  })()`);
}

/**
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   maxResults: number,
 *   outDir?: string|null,
 *   sync?: boolean,
 *   closePage?: boolean,
 * }} opts
 */
export async function listUnreadMessages(opts) {
  const maxResults = Math.max(1, Math.floor(Number(opts.maxResults) || 1));
  const steps = [];

  return withLinkedInPage(opts, async (page) => {
    await page.goto(UNREAD_URL);
    steps.push(`goto:${UNREAD_URL}`);
    await sleep(WAIT_MS);
    await shot(page, opts.outDir, "01-messaging.png");

    // Se a URL filter não aplicou, tenta chip Unread
    let hasList = await page.evaluate(
      `!!document.querySelector('li.msg-conversation-listitem, .msg-conversation-listitem')`,
    );
    if (!hasList) {
      await page.goto(MESSAGING_URL);
      await sleep(WAIT_MS);
      await clickByTexts(page, ["Unread", "Não lidas", "Nao lidas"], { steps });
      await sleep(WAIT_MS);
      await shot(page, opts.outDir, "03-unread.png");
    } else {
      steps.push("unread:filter-url");
      await shot(page, opts.outDir, "03-unread.png");
    }

    let merged = [];
    let stable = 0;
    let prevCount = 0;

    for (let round = 0; round < MAX_ROUNDS && merged.length < maxResults; round++) {
      const pageRows = await scrapeUnreadList(page);
      merged = mergeUnreadByName(merged, pageRows);
      steps.push(`page:${round}:found=${pageRows.length}:total=${merged.length}`);
      if (merged.length >= maxResults) break;
      if (merged.length === prevCount) {
        stable += 1;
        if (stable >= STABLE_NEEDED) break;
      } else {
        stable = 0;
        prevCount = merged.length;
      }
      await page.scroll({
        dy: 360,
        steps: 10,
        selector: ".msg-conversations-container, .msg-conversation-listitem",
      }).catch(() => page.scroll({ dy: 360, steps: 10 }));
      await sleep(SCROLL_MS);
    }

    await shot(page, opts.outDir, "04-list.png");
    const conversations = merged.slice(0, maxResults).map((row) => ({
      name: cleanUnreadPeerName(row.name) || row.name,
      message: row.message,
      unreadCount: row.unreadCount,
      time: row.time,
    }));

    const synced = [];
    if (opts.sync) {
      for (const row of conversations) {
        if (isSponsoredUnread(row)) {
          steps.push(`sync:skip-sponsored:${row.name}`);
          synced.push({ name: row.name, skipped: "sponsored" });
          continue;
        }
        const peerName = cleanUnreadPeerName(row.name) || row.name;
        row.name = peerName;
        const profileUrl = await resolveProfileUrlByPeerName(peerName);
        if (!profileUrl) {
          steps.push(`sync:no-url:${peerName}`);
          synced.push({ name: peerName, skipped: "no-url" });
          continue;
        }
        steps.push(`sync:open:${row.name}`);
        try {
          const chat = await listProfileMessages({
            page,
            url: profileUrl,
            maxResults: CHAT_MAX,
            outDir: null,
            closePage: false,
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
  });
}

export { resolveProfileUrlByPeerName };
