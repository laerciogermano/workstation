/**
 * Criação de mailbox @clozzy.com.br (API Mailcow no VPS).
 * Toda a lógica fica aqui; o CLI só chama createEmail().
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const CRED_PATH = resolve(__dir, '../../../../credenciais.md');
const DEFAULT_DOMAIN = (process.env.MAIL_DOMAIN || 'clozzy.com.br').trim();
const SSH_HOST = (process.env.MAIL_SSH_HOST || 'root@144.126.154.90').trim();

function slugLocal(first, last) {
  return `${first}.${last}`
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/^\.+|\.+$/g, '');
}

function sshPass() {
  if (process.env.MAIL_SSH_PASS) return process.env.MAIL_SSH_PASS;
  if (!existsSync(CRED_PATH)) return '';
  const m = readFileSync(CRED_PATH, 'utf8').match(
    /`root@144\.126\.154\.90`\s*—\s*`([^`]+)`/,
  );
  return m ? m[1] : '';
}

function genPassword(len = 20) {
  return randomBytes(24).toString('base64').replace(/[/+=]/g, '').slice(0, len);
}

function mailcowApi(method, path, body) {
  const pass = sshPass();
  if (!pass) throw new Error('MAIL_SSH_PASS / credenciais.md ausente');

  const json = body ? JSON.stringify(body).replace(/'/g, `'\\''`) : '';
  const remote = `
set -euo pipefail
cd /opt/mailcow-dockerized
API_KEY=$(grep '^API_KEY=' mailcow.conf | cut -d= -f2-)
BASE=https://127.0.0.1:8443
curl -skS -X ${method} "$BASE${path}" \\
  -H "X-API-Key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  ${body ? `-d '${json}'` : ''}
`.trim();

  const r = spawnSync(
    'sshpass',
    [
      '-e',
      'ssh',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'PreferredAuthentications=password',
      '-o',
      'PubkeyAuthentication=no',
      '-o',
      'ConnectTimeout=25',
      SSH_HOST,
      'bash -s',
    ],
    {
      input: remote,
      env: { ...process.env, SSHPASS: pass },
      encoding: 'utf8',
      timeout: 60_000,
    },
  );

  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`ssh falhou (${r.status}): ${(r.stderr || r.stdout || '').slice(0, 400)}`);
  }
  return (r.stdout || '').trim();
}

function appendCredenciais({ email, name, password }) {
  if (!existsSync(CRED_PATH)) throw new Error(`credenciais.md não encontrado: ${CRED_PATH}`);
  let t = readFileSync(CRED_PATH, 'utf8');
  if (t.includes(email)) return false;
  const line = `- \`${email}\` — ${name} — mailbox \`${password}\` — senha LI \`in@12345678\`\n`;
  const marker = '### Caixas `@clozzy.com.br`\n';
  if (!t.includes(marker)) throw new Error('seção Caixas @clozzy.com.br ausente em credenciais.md');
  const start = t.indexOf(marker) + marker.length;
  let end = t.indexOf('\n### ', start);
  if (end < 0) end = t.length;
  t = t.slice(0, end).replace(/\s*$/, '\n') + line + t.slice(end);
  writeFileSync(CRED_PATH, t);
  return true;
}

function resolveIdentity(opts, domain) {
  const first = String(opts.first || opts.nome || '').trim();
  const last = String(opts.last || opts.sobrenome || '').trim();
  let email = String(opts.email || '').trim();
  let name = String(opts.name || opts.nomeCompleto || '').trim();

  if (!email) {
    if (!first || !last) throw new Error('createEmail: informe first+last ou email');
    email = `${slugLocal(first, last)}@${domain}`;
    name = name || `${first} ${last}`;
  } else {
    if (!email.endsWith(`@${domain}`)) throw new Error(`e-mail deve ser @${domain}`);
    if (!name) {
      if (!first || !last) throw new Error('createEmail: com email informe name (ou first+last)');
      name = `${first} ${last}`;
    }
  }

  return { email, name, localPart: email.slice(0, email.indexOf('@')) };
}

/**
 * Cria o e-mail (mailbox Mailcow). Encapsula SSH, API, senha e credenciais.
 *
 * @param {{
 *   first?: string,
 *   last?: string,
 *   email?: string,
 *   name?: string,
 *   password?: string,
 *   domain?: string,
 *   dryRun?: boolean,
 *   writeCredenciais?: boolean,
 * }} opts
 */
export function createEmail(opts = {}) {
  const domain = String(opts.domain || DEFAULT_DOMAIN).trim();
  const { email, name, localPart } = resolveIdentity(opts, domain);
  const password = opts.password || genPassword();
  const dryRun = !!opts.dryRun;

  if (dryRun) {
    return {
      email,
      name,
      localPart,
      domain,
      password,
      dryRun: true,
      created: false,
      existed: false,
      credenciais: false,
    };
  }

  const existing = mailcowApi('GET', `/api/v1/get/mailbox/${email}`);
  let existed = false;
  try {
    const parsed = JSON.parse(existing);
    existed = !!(parsed && parsed.username === email);
  } catch {
    existed = /"username"\s*:\s*"/.test(existing) && existing.includes(email);
  }

  if (existed) {
    return { email, name, created: false, existed: true, credenciais: false };
  }

  const raw = mailcowApi('POST', '/api/v1/add/mailbox', {
    local_part: localPart,
    domain,
    name,
    quota: '3072',
    password,
    password2: password,
    active: '1',
    force_pw_update: '0',
    tls_enforce_in: '0',
    tls_enforce_out: '0',
  });

  if (!/mailbox_added|success/i.test(raw)) {
    throw new Error(`falha ao criar mailbox ${email}: ${raw.slice(0, 400)}`);
  }

  let credenciais = false;
  if (opts.writeCredenciais) {
    credenciais = appendCredenciais({ email, name, password });
  }

  return { email, name, password, created: true, existed: false, credenciais };
}
