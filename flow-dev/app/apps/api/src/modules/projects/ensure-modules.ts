import type { Db } from "../../db/pool";

const slugFile = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Toda função-folha e todo dado produzido moram num módulo (porta de ensureLayers do protótipo). */
export async function ensureModules(db: Db, projectId: number): Promise<void> {
  const { rows } = await db.query(
    `select e.id, e.title, p.title as ptitle, p.kind as pkind, p.id as pid, e.parent_id,
            exists (select 1 from flow.module_items mi where mi.kind='fn' and mi.element_id = e.id) as placed
       from flow.elements e left join flow.elements p on p.id = e.parent_id
      where e.project_id = $1 and e.kind = 'file' and not e.archived
        and not exists (select 1 from flow.elements k where k.parent_id = e.id and not k.archived)
      order by e.id`, [projectId]);
  for (const r of rows) {
    const home = r.parent_id ? r.ptitle : r.title;
    const file = slugFile(home) + ".layer.js";
    let mid: number | null = null;
    const modOf = async () => mid ?? (mid = (await db.query(
      `insert into flow.modules (project_id, file, position) values ($1,$2, coalesce((select max(position)+1 from flow.modules where project_id=$1),0))
       on conflict (project_id, file) do update set file = excluded.file returning id`, [projectId, file])).rows[0].id as number);
    const add = async (sql: string, args: unknown[]) => db.query(sql, [await modOf(), ...args]);
    if (!r.placed) await add("insert into flow.module_items (module_id, kind, element_id, position) values ($1,'fn',$2, coalesce((select max(position)+1 from flow.module_items where module_id=$1),0))", [r.id]);
    const outs = (await db.query(
      `select i.name from flow.element_ios i where i.element_id = $1 and i.direction='out'
          and not exists (select 1 from flow.module_items mi join flow.modules m on m.id = mi.module_id where m.project_id = $2 and mi.kind='dado' and mi.data_name = i.name)`, [r.id, projectId])).rows;
    // entrada com valor sólido (ex.: saudacao do Hello World) também mora no arquivo da função
    const valued = (await db.query(
      `select i.name from flow.element_ios i join flow.data_defs d on d.project_id = $2 and d.name = i.name
        where i.element_id = $1 and i.direction='in' and d.value is not null and d.value <> ''
          and not exists (select 1 from flow.module_items mi join flow.modules m on m.id = mi.module_id where m.project_id = $2 and mi.kind='dado' and mi.data_name = i.name)`, [r.id, projectId])).rows;
    for (const o of [...outs, ...valued]) await add("insert into flow.module_items (module_id, kind, data_name, position) values ($1,'dado',$2, coalesce((select max(position)+1 from flow.module_items where module_id=$1),0))", [o.name]);
  }
}
