/**
 * Criação da conta LinkedIn (passo browser).
 * Por enquanto: abre o signup; depois entra o preenchimento/PIN.
 */
import { openLinkedInSignup } from './open-signup.mjs';

/**
 * Inicia o fluxo LinkedIn no CDP (abre signup).
 *
 * @param {{
 *   id: string,
 *   url?: string,
 *   dryRun?: boolean,
 *   skipBrowser?: boolean,
 * }} opts
 */
export async function createLinkedin(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('createLinkedin: id obrigatório');

  if (opts.skipBrowser) {
    return { id, skipped: true, browser: null };
  }

  const browser = await openLinkedInSignup({
    id,
    url: opts.url,
    dryRun: opts.dryRun,
  });

  return {
    id,
    skipped: false,
    browser,
  };
}
