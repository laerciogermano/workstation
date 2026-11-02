/**
 * Criação da conta LinkedIn (passo browser).
 * … → PIN → maior de 18 → Continuar.
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
import { fillSignupPin } from './fill-signup-pin.mjs';
import { clickSignupAge18 } from './click-signup-age18.mjs';
import { clickSignupSkip } from './click-signup-skip.mjs';

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
      pinFill: null,
      age18: null,
      skip: null,
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
  let pinFill = null;
  if (email) {
    pinFetch = await fetchSignupPin({
      email,
      code: opts.code || opts.pin,
      dryRun: opts.dryRun,
    });
    if (pinFetch?.code) {
      pinFill = await fillSignupPin({
        id,
        code: pinFetch.code,
        dryRun: opts.dryRun,
      });
    }
  }

  const age18 = await clickSignupAge18({
    id,
    dryRun: opts.dryRun,
  });

  const skipCareer = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });

  const skipPhoto = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });

  // modal "Adicione sua foto" (segundo Pular)
  const skipPhotoModal = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });

  const skipPeople = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });

  const skipFollow = await clickSignupSkip({
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
    location: locationFill,
    job: jobFill,
    company: companyFill,
    pin: pinFetch,
    pinFill,
    age18,
    skip: skipCareer,
    skipPhoto,
    skipPhotoModal,
    skipPeople,
    skipFollow,
  };
}
