import { describe, expect, it } from "vitest";
import { ARG_TYPES, buildArg, emptyDraft, inferArg, isDataRef, type ArgDraft } from "../../novo/args";

const d = (type: ArgDraft["type"], value = "", fields: ArgDraft["fields"] = []): ArgDraft => ({ type, value, fields });
const f = (name: string, draft: ArgDraft) => ({ name, draft });
const fails = (fn: () => unknown, msg: RegExp): void => { try { fn(); } catch (e) { expect((e as Error).message).toMatch(msg); return; } throw new Error("deveria falhar"); };

describe("isDataRef", () => {
  it("nome de dado / caminho = ref; literais true/false/null não", () => {
    expect(isDataRef("mensagem")).toBe(true); expect(isDataRef("cliente.nome")).toBe(true); expect(isDataRef("xs[0]")).toBe(true);
    expect(isDataRef("true")).toBe(false); expect(isDataRef("false")).toBe(false); expect(isDataRef("null")).toBe(false); expect(isDataRef("undefined")).toBe(false);
    expect(isDataRef('"oi"')).toBe(false); expect(isDataRef("1 + 2")).toBe(false); expect(isDataRef("")).toBe(false);
  });
});

describe("value de uma entrada: tipo e value", () => {
  it("os seis tipos existem e o draft vazio de cada um é válido", () => { expect(ARG_TYPES.map(t => t.type)).toEqual(["text", "number", "boolean", "ref", "expr", "object"]); for (const t of ARG_TYPES) expect(() => buildArg(emptyDraft(t.type))).not.toThrow(); });
  it("text vira string com aspas (escapa), número vira número, booleano true/false", () => {
    expect(buildArg(d("text", "Olá"))).toBe('"Olá"'); expect(buildArg(d("text", 'diz "oi"\nlinha'))).toBe(JSON.stringify('diz "oi"\nlinha')); expect(buildArg(d("text", ""))).toBe("");
    expect(buildArg(d("number", " 42 "))).toBe("42"); expect(buildArg(d("number", "-3.5"))).toBe("-3.5"); expect(buildArg(d("number", "1e3"))).toBe("1000"); expect(buildArg(d("number", ""))).toBe("");
    expect(buildArg(d("boolean", "true"))).toBe("true"); expect(buildArg(d("boolean", "false"))).toBe("false"); expect(buildArg(d("boolean", "qualquer"))).toBe("false");
  });
  it("referência e expressão: nome de dado (com .campo) ou expressão livre; inválidos são recusados", () => {
    expect(buildArg(d("ref", " cliente.nome "))).toBe("cliente.nome"); expect(buildArg(d("expr", " a + b "))).toBe("a + b"); expect(buildArg(d("ref", ""))).toBe("");
    fails(() => buildArg(d("number", "abc")), /is not a number/); fails(() => buildArg(d("ref", "a b")), /is not a data name/); fails(() => buildArg(d("ref", "1x")), /is not a data name/);
  });
  it("objeto: campos com tipo e value, aninhado; valida nomes e repetidos", () => {
    const o = d("object", "", [f("nome", d("text", "Ana")), f("idade", d("number", "30")), f("ativo", d("boolean", "true")), f("origem", d("ref", "pedido")), f("endereco", d("object", "", [f("rua", d("text", "A")), f("number", d("number", "7"))]))]);
    expect(buildArg(o)).toBe('{ nome: "Ana", idade: 30, ativo: true, origem: pedido, endereco: { rua: "A", number: 7 } }'); expect(buildArg(d("object"))).toBe("{}"); expect(buildArg(d("object", "", [f("x", d("text", ""))]))).toBe("{ x: undefined }");
    fails(() => buildArg(d("object", "", [f("1x", d("text", "a"))])), /Invalid field name/); fails(() => buildArg(d("object", "", [f("a", d("text", "1")), f("a", d("text", "2"))])), /Duplicate field/); fails(() => buildArg(d("object", "", [f("a", d("number", "x"))])), /is not a number/);
  });
  it("inferArg lê de volta cada tipo (reabrir a caixa mostra o que foi salvo)", () => {
    expect(inferArg('"Olá"')).toEqual(d("text", "Olá")); expect(inferArg("42")).toEqual(d("number", "42")); expect(inferArg("-1.5")).toEqual(d("number", "-1.5")); expect(inferArg("true")).toEqual(d("boolean", "true"));
    expect(inferArg("pedido")).toEqual(d("ref", "pedido")); expect(inferArg("cliente.nome")).toEqual(d("ref", "cliente.nome")); expect(inferArg("a + b")).toEqual(d("expr", "a + b")); expect(inferArg("`url/${x}`")).toEqual(d("expr", "`url/${x}`")); expect(inferArg("")).toEqual(d("text"));
  });
  it("ida e volta de objetos (inclusive aninhados e vazios) é exata", () => {
    const o = d("object", "", [f("nome", d("text", "Ana, \"a\"")), f("n", d("number", "1")), f("sub", d("object", "", [f("ok", d("boolean", "true")), f("ref", d("ref", "x.y"))])), f("vazio", d("object"))]);
    expect(inferArg(buildArg(o))).toEqual(o); expect(inferArg("{}")).toEqual(d("object")); expect(inferArg("{ x: undefined }")).toEqual(d("object", "", [f("x", d("text", ""))]));
  });
  it("objeto que não é do formato gerado vira expressão (nada se perde)", () => {
    for (const e of ["{ ...a, b: 1 }", "{ a: f(1, 2) }", "{ [k]: 1 }", "{ a: 1 } && x", "{ a: 1,, }"]) expect(inferArg(e).type === "expr" || inferArg(e).type === "object").toBe(true);
    expect(inferArg("{ ...a, b: 1 }")).toEqual(d("expr", "{ ...a, b: 1 }")); expect(inferArg("{ a: 1 } && x")).toEqual(d("expr", "{ a: 1 } && x"));
  });
});
