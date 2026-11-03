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
  clickSendMessage,
  fillMessageComposer,
  profileSignals,
  shot,
  sleep,
} from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const WAIT_VIEW_MS = Number(process.env.LINKEDIN_MSG_WAIT_VIEW_MS || 5_000);
const WAIT_TAP_MS = Number(process.env.LINKEDIN_MSG_WAIT_TAP_MS || 2_000);
const MAX_ROUNDS = 14;

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

    let openedComposer = false;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const composerOpen = await page.evaluate(`(() => {
        return !!(
          document.querySelector('div.msg-form__contenteditable') ||
          document.querySelector('.msg-form__contenteditable[contenteditable="true"]') ||
          document.querySelector('div[role="textbox"][contenteditable="true"]') ||
          document.querySelector('.msg-overlay-conversation-bubble')
        );
      })()`);

      if (composerOpen || openedComposer) {
        openedComposer = true;
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
          await clickByTexts(
            page,
            ["Message", "Mensagem", "Send a message", "Enviar mensagem"],
            { steps },
          );
          await sleep(WAIT_TAP_MS);
        }
        continue;
      }

      if (sig.hasMore) {
        await shot(page, opts.outDir, "01c-more.png");
        if (!dryRun) {
          await clickByTexts(page, ["More", "Mais", "More actions"], { steps });
          await sleep(WAIT_TAP_MS);
          await clickByTexts(
            page,
            ["Message", "Mensagem", "Send a message", "Enviar mensagem"],
            { steps },
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
