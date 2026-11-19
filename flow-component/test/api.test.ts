import { describe, expect, it } from "vitest";
import { createFlowComponent, EFFECT_COMMAND_TYPES, MODEL_COMMAND_TYPES, memoryStore, ok, sequentialGen } from "../src";
import { empty } from "./helpers";

const make = () => createFlowComponent({ store: memoryStore(empty()), newId: sequentialGen("n"), exporter: { export: async (p, f) => ok(`${p}:${f}`) } });

describe("funções tipadas por comando", () => {
  it("existe uma função para cada type do contrato", () => {
    const flow = make() as unknown as Record<string, unknown>;
    for (const t of [...MODEL_COMMAND_TYPES, ...EFFECT_COMMAND_TYPES]) expect(typeof flow[t]).toBe("function");
  });
  it("flow.createChild(...) equivale a execute({ type: 'createChild', ... })", async () => {
    const flow = make();
    const a = await flow.createFunction({ planId: "p1", title: "Vender" });
    expect(a.ok && a.value.created).toEqual(["n-1"]);
    const b = await flow.createChild({ refId: "n-1", title: "Cobrar" });
    expect(b.ok && b.value.kind === "model" && b.value.created).toEqual(["n-2"]);
    expect(flow.snapshot.elements.find(e => e.id === "n-2")?.parentId).toBe("n-1");
  });
  it("erros continuam por valor e argumento é opcional quando nada é obrigatório", async () => {
    const flow = make();
    expect(await flow.createChild({ refId: "nope" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    const m = await flow.createModule();
    expect(m.ok && flow.snapshot.modules[0]?.file).toBe("novo-arquivo-1.layer.js");
  });
  it("comandos de efeito também têm função", async () => {
    expect(await make().exportPlan({ planId: "p1", format: "ts" })).toEqual({ ok: true, value: { kind: "effect", output: "p1:ts" } });
  });
});
