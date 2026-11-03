import {
  cdpScriptEnv,
  resolveApiUrl,
  resolveCdpTarget,
  resolveScreenRobotSrc,
  spawnNpm,
} from './spawn.mjs';

/**
 * extrair_leads via Chrome CDP (`linkedin-extract-leads-cdp`).
 * Mesmo contrato do handler AVD: query + maxProfiles do job; AGENT_ID reserva status=0.
 */
export async function run(job, ctx) {
  const cwd = resolveScreenRobotSrc();
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const apiUrl = resolveApiUrl(ctx);

  const maxProfiles = String(
    job?.payload?.maxProfiles || process.env.EXTRACT_MAX_PROFILES || 5,
  );
  const query = String(
    process.env.EXTRACT_QUERY || job?.payload?.query || '',
  ).trim();

  const args = [
    'run',
    'linkedin-extract-leads-cdp',
    '--',
    '-n',
    maxProfiles,
    '--no-shot',
  ];
  if (query) args.push('--query', query);

  const code = await spawnNpm(cwd, args, cdpScriptEnv(ctx, apiUrl));
  if (code !== 0) {
    throw new Error(`linkedin-extract-leads-cdp exit=${code}`);
  }
  return {
    ok: true,
    type: 'extrair_leads',
    runtime: 'cdp',
    maxProfiles: Number(maxProfiles),
    query: query || null,
    cdpId,
    cdpUrl,
  };
}
