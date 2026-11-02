/**
 * Criação da conta LinkedIn (passo browser).
 * Abre signup → e-mail → senha → Aceite e cadastre-se.
 */
import { openLinkedInSignup } from './open-signup.mjs';
import { fillSignupEmail } from './fill-signup-email.mjs';
import { fillSignupPassword } from './fill-signup-password.mjs';
import { clickSignupSubmit } from './click-signup-submit.mjs';

const DEFAULT_LI_PASSWORD = 'in@12345678';

/**
 * @param {{
 *   id: string,
 *   email?: string,
 *   password?: string,
 *   url?: string,
 *   dryRun?: boolean,
 *   skipBrowser?: boolean,
 * }} opts
 */
export async function createLinkedin(opts = {}) {
  const id = String(opts.id || '').trim();
  if (!id) throw new Error('createLinkedin: id obrigatório');

  if (opts.skipBrowser) {
    return {
      id,
      skipped: true,
      browser: null,
      email: null,
      password: null,
      submit: null,
    };
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

  const password = String(opts.password || DEFAULT_LI_PASSWORD).trim();
  const passwordFill = await fillSignupPassword({
    id,
    password,
    dryRun: opts.dryRun,
  });

  const submit = await clickSignupSubmit({
    id,
    dryRun: opts.dryRun,
  });

  return {
    id,
    skipped: false,
    browser,
    email: emailFill,
    password: passwordFill,
    submit,
  };
}
