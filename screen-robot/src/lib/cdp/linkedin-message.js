/**
 * Enviar mensagem LinkedIn via URL de perfil (CDP / web).
 * Mesma interface de `../linkedin-message.js` (AVD).
 */
import {
  assertConnectionAcceptedForSend,
  normalizeLinkedInProfileUrl,
  notifyLinkedInMessages,
  resolveAgentId,
} from "../linkedin-connect.js";
import {
  clickByTexts,
  clickProfileMore,
  clickSendMessage,
  fillMessageComposer,
  openProfileComposer,
  profileSignals,
  shot,
  sleep,
} from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const WAIT_VIEW_MS = Number(process.env.LINKEDIN_MSG_WAIT_VIEW_MS || 5_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_MSG_WAIT_TAP_MS || 2_000);
const WAIT_COMPOSE_MS = Number(process.env.LINKEDIN_MSG_WAIT_COMPOSE_MS || 4_000);
const MAX_ROUNDS = 14;

async function isComposerOpen(page) {
  return page.evaluate(`(() => {
    return !!(
      document.querySelector('div.msg-form__contenteditable') ||
      document.querySelector('.msg-form__contenteditable[contenteditable="true"]') ||
      document.querySelector('div[role="textbox"][contenteditable="true"]') ||
      document.querySelector('.msg-overlay-conversation-bubble')
    );
  })()`);
}

/**
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   url: string,
 *   text: string,
 *   outDir?: string|null,
 *   dryRun?: boolean,
 *   closePage?: boolean,
 *   agentId?: string,
 * }} opts
 */
export async function sendLinkedInMessage(opts) {
  const dryRun = Boolean(opts.dryRun);
  const message = String(opts.text || "").trim();
  if (!message) throw new Error("texto da mensagem vazio");
  const url = normalizeLinkedInProfileUrl(opts.url);
  if (!url) throw new Error(`URL inválida: ${opts.url}`);

  await assertConnectionAcceptedForSend({
    profileUrl: url,
    agentId: opts.agentId || resolveAgentId(),
  });

  const steps = [];

  return withLinkedInPage(opts, async (page) => {
    await page.goto(url);
    steps.push(`view:${url}`);
    await sleep(WAIT_VIEW_MS);
    await shot(page, opts.outDir, "01-perfil.png");

    // Preferir goto compose: clique CDP no "Enviar mensagem" não abre o overlay.
    if (!dryRun) {
      const opened = await openProfileComposer(page, {
        steps,
        waitMs: WAIT_COMPOSE_MS,
      });
      if (opened) {
        steps.push("composer");
        await shot(page, opts.outDir, "02-composer.png");
        const filled = await fillMessageComposer(page, message, steps);
        if (!filled) {
          return {
            ok: false,
            status: "failed",
            url,
            text: message,
            steps,
            error: "composer não aceitou texto",
          };
        }
        await shot(page, opts.outDir, "03-pasted.png");
        await shot(page, opts.outDir, "04-before-send.png");
        const sent = await clickSendMessage(page, steps);
        if (!sent) {
          return {
            ok: false,
            status: "failed",
            url,
            text: message,
            steps,
            error: "botão Send não encontrado",
          };
        }
        await sleep(WAIT_TAP_MS);
        await shot(page, opts.outDir, "05-sent.png");
        steps.push("send:confirmed");

        let db = null;
        try {
          db = await notifyLinkedInMessages({
            profileUrl: url,
            agentId: opts.agentId || resolveAgentId(),
            direction: "sent",
            message,
            occurredAt: new Date().toISOString(),
          });
          steps.push(db.notified ? "db:message:sent" : `db:skip:${db.reason}`);
        } catch (e) {
          steps.push(`db:error:${String(e?.message || e).slice(0, 120)}`);
        }
        return { ok: true, status: "sent", url, text: message, steps, db };
      }
      steps.push("compose:href-miss");
    }

    // Fallback: Mais → Message no menu (quando não há CTA Mensagem no hero)
    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (await isComposerOpen(page)) {
        steps.push("composer");
        await shot(page, opts.outDir, "02-composer.png");
        if (dryRun) {
          return { ok: true, status: "dry_run", url, text: message, steps };
        }
        const filled = await fillMessageComposer(page, message, steps);
        if (!filled) {
          return {
            ok: false,
            status: "failed",
            url,
            text: message,
            steps,
            error: "composer não aceitou texto",
          };
        }
        await shot(page, opts.outDir, "03-pasted.png");
        await shot(page, opts.outDir, "04-before-send.png");
        const sent = await clickSendMessage(page, steps);
        if (!sent) {
          return {
            ok: false,
            status: "failed",
            url,
            text: message,
            steps,
            error: "botão Send não encontrado",
          };
        }
        await sleep(WAIT_TAP_MS);
        await shot(page, opts.outDir, "05-sent.png");
        steps.push("send:confirmed");

        let db = null;
        try {
          db = await notifyLinkedInMessages({
            profileUrl: url,
            agentId: opts.agentId || resolveAgentId(),
            direction: "sent",
            message,
            occurredAt: new Date().toISOString(),
          });
          steps.push(db.notified ? "db:message:sent" : `db:skip:${db.reason}`);
        } catch (e) {
          steps.push(`db:error:${String(e?.message || e).slice(0, 120)}`);
        }
        return { ok: true, status: "sent", url, text: message, steps, db };
      }

      const sig = await profileSignals(page);
      if (sig.hasMessage) {
        await shot(page, opts.outDir, "01b-message-btn.png");
        if (!dryRun) {
          const opened = await openProfileComposer(page, {
            steps,
            waitMs: WAIT_COMPOSE_MS,
          });
          if (!opened) await sleep(WAIT_TAP_MS);
        }
        continue;
      }

      if (sig.hasMore) {
        await shot(page, opts.outDir, "01c-more.png");
        if (!dryRun) {
          await clickProfileMore(page, { steps });
          await sleep(WAIT_TAP_MS);
          await clickByTexts(
            page,
            ["Message", "Mensagem", "Send a message", "Enviar mensagem"],
            { menuOnly: true, steps },
          );
          await sleep(WAIT_TAP_MS);
        }
        continue;
      }

      steps.push(`wait:round${round}`);
      await sleep(1_200);
    }

    return {
      ok: false,
      status: "failed",
      url,
      text: message,
      steps,
      error: "não abriu composer / não enviou",
    };
  });
}
