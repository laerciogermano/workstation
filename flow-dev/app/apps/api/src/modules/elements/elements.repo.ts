import type { Db } from "../../db/pool";
import { badRequest, notFound } from "../../shared/errors";

export interface ElRow { id: number; public_id: string; parent_id: number | null; plan_id: number; kind: string; title: string; position: number; archived: boolean }

export async function getEl(db: Db, projectId: number, publicId: string): Promise<ElRow> {
  const { rows } = await db.query("select id, public_id, parent_id, plan_id, kind, title, position, archived from flow.elements where project_id = $1 and public_id = $2", [projectId, publicId]);
  if (!rows[0]) throw notFound("Elemento");
  return rows[0];
}
export async function getPlanId(db: Db, projectId: number, publicId: string): Promise<number> {
  const { rows } = await db.query("select id from flow.plans where project_id = $1 and public_id = $2", [projectId, publicId]);
  if (!rows[0]) throw notFound("Plano");
  return rows[0].id;
}
export async function getAgentId(db: Db, projectId: number, publicId: string | null | undefined): Promise<number | null> {
  if (!publicId) return null;
  const { rows } = await db.query("select id from flow.agents where project_id = $1 and public_id = $2", [projectId, publicId]);
  if (!rows[0]) throw badRequest("Responsável não está no catálogo do projeto");
  return rows[0].id;
}
/** ids dos irmãos (mesmo pai), em ordem */
export async function siblingIds(db: Db, projectId: number, parentId: number | null): Promise<number[]> {
  const { rows } = await db.query("select id from flow.elements where project_id = $1 and parent_id is not distinct from $2 order by position, id", [projectId, parentId]);
  return rows.map(r => r.id as number);
}
export async function setOrder(db: Db, ids: number[]): Promise<void> {
  if (!ids.length) return;
  await db.query("update flow.elements e set position = v.pos from (select unnest($1::bigint[]) as id, generate_series(0, $2) as pos) v where e.id = v.id", [ids, ids.length - 1]);
}
/** descendentes (recursivo) de um elemento, sem ele */
export async function descIds(db: Db, id: number): Promise<number[]> {
  const { rows } = await db.query("with recursive d as (select id from flow.elements where parent_id = $1 union all select e.id from flow.elements e join d on e.parent_id = d.id) select id from d", [id]);
  return rows.map(r => r.id as number);
}
export async function ensureData(db: Db, projectId: number, name: string, type?: string): Promise<void> {
  const parts = name.split(".");
  for (let i = 1; i <= parts.length; i++) {
    const n = parts.slice(0, i).join(".");
    await db.query(
      `insert into flow.data_defs (project_id, name, type, position)
       values ($1, $2, $3, coalesce((select max(position) + 1 from flow.data_defs where project_id = $1), 0)) on conflict (project_id, name) do nothing`,
      [projectId, n, i < parts.length ? "objeto" : type ?? "texto"]);
  }
}
export async function touchProject(db: Db, projectId: number): Promise<void> { await db.query("update flow.projects set updated_at = now() where id = $1", [projectId]); }
