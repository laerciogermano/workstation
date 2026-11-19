/**
 * Sessão human-cdp para LinkedIn.
 *
 * Entrada (uma delas):
 *   - page: HumanCdpSession já aberta
 *   - cdpId: registry (~/chrome-profiles/<id>)
 *   - cdpUrl / CDP_URL: http://127.0.0.1:PORT
 *
 * Lifecycle (default): sobe o Chrome se down; no fim fecha só a aba
 * (`closeTab` + standby about:blank) — não mata o processo.
 * Escape: closeBrowser: true | keepBrowser: false |
 * CDP_CLOSE_BROWSER=1 | CDP_KEEP_BROWSER=0.
 * Sessão já passada (`page`) → não fecha aba nem mata.
 *
 * Debug overlay: sempre off (debug: false).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const humanCdpPkg = require.resolve("@screen-robot/human-cdp");

let _human = null;

export async function humanCdp() {
  if (_human) return _human;
  _human = await import(humanCdpPkg);
  return _human;
}

function portFromCdpUrl(cdpUrl) {
  const m = String(cdpUrl || "").match(/:(\d+)(?:\/|$)/);
  return m ? Number(m[1]) : null;
}

async function resolveCdpId(opts = {}) {
  const explicit = String(opts.cdpId || process.env.CDP_ID || "").trim();
  if (explicit) return explicit;

  const cdpUrl = String(opts.cdpUrl || process.env.CDP_URL || "").replace(
    /\/$/,
    "",
  );
  const port = portFromCdpUrl(cdpUrl);
  if (port == null) return null;

  const { getCdp, listCdps } = await humanCdp();
  const byKey = getCdp(String(port));
  if (byKey?.id) return byKey.id;
  const rows = listCdps();
  const byPreferred = rows.find((c) => c.preferredPort === port);
  return byPreferred?.id || null;
}

function shouldKeepBrowser(opts = {}) {
  if (opts.closeBrowser === true) return false;
  if (opts.keepBrowser === false) return false;
  const closeEnv = String(process.env.CDP_CLOSE_BROWSER || "").trim();
  if (closeEnv === "1" || /^true$/i.test(closeEnv)) return false;
  const keepEnv = String(process.env.CDP_KEEP_BROWSER || "").trim();
  if (keepEnv === "0" || /^false$/i.test(keepEnv)) return false;
  return true;
}

/**
 * @param {{
 *   page?: object,
 *   cdpId?: string,
 *   cdpUrl?: string,
 *   urlIncludes?: string,
 *   newTab?: boolean,
 * }} opts
 */
export async function resolveLinkedInPage(opts = {}) {
  if (opts.page) {
    return {
      page: opts.page,
      owned: false,
      cdpId: opts.page?._cdpId || null,
    };
  }

  const { connect, connectCdp } = await humanCdp();
  const urlIncludes = opts.urlIncludes ?? "linkedin.com";
  const cdpId = await resolveCdpId(opts);
  const debug = false;

  if (cdpId) {
    const page = await connectCdp(cdpId, {
      urlIncludes,
      newTab: opts.newTab,
      debug,
    });
    return { page, owned: true, cdpId };
  }

  const cdpUrl = String(
    opts.cdpUrl || process.env.CDP_URL || "http://127.0.0.1:9224",
  ).replace(/\/$/, "");
  const page = await connect({
    cdpUrl,
    urlIncludes,
    newTab: opts.newTab,
    debug,
    cdpId: opts.cdpId,
  });
  return { page, owned: true, cdpId: null };
}

/**
 * @template T
 * @param {object} opts
 * @param {(page: object) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withLinkedInPage(opts, fn) {
  const keepBrowser = shouldKeepBrowser(opts);
  const { page, owned, cdpId } = await resolveLinkedInPage(opts);
  try {
    return await fn(page);
  } finally {
    if (owned) {
      try {
        if (typeof page.closeTab === "function") {
          await page.closeTab({ ensureStandby: true });
        } else {
          page.close();
        }
      } catch {
        try {
          page.close();
        } catch {
          /* ignore */
        }
      }
      if (!keepBrowser && cdpId) {
        try {
          const { stopCdp } = await humanCdp();
          await stopCdp(cdpId);
        } catch {
          /* ignore */
        }
      }
    }
  }
}
