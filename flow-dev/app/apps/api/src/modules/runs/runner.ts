import { FlowModel, type ElementDto } from "@flow/shared";
import { pool } from "../../db/pool";
import { logger } from "../../logger";
import { loadSnapshot } from "../projects/snapshot.repo";
import { runMachine } from "./machine-sandbox";

/**
 * Executor em processo (ADR-004). Executar vale para TUDO, conforme quem é o responsável da etapa:
 *  · biblioteca/script Node → o Node executa (sandbox simulado) e as saídas viram valores do state;
 *  · agente de IA          → a IA executa (chamada real ainda simulada);
 *  · pessoa                → nada a executar: fica "aguardando" até ela concluir.
 * A ordem segue os passos sN do Flow (mesmo passo = paralelo). Para no 1º passo com falha, espera ou cancelamento.
 */
const active = new Map<number, { cancelled: boolean }>(); // planId interno → controle
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const IA_MS = 1300;

export async function reconcileOnBoot(): Promise<void> {
  const r = await pool.query("update flow.elements set status = 'pendente' where status = 'exec'");
  if (r.rowCount) logger.warn({ n: r.rowCount }, "execuções interrompidas voltaram a pendente");
}
const setStatus = (pub: string, status: string | null, error: string | null = null) =>
  pool.query("update flow.elements set status = $2, error = $3 where public_id = $1", [pub, status, error]);

const isLeaf = (m: FlowModel, u: ElementDto) => !m.isData(u) && !m.isFolder(u) && !m.flowKids(u).length;

/** Entradas da etapa: valor do state, ou a referência de saída de quem já produziu (status ok). */
export function machineInputs(m: FlowModel, u: ElementDto): Record<string, string | null> {
  const inputs: Record<string, string | null> = {};
  u.ins.forEach(n => {
    const v = m.dValue(n); if (v) { inputs[n] = v; return; }
    const prod = m.els.find(x => !x.archived && x.outs.some(o => o[0] === n));
    inputs[n] = prod && prod.status === "ok" ? prod.outs.find(o => o[0] === n)![1] : null;
  });
  return inputs;
}

type Outcome = "ok" | "fail" | "wait" | "cancel";
async function executeOne(projectId: number, m: FlowModel, u: ElementDto, ctl?: { cancelled: boolean }): Promise<Outcome> {
  const a = m.agent(u.agentId);
  if (!a) { await setStatus(u.id, "fail", "Sem responsável: atribua uma pessoa, um agente ou uma biblioteca."); return "fail"; }
  if (a.kind === "pessoa") { await setStatus(u.id, "wait"); return "wait"; }
  await setStatus(u.id, "exec");
  if (a.kind === "ia") {
    await sleep(IA_MS);
    if (ctl?.cancelled) return "cancel";
    await setStatus(u.id, "ok"); return "ok";
  }
  const r = await runMachine({ title: u.title, code: u.code ?? `// ${u.title} · Node.js\nconsole.log("olá")`, inputs: machineInputs(m, u), declared: u.ins });
  if (ctl?.cancelled) return "cancel";
  if (!r.ok) { await setStatus(u.id, "fail", r.lines.filter(l => l.kind === "er").map(l => l.text.replace(/^✗ /, "")).join(" · ") || "Falhou"); return "fail"; }
  for (const [k, v] of Object.entries(r.saida)) {
    if (!u.outs.some(o => o[0] === k)) continue;
    const val = (typeof v === "string" ? v : JSON.stringify(v)).slice(0, 10_000);
    await pool.query("update flow.data_defs set value = $3 where project_id = $1 and name = $2", [projectId, k, val]);
  }
  await setStatus(u.id, "ok"); return "ok";
}

/** Executa o plano inteiro (assíncrono). Devolve quantas etapas entraram na fila. */
export async function startPlanRun(projectId: number, planId: number, planPublic: string): Promise<number> {
  if (active.has(planId)) return 0;
  const m0 = new FlowModel(await loadSnapshot(pool, projectId));
  const todo = m0.ganttRows(planPublic).map(r => r.u).filter(u => isLeaf(m0, u) && (!u.status || u.status === "pendente" || u.status === "wait"));
  if (!todo.length) return 0;
  await pool.query("update flow.elements set status = 'pendente', error = null where public_id = any($1::uuid[])", [todo.map(u => u.id)]);
  const ctl = { cancelled: false };
  active.set(planId, ctl);
  void (async () => {
    try {
      const steps = [...new Set(todo.map(u => m0.flowLayout(planPublic).layout[u.id]?.s ?? 0))].sort((a, b) => a - b);
      for (const s of steps) {
        if (ctl.cancelled) break;
        const m = new FlowModel(await loadSnapshot(pool, projectId)); // estado atual (produtores já ok)
        const group = todo.filter(u => (m0.flowLayout(planPublic).layout[u.id]?.s ?? 0) === s).map(u => m.u(u.id)!).filter(u => u && u.status === "pendente");
        const res = await Promise.all(group.map(u => executeOne(projectId, m, u, ctl)));
        if (res.some(x => x === "fail" || x === "wait" || x === "cancel")) break;
      }
    } catch (e) { logger.error({ e }, "falha no runner"); }
    finally { active.delete(planId); }
  })();
  return todo.length;
}

/** Tentar de novo uma etapa só. */
export async function runSingle(projectId: number, elementPublic: string): Promise<void> {
  const m = new FlowModel(await loadSnapshot(pool, projectId));
  const u = m.u(elementPublic); if (!u) return;
  await pool.query("update flow.elements set error = null where public_id = $1", [u.id]);
  void executeOne(projectId, m, u).catch(e => logger.error({ e }, "retry"));
}

/** A pessoa concluiu: marca ok e, se for o caso, retoma o plano de onde parou. */
export async function completeByPerson(projectId: number, planId: number, planPublic: string, elementPublic: string): Promise<boolean> {
  const r = await pool.query(
    `update flow.elements e set status = 'ok', error = null from flow.agents a where e.agent_id = a.id and a.kind = 'pessoa' and e.public_id = $1 and (e.status is null or e.status in ('wait','pendente')) returning e.id`, [elementPublic]);
  if (!r.rowCount) return false;
  await startPlanRun(projectId, planId, planPublic);
  return true;
}

export async function cancelRun(planId: number): Promise<number> {
  const c = active.get(planId); if (c) c.cancelled = true;
  const { rows } = await pool.query("update flow.elements set status = 'cancel' where plan_id = $1 and status in ('exec', 'pendente', 'wait') returning id", [planId]);
  return rows.length;
}
export const stopAllTimers = (): void => { active.forEach(c => { c.cancelled = true; }); };
