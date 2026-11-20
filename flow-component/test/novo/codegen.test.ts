import { execute } from "../../novo/runner";
import { describe, expect, it } from "vitest";
import { camel, generate } from "../../novo/codegen";
import { apply, DEFAULT_AGENTS, emptyProject, locate, type Command } from "../../novo/model";
import { browserDemoProject, sampleProject } from "../../novo/sample";

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
  it("camel: acentos, símbolos e números", () => { expect(camel("Receber pedido")).toBe("receberPedido"); expect(camel("onboarding")).toBe("onboarding"); expect(camel("1a função")).toBe("_1aFuncao"); expect(camel("???")).toBe("flow"); });
  it("sequência: função abstrata vem do state, saídas hoistadas e repassadas", () => {
    const { gen } = base(), { code, fileName } = gen();
    expect(fileName).toBe("atender-pedido.ts"); expect(code).toContain("export async function atenderPedido(state: State): Promise<void> {"); expect(code).toContain("type Fn = (state: State) => Promise<State>;");
    expect(code).toContain('const { receberPedido, separarItens, enviarPedido } = state as Record<"receberPedido" | "separarItens" | "enviarPedido", Fn>;'); expect(code).not.toMatch(/^  let pedido/m);   // declarados no uso, não no topo
    expect(code).toMatch(/const \{ pedido \} = await receberPedido\(\{ \.\.\.state \}\);/); expect(code).toMatch(/const \{ itens \} = await separarItens\(\{ \.\.\.state, pedido \}\);/);
    expect(code).not.toContain("return"); expect(code).not.toMatch(/async function receberPedido/);   // sem saída declarada no flow, não há return
    const { run: r3, root: root3, gen: g3 } = base(); r3({ type: "addOutput", id: root3, name: "itens" }); expect(g3().code).toContain("return { itens };"); expect(g3().code).toContain("Promise<State> {");
  });
  it("entradas que ninguém produz viram 'expected inputs'", () => {
    const { gen, run, root } = base(); run({ type: "addInput", id: root, name: "x" });
    expect(gen().code).not.toMatch(/\/\/|\/\*/); expect(gen().code).toContain("const { x } = state as Record<string, any>;");   // entrada definida no flow aparece no código, lida do state
    const { run: r2, e, gen: g2 } = base(); r2({ type: "addInput", id: e, name: "externo" }); expect(g2().code).toContain("const { externo } = state as Record<string, any>;"); expect(g2().code).toMatch(/\(\{ \.\.\.state, [^}]*externo/);
  });
  it("responsáveis: lib do navegador vem do state como wrapper (sem import); pessoa vira humans.ask; IA continua abstrata", () => {
    const { run, r, s, e, gen } = base(); run({ type: "assign", id: r, agent: "math" }); run({ type: "assign", id: s, agent: "ana" }); run({ type: "assign", id: e, agent: "lia" });
    const { code } = gen(); expect(code).not.toContain("import "); expect(code).toContain("type Humans = {"); expect(code).toContain("const { humans } = state as { humans: Humans };"); expect(code).not.toContain("@flow/runtime");
    expect(code).toContain('const { random, enviarPedido } = state as Record<"random" | "enviarPedido", Fn>;'); expect(code).toContain("await random({ ...state })"); expect(code).not.toContain("call(");
    expect(code).toContain("export const wrappers: Record<string, Fn> = {"); expect(code).toContain("return { number: await Math.random() };"); expect(code).toContain('humans.ask("Ana Souza", "Separar itens"');
  });
  it("lib que é módulo (nome com : / @) vira import; lib global do navegador não", () => {
    const { run, r, gen } = base(); run({ type: "addAgent", kind: "maquina", name: "node:zlib", tasks: "gzip(data) -> comprimido" }); const id = run({ type: "addAgent", kind: "maquina", name: "@x/util", tasks: "dobrar(n) -> dobro" });
    run({ type: "assign", id: r, agent: id }); const { code } = gen(); expect(code).toContain('import * as _x_util from "@x/util";'); expect(code).toContain("return { dobro: await _x_util.dobrar(n as never) };");
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
  it("if protege a chamada; com else gera `} else { … }` com as funções do else", () => {
    const { run, s, e, gen } = base(); const i = run({ type: "wrap", id: s, kind: "if", test: "estoque_ok" });
    expect(gen().code).toContain("if (estoque_ok) {"); expect(gen().code).not.toContain("else");
    const x = run({ type: "addElse", id: i, title: "Avisar falta" }); run({ type: "addChild", id: i, else: true, title: "Repor estoque" }); void e;
    const { code } = gen(), l = code.split("\n"), a = at(l, /if \(estoque_ok\) \{/), el = at(l, /\} else \{/, a), r = at(l, /reporEstoque\(/, el), v = at(l, /avisarFalta\(/, el);
    expect(el).toBeGreaterThan(a); expect(r).toBeGreaterThan(el); expect(v).toBeGreaterThan(r);         // Repor estoque (primeira posição) vem antes de Avisar falta
    expect(at(l, /separarItens\(/, a)).toBeLessThan(el); expect(gen().map[x]![0]).toBeGreaterThan(el);
  });
  it("if sem senão não gera else; if → for → if aninham os blocos", () => {
    const { run, s, gen } = base(); const a = run({ type: "wrap", id: s, kind: "if", test: "c1" }); run({ type: "wrap", id: s, kind: "for", v: "i", coll: "xs" }); run({ type: "wrap", id: s, kind: "if", test: "c2" });
    const l = gen().code.split("\n"), i1 = at(l, /if \(c1\)/), f1 = at(l, /for \(const i of xs\)/, i1), i2 = at(l, /if \(c2\)/, f1), call = at(l, /separarItens\(/, i2);
    expect(i1).toBeGreaterThan(-1); expect(f1).toBeGreaterThan(i1); expect(i2).toBeGreaterThan(f1); expect(call).toBeGreaterThan(i2); expect(gen().code).not.toContain("else"); void a;
  });
  it("try/catch: o tratamento roda no catch com o erro, e nunca na sequência", () => {
    const { run, s, gen } = base(); run({ type: "wrap", id: s, kind: "try" });
    const { code } = gen(); expect(code).toContain("try {"); expect(code).toMatch(/\} catch \(error\) \{\n\s+\(?.*handleError\(\{ \.\.\.state, error \}\)/); expect(code).toContain("  return;\n  }");
    const body = code.slice(code.indexOf("try {"), code.indexOf("} catch")); expect(body).toContain("separarItens("); expect(body).not.toContain("handleError(");
  });
  it("paralelo vira Promise.all e distribui as saídas", () => {
    const { run, s, e, gen } = base(); run({ type: "setParallel", id: e, on: true }); void s;
    const { code } = gen(); expect(code).toContain("await Promise.all(["); expect(code).toMatch(/\(\{ itens \} = par\d+\[0\] as State\);/); expect(code).toContain("separarItens({ ...state, pedido }),");
  });
  it("nomes repetidos ganham sufixo; fluxo de um elemento só chama a si mesmo", () => {
    const { run, root, gen } = base(); run({ type: "addChild", id: root, title: "Receber pedido" }); expect(gen().code).toContain("receberPedido2");
    const p2 = apply(emptyProject("X"), { type: "newFlow", title: "main" }); const g = generate(p2.project, p2.created!); expect(g.fileName).toBe("main.ts"); expect(g.code).toContain("export async function main(state: State)"); expect(g.code).not.toContain("return");
  });
  it("o mapa de linhas aponta a função, o bloco e a raiz", () => {
    const { run, s, root, gen } = base(); const f = run({ type: "wrap", id: s, kind: "for" }); const g = gen(), l = g.code.split("\n");
    const [a, b] = g.map[s]!; expect(l[a! - 1]).toContain("separarItens"); const [fa, fb] = g.map[f]!; expect(l[fa! - 1]).toContain("for (const"); expect(l[fb! - 1]!.trim()).toBe("}");
    expect(g.map[root]![0]).toBeLessThan(g.map[root]![1]); expect(b).toBe(a);
  });
  it("fluxo inexistente falha", () => { expect(() => generate(emptyProject("x"), "nope")).toThrow(); });
});

describe("projeto de partida", () => {
  it("projeto inicial: Hello World — só main, com um passo console.log(\"Hello World\"); gera código e roda", async () => {
    const s = sampleProject(); expect(s.project.flows.map(f => f.title)).toEqual(["main"]); const [step] = s.project.flows[0]!.kids; expect(s.project.flows[0]!.kids).toHaveLength(1);
    expect(step).toMatchObject({ t: "fn", title: "log", agent: "console", args: { text: '"Hello World"' } });
    expect(generate(s.project, s.main).code).toContain("export async function main"); expect(generate(s.project, s.main).code).toContain('const text: string = "Hello World";');
    const out: string[] = []; await execute(generate(s.project, s.main, { js: true }).code, e => { if (e.type === "log") out.push(e.text); }); expect(out).toEqual(["Hello World"]);
  });
  it("demo de browser (main + example) gera if e crypto sem import", () => {
    const s = browserDemoProject(); expect(s.project.flows.map(f => f.title)).toEqual(["main", "example"]);
    const code = generate(s.project, s.example).code; expect(code).not.toMatch(/^import /m); expect(code).toContain("if (score >= threshold) {"); expect(code).toContain("await crypto.randomUUID()");
    expect(generate(s.project, s.example, { runnable: true }).code).toContain("const result = await example(");
  });
});

/** Fluxo "main": Montar mensagem (abstrata, produz `mensagem`) → log (node:console, text = mensagem) → Aprovar (pessoa). */
function demo() {
  let q = emptyProject("T"); q.agents = structuredClone([...DEFAULT_AGENTS]); const go = (c: Command): string => { const x = apply(q, c); q = x.project; return x.created ?? ""; };
  const m = go({ type: "newFlow", title: "main" }), a = go({ type: "addChild", id: m, title: "Montar mensagem" }); go({ type: "addOutput", id: a, name: "mensagem" });
  const b = go({ type: "addChild", id: m, title: "x" }); go({ type: "assign", id: b, agent: "console" }); go({ type: "setArg", id: b, name: "text", value: "mensagem" });
  const c = go({ type: "addChild", id: m, title: "Aprovar" }); go({ type: "assign", id: c, agent: "ana" });
  return { get q() { return q; }, m, a, b, c, go };
}
describe("funções de lib: contrato, wrapper e código", () => {
  it("só libs do navegador no catálogo, cada função com contrato (entradas e saídas)", () => {
    const names = DEFAULT_AGENTS.filter(a => a.kind === "maquina").map(a => a.name); expect(names).toEqual(["console", "Math", "JSON", "Date", "crypto", "performance", "globalThis"]); expect(names.some(n => /node:/.test(n))).toBe(false);
    const con = DEFAULT_AGENTS.find(a => a.name === "console")!; expect(con.contracts!["log"]).toEqual({ ins: ["text"], outs: [] }); expect(DEFAULT_AGENTS.find(a => a.name === "Math")!.contracts!["max"]).toEqual({ ins: ["a", "b"], outs: ["result"] });
    for (const a of DEFAULT_AGENTS.filter(x => x.kind === "maquina")) for (const t of a.tasks) expect(a.contracts![t], `${a.name}.${t}`).toBeTruthy();
  });
  it("escolher console.log traz a entrada abstrata `text`; o wrapper converte do formato do flow para o da lib", () => {
    const d = demo(); const f = locate(d.q, d.b)!.node as { title: string; ins: string[]; outs: string[] }; expect(f).toMatchObject({ title: "log", ins: ["text"], outs: [] });
    const code = generate(d.q, d.m).code;
    expect(code).toContain('const { montarMensagem, log } = state as Record<"montarMensagem" | "log", Fn>;'); expect(code).toContain("await log({ ...state, text: mensagem });"); expect(code).not.toContain("call("); expect(code).not.toContain("import ");
    expect(code).toContain("  log: async (state: State): Promise<State> => {\n    const { text } = state;\n    await console.log(text as never);\n    return {};\n  },");   // o console não recebe objeto: recebe o text
  });
  it("entrada ainda abstrata (não preenchida) fica como esperada do state", () => {
    const t = base(); t.run({ type: "assign", id: t.s, agent: "console" }); const code = t.gen().code;
    expect(code).not.toMatch(/\/\//); expect(code).toMatch(/const \{[^}]*\btext\b[^}]*\} = state as Record<string, any>;/); expect(code).toContain("await log({ ...state, text });");
  });
  it("saídas do contrato: um dado vira { saida: value }; renomear o dado liga a próxima função; vários argumentos na ordem do contrato", () => {
    const t = base(); t.run({ type: "assign", id: t.s, agent: "math" }); t.run({ type: "setTask", id: t.s, task: "max" }); t.run({ type: "setArg", id: t.s, name: "a", value: "1" }); t.run({ type: "setArg", id: t.s, name: "b", value: "pedido" }); t.run({ type: "renameData", id: t.s, to: "maior" });
    const code = t.gen().code; expect(code).toContain("  const a: number = 1;\n  const { maior } = await max({ ...state, a, b: pedido });"); expect(code).toContain("return { maior: await Math.max(a as never, b as never) };");
  });
  it("executável (Node): wrappers e simuladores passados no state, pessoa simulada, chamada no fim e comando", () => {
    const d = demo(), g = generate(d.q, d.m, { runnable: true });
    expect(g.runFile).toBe("main.mts"); expect(g.runCommand).toBe("node --experimental-strip-types main.mts"); expect(g.code).not.toContain("import "); expect(g.code).not.toContain("@flow/runtime"); expect(g.code).toContain("humans: { ask: async (who: string, what: string) =>");
    expect(g.code).toContain('montarMensagem: async () => ({ mensagem: "mensagem (simulated)" })'); expect(g.code).toContain('humans.ask("Ana Souza", "Aprovar", { ...state })');
    expect(g.code).toMatch(/await main\(\{\n  \.\.\.wrappers,\n[\s\S]*\n\}\);\n$/); expect(g.code).not.toContain("function data(state: State)"); expect(g.code).not.toContain("const stubs");
  });
  it("sem abstratas nem pessoas não há stubs nem data(); expected inputs ganham value simulado", () => {
    let q = emptyProject("T"); q.agents = structuredClone([...DEFAULT_AGENTS]); const go = (c: Command): string => { const x = apply(q, c); q = x.project; return x.created ?? ""; };
    const m = go({ type: "newFlow", title: "solo" }), a = go({ type: "addChild", id: m, title: "x" }); go({ type: "assign", id: a, agent: "console" });
    const g = generate(q, m, { runnable: true }); expect(g.code).not.toContain("const stubs"); expect(g.code).not.toContain("function data"); expect(g.code).toContain('await solo({ ...wrappers, text: "text (simulated)" });');
  });
  it("o módulo exporta a função e os wrappers, sem rodar nada", () => {
    const d = demo(), g = generate(d.q, d.m); expect(g.code).toContain("export async function main"); expect(g.code).toContain("export const wrappers"); expect(g.code).not.toContain("const result = await"); expect(g.code).not.toMatch(/\/\/|\/\*/);
    expect(g.runFile).toBe("main.mts");
    const { gen } = base(); expect(gen().code).not.toContain("export const wrappers"); expect(gen().runCommand).toBe("node --experimental-strip-types atender-pedido.mts");
  });
});

describe("valor preenchido em função abstrata", () => {
  it("o valor vai pelo nome da entrada na chamada e deixa de ser esperado do state", () => {
    const { run, s, gen } = base(); run({ type: "addInput", id: s, name: "preco" }); expect(gen().code).not.toMatch(/\/\/|\/\*/);
    run({ type: "setArg", id: s, name: "preco", value: "10" }); const { code } = gen(); expect(code).toContain("const preco: number = 10;"); expect(code).toContain("separarItens({ ...state, pedido, preco })"); expect(code).not.toContain("expected inputs (from another layer): preco");
    run({ type: "setArg", id: s, name: "preco", value: '{ moeda: "BRL", valor: pedido }' }); expect(gen().code).toContain('const preco: Record<string, unknown> = { moeda: "BRL", valor: pedido };');
  });
});

describe("nomes de funções e de dados nunca colidem", () => {
  it("dado com o nome de uma função (ex.: saída `now` de Date.now e performance.now) renomeia a função, não o dado", () => {
    let q = emptyProject("T"); q.agents = structuredClone([...DEFAULT_AGENTS]); const go = (c: Command): string => { const x = apply(q, c); q = x.project; return x.created ?? ""; };
    const m = go({ type: "newFlow", title: "clash" }), a = go({ type: "addChild", id: m, title: "a" }), b = go({ type: "addChild", id: m, title: "b" });
    go({ type: "assign", id: a, agent: "date" }); go({ type: "setTask", id: a, task: "now" }); go({ type: "renameData", id: a, to: "now" }); go({ type: "assign", id: b, agent: "perf" }); go({ type: "setTask", id: b, task: "now" }); go({ type: "renameData", id: b, to: "elapsed" });
    const code = generate(q, m).code; expect(code).toContain("const { now } = await nowFn({ ...state });"); expect(code).toContain("const { nowFn, nowFn2 } = state as");  expect(code).toContain("nowFn2: async (state: State)");
  });
  it("palavras reservadas do JavaScript não servem de nome de dado, de campo ou de variável", () => {
    let q = emptyProject("T"); const go = (c: Command): string => { const x = apply(q, c); q = x.project; return x.created ?? ""; };
    const m = go({ type: "newFlow", title: "r" }), f = go({ type: "addChild", id: m, title: "f" });
    for (const w of ["class", "delete", "return", "new", "true", "await"]) { expect(() => apply(q, { type: "addInput", id: f, name: w })).toThrow(/reserved word/); expect(() => apply(q, { type: "addOutput", id: f, name: w })).toThrow(/reserved word/); }
    expect(() => apply(q, { type: "wrap", id: f, kind: "for", v: "class", coll: "xs" })).toThrow(/reserved word/); go({ type: "addInput", id: f, name: "classe" });
  });
});

describe("dados citados em argumentos", () => {
  it("chaves de objeto não viram dados lidos do state; opcionais não aparecem como esperados", () => {
    const d = demo(); const f = d.go({ type: "addChild", id: d.m, title: "f" }); d.go({ type: "assign", id: f, agent: "web" }); d.go({ type: "setArg", id: f, name: "url", value: '"https://x.dev"' });
    d.go({ type: "setArg", id: f, name: "options", value: '{ method: "POST", body: payload }' }); const code = generate(d.q, d.m).code;
    expect(code).toContain("const { payload } = state as Record<string, any>;"); expect(code).not.toMatch(/const \{[^}]*\bmethod\b[^}]*\} = state/); expect(code).not.toContain("expected inputs (from another layer): options");
    const g = d.go({ type: "addChild", id: d.m, title: "g" }); d.go({ type: "assign", id: g, agent: "web" }); d.go({ type: "setArg", id: g, name: "url", value: '"https://y.dev"' }); expect(generate(d.q, d.m).code).not.toMatch(/expected inputs[^\n]*options/);
  });
});

describe("JavaScript para rodar no navegador (sem tipos)", () => {
  const AsyncFunction = Object.getPrototypeOf(async function () { /* construtor */ }).constructor as new (...a: string[]) => unknown;
  it("sem anotações de tipo, casts, export nem import; compila como corpo de função assíncrona", () => {
    const d = demo(), g = generate(d.q, d.m, { js: true });
    for (const bad of [": State", ": Promise<State>", " as ", "type State", "type Fn", "type Humans", "export ", "import ", ": unknown", ": any", "Record<"]) expect(g.code, bad).not.toContain(bad);
    expect(g.code).toContain("async function main(state) {"); expect(g.code).toContain("const { montarMensagem, log } = state;"); expect(g.code).toContain("const wrappers = {"); expect(g.code).toContain("humans: { ask: async (who, what) =>");
    expect(g.code).not.toMatch(/\/\/|\/\*/); expect(g.code).toMatch(/await main\(\{\n  \.\.\.wrappers,/); expect(() => new AsyncFunction("console", g.code)).not.toThrow();
  });
  it("todos os recursos geram JS válido: for, if/else, try/catch, paralelo, libs, pessoas, objetos", () => {
    const d = demo(); const f = d.go({ type: "wrap", id: d.b, kind: "for", v: "i", coll: "[1, 2]" }); const i = d.go({ type: "wrap", id: f, kind: "if", test: "true" }); d.go({ type: "addElse", id: i }); d.go({ type: "wrap", id: d.c, kind: "try" });
    const m2 = d.go({ type: "addChild", id: d.m, title: "p1" }), m3 = d.go({ type: "addChild", id: d.m, title: "p2" }); d.go({ type: "assign", id: m2, agent: "math" }); d.go({ type: "assign", id: m3, agent: "date" }); d.go({ type: "setParallel", id: m3, on: true });
    const g = generate(d.q, d.m, { js: true }); expect(() => new AsyncFunction("console", g.code), g.code).not.toThrow(); expect(g.code).toContain("Promise.all"); expect(g.code).not.toMatch(/ as (State|never)/);
  });
  it("não existe sem o modo executável: js liga o executável sozinho", () => { const d = demo(); expect(generate(d.q, d.m, { js: true }).code).toMatch(/await main\(/); });
});
