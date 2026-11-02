/**
 * Abre o Chrome/CDP na página de signup do LinkedIn.
 */
import { startCdp, getCdp, statusCdp } from '../human-cdp/src/index.mjs';

const SIGNUP_URL = 'https://www.linkedin.com/signup';

/**
 * Sobe o CDP (se necessário) e abre o LinkedIn signup.
 *
 * @param {{
 *   id: string,
 *   url?: string,
 *   dryRun?: boolean,
 * }} opts
 */
export async function openLinkedInSignup(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('openLinkedInSignup: id obrigatório');

  const url = String(opts.url || SIGNUP_URL).trim();
  const dryRun = !!opts.dryRun;

  const row = getCdp(id);
  if (!row && !dryRun) throw new Error(`CDP não encontrado: ${id}`);

  if (dryRun) {
    return {
      dryRun: true,
      id,
      url,
      port: row?.preferredPort || row?.port || null,
      opened: false,
    };
  }

  const before = await statusCdp(id);
  const st = await startCdp(id, { url });

  return {
    id,
    url,
    port: st.port ?? row?.preferredPort ?? row?.port,
    cdpUrl: st.cdpUrl || `http://127.0.0.1:${st.port}`,
    already: !!st.already || before.status === 'up',
    opened: true,
  };
}
