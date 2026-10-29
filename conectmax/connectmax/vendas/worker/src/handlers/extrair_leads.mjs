import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * AC-04: roda login-extract-profiles no AVD local.
 * Env: EXTRACT_CWD, SERIAL (ou ADB_SERIAL), PROFILES_API_URL / API_URL,
 *      EXTRACT_MAX_PROFILES, EXTRACT_QUERY
 */
export async function run(job, ctx) {
  const cwd = resolve(
    process.cwd(),
    process.env.EXTRACT_CWD || '../../../../screen-robot/src',
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

  const maxProfiles = String(
    process.env.EXTRACT_MAX_PROFILES ||
      job?.payload?.maxProfiles ||
      10,
  );
  const query = String(
    process.env.EXTRACT_QUERY || job?.payload?.query || '',
  ).trim();

  const args = ['run', 'login-extract-profiles', '--', '--max-profiles', maxProfiles];
  if (query) args.push('--query', query);
  if (serial) args.push('--device', serial);

  const agentId = String(ctx.agentId || process.env.AGENT_ID || '').trim();

  const code = await spawnNpm(cwd, args, {
    ...process.env,
    PROFILES_API_URL: apiUrl,
    ...(serial ? { ADB_SERIAL: serial, SERIAL: serial, ANDROID_SERIAL: serial } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    // Reserva status=0 no extract (Candidatos do funil por agente).
    ...(agentId ? { AGENT_ID: agentId } : {}),
  });

  if (code !== 0) {
    throw new Error(`login-extract-profiles exit=${code}`);
  }
  return {
    ok: true,
    type: 'extrair_leads',
    maxProfiles: Number(maxProfiles),
    query: query || null,
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
