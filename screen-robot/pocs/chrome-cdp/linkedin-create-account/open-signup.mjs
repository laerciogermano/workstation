/**
 * Abre o Chrome/CDP na página de signup do LinkedIn.
 */
import { startCdp, getCdp, statusCdp, connectCdp } from '../human-cdp/src/index.mjs';
import { sleep } from '../human-cdp/src/human.mjs';

const SIGNUP_URL = 'https://www.linkedin.com/signup';

/**
 * Sobe o CDP (se necessário) e abre o LinkedIn signup.
 * Espera o formulário (#email-or-phone) antes de retornar.
 *
 * @param {{
 *   id: string,
 *   url?: string,
 *   dryRun?: boolean,
 *   readyTimeoutMs?: number,
 * }} opts
 */
export async function openLinkedInSignup(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('openLinkedInSignup: id obrigatório');

  const url = String(opts.url || SIGNUP_URL).trim();
  const dryRun = !!opts.dryRun;
  const readyTimeoutMs =
    Number(opts.readyTimeoutMs) > 0 ? Number(opts.readyTimeoutMs) : 45_000;

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

  // se Chrome já estava up, startCdp pode não navegar — força signup
  const s = await connectCdp(id, { debug: true });
  try {
    const href = String((await s.evaluate(`location.href`)) || '');
    if (!/linkedin\.com\/signup/i.test(href)) {
      console.error(`[open-signup] navegando para signup (era ${href || '—'})`);
      await s.goto(url);
    }
    const t0 = Date.now();
    let ready = false;
    while (Date.now() - t0 < readyTimeoutMs) {
      ready = await s.evaluate(`(() => {
        const el =
          document.querySelector('#email-or-phone') ||
          document.querySelector('input[name="email-or-phone"]');
        return !!(el && (el.offsetWidth || el.getClientRects().length));
      })()`);
      if (ready) break;
      await sleep(800);
    }
    if (!ready) {
      console.error('[open-signup] formulário ainda não visível — seguindo mesmo assim');
    } else {
      console.error(
        `[open-signup] formulário pronto (${Math.round((Date.now() - t0) / 1000)}s)`,
      );
    }
  } finally {
    s.close();
  }

  return {
    id,
    url,
    port: st.port ?? row?.preferredPort ?? row?.port,
    cdpUrl: st.cdpUrl || `http://127.0.0.1:${st.port}`,
    already: !!st.already || before.status === 'up',
    opened: true,
  };
}
