import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * AC-01: Messaging → Unread no AVD; com --sync abre cada chat e persiste
 * em client_linkedin_message (resolve URL via GET /clientes?q=nome).
 * Reusa: npm run linkedin-unread-messages → lib/linkedin-unread-messages.js
 *
 * Env: EXTRACT_CWD / CONNECT_CWD, SERIAL, INBOX_MAX_RESULTS (default 20),
 *      PROFILES_API_URL / API_URL, MESSAGES_API_URL, AGENT_API_KEY, AGENT_ID
 * Job payload: maxResults? / n?
 */
export async function run(job, ctx) {
  const cwd = resolve(
    process.cwd(),
    process.env.EXTRACT_CWD ||
      process.env.CONNECT_CWD ||
      '../../../../screen-robot/src',
  );
  if (!existsSync(cwd)) {
    throw new Error(`EXTRACT_CWD inexistente: ${cwd}`);
  }

  const serial = ctx.serial || process.env.SERIAL || process.env.ADB_SERIAL;
  const maxResults = String(
    job?.payload?.maxResults ||
      job?.payload?.n ||
      process.env.INBOX_MAX_RESULTS ||
      20,
  );
  const apiUrl = (
    process.env.PROFILES_API_URL ||
    ctx.apiUrl ||
    process.env.API_URL ||
    ''
  ).replace(/\/$/, '');
  if (!apiUrl) throw new Error('PROFILES_API_URL ou API_URL obrigatório');

  const agentId = String(ctx.agentId || process.env.AGENT_ID || '').trim();
  const args = [
    'run',
    'linkedin-unread-messages',
    '--',
    '--max-results',
    maxResults,
    '--sync',
    '--no-shot',
  ];
  if (serial) args.push('--device', serial);

  const code = await spawnNpm(cwd, args, {
    ...process.env,
    PROFILES_API_URL: apiUrl,
    MESSAGES_API_URL: process.env.MESSAGES_API_URL || apiUrl,
    ...(serial ? { ADB_SERIAL: serial, SERIAL: serial } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    ...(agentId ? { AGENT_ID: agentId } : {}),
  });

  if (code !== 0) {
    throw new Error(
      `linkedin-unread-messages exit=${code} maxResults=${maxResults}`,
    );
  }
  return {
    ok: true,
    type: 'ler_mensagens',
    stub: false,
    sync: true,
    maxResults: Number(maxResults),
    serial: serial || null,
  };
}

function spawnNpm(cwd, args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('npm', args, {
      cwd,
      env,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise(code ?? 1));
  });
}
