/**
 * Conectar em perfil LinkedIn via URL (CDP / web).
 * Mesma interface de `../linkedin-connect.js` (AVD), trocando `serial` por sessão CDP.
 *
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   url: string,
 *   outDir?: string|null,
 *   dryRun?: boolean,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   closePage?: boolean,
 * }} opts
 * @returns {Promise<{ ok: boolean, status: string, url: string, steps: string[], notify?: object, error?: string, discardReason?: string }>}
 */
import {
  CONNECTION_STATUS,
  DISCARD_REASON_PAGE_DOES_NOT_EXIST,
  normalizeLinkedInProfileUrl,
  notifyInviteSent,
  resolveAgentId,
} from "../linkedin-connect.js";
import {
  clickByTexts,
  profileSignals,
  shot,
  sleep,
} from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const WAIT_AFTER_VIEW_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_VIEW_MS || 5_000);
const WAIT_AFTER_TAP_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_TAP_MS || 2_500);
const WAIT_PENDING_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_PENDING_MS || 1_500);
const PENDING_TRIES = Number(process.env.LINKEDIN_CONNECT_PENDING_TRIES || 6);
const MAX_ROUNDS = 12;

async function waitForPending(page, { outDir, steps }) {
  for (let i = 0; i < PENDING_TRIES; i++) {
    const sig = await profileSignals(page);
    if (sig.pending) {
      steps.push(`pending:try${i + 1}`);
      await shot(page, outDir, "99-pending.png");
      return true;
    }
    steps.push(`pending-miss:try${i + 1}`);
    await sleep(WAIT_PENDING_MS);
  }
  return false;
}

/**
 * @param {object} opts
 */
export async function connectByLinkedInUrl(opts) {
  const dryRun = Boolean(opts.dryRun);
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const steps = [];
  const url = normalizeLinkedInProfileUrl(opts.url);
  if (!url) throw new Error(`URL inválida: ${opts.url}`);

  return withLinkedInPage(opts, async (page) => {
    await page.goto(url);
    steps.push(`view:${url}`);
    await sleep(WAIT_AFTER_VIEW_MS);
    await shot(page, opts.outDir, "01-perfil.png");

    let skipped = false;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const sig = await profileSignals(page);

      if (sig.pageMissing) {
        steps.push("page_does_not_exist");
        await shot(page, opts.outDir, "99-page-does-not-exist.png");
        let notify = { notified: false, reason: "notify desligado" };
        if (notifyApi && !dryRun) {
          try {
            notify = await notifyInviteSent({
              profileUrl: url,
              steps,
              agentId,
              status: CONNECTION_STATUS.DISCARDED,
              discardReason: DISCARD_REASON_PAGE_DOES_NOT_EXIST,
            });
            steps.push(
              notify.notified
                ? "api:discard:ok"
                : `api:discard:skip:${notify.reason}`,
            );
          } catch (e) {
            notify = { notified: false, error: String(e?.message || e) };
            steps.push(`api:discard:fail:${notify.error}`);
          }
        }
        if (notifyApi && !dryRun && !notify.notified) {
          return {
            ok: false,
            status: "not_found",
            url,
            steps,
            notify,
            discardReason: DISCARD_REASON_PAGE_DOES_NOT_EXIST,
            error: `perfil inexistente mas falhou descarte na API: ${notify.error || notify.reason || "n/a"}`,
          };
        }
        return {
          ok: true,
          status: "discarded",
          url,
          steps,
          notify,
          discardReason: DISCARD_REASON_PAGE_DOES_NOT_EXIST,
        };
      }

      if (sig.pending && !skipped) {
        steps.push("already_pending");
        await shot(page, opts.outDir, "99-already-pending.png");
        let notify = { notified: false, reason: "notify desligado" };
        if (notifyApi && !dryRun) {
          try {
            notify = await notifyInviteSent({
              profileUrl: url,
              steps,
              agentId,
              status: CONNECTION_STATUS.PENDING,
            });
            steps.push(
              notify.notified
                ? "api:client-connections-linkedin:ok"
                : `api:client-connections-linkedin:skip:${notify.reason}`,
            );
          } catch (e) {
            notify = { notified: false, error: String(e?.message || e) };
            steps.push(`api:client-connections-linkedin:fail:${notify.error}`);
          }
        }
        if (notifyApi && !dryRun && !notify.notified) {
          return {
            ok: false,
            status: "failed",
            url,
            steps,
            notify,
            error: `já Pending mas falhou upsert API: ${notify.error || notify.reason || "n/a"}`,
          };
        }
        return { ok: true, status: "already", url, steps, notify };
      }

      if (sig.hasSkip) {
        await shot(page, opts.outDir, "03-add-note-skip.png");
        if (!dryRun) {
          await clickByTexts(page, ["Skip", "Pular", "Skip without note"], {
            steps,
          });
          await sleep(WAIT_AFTER_TAP_MS);
        }
        skipped = true;
        const pending = dryRun
          ? true
          : await waitForPending(page, { outDir: opts.outDir, steps });
        if (!pending) {
          await shot(page, opts.outDir, "99-sem-pending.png");
          return {
            ok: false,
            status: "failed",
            url,
            steps,
            error:
              "Skip ok mas Pending/Invitation sent não apareceu — convite não confirmado",
          };
        }
        let notify = { notified: false, reason: "notify desligado" };
        if (notifyApi && !dryRun) {
          try {
            notify = await notifyInviteSent({
              profileUrl: url,
              steps,
              agentId,
              status: CONNECTION_STATUS.PENDING,
            });
            steps.push(
              notify.notified
                ? "api:client-connections-linkedin:ok"
                : `api:client-connections-linkedin:skip:${notify.reason}`,
            );
          } catch (e) {
            notify = { notified: false, error: String(e?.message || e) };
            steps.push(`api:client-connections-linkedin:fail:${notify.error}`);
          }
        }
        return { ok: true, status: "pending", url, steps, notify };
      }

      if (sig.hasConnect) {
        await shot(page, opts.outDir, "02-connect.png");
        if (!dryRun) {
          const hit = await clickByTexts(
            page,
            ["Connect", "Conectar", "Invite"],
            { steps },
          );
          if (!hit) {
            // aria Invite X to connect
            const aria = await page.evaluate(`(() => {
              const el = [...document.querySelectorAll('button,[role=button]')].find((b) => {
                const t = (b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '');
                return /invite .+ to connect/i.test(t) || /convidar .+ a conectar/i.test(t) || /^connect$/i.test(t.trim()) || /^conectar$/i.test(t.trim());
              });
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, text: (el.getAttribute('aria-label') || el.innerText || '').slice(0, 60) };
            })()`);
            if (!aria) {
              return {
                ok: false,
                status: "failed",
                url,
                steps,
                error: "Connect sinalizado mas botão não clicável",
              };
            }
            await page.clickAt(aria.cx, aria.cy);
            steps.push(`click:${aria.text}`);
          }
          await sleep(WAIT_AFTER_TAP_MS);
        }
        continue;
      }

      if (sig.hasFollow && sig.hasMore) {
        await shot(page, opts.outDir, "02-follow-more.png");
        if (!dryRun) {
          await clickByTexts(page, ["More", "Mais", "More actions"], { steps });
          await sleep(WAIT_AFTER_TAP_MS);
        }
        continue;
      }

      // sheet pós-More: Connect
      if (sig.hasFollow) {
        const sheet = await clickByTexts(page, ["Connect", "Conectar"], {
          steps,
        });
        if (sheet) {
          await sleep(WAIT_AFTER_TAP_MS);
          continue;
        }
      }

      steps.push(`wait:round${round}`);
      await sleep(1_200);
    }

    return {
      ok: false,
      status: "failed",
      url,
      steps,
      error: skipped
        ? "Skip ok mas Pending/Invitation sent não apareceu — convite não confirmado"
        : "Connect/Pending não resolvido a tempo",
    };
  });
}

export {
  CONNECTION_STATUS,
  DISCARD_REASON_PAGE_DOES_NOT_EXIST,
  normalizeLinkedInProfileUrl,
  resolveAgentId,
};
