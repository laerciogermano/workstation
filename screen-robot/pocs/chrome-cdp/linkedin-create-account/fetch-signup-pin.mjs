/**
 * Poll Mailcow (INBOX) pelo PIN de 6 dígitos do LinkedIn — até timeoutMs (default 5 min).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const CRED_PATH = resolve(__dir, '../../../../credenciais.md');
const SSH_HOST = (process.env.MAIL_SSH_HOST || 'root@144.126.154.90').trim();
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 8_000;

function sshPass() {
  if (process.env.MAIL_SSH_PASS) return process.env.MAIL_SSH_PASS;
  if (!existsSync(CRED_PATH)) return '';
  const m = readFileSync(CRED_PATH, 'utf8').match(
    /`root@144\.126\.154\.90`\s*—\s*`([^`]+)`/,
  );
  return m ? m[1] : '';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mailFetchText(email) {
  const pass = sshPass();
  if (!pass) throw new Error('MAIL_SSH_PASS / credenciais.md ausente');
  const remote = `docker exec mailcowdockerized-dovecot-mailcow-1 doveadm fetch -u ${email} "hdr.subject text" MAILBOX INBOX 2>/dev/null | tail -c 200000`;
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
      'ConnectTimeout=20',
      SSH_HOST,
      remote,
    ],
    { env: { ...process.env, SSHPASS: pass }, encoding: 'utf8', timeout: 60_000 },
  );
  return (r.stdout || '') + (r.stderr || '');
}

function decodeMailBody(raw) {
  const soft = String(raw).replace(/=\r?\n/g, '');
  try {
    return soft
      .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&amp;/g, '&');
  } catch {
    return soft;
  }
}

/** Extrai o PIN LinkedIn mais recente do dump da INBOX. */
export function extractLinkedInPin(raw) {
  const out = String(raw || '');
  const decoded = decodeMailBody(out);
  const joined = out.replace(/\s+/g, '');
  // assunto QP: "PIN é 108399" → PIN_=C3=A9_1 + 08399
  const split = joined.match(/PIN_=C3=A9_(\d)(?:=?\?=)?(?:=?\?UTF-8\?Q\?)?(\d{5})/i);
  if (split) return split[1] + split[2];
  const qp = [...joined.matchAll(/PIN_=C3=A9_(\d{6})/gi)].map((m) => m[1]);
  if (qp.length) return qp[qp.length - 1];
  const codes = [...decoded.matchAll(/PIN[^\d]{0,30}(\d{6})/gi)].map((m) => m[1]);
  if (codes.length) return codes[codes.length - 1];
  const lone = [...decoded.matchAll(/(?:^|\n)\s*(\d{6})\s*(?:\n|$)/g)].map((m) => m[1]);
  return lone.length ? lone[lone.length - 1] : null;
}

/**
 * @param {{
 *   email: string,
 *   code?: string,
 *   timeoutMs?: number,
 *   intervalMs?: number,
 *   dryRun?: boolean,
 * }} opts
 */
export async function fetchSignupPin(opts = {}) {
  const email = String(opts.email || '').trim();
  if (!email) throw new Error('fetchSignupPin: email obrigatório');

  const given = String(opts.code || opts.pin || '').trim();
  if (given) {
    return { email, code: given, attempts: 0, waitedMs: 0, source: 'given' };
  }

  if (opts.dryRun) {
    return { email, code: null, attempts: 0, waitedMs: 0, source: 'dry-run' };
  }

  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const intervalMs =
    Number(opts.intervalMs) > 0 ? Number(opts.intervalMs) : DEFAULT_INTERVAL_MS;
  const started = Date.now();
  let attempts = 0;
  let lastRawLen = 0;

  while (Date.now() - started < timeoutMs) {
    attempts += 1;
    let raw = '';
    try {
      raw = mailFetchText(email);
      lastRawLen = raw.length;
    } catch (e) {
      console.error(`PIN poll ${attempts}: ssh/erro — ${e.message || e}`);
      await sleep(intervalMs);
      continue;
    }
    const code = extractLinkedInPin(raw);
    if (code) {
      return {
        email,
        code,
        attempts,
        waitedMs: Date.now() - started,
        source: 'mailcow',
      };
    }
    const left = Math.max(0, timeoutMs - (Date.now() - started));
    console.error(
      `PIN poll ${attempts}: sem código (inbox ~${lastRawLen}b, restam ${Math.ceil(left / 1000)}s)`,
    );
    if (left < intervalMs) break;
    await sleep(intervalMs);
  }

  throw new Error(
    `PIN LinkedIn não chegou em ${Math.round(timeoutMs / 1000)}s (${attempts} tentativas, ${email})`,
  );
}
