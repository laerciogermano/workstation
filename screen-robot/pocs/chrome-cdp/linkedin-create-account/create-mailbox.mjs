#!/usr/bin/env node
/**
 * Main — mailbox + CDP (paralelo) → CSV → signup LinkedIn completo.
 *
 * Uso:
 *   node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais
 *   node create-mailbox.mjs --first Bruno --last Nunes \
 *     --location "Rio de Janeiro" \
 *     --job "Especialista em suprimentos e itens corporativos" \
 *     --company ConectMax
 *
 * Flags: --dry-run · --write-credenciais · --no-browser · --debug
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEmail } from './create-email.mjs';
import { createLinkedInCdp } from './create-cdp.mjs';
import { saveAccountCsv, markLiCriado } from './save-csv.mjs';
import { createLinkedin } from './create-linkedin.mjs';

const DOMAIN = (process.env.MAIL_DOMAIN || 'brsupply.email').trim();
const DEFAULT_LI_PASSWORD = 'in@12345678';
const DEFAULT_LOCATION = 'Rio de Janeiro';
const DEFAULT_JOB = 'Especialista em suprimentos e itens corporativos';
const DEFAULT_COMPANY = 'ConectMax';

function arg(...names) {
  for (const name of names) {
    const i = process.argv.indexOf(name);
    if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].trim();
  }
  return '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function log(...parts) {
  console.error(`[create-mailbox] ${parts.join(' ')}`);
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error(`uso: node create-mailbox.mjs --first NOME --last SOBRENOME
       node create-mailbox.mjs --email LOCAL@${DOMAIN} --name "Nome Completo"
  opcional: --location · --job/--cargo · --company/--empresa · --password
  flags: --dry-run · --write-credenciais · --no-browser · --debug`);
  process.exit(msg ? 1 : 0);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) usage();

  const first = arg('--first', '--nome');
  const last = arg('--last', '--sobrenome');
  const email = arg('--email');
  const name = arg('--name', '--nome-completo');
  const location = arg('--location', '--localidade') || DEFAULT_LOCATION;
  const job = arg('--job', '--cargo') || DEFAULT_JOB;
  const company = arg('--company', '--empresa') || DEFAULT_COMPANY;
  const password = arg('--password', '--senha') || DEFAULT_LI_PASSWORD;
  const dryRun = hasFlag('--dry-run');
  const writeCredenciais = hasFlag('--write-credenciais');
  const noBrowser = hasFlag('--no-browser');
  const debug = hasFlag('--debug');

  if (!email && (!first || !last)) usage('informe --first/--last ou --email');
  if (email && !name && !(first && last)) {
    usage('com --email informe --name (ou --first/--last)');
  }

  const common = {
    first: first || undefined,
    last: last || undefined,
    name: name || undefined,
    dryRun,
    debug,
  };

  log(
    'início',
    first && last ? `${first} ${last}` : name || email,
    dryRun ? '(dry-run)' : '',
    noBrowser ? '(no-browser)' : '',
  );
  log('1/4 mailbox + CDP em paralelo…');
  const [emailResult, cdpResult] = await Promise.all([
    Promise.resolve(
      createEmail({
        ...common,
        email: email || undefined,
        writeCredenciais,
      }),
    ),
    Promise.resolve(createLinkedInCdp(common)),
  ]);
  log(`mailbox ok: ${emailResult.email}`);
  log(`CDP ok: ${cdpResult.id} :${cdpResult.port}`);

  log('2/4 salvando CSV…');
  const csvResult = saveAccountCsv({
    email: emailResult,
    cdp: cdpResult,
    senhaLi: password,
    cidade: location,
    company,
    dryRun,
  });
  log(`CSV ok: ip=${csvResult.ip || csvResult.linkedin?.ip || '—'}`);

  log('3/4 signup LinkedIn…', `local=${location}`, `empresa=${company}`);
  const linkedinResult = await createLinkedin({
    id: cdpResult.id,
    email: emailResult.email,
    password,
    first: first || emailResult.name?.split(/\s+/)[0],
    last: last || emailResult.name?.split(/\s+/).slice(1).join(' '),
    location,
    job,
    company,
    dryRun,
    skipBrowser: noBrowser,
  });

  const reachedFeed =
    !!linkedinResult?.onboarding?.done ||
    /\/feed\/?/i.test(
      String(
        linkedinResult?.onboarding?.href ||
          linkedinResult?.finish?.href ||
          '',
      ),
    );

  let csvFinal = csvResult;
  if (reachedFeed && !dryRun && !noBrowser) {
    log('4/4 conta criada — marcando li_criado=sim no CSV…');
    csvFinal = {
      ...csvResult,
      ...markLiCriado({ email: emailResult.email, liCriado: 'sim' }),
    };
    log(`CSV li_criado=sim (${emailResult.email})`);
  } else {
    log(
      '4/4 fim',
      linkedinResult?.skipped
        ? 'skipped'
        : reachedFeed
          ? 'feed'
          : linkedinResult?.finish?.href || linkedinResult?.onboarding?.href || 'sem feed',
    );
  }

  console.log(
    JSON.stringify(
      {
        email: emailResult,
        cdp: cdpResult,
        csv: csvFinal,
        linkedin: linkedinResult,
        li_criado: reachedFeed ? 'sim' : 'nao',
      },
      null,
      2,
    ),
  );
}

const isDirect =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
