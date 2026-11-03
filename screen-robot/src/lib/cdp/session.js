/**
 * Sessão human-cdp para ações LinkedIn (workers).
 *
 * Entrada (uma delas):
 *   - page: HumanCdpSession já aberta
 *   - cdpId: registry (~/chrome-profiles/<id>)
 *   - cdpUrl / CDP_URL: http://127.0.0.1:PORT
 *
 * Espelho AVD: `serial` → `page` | `cdpId` | `cdpUrl`.
 * `closePage` espelha `closeApp` (default false — não fecha o Chrome).
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

/**
 * @param {{
 *   page?: object,
 *   cdpId?: string,
 *   cdpUrl?: string,
 *   urlIncludes?: string,
 *   newTab?: boolean,
 *   debug?: boolean,
 * }} opts
 * @returns {Promise<{ page: object, owned: boolean }>}
 */
export async function resolveLinkedInPage(opts = {}) {
  if (opts.page) return { page: opts.page, owned: false };

  const { connect, connectCdp } = await humanCdp();
  const urlIncludes = opts.urlIncludes ?? "linkedin.com";
  const cdpId = String(opts.cdpId || process.env.CDP_ID || "").trim();

  if (cdpId) {
    const page = await connectCdp(cdpId, {
      urlIncludes,
      newTab: opts.newTab,
      debug: opts.debug,
    });
    return { page, owned: true };
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
  return { page, owned: true };
}

/**
 * Abre sessão, roda `fn(page)`, fecha WS se a sessão foi criada aqui e `closePage`.
 * @template T
 * @param {object} opts
 * @param {(page: object) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withLinkedInPage(opts, fn) {
  const closePage = opts.closePage === true;
  const { page, owned } = await resolveLinkedInPage(opts);
  try {
    return await fn(page);
  } finally {
    if (owned && closePage) {
      try {
        page.close();
      } catch {
        /* ignore */
      }
    }
  }
}

export { humanCdp };
