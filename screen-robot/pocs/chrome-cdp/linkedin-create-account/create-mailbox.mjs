#!/usr/bin/env node
/**
 * Main — cria mailbox + CDP LinkedIn (em paralelo).
 *
 * Uso:
 *   node create-mailbox.mjs --first Bruno --last Nunes
 *   node create-mailbox.mjs --email bruno.nunes@clozzy.com.br --name "Bruno Nunes"
 *
 * Flags: --dry-run · --write-credenciais
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEmail } from './create-email.mjs';
import { createLinkedInCdp } from './create-cdp.mjs';

const DOMAIN = (process.env.MAIL_DOMAIN || 'clozzy.com.br').trim();

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

function usage(msg) {
  if (msg) console.error(msg);
  console.error(`uso: node create-mailbox.mjs --first NOME --last SOBRENOME
       node create-mailbox.mjs --email LOCAL@${DOMAIN} --name "Nome Completo"
  --dry-run · --write-credenciais`);
  process.exit(msg ? 1 : 0);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) usage();

  const first = arg('--first', '--nome');
  const last = arg('--last', '--sobrenome');
  const email = arg('--email');
  const name = arg('--name', '--nome-completo');
  const dryRun = hasFlag('--dry-run');
  const writeCredenciais = hasFlag('--write-credenciais');

  if (!email && (!first || !last)) usage('informe --first/--last ou --email');
  if (email && !name && !(first && last)) {
    usage('com --email informe --name (ou --first/--last)');
  }

  const common = {
    first: first || undefined,
    last: last || undefined,
    name: name || undefined,
    dryRun,
  };

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

  console.log(JSON.stringify({ email: emailResult, cdp: cdpResult }, null, 2));
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
