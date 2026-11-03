/**
 * Sessão human-cdp para ações LinkedIn (workers).
 *
 * Entrada (uma delas):
 *   - page: HumanCdpSession já aberta
 *   - cdpId: registry (~/chrome-profiles/<id>)
 *   - cdpUrl / CDP_URL: http://127.0.0.1:PORT
 *
 * Espelho AVD: `serial` → `page` | `cdpId` | `cdpUrl`.
 *
 * Lifecycle (default): sobe o Chrome se estiver down (`connectCdp`/`startCdp`)
 * e **mata o processo** no fim (`stopCdp`) — não deixa a tela logada aberta.
 * Escape: `keepBrowser: true` | `closeBrowser: false` | `CDP_KEEP_BROWSER=1`.
 * Sessão já passada (`page`) → não mata (nested, ex.: unread → profile chat).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HUMAN_CDP = resolve(
  __dirname,
  "../../../pocs/chrome-cdp/human-cdp/src/index.mjs",
);

let _human = null;

async function humanCdp() {
  if (_human) return _human;
  _human = await import(pathToFileURL(HUMAN_CDP).href);
  return _human;
}

function portFromCdpUrl(cdpUrl) {
  const m = String(cdpUrl || "").match(/:(\d+)(?:\/|$)/);
  return m ? Number(m[1]) : null;
}

/**
 * Resolve id do registry a partir de CDP_ID ou da porta em CDP_URL.
 * @param {{ cdpId?: string, cdpUrl?: string }} opts
 * @returns {Promise<string|null>}
 */
async function resolveCdpId(opts = {}) {
  const explicit = String(opts.cdpId || process.env.CDP_ID || "").trim();
  if (explicit) return explicit;

  const cdpUrl = String(
    opts.cdpUrl || process.env.CDP_URL || "",
  ).replace(/\/$/, "");
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
  if (opts.keepBrowser === true) return true;
  if (opts.closeBrowser === false) return true;
  const env = String(process.env.CDP_KEEP_BROWSER || "").trim();
  return env === "1" || /^true$/i.test(env);
}

/**
 * @param {{
 *   page?: object,
 *   cdpId?: string,
 *   cdpUrl?: string,
 *   urlIncludes?: string,
 *   newTab?: boolean,
 *   debug?: boolean,
 * }} opts
 * @returns {Promise<{ page: object, owned: boolean, cdpId: string|null }>}
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

  if (cdpId) {
    const page = await connectCdp(cdpId, {
      urlIncludes,
      newTab: opts.newTab,
      debug: opts.debug,
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
    debug: opts.debug,
    cdpId: opts.cdpId,
  });
  return { page, owned: true, cdpId: null };
}

/**
 * Abre sessão (sobe Chrome se preciso), roda `fn(page)`, desconecta o WS e
 * **mata o Chrome** se a sessão foi criada aqui (default).
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
        page.close();
      } catch {
        /* ignore */
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

export { humanCdp };
