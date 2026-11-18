import { pool } from "../../db/pool";
import { logger } from "../../logger";

/**
 * Executor de IA em processo (ADR: sem Redis/BullMQ enquanto houver 1 instância; os estados ficam no Postgres,
 * então um reinício nunca perde o que já terminou — o que estava "exec" volta a "pendente" no boot).
 * Simula o ciclo pendente → exec → ok das funções com agente IA; a chamada real ao modelo entra aqui depois.
 */
const timers = new Map<number, NodeJS.Timeout[]>();
const clear = (id: number) => { (timers.get(id) ?? []).forEach(clearTimeout); timers.delete(id); };

export async function reconcileOnBoot(): Promise<void> {
  const r = await pool.query("update flow.elements set status = 'pendente' where status = 'exec'");
  if (r.rowCount) logger.warn({ n: r.rowCount }, "execuções interrompidas voltaram a pendente");
}

export async function startRun(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await pool.query("update flow.elements set status = 'pendente', error = null where id = any($1::bigint[])", [ids]);
  ids.forEach((id, i) => {
    clear(id);
    const t1 = setTimeout(() => { pool.query("update flow.elements set status = 'exec' where id = $1 and status = 'pendente'", [id]).catch(e => logger.error({ e }, "run exec")); }, 500 + i * 250);
    const t2 = setTimeout(() => { pool.query("update flow.elements set status = 'ok' where id = $1 and status = 'exec'", [id]).catch(e => logger.error({ e }, "run ok")); timers.delete(id); }, 4200 + i * 900);
    timers.set(id, [t1, t2]);
  });
}

export async function cancelRun(planId: number): Promise<number> {
  const { rows } = await pool.query("update flow.elements set status = 'cancel' where plan_id = $1 and status = 'exec' returning id", [planId]);
  rows.forEach(r => clear(r.id));
  return rows.length;
}
export const stopAllTimers = (): void => { [...timers.keys()].forEach(clear); };
