import {
  cdpScriptEnv,
  resolveApiUrl,
  resolveCdpTarget,
  resolveScreenRobotSrc,
  spawnNpm,
} from './spawn.mjs';

/** enviar_prospeccao via Chrome CDP (`linkedin-message-cdp`). */
export async function run(job, ctx) {
  const cwd = resolveScreenRobotSrc();
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const apiUrl = resolveApiUrl(ctx);

  const profileUrl = String(
    job?.payload?.profileUrl || job?.payload?.url || '',
  ).trim();
  if (!profileUrl || !/linkedin\.com\/in\//i.test(profileUrl)) {
    throw new Error(
      'enviar_prospeccao: payload.profileUrl (linkedin.com/in/…) obrigatório',
    );
  }

  const message = String(job?.payload?.message || '').trim();
  if (!message) {
    throw new Error('enviar_prospeccao: payload.message obrigatório');
  }

  const args = [
    'run',
    'linkedin-message-cdp',
    '--',
    '--url',
    profileUrl,
    '--text',
    message,
    '--no-shot',
  ];

  const code = await spawnNpm(cwd, args, cdpScriptEnv(ctx, apiUrl));
  if (code !== 0) {
    throw new Error(`linkedin-message-cdp exit=${code} url=${profileUrl}`);
  }
  return {
    ok: true,
    type: 'enviar_prospeccao',
    runtime: 'cdp',
    stub: false,
    profileUrl,
    connectionId: job?.payload?.connectionId ?? null,
    clienteLinkedinId: job?.payload?.clienteLinkedinId ?? null,
    cdpId,
    cdpUrl,
  };
}
