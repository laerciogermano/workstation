import { describe, expect, it } from "vitest";
import { buildArg, emptyDraft, inferArg, isDataRef } from "../../novo/args";
import { apply, emptyProject, fileData, isFromArg, parseFromArg, type Command, type Fn } from "../../novo/model";
import { generate } from "../../novo/codegen";

describe("from:file#name — origem importada", () => {
  it("parseFromArg / isFromArg / isDataRef", () => {
    expect(parseFromArg("from:utils.ts#r")).toEqual({ file: "utils.ts", name: "r" });
    expect(isFromArg("from:utils.ts#r")).toBe(true);
    expect(isFromArg("pedido")).toBe(false);
    expect(isDataRef("from:utils.ts#r")).toBe(false);
  });

  it("buildArg/inferArg ida e volta do tipo import", () => {
    expect(buildArg({ ...emptyDraft("import"), value: "utils.ts#r" })).toBe("from:utils.ts#r");
    expect(inferArg("from:utils.ts#r")).toEqual({ type: "import", value: "utils.ts#r", fields: [] });
  });

  it("fileData lista outs das funções de primeira ordem do arquivo", () => {
    let p = emptyProject("t");
    const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
    run({ type: "newFlow", title: "main" });
    const helper = run({ type: "newFlow", title: "helper", file: "utils.ts" });
    run({ type: "addOutput", id: helper, name: "r" });
    expect(fileData(p, "utils.ts")).toEqual([{ name: "r", from: "helper" }]);
    expect(fileData(p, "main.ts")).toEqual([]);
  });
});

describe("1º caso: entrada com origem from:utils.ts#r", () => {
  const setup = () => {
    let p = emptyProject("x");
    const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
    const main = run({ type: "newFlow", title: "main" });
    const helper = run({ type: "newFlow", title: "helper", file: "utils.ts" });
    run({ type: "addOutput", id: helper, name: "r" });
    const step = run({ type: "addChild", id: main, title: "use" });
    run({ type: "addInput", id: step, name: "r" });
    run({ type: "setArg", id: step, name: "r", value: "from:utils.ts#r" });
    return { get p() { return p; }, main, step, helper };
  };

  it("persiste from:utils.ts#r no args da entrada", () => {
    const t = setup(), step = t.p.flows[0]!.kids[0] as Fn;
    expect(step.args?.["r"]).toBe("from:utils.ts#r");
  });

  it("codegen importa a produtora e destructura r", () => {
    const t = setup(), code = generate(t.p, t.main).code;
    expect(code).toContain('import { helper } from "./utils.ts";');
    expect(code).toContain("const { r } = await helper({})");
  });
});
