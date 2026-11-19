import { Router, type Request, type Response } from "express";
import {
  FlowModel, addDataKidBody, createAgentBody, createElementBody, createModelBody, createModuleBody, createProjectBody, edgeIfBody, edgeLoopBody,
  exportQuery, exportFileName, generate, moveElementBody, parallelBody, pasteBody, patchAgentBody, patchElementBody, patchModelBody, patchModuleBody,
  renameProjectBody, structBody, toggleCubeBody, upsertDataBody, type Snapshot,
} from "@flow/shared";
import { pool, withTx, type Db } from "../../db/pool";
import { ah, parse } from "../../shared/http";
import { badRequest, notFound } from "../../shared/errors";
import { me } from "../auth/auth.routes";
import { loadSnapshot, ownedProject } from "./snapshot.repo";
import { seedDemoProject } from "./demo-seed";
import { ensureModules } from "./ensure-modules";
import * as El from "../elements/elements.service";
import { getEl, getPlanId, touchProject } from "../elements/elements.repo";
import * as Data from "../data/data.service";
import * as Cat from "../catalog/catalog.service";
import { cancelRun, completeByPerson, machineInputs, runSingle, startPlanRun } from "../runs/runner";
import { runMachine } from "../runs/machine-sandbox";

export const projectsRouter = Router();
const pid = (req: Request): string => String(req.params.pid);

/** Mutação transacional: dono do projeto → lock → ação → módulos em dia → snapshot novo. */
async function mutate<R>(req: Request, res: Response, status: number, fn: (db: Db, projectId: number) => Promise<R>): Promise<void> {
  const user = me(req);
  const { id } = await ownedProject(pool, pid(req), user._id);
  const result = await withTx(async db => { const r = await fn(db, id); await ensureModules(db, id); await touchProject(db, id); return r; }, id);
  res.status(status).json({ snapshot: await loadSnapshot(pool, id), result: result ?? null });
}

// ---------- projetos ----------
projectsRouter.get("/", ah(async (req, res) => {
  const { rows } = await pool.query(
    `select p.public_id as id, p.name, p.updated_at as "updatedAt", (select count(*)::int from flow.elements e where e.project_id = p.id and e.kind = 'file') as functions
       from flow.projects p where p.owner_id = $1 and p.deleted_at is null order by p.updated_at desc`, [me(req)._id]);
  res.json({ projects: rows });
}));
projectsRouter.post("/", ah(async (req, res) => {
  const b = parse(createProjectBody, req.body), user = me(req);
  const id = await withTx(async db => {
    if (b.demo) return seedDemoProject(db, user._id, b.name);
    const p = (await db.query("insert into flow.projects (owner_id, name) values ($1,$2) returning id", [user._id, b.name])).rows[0].id as number;
    const plan = (await db.query("insert into flow.plans (project_id, name) values ($1,'Plano principal') returning id", [p])).rows[0].id;
    const m = (await db.query("insert into flow.models (project_id, name, api_id, vendor, color) values ($1,'Claude Sonnet 5.5','claude-sonnet-5-5','Anthropic','#D97757') returning id", [p])).rows[0].id;
    for (const [k, n, s, tasks] of [
      ["maquina", "node:http", "Node.js · requisições HTTP", ["get", "post", "request", "createServer", "put", "patch", "delete", "head"]],
      ["maquina", "node:fs", "Node.js · sistema de arquivos", ["readFile", "writeFile", "copyFile", "mkdir", "readdir", "unlink", "rename", "appendFile", "stat"]],
      ["maquina", "node:path", "Node.js · caminhos", ["join", "resolve", "basename", "dirname", "extname", "parse", "format"]],
      ["maquina", "node:crypto", "Node.js · crypto", ["randomBytes", "createHash", "createHmac", "randomUUID"]],
      ["maquina", "node:stream", "Node.js · streams", ["pipeline", "finished", "Readable", "Writable", "Transform"]],
      ["maquina", "node:console", "Node.js · console", ["log", "info", "warn", "error", "debug", "table", "clear"]],
    ] as const)
      await db.query("insert into flow.agents (project_id, kind, name, sub, tasks) values ($1,$2,$3,$4,$5)", [p, k, n, s, tasks]);
    await db.query("insert into flow.agents (project_id, kind, name, sub, model_id, prompt) values ($1,'ia','Lia','Agente · redação',$2,'Descreva aqui o que este agente faz.')", [p, m]);
    const consoleAg = (await db.query("select id from flow.agents where project_id=$1 and name='node:console'", [p])).rows[0].id as number;
    const helloPlan = (await db.query("insert into flow.plans (project_id, name, position) values ($1,'Hello World',1) returning id", [p])).rows[0].id as number;
    const hello = (await db.query("insert into flow.elements (project_id, plan_id, kind, title, context, position) values ($1,$2,'file','Hello World','Projeto console: Executar imprime no Terminal o dado sólido de entrada',0) returning id", [p, helloPlan])).rows[0].id as number;
    await db.query(
      `insert into flow.elements (project_id, plan_id, parent_id, kind, title, agent_id, status, code, position)
       values ($1,$2,$3,'file','log',$4,'pendente',$5,0)`,
      [p, helloPlan, hello, consoleAg, "// Hello World · node:console\nconsole.log(entrada.saudacao);"]);
    // log recebe a entrada `saudacao` (dado sólido) e não tem saída: imprime o valor que compõe o espaço abstrato
    await db.query("insert into flow.data_defs (project_id, name, type, value, position) values ($1,'saudacao','texto','Hello, World!',0) on conflict do nothing", [p]);
    await db.query("insert into flow.element_ios (element_id, direction, name, position) select id, 'in', 'saudacao', 0 from flow.elements where parent_id = $1 and title = 'log'", [hello]);
    const root = (await db.query("insert into flow.elements (project_id, plan_id, kind, title, position) values ($1,$2,'folder',$3,0) returning id", [p, plan, req.body.name ?? "Projeto"])).rows[0].id;
    await db.query("insert into flow.elements (project_id, plan_id, parent_id, kind, title, context, position) values ($1,$2,$3,'file','Fazer meu primeiro fluxo','Comece adicionando filhos (+) e dados.',0)", [p, plan, root]);
    await ensureModules(db, p);
    return p;
  });
  const { rows } = await pool.query("select public_id from flow.projects where id = $1", [id]);
  res.status(201).json({ id: rows[0].public_id });
}));
projectsRouter.get("/:pid", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  res.json({ snapshot: await loadSnapshot(pool, id) });
}));
projectsRouter.patch("/:pid", ah(async (req, res) => {
  const b = parse(renameProjectBody, req.body);
  await mutate(req, res, 200, async (db, id) => { await db.query("update flow.projects set name=$2 where id=$1", [id, b.name]); });
}));
projectsRouter.delete("/:pid", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  await pool.query("update flow.projects set deleted_at = now() where id = $1", [id]);
  res.status(204).end();
}));

// ---------- elementos ----------
projectsRouter.post("/:pid/elements", ah(async (req, res) => {
  const b = parse(createElementBody, req.body);
  await mutate(req, res, 201, (db, id) => El.createElement(db, id, b));
}));
projectsRouter.patch("/:pid/elements/:eid", ah(async (req, res) => {
  const b = parse(patchElementBody, req.body);
  await mutate(req, res, 200, (db, id) => El.patchElement(db, id, String(req.params.eid), b));
}));
projectsRouter.delete("/:pid/elements/:eid", ah(async (req, res) => {
  await mutate(req, res, 200, (db, id) => El.removeElements(db, id, [String(req.params.eid)]));
}));
projectsRouter.post("/:pid/elements/:eid/move", ah(async (req, res) => {
  const b = parse(moveElementBody, req.body);
  await mutate(req, res, 200, (db, id) => El.moveElement(db, id, String(req.params.eid), b.refId, b.mode));
}));
projectsRouter.post("/:pid/elements/:eid/duplicate", ah(async (req, res) => {
  await mutate(req, res, 201, async (db, id) => {
    const u = await getEl(db, id, String(req.params.eid));
    const nid = await El.cloneTree(db, id, u.id, u.parent_id);
    return (await db.query("select public_id from flow.elements where id = $1", [nid])).rows[0].public_id as string;
  });
}));
projectsRouter.post("/:pid/elements-remove", ah(async (req, res) => {
  const ids = parse(pasteBody.pick({ ids: true }), req.body).ids;
  await mutate(req, res, 200, (db, id) => El.removeElements(db, id, ids));
}));
projectsRouter.post("/:pid/elements-paste", ah(async (req, res) => {
  const b = parse(pasteBody, req.body);
  await mutate(req, res, 200, (db, id) => El.pasteElements(db, id, b.ids, b.mode, b.destId));
}));
projectsRouter.post("/:pid/edge-if", ah(async (req, res) => {
  const b = parse(edgeIfBody, req.body);
  await mutate(req, res, 200, (db, id) => El.edgeIf(db, id, b.fromId, b.toId));
}));
projectsRouter.post("/:pid/edge-loop", ah(async (req, res) => {
  const b = parse(edgeLoopBody, req.body);
  await mutate(req, res, 200, (db, id) => El.edgeLoop(db, id, b.toId));
}));
projectsRouter.post("/:pid/elements/:eid/struct", ah(async (req, res) => {
  const b = parse(structBody, req.body);
  await mutate(req, res, 200, (db, id) => El.setStruct(db, id, String(req.params.eid), b.kind, b.on));
}));
projectsRouter.post("/:pid/parallel", ah(async (req, res) => {
  const b = parse(parallelBody, req.body);
  await mutate(req, res, 200, (db, id) => El.setParallel(db, id, b.a, b.b, b.on));
}));

// ---------- dados ----------
projectsRouter.put("/:pid/data", ah(async (req, res) => {
  const b = parse(upsertDataBody, req.body);
  await mutate(req, res, 200, (db, id) => Data.upsertData(db, id, b));
}));
projectsRouter.post("/:pid/data/kid", ah(async (req, res) => {
  const b = parse(addDataKidBody, req.body);
  await mutate(req, res, 201, (db, id) => Data.addDataKid(db, id, b.parent, b.name));
}));
projectsRouter.post("/:pid/data/toggle-cube", ah(async (req, res) => {
  const b = parse(toggleCubeBody, req.body);
  await mutate(req, res, 200, (db, id) => Data.toggleCube(db, id, b.name));
}));
projectsRouter.post("/:pid/plans/:planId/new-dado", ah(async (req, res) => {
  await mutate(req, res, 201, (db, id) => Data.newDado(db, id, String(req.params.planId)));
}));

// ---------- catálogo: agentes, modelos, módulos ----------
projectsRouter.post("/:pid/agents", ah(async (req, res) => {
  const b = parse(createAgentBody, req.body);
  await mutate(req, res, 201, (db, id) => Cat.createAgent(db, id, b));
}));
projectsRouter.patch("/:pid/agents/:aid", ah(async (req, res) => {
  const b = parse(patchAgentBody, req.body);
  await mutate(req, res, 200, (db, id) => Cat.patchAgent(db, id, String(req.params.aid), b));
}));
projectsRouter.delete("/:pid/agents/:aid", ah(async (req, res) => {
  await mutate(req, res, 200, (db, id) => Cat.deleteAgent(db, id, String(req.params.aid)));
}));
projectsRouter.post("/:pid/models", ah(async (req, res) => {
  const b = parse(createModelBody, req.body);
  await mutate(req, res, 201, (db, id) => Cat.createModel(db, id, b));
}));
projectsRouter.patch("/:pid/models/:mid", ah(async (req, res) => {
  const b = parse(patchModelBody, req.body);
  await mutate(req, res, 200, (db, id) => Cat.patchModel(db, id, String(req.params.mid), b));
}));
projectsRouter.delete("/:pid/models/:mid", ah(async (req, res) => {
  await mutate(req, res, 200, (db, id) => Cat.deleteModel(db, id, String(req.params.mid)));
}));
projectsRouter.post("/:pid/modules", ah(async (req, res) => {
  const file = req.body?.file === undefined ? undefined : parse(createModuleBody, req.body).file;
  await mutate(req, res, 201, (db, id) => Cat.createModule(db, id, file));
}));
projectsRouter.patch("/:pid/modules/:mid", ah(async (req, res) => {
  const b = parse(patchModuleBody, req.body);
  await mutate(req, res, 200, (db, id) => Cat.renameModule(db, id, String(req.params.mid), b.file));
}));
projectsRouter.delete("/:pid/modules/:mid", ah(async (req, res) => {
  await mutate(req, res, 200, (db, id) => Cat.deleteModule(db, id, String(req.params.mid)));
}));

// ---------- execução ----------
projectsRouter.post("/:pid/plans/:planId/run", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const planId = await getPlanId(pool as unknown as Db, id, String(req.params.planId));
  const started = await startPlanRun(id, planId, String(req.params.planId));
  res.json({ started, snapshot: await loadSnapshot(pool, id) });
}));
projectsRouter.post("/:pid/plans/:planId/cancel", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const planId = await getPlanId(pool as unknown as Db, id, String(req.params.planId));
  const n = await cancelRun(planId);
  res.json({ cancelled: n, snapshot: await loadSnapshot(pool, id) });
}));
projectsRouter.post("/:pid/elements/:eid/retry", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const u = await getEl(pool as unknown as Db, id, String(req.params.eid));
  await runSingle(id, u.public_id);
  res.json({ snapshot: await loadSnapshot(pool, id) });
}));
/** A pessoa responsável concluiu a etapa. */
projectsRouter.post("/:pid/elements/:eid/complete", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const u = await getEl(pool as unknown as Db, id, String(req.params.eid));
  const plan = (await pool.query("select public_id from flow.plans where id = $1", [u.plan_id])).rows[0].public_id as string;
  if (!(await completeByPerson(id, u.plan_id, plan, u.public_id))) throw badRequest("Só etapa de pessoa, aguardando, pode ser concluída");
  res.json({ snapshot: await loadSnapshot(pool, id) });
}));
projectsRouter.post("/:pid/elements/:eid/run-machine", ah(async (req, res) => {
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const m = new FlowModel(await loadSnapshot(pool, id));
  const u = m.u(String(req.params.eid));
  if (!u || !["maquina", "script", "arquivo"].includes(m.agent(u.agentId)?.kind ?? "")) throw notFound("Etapa com biblioteca Node ou arquivo");
  const code = req.body?.code ?? u.code ?? `// ${u.title} · Node.js\nconsole.log("olá")`;
  if (req.body?.code != null && req.body.code !== u.code) await pool.query("update flow.elements set code = $2 where public_id = $1", [u.id, String(req.body.code).slice(0, 100_000)]);
  await pool.query("update flow.elements set status = 'exec', error = null where public_id = $1", [u.id]);
  const r = await runMachine({ title: u.title, code, inputs: machineInputs(m, u), declared: u.ins });
  if (!r.ok) {
    await pool.query("update flow.elements set status = 'fail', error = $2 where public_id = $1",
      [u.id, r.lines.filter(l => l.kind === "er").map(l => l.text.replace(/^✗ /, "")).join(" · ") || "Falhou"]);
  } else {
    for (const [k, v] of Object.entries(r.saida)) {
      if (!u.outs.some(o => o[0] === k)) continue;
      const val = (typeof v === "string" ? v : JSON.stringify(v)).slice(0, 10_000);
      await pool.query("update flow.data_defs set value = $3 where project_id = $1 and name = $2", [id, k, val]);
    }
    await pool.query("update flow.elements set status = 'ok', error = null where public_id = $1", [u.id]);
  }
  await pool.query("update flow.projects set updated_at = now() where id = $1", [id]);
  res.json({ lines: r.lines, snapshot: await loadSnapshot(pool, id) });
}));

// ---------- exportação ----------
projectsRouter.get("/:pid/plans/:planId/export", ah(async (req, res) => {
  const q = parse(exportQuery, req.query);
  const { id } = await ownedProject(pool, pid(req), me(req)._id);
  const snap: Snapshot = await loadSnapshot(pool, id);
  const m = new FlowModel(snap), planId = String(req.params.planId);
  if (!snap.plans.some(p => p.id === planId)) throw notFound("Plano");
  const chk = m.fopCheck(planId);
  res.json({
    format: q.format, fileName: exportFileName(m, planId, q.format), code: generate(m, planId, q.format),
    blocked: chk.missing.length > 0, missing: chk.missing.map(([n, u]) => ({ name: n, element: u.title })), orphans: chk.orphans.map(([n, u]) => ({ name: n, element: u.title })),
  });
}));
