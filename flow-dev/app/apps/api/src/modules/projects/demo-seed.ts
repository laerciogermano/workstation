import seed from "../../seed/prototype-seed.json";
import type { Db } from "../../db/pool";

interface ProtoU { id: string; kind?: string; title: string; ctx?: string; parent: string | null; agent?: string; resp?: string; plan: string; st?: string; err?: string; prog?: number; ins?: string[]; outs?: [string, string][]; loop?: [string, string]; cond?: [string, string]; code?: string; arch?: boolean }
interface Proto {
  CAT: { id: string; type: string; name: string; sub: string; mod?: string }[];
  AGENT_CFG: Record<string, { model: string; prompt: string }>;
  MODELS: { id: string; name: string; api: string; vendor: string; cor: string }[];
  LAYERS: { id: string; file: string; items: [string, string][] }[];
  U: ProtoU[]; DEPS: [string, string][]; PARS: [string, string][];
  STRUCTS: { k: string; test: string; body: string[] }[];
  DATA_KIDS: Record<string, string[]>; DATA_TYPE: Record<string, string>; DATA_VAL: Record<string, string>;
  PLANS: { id: string; name: string }[];
}
const proto = seed as unknown as Proto;

/** Cria o projeto de exemplo (idêntico ao protótipo): 2 planos, catálogo, funções, dados, módulos. */
export async function seedDemoProject(db: Db, ownerId: number, name: string): Promise<number> {
  const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> => (await db.query(sql, args)).rows as T[];
  const [{ id: projectId }] = await q<{ id: number }>("insert into flow.projects (owner_id, name) values ($1, $2) returning id", [ownerId, name]);
  const planId = new Map<string, number>(), modelId = new Map<string, number>(), agentId = new Map<string, number>(), elId = new Map<string, number>();
  let pos = 0;
  for (const p of proto.PLANS) planId.set(p.id, (await q<{ id: number }>("insert into flow.plans (project_id, name, position) values ($1,$2,$3) returning id", [projectId, p.name, pos++]))[0]!.id);
  for (const m of proto.MODELS) modelId.set(m.id, (await q<{ id: number }>("insert into flow.models (project_id, name, api_id, vendor, color) values ($1,$2,$3,$4,$5) returning id", [projectId, m.name, m.api, m.vendor, m.cor]))[0]!.id);
  for (const c of proto.CAT) {
    const cfg = proto.AGENT_CFG[c.id];
    agentId.set(c.id, (await q<{ id: number }>("insert into flow.agents (project_id, kind, name, sub, module_file, model_id, prompt) values ($1,$2,$3,$4,$5,$6,$7) returning id",
      [projectId, c.type, c.name, c.sub, c.mod ?? null, cfg ? modelId.get(cfg.model) ?? null : null, cfg?.prompt ?? null]))[0]!.id);
  }
  // elementos: pais antes dos filhos (a ordem do protótipo já garante); position = ordem entre irmãos
  const sib = new Map<string, number>();
  for (const u of proto.U) {
    const key = u.parent ?? "∅", position = sib.get(key) ?? 0; sib.set(key, position + 1);
    const id = (await q<{ id: number }>(
      `insert into flow.elements (project_id, plan_id, parent_id, kind, title, context, agent_id, resp_id, status, error, progress, loop_var, loop_list, code, archived, position)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,
      [projectId, planId.get(u.plan), u.parent ? elId.get(u.parent) : null, u.kind ?? "file", u.title, u.ctx ?? null, u.agent ? agentId.get(u.agent) ?? null : null, u.resp ? agentId.get(u.resp) ?? null : null,
        u.st ?? null, u.err ?? null, u.prog ?? null, u.loop?.[0] ?? null, u.loop?.[1] ?? null, u.code ?? null, u.arch ?? false, position]))[0]!.id;
    elId.set(u.id, id);
  }
  // cond (senão → volta) depois que todos existem
  for (const u of proto.U) if (u.cond && elId.get(u.cond[1])) await q("update flow.elements set cond_test = $2, cond_goto_id = $3 where id = $1", [elId.get(u.id), u.cond[0], elId.get(u.cond[1])]);
  // entradas e saídas + dados do catálogo
  const dataPos = new Map<string, number>();
  const ensureData = async (n: string) => {
    if (dataPos.has(n)) return;
    const i = dataPos.size; dataPos.set(n, i);
    const kids = proto.DATA_KIDS[n] ?? [];
    const type = proto.DATA_TYPE[n] ?? (kids.length ? "objeto" : "texto");
    await q("insert into flow.data_defs (project_id, name, type, value, position) values ($1,$2,$3,$4,$5) on conflict do nothing", [projectId, n, type, proto.DATA_VAL[n] ?? null, i]);
    for (const k of kids) await ensureData(k);
  };
  for (const u of proto.U) {
    let i = 0;
    for (const n of u.ins ?? []) { await ensureData(n); await q("insert into flow.element_ios (element_id, direction, name, position) values ($1,'in',$2,$3) on conflict do nothing", [elId.get(u.id), n, i++]); }
    i = 0;
    for (const [n, ref] of u.outs ?? []) { await ensureData(n); await q("insert into flow.element_ios (element_id, direction, name, ref, position) values ($1,'out',$2,$3,$4) on conflict do nothing", [elId.get(u.id), n, ref, i++]); }
  }
  for (const n of Object.keys(proto.DATA_KIDS)) await ensureData(n);
  for (const [a, b] of proto.DEPS) await q("insert into flow.links (from_id, to_id, kind) values ($1,$2,'seq') on conflict do nothing", [elId.get(a), elId.get(b)]);
  for (const [a, b] of proto.PARS) await q("insert into flow.links (from_id, to_id, kind) values ($1,$2,'par') on conflict do nothing", [elId.get(a), elId.get(b)]);
  let sp = 0;
  for (const s of proto.STRUCTS) {
    const sid = (await q<{ id: number }>("insert into flow.structs (project_id, test, position) values ($1,$2,$3) returning id", [projectId, s.test, sp++]))[0]!.id;
    let mp = 0;
    for (const b of s.body) if (elId.get(b)) await q("insert into flow.struct_members (struct_id, element_id, position) values ($1,$2,$3) on conflict do nothing", [sid, elId.get(b), mp++]);
  }
  let mp = 0;
  for (const l of proto.LAYERS) {
    const mid = (await q<{ id: number }>("insert into flow.modules (project_id, file, position) values ($1,$2,$3) on conflict (project_id, file) do update set file = excluded.file returning id", [projectId, l.file, mp++]))[0]!.id;
    let ip = 0;
    for (const [k, v] of l.items) {
      if (k === "fn" && elId.get(v)) await q("insert into flow.module_items (module_id, kind, element_id, position) values ($1,'fn',$2,$3)", [mid, elId.get(v), ip++]);
      else if (k === "script" && agentId.get(v)) await q("insert into flow.module_items (module_id, kind, agent_id, position) values ($1,'script',$2,$3)", [mid, agentId.get(v), ip++]);
      else if (k === "dado") { await ensureData(v); await q("insert into flow.module_items (module_id, kind, data_name, position) values ($1,'dado',$2,$3)", [mid, v, ip++]); }
    }
  }
  return projectId;
}
