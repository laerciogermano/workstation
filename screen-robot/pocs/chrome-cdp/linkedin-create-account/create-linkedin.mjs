/**
 * Criação da conta LinkedIn (passo browser).
 * … → localidade → cargo → empresa → Continuar → poll PIN Mailcow (≤5 min).
 */
import { openLinkedInSignup } from './open-signup.mjs';
import { fillSignupEmail } from './fill-signup-email.mjs';
import { fillSignupPassword } from './fill-signup-password.mjs';
import { clickSignupSubmit } from './click-signup-submit.mjs';
import { fillSignupName } from './fill-signup-name.mjs';
import { clickSignupContinue } from './click-signup-continue.mjs';
import { fillSignupLocation } from './fill-signup-location.mjs';
import { fillSignupJob } from './fill-signup-job.mjs';
import { fillSignupCompany } from './fill-signup-company.mjs';
import { fetchSignupPin } from './fetch-signup-pin.mjs';

const DEFAULT_LI_PASSWORD = 'in@12345678';

/**
 * @param {{
 *   id: string,
 *   email?: string,
 *   password?: string,
 *   first?: string,
 *   last?: string,
 *   location?: string,
 *   job?: string,
 *   company?: string,
 *   code?: string,
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
      location: null,
      job: null,
      company: null,
      pin: null,
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

  let locationFill = null;
  const location = String(opts.location || '').trim();
  if (location) {
    locationFill = await fillSignupLocation({
      id,
      location,
      dryRun: opts.dryRun,
    });
  }

  let jobFill = null;
  const job = String(opts.job || opts.cargo || '').trim();
  if (job) {
    jobFill = await fillSignupJob({
      id,
      job,
      dryRun: opts.dryRun,
    });
  }

  let companyFill = null;
  const company = String(opts.company || opts.empresa || '').trim();
  if (company) {
    companyFill = await fillSignupCompany({
      id,
      company,
      dryRun: opts.dryRun,
    });
  }

  let pinFetch = null;
  if (email) {
    pinFetch = await fetchSignupPin({
      email,
      code: opts.code || opts.pin,
      dryRun: opts.dryRun,
    });
  }

  return {
    id,
    skipped: false,
    browser,
    email: emailFill,
    password: passwordFill,
    submit,
    name: nameFill,
    continue: cont,
    location: locationFill,
    job: jobFill,
    company: companyFill,
    pin: pinFetch,
  };
}
