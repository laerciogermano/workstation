import { describe, expect, it } from "vitest";
import { agentOf, apply, emptyProject, type Command } from "../../novo/model";
import { generate } from "../../novo/codegen";

describe("fonte arquivo: referenciar uma função de outro arquivo", () => {
  const setup = () => {
    let p = emptyProject("x"); const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
    const main = run({ type: "newFlow", title: "main" }), helper = run({ type: "newFlow", title: "helper", file: "utils.ts" });
    run({ type: "addInput", id: helper, name: "n" }); run({ type: "addOutput", id: helper, name: "r" });
    const step = run({ type: "addChild", id: main, title: "x" }); run({ type: "assign", id: step, agent: "file:utils.ts" });
    return { get p() { return p; }, main, step };
  };
  it("o arquivo vira fonte: as funções dele são as tarefas e o contrato vem de suas entradas e saídas", () => {
    const t = setup(), a = agentOf(t.p, "file:utils.ts")!; expect(a.kind).toBe("arquivo"); expect(a.tasks).toEqual(["helper"]);
    expect(a.contracts!["helper"]).toEqual({ ins: ["n"], outs: ["r"] });
    const step = t.p.flows[0]!.kids[0]!; expect(step).toMatchObject({ title: "helper", ins: ["n"], outs: ["r"] });
  });
  it("o código importa a função do outro arquivo e a chama", () => {
    const t = setup(), g = generate(t.p, t.main, { runnable: true });
    expect(g.code).toContain('import { helper } from "./utils.ts";'); expect(g.code).toContain("const { r } = await helper({ ...state, n });");
    expect(generate(t.p, t.main, { js: true }).code).toContain('const { helper } = await import("./utils.ts");');
  });
});
