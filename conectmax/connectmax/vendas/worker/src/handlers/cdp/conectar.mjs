import {
  cdpScriptEnv,
  resolveApiUrl,
  resolveCdpTarget,
  resolveScreenRobotSrc,
  spawnNpm,
} from './spawn.mjs';

/** conectar via Chrome CDP (`linkedin-connect-cdp`). */
export async function run(job, ctx) {
  const cwd = resolveScreenRobotSrc();
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const apiUrl = resolveApiUrl(ctx);

  const profileUrl = String(
    job?.payload?.profileUrl || job?.payload?.url || '',
  ).trim();
  if (!profileUrl || !/linkedin\.com\/in\//i.test(profileUrl)) {
    throw new Error('conectar: payload.profileUrl (linkedin.com/in/…) obrigatório');
  }

  const args = [
    'run',
    'linkedin-connect-cdp',
    '--',
    '--url',
    profileUrl,
    '--no-shot',
  ];

  // Connect travado (CDP/modal) não pode segurar o worker para sempre.
  const code = await spawnNpm(
    cwd,
    args,
    cdpScriptEnv(ctx, apiUrl, {
      WORKER_SCRIPT_TIMEOUT_MS:
        process.env.CONNECT_SCRIPT_TIMEOUT_MS || '360000',
    }),
  );
  if (code !== 0) {
    throw new Error(`linkedin-connect-cdp exit=${code} url=${profileUrl}`);
  }
  return {
    ok: true,
    type: 'conectar',
    runtime: 'cdp',
    profileUrl,
    connectionId: job?.payload?.connectionId ?? null,
    cdpId,
    cdpUrl,
  };
}
