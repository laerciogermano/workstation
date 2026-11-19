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
  it("console.log de verdade: monta o fluxo no editor, exporta e roda", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "main" }), a = d.go({ type: "addChild", id: m, title: "Montar mensagem" }); d.go({ type: "addOutput", id: a, name: "mensagem" });
    const b = d.go({ type: "addChild", id: m, title: "x" }); d.go({ type: "assign", id: b, agent: "console" }); d.go({ type: "addInput", id: b, name: "mensagem" });
    const res = exec(generate(d.q, m, { runnable: true })); expect(res.status, res.err).toBe(0);
    expect(res.out).toContain("[abstrata] montarMensagem"); expect(res.out).toContain("mensagem: 'mensagem (simulado)'"); expect(res.out).toContain("resultado: { mensagem: 'mensagem (simulado)' }"); expect(res.out).not.toContain("AsyncFunction");
  });
  it("usa a task escolhida da lib (console.error, console.table…) e libs do Node que aceitam o objeto de estado (os, crypto)", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "libs" }), mk = (agent, task, extra = []) => { const f = d.go({ type: "addChild", id: m, title: "f" }); d.go({ type: "assign", id: f, agent }); d.go({ type: "setTask", id: f, task }); extra.forEach(n => d.go({ type: "addInput", id: f, name: n })); return f; };
    mk("console", "table"); mk("os", "platform"); mk("crypto", "randomUUID");
    const g = generate(d.q, m, { runnable: true }); expect(g.code).toContain('call(node_crypto, "randomUUID", data({ ...state }))'); const res = exec(g); expect(res.status, res.err + g.code).toBe(0); expect(res.out).toContain("resultado:");
  });
  it("exemplo completo (if/else, for, paralelo, try/catch, libs e pessoas) exporta e roda sem erro", () => {
    const d = project(), m = d.go({ type: "newFlow", title: "completo" }), kid = t => d.go({ type: "addChild", id: m, title: t });
    const a = kid("Preparar"), b = kid("Logar"), c = kid("Aprovar"), e = kid("Salvar"); d.go({ type: "addOutput", id: a, name: "itens" }); d.go({ type: "addInput", id: b, name: "itens" });
    d.go({ type: "assign", id: b, agent: "console" }); d.go({ type: "assign", id: c, agent: "ana" }); d.go({ type: "assign", id: e, agent: "console" }); d.go({ type: "setTask", id: e, task: "table" });
    d.go({ type: "wrap", id: b, kind: "for", v: "item", coll: '["a", "b"]' }); d.go({ type: "wrap", id: c, kind: "try" }); const i = d.go({ type: "wrap", id: e, kind: "if", test: "true" }); d.go({ type: "addElse", id: i });
    d.go({ type: "setParallel", id: d.q.flows[0].kids[0].id, on: false });
    const g = generate(d.q, m, { runnable: true }), res = exec(g); expect(res.status, res.err + "\n" + g.code).toBe(0); expect(res.out).toContain("[pessoa] Ana Souza: Aprovar"); expect(res.out).toContain("resultado:");
  });
  it("o fazer_onboarding do exemplo (libs http + IA + pessoas) também gera TypeScript que o Node aceita (sintaxe)", () => {
    const s = sampleProject(), g = generate(s.project, s.onboarding, { runnable: true }), dir = mkdtempSync(join(tmpdir(), "flow-chk-")); writeFileSync(join(dir, g.runFile), g.code);
    const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--check", join(dir, g.runFile)], { encoding: "utf8" }); expect(r.status, r.stderr).toBe(0);
  });
});
