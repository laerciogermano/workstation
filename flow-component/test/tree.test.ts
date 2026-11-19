import { describe, expect, it } from "vitest";
import { query } from "../src";
import { empty, harness } from "./helpers";

async function flow() {
  const h = harness();
  const a = (await h.run({ type: "createFunction", planId: "p1", title: "Vender" })).created[0]!;
  const b = (await h.run({ type: "createChild", refId: a, title: "Cobrar" })).created[0]!;
  const c = (await h.run({ type: "createChild", refId: a, title: "Entregar" })).created[0]!;
  return { h, a, b, c };
}
const seq = (h: ReturnType<typeof harness>) => h.s.links.filter(l => l.kind === "seq").map(l => `${l.from}>${l.to}`);

describe("composição", () => {
  it("createFunction cria sob a raiz do plano", async () => {
    const { h, a } = await flow();
    expect(h.el(a).parentId).toBe("root");
  });
  it("filhos entram em sequência", async () => {
    const { h, b, c } = await flow();
    expect(seq(h)).toEqual([`${b}>${c}`]);
  });
  it("irmão 'after' religa a sequência no meio", async () => {
    const { h, b, c } = await flow();
    const m = (await h.run({ type: "createSibling", refId: b, position: "after", title: "Faturar" })).created[0]!;
    expect(seq(h).sort()).toEqual([`${b}>${m}`, `${m}>${c}`].sort());
    expect(query.children(h.s, h.el(b).parentId).map(e => e.id)).toEqual([b, m, c]);
  });
  it("irmão 'before' religa a sequência no meio", async () => {
    const { h, b, c } = await flow();
    const m = (await h.run({ type: "createSibling", refId: c, position: "before" })).created[0]!;
    expect(query.children(h.s, h.el(b).parentId).map(e => e.id)).toEqual([b, m, c]);
    expect(seq(h).sort()).toEqual([`${b}>${m}`, `${m}>${c}`].sort());
  });
  it("não cria irmão da raiz nem filho de dado", async () => {
    const h = harness();
    const r = await h.c.execute({ type: "createSibling", refId: "root", position: "after" });
    expect(r).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("não muta o snapshot de entrada", async () => {
    const h = harness();
    const before = JSON.stringify(h.s);
    const snap = h.s;
    await h.run({ type: "createFunction", planId: "p1" });
    expect(JSON.stringify(snap)).toBe(before);
  });
});

describe("remover / mover / duplicar", () => {
  it("remove com descendentes e costura a sequência", async () => {
    const { h, a, b, c } = await flow();
    const x = (await h.run({ type: "createChild", refId: a, title: "Fechar" })).created[0]!;
    const r = await h.run({ type: "removeElements", ids: [c] });
    expect(r.removed).toEqual([c]);
    expect(seq(h)).toEqual([`${b}>${x}`]);
    const r2 = await h.run({ type: "removeElements", ids: [a] });
    expect(new Set(r2.removed)).toEqual(new Set([a, b, x]));
    expect(h.s.links).toEqual([]);
  });
  it("move não entra em si mesmo", async () => {
    const { h, a, b } = await flow();
    const r = await h.c.execute({ type: "move", id: a, refId: b, mode: "child" });
    expect(r).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("move reordena e religa", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "move", id: c, refId: b, mode: "before" });
    expect(query.children(h.s, h.el(b).parentId).map(e => e.id)).toEqual([c, b]);
    expect(seq(h)).toEqual([`${c}>${b}`]);
  });
  it("duplicate gera IDRs novos e título (cópia)", async () => {
    const { h, a, b } = await flow();
    const r = await h.run({ type: "duplicate", id: a });
    const copy = r.created[0]!;
    expect(copy).not.toBe(a);
    expect(h.el(copy).title).toBe("Vender (cópia)");
    expect(query.children(h.s, copy).map(e => e.title)).toEqual(["Cobrar", "Entregar"]);
    expect(query.children(h.s, copy).map(e => e.id)).not.toContain(b);
  });
  it("paste cut move a subárvore; paste cut para dentro de si falha", async () => {
    const { h, a, b } = await flow();
    const f2 = (await h.run({ type: "createFunction", planId: "p1", title: "Outro" })).created[0]!;
    await h.run({ type: "paste", ids: [a], mode: "cut", destId: f2 });
    expect(h.el(a).parentId).toBe(f2);
    const bad = await h.c.execute({ type: "paste", ids: [a], mode: "cut", destId: b });
    expect(bad).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("archive tira o elemento do corpo do if", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "setSelection", id: c, on: true });
    expect(h.s.structs).toHaveLength(1);
    await h.run({ type: "archive", id: c });
    expect(h.s.structs).toHaveLength(0);
    expect(h.el(b).archived).toBe(false);
  });
});

describe("if / for / paralelo", () => {
  it("setSelection liga volta à função anterior e desliga limpa cond", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "setSelection", id: c, on: true });
    expect(h.el(c).cond).toEqual(["condicao", b]);
    await h.run({ type: "setSelection", id: c, on: false });
    expect(h.el(c).cond).toBeNull();
    expect(h.s.structs).toEqual([]);
  });
  it("seleção/repetição só em folha", async () => {
    const { h, a } = await flow();
    for (const type of ["setSelection", "setRepetition"] as const) {
      expect(await h.c.execute({ type, id: a, on: true })).toMatchObject({ ok: false, error: { code: "invalid" } });
    }
  });
  it("setRepetition liga com defaults e desliga", async () => {
    const { h, b } = await flow();
    await h.run({ type: "setRepetition", id: b, on: true });
    expect(h.el(b).loop).toEqual(["item", "lista"]);
    await h.run({ type: "setRepetition", id: b, on: false });
    expect(h.el(b).loop).toBeNull();
  });
  it("setParallel liga/desliga sem duplicar", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "setParallel", a: b, b: c, on: true });
    await h.run({ type: "setParallel", a: b, b: c, on: true });
    expect(h.s.links.filter(l => l.kind === "par")).toHaveLength(1);
    await h.run({ type: "setParallel", a: c, b: b, on: false });
    expect(h.s.links.filter(l => l.kind === "par")).toHaveLength(0);
  });
});

describe("contrato do componente", () => {
  it("comando desabilitado é recusado e can() reflete", async () => {
    const { createFlowComponent, memoryStore } = await import("../src");
    const c = createFlowComponent({ store: memoryStore(empty()), disabled: ["removeElements"] });
    expect(c.can("removeElements")).toBe(false);
    expect(await c.execute({ type: "removeElements", ids: ["x"] })).toMatchObject({ ok: false, error: { code: "disabled" } });
  });
  it("efeito sem adapter é 'unsupported'", async () => {
    const { createFlowComponent, memoryStore } = await import("../src");
    const c = createFlowComponent({ store: memoryStore(empty()) });
    expect(c.can("runPlan")).toBe(false);
    expect(await c.execute({ type: "runPlan", planId: "p1" })).toMatchObject({ ok: false, error: { code: "unsupported" } });
  });
  it("exportPlan delega ao Exporter", async () => {
    const { createFlowComponent, memoryStore, ok } = await import("../src");
    const c = createFlowComponent({ store: memoryStore(empty()), exporter: { export: async (p, f) => ok(`${p}:${f}`) } });
    expect(await c.execute({ type: "exportPlan", planId: "p1", format: "ts" })).toEqual({ ok: true, value: { kind: "effect", output: "p1:ts" } });
  });
});

describe("try / catch", () => {
  it("setTryCatch liga criando a função de tratamento (fora da sequência) e desligar a remove", async () => {
    const { h, b } = await flow();
    const r = await h.run({ type: "setTryCatch", id: b, on: true });
    const handler = r.created[0]!;
    expect(h.el(b).onError).toBe(handler);
    expect(h.el(handler)).toMatchObject({ title: "Tratar falha", parentId: h.el(b).parentId });
    const off = await h.run({ type: "setTryCatch", id: b, on: false });
    expect(h.el(b).onError).toBeNull();
    expect(off.removed).toEqual([handler]);
    expect(h.s.elements.some(e => e.id === handler)).toBe(false);
  });
  it("desligar mantém um tratamento que já foi personalizado; desligar sem try é erro", async () => {
    const { h, b, c } = await flow();
    const handler = (await h.run({ type: "setTryCatch", id: b, on: true })).created[0]!;
    await h.run({ type: "addInput", id: handler, name: "erro" });
    await h.run({ type: "setTryCatch", id: b, on: false });
    expect(h.s.elements.some(e => e.id === handler)).toBe(true);
    expect(await h.c.execute({ type: "setTryCatch", id: c, on: false })).toMatchObject({ ok: false, error: { code: "invalid" } });
  });
  it("setCatch valida o tratamento: existente e fora do próprio try", async () => {
    const { h, a, b, c } = await flow();
    expect(await h.c.execute({ type: "setCatch", id: b, handlerId: "nope" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await h.c.execute({ type: "setCatch", id: a, handlerId: b })).toMatchObject({ ok: false, error: { code: "invalid" } }); // filho do próprio try
    expect(await h.c.execute({ type: "setCatch", id: b, handlerId: b })).toMatchObject({ ok: false, error: { code: "invalid" } });
    await h.run({ type: "setCatch", id: b, handlerId: c });
    expect(h.el(b).onError).toBe(c);
  });
  it("remover o tratamento limpa o try; duplicar preserva", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "setCatch", id: b, handlerId: c });
    await h.run({ type: "removeElements", ids: [c] });
    expect(h.el(b).onError).toBeNull();
  });
  it("patchFunction aceita onError", async () => {
    const { h, b, c } = await flow();
    await h.run({ type: "patchFunction", id: b, patch: { onError: c } });
    expect(h.el(b).onError).toBe(c);
  });
});

describe("try / catch cobrindo várias funções", () => {
  it("through faz um único try cobrir um intervalo de irmãs, com um só tratamento", async () => {
    const { h, a, b, c } = await flow();
    const d = (await h.run({ type: "createChild", refId: a, title: "Fechar" })).created[0]!;
    const r = await h.run({ type: "setTryCatch", id: b, on: true, through: c });
    const handler = r.created[0]!;
    expect([b, c].map(id => h.el(id).onError)).toEqual([handler, handler]);
    expect(h.el(d).onError ?? null).toBeNull();
    expect(r.created).toHaveLength(1);
  });
  it("setCatch com through valida o intervalo", async () => {
    const { h, b, c } = await flow();
    expect(await h.c.execute({ type: "setCatch", id: c, handlerId: b, through: b })).toMatchObject({ ok: false, error: { code: "invalid" } });   // through antes de id
    expect(await h.c.execute({ type: "setCatch", id: b, handlerId: "nope", through: c })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await h.c.execute({ type: "setCatch", id: b, handlerId: c, through: c })).toMatchObject({ ok: false, error: { code: "invalid" } });    // tratamento dentro do próprio try
  });
  it("estende o bloco, tira um membro e desligar limpa o bloco inteiro (removendo o tratamento intocado)", async () => {
    const { h, a, b, c } = await flow();
    const d = (await h.run({ type: "createChild", refId: a, title: "Fechar" })).created[0]!;
    const handler = (await h.run({ type: "setTryCatch", id: b, on: true })).created[0]!;
    await h.run({ type: "setTryCatch", id: b, on: true, through: c });                    // estende b..c
    expect(h.el(c).onError).toBe(handler);
    await h.run({ type: "setCatch", id: c, handlerId: null });                            // tira só c
    expect(h.el(b).onError).toBe(handler); expect(h.el(c).onError ?? null).toBeNull();
    await h.run({ type: "setTryCatch", id: b, on: true, through: d });                    // b..d (c fica no meio)
    const off = await h.run({ type: "setTryCatch", id: d, on: false });                   // desligar por qualquer membro limpa o bloco todo
    expect([b, c, d].map(id => h.el(id).onError ?? null)).toEqual([null, null, null]);
    expect(off.removed).toEqual([handler]);
  });
});
