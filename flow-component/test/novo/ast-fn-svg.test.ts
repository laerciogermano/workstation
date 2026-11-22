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

  it("recusa bloco if (lote só funções)", () => {
    const bad = {
      ...main(),
      kids: [{ t: "if" as const, id: "i1", test: "x", kids: [], elseKids: [] }],
    };
    expect(() => renderFnSvg(bad)).toThrow(/fn-svg/);
  });
});
