import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * AC-01: Messaging → Unread no AVD (lista conversas não lidas).
 * Reusa: npm run linkedin-unread-messages → lib/linkedin-unread-messages.js
 * Equivalente a POST http://127.0.0.1:3099/unread-messages
 *
 * Env: EXTRACT_CWD / CONNECT_CWD, SERIAL, INBOX_MAX_RESULTS (default 20)
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

  const args = [
    'run',
    'linkedin-unread-messages',
    '--',
    '--max-results',
    maxResults,
    '--no-shot',
  ];
  if (serial) args.push('--device', serial);

  const code = await spawnNpm(cwd, args, {
    ...process.env,
    ...(serial ? { ADB_SERIAL: serial, SERIAL: serial } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    ...(ctx.agentId ? { AGENT_ID: String(ctx.agentId) } : {}),
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
