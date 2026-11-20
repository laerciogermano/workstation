import { describe, expect, it } from "vitest";
import { layout, links } from "../../novo/layout";
import { apply, DEFAULT_AGENTS, emptyProject, locate, type Command, type Fn, type Project } from "../../novo/model";

function base(n = 4) {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "R" });
  const ids = Array.from({ length: n }, (_, i) => run({ type: "addChild", id: root, title: "ABCDEFGH"[i]! }));
  const sc = (closed: string[] = []) => layout(locate(p, root)!.node as Fn, { closed: new Set(closed) });
  const names = (s: ReturnType<typeof sc>) => s.rows.filter(r => r.kind === "fn").map(r => `${(r.node as Fn).title}:${r.s}-${r.e}`);
  return { run, root, ids, sc, names, get p(): Project { return p; } };
}

describe("cena: linhas e passos", () => {
  it("fluxo de um elemento só: um passo, sem filhos", () => {
    let p = emptyProject("T"); const r = apply(p, { type: "newFlow", title: "main" }); p = r.project; const s = layout(p.flows[0]!);
    expect(s.nSteps).toBe(1); expect(s.rows.map(x => x.kind)).toEqual(["fn"]); expect(s.rows[0]!.leaf).toBe(true); expect(s.leaves).toHaveLength(1);
  });
  it("filhos em sequência ocupam passos consecutivos; a composição cobre todos", () => {
    const t = base(), s = t.sc(); expect(t.names(s)).toEqual(["R:0-3", "A:0-0", "B:1-1", "C:2-2", "D:3-3"]); expect(s.nSteps).toBe(4);
    expect(s.span.get(t.root)).toEqual({ s: 0, e: 3 }); expect(s.rows[0]!.last).toBe(4);
  });
  it("dados (entradas e saídas) não ganham linha própria: a tabela só tem funções e blocos", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" });
    const s = t.sc(); expect(s.rows.map(r => r.kind)).toEqual(["fn", "fn", "fn", "fn", "fn"]); expect(s.rows.length).toBe(5); expect(s.rows[1]!.last).toBe(1);
  });
  it("funções em paralelo dividem o mesmo passo; o seguinte vem depois", () => {
    const t = base(); t.run({ type: "setParallel", id: t.ids[1]!, on: true }); expect(t.names(t.sc())).toEqual(["R:0-2", "A:0-0", "B:0-0", "C:1-1", "D:2-2"]);
  });
  it("bloco cobre os passos dos filhos e fica na linha do cabeçalho", () => {
    const t = base(); const b = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }); t.run({ type: "setScope", id: b, count: 2 });
    const s = t.sc(), row = s.rows.find(r => r.id === b)!; expect(row).toMatchObject({ kind: "block", s: 1, e: 2, depth: 1 }); expect(row.last).toBe(s.rows.findIndex(r => r.id === t.ids[2]));
    expect(t.names(s)).toContain("B:1-1"); expect(s.rows.find(r => r.id === t.ids[1])!.depth).toBe(2); expect(s.maxDepth).toBe(2);
  });
  it("if e for aninhados indentam e cobrem os mesmos passos", () => {
    const t = base(); const f = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), i = t.run({ type: "wrap", id: f, kind: "if" });
    const s = t.sc(); expect(s.rows.find(r => r.id === i)!.depth).toBe(1); expect(s.rows.find(r => r.id === f)!.depth).toBe(2); expect(s.span.get(i)).toEqual(s.span.get(f));
  });
  it("catch fica em sequência após o último do try; o próximo só começa depois (mesma regra do else)", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }); t.run({ type: "setScope", id: tr, count: 2 });
    const s = t.sc(), c = s.rows.find(r => r.kind === "catch")!;
    expect(s.span.get(tr)).toEqual({ s: 1, e: 2 }); expect(c.s).toBe(3); expect(c.e).toBe(3);   // começa no passo seguinte ao try
    expect(t.names(s).find(x => x.startsWith("Handle error"))).toBe("Handle error:3-3"); expect(t.names(s)).toContain("D:4-4");
    t.run({ type: "addChild", id: tr, catch: true, title: "c1" }); t.run({ type: "addChild", id: tr, catch: true, title: "c0" });
    const s2 = t.sc(), c2 = s2.rows.find(r => r.kind === "catch")!; expect(c2.s).toBe(3); expect(c2.e).toBe(5); expect(t.names(s2)).toContain("D:6-6");
    expect(s2.rows.findIndex(r => r.kind === "catch")).toBeGreaterThan(s2.rows.findIndex(r => r.id === t.ids[2]));
  });
  it("else do if: mesma regra do catch — sequência após o último do if", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); t.run({ type: "setScope", id: i, count: 2 }); t.run({ type: "addElse", id: i, title: "Senao1" });
    const s = t.sc(), e = s.rows.find(r => r.kind === "else")!;
    expect(e).toBeTruthy(); expect(s.span.get(i)).toEqual({ s: 1, e: 2 }); expect(e.s).toBe(3); expect(e.e).toBe(3); expect(t.names(s)).toContain("Senao1:3-3"); expect(t.names(s)).toContain("D:4-4");
    expect(s.rows.findIndex(r => r.kind === "else")).toBeGreaterThan(s.rows.findIndex(r => r.id === t.ids[2])); expect(s.leaves.map(l => (l.node as Fn).title)).toEqual(["A", "B", "C", "D"]);
    expect(e.depth).toBe(1); expect(e.last).toBeGreaterThan(s.rows.indexOf(e) - 1);
  });
  it("if sem else não gera linha de else", () => { const t = base(); t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); expect(t.sc().rows.some(r => r.kind === "else")).toBe(false); });
  it("funções do catch não entram na sequência (leaves)", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }); const s = t.sc();
    expect(s.leaves.map(l => (l.node as Fn).title)).toEqual(["A", "B", "C", "D"]); expect(tr).toBeTruthy();
  });
  it("composição fechada some com os filhos mas mantém o passo", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[1]!, title: "B1" }); t.run({ type: "addChild", id: t.ids[1]!, title: "B2" });
    const open = t.sc(), shut = t.sc([t.ids[1]!]); expect(open.rows.length).toBe(shut.rows.length + 2); expect(shut.rows.find(r => r.id === t.ids[1])!.closed).toBe(true);
    expect(shut.span.get(t.ids[1]!)).toEqual({ s: 1, e: 2 }); expect(shut.nSteps).toBe(open.nSteps);
  });
  it("bloco (if/for/try) fechado some com os filhos e mantém o passo; catch fecha à parte", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" });
    const open = t.sc(), shut = t.sc([tr]); expect(shut.rows.find(r => r.id === tr && r.kind === "block")!.closed).toBe(true);
    expect(shut.rows.some(r => r.kind === "catch")).toBe(false); expect(open.rows.some(r => r.kind === "catch")).toBe(true);
    expect(shut.nSteps).toBe(open.nSteps);
    const onlyCatch = t.sc([`${tr}:catch`]); expect(onlyCatch.rows.find(r => r.kind === "catch")!.closed).toBe(true);
  });
  it("links: B liga a A quando começa no passo seguinte; paralelas ligam as duas ao seguinte", () => {
    const t = base(); t.run({ type: "setParallel", id: t.ids[1]!, on: true });
    const l = links(t.sc()).map(([a, b]) => `${(a.node as Fn).title}>${(b.node as Fn).title}`); expect(l).toEqual(["A>C", "B>C", "C>D"]);
  });
});
