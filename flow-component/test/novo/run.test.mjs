// Exporta o código gerado e RODA de verdade no Node (precisa de Node >= 22.6 para tirar os tipos).
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generate } from "../../novo/codegen";
import { apply, DEFAULT_AGENTS, emptyProject } from "../../novo/model";
import { sampleProject } from "../../novo/sample";

const [maj = 0, min = 0] = process.versions.node.split(".").map(Number);
const nodeOk = maj > 22 || (maj === 22 && min >= 6);
const exec = g => {
  const dir = mkdtempSync(join(tmpdir(), "flow-run-")); writeFileSync(join(dir, g.runFile), g.code);
  const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", g.runFile], { cwd: dir, encoding: "utf8", timeout: 20000 });
  return { out: r.stdout, err: r.stderr, status: r.status };
};
const project = () => { let q = emptyProject("T"); q.agents = structuredClone([...DEFAULT_AGENTS]); const go = c => { const x = apply(q, c); q = x.project; return x.created ?? ""; }; return { go, get q() { return q; } }; };

describe.skipIf(!nodeOk)("exportar o código e rodar no Node", () => {
  it("console.log de verdade: o wrapper recebe o text do flow e chama console.log(text)", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "main" }), a = d.go({ type: "addChild", id: m, title: "Montar mensagem" }); d.go({ type: "addOutput", id: a, name: "mensagem" });
    const b = d.go({ type: "addChild", id: m, title: "x" }); d.go({ type: "assign", id: b, agent: "console" }); d.go({ type: "setArg", id: b, name: "text", value: "mensagem" });
    const c = d.go({ type: "addChild", id: m, title: "y" }); d.go({ type: "assign", id: c, agent: "console" }); d.go({ type: "setArg", id: c, name: "text", value: '"Olá, mundo"' });
    const res = exec(generate(d.q, m, { runnable: true })); expect(res.status, res.err).toBe(0);
    expect(res.out).toContain("[abstract] montarMensagem"); expect(res.out).toContain("mensagem (simulated)\n"); expect(res.out).toContain("Olá, mundo\n"); expect(res.out).toContain("result: { mensagem: 'mensagem (simulated)' }"); expect(res.out).not.toContain("AsyncFunction");
  });
  it("libs do navegador com contrato (Math, JSON, Date, crypto, performance) devolvem o dado no formato do flow e o código seguinte usa o nome dele", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "libs" }), mk = (agent, task, args = {}, rename) => { const f = d.go({ type: "addChild", id: m, title: "f" }); d.go({ type: "assign", id: f, agent }); d.go({ type: "setTask", id: f, task }); for (const [k, v] of Object.entries(args)) d.go({ type: "setArg", id: f, name: k, value: v }); if (rename) d.go({ type: "renameData", id: f, to: rename }); return f; };
    mk("math", "max", { a: "3", b: "9" }, "biggest"); mk("math", "pow", { base: "biggest", exponent: "2" }, "square"); mk("json", "stringify", { value: "{ n: square }" }, "as_text"); mk("crypto", "randomUUID", {}, "id"); mk("date", "now", {}, "now"); mk("perf", "now", {}, "ms");
    mk("console", "log", { text: "as_text" }); const g = generate(d.q, m, { runnable: true }), res = exec(g);
    expect(res.status, res.err + g.code).toBe(0); expect(res.out).toContain('{"n":81}\n'); expect(res.out).toMatch(/biggest: 9[^}]*square: 81/s); expect(res.out).toMatch(/id: '[0-9a-f-]{36}'/);
  });
  it("exemplo completo (if/else, for, paralelo, try/catch, libs e pessoas) exporta e roda sem erro", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "completo" }), kid = t => d.go({ type: "addChild", id: m, title: t });
    const a = kid("Preparar"), b = kid("Logar"), c = kid("Aprovar"), e = kid("Salvar"); d.go({ type: "addOutput", id: a, name: "itens" });
    d.go({ type: "assign", id: b, agent: "console" }); d.go({ type: "setArg", id: b, name: "text", value: "itens" }); d.go({ type: "assign", id: c, agent: "ana" }); d.go({ type: "assign", id: e, agent: "console" }); d.go({ type: "setTask", id: e, task: "table" }); d.go({ type: "setArg", id: e, name: "data", value: "[1, 2]" });
    d.go({ type: "wrap", id: b, kind: "for", v: "item", coll: '["a", "b"]' }); d.go({ type: "wrap", id: c, kind: "try" }); const i = d.go({ type: "wrap", id: e, kind: "if", test: "true" }); d.go({ type: "addElse", id: i });
    d.go({ type: "setParallel", id: d.q.flows[0].kids[0].id, on: false });
    const g = generate(d.q, m, { runnable: true }), res = exec(g); expect(res.status, res.err + "\n" + g.code).toBe(0); expect(res.out).toContain("[person] Ana Souza: Aprovar"); expect(res.out).toContain("result:");
  });
});
