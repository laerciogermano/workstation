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

  // Default 10 = 1 página People search (CDP). Respeita slots do dia do payload;
  // ignora maxProfiles=5 legado da API se EXTRACT_MAX_PROFILES / default for maior.
  const perRunRaw = Number(process.env.EXTRACT_MAX_PROFILES || 10);
  const perRun =
    Number.isFinite(perRunRaw) && perRunRaw >= 1
      ? Math.min(500, Math.floor(perRunRaw))
      : 10;
  const daily = Number(job?.payload?.extractDailyLimit);
  const today = Number(job?.payload?.extractedToday);
  let maxProfiles;
  if (Number.isFinite(daily) && daily >= 0 && Number.isFinite(today) && today >= 0) {
    const remaining = Math.max(0, Math.floor(daily) - Math.floor(today));
    maxProfiles = String(Math.min(perRun, remaining > 0 ? remaining : perRun));
  } else {
    const fromJob = Number(job?.payload?.maxProfiles);
    maxProfiles = String(
      Number.isFinite(fromJob) && fromJob >= 1
        ? Math.min(500, Math.max(Math.floor(fromJob), perRun))
        : perRun,
    );
  }
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
