import {
  cdpScriptEnv,
  resolveApiUrl,
  resolveCdpTarget,
  resolveScreenRobotSrc,
  spawnNpm,
} from './spawn.mjs';

/** ler_mensagens via Chrome CDP (`linkedin-unread-messages-cdp --sync`). */
export async function run(job, ctx) {
  const cwd = resolveScreenRobotSrc();
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const apiUrl = resolveApiUrl(ctx);

  const maxResults = String(
    job?.payload?.maxResults ||
      job?.payload?.n ||
      process.env.INBOX_MAX_RESULTS ||
      20,
  );

  const args = [
    'run',
    'linkedin-unread-messages-cdp',
    '--',
    '--max-results',
    maxResults,
    '--sync',
    '--no-shot',
  ];

  const code = await spawnNpm(cwd, args, cdpScriptEnv(ctx, apiUrl));
  if (code !== 0) {
    throw new Error(
      `linkedin-unread-messages-cdp exit=${code} maxResults=${maxResults}`,
    );
  }
  return {
    ok: true,
    type: 'ler_mensagens',
    runtime: 'cdp',
    stub: false,
    sync: true,
    maxResults: Number(maxResults),
    cdpId,
    cdpUrl,
  };
}
