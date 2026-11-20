import { describe, expect, it } from "vitest";
import { buildCond, COND_OPS, emptyClause, emptyCond, inferCond, JOINERS, needsRight, splitTop, type Clause, type CondOp } from "../../novo/cond";
import { inferArg } from "../../novo/args";

const ref = (v: string) => ({ ...inferArg(v), type: "ref" as const, value: v });
const cl = (left: string, op: CondOp, right = "", join: "&&" | "||" = "&&"): Clause => ({ left: ref(left), op, right: right ? inferArg(right) : inferArg(""), join });

describe("condição do if: operadores, AND/OR", () => {
  it("catálogo: 14 operadores, cada um diz se precisa de valor; AND e OR", () => {
    expect(COND_OPS).toHaveLength(14); expect(new Set(COND_OPS.map(o => o.op)).size).toBe(14); expect(JOINERS.map(j => j.join)).toEqual(["&&", "||"]);
    for (const o of ["truthy", "falsy", "empty", "notEmpty"] as const) expect(needsRight(o)).toBe(false); for (const o of ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "notContains", "startsWith", "endsWith"] as const) expect(needsRight(o)).toBe(true);
  });
  it("cada operador gera a expressão certa", () => {
    const b = (op: CondOp, right = '"x"'): string => buildCond({ clauses: [cl("a.b", op, right)] });
    expect(b("truthy")).toBe("a.b"); expect(b("falsy")).toBe("!a.b"); expect(b("eq")).toBe('a.b === "x"'); expect(b("neq")).toBe('a.b !== "x"'); expect(b("gt", "3")).toBe("a.b > 3"); expect(b("gte", "3")).toBe("a.b >= 3"); expect(b("lt", "3")).toBe("a.b < 3"); expect(b("lte", "3")).toBe("a.b <= 3");
    expect(b("contains")).toBe('a.b.includes("x")'); expect(b("notContains")).toBe('!a.b.includes("x")'); expect(b("startsWith")).toBe('a.b.startsWith("x")'); expect(b("endsWith")).toBe('a.b.endsWith("x")'); expect(b("empty")).toBe("!a.b?.length"); expect(b("notEmpty")).toBe("!!a.b?.length");
    expect(b("eq", "true")).toBe("a.b === true"); expect(b("eq", "other")).toBe("a.b === other");   // valor pode ser texto, número, booleano ou outro dado
  });
  it("AND e OR ligam as cláusulas na ordem; vazias são ignoradas; sem nada = vazio", () => {
    expect(buildCond({ clauses: [cl("a", "truthy"), cl("b", "gt", "3", "&&"), cl("c", "falsy", "", "||")] })).toBe("a && b > 3 || !c");
    expect(buildCond({ clauses: [cl("a", "eq", '"x"'), { ...emptyClause("||") }, cl("b", "truthy", "", "||")] })).toBe('a === "x" || b');   // a cláusula sem dado some
    expect(buildCond({ clauses: [cl("a", "eq", "")] })).toBe("");                                                                      // operador que precisa de valor sem valor
    expect(buildCond(emptyCond())).toBe(""); expect(buildCond({ clauses: [{ ...cl("x", "truthy"), join: "||" }] })).toBe("x");           // o ligador da primeira não conta
  });
  it("splitTop respeita aspas, parênteses, colchetes e chaves", () => {
    expect(splitTop('a && b', "&&")).toEqual(["a", "b"]); expect(splitTop('f(a && b) && "x && y" && [c || d]', "&&")).toEqual(["f(a && b)", '"x && y"', "[c || d]"]); expect(splitTop("a || b && c", "||")).toEqual(["a", "b && c"]);
    expect(splitTop("`a && ${b && c}` && d", "&&")).toEqual(["`a && ${b && c}`", "d"]); expect(splitTop("a", "||")).toEqual(["a"]); expect(splitTop('x === "\\" && "', "&&")).toEqual(['x === "\\" && "']);
  });
  it("ida e volta: toda condição gerada é lida de volta igual", () => {
    const cases: Clause[][] = [[cl("a", "truthy")], [cl("a", "falsy")], [cl("a.b", "eq", '"x"'), cl("c", "neq", "4", "&&")], [cl("a", "gt", "1"), cl("b", "lte", "2", "||"), cl("c", "contains", '"z"', "&&")],
      [cl("l", "empty"), cl("m", "notEmpty", "", "||")], [cl("s", "startsWith", '"ab"'), cl("t", "endsWith", '"yz"'), cl("u", "notContains", "other", "||")], [cl("a", "eq", "true"), cl("b", "eq", "false")]];
    for (const c of cases) { const e = buildCond({ clauses: c }); expect(buildCond(inferCond(e)), e).toBe(e); expect(inferCond(e).clauses.map(x => x.op)).toEqual(c.map(x => x.op)); expect(inferCond(e).clauses.map(x => x.join)).toEqual(c.map((x, i) => (i === 0 ? "&&" : x.join))); }
  });
  it("inferCond: lê operadores, dados e valores tipados", () => {
    const d = inferCond('customer.status === "active" && total >= 10 || !blocked');
    expect(d.clauses.map(c => [c.op, c.join, c.left.value])).toEqual([["eq", "&&", "customer.status"], ["gte", "&&", "total"], ["falsy", "||", "blocked"]]); expect(d.clauses[0]!.right).toMatchObject({ type: "text", value: "active" }); expect(d.clauses[1]!.right).toMatchObject({ type: "number", value: "10" });
    expect(inferCond("a.b.includes(x)").clauses[0]).toMatchObject({ op: "contains", left: { value: "a.b" }, right: { type: "ref", value: "x" } }); expect(inferCond("!items?.length").clauses[0]).toMatchObject({ op: "empty", left: { value: "items" } });
    expect(inferCond("").clauses).toHaveLength(1); expect(inferCond("   ").clauses[0]!.left.value).toBe("");
  });
  it("o que não é reconhecido vira uma cláusula de expressão livre (nada se perde)", () => {
    for (const e of ["a + b > 3", "typeof x === 'string'", "fn(x) && y", "(a || b) && c", "a ? b : c", "x.y.z()", "!(a && b)"]) { const d = inferCond(e); expect(buildCond(d), e).toBe(e); }
    expect(inferCond("a + b > 3").clauses[0]).toMatchObject({ op: "truthy", left: { type: "expr", value: "a + b > 3" } });
    expect(inferCond("x > 1 && a + b").clauses.map(c => c.left.type)).toEqual(["ref", "expr"]);
  });
  it("falsy de expressão livre ganha parênteses", () => { expect(buildCond({ clauses: [{ left: { type: "expr", value: "a + b", fields: [] }, op: "falsy", right: inferArg(""), join: "&&" }] })).toBe("!(a + b)"); });
});
