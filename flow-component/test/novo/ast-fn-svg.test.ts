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

  it("main com filha: composição + barra da filha", () => {
    const flow: Fn = {
      ...main(),
      kids: [{ t: "fn", id: "n2", title: "hello", agent: null, resp: null, ins: [], outs: [], kids: [], par: false }],
    };
    const { svg, scene } = renderFnSvg(flow);
    expect(scene.rows.filter(r => r.kind === "fn")).toHaveLength(2);
    expect(svg).toContain("hello");
    expect(svg).toContain("sum"); // barra de composição da main
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
    expect(svg).toContain("∥");
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

  it("recusa bloco if (lote só funções)", () => {
    const bad = {
      ...main(),
      kids: [{ t: "if" as const, id: "i1", test: "x", kids: [], elseKids: [] }],
    };
    expect(() => renderFnSvg(bad)).toThrow(/fn-svg/);
  });
});
