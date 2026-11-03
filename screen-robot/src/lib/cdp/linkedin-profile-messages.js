/**
 * Lista as últimas mensagens de um perfil LinkedIn (CDP / web).
 * Mesma interface de `../linkedin-profile-messages.js` (AVD).
 */
import {
  normalizeLinkedInProfileUrl,
  notifyLinkedInMessages,
  resolveAgentId,
} from "../linkedin-connect.js";
import {
  clickByTexts,
  profileSignals,
  shot,
  sleep,
} from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const WAIT_VIEW_MS = Number(process.env.LINKEDIN_PM_WAIT_VIEW_MS || 5_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_PM_WAIT_TAP_MS || 2_000);
const SCROLL_MS = Number(process.env.LINKEDIN_PM_SCROLL_MS || 1_200);
const PAGE_STABLE_NEEDED = Number(process.env.LINKEDIN_PM_PAGE_STABLE || 3);
const MAX_ROUNDS = Number(process.env.LINKEDIN_PM_MAX_ROUNDS || 30);

function messageKey(m) {
  return `${m.from}|${m.sender}|${String(m.message || "").slice(0, 80)}|${m.time || ""}`;
}

function mergeMessagesChronological(merged, page) {
  const seen = new Set(merged.map(messageKey));
  const out = [...merged];
  for (const m of page || []) {
    const k = messageKey(m);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  return out;
}

async function scrapeThread(page) {
  return page.evaluate(`(() => {
    const peerEl =
      document.querySelector('.msg-overlay-bubble-header__title, .msg-entity-lockup__entity-title, h2.msg-overlay-bubble-header__title') ||
      document.querySelector('.msg-thread__link-to-profile');
    const peer = peerEl ? (peerEl.textContent || '').replace(/\\s+/g, ' ').trim() : null;
    const events = [];
    const list =
      document.querySelector('.msg-s-message-list, .msg-s-message-list-content, ul.msg-s-message-list-content') ||
      document.querySelector('[class*="msg-s-message-list"]');
    const items = list
      ? [...list.querySelectorAll('li, .msg-s-message-list__event, .msg-s-event-listitem')]
      : [...document.querySelectorAll('.msg-s-event-listitem, .msg-s-message-group')];
    for (const item of items) {
      const r = item.getBoundingClientRect();
      const y = r.top;
      const senderEl = item.querySelector('.msg-s-message-group__name, .msg-s-message-group__profile-link, time')?.previousElementSibling;
      const nameEl = item.querySelector(
        '.msg-s-message-group__name, a.msg-s-message-group__profile-link, .msg-s-message-group__meta .msg-s-message-group__profile-link'
      );
      const timeEl = item.querySelector('time, .msg-s-message-group__timestamp, .msg-s-message-group__meta time');
      const bodyEl = item.querySelector(
        '.msg-s-event-listitem__body, .msg-s-event__content, p.msg-s-event-listitem__body, .msg-s-event-listitem__message-bubble'
      );
      const body = (bodyEl?.innerText || bodyEl?.textContent || '').replace(/\\s+/g, ' ').trim();
      if (!body) continue;
      const sender = (nameEl?.textContent || '').replace(/\\s+/g, ' ').trim() || null;
      const time = (timeEl?.getAttribute('datetime') || timeEl?.textContent || '').replace(/\\s+/g, ' ').trim() || null;
      const mine =
        item.classList.contains('msg-s-event-listitem--other') === false &&
        (!!item.querySelector('.msg-s-event-listitem__link[href*="/in/me"]') ||
          /msg-s-message-group--self|msg-s-event-listitem--self|from-me/i.test(item.className) ||
          !!item.closest('.msg-s-message-group--self'));
      // heurística: bolha alinhada à direita ≈ me
      const fromRight = r.left > innerWidth * 0.35 && !nameEl;
      let from = 'unknown';
      if (mine || fromRight) from = 'me';
      else if (sender || item.classList.contains('msg-s-event-listitem--other')) from = 'peer';
      events.push({
        sender: sender || (from === 'me' ? 'me' : peer || 'unknown'),
        message: body,
        time,
        from,
        y,
      });
    }
    events.sort((a, b) => a.y - b.y);
    return {
      peer,
      messages: events.map(({ sender, message, time, from }) => ({
        sender,
        message,
        time,
        from,
      })),
    };
  })()`);
}

/**
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   url: string,
 *   maxResults: number,
 *   outDir?: string|null,
 *   closePage?: boolean,
 *   agentId?: string,
 * }} opts
 */
export async function listProfileMessages(opts) {
  const maxResults = Math.max(1, Math.floor(Number(opts.maxResults) || 1));
  const url = normalizeLinkedInProfileUrl(opts.url);
  if (!url) throw new Error(`URL inválida: ${opts.url}`);
  const steps = [];

  return withLinkedInPage(opts, async (page) => {
    await page.goto(url);
    steps.push(`view:${url}`);
    await sleep(WAIT_VIEW_MS);
    await shot(page, opts.outDir, "01-perfil.png");

    let opened = false;
    for (let i = 0; i < 8 && !opened; i++) {
      const already = await page.evaluate(
        `!!document.querySelector('.msg-overlay-conversation-bubble, .msg-s-message-list, div.msg-form__contenteditable')`,
      );
      if (already) {
        opened = true;
        break;
      }
      const sig = await profileSignals(page);
      if (sig.hasMessage) {
        await clickByTexts(
          page,
          ["Message", "Mensagem", "Send a message", "Enviar mensagem"],
          { steps },
        );
        await sleep(WAIT_TAP_MS);
        continue;
      }
      if (sig.hasMore) {
        await clickByTexts(page, ["More", "Mais"], { steps });
        await sleep(WAIT_TAP_MS);
        await clickByTexts(page, ["Message", "Mensagem", "Send a message"], {
          steps,
        });
        await sleep(WAIT_TAP_MS);
        continue;
      }
      await sleep(800);
    }

    if (!opened) {
      const check = await page.evaluate(
        `!!document.querySelector('.msg-overlay-conversation-bubble, .msg-s-message-list, div.msg-form__contenteditable')`,
      );
      opened = check;
    }
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
    await shot(page, opts.outDir, "02-chat.png");

    for (let i = 0; i < 3; i++) {
      await page.scroll({
        dy: 400,
        steps: 8,
        selector: ".msg-s-message-list, .msg-overlay-conversation-bubble",
      }).catch(() => page.scroll({ dy: 400, steps: 8 }));
      await sleep(500);
    }
    steps.push("scroll:bottom");

    let peer = null;
    let merged = [];
    let prevPageSig = "";
    let pageStable = 0;
    let emptyPages = 0;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const pageData = await scrapeThread(page);
      if (pageData.peer) peer = pageData.peer;
      const before = merged.length;
      merged = mergeMessagesChronological(merged, pageData.messages);
      const pageSig = (pageData.messages || []).map(messageKey).join("|");
      steps.push(
        `page:${round}:found=${pageData.messages.length}:total=${merged.length}`,
      );
      if (merged.length > before) steps.push(`grew:+${merged.length - before}`);

      if (merged.length >= maxResults) {
        steps.push("stop:maxResults");
        break;
      }
      if (!pageData.messages.length) {
        emptyPages += 1;
        if (emptyPages >= 2 && merged.length) {
          steps.push("stop:empty-page");
          break;
        }
      } else {
        emptyPages = 0;
      }
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

      await page.scroll({
        dy: -420,
        steps: 10,
        selector: ".msg-s-message-list, .msg-overlay-conversation-bubble",
      }).catch(() => page.scroll({ dy: -420, steps: 10 }));
      await sleep(SCROLL_MS);
    }

    await shot(page, opts.outDir, "03-list.png");
    const slice = merged.slice(-maxResults);
    const messages = slice.map(({ sender, message, time, from }) => ({
      sender,
      message,
      time,
      from,
    }));

    let db = null;
    const forDb = messages.filter((m) => m.from === "me" || m.from === "peer");
    if (forDb.length) {
      try {
        db = await notifyLinkedInMessages({
          profileUrl: url,
          agentId: opts.agentId || resolveAgentId(),
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
  });
}
