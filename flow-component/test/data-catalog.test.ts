import { describe, expect, it } from "vitest";
import { harness } from "./helpers";

async function withFn() {
  const h = harness();
  const f = (await h.run({ type: "createFunction", planId: "p1", title: "Enviar proposta" })).created[0]!;
  return { h, f };
}

describe("I/O", () => {
  it("addInput/addOutput criam o dado implicitamente e são idempotentes", async () => {
    const { h, f } = await withFn();
    await h.run({ type: "addInput", id: f, name: "cliente" });
    await h.run({ type: "addInput", id: f, name: "cliente" });
    await h.run({ type: "addOutput", id: f, name: "proposta" });
    expect(h.el(f).ins).toEqual(["cliente"]);
    expect(h.el(f).outs).toEqual([["proposta", "out/proposta.json"]]);
    expect(h.s.data.map(d => d.name)).toEqual(["cliente", "proposta"]);
    await h.run({ type: "removeInput", id: f, name: "cliente" });
    expect(h.el(f).ins).toEqual([]);
  });
  it("nome de dado inválido é rejeitado", async () => {
    const { h, f } = await withFn();
    expect(await h.c.execute({ type: "addInput", id: f, name: "1 ruim" })).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("patchFunction troca ins/outs/loop em lote", async () => {
    const { h, f } = await withFn();
    await h.run({ type: "patchFunction", id: f, patch: { ins: ["a", "a", "b"], outs: [["c"]], loop: ["x", "xs"] } });
    expect(h.el(f)).toMatchObject({ ins: ["a", "b"], outs: [["c", "out/c.json"]], loop: ["x", "xs"] });
  });
});

describe("dados", () => {
  it("create/upsert/clear", async () => {
    const h = harness();
    await h.run({ type: "createData", name: "preco", dataType: "numero" });
    expect(await h.c.execute({ type: "createData", name: "preco" })).toMatchObject({ ok: false, error: { code: "conflict" } });
    await h.run({ type: "upsertData", name: "preco", value: "10" });
    expect(h.s.data[0]).toMatchObject({ type: "numero", value: "10" });
    await h.run({ type: "clearDataValue", name: "preco" });
    expect(h.s.data[0]!.value).toBeNull();
  });
  it("addDataChild vira cubo; toggleCube só volta sem filhos", async () => {
    const h = harness();
    await h.run({ type: "createData", name: "cliente" });
    await h.run({ type: "addDataChild", parent: "cliente", name: "nome" });
    expect(h.s.data.find(d => d.name === "cliente")!.type).toBe("objeto");
    expect(await h.c.execute({ type: "toggleCube", name: "cliente" })).toMatchObject({ ok: false });
    await h.run({ type: "createData", name: "x" });
    await h.run({ type: "toggleCube", name: "x" });
    expect(h.s.data.find(d => d.name === "x")!.type).toBe("objeto");
    await h.run({ type: "toggleCube", name: "x" });
    expect(h.s.data.find(d => d.name === "x")!.type).toBe("texto");
  });
});

describe("responsável · task · catálogo", () => {
  it("lib concreta ajusta o título para uma task válida e valida setTask", async () => {
    const { h, f } = await withFn();
    const lib = (await h.run({ type: "createAgent", kind: "maquina", name: "node:fs" })).created[0]!;
    await h.run({ type: "assignResponsible", id: f, agentId: lib });
    expect(h.el(f)).toMatchObject({ title: "readFile", status: "pendente" });
    await h.run({ type: "setTask", id: f, task: "writeFile" });
    expect(await h.c.execute({ type: "setTask", id: f, task: "voar" })).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("pessoa zera status; limpar responsável também", async () => {
    const { h, f } = await withFn();
    const p = (await h.run({ type: "createPerson", name: "Ana" })).created[0]!;
    await h.run({ type: "assignResponsible", id: f, agentId: p });
    expect(h.el(f).status).toBeNull();
    await h.run({ type: "assignResponsible", id: f, agentId: null });
    expect(h.el(f).agentId).toBeNull();
  });
  it("responsável inexistente é rejeitado", async () => {
    const { h, f } = await withFn();
    expect(await h.c.execute({ type: "assignResponsible", id: f, agentId: "nope" })).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
  it("agente em uso não pode ser removido", async () => {
    const { h, f } = await withFn();
    const p = (await h.run({ type: "createPerson", name: "Ana" })).created[0]!;
    await h.run({ type: "assignResponsible", id: f, agentId: p });
    expect(await h.c.execute({ type: "removeAgent", id: p })).toMatchObject({ ok: false, error: { code: "conflict" } });
    await h.run({ type: "assignResponsible", id: f, agentId: null });
    await h.run({ type: "removeAgent", id: p });
    expect(h.s.agents).toEqual([]);
  });
  it("IA herda o primeiro modelo; modelo em uso por agente não sai", async () => {
    const h = harness();
    const m = (await h.run({ type: "createModel", name: "Opus", api: "claude-opus", vendor: "Anthropic" })).created[0]!;
    const a = (await h.run({ type: "createAgent", kind: "ia", name: "Redator" })).created[0]!;
    expect(h.s.agents.find(x => x.id === a)!.modelId).toBe(m);
    expect(await h.c.execute({ type: "removeModel", id: m })).toMatchObject({ ok: false, error: { code: "conflict" } });
  });
});

describe("módulos", () => {
  it("cria com nome automático, renomeia sem colidir, apaga limpando responsável", async () => {
    const h = harness();
    const m1 = (await h.run({ type: "createModule" })).created[0]!;
    await h.run({ type: "createModule", file: "b.js" });
    expect(h.s.modules.map(m => m.file)).toEqual(["novo-arquivo-1.layer.js", "b.js"]);
    expect(await h.c.execute({ type: "renameModule", id: m1, file: "b.js" })).toMatchObject({ ok: false, error: { code: "conflict" } });
    const f = (await h.run({ type: "createFunction", planId: "p1" })).created[0]!;
    await h.run({ type: "assignResponsible", id: f, agentId: `file:${m1}` });
    expect(h.el(f).agentId).toBe(`file:${m1}`);
    await h.run({ type: "deleteModule", id: m1 });
    expect(h.el(f).agentId).toBeNull();
  });
});
