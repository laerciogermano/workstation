/**
 * Criação da conta LinkedIn (passo browser).
 * … → PIN → maior de 18 → Continuar → Pulares → Concluir.
 */
import { openLinkedInSignup } from './open-signup.mjs';
import { fillSignupEmail } from './fill-signup-email.mjs';
import { fillSignupPassword } from './fill-signup-password.mjs';
import { clickSignupSubmit } from './click-signup-submit.mjs';
import { fillSignupName } from './fill-signup-name.mjs';
import { clickSignupContinue } from './click-signup-continue.mjs';
import { waitSignupAfterName } from './wait-signup-after-name.mjs';
import { fillSignupLocation } from './fill-signup-location.mjs';
import { fillSignupJob } from './fill-signup-job.mjs';
import { fillSignupCompany } from './fill-signup-company.mjs';
import { fetchSignupPin } from './fetch-signup-pin.mjs';
import { fillSignupPin } from './fill-signup-pin.mjs';
import { clickSignupAge18 } from './click-signup-age18.mjs';
import { clickSignupSkip } from './click-signup-skip.mjs';
import { clickSignupFinish } from './click-signup-finish.mjs';

const DEFAULT_LI_PASSWORD = 'in@12345678';

function log(...parts) {
  console.error(`[createLinkedin] ${parts.join(' ')}`);
}

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
    log('skipBrowser — sem browser');
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

  log(`id=${id}`, opts.dryRun ? '(dry-run)' : '');

  log('abrir signup…');
  const browser = await openLinkedInSignup({
    id,
    url: opts.url,
    dryRun: opts.dryRun,
  });
  log(`signup aberto :${browser.port || '—'} ${browser.url || ''}`);

  let emailFill = null;
  const email = String(opts.email || '').trim();
  if (email) {
    log(`e-mail: ${email}`);
    emailFill = await fillSignupEmail({
      id,
      email,
      dryRun: opts.dryRun,
    });
  }

  log('senha…');
  const password = String(opts.password || DEFAULT_LI_PASSWORD).trim();
  const passwordFill = await fillSignupPassword({
    id,
    password,
    dryRun: opts.dryRun,
  });

  log('Aceite e cadastre-se…');
  const submit = await clickSignupSubmit({
    id,
    dryRun: opts.dryRun,
  });

  let nameFill = null;
  const first = String(opts.first || opts.nome || '').trim();
  const last = String(opts.last || opts.sobrenome || '').trim();
  if (first && last) {
    log(`nome: ${first} ${last}`);
    nameFill = await fillSignupName({
      id,
      first,
      last,
      dryRun: opts.dryRun,
    });
  }

  log('Continuar (após nome)…');
  const cont = await clickSignupContinue({
    id,
    dryRun: opts.dryRun,
  });

  log('após nome: checar próxima tela ou verificação humana…');
  const afterName = await waitSignupAfterName({
    id,
    dryRun: opts.dryRun,
  });
  if (afterName?.security) {
    log(`verificação humana resolvida (${afterName.waitedMs || 0}ms)`);
  } else {
    log(`sem captcha — ${afterName?.href || 'ok'}`);
  }

  let locationFill = null;
  const location = String(opts.location || '').trim();
  if (location) {
    log(`localidade: ${location}`);
    locationFill = await fillSignupLocation({
      id,
      location,
      dryRun: opts.dryRun,
    });
  }

  let jobFill = null;
  const job = String(opts.job || opts.cargo || '').trim();
  if (job) {
    log(`cargo: ${job}`);
    jobFill = await fillSignupJob({
      id,
      job,
      dryRun: opts.dryRun,
    });
  }

  let companyFill = null;
  const company = String(opts.company || opts.empresa || '').trim();
  if (company) {
    log(`empresa: ${company}`);
    companyFill = await fillSignupCompany({
      id,
      company,
      dryRun: opts.dryRun,
    });
  }

  let pinFetch = null;
  let pinFill = null;
  if (email) {
    log(`PIN Mailcow (até 5 min): ${email}`);
    pinFetch = await fetchSignupPin({
      email,
      code: opts.code || opts.pin,
      dryRun: opts.dryRun,
    });
    if (pinFetch?.code) {
      log(
        `PIN ok (${pinFetch.source}, ${pinFetch.attempts || 0} tent., ${pinFetch.waitedMs || 0}ms)`,
      );
      log('digitar PIN + Continuar…');
      pinFill = await fillSignupPin({
        id,
        code: pinFetch.code,
        dryRun: opts.dryRun,
      });
      log(`após PIN: ${pinFill?.href || '—'}`);
    }
  }

  log('maior de 18…');
  const age18 = await clickSignupAge18({
    id,
    dryRun: opts.dryRun,
  });
  log(`após idade: ${age18?.href || '—'}`);

  log('Pular (carreira)…');
  const skipCareer = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${skipCareer?.href || '—'}`);

  log('Pular (foto)…');
  const skipPhoto = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${skipPhoto?.href || '—'}`);

  log('Pular (modal foto)…');
  const skipPhotoModal = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${skipPhotoModal?.href || '—'}`);

  log('Pular (pessoas)…');
  const skipPeople = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${skipPeople?.href || '—'}`);

  log('Pular (seguir)…');
  const skipFollow = await clickSignupSkip({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${skipFollow?.href || '—'}`);

  log('Continuar (app)…');
  const continueApp = await clickSignupContinue({
    id,
    dryRun: opts.dryRun,
  });
  log(`→ ${continueApp?.href || '—'}`);

  log('Concluir…');
  const finish = await clickSignupFinish({
    id,
    dryRun: opts.dryRun,
  });
  log(`fim: ${finish?.href || '—'}`);

  return {
    id,
    skipped: false,
    browser,
    email: emailFill,
    password: passwordFill,
    submit,
    name: nameFill,
    continue: cont,
    afterName,
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
    continueApp,
    finish,
  };
}
