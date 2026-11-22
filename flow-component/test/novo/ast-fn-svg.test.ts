import { describe, expect, it } from "vitest";
import { renderFnSvg, fnAstToSvg } from "../../novo/ast/fn-svg";
import type { Fn } from "../../novo/model";

const main = (): Fn => ({
  t: "fn", id: "n1", title: "main", agent: null, resp: null,
  ins: [], outs: [], kids: [], par: false, file: "main.ts",
});

describe("ast/fn-svg", () => {
  it("main folha: SVG com s0, s1 e barra main sólida (1ª ordem)", () => {
    const { svg, scene, width, height } = renderFnSvg(main());
    expect(scene.nSteps).toBe(1);
    expect(scene.rows).toHaveLength(1);
    expect(svg).toContain("<svg");
    expect(svg).toContain(">s0<");
    expect(svg).toContain(">s1<");
    expect(svg).toContain("main");
    expect(svg).toMatch(/class="fn conc/);
    expect(svg).not.toMatch(/class="fn nag/);
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(50);
  });

  it("fnAstToSvg devolve só a string", () => {
    expect(fnAstToSvg(main()).startsWith("<svg")).toBe(true);
  });

  it("main com filha: composição + barra da filha sólida", () => {
    const flow: Fn = {
      ...main(),
      kids: [{ t: "fn", id: "n2", title: "hello", agent: "arquivo", resp: null, ins: [], outs: [], kids: [], par: false }],
    };
    const { svg, scene } = renderFnSvg(flow);
    expect(scene.rows.filter(r => r.kind === "fn")).toHaveLength(2);
    expect(svg).toContain("hello");
    expect(svg).toContain("sum"); // barra de composição da main
    expect(svg).toMatch(/class="fn conc/); // filha sólida (agente arquivo)
  });

  it("irmãs paralelas compartilham o mesmo passo", () => {
    const flow: Fn = {
      ...main(),
      kids: [
        { t: "fn", id: "n2", title: "a", agent: null, resp: null, ins: [], outs: [], kids: [], par: false },
        { t: "fn", id: "n3", title: "b", agent: null, resp: null, ins: [], outs: [], kids: [], par: true },
      ],
    };
    const { svg, scene } = renderFnSvg(flow);
    const leaves = scene.leaves;
    expect(leaves).toHaveLength(2);
    expect(leaves[0]!.s).toBe(leaves[1]!.s);
    expect(svg).not.toContain("∥");                                  // padrão: o passo já mostra o paralelismo
    expect(renderFnSvg(flow, { parMark: true }).svg).toContain("∥");  // opcional
  });

  it("irmãs sequenciais ocupam passos consecutivos", () => {
    const flow: Fn = {
      ...main(),
      kids: [
        { t: "fn", id: "n2", title: "a", agent: null, resp: null, ins: [], outs: [], kids: [], par: false },
        { t: "fn", id: "n3", title: "b", agent: null, resp: null, ins: [], outs: [], kids: [], par: false },
      ],
    };
    const { scene } = renderFnSvg(flow);
    expect(scene.nSteps).toBe(2);
    expect(scene.leaves[0]!.s).toBe(0);
    expect(scene.leaves[1]!.s).toBe(1);
  });

  const f = (id: string, title: string, extra: Partial<Fn> = {}): Fn =>
    ({ t: "fn", id, title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false, ...extra });

  it("if/else: desenha pills if e else", () => {
    const flow: Fn = { ...main(), kids: [{ t: "if", id: "i1", test: "ok", kids: [f("n2", "a")], elseKids: [f("n3", "b")] }] };
    const { svg, scene } = renderFnSvg(flow);
    expect(svg).toContain("if (ok)");
    expect(svg).toContain("else");
    expect(scene.nSteps).toBe(2);
  });

  it("for e try/catch", () => {
    const flow: Fn = { ...main(), kids: [
      { t: "for", id: "l1", v: "x", coll: "xs", kids: [f("n2", "a")] },
      { t: "try", id: "t1", kids: [f("n3", "b")], catchKids: [f("n4", "c")] },
    ] };
    const { svg } = renderFnSvg(flow);
    expect(svg).toContain("for (x of xs)");
    expect(svg).toContain("try · catch ↓ c");
    expect(svg).toContain("pill ca");
  });

  it("recusa nó desconhecido", () => {
    const bad = { ...main(), kids: [{ t: "while", id: "w1", kids: [] }] } as unknown as Fn;
    expect(() => renderFnSvg(bad)).toThrow(/fn-svg/);
  });
});

describe("ast/fn-svg elseParallel", () => {
  it("else no mesmo passo do if", () => {
    const f = (id: string, title: string): Fn => ({ t: "fn", id, title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
    const flow: Fn = { ...f("n1", "main"), kids: [{ t: "if", id: "i1", test: "ok", kids: [f("n2", "a")], elseKids: [f("n3", "b")] }] };
    const { scene } = renderFnSvg(flow, { elseParallel: true });
    expect(scene.nSteps).toBe(1);
    const s = (id: string) => scene.rows.find(r => r.id === id)!.s;
    expect(s("n2")).toBe(s("n3"));
  });
});
