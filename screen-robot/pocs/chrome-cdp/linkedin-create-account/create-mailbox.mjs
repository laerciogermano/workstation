#!/usr/bin/env node
/**
 * Main — cria mailbox LinkedIn (passo 1).
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

function main() {
  if (hasFlag('--help') || hasFlag('-h')) usage();

  const first = arg('--first', '--nome');
  const last = arg('--last', '--sobrenome');
  const email = arg('--email');
  const name = arg('--name', '--nome-completo');

  if (!email && (!first || !last)) usage('informe --first/--last ou --email');
  if (email && !name && !(first && last)) {
    usage('com --email informe --name (ou --first/--last)');
  }

  const result = createEmail({
    first,
    last,
    email: email || undefined,
    name: name || undefined,
    dryRun: hasFlag('--dry-run'),
    writeCredenciais: hasFlag('--write-credenciais'),
  });

  console.log(JSON.stringify(result, null, 2));
}

const isDirect =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  try {
    main();
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}
