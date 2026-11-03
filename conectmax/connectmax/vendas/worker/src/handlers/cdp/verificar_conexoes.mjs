import {
  cdpScriptEnv,
  resolveApiUrl,
  resolveCdpTarget,
  resolveScreenRobotSrc,
  spawnNpm,
} from './spawn.mjs';

/** verificar_conexoes via Chrome CDP (`linkedin-extract-connections-cdp`). */
export async function run(job, ctx) {
  const cwd = resolveScreenRobotSrc();
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const apiUrl = resolveApiUrl(ctx);

  const n = String(
    job?.payload?.n || process.env.CONNECTIONS_CHECK_N || 20,
  );
  const profileUrl = String(
    job?.payload?.profileUrl ||
      process.env.LINKEDIN_PROFILE_URL ||
      process.env.AGENT_LINKEDIN_PROFILE_URL ||
      'https://www.linkedin.com/in/me/',
  ).trim();

  const args = [
    'run',
    'linkedin-extract-connections-cdp',
    '--',
    '--n',
    n,
    '--no-shot',
    '--url',
    profileUrl,
  ];

  const code = await spawnNpm(
    cwd,
    args,
    cdpScriptEnv(ctx, apiUrl, {
      ...(profileUrl ? { LINKEDIN_PROFILE_URL: profileUrl } : {}),
    }),
  );
  if (code !== 0) {
    throw new Error(`linkedin-extract-connections-cdp exit=${code} n=${n}`);
  }
  return {
    ok: true,
    type: 'verificar_conexoes',
    runtime: 'cdp',
    n: Number(n),
    cdpId,
    cdpUrl,
  };
}
