import type { PatchElementBody } from "@flow/shared";
import type { Db } from "../../db/pool";
import { badRequest } from "../../shared/errors";
import { descIds, ensureData, getEl, getPlanId, resolveResp, respTasks, setOrder, siblingIds, type ElRow } from "./elements.repo";

export type Mode = "child" | "after" | "before";

/** Irmãos "de função" (sem pasta/dado/arquivados) usados para religar a sequência. */
async function fnSiblings(db: Db, projectId: number, parentId: number | null, exceptId: number): Promise<number[]> {
  const { rows } = await db.query("select id from flow.elements where project_id=$1 and parent_id is not distinct from $2 and kind = 'file' and not archived and id <> $3 order by position, id", [projectId, parentId, exceptId]);
  return rows.map(r => r.id as number);
}
async function addLink(db: Db, a: number, b: number, kind: "seq" | "par" = "seq"): Promise<void> {
  if (a !== b) await db.query("insert into flow.links (from_id, to_id, kind) values ($1,$2,$3) on conflict do nothing", [a, b, kind]);
}

/** Tira o elemento da sequência sem apagar: a → u → b vira a → b (porta de unlinkSeq). */
export async function unlinkSeq(db: Db, id: number): Promise<void> {
  const ins = (await db.query("select from_id from flow.links where to_id = $1 and kind = 'seq'", [id])).rows.map(r => r.from_id as number);
  const outs = (await db.query("select to_id from flow.links where from_id = $1 and kind = 'seq'", [id])).rows.map(r => r.to_id as number);
  await db.query("delete from flow.links where from_id = $1 or to_id = $1", [id]);
  for (const a of ins) for (const b of outs) await addLink(db, a, b);
  await db.query("delete from flow.struct_members where element_id = $1", [id]);
}

/** Encaixa u (com a subárvore) junto de ref: child = último filho · after/before = irmão, já ligado na sequência. */
export async function linkInto(db: Db, projectId: number, u: ElRow, ref: ElRow, mode: Mode): Promise<void> {
  const parentId = mode === "child" ? ref.id : ref.parent_id;
  const sibs = await fnSiblings(db, projectId, parentId, u.id);
  const oldOrder = (await siblingIds(db, projectId, u.parent_id)).filter(i => i !== u.id);
  if (u.parent_id !== parentId) await setOrder(db, oldOrder);
  await db.query("update flow.elements set parent_id = $2 where id = $1", [u.id, parentId]);
  const order = (await siblingIds(db, projectId, parentId)).filter(i => i !== u.id);
  const at = mode === "child" ? order.length : order.indexOf(ref.id) + (mode === "after" ? 1 : 0);
  order.splice(at < 0 ? order.length : at, 0, u.id);
  await setOrder(db, order);
  const block = [u.id, ...(await descIds(db, u.id))];
  await db.query("update flow.elements set plan_id = $2 where id = any($1::bigint[])", [block, ref.plan_id]);
  if (mode === "child") {
    const last = sibs[sibs.length - 1]; if (last) await addLink(db, last, u.id);
  } else if (mode === "after") {
    await db.query("update flow.links set from_id = $1 where from_id = $2 and kind = 'seq' and to_id = any($3::bigint[]) and to_id <> $1", [u.id, ref.id, sibs]);
    await addLink(db, ref.id, u.id);
  } else {
    await db.query("update flow.links set to_id = $1 where to_id = $2 and kind = 'seq' and from_id = any($3::bigint[]) and from_id <> $1", [u.id, ref.id, sibs]);
    await addLink(db, u.id, ref.id);
  }
  if (mode !== "child") {
    // entra no corpo do if que contém ref
    const { rows } = await db.query("select struct_id, position from flow.struct_members where element_id = $1", [ref.id]);
    for (const r of rows) {
      await db.query("update flow.struct_members set position = position + 1 where struct_id = $1 and position >= $2", [r.struct_id, r.position + (mode === "after" ? 1 : 0)]);
      await db.query("insert into flow.struct_members (struct_id, element_id, position) values ($1,$2,$3) on conflict do nothing", [r.struct_id, u.id, r.position + (mode === "after" ? 1 : 0)]);
    }
  }
}

export async function createElement(db: Db, projectId: number, input: { mode: "child" | "after" | "before" | "root"; refId?: string; planId?: string; title?: string; context?: string }): Promise<string> {
  const title = input.title ?? (input.mode === "root" ? "Fazer novo fluxo" : "Fazer nova função");
  if (input.mode === "root") {
    if (!input.planId) throw badRequest("Informe o plano");
    const planId = await getPlanId(db, projectId, input.planId);
    const root = (await db.query("select id from flow.elements where project_id=$1 and plan_id=$2 and kind='folder' and parent_id is null and not archived order by position, id limit 1", [projectId, planId])).rows[0];
    const pos = (await db.query("select coalesce(max(position)+1, 0) as p from flow.elements where project_id=$1 and parent_id is not distinct from $2", [projectId, root?.id ?? null])).rows[0].p;
    const { rows } = await db.query("insert into flow.elements (project_id, plan_id, parent_id, kind, title, context, position) values ($1,$2,$3,'file',$4,$5,$6) returning public_id",
      [projectId, planId, root?.id ?? null, title, input.context ?? "Fluxo adicionado no Explorar", pos]);
    return rows[0].public_id;
  }
  if (!input.refId) throw badRequest("Informe o elemento de referência");
  const ref = await getEl(db, projectId, input.refId);
  if (ref.kind === "data") throw badRequest("Dado não aceita filhos nem irmãos");
  if (input.mode !== "child" && (ref.parent_id == null)) throw badRequest("A raiz do fluxo não ganha irmão");
  const { rows } = await db.query("insert into flow.elements (project_id, plan_id, parent_id, kind, title, context, position) values ($1,$2,$3,'file',$4,$5,999999) returning id, public_id, parent_id, plan_id, kind, title, position, archived",
    [projectId, ref.plan_id, null, title, input.context ?? null]);
  await linkInto(db, projectId, rows[0], ref, input.mode);
  return rows[0].public_id;
}

export async function moveElement(db: Db, projectId: number, id: string, refId: string, mode: Mode): Promise<void> {
  const u = await getEl(db, projectId, id), ref = await getEl(db, projectId, refId);
  if (u.id === ref.id || u.kind === "data") throw badRequest("Movimento inválido");
  if ((await descIds(db, u.id)).includes(ref.id)) throw badRequest("Não dá para mover para dentro dele mesmo");
  if (mode !== "child" && ref.parent_id == null) throw badRequest("A raiz do fluxo não ganha irmão");
  await unlinkSeq(db, u.id);
  await linkInto(db, projectId, u, ref, mode);
}

export async function removeElements(db: Db, projectId: number, ids: string[]): Promise<number> {
  let n = 0;
  for (const pid of ids) {
    const u = await getEl(db, projectId, pid).catch(() => null); if (!u) continue; // já saiu junto de um ancestral
    const all = [u.id, ...(await descIds(db, u.id))];
    await unlinkSeq(db, u.id);
    const parent = u.parent_id;
    const { rowCount } = await db.query("delete from flow.elements where id = any($1::bigint[]) and project_id = $2", [all, projectId]);
    n += rowCount ?? 0;
    await setOrder(db, await siblingIds(db, projectId, parent));
  }
  await db.query("delete from flow.structs s where s.project_id = $1 and not exists (select 1 from flow.struct_members m where m.struct_id = s.id)", [projectId]);
  return n;
}

/** Copia a árvore (ios, loop, cond, código) com IDRs novos; título “(cópia)” se já existir entre os irmãos. */
export async function cloneTree(db: Db, projectId: number, srcId: number, parentId: number | null): Promise<number> {
  const src = (await db.query("select * from flow.elements where id = $1", [srcId])).rows[0];
  const titles = new Set((await db.query("select title from flow.elements where project_id=$1 and parent_id is not distinct from $2", [projectId, parentId])).rows.map(r => r.title as string));
  let title = src.title as string;
  if (titles.has(title)) { title = `${src.title} (cópia)`; let n = 2; while (titles.has(title)) title = `${src.title} (cópia ${n++})`; }
  const pos = (await db.query("select coalesce(max(position)+1,0) as p from flow.elements where project_id=$1 and parent_id is not distinct from $2", [projectId, parentId])).rows[0].p;
  const ins = await db.query(
    `insert into flow.elements (project_id, plan_id, parent_id, kind, title, context, agent_id, resp_id, agent_ref, resp_ref, status, progress, loop_var, loop_list, cond_test, code, position)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) returning id`,
    [projectId, src.plan_id, parentId, src.kind, title, src.context, src.agent_id, src.resp_id, src.agent_ref, src.resp_ref, src.status ? "pendente" : null, null, src.loop_var, src.loop_list, src.cond_test, src.code, pos]);
  const nid = ins.rows[0].id as number;
  await db.query("insert into flow.element_ios (element_id, direction, name, ref, position) select $1, direction, name, ref, position from flow.element_ios where element_id = $2", [nid, srcId]);
  const kids = (await db.query("select id from flow.elements where parent_id = $1 order by position, id", [srcId])).rows;
  for (const k of kids) await cloneTree(db, projectId, k.id, nid);
  return nid;
}

export async function pasteElements(db: Db, projectId: number, ids: string[], mode: "cut" | "copy", destPublic: string | null): Promise<void> {
  const dest = destPublic ? await getEl(db, projectId, destPublic) : null;
  if (dest && dest.kind === "data") throw badRequest("Destino inválido");
  for (const pid of ids) {
    const u = await getEl(db, projectId, pid);
    if (mode === "cut") {
      if (dest && (u.id === dest.id || (await descIds(db, u.id)).includes(dest.id))) throw badRequest("Não dá para colar dentro dele mesmo");
      const oldParent = u.parent_id;
      await unlinkSeq(db, u.id);
      const pos = (await db.query("select coalesce(max(position)+1,0) as p from flow.elements where project_id=$1 and parent_id is not distinct from $2", [projectId, dest?.id ?? null])).rows[0].p;
      await db.query("update flow.elements set parent_id = $2, position = $3 where id = $1", [u.id, dest?.id ?? null, pos]);
      if (dest) await db.query("update flow.elements set plan_id = $2 where id = any($1::bigint[])", [[u.id, ...(await descIds(db, u.id))], dest.plan_id]);
      await setOrder(db, await siblingIds(db, projectId, oldParent));
    } else await cloneTree(db, projectId, u.id, dest?.id ?? null);
  }
}

export async function patchElement(db: Db, projectId: number, id: string, p: PatchElementBody): Promise<void> {
  const u = await getEl(db, projectId, id);
  const sets: string[] = [], args: unknown[] = [];
  const set = (col: string, v: unknown) => { args.push(v); sets.push(`${col} = $${args.length}`); };
  if (p.title !== undefined) set("title", p.title);
  if (p.context !== undefined) set("context", p.context);
  if (p.code !== undefined) set("code", p.code);
  if (p.archived !== undefined) set("archived", p.archived);
  if (p.respId !== undefined) { const r = await resolveResp(db, projectId, p.respId); set("resp_id", r.id); set("resp_ref", r.ref); }
  if (p.agentId !== undefined) {
    const r = await resolveResp(db, projectId, p.agentId);
    set("agent_id", r.id); set("agent_ref", r.ref);
    const ag = await respTasks(db, projectId, r.id, r.ref);
    if ((!r.id && !r.ref) || ag?.kind === "pessoa") { set("status", null); set("error", null); }
    else if (!(await db.query("select status from flow.elements where id = $1", [u.id])).rows[0].status) set("status", "pendente");
    // título = task do responsável concreto (lib Node = método · arquivo = função); abstrato (IA/modelo/pessoa) = verbo livre
    const concrete = ag && ["maquina", "arquivo", "script"].includes(ag.kind);
    if (concrete && ag.tasks.length) {
      const title = p.title ?? (await db.query("select title from flow.elements where id = $1", [u.id])).rows[0].title as string;
      if (!ag.tasks.includes(title) && p.title === undefined) set("title", ag.tasks[0]);
    }
  }
  if (p.loop !== undefined) { set("loop_var", p.loop?.[0] ?? null); set("loop_list", p.loop?.[1] ?? null); }
  if (p.cond !== undefined) {
    if (p.cond) { const g = await getEl(db, projectId, p.cond.gotoId); set("cond_test", p.cond.test); set("cond_goto_id", g.id); } else { set("cond_test", null); set("cond_goto_id", null); }
  }
  if (sets.length) { args.push(u.id); await db.query(`update flow.elements set ${sets.join(", ")} where id = $${args.length}`, args); }
  const replaceIos = async (dir: "in" | "out", list: [string, string?][]) => {
    await db.query("delete from flow.element_ios where element_id = $1 and direction = $2", [u.id, dir]);
    let i = 0; const seen = new Set<string>();
    for (const [name, ref] of list) {
      if (seen.has(name)) continue; seen.add(name);
      await ensureData(db, projectId, name);
      await db.query("insert into flow.element_ios (element_id, direction, name, ref, position) values ($1,$2,$3,$4,$5)", [u.id, dir, name, dir === "out" ? ref ?? `out/${name}.json` : null, i++]);
    }
  };
  if (p.ins !== undefined) await replaceIos("in", p.ins.map(n => [n]));
  if (p.outs !== undefined) await replaceIos("out", p.outs);
  if (p.archived === true) await db.query("delete from flow.struct_members where element_id = $1", [u.id]);
}

export async function edgeIf(db: Db, projectId: number, fromId: string, toId: string): Promise<string> {
  const a = await getEl(db, projectId, fromId), b = await getEl(db, projectId, toId);
  if (b.kind === "data") throw badRequest("Seleção só em funções");
  const first = (await db.query("select name from flow.element_ios where element_id=$1 and direction='in' order by position, id limit 1", [b.id])).rows[0]?.name as string | undefined;
  const test = first ?? "condicao";
  await db.query("update flow.elements set cond_test = $2, cond_goto_id = $3 where id = $1", [b.id, test, a.id]);
  const st = (await db.query("select s.id from flow.structs s join flow.struct_members m on m.struct_id = s.id where s.project_id = $1 and m.element_id = $2 limit 1", [projectId, b.id])).rows[0];
  if (st) await db.query("update flow.structs set test = $2 where id = $1", [st.id, test]);
  else {
    const pos = (await db.query("select coalesce(max(position)+1,0) as p from flow.structs where project_id = $1", [projectId])).rows[0].p;
    const sid = (await db.query("insert into flow.structs (project_id, test, position) values ($1,$2,$3) returning id", [projectId, test, pos])).rows[0].id;
    await db.query("insert into flow.struct_members (struct_id, element_id, position) values ($1,$2,0)", [sid, b.id]);
  }
  return test;
}

export async function edgeLoop(db: Db, projectId: number, toId: string): Promise<void> {
  const b = await getEl(db, projectId, toId);
  if (b.kind === "data") throw badRequest("Repetição só em funções");
  await db.query("update flow.elements set loop_var = coalesce(loop_var, 'item'), loop_list = coalesce(loop_list, 'lista') where id = $1", [b.id]);
}

export async function setParallel(db: Db, projectId: number, a: string, b: string, on: boolean): Promise<void> {
  const x = await getEl(db, projectId, a), y = await getEl(db, projectId, b);
  if (on) await addLink(db, x.id, y.id, "par");
  else await db.query("delete from flow.links where kind='par' and ((from_id=$1 and to_id=$2) or (from_id=$2 and to_id=$1))", [x.id, y.id]);
}

/** Seleção (if) / repetição (for) na task folha — liga/desliga (botões da toolbar; a aresta usa edgeIf/edgeLoop). */
export async function setStruct(db: Db, projectId: number, id: string, kind: "if" | "loop", on: boolean): Promise<void> {
  const b = await getEl(db, projectId, id);
  if (b.kind === "data" || b.kind === "folder") throw badRequest("Só em funções");
  if (on && (await db.query("select 1 from flow.elements where parent_id = $1 and kind = 'file' and not archived limit 1", [b.id])).rowCount) throw badRequest(`${kind === "if" ? "Seleção" : "Repetição"} aplica-se a uma task folha`);
  if (kind === "loop") {
    if (on) await edgeLoop(db, projectId, id);
    else await db.query("update flow.elements set loop_var = null, loop_list = null where id = $1", [b.id]);
    return;
  }
  const st = (await db.query("select s.id from flow.structs s join flow.struct_members m on m.struct_id = s.id where s.project_id = $1 and m.element_id = $2 limit 1", [projectId, b.id])).rows[0];
  if (!on) {
    if (!st) throw badRequest("Esta task não está numa seleção");
    await db.query("update flow.elements set cond_test = null, cond_goto_id = null where id in (select element_id from flow.struct_members where struct_id = $1)", [st.id]);
    await db.query("delete from flow.structs where id = $1", [st.id]);
    return;
  }
  if (st) return;
  const first = (await db.query("select name from flow.element_ios where element_id=$1 and direction='in' order by position, id limit 1", [b.id])).rows[0]?.name as string | undefined;
  const test = first ?? "condicao";
  const sibs = (await db.query("select id from flow.elements where project_id=$1 and parent_id is not distinct from $2 and plan_id=$3 and kind='file' and not archived order by position, id", [projectId, b.parent_id, b.plan_id])).rows.map(r => r.id as number);
  const prev = sibs[sibs.indexOf(b.id) - 1];
  if (prev) await db.query("update flow.elements set cond_test = $2, cond_goto_id = $3 where id = $1", [b.id, test, prev]);
  const pos = (await db.query("select coalesce(max(position)+1,0) as p from flow.structs where project_id = $1", [projectId])).rows[0].p;
  const sid = (await db.query("insert into flow.structs (project_id, test, position) values ($1,$2,$3) returning id", [projectId, test, pos])).rows[0].id;
  await db.query("insert into flow.struct_members (struct_id, element_id, position) values ($1,$2,0)", [sid, b.id]);
}
