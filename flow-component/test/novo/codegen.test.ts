import { describe, expect, it } from "vitest";
import { camel, generate } from "../../novo/codegen";
import { apply, DEFAULT_AGENTS, emptyProject, type Command } from "../../novo/model";
import { sampleProject } from "../../novo/sample";

function base() {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "Atender pedido" });
  const [r, s, e] = ["Receber pedido", "Separar itens", "Enviar pedido"].map(t => run({ type: "addChild", id: root, title: t })) as [string, string, string];
  run({ type: "addOutput", id: r, name: "pedido" }); run({ type: "addInput", id: s, name: "pedido" }); run({ type: "addOutput", id: s, name: "itens" }); run({ type: "addInput", id: e, name: "itens" });
  return { run, root, r, s, e, gen: () => generate(p, root) };
}
const at = (lines: string[], re: RegExp, from = 0): number => lines.findIndex((l, i) => i >= from && re.test(l));

describe("transpilador Flow → TypeScript", () => {
  it("camel: acentos, símbolos e números", () => { expect(camel("Receber pedido")).toBe("receberPedido"); expect(camel("fazer_onboarding")).toBe("fazerOnboarding"); expect(camel("1a função")).toBe("_1aFuncao"); expect(camel("???")).toBe("fluxo"); });
  it("sequência: função abstrata vem do state, saídas hoistadas e repassadas", () => {
    const { gen } = base(), { code, fileName } = gen();
    expect(fileName).toBe("atender-pedido.ts"); expect(code).toContain("export async function atenderPedido(state: State): Promise<State> {"); expect(code).toContain("type Fn = (state: State) => Promise<State>;");
    expect(code).toMatch(/const \{ receberPedido, separarItens, enviarPedido \} = state as Record<string, Fn>;/); expect(code).toContain("let pedido: unknown, itens: unknown;");
    expect(code).toMatch(/\(\{ pedido \} = await receberPedido\(\{ \.\.\.state \}\)\);/); expect(code).toMatch(/\(\{ itens \} = await separarItens\(\{ \.\.\.state, pedido \}\)\);/);
    expect(code).toContain("return { pedido, itens };"); expect(code).not.toMatch(/async function receberPedido/);
  });
  it("entradas que ninguém produz viram 'entradas esperadas'", () => {
    const { gen, run, root } = base(); run({ type: "addInput", id: root, name: "x" });
    expect(gen().code).not.toContain("entradas esperadas"); const { run: r2, e, gen: g2 } = base(); r2({ type: "addInput", id: e, name: "externo" }); expect(g2().code).toContain("entradas esperadas (de outra camada): externo");
  });
  it("responsáveis: lib vira import e chamada; pessoa vira humans.ask; IA continua abstrata", () => {
    const { run, r, s, e, gen } = base(); run({ type: "assign", id: r, agent: "fs" }); run({ type: "assign", id: s, agent: "ana" }); run({ type: "assign", id: e, agent: "lia" });
    const { code } = gen(); expect(code).toContain('import * as node_fs from "node:fs";'); expect(code).toContain('import { humans } from "@flow/runtime";');
    expect(code).toMatch(/node_fs\.readFile\(\{ \.\.\.state \}\)/); expect(code).toContain('humans.ask("Ana Souza", "Separar itens"'); expect(code).toMatch(/const \{ enviarPedido \} = state as Record<string, Fn>;/);
  });
  it("for vira laço e a variável chega às chamadas de dentro", () => {
    const { run, s, gen } = base(); run({ type: "wrap", id: s, kind: "for", v: "item", coll: "pedidos" });
    const { code } = gen(), l = code.split("\n"), f = at(l, /for \(const item of pedidos\) \{/), c = at(l, /separarItens\(/), end = at(l, /^  \}$/, f);
    expect(f).toBeGreaterThan(-1); expect(c).toBeGreaterThan(f); expect(c).toBeLessThan(end); expect(code).toMatch(/separarItens\(\{ \.\.\.state, item, pedido \}\)/);
  });
  it("irmão criado dentro do for roda dentro do mesmo for (uma só vez)", () => {
    const { run, s, gen } = base(); run({ type: "wrap", id: s, kind: "for", v: "item", coll: "pedidos" }); run({ type: "addSibling", id: s, title: "Embalar item" });
    const { code } = gen(), l = code.split("\n"), f = at(l, /for \(const item/), x = at(l, /embalarItem\(/), end = at(l, /^  \}$/, f);
    expect(x).toBeGreaterThan(f); expect(x).toBeLessThan(end); expect(code.match(/for \(const item/g)).toHaveLength(1);
  });
  it("if protege a chamada; senão volta para a função escolhida", () => {
    const { run, r, s, gen } = base(); const i = run({ type: "wrap", id: s, kind: "if", test: "estoque_ok" }); run({ type: "setIf", id: i, test: "estoque_ok", elseTo: r });
    const { code } = gen(); expect(code).toContain("if (estoque_ok) {"); expect(code).toMatch(/\} else \{\n\s+return receberPedido\(.*\/\/ senão → Receber pedido/);
  });
  it("if sem senão não gera else; if → for → if aninham os blocos", () => {
    const { run, s, gen } = base(); const a = run({ type: "wrap", id: s, kind: "if", test: "c1" }); run({ type: "wrap", id: s, kind: "for", v: "i", coll: "xs" }); run({ type: "wrap", id: s, kind: "if", test: "c2" });
    const l = gen().code.split("\n"), i1 = at(l, /if \(c1\)/), f1 = at(l, /for \(const i of xs\)/, i1), i2 = at(l, /if \(c2\)/, f1), call = at(l, /separarItens\(/, i2);
    expect(i1).toBeGreaterThan(-1); expect(f1).toBeGreaterThan(i1); expect(i2).toBeGreaterThan(f1); expect(call).toBeGreaterThan(i2); expect(gen().code).not.toContain("else"); void a;
  });
  it("try/catch: o tratamento roda no catch com o erro, e nunca na sequência", () => {
    const { run, s, gen } = base(); run({ type: "wrap", id: s, kind: "try" });
    const { code } = gen(); expect(code).toContain("try {"); expect(code).toMatch(/\} catch \(error\) \{\n\s+\(?.*tratarErro\(\{ \.\.\.state, error \}\)/); expect(code).toContain("return { ...state, error };");
    const body = code.slice(code.indexOf("try {"), code.indexOf("} catch")); expect(body).toContain("separarItens("); expect(body).not.toContain("tratarErro(");
  });
  it("paralelo vira Promise.all e distribui as saídas", () => {
    const { run, s, e, gen } = base(); run({ type: "setParallel", id: e, on: true }); void s;
    const { code } = gen(); expect(code).toContain("await Promise.all([  // paralelo"); expect(code).toMatch(/\(\{ itens \} = par\d+\[0\] as State\);/); expect(code).toContain("separarItens({ ...state, pedido }),");
  });
  it("nomes repetidos ganham sufixo; fluxo de um elemento só chama a si mesmo", () => {
    const { run, root, gen } = base(); run({ type: "addChild", id: root, title: "Receber pedido" }); expect(gen().code).toContain("receberPedido2");
    const p2 = apply(emptyProject("X"), { type: "newFlow", title: "main" }); const g = generate(p2.project, p2.created!); expect(g.fileName).toBe("main.ts"); expect(g.code).toContain("export async function main(state: State)"); expect(g.code).toContain("return state;");
  });
  it("o mapa de linhas aponta a função, o bloco e a raiz", () => {
    const { run, s, root, gen } = base(); const f = run({ type: "wrap", id: s, kind: "for" }); const g = gen(), l = g.code.split("\n");
    const [a, b] = g.map[s]!; expect(l[a! - 1]).toContain("separarItens"); const [fa, fb] = g.map[f]!; expect(l[fa! - 1]).toContain("for (const"); expect(l[fb! - 1]!.trim()).toBe("}");
    expect(g.map[root]![0]).toBeLessThan(g.map[root]![1]); expect(b).toBe(a);
  });
  it("fluxo inexistente falha", () => { expect(() => generate(emptyProject("x"), "nope")).toThrow(); });
});

describe("projeto de partida", () => {
  it("tem dois fluxos: main (só a raiz) e fazer_onboarding; gera código sem erro nos dois", () => {
    const s = sampleProject(); expect(s.project.flows.map(f => f.title)).toEqual(["main", "fazer_onboarding"]); expect(s.project.flows[0]!.kids).toHaveLength(0);
    for (const f of s.project.flows) { const g = generate(s.project, f.id); expect(g.code).toContain("export async function"); }
    const code = generate(s.project, s.onboarding).code; expect(code).toContain('import * as node_http from "node:http";'); expect(code).toContain("Promise.all"); expect(code).toContain("if (proposta_aprovada) {"); expect(code).toContain('for (const idioma of ["en", "es"])');
    expect(code).toContain("// senão → redigir_proposta");
  });
});
