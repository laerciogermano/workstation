// O TypeScript gerado precisa compilar SEM erro (módulo e executável), em todos os fluxos de exemplo e nos casos de borda.
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { generate } from "../../novo/codegen";
import { apply, DEFAULT_AGENTS, emptyProject } from "../../novo/model";
import { sampleProject } from "../../novo/sample";

const options = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noUncheckedIndexedAccess: true, noEmit: true, skipLibCheck: true, lib: ["lib.es2022.d.ts", "lib.dom.d.ts"], types: [] };
/** Tipos do Node não vêm no projeto: os módulos "node:*" entram como `any` (o que se confere é o código gerado). */
function check(code, name = "fluxo.mts") {
  const files = new Map([[name, code], ["ambient.d.ts", 'declare module "node:*";']]), host = ts.createCompilerHost(options);
  const base = { getSourceFile: host.getSourceFile.bind(host), fileExists: host.fileExists.bind(host), readFile: host.readFile.bind(host) };
  host.getSourceFile = (f, l, ...r) => (files.has(f) ? ts.createSourceFile(f, files.get(f), l, true) : base.getSourceFile(f, l, ...r));
  host.fileExists = f => files.has(f) || base.fileExists(f); host.readFile = f => (files.has(f) ? files.get(f) : base.readFile(f));
  const program = ts.createProgram([name, "ambient.d.ts"], options, host);
  return ts.getPreEmitDiagnostics(program).filter(d => d.file?.fileName === name).map(d => `${d.file.getLineAndCharacterOfPosition(d.start).line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
}
const project = () => { let q = emptyProject("T"); q.agents = structuredClone([...DEFAULT_AGENTS]); const go = c => { const x = apply(q, c); q = x.project; return x.created ?? ""; }; return { go, get q() { return q; } }; };

describe("o código gerado compila sem erros de TypeScript", () => {
  for (const runnable of [false, true]) {
    it(`main do projeto padrão (${runnable ? "executável" : "módulo"})`, () => {
      const s = sampleProject();
      for (const f of s.project.flows) { const g = generate(s.project, f.id, { runnable }); expect(check(g.code, g.runFile), g.code).toEqual([]); }
    });
  }
  it("todas as funções de todas as libs do catálogo (wrappers com argumentos do contrato) compilam", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "libs" });
    for (const ag of DEFAULT_AGENTS.filter(x => x.kind === "maquina")) for (const task of ag.tasks) { const f = d.go({ type: "addChild", id: m, title: "f" }); d.go({ type: "assign", id: f, agent: ag.id }); d.go({ type: "setTask", id: f, task }); }
    for (const runnable of [false, true]) { const g = generate(d.q, m, { runnable }); expect(g.code).toContain("export const wrappers"); expect(check(g.code, g.runFile), g.code).toEqual([]); }
  });
  it("lib com entradas preenchidas (valor fixo, dado produzido antes, expressão, objeto) e saída renomeada", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "linked" }), a = d.go({ type: "addChild", id: m, title: "Parse" }); d.go({ type: "assign", id: a, agent: "json" }); d.go({ type: "setTask", id: a, task: "parse" });
    d.go({ type: "setArg", id: a, name: "text", value: '"{\\"n\\": 1}"' }); d.go({ type: "renameData", id: a, to: "parsed" });
    const b = d.go({ type: "addChild", id: m, title: "Show" }); d.go({ type: "assign", id: b, agent: "console" }); d.go({ type: "setArg", id: b, name: "text", value: "parsed" });
    const c = d.go({ type: "addChild", id: m, title: "Table" }); d.go({ type: "assign", id: c, agent: "console" }); d.go({ type: "setTask", id: c, task: "table" }); d.go({ type: "setArg", id: c, name: "data", value: "{ parsed, size: String(parsed).length }" });
    for (const runnable of [false, true]) { const g = generate(d.q, m, { runnable }); expect(g.code).toContain("await parse({ ...state, text })"); expect(check(g.code, g.runFile), g.code).toEqual([]); }
  });
  it("condições e repetições citando data de fora, de dentro e da própria repetição", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "exprs" });
    const a = d.go({ type: "addChild", id: m, title: "Ler" }); d.go({ type: "addOutput", id: a, name: "pedidos" });
    const b = d.go({ type: "addChild", id: m, title: "Tratar" }); const f = d.go({ type: "wrap", id: b, kind: "for", v: "pedido", coll: "pedidos" });
    const c = d.go({ type: "addChild", id: m, title: "Depois" }); const i = d.go({ type: "wrap", id: c, kind: "if", test: "pedidos.length > 0 && modo === 'x' && !desligado" }); d.go({ type: "addElse", id: i });
    const e = d.go({ type: "addChild", id: f, title: "Dentro" }); const j = d.go({ type: "wrap", id: e, kind: "if", test: "pedido.ok && configuracao.ativa" }); void j;
    const g = generate(d.q, m); const read = g.code.match(/const \{ ([^}]+) \} = state as Record<string, any>;/)[1].split(", ").sort(); expect(read).toEqual(["configuracao", "desligado", "modo"]);   // só o que vem de fora: pedido (da repetição) e pedidos (produzido) ficam de fora expect(g.code).toContain("let pedidos: any;"); expect(check(g.code, g.runFile), g.code).toEqual([]);
  });
  it("try/catch, pessoas, paralelo, else e for aninhado", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "tudo" }), kid = t => d.go({ type: "addChild", id: m, title: t });
    const a = kid("A"), b = kid("B"), c = kid("C"), e = kid("E"); d.go({ type: "assign", id: c, agent: "ana" }); d.go({ type: "addOutput", id: a, name: "x" }); d.go({ type: "addInput", id: b, name: "x" }); d.go({ type: "setParallel", id: b, on: true });
    d.go({ type: "wrap", id: c, kind: "try" }); const i = d.go({ type: "wrap", id: e, kind: "if", test: "x" }); d.go({ type: "addElse", id: i }); d.go({ type: "wrap", id: a, kind: "for", v: "n", coll: "[1, 2]" });
    for (const runnable of [false, true]) { const g = generate(d.q, m, { runnable }); expect(check(g.code, g.runFile), g.code).toEqual([]); }
  });
  it("o verificador de fato acusa erro (garantia de que o teste não é vazio)", () => { expect(check("const x: number = 'a'; export {};").length).toBeGreaterThan(0); });
});
