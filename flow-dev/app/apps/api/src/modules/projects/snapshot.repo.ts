import type { Snapshot, ElementDto, RunStatus, DataType } from "@flow/shared";
import { pool, type Db } from "../../db/pool";
import { notFound } from "../../shared/errors";

type Q = Pick<Db, "query"> | typeof pool;

/** Resolve o projeto do usuário (anti-IDOR: sempre filtra por dono). */
export async function ownedProject(q: Q, publicId: string, userId: number): Promise<{ id: number; name: string }> {
  const { rows } = await q.query("select id, name from flow.projects where public_id = $1 and owner_id = $2 and deleted_at is null", [publicId, userId]);
  if (!rows[0]) throw notFound("Projeto");
  return rows[0];
}

/** Monta o Snapshot completo (formato único consumido pelo front). */
export async function loadSnapshot(q: Q, projectId: number): Promise<Snapshot> {
  const [proj, plans, models, agents, els, ios, links, structs, members, data, mods, items] = await Promise.all([
    q.query("select public_id, name, updated_at from flow.projects where id = $1", [projectId]),
    q.query("select public_id, name, position from flow.plans where project_id = $1 order by position, id", [projectId]),
    q.query("select public_id, name, api_id, vendor, color from flow.models where project_id = $1 order by id", [projectId]),
    q.query(`select a.public_id, a.kind, a.name, a.sub, a.module_file, m.public_id as model_id, a.prompt, a.photo_url, a.tasks
             from flow.agents a left join flow.models m on m.id = a.model_id where a.project_id = $1 order by a.id`, [projectId]),
    q.query(`select e.id, e.public_id, pl.public_id as plan_id, par.public_id as parent_id, e.kind, e.title, e.context,
                    ag.public_id as agent_id, rs.public_id as resp_id, e.status, e.error, e.progress, e.loop_var, e.loop_list,
                    e.cond_test, g.public_id as goto_id, e.code, e.archived, e.position
             from flow.elements e
             join flow.plans pl on pl.id = e.plan_id
             left join flow.elements par on par.id = e.parent_id
             left join flow.agents ag on ag.id = e.agent_id
             left join flow.agents rs on rs.id = e.resp_id
             left join flow.elements g on g.id = e.cond_goto_id
             where e.project_id = $1 order by e.position, e.id`, [projectId]),
    q.query("select i.element_id, i.direction, i.name, i.ref from flow.element_ios i join flow.elements e on e.id = i.element_id where e.project_id = $1 order by i.position, i.id", [projectId]),
    q.query(`select f.public_id as f, t.public_id as t, l.kind from flow.links l
             join flow.elements f on f.id = l.from_id join flow.elements t on t.id = l.to_id where f.project_id = $1`, [projectId]),
    q.query("select id, id::text as pid, test from flow.structs where project_id = $1 order by position, id", [projectId]),
    q.query(`select sm.struct_id, e.public_id from flow.struct_members sm join flow.elements e on e.id = sm.element_id
             join flow.structs s on s.id = sm.struct_id where s.project_id = $1 order by sm.position`, [projectId]),
    q.query("select name, type, value, position from flow.data_defs where project_id = $1 order by position, id", [projectId]),
    q.query("select id, public_id, file from flow.modules where project_id = $1 order by position, id", [projectId]),
    q.query(`select mi.module_id, mi.kind, e.public_id as el, a.public_id as ag, mi.data_name from flow.module_items mi
             join flow.modules m on m.id = mi.module_id left join flow.elements e on e.id = mi.element_id left join flow.agents a on a.id = mi.agent_id
             where m.project_id = $1 order by mi.position, mi.id`, [projectId]),
  ]);
  const p = proj.rows[0];
  const insBy = new Map<number, string[]>(), outsBy = new Map<number, [string, string][]>();
  for (const r of ios.rows) {
    if (r.direction === "in") (insBy.get(r.element_id) ?? insBy.set(r.element_id, []).get(r.element_id)!).push(r.name);
    else (outsBy.get(r.element_id) ?? outsBy.set(r.element_id, []).get(r.element_id)!).push([r.name, r.ref ?? ""]);
  }
  const elements: ElementDto[] = els.rows.map(r => ({
    id: r.public_id, planId: r.plan_id, parentId: r.parent_id, kind: r.kind, title: r.title, context: r.context,
    agentId: r.agent_id, respId: r.resp_id, status: r.status as RunStatus | null, error: r.error,
    progress: r.progress == null ? null : Number(r.progress),
    loop: r.loop_var ? [r.loop_var, r.loop_list] : null, cond: r.cond_test && r.goto_id ? [r.cond_test, r.goto_id] : null,
    code: r.code, archived: r.archived, position: r.position, ins: insBy.get(r.id) ?? [], outs: outsBy.get(r.id) ?? [],
  }));
  const memBy = new Map<number, string[]>();
  for (const r of members.rows) (memBy.get(r.struct_id) ?? memBy.set(r.struct_id, []).get(r.struct_id)!).push(r.public_id);
  const itemsBy = new Map<number, { kind: "fn" | "dado" | "script"; ref: string }[]>();
  for (const r of items.rows) (itemsBy.get(r.module_id) ?? itemsBy.set(r.module_id, []).get(r.module_id)!).push({ kind: r.kind, ref: r.kind === "fn" ? r.el : r.kind === "script" ? r.ag : r.data_name });
  return {
    project: { id: p.public_id, name: p.name, updatedAt: p.updated_at.toISOString() },
    plans: plans.rows.map(r => ({ id: r.public_id, name: r.name, position: r.position })),
    elements,
    links: links.rows.map(r => ({ from: r.f, to: r.t, kind: r.kind })),
    structs: structs.rows.map(r => ({ id: r.pid, test: r.test, body: memBy.get(r.id) ?? [] })),
    agents: agents.rows.map(r => ({ id: r.public_id, kind: r.kind, name: r.name, sub: r.sub, moduleFile: r.module_file, modelId: r.model_id, prompt: r.prompt, photoUrl: r.photo_url, tasks: (r.tasks as string[] | null) ?? [] })),
    models: models.rows.map(r => ({ id: r.public_id, name: r.name, api: r.api_id, vendor: r.vendor, color: r.color })),
    modules: mods.rows.map(r => ({ id: r.public_id, file: r.file, items: itemsBy.get(r.id) ?? [] })),
    data: data.rows.map(r => ({ name: r.name, type: r.type as DataType, value: r.value, position: r.position })),
  };
}
