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
  it("if volta ao 'senão'; try/catch desvia para o tratamento", async () => {
    const { h, ids, gen } = await base();
    await h.run({ type: "addInput", id: ids.s, name: "estoque_ok" });
    await h.run({ type: "setCond", id: ids.s, cond: { test: "estoque_ok", gotoId: ids.r } });
    await h.run({ type: "setCatch", id: ids.s, handlerId: ids.e });
    const { code } = gen();
    expect(code).toContain("if (!estoque_ok) return receberPedido(");
    expect(code).toContain("try {");
    expect(code).toMatch(/\} catch \(error\) \{\n\s+return enviarPedido\(\{ \.\.\.state.*error \}\);  \/\/ catch → Enviar pedido/);
    expect(code).not.toMatch(/await enviarPedido\(/); // o tratamento só roda no catch, nunca na sequência
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
    expect(code).toContain("// TODO: defina o responsável");
  });
  it("mapa de linhas aponta cada função gerada", async () => {
    const { ids, gen } = await base(); const g = gen(); const lines = g.code.split("\n");
    const [a, b] = g.map[ids.s]!;
    expect(lines[a! - 1]).toContain("/** Separar itens");
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
