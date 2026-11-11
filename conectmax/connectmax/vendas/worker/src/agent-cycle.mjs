import { getHandler } from './handlers/index.mjs';
import { createLogger, fmtDuration, jobTypeLabel } from './log.mjs';

/**
 * Um ciclo claim→handler→complete/fail para um agentId.
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
    runtime,
    cycle = 0,
  } = opts;

  const log = opts.log || createLogger(agentId);
  const cycleLabel = cycle > 0 ? `ciclo #${cycle}` : 'ciclo';

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
