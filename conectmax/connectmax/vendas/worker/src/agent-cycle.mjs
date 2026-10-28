import { getHandler } from './handlers/index.mjs';

/**
 * Um ciclo claim→handler→complete/fail para um agentId.
 * @returns {Promise<boolean>} true se processou job
 */
export async function runAgentCycle(api, opts) {
  const {
    agentId,
    serial = '',
    apiUrl,
    apiKey,
    dry = false,
  } = opts;

  const claim = await api.claim(agentId);
  if (!claim.job) {
    console.log(`[${agentId}] idle: ${claim.reason}`);
    return false;
  }
  const j = claim.job;
  console.log(
    `[${agentId}] claimed ${j.type} p=${j.priority} id=${j.id}`,
  );

  if (dry) {
    await api.complete(agentId, j.id, { dry: true });
    console.log(`[${agentId}] completed (DRY)`);
    return true;
  }

  try {
    const handler = getHandler(j.type);
    const result = await handler(j, {
      apiUrl,
      apiKey,
      serial,
      agentId,
    });
    await api.complete(agentId, j.id, result || { ok: true });
    console.log(`[${agentId}] completed ${j.type}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${agentId}] fail ${j.type}:`, msg);
    await api.fail(agentId, j.id, msg);
  }
  return true;
}
