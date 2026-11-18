import { DEFAULT_LIB_TASKS } from "@flow/shared";
import type { Db } from "../../db/pool";
import { badRequest, conflict, notFound } from "../../shared/errors";
import { getAgentId } from "../elements/elements.repo";

const modelId = async (db: Db, projectId: number, pub: string | null | undefined): Promise<number | null> => {
  if (!pub) return null;
  const r = (await db.query("select id from flow.models where project_id=$1 and public_id=$2", [projectId, pub])).rows[0];
  if (!r) throw badRequest("Modelo não existe neste projeto");
  return r.id;
};

const defaultTasks = (kind: string, name: string): string[] =>
  kind === "maquina" ? (DEFAULT_LIB_TASKS[name] ?? []) : kind === "script" ? [name.replace(/\(\)\s*$/, "")] : [];

export async function createAgent(db: Db, projectId: number, b: { kind: string; name: string; sub: string; moduleFile?: string | null; modelId?: string | null; prompt?: string | null; tasks?: string[] }): Promise<string> {
  let mid = await modelId(db, projectId, b.modelId);
  if (b.kind === "ia" && !mid) mid = (await db.query("select id from flow.models where project_id=$1 order by id limit 1", [projectId])).rows[0]?.id ?? null;
  const tasks = b.tasks?.length ? b.tasks : defaultTasks(b.kind, b.name);
  return (await db.query("insert into flow.agents (project_id, kind, name, sub, module_file, model_id, prompt, tasks) values ($1,$2,$3,$4,$5,$6,$7,$8) returning public_id",
    [projectId, b.kind, b.name, b.sub, b.moduleFile ?? null, mid, b.kind === "ia" ? b.prompt ?? "" : null, tasks])).rows[0].public_id;
}
export async function patchAgent(db: Db, projectId: number, id: string, p: { name?: string; sub?: string; modelId?: string | null; prompt?: string | null; photoUrl?: string | null; tasks?: string[] }): Promise<void> {
  const aid = await getAgentId(db, projectId, id);
  const sets: string[] = [], args: unknown[] = [];
  const set = (c: string, v: unknown) => { args.push(v); sets.push(`${c} = $${args.length}`); };
  if (p.name !== undefined) set("name", p.name);
  if (p.sub !== undefined) set("sub", p.sub);
  if (p.prompt !== undefined) set("prompt", p.prompt);
  if (p.photoUrl !== undefined) set("photo_url", p.photoUrl);
  if (p.tasks !== undefined) set("tasks", p.tasks);
  if (p.modelId !== undefined) set("model_id", await modelId(db, projectId, p.modelId));
  if (!sets.length) return;
  args.push(aid);
  await db.query(`update flow.agents set ${sets.join(", ")} where id = $${args.length}`, args);
}
/** Agente em uso não sai do catálogo: devolve as etapas que dependem dele. */
export async function deleteAgent(db: Db, projectId: number, id: string): Promise<void> {
  const aid = await getAgentId(db, projectId, id);
  const uses = (await db.query("select title from flow.elements where project_id=$1 and (agent_id=$2 or resp_id=$2) and not archived limit 5", [projectId, aid])).rows.map(r => r.title as string);
  if (uses.length) throw conflict(`Em uso por: ${uses.join(", ")}. Troque o responsável nelas para remover.`);
  await db.query("delete from flow.agents where id = $1", [aid]);
}

export async function createModel(db: Db, projectId: number, b: { name: string; api: string; vendor: string; color: string }): Promise<string> {
  return (await db.query("insert into flow.models (project_id, name, api_id, vendor, color) values ($1,$2,$3,$4,$5) returning public_id", [projectId, b.name, b.api, b.vendor, b.color])).rows[0].public_id;
}
export async function patchModel(db: Db, projectId: number, id: string, p: { name?: string; api?: string; vendor?: string; color?: string }): Promise<void> {
  const mid = await modelId(db, projectId, id);
  const map: Record<string, string> = { name: "name", api: "api_id", vendor: "vendor", color: "color" };
  for (const [k, v] of Object.entries(p)) if (v !== undefined) await db.query(`update flow.models set ${map[k]} = $2 where id = $1`, [mid, v]);
}
export async function deleteModel(db: Db, projectId: number, id: string): Promise<void> {
  const mid = await modelId(db, projectId, id);
  const n = (await db.query("select count(*)::int as c from flow.agents where model_id=$1", [mid])).rows[0].c as number;
  if (n) throw conflict(`${n} agente(s) usam este modelo. Troque o modelo deles antes de remover.`);
  await db.query("delete from flow.models where id = $1", [mid]);
}

export async function createModule(db: Db, projectId: number, file?: string): Promise<string> {
  let f = file;
  if (!f) { let n = ((await db.query("select count(*)::int as c from flow.modules where project_id=$1", [projectId])).rows[0].c as number) + 1; f = `novo-modulo-${n}.layer.js`; while ((await db.query("select 1 from flow.modules where project_id=$1 and file=$2", [projectId, f])).rowCount) f = `novo-modulo-${++n}.layer.js`; }
  const r = await db.query("insert into flow.modules (project_id, file, position) values ($1,$2, coalesce((select max(position)+1 from flow.modules where project_id=$1),0)) on conflict (project_id, file) do nothing returning public_id", [projectId, f]);
  if (!r.rows[0]) throw conflict("Já existe um módulo com esse nome");
  return r.rows[0].public_id;
}
export async function renameModule(db: Db, projectId: number, id: string, file: string): Promise<void> {
  const r = await db.query("update flow.modules set file=$3 where project_id=$1 and public_id=$2 and not exists (select 1 from flow.modules where project_id=$1 and file=$3 and public_id<>$2) returning id", [projectId, id, file]);
  if (!r.rowCount) { if (!(await db.query("select 1 from flow.modules where project_id=$1 and public_id=$2", [projectId, id])).rowCount) throw notFound("Módulo"); throw conflict("Já existe um módulo com esse nome"); }
}
export async function deleteModule(db: Db, projectId: number, id: string): Promise<void> {
  await db.query("delete from flow.modules where project_id=$1 and public_id=$2", [projectId, id]);
}
