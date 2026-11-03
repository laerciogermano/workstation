/**
 * Conectar em perfil LinkedIn via URL (CDP / web).
 * Mesma interface de `../linkedin-connect.js` (AVD), trocando `serial` por sessão CDP.
 *
 * Fluxo: Connect do hero **ou** Mais → menuitem Conectar → Enviar sem nota/Skip → Pending.
 * Manipulação só via human-cdp (clickAt/click).
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
  clickProfileMenuConnect,
  clickSkipInvite,
  findMenuConnect,
  findSkipInvite,
  profileSignals,
  shot,
  sleep,
} from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

const WAIT_AFTER_VIEW_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_VIEW_MS || 5_000);
const WAIT_AFTER_TAP_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_TAP_MS || 2_500);
const WAIT_PENDING_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_PENDING_MS || 1_500);
const PENDING_TRIES = Number(process.env.LINKEDIN_CONNECT_PENDING_TRIES || 6);
const SKIP_TRIES = Number(process.env.LINKEDIN_CONNECT_SKIP_TRIES || 8);
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

/** Após Connect: espera o modal e clica Enviar sem nota. */
async function waitAndClickSkip(page, { outDir, steps, dryRun }) {
  for (let i = 0; i < SKIP_TRIES; i++) {
    const hit = await findSkipInvite(page);
    if (hit) {
      await shot(page, outDir, "03-add-note-skip.png");
      if (!dryRun) await clickSkipInvite(page, steps);
      else steps.push(`skip:dry`);
      await sleep(WAIT_AFTER_TAP_MS);
      return true;
    }
    steps.push(`skip-miss:try${i + 1}`);
    await sleep(800);
  }
  return false;
}

async function finishPending(page, {
  url,
  steps,
  outDir,
  dryRun,
  notifyApi,
  agentId,
  skipped,
}) {
  const pending = dryRun
    ? true
    : await waitForPending(page, { outDir, steps });
  if (!pending) {
    await shot(page, outDir, "99-sem-pending.png");
    return {
      ok: false,
      status: "failed",
      url,
      steps,
      error: skipped
        ? "Skip ok mas Pending/Invitation sent não apareceu — convite não confirmado"
        : "Connect ok mas Pending/Invitation sent não apareceu — convite não confirmado",
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
    let didMore = false;
    let didConnect = false;

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

      // Modal "Add a note" / "Enviar sem nota" — prioridade máxima
      if (sig.hasSkip || (await findSkipInvite(page))) {
        await shot(page, opts.outDir, "03-add-note-skip.png");
        if (!dryRun) {
          const hit = await clickSkipInvite(page, steps);
          if (!hit) {
            return {
              ok: false,
              status: "failed",
              url,
              steps,
              error: "Enviar sem nota/Skip visível mas não clicável",
            };
          }
          await sleep(WAIT_AFTER_TAP_MS);
        }
        skipped = true;
        return finishPending(page, {
          url,
          steps,
          outDir: opts.outDir,
          dryRun,
          notifyApi,
          agentId,
          skipped: true,
        });
      }

      // Já clicou Connect: só espera Skip — não reabre Mais
      if (didConnect) {
        const okSkip = await waitAndClickSkip(page, {
          outDir: opts.outDir,
          steps,
          dryRun,
        });
        if (!okSkip) {
          await shot(page, opts.outDir, "99-sem-skip.png");
          return {
            ok: false,
            status: "failed",
            url,
            steps,
            error: "Connect ok mas Enviar sem nota/Skip não apareceu",
          };
        }
        skipped = true;
        return finishPending(page, {
          url,
          steps,
          outDir: opts.outDir,
          dryRun,
          notifyApi,
          agentId,
          skipped: true,
        });
      }

      // Connect no hero (botão) — nunca <a> de recomendações
      if (sig.hasConnect) {
        await shot(page, opts.outDir, "02-connect.png");
        if (!dryRun) {
          const hit = await clickByTexts(page, ["Connect", "Conectar"], {
            exact: true,
            primaryOnly: true,
            steps,
          });
          if (!hit) {
            return {
              ok: false,
              status: "failed",
              url,
              steps,
              error: "Connect do perfil sinalizado mas botão não clicável",
            };
          }
          await sleep(WAIT_AFTER_TAP_MS);
        }
        didConnect = true;
        continue;
      }

      // Menu já aberto → só menuitem Conectar do perfil (vanity)
      if (sig.hasMenuConnect && !didConnect) {
        await shot(page, opts.outDir, "02-menu-connect.png");
        if (!dryRun) {
          const menuHit = await findMenuConnect(page);
          if (!menuHit) {
            return {
              ok: false,
              status: "failed",
              url,
              steps,
              error: "Conectar no menu visível mas não clicável",
            };
          }
          if (typeof page._moveTo === "function") {
            const moreY = menuHit.cy + 80;
            await page._moveTo(menuHit.cx, moreY);
            await sleep(60);
          }
          await page.clickAt(menuHit.cx, menuHit.cy);
          steps.push(
            `menu-connect:${menuHit.text}@${Math.round(menuHit.cx)},${Math.round(menuHit.cy)}`,
          );
          await sleep(WAIT_AFTER_TAP_MS);
        }
        didConnect = true;
        didMore = true;
        continue;
      }

      // Mais → Conectar no menu (trajeto dentro do dropdown)
      if (sig.hasMore && !didMore && !sig.pending) {
        await shot(page, opts.outDir, "02-follow-more.png");
        if (!dryRun) {
          const tapped = await clickProfileMenuConnect(page, steps);
          if (!tapped.ok) {
            return {
              ok: false,
              status: "failed",
              url,
              steps,
              error: tapped.error,
            };
          }
          await shot(page, opts.outDir, "02-menu-connect.png");
          await sleep(WAIT_AFTER_TAP_MS);
          didConnect = true;
        } else {
          didConnect = true;
        }
        didMore = true;
        continue;
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
