/**
 * Criação da conta LinkedIn (passo browser).
 * Abre signup → e-mail → senha → submit → nome/sobrenome → Continuar.
 */
import { openLinkedInSignup } from './open-signup.mjs';
import { fillSignupEmail } from './fill-signup-email.mjs';
import { fillSignupPassword } from './fill-signup-password.mjs';
import { clickSignupSubmit } from './click-signup-submit.mjs';
import { fillSignupName } from './fill-signup-name.mjs';
import { clickSignupContinue } from './click-signup-continue.mjs';

const DEFAULT_LI_PASSWORD = 'in@12345678';

/**
 * @param {{
 *   id: string,
 *   email?: string,
 *   password?: string,
 *   first?: string,
 *   last?: string,
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
      name: null,
      continue: null,
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

  let nameFill = null;
  const first = String(opts.first || opts.nome || '').trim();
  const last = String(opts.last || opts.sobrenome || '').trim();
  if (first && last) {
    nameFill = await fillSignupName({
      id,
      first,
      last,
      dryRun: opts.dryRun,
    });
  }

  const cont = await clickSignupContinue({
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
    name: nameFill,
    continue: cont,
  };
}
