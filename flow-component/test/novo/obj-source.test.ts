import { describe, expect, it } from "vitest";
import { apply, emptyProject, locate, objectSources, objAgent, type Fn } from "../../novo/model";
import { generate } from "../../novo/codegen";
import { build } from "../../novo/view";
import { DEFAULT_AGENTS } from "../../novo/model";

const setup = () => {
  let p = emptyProject("t"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (cmd: Parameters<typeof apply>[1]): string => { const r = apply(p, cmd); p = r.project; return r.created!; };
  const main = run({ type: "newFlow", title: "main" });
  const fetchId = run({ type: "addChild", id: main, title: "get" });
  run({ type: "assign", id: fetchId, agent: "web" });
  run({ type: "setTask", id: fetchId, task: "fetch" });
  run({ type: "renameData", id: fetchId, to: "response" });
  const next = run({ type: "addChild", id: main, title: "body" });
  return { get p() { return p; }, run, main, fetchId, next, fn: () => locate(p, next)!.node as Fn };
};

describe("objeto do contexto como source", () => {
  it("response do fetch aparece em objectSources com métodos json/text/…", () => {
    const t = setup();
    const src = objectSources(t.p, t.next);
    expect(src.map(s => s.name)).toEqual(["response"]);
    expect(src[0]!.agent.tasks).toEqual(["json", "text", "blob", "arrayBuffer", "formData"]);
  });

  it("assign obj:response#json aplica o contrato e o select marca o método", () => {
    const t = setup();
    t.run({ type: "assign", id: t.next, agent: "obj:response" });
    t.run({ type: "setTask", id: t.next, task: "json" });
    expect(t.fn()).toMatchObject({ agent: "obj:response", title: "json", outs: ["value"] });
    const table = build(t.p, t.main, { closed: new Set(), sel: null, txtIn: true, allData: true }).table;
    expect(table).toContain('value="obj:response#json"');
    expect(table).toContain("selected");
  });

  it("codegen chama response.json() e lê o objeto do state", () => {
    const t = setup();
    t.run({ type: "assign", id: t.next, agent: "obj:response" });
    t.run({ type: "setTask", id: t.next, task: "json" });
    const code = generate(t.p, t.main).code;
    expect(code).toContain("const { response } = state;");
    expect(code).toContain("return { value: await response.json() };");
  });

  it("objAgent sem produtor tipado não existe", () => {
    const t = setup();
    expect(objAgent(t.p, "inexistente", t.next)).toBeUndefined();
  });
});
