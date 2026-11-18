import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Snapshot } from "@flow/shared";
import { createApp } from "../src/app";
import { migrate } from "../src/db/migrate";
import { pool } from "../src/db/pool";
import { runMachine } from "../src/modules/runs/machine-sandbox";

const app = createApp();
const tag = Date.now();
const agentA = request.agent(app), agentB = request.agent(app);
let pidA = "";
let snap: Snapshot;
const find = (t: string) => snap.elements.find(e => e.title === t)!;
const post = async (url: string, body: unknown = {}) => { const r = await agentA.post(`/api/v1/projects/${pidA}${url}`).send(body as object); if (r.body.snapshot) snap = r.body.snapshot; return r; };

beforeAll(async () => {
  await migrate();
  for (const [ag, n] of [[agentA, "a"], [agentB, "b"]] as const) {
    const g = await ag.post("/api/v1/auth/guest").send({});
    expect(g.status).toBe(201); expect(g.body.user.guest).toBe(true); expect(g.body.user.personKey).toMatch(/^[0-9a-f-]{36}$/);
    const r = await ag.post("/api/v1/auth/register").send({ email: `${n}${tag}@t.dev`, password: "senha-forte-1", name: n });
    expect(r.status).toBe(201); expect(r.body.user.guest).toBe(false);
  }
  const list = await agentA.get("/api/v1/projects");
  pidA = list.body.projects[0].id;
  snap = (await agentA.get(`/api/v1/projects/${pidA}`)).body.snapshot;
});
afterAll(async () => {
  await pool.query("delete from flow.users where email like $1", [`%${tag}@t.dev`]);
  await pool.end();
});

describe("auth e autorização", () => {
  it("nega sem sessão (deny-by-default)", async () => { expect((await request(app).get("/api/v1/projects")).status).toBe(401); });
  it("rejeita senha curta e e-mail duplicado", async () => {
    const g = request.agent(app); await g.post("/api/v1/auth/guest").send({});
    expect((await g.post("/api/v1/auth/register").send({ email: "x@y.com", password: "123", name: "x" })).status).toBe(400);
    expect((await g.post("/api/v1/auth/register").send({ email: `a${tag}@t.dev`, password: "senha-forte-1", name: "a" })).status).toBe(409);
  });
  it("visitante: retoma pelo código; conta com senha não retoma por código", async () => {
    const g1 = request.agent(app); const k = (await g1.post("/api/v1/auth/guest").send({})).body.user.personKey as string;
    const g2 = request.agent(app); const r = await g2.post("/api/v1/auth/guest").send({ key: k });
    expect(r.body.user.personKey).toBe(k);
    expect((await g2.get("/api/v1/projects")).body.projects.length).toBe(1); // mesmo projeto de exemplo
    const reg = request.agent(app); const k2 = (await reg.post("/api/v1/auth/guest").send({})).body.user.personKey as string;
    await reg.post("/api/v1/auth/register").send({ email: `k${tag}@t.dev`, password: "senha-forte-1", name: "k" });
    const other = request.agent(app); const r2 = await other.post("/api/v1/auth/guest").send({ key: k2 });
    expect(r2.body.user.personKey).not.toBe(k2); // virou outro visitante: o código não abre conta com senha
  });
  it("vincular mantém o UUID e os projetos; entrar numa conta leva os projetos do visitante", async () => {
    const g = request.agent(app); const u = (await g.post("/api/v1/auth/guest").send({})).body.user;
    const before = (await g.get("/api/v1/projects")).body.projects[0].id;
    const r = await g.post("/api/v1/auth/register").send({ email: `v${tag}@t.dev`, password: "senha-forte-1", name: "v" });
    expect(r.body.user.id).toBe(u.id);
    expect((await g.get("/api/v1/projects")).body.projects[0].id).toBe(before);
    const g3 = request.agent(app); await g3.post("/api/v1/auth/guest").send({});
    await g3.post("/api/v1/projects").send({ name: "do visitante", demo: false });
    await g3.post("/api/v1/auth/login").send({ email: `v${tag}@t.dev`, password: "senha-forte-1" });
    const names = (await g3.get("/api/v1/projects")).body.projects.map((p: { name: string }) => p.name);
    expect(names).toContain("do visitante");
  });
  it("login errado não revela se o e-mail existe", async () => {
    const r = await request(app).post("/api/v1/auth/login").send({ email: `a${tag}@t.dev`, password: "errada-errada" });
    expect(r.status).toBe(401); expect(r.body.error.code).toBe("invalid_credentials");
  });
  it("cookie de sessão é httpOnly + SameSite", async () => {
    const r = await request(app).post("/api/v1/auth/login").send({ email: `a${tag}@t.dev`, password: "senha-forte-1" });
    const c = String(r.headers["set-cookie"]);
    expect(c).toMatch(/HttpOnly/); expect(c).toMatch(/SameSite=Lax/);
  });
  it("anti-IDOR: outro usuário não vê nem altera o projeto", async () => {
    expect((await agentB.get(`/api/v1/projects/${pidA}`)).status).toBe(404);
    expect((await agentB.post(`/api/v1/projects/${pidA}/elements`).send({ mode: "root", planId: snap.plans[0]!.id })).status).toBe(404);
    expect((await agentB.delete(`/api/v1/projects/${pidA}`)).status).toBe(404);
  });
  it("bloqueia origem estranha em escrita (CSRF)", async () => {
    const r = await agentA.post(`/api/v1/projects/${pidA}/elements`).set("Origin", "https://evil.example").send({ mode: "root", planId: snap.plans[0]!.id });
    expect(r.status).toBe(403);
  });
});

describe("modelo e mutações", () => {
  it("snapshot do exemplo traz o protótipo inteiro", () => {
    expect(snap.plans).toHaveLength(2); expect(snap.elements.length).toBeGreaterThan(80); expect(snap.agents.length).toBe(16);
    expect(snap.elements.every(e => /^[0-9a-f-]{36}$/.test(e.id))).toBe(true); // IDR uuid
  });
  it("cria filho/irmão, liga na sequência e renomeia sem mudar o IDR", async () => {
    const root = find("Fazer onboarding da Acme");
    const c = await post("/elements", { mode: "child", refId: root.id });
    expect(c.status).toBe(201);
    const nid: string = c.body.result;
    const sib = await post("/elements", { mode: "after", refId: nid });
    expect(sib.status).toBe(201);
    const kids = snap.elements.filter(e => e.parentId === root.id).sort((a, b) => a.position - b.position).map(e => e.id);
    expect(kids.indexOf(sib.body.result)).toBe(kids.indexOf(nid) + 1);
    expect(snap.links.some(l => l.from === nid && l.to === sib.body.result && l.kind === "seq")).toBe(true);
    const r = await agentA.patch(`/api/v1/projects/${pidA}/elements/${nid}`).send({ title: "Enviar lembrete" });
    expect(r.body.snapshot.elements.find((e: { id: string }) => e.id === nid).title).toBe("Enviar lembrete");
    snap = r.body.snapshot;
  });
  it("nomes iguais com IDRs diferentes coexistem (PRD · IDR)", async () => {
    const root = find("Fazer onboarding da Acme");
    const a = await post("/elements", { mode: "child", refId: root.id, title: "Repetir nome" });
    const b = await post("/elements", { mode: "child", refId: root.id, title: "Repetir nome" });
    expect(a.body.result).not.toBe(b.body.result);
  });
  it("atribuir pessoa limpa status; atribuir IA marca pendente", async () => {
    const e = find("Enviar lembrete");
    const ia = snap.agents.find(a => a.kind === "ia")!, pessoa = snap.agents.find(a => a.kind === "pessoa")!;
    let r = await agentA.patch(`/api/v1/projects/${pidA}/elements/${e.id}`).send({ agentId: ia.id });
    expect(r.body.snapshot.elements.find((x: { id: string }) => x.id === e.id).status).toBe("pendente");
    r = await agentA.patch(`/api/v1/projects/${pidA}/elements/${e.id}`).send({ agentId: pessoa.id });
    expect(r.body.snapshot.elements.find((x: { id: string }) => x.id === e.id).status).toBeNull();
  });
  it("valida corpo (Zod) e recusa campos desconhecidos", async () => {
    const e = find("Enviar lembrete");
    expect((await agentA.patch(`/api/v1/projects/${pidA}/elements/${e.id}`).send({ hack: 1 })).status).toBe(400);
    expect((await agentA.patch(`/api/v1/projects/${pidA}/elements/${e.id}`).send({ agentId: "nao-uuid" })).status).toBe(400);
  });
  it("não move para dentro de um descendente", async () => {
    const root = find("Fazer onboarding da Acme"), kid = find("Enviar lembrete");
    expect((await post(`/elements/${root.id}/move`, { refId: kid.id, mode: "child" })).status).toBe(400);
  });
  it("dado: valor vira concreto e entra num módulo; filhos e cubo", async () => {
    let r = await agentA.put(`/api/v1/projects/${pidA}/data`).send({ name: "conta_id", value: "42" });
    snap = r.body.snapshot;
    expect(snap.data.find(d => d.name === "conta_id")!.value).toBe("42");
    expect(snap.modules.some(m => m.items.some(i => i.kind === "dado" && i.ref === "conta_id"))).toBe(true);
    r = await post("/data/kid", { parent: "conta_id", name: "numero" });
    expect(r.status).toBe(201);
    expect(snap.data.find(d => d.name === "conta_id")!.type).toBe("objeto");
    expect((await post("/data/toggle-cube", { name: "conta_id" })).status).toBe(400); // tem campos
  });
  it("seleção e repetição pela aresta", async () => {
    const a = find("Coletar dados do cliente"), b = find("Rascunhar proposta");
    expect((await post("/edge-loop", { toId: b.id })).status).toBe(200);
    expect(snap.elements.find(e => e.id === b.id)!.loop).toEqual(["item", "lista"]);
    const r = await post("/edge-if", { fromId: a.id, toId: b.id });
    expect(r.body.result).toBe("dados_cliente");
  });
  it("remove com filhos e não deixa lixo; confirma cascata", async () => {
    const before = snap.elements.length;
    const root = find("Ativar cliente");
    const n = snap.elements.filter(e => e.parentId === root.id).length;
    const r = await agentA.delete(`/api/v1/projects/${pidA}/elements/${root.id}`);
    expect(r.body.snapshot.elements.length).toBeLessThan(before - n);
    snap = r.body.snapshot;
  });
  it("agente em uso não sai do catálogo (409)", async () => {
    const used = snap.agents.find(a => snap.elements.some(e => e.agentId === a.id))!;
    expect((await agentA.delete(`/api/v1/projects/${pidA}/agents/${used.id}`)).status).toBe(409);
  });
  it("módulos: renomear e impedir duplicado", async () => {
    const [m1, m2] = snap.modules;
    expect((await agentA.patch(`/api/v1/projects/${pidA}/modules/${m1!.id}`).send({ file: m2!.file })).status).toBe(409);
    expect((await agentA.patch(`/api/v1/projects/${pidA}/modules/${m1!.id}`).send({ file: `renomeado-${tag}.layer.js` })).status).toBe(200);
  });
});

describe("exportação e execução", () => {
  it("exporta js/ts/py/ir do plano de onboarding", async () => {
    const plan = snap.plans.find(p => p.name.includes("Onboarding"))!;
    for (const f of ["js", "ts", "py", "ir"]) {
      const r = await agentA.get(`/api/v1/projects/${pidA}/plans/${plan.id}/export?format=${f}`);
      expect(r.status).toBe(200); expect(r.body.code.length).toBeGreaterThan(100); expect(r.body.fileName).toMatch(/\./);
    }
    const js = (await agentA.get(`/api/v1/projects/${pidA}/plans/${plan.id}/export?format=js`)).body.code as string;
    expect(js).toContain("Promise.all"); expect(js).toContain("export default async function");
  });
  it("sandbox: simula http/fs, sem rede e erra com entrada sem valor", async () => {
    const ok = (await runMachine({ title: "t", code: 'import { http } from "node:http"\nconst r = await http.get("https://x.test/a")\nsaida.id = r.body.id', inputs: {}, declared: [] })).lines;
    expect(ok.some(l => l.kind === "ok" && l.text.includes("saida.id"))).toBe(true);
    const bad = (await runMachine({ title: "t", code: "saida.x = entrada.pagina", inputs: { pagina: null }, declared: ["pagina"] })).lines;
    expect(bad.some(l => l.kind === "er")).toBe(true);
    const esc = (await runMachine({ title: "t", code: "process.exit(1)", inputs: {}, declared: [] })).lines;
    expect(esc.some(l => l.kind === "er")).toBe(true); // process não existe no sandbox
    const loop = (await runMachine({ title: "t", code: "while(true){}", inputs: {}, declared: [] })).lines;
    expect(loop.some(l => l.kind === "er")).toBe(true); // timeout
  });
  it("executar vale para tudo: lib executa (state ganha valor) e a pessoa trava o fluxo até concluir", async () => {
    const plan = snap.plans.find(p => p.name.includes("Padrão") || p.name.includes("padr"))!;
    const pessoa = snap.agents.find(a => a.kind === "pessoa")!, ia = snap.agents.find(a => a.kind === "ia")!, lib = snap.agents.find(a => a.name === "node:http")!;
    const root = snap.elements.find(e => e.title === "Comprar fone de ouvido")!;
    const mk = async (t: string) => (await post("/elements", { mode: "child", refId: root.id, title: t })).body.result as string;
    const a = await mk("Coletar algo"), b = await mk("Aprovar algo"), c = await mk("Redigir algo");
    const patchE = (id: string, body: object) => agentA.patch(`/api/v1/projects/${pidA}/elements/${id}`).send(body);
    await patchE(a, { agentId: lib.id, code: 'import { http } from "node:http"\nconst r = await http.get("https://x.test")\nsaida.coletado_x = r.body.id', outs: [["coletado_x", "out/x.json"]] });
    await patchE(b, { agentId: pessoa.id });
    await patchE(c, { agentId: ia.id });
    const st = async (id: string) => ((await agentA.get(`/api/v1/projects/${pidA}`)).body.snapshot as Snapshot).elements.find(e => e.id === id)!.status;
    // isola o teste: arquiva os demais filhos do root
    for (const k of snap.elements.filter(e => e.parentId === root.id && ![a, b, c].includes(e.id))) await patchE(k.id, { archived: true });
    expect((await agentA.post(`/api/v1/projects/${pidA}/plans/${plan.id}/run`).send({})).body.started).toBeGreaterThan(0);
    await new Promise(r => setTimeout(r, 1800));
    const after = (await agentA.get(`/api/v1/projects/${pidA}`)).body.snapshot as Snapshot;
    expect(after.data.find(d => d.name === "coletado_x")?.value).toBe("env_7f3a91"); // Node executou
    expect(await st(a)).toBe("ok"); expect(await st(b)).toBe("wait"); expect(await st(c)).toBe("pendente"); // pessoa trava o passo seguinte
    expect((await agentA.post(`/api/v1/projects/${pidA}/elements/${b}/complete`).send({})).status).toBe(200);
    await new Promise(r => setTimeout(r, 2200));
    expect(await st(b)).toBe("ok"); expect(await st(c)).toBe("ok"); // retomou e a IA executou
    expect((await agentA.post(`/api/v1/projects/${pidA}/elements/${a}/complete`).send({})).status).toBe(400); // lib não é "concluída" por pessoa
  });
});
