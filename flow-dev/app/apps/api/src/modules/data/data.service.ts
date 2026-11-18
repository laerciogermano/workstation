import type { Db } from "../../db/pool";
import { badRequest, conflict } from "../../shared/errors";
import { ensureData, getPlanId } from "../elements/elements.repo";

const slugFile = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Módulo sugerido para um dado que ganhou valor: a camada de quem o consome (ou estado.data.js). */
export async function suggestModuleFile(db: Db, projectId: number, name: string): Promise<string> {
  const { rows } = await db.query(
    `select c.title as ctitle, p.title as ptitle, p.kind as pkind from flow.element_ios i join flow.elements c on c.id = i.element_id
     left join flow.elements p on p.id = c.parent_id where c.project_id = $1 and i.direction = 'in' and i.name = $2 and not c.archived limit 1`, [projectId, name]);
  const r = rows[0]; if (!r) return "estado.data.js";
  return slugFile(r.pkind === "file" ? r.ptitle : r.ctitle) + ".layer.js";
}

export async function placeDadoInModule(db: Db, projectId: number, name: string, file: string): Promise<void> {
  await db.query("delete from flow.module_items mi using flow.modules m where mi.module_id = m.id and m.project_id = $1 and mi.kind = 'dado' and mi.data_name = $2", [projectId, name]);
  const mid = (await db.query(
    `insert into flow.modules (project_id, file, position) values ($1,$2, coalesce((select max(position)+1 from flow.modules where project_id=$1),0))
     on conflict (project_id, file) do update set file = excluded.file returning id`, [projectId, file])).rows[0].id;
  await db.query("insert into flow.module_items (module_id, kind, data_name, position) values ($1,'dado',$2, coalesce((select max(position)+1 from flow.module_items where module_id=$1),0))", [mid, name]);
}

const hasKids = async (db: Db, projectId: number, name: string): Promise<boolean> =>
  ((await db.query("select 1 from flow.data_defs where project_id=$1 and name like $2 limit 1", [projectId, name.replace(/[\\%_]/g, "\\$&") + ".%"])).rowCount ?? 0) > 0;

export async function upsertData(db: Db, projectId: number, b: { name: string; type?: string; value?: string | null; moduleFile?: string }): Promise<void> {
  await ensureData(db, projectId, b.name);
  if (b.type) await db.query("update flow.data_defs set type = $3 where project_id=$1 and name=$2", [projectId, b.name, b.type]);
  const kids = await hasKids(db, projectId, b.name);
  if (b.value !== undefined && !kids) {
    const v = (b.value ?? "").trim();
    await db.query("update flow.data_defs set value = $3 where project_id=$1 and name=$2", [projectId, b.name, v || null]);
  }
  // com valor (ou composto), o dado fica concreto e passa a morar num módulo
  const filled = (b.value ?? "").trim().length > 0;
  if (filled || kids) await placeDadoInModule(db, projectId, b.name.split(".")[0]!, b.moduleFile ?? (await suggestModuleFile(db, projectId, b.name)));
}

export async function addDataKid(db: Db, projectId: number, parent: string, kid: string): Promise<string> {
  const name = `${parent}.${kid}`;
  const exists = await db.query("select 1 from flow.data_defs where project_id=$1 and name=$2", [projectId, name]);
  if (exists.rowCount) throw conflict("Esse campo já existe");
  await ensureData(db, projectId, parent);
  await db.query("update flow.data_defs set type = 'objeto', value = null where project_id=$1 and name=$2", [projectId, parent]);
  await ensureData(db, projectId, name);
  return name;
}

export async function toggleCube(db: Db, projectId: number, name: string): Promise<boolean> {
  if (await hasKids(db, projectId, name)) throw badRequest(`${name} tem campos: remova os campos para virar dado simples`);
  await ensureData(db, projectId, name);
  const t = (await db.query("select type from flow.data_defs where project_id=$1 and name=$2", [projectId, name])).rows[0].type as string;
  const next = t === "objeto" ? "texto" : "objeto";
  await db.query("update flow.data_defs set type=$3, value = case when $3='objeto' then null else value end where project_id=$1 and name=$2", [projectId, name, next]);
  return next === "objeto";
}

/** Novo dado: vira saída de uma função livre (ou de uma nova) do plano. */
export async function newDado(db: Db, projectId: number, planPublicId: string): Promise<{ name: string; hostId: string }> {
  const planId = await getPlanId(db, projectId, planPublicId);
  let n = ((await db.query("select count(*)::int as c from flow.data_defs where project_id=$1", [projectId])).rows[0].c as number) + 1;
  let name = `novo_dado_${n}`;
  while ((await db.query("select 1 from flow.data_defs where project_id=$1 and name=$2", [projectId, name])).rowCount) name = `novo_dado_${++n}`;
  let host = (await db.query(
    `select e.id, e.public_id from flow.elements e where e.project_id=$1 and e.plan_id=$2 and e.kind='file' and not e.archived
       and not exists (select 1 from flow.element_ios i where i.element_id=e.id and i.direction='out')
       and not exists (select 1 from flow.elements k where k.parent_id=e.id and not k.archived) order by e.id limit 1`, [projectId, planId])).rows[0];
  if (!host) {
    const root = (await db.query("select id from flow.elements where project_id=$1 and plan_id=$2 and kind='folder' and parent_id is null order by position limit 1", [projectId, planId])).rows[0];
    host = (await db.query("insert into flow.elements (project_id, plan_id, parent_id, kind, title, position) values ($1,$2,$3,'file',$4, 999999) returning id, public_id", [projectId, planId, root?.id ?? null, "Definir " + name])).rows[0];
  }
  await ensureData(db, projectId, name);
  await db.query("insert into flow.element_ios (element_id, direction, name, ref, position) values ($1,'out',$2,$3, 99)", [host.id, name, `out/${name}.json`]);
  return { name, hostId: host.public_id };
}
