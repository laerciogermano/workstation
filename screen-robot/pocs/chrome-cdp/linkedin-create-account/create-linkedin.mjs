/**
 * Criação da conta LinkedIn (passo browser).
 * Abre signup e preenche o e-mail.
 */
import { openLinkedInSignup } from './open-signup.mjs';
import { fillSignupEmail } from './fill-signup-email.mjs';

/**
 * @param {{
 *   id: string,
 *   email?: string,
 *   url?: string,
 *   dryRun?: boolean,
 *   skipBrowser?: boolean,
 * }} opts
 */
export async function createLinkedin(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('createLinkedin: id obrigatório');

  if (opts.skipBrowser) {
    return { id, skipped: true, browser: null, email: null };
  }

  const browser = await openLinkedInSignup({
    id,
    url: opts.url,
    dryRun: opts.dryRun,
  });

  let emailFill = null;
  const email = String(opts.email || '').trim();
  if (email) {
    emailFill = await fillSignupEmail({
      id,
      email,
      dryRun: opts.dryRun,
    });
  }

  return {
    id,
    skipped: false,
    browser,
    email: emailFill,
  };
}
