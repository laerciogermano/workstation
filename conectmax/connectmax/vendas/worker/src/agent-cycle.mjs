import { getHandler } from './handlers/index.mjs';
import {
  commitEgressIp,
  isEgressIpGuardEnabled,
  waitUntilEgressIpReady,
} from './last-egress-ip.mjs';
import { createLogger, fmtDuration, jobTypeLabel } from './log.mjs';

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
    cycle = 0,
  } = opts;

  const log = opts.log || createLogger(agentId);
  let reservedIp = null;
  const cycleLabel = cycle > 0 ? `ciclo #${cycle}` : 'ciclo';

  if (!dry && isEgressIpGuardEnabled()) {
    log.info(`${cycleLabel}: checando se o IP público pode ser usado…`);
    try {
      const status = await waitUntilEgressIpReady({
        logTag: agentId,
        log,
        shouldStop,
      });
      reservedIp = status.ip;
    } catch (e) {
      if (e && e.code === 'EGRESS_IP_WAIT_CANCELLED') {
        log.warn(e.message);
        return false;
      }
      throw e;
    }
  } else if (dry) {
    log.debug(`${cycleLabel}: guarda de IP desligada (DRY)`);
  } else {
    log.debug(`${cycleLabel}: guarda de IP desligada (SKIP_EGRESS_IP_GUARD)`);
  }

  log.info(`${cycleLabel}: pedindo job na API…`);
  const claim = await api.claim(agentId);
  if (!claim.job) {
    const reason = claim.reason || 'sem detalhe';
    log.info(`${cycleLabel}: fila vazia — ${reason}`);
    return false;
  }
  const j = claim.job;
  const label = jobTypeLabel(j.type);
  log.info(
    `${cycleLabel}: peguei job «${label}» (${j.type}) prioridade=${j.priority} id=${j.id}`,
  );
  if (j.payload && typeof j.payload === 'object') {
    const p = j.payload;
    const bits = [];
    if (p.profileUrl || p.url) bits.push(`perfil=${p.profileUrl || p.url}`);
    if (p.query) bits.push(`busca="${String(p.query).slice(0, 60)}"`);
    if (p.maxProfiles != null) bits.push(`máx=${p.maxProfiles}`);
    if (p.connectionId != null) bits.push(`conexão=${p.connectionId}`);
    if (bits.length) log.info(`  payload: ${bits.join(' · ')}`);
  }
  try {
    onClaimed?.(j.id);
  } catch {
    /* ignore */
  }

  try {
    if (dry) {
      await api.complete(agentId, j.id, { dry: true });
      log.info(`job «${label}» marcado concluído (DRY — não executou robô)`);
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
            log.warn(
              `job «${label}» falhou no shutdown (ainda esperava IP liberar)`,
            );
            return true;
          }
          const ip =
            reservedIp ||
            (
              await waitUntilEgressIpReady({
                logTag: agentId,
                log,
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
            log.info(
              `registreí IP ${commit.ip} como último usado (job ${j.id})`,
            );
            reservedIp = commit.ip;
            break;
          }
          log.info(
            `IP ${ip} ainda é o do job anterior — job «${label}» em espera até mudar`,
          );
          reservedIp = null;
          await waitUntilEgressIpReady({
            logTag: agentId,
            log,
            shouldStop,
          }).then((s) => {
            reservedIp = s.ip;
          });
        }
      }

      const where =
        cdpId || cdpUrl
          ? `Chrome CDP (${cdpId || cdpUrl})`
          : serial
            ? `AVD ${serial}`
            : 'device local';
      log.info(`executando «${label}» em ${where}…`);
      const t0 = Date.now();
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
      log.info(
        `job «${label}» OK em ${fmtDuration(Date.now() - t0)} (id=${j.id})`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.error(`job «${label}» falhou: ${msg}`);
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
