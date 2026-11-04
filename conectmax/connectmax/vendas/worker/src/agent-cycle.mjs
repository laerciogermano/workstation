import { getHandler } from './handlers/index.mjs';
import {
  commitEgressIp,
  isEgressIpGuardEnabled,
  waitUntilEgressIpReady,
} from './last-egress-ip.mjs';

/**
 * Um ciclo claim→handler→complete/fail para um agentId.
 * Com guarda de IP: espera o egress mudar antes de claimar; se igual, não claima.
 * @returns {Promise<boolean>} true se processou job
 */
export async function runAgentCycle(api, opts) {
  const {
    agentId,
    serial = '',
    cdpId = '',
    cdpUrl = '',
    apiUrl,
    apiKey,
    dry = false,
    onClaimed,
    onSettled,
    shouldStop,
    runtime,
  } = opts;

  let reservedIp = null;

  if (!dry && isEgressIpGuardEnabled()) {
    try {
      const status = await waitUntilEgressIpReady({
        logTag: agentId,
        shouldStop,
      });
      reservedIp = status.ip;
      console.log(
        `[${agentId}] egress apto IP=${status.ip}${status.previous ? ` (prev=${status.previous})` : ' (primeiro)'}`,
      );
    } catch (e) {
      if (e && e.code === 'EGRESS_IP_WAIT_CANCELLED') {
        console.warn(`[${agentId}] ${e.message}`);
        return false;
      }
      throw e;
    }
  }

  const claim = await api.claim(agentId);
  if (!claim.job) {
    console.log(`[${agentId}] idle: ${claim.reason}`);
    return false;
  }
  const j = claim.job;
  console.log(
    `[${agentId}] claimed ${j.type} p=${j.priority} id=${j.id}`,
  );
  try {
    onClaimed?.(j.id);
  } catch {
    /* ignore */
  }

  try {
    if (dry) {
      await api.complete(agentId, j.id, { dry: true });
      console.log(`[${agentId}] completed (DRY)`);
      return true;
    }

    try {
      if (isEgressIpGuardEnabled()) {
        // Revalida + grava último IP + timeline; se IP voltou a ser o último, espera de novo sem executar.
        for (;;) {
          if (shouldStop?.()) {
            await api.fail(
              agentId,
              j.id,
              'worker shutdown — job interrompido antes da execução (IP)',
            );
            return true;
          }
          const ip =
            reservedIp ||
            (
              await waitUntilEgressIpReady({
                logTag: agentId,
                shouldStop,
              })
            ).ip;
          const commit = await commitEgressIp(ip, {
            agentId,
            jobId: j.id,
            jobType: j.type,
            runtime:
              runtime ||
              (cdpId || cdpUrl ? 'cdp' : serial ? 'avd' : undefined),
          });
          if (commit.committed) {
            console.log(
              `[${agentId}] egress commit IP=${commit.ip} timeline=${commit.timeline?.at || '-'}`,
            );
            reservedIp = commit.ip;
            break;
          }
          console.log(
            `[${agentId}] IP ${ip} ainda igual ao último — aguardando mudar (job ${j.id} em hold)`,
          );
          reservedIp = null;
          await waitUntilEgressIpReady({
            logTag: agentId,
            shouldStop,
          }).then((s) => {
            reservedIp = s.ip;
          });
        }
      }

      const handler = getHandler(j.type);
      const result = await handler(j, {
        apiUrl,
        apiKey,
        serial,
        cdpId,
        cdpUrl,
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
  } finally {
    try {
      onSettled?.(j.id);
    } catch {
      /* ignore */
    }
  }
}
