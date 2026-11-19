import { describe, expect, it } from "vitest";
import { generateTypeScript } from "../src";
import { harness } from "./helpers";

async function base() {
  const h = harness();
  const a = (await h.run({ type: "createFunction", planId: "p1", title: "Atender pedido" })).created[0]!;
  const child = async (title: string): Promise<string> => (await h.run({ type: "createChild", refId: a, title })).created[0]!;
  const ids = { a, r: await child("Receber pedido"), s: await child("Separar itens"), e: await child("Enviar pedido") };
  await h.run({ type: "addOutput", id: ids.r, name: "pedido" }); await h.run({ type: "addInput", id: ids.s, name: "pedido" });
  await h.run({ type: "addOutput", id: ids.s, name: "itens" }); await h.run({ type: "addInput", id: ids.e, name: "itens" });
  const gen = () => generateTypeScript(h.s, { rootId: a });
  return { h, ids, gen };
}

describe("transpilador Flow → TypeScript", () => {
  it("sequência: uma função por passo, camada encadeia com await e repassa as saídas", async () => {
    const { gen } = await base(); const { code } = gen();
    expect(code).toContain("export async function atenderPedido(state: State): Promise<State> {");
    expect(code).toMatch(/const \{ pedido \} = await receberPedido\(\{ \.\.\.state \}\);/);
    expect(code).toMatch(/const \{ itens \} = await separarItens\(\{ \.\.\.state, pedido \}\);/);
    expect(code).toContain("return { pedido, itens };");
  });
  it("paralelo vira Promise.all", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setParallel", a: ids.s, b: ids.e, on: true });
    expect(gen().code).toContain("await Promise.all([  // paralelo");
  });
  it("for vira laço sobre a coleção", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setRepetition", id: ids.s, on: true }); await h.run({ type: "setLoopVars", id: ids.s, loop: ["item", "pedidos"] });
    const { code } = gen();
    expect(code).toContain("for (const item of pedidos) {");
    expect(code).toContain("let itens: unknown;");
    expect(code).toMatch(/\(\{ itens \} = await separarItens\(\{ \.\.\.state, pedido, item \}\)\);/);
  });
  it("irmão criado dentro do for roda dentro do mesmo for", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setRepetition", id: ids.s, on: true }); await h.run({ type: "setLoopVars", id: ids.s, loop: ["item", "pedidos"] });
    const x = (await h.run({ type: "createSibling", refId: ids.s, position: "after", title: "Embalar item" })).created[0]!;
    const { code } = gen(); const lines = code.split("\n");
    const a = lines.findIndex(l => l.includes("for (const item of pedidos) {")), b = lines.findIndex(l => l.includes("await embalarItem(")), end = lines.findIndex((l, i) => i > a && l === "  }");
    expect(a).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(a); expect(b).toBeLessThan(end);      // a chamada está dentro do for, não depois
    expect(code.match(/for \(const item of pedidos\)/g)).toHaveLength(1);
    void x;
  });
  it("irmão no for que está dentro de um try roda dentro do for, dentro do try", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setRepetition", id: ids.s, on: true }); await h.run({ type: "setLoopVars", id: ids.s, loop: ["item", "pedidos"] });
    await h.run({ type: "setTryCatch", id: ids.r, on: true, through: ids.e });
    await h.run({ type: "createSibling", refId: ids.s, position: "after", title: "Embalar item" });
    const lines = gen().code.split("\n");
    const t = lines.findIndex(l => l.includes("try {")), f = lines.findIndex(l => l.includes("for (const item of pedidos)")), b = lines.findIndex(l => l.includes("await embalarItem(")), fe = lines.findIndex((l, i) => i > f && l === "    }"), c = lines.findIndex(l => l.includes("} catch"));
    expect(t).toBeLessThan(f); expect(b).toBeGreaterThan(f); expect(b).toBeLessThan(fe); expect(fe).toBeLessThan(c);
  });
  it("if volta ao 'senão'; try/catch desvia para o tratamento", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "addInput", id: ids.s, name: "estoque_ok" });
    await h.run({ type: "setCond", id: ids.s, cond: { test: "estoque_ok", gotoId: ids.r } });
    await h.run({ type: "setCatch", id: ids.s, handlerId: ids.e });
    const { code } = gen();
    expect(code).toContain("if (estoque_ok) {");                         // a função só roda se o teste passa
    expect(code).toMatch(/\} else \{\n\s+return receberPedido\(.*\/\/ senão → Receber pedido/);
    expect(code).toContain("try {");
    expect(code).toMatch(/\} catch \(error\) \{\n\s+return enviarPedido\(\{ \.\.\.state.*error \}\);  \/\/ catch → Enviar pedido/);
    expect(code).not.toMatch(/await enviarPedido\(/); // o tratamento só roda no catch, nunca na sequência
  });
  it("if sem 'senão' (primeira função) também protege a chamada; if → for → if aninha os blocos", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setSelection", id: ids.r, on: true });
    await h.run({ type: "setRepetition", id: ids.r, on: true }); await h.run({ type: "setLoopVars", id: ids.r, loop: ["item", "pedidos"] });
    await h.run({ type: "setSelection", id: ids.r, on: true });
    const lines = gen().code.split("\n"), at = (re: RegExp, from = 0): number => lines.findIndex((l, i) => i >= from && re.test(l));
    const a = at(/^\s*if \(condicao\) \{/), f = at(/for \(const item of pedidos\)/, a), b = at(/^\s*if \(condicao_2\) \{/, f), c = at(/await receberPedido\(/, b);
    expect(a).toBeGreaterThan(-1); expect(f).toBeGreaterThan(a); expect(b).toBeGreaterThan(f); expect(c).toBeGreaterThan(b);
  });
  it("for dentro de for gera laços aninhados com as duas variáveis", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setRepetition", id: ids.s, on: true }); await h.run({ type: "setLoopVars", id: ids.s, loop: ["pedido", "pedidos"] });
    await h.run({ type: "setRepetition", id: ids.s, on: true }); await h.run({ type: "setLoopVars", id: ids.s, loop: ["linha", "linhas"], index: 1 });
    const { code } = gen();
    expect(code.indexOf("for (const pedido of pedidos)")).toBeGreaterThan(-1);
    expect(code.indexOf("for (const linha of linhas)")).toBeGreaterThan(code.indexOf("for (const pedido of pedidos)"));
    expect(code).toMatch(/await separarItens\(\{ \.\.\.state, pedido, pedido, linha \}\)|await separarItens\(\{ \.\.\.state(, \w+)*, pedido(, \w+)*, linha/);
  });
  it("tasks que compartilham os mesmos ifs ficam dentro dos mesmos blocos if (sem repetir)", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setSelection", id: ids.s, on: true }); await h.run({ type: "setSelection", id: ids.s, on: true });
    await h.run({ type: "createSibling", refId: ids.s, position: "after", title: "Embalar" });
    const { code } = gen(), body = code.slice(code.indexOf("export async function"), code.indexOf("\n}\n"));
    expect(body.match(/if \(\w+\) \{/g)).toHaveLength(2);           // dois ifs, uma vez cada, para as duas tasks
    const a = body.indexOf("if (condicao) {"), s1 = body.indexOf("await separarItens("), s2 = body.indexOf("await Embalar(");
    expect(a).toBeGreaterThan(-1); expect(s1).toBeGreaterThan(a); expect(s2).toBeGreaterThan(s1);
  });
  it("responsáveis viram imports e chamadas; sem responsável vira TODO", async () => {
    const { h, ids, gen } = await base();
    const lib = (await h.run({ type: "createAgent", kind: "maquina", name: "node:fs" })).created[0]!;
    const p = (await h.run({ type: "createPerson", name: "Ana" })).created[0]!;
    await h.run({ type: "assignResponsible", id: ids.s, agentId: lib }); await h.run({ type: "assignResponsible", id: ids.e, agentId: p });
    const { code } = gen();
    expect(code).toContain('import * as node_fs from "node:fs";');
    expect(code).toContain('import { humans } from "@flow/runtime";');
    expect(code).toContain('humans.ask("Ana", "Enviar pedido"');
    expect(code).not.toContain("// TODO: defina o responsável");   // sem responsável = abstrata: não tem corpo
  });
  it("função sem responsável é abstrata: não é declarada, chega pelo state e é só chamada pelo nome", async () => {
    const { gen } = await base(); const { code } = gen();
    expect(code).toContain("type Fn = (state: State) => Promise<State>;");
    expect(code).toMatch(/const \{ receberPedido, separarItens, enviarPedido \} = state as Record<string, Fn>;/);
    expect(code).toMatch(/await receberPedido\(\{ \.\.\.state \}\)/);
    expect(code).not.toMatch(/async function receberPedido/);          // não define quem faz
    expect(code).not.toMatch(/\w+\.receberPedido\(/);                  // nem informa quem (sem prefixo)
  });
  it("mapa de linhas aponta cada função gerada", async () => {
    const { h, ids, gen } = await base();
    const lib = (await h.run({ type: "createAgent", kind: "maquina", name: "node:fs" })).created[0]!;
    await h.run({ type: "assignResponsible", id: ids.s, agentId: lib });          // com responsável a função é concreta e tem corpo
    const g = gen(); const lines = g.code.split("\n");
    const [a, b] = g.map[ids.s]!;
    expect(lines[a! - 1]).toContain("node:fs");
    expect(lines[b! - 1]).toBe("}");
    expect(g.fileName).toBe("atender-pedido.ts");
  });
});

describe("transpilador: try cobrindo várias funções", () => {
  it("gera um único try/catch em volta das chamadas do bloco", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "setCatch", id: ids.r, handlerId: ids.e, through: ids.s });
    const { code } = gen();
    expect(code.match(/try \{/g)).toHaveLength(1);
    expect(code.match(/catch \(error\)/g)).toHaveLength(1);
    expect(code).toContain("let pedido: unknown, itens: unknown;");
    const tryBody = code.slice(code.indexOf("try {"), code.indexOf("} catch"));
    expect(tryBody).toContain("receberPedido("); expect(tryBody).toContain("separarItens(");
    expect(tryBody).not.toContain("enviarPedido(");
    expect(code).toMatch(/\} catch \(error\) \{\n\s+return enviarPedido\(/);
  });
});
