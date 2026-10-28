import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * AC-03: linkedin-connect no AVD (URL → Connect → Pending).
 * Env: EXTRACT_CWD (screen-robot/src), SERIAL, PROFILES_API_URL / API_URL, AGENT_API_KEY
 * Job payload: profileUrl (obrigatório), connectionId?, clienteLinkedinId?
 */
export async function run(job, ctx) {
  const cwd = resolve(
    process.cwd(),
    process.env.EXTRACT_CWD ||
      process.env.CONNECT_CWD ||
      '../../../../screen-robot/src',
  );
  if (!existsSync(cwd)) {
    throw new Error(`EXTRACT_CWD/CONNECT_CWD inexistente: ${cwd}`);
  }

  const profileUrl = String(
    job?.payload?.profileUrl || job?.payload?.url || '',
  ).trim();
  if (!profileUrl || !/linkedin\.com\/in\//i.test(profileUrl)) {
    throw new Error('conectar: payload.profileUrl (linkedin.com/in/…) obrigatório');
  }

  const serial = ctx.serial || process.env.SERIAL || process.env.ADB_SERIAL;
  const apiUrl = (
    process.env.PROFILES_API_URL ||
    ctx.apiUrl ||
    ''
  ).replace(/\/$/, '');
  if (!apiUrl) throw new Error('PROFILES_API_URL ou API_URL obrigatório');

  const agentId = String(ctx.agentId || process.env.AGENT_ID || '').trim();
  const args = [
    'run',
    'linkedin-connect',
    '--',
    '--url',
    profileUrl,
    '--no-shot',
  ];
  if (serial) args.push('--device', serial);

  const code = await spawnNpm(cwd, args, {
    ...process.env,
    PROFILES_API_URL: apiUrl,
    ...(serial ? { ADB_SERIAL: serial, SERIAL: serial } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    ...(agentId ? { AGENT_ID: agentId } : {}),
  });

  if (code !== 0) {
    throw new Error(`linkedin-connect exit=${code} url=${profileUrl}`);
  }
  return {
    ok: true,
    type: 'conectar',
    profileUrl,
    connectionId: job?.payload?.connectionId ?? null,
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
