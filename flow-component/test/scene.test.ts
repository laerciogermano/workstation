import { describe, expect, it } from "vitest";
import { buildScene, DEFAULT_FLAGS } from "../src";
import { harness } from "./helpers";

async function three() {
  const h = harness();
  const a = (await h.run({ type: "createFunction", planId: "p1", title: "Vender" })).created[0]!;
  const b = (await h.run({ type: "createChild", refId: a, title: "Cobrar" })).created[0]!;
  const c = (await h.run({ type: "createChild", refId: a, title: "Entregar" })).created[0]!;
  const d = (await h.run({ type: "createChild", refId: a, title: "Faturar" })).created[0]!;
  const scene = (flags = {}, closed = new Set<string>()) => buildScene(h.s, { planId: "p1", rootId: a, closed, flags: { ...DEFAULT_FLAGS, ...flags } });
  return { h, a, b, c, d, scene };
}

describe("cena do Flow (layout puro)", () => {
  it("filhos em sequência ocupam passos consecutivos; a composição cobre todos", async () => {
    const { a, b, c, d, scene } = await three(); const s = scene();
    expect([b, c, d].map(id => s.layout[id]!.s)).toEqual([0, 1, 2]);
    expect(s.layout[a]).toEqual({ s: 0, e: 2 });
    expect(s.nSteps).toBe(3);
    expect(s.FD).toEqual([[b, c], [c, d]]);
  });
  it("paralelo divide o mesmo passo", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setParallel", a: c, b: d, on: true });
    const s = scene();
    expect(s.layout[c]!.s).toBe(s.layout[d]!.s);
    expect(s.nSteps).toBe(2);
    expect(s.FD).toEqual([[b, c], [b, d]]);
  });
  it("linhas: entrada/saída viram linhas próprias (e somem no modo compacto)", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "addInput", id: b, name: "cliente" }); await h.run({ type: "addOutput", id: b, name: "pagamento" });
    expect(scene().disp.map(r => r.io ?? (r.row ? "fn" : "?"))).toEqual(["fn", "in", "fn", "out", "fn", "fn"]);
    expect(scene({ compact: true }).disp.every(r => !r.io)).toBe(true);
  });
  it("if vira cabeçalho + banda; for vira linha de repetição", async () => {
    const { h, c, d, scene } = await three();
    await h.run({ type: "setSelection", id: c, on: true }); await h.run({ type: "setRepetition", id: d, on: true });
    const s = scene();
    expect(s.disp.some(r => r.st?.test === "condicao")).toBe(true);
    expect(s.disp.some(r => r.lp?.id === d)).toBe(true);
    expect(s.senaoOf({ test: "condicao" })).toContain("senão →");
  });
  it("sanfona fechada esconde os filhos", async () => {
    const { a, scene } = await three(); const s = scene({}, new Set([a]));
    expect(s.rows.map(r => r.u.id)).toEqual([a]);
  });
  it("estados: dado de entrada abstrata aparece em s0; saída no passo seguinte", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "addInput", id: b, name: "cliente" }); await h.run({ type: "addOutput", id: b, name: "pagamento" });
    const s = scene();
    expect(s.stShow[0]!.map(x => x[0])).toContain("cliente");
    expect(s.stShow[1]!.map(x => x[0])).toContain("pagamento");
  });
});

describe("cena: try / catch", () => {
  it("o catch sai da sequência e fica em paralelo ao try, terminando junto com a última célula do try", async () => {
    const { h, a, b, c, d, scene } = await three();
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const s = scene();
    expect(s.rows.map(r => r.u.id)).toEqual([a, b, c, d]);          // d vem depois de c, mas só como faixa catch
    expect(s.rows.find(r => r.u.id === d)?.catchFor).toBe(c);
    expect(s.FD).toEqual([[b, c]]);                                   // d não participa da sequência principal
    expect(s.layout[d]!.e).toBe(s.layout[c]!.e);
    const t = s.tries.find(x => x.u.id === c)!;
    expect(t.catchHi).toBeGreaterThan(t.end);                          // faixa catch abaixo do bloco try
    expect(s.disp[t.catchHi!]!.ca?.id).toBe(d);
  });
  it("try numa composição cobre os filhos e o catch fica depois da última linha do try", async () => {
    const { h, c, d, scene } = await three();
    await h.run({ type: "createChild", refId: c, title: "Embalar" });
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const t = scene().tries.find(x => x.u.id === c)!;
    expect(t.end).toBeGreaterThan(t.hi + 1);
    expect(t.catchHi!).toBeGreaterThan(t.end);
  });
  it("a função de tratamento pode ter filhos (fluxo catch com vários passos)", async () => {
    const { h, c, d, scene } = await three();
    await h.run({ type: "createChild", refId: d, title: "Registrar" }); await h.run({ type: "createChild", refId: d, title: "Notificar" });
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const s = scene(), t = s.tries.find(x => x.u.id === c)!;
    expect(t.catchEnd! - t.catchHi!).toBeGreaterThanOrEqual(2);
  });
  it("o passo seguinte ao try/catch só começa depois do try e do catch (ex.: Faturar)", async () => {
    const { h, a, b, c, d, scene } = await three();
    const e = (await h.run({ type: "createChild", refId: a, title: "Estornar" })).created[0]!;
    await h.run({ type: "createChild", refId: e, title: "A" });
    await h.run({ type: "createChild", refId: e, title: "B" });
    await h.run({ type: "createChild", refId: e, title: "C" });
    await h.run({ type: "setCatch", id: c, handlerId: e });
    const s = scene();
    expect(s.FD.filter(([x, y]) => [b, c, d].includes(x) && [b, c, d].includes(y))).toEqual([[b, c], [c, d]]);
    expect(s.layout[e]!.e).toBeGreaterThanOrEqual(s.layout[c]!.e);   // catch em paralelo: nunca termina antes do try aqui
    expect(s.layout[d]!.s).toBe(Math.max(s.layout[c]!.e, s.layout[e]!.e) + 1);
    expect(s.layout[a]!.e).toBe(s.layout[d]!.e);
  });
});

describe("cena: dados do rodapé", () => {
  it("dado com valor que o fluxo não usa não aparece (função nova = rodapé vazio)", async () => {
    const h = harness();
    await h.run({ type: "createData", name: "preco" }); await h.run({ type: "upsertData", name: "preco", value: "10" });
    await h.run({ type: "createData", name: "cliente" }); await h.run({ type: "addDataChild", parent: "cliente", name: "nome" }); await h.run({ type: "upsertData", name: "cliente.nome", value: "Maria" });
    const a = (await h.run({ type: "createFunction", planId: "p1", title: "Emitir nota" })).created[0]!;
    const s = buildScene(h.s, { planId: "p1", rootId: a, closed: new Set(), flags: DEFAULT_FLAGS });
    expect(s.stShow.flat()).toEqual([]);
    await h.run({ type: "addInput", id: a, name: "preco" });
    const u = buildScene(h.s, { planId: "p1", rootId: a, closed: new Set(), flags: DEFAULT_FLAGS });
    expect(u.stShow.flat().map(x => x[0])).toContain("preco");
    expect(u.stShow.flat().map(x => x[0])).not.toContain("cliente.nome");
  });
});

describe("cena: posição do catch", () => {
  it("padrão: o catch fica logo após o try, antes do próximo passo", async () => {
    const { h, a, b, c, d, scene } = await three();
    const e = (await h.run({ type: "createChild", refId: a, title: "Fechar" })).created[0]!;
    await h.run({ type: "setCatch", id: b, handlerId: e });
    const s = scene();
    expect(s.rows.map(r => r.u.id)).toEqual([a, b, e, c, d]);
    expect(s.FD).toEqual([[b, c], [c, d]]);                       // a sequência principal não passa pelo catch
    const t = s.tries.find(x => x.u.id === b)!;
    expect(t.catchHi).toBe(t.end + 1);                             // sem linha entre o fim do try e o cabeçalho do catch
  });
  it("try com várias funções: o catch fica depois da última função do bloco", async () => {
    const { h, a, b, c, d, scene } = await three();
    const e = (await h.run({ type: "createChild", refId: a, title: "Fechar" })).created[0]!;
    await h.run({ type: "setCatch", id: b, handlerId: e, through: c });
    expect(scene().rows.map(r => r.u.id)).toEqual([a, b, c, e, d]);
  });
});

describe("cena: irmão criado dentro de um bloco", () => {
  it("irmão de uma função do try entra no mesmo bloco try", async () => {
    const { h, a, b, c, d, scene } = await three();
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const e = (await h.run({ type: "createSibling", refId: c, position: "after", title: "Extra" })).created[0]!;
    const s = scene();
    expect(s.tries.find(t => t.u.id === c)!.last.id).toBe(e);
    void a; void b;
  });
});

describe("cena: irmão de uma task do catch", () => {
  it("irmão da função de tratamento é irmão (mesmo pai), dentro da faixa catch e em sequência com ela", async () => {
    const { h, c, d, scene } = await three();
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const e = (await h.run({ type: "createSibling", refId: d, position: "after", title: "Notificar" })).created[0]!;
    const s = scene();
    expect(s.u(e)!.parentId).toBe(s.u(d)!.parentId);                // irmão, não filho
    const t = s.tries.find(x => x.u.id === c)!;
    expect(s.idx[e]!).toBeGreaterThan(t.catchHi!);
    expect(s.idx[e]!).toBeLessThanOrEqual(t.catchEnd!);             // dentro da faixa catch
    expect(s.layout[e]!.s).toBe(s.layout[d]!.e + 1);                // depois do tratamento, na sequência
    expect(s.FD).toContainEqual([d, e]);
    expect(s.rows.map(r => r.u.id)).toContain(e);
  });
  it("irmão de uma irmã do catch continua no mesmo catch", async () => {
    const { h, c, d, scene } = await three();
    await h.run({ type: "setCatch", id: c, handlerId: d });
    const e = (await h.run({ type: "createSibling", refId: d, position: "after" })).created[0]!;
    const f = (await h.run({ type: "createSibling", refId: e, position: "after" })).created[0]!;
    const s = scene(), t = s.tries.find(x => x.u.id === c)!;
    expect(s.idx[f]!).toBeLessThanOrEqual(t.catchEnd!);
    expect(s.layout[f]!.s).toBe(s.layout[e]!.e + 1);
  });
});

describe("cena: irmão criado dentro de um for", () => {
  it("o irmão pertence ao for do irmão, sem laço próprio", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    const e = (await h.run({ type: "createSibling", refId: b, position: "after", title: "Extra" })).created[0]!;
    const f = (await h.run({ type: "createSibling", refId: e, position: "after", title: "Outro" })).created[0]!;
    const s = scene();
    expect(s.u(e)!.loop).toBeNull();                                // não cria for próprio
    expect(s.u(e)!.inLoop).toBe(b);
    expect(s.u(f)!.inLoop).toBe(b);                                 // irmão de membro continua no mesmo for
    expect(s.loops).toHaveLength(1);
    expect(s.loops[0]!.u.id).toBe(b);
    expect(s.loops[0]!.last.id).toBe(f);
    expect(s.loops[0]!.end).toBeGreaterThanOrEqual(s.idx[f]!);
  });
});

describe("cena: filho criado dentro de uma função com for", () => {
  it("o for continua depois de criar um filho (a função vira camada e o for envolve ela e os filhos)", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    const k = (await h.run({ type: "createChild", refId: b, title: "Filho" })).created[0]!;
    const s = scene();
    expect(s.u(b)!.loop).not.toBeNull();
    expect(s.loops).toHaveLength(1);
    expect(s.loops[0]!.u.id).toBe(b);
    expect(s.loops[0]!.end).toBeGreaterThanOrEqual(s.idx[k]!);      // a caixa cobre o filho
  });
});

describe("fluxo raiz", () => {
  it("não ganha irmão, for nem if", async () => {
    const { h, a } = await three();
    await expect(h.run({ type: "createSibling", refId: a, position: "after" })).rejects.toThrow();
    await expect(h.run({ type: "setRepetition", id: a, on: true })).rejects.toThrow();
    await expect(h.run({ type: "setSelection", id: a, on: true })).rejects.toThrow();
  });
});

describe("editar if e for", () => {
  it("setCond num membro do if muda o teste e o senão da seleção inteira", async () => {
    const { h, a, b, c, scene } = await three();
    void a;
    await h.run({ type: "setSelection", id: c, on: true });
    await h.run({ type: "setCond", id: c, cond: { test: "estoque_ok", gotoId: b } });
    const s = scene();
    expect(s.structs[0]!.test).toBe("estoque_ok");
    expect(s.u(c)!.cond).toEqual(["estoque_ok", b]);
    expect(s.senaoOf(s.structs[0]!)).toContain("Cobrar");
  });
  it("setLoopVars edita variável e coleção", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "setLoopVars", id: b, loop: ["linha", "linhas"] });
    expect(scene().u(b)!.loop).toEqual(["linha", "linhas"]);
  });
});
