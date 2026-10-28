import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Reusa a programação já existente no screen-robot:
 *   npm run linkedin-extract-connections
 *   → lib/linkedin-extract-connections.js (extractRecentConnections)
 *   → POST /client-connections-linkedin/mark-accepted
 * Equivalente a POST http://127.0.0.1:3099/connections (linkedin-connect-api).
 *
 * Env: EXTRACT_CWD, SERIAL, PROFILES_API_URL / API_URL, AGENT_API_KEY,
 *      CONNECTIONS_CHECK_N (default 20)
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
  const apiUrl = (
    process.env.PROFILES_API_URL ||
    ctx.apiUrl ||
    ''
  ).replace(/\/$/, '');
  if (!apiUrl) throw new Error('PROFILES_API_URL ou API_URL obrigatório');

  // Lote padrão: 20 últimas (payload da API / CONNECTIONS_CHECK_N).
  const n = String(
    job?.payload?.n ||
      process.env.CONNECTIONS_CHECK_N ||
      20,
  );

  const agentId = String(ctx.agentId || process.env.AGENT_ID || '').trim();
  const profileUrl = String(
    job?.payload?.profileUrl ||
      process.env.LINKEDIN_PROFILE_URL ||
      process.env.AGENT_LINKEDIN_PROFILE_URL ||
      'https://www.linkedin.com/in/me/',
  ).trim();

  const args = [
    'run',
    'linkedin-extract-connections',
    '--',
    '--n',
    n,
    '--no-shot',
    '--url',
    profileUrl,
  ];
  if (serial) args.push('--device', serial);

  const code = await spawnNpm(cwd, args, {
    ...process.env,
    PROFILES_API_URL: apiUrl,
    INVITES_API_URL: apiUrl,
    ...(serial ? { ADB_SERIAL: serial, SERIAL: serial } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    ...(agentId ? { AGENT_ID: agentId } : {}),
    ...(profileUrl ? { LINKEDIN_PROFILE_URL: profileUrl } : {}),
  });

  if (code !== 0) {
    throw new Error(`linkedin-extract-connections exit=${code} n=${n}`);
  }
  return {
    ok: true,
    type: 'verificar_conexoes',
    n: Number(n),
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
