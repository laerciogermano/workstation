import { describe, expect, it } from "vitest";
import { buildScene, DEFAULT_FLAGS } from "../src";
import { addChildCmd, addIfCmds, addSiblingOutsideCmd, blockOf } from "../src/view/blocks";
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
  it("a coluna Task (leftW) cresce com a indentação / degrau dos passos", async () => {
    const h = harness();
    const root = (await h.run({ type: "createFunction", planId: "p1", title: "Raiz" })).created[0]!;
    const shallow = buildScene(h.s, { planId: "p1", rootId: root, closed: new Set(), flags: DEFAULT_FLAGS }).leftW;
    for (let i = 0; i < 16; i++) await h.run({ type: "createChild", refId: root, title: `Fazer nova função ${i}` });
    const wide = buildScene(h.s, { planId: "p1", rootId: root, closed: new Set(), flags: DEFAULT_FLAGS });
    expect(wide.leftW).toBeGreaterThan(shallow);
    expect(wide.worldW).toBe(wide.leftW + wide.CW);
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
    await expect(h.run({ type: "setTryCatch", id: a, on: true })).rejects.toThrow();     // nem try/catch
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

describe("if aninhado", () => {
  it("if → for → if na mesma task: dois ifs, o de fora antes do for e o aninhado depois", async () => {
    const { h, c, scene } = await three();
    await h.run({ type: "setSelection", id: c, on: true });
    await h.run({ type: "setRepetition", id: c, on: true });
    await h.run({ type: "setSelection", id: c, on: true });
    const s = scene();
    expect(s.structs).toHaveLength(2);
    expect(s.structs[0]!.test).not.toBe(s.structs[1]!.test);
    const kinds = s.disp.filter(d => d.st || d.lp).map(d => (d.st ? "if" : "for"));
    expect(kinds).toEqual(["if", "for", "if"]);
  });
  it("remover desfaz só o if indicado (padrão: o mais interno)", async () => {
    const { h, c, scene } = await three();
    await h.run({ type: "setSelection", id: c, on: true });
    await h.run({ type: "setSelection", id: c, on: true });
    const [outer, inner] = scene().structs;
    await h.run({ type: "setSelection", id: c, on: false, structId: outer!.id });
    expect(scene().structs.map(x => x.id)).toEqual([inner!.id]);
    expect(scene().u(c)!.cond).not.toBeNull();                     // continua num if
    await h.run({ type: "setSelection", id: c, on: false });
    expect(scene().structs).toHaveLength(0);
    expect(scene().u(c)!.cond).toBeNull();
  });
});

describe("filho de um if", () => {
  it("createSibling com structId entra no if indicado e nos de fora, não nos aninhados", async () => {
    const { h, b, c, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    await h.run({ type: "createSibling", refId: b, position: "after", title: "no-if" });      // entra no if de b
    await h.run({ type: "setSelection", id: b, on: true });                                     // if aninhado só em b
    const [outer, inner] = scene().structs;
    const e = (await h.run({ type: "createSibling", refId: b, position: "after", structId: outer!.id, title: "filho" })).created[0]!;
    const s = scene();
    expect(s.structs.find(x => x.id === outer!.id)!.body).toContain(e);
    expect(s.structs.find(x => x.id === inner!.id)!.body).not.toContain(e);
    void c;
  });
});

describe("for dentro de for", () => {
  it("segundo setRepetition cria um for aninhado; remover tira o mais interno (ou o indicado)", async () => {
    const { h, c, scene } = await three();
    await h.run({ type: "setRepetition", id: c, on: true });
    await h.run({ type: "setRepetition", id: c, on: true });
    const s = scene();
    expect(s.u(c)!.loop).toEqual(["item", "lista"]);
    expect(s.u(c)!.loopsIn).toEqual([["item_2", "lista_2"]]);
    expect(s.disp.filter(d => d.lp).map(d => d.li)).toEqual([0, 1]);         // dois cabeçalhos, o aninhado depois
    expect(s.loops).toHaveLength(2);
    await h.run({ type: "setLoopVars", id: c, loop: ["x", "xs"], index: 1 });
    expect(scene().u(c)!.loopsIn).toEqual([["x", "xs"]]);
    await h.run({ type: "setRepetition", id: c, on: false });                  // tira o interno
    expect(scene().u(c)!.loop).toEqual(["item", "lista"]); expect(scene().u(c)!.loopsIn).toEqual([]);
    await h.run({ type: "setRepetition", id: c, on: true });
    await h.run({ type: "setRepetition", id: c, on: false, index: 0 });        // tira o externo: o interno vira externo
    expect(scene().u(c)!.loop).toEqual(["item_2", "lista_2"]);
  });
});

describe("filho de um if entra na primeira posição", () => {
  it("createSibling before com structId fica no começo do if", async () => {
    const { h, b, c, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    await h.run({ type: "createSibling", refId: b, position: "after", title: "segundo" });
    const st = scene().structs[0]!;
    const e = (await h.run({ type: "createSibling", refId: b, position: "before", structId: st.id, title: "novo" })).created[0]!;
    const s = scene(), body = s.structs[0]!.body;
    expect(body[0]).toBe(e);                                         // primeiro do if
    expect(s.idx[e]!).toBeLessThan(s.idx[b]!);
    void c;
  });
});

describe("filho do if externo com ifs de mesmo corpo", () => {
  it("entra só no if clicado (e nos de fora), não no aninhado de mesmo corpo", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    await h.run({ type: "setSelection", id: b, on: true });
    const [outer, inner] = scene().structs;
    const e = (await h.run({ type: "createSibling", refId: b, position: "before", structId: outer!.id, title: "novo" })).created[0]!;
    const s = scene();
    expect(s.structs.find(x => x.id === outer!.id)!.body).toContain(e);
    expect(s.structs.find(x => x.id === inner!.id)!.body).not.toContain(e);
  });
});

describe("sair do escopo", () => {
  it("for: a função e as seguintes deixam o laço", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "createSibling", refId: b, position: "after", title: "m1" });
    const m1 = scene().rows.map(r => r.u.id)[2]!;
    await h.run({ type: "createSibling", refId: m1, position: "after", title: "m2" });
    expect(scene().loops[0]!.last.title).toBe("m2");
    await h.run({ type: "exitScope", id: m1, scope: "loop" });
    const s = scene();
    expect(s.loops[0]!.last.id).toBe(b);                               // só a função do for ficou
    expect(s.u(m1)!.inLoop).toBeNull();
    void c; void d;
  });
  it("if: a função e as seguintes saem do corpo; esvaziar remove o if", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    await h.run({ type: "createSibling", refId: b, position: "after", title: "x" });
    const x = scene().structs[0]!.body[1]!;
    await h.run({ type: "exitScope", id: x, scope: "if" });
    expect(scene().structs[0]!.body).toEqual([b]);
    await h.run({ type: "exitScope", id: b, scope: "if" });
    expect(scene().structs).toHaveLength(0);
    expect(scene().u(b)!.cond).toBeNull();
    void c; void d;
  });
  it("try: as seguintes deixam de ser cobertas; a primeira desfaz o try", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setCatch", id: b, handlerId: d, through: c });
    await h.run({ type: "exitScope", id: c, scope: "try" });
    expect(scene().u(b)!.onError).toBe(d); expect(scene().u(c)!.onError ?? null).toBeNull();
  });
});

describe("puxar a tag (extendScope)", () => {
  it("for: as irmãs seguintes até toId passam a pertencer ao for", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "extendScope", id: b, scope: "loop", toId: d });
    const s = scene();
    expect(s.u(c)!.inLoop).toBe(b); expect(s.u(d)!.inLoop).toBe(b);
    expect(s.loops[0]!.last.id).toBe(d);
  });
  it("if: entram no corpo; try: passam a ser cobertas", async () => {
    const { h, a, b, c, d, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    await h.run({ type: "extendScope", id: b, scope: "if", toId: c });
    expect(scene().structs[0]!.body).toEqual([b, c]);
    await h.run({ type: "setCatch", id: d, handlerId: a });
    void a;
  });
});

describe("encolher/estender o catch", () => {
  it("extendScope catch traz irmãs depois do try para dentro do catch; exitScope catch devolve ao fluxo", async () => {
    const { h, b, c, d, scene } = await three();
    const hd = (await h.run({ type: "setTryCatch", id: b, on: true })).created[0]!;
    await h.run({ type: "extendScope", id: hd, scope: "catch", toId: c });
    expect(scene().u(c)!.inCatch).toBe(hd);
    expect(scene().tries[0]!.catchEnd!).toBeGreaterThanOrEqual(scene().idx[c]!);   // dentro da faixa catch
    await h.run({ type: "exitScope", id: c, scope: "catch" });
    expect(scene().u(c)!.inCatch).toBeNull();
    expect(scene().rows.find(r => r.u.id === c)?.catchFor).toBeUndefined();         // voltou ao fluxo principal
    void d;
  });
  it("encolher o for/if/try: exitScope na primeira função descoberta", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "extendScope", id: b, scope: "loop", toId: d });
    await h.run({ type: "exitScope", id: d, scope: "loop" });                      // encolhe: d sai, c fica
    expect(scene().u(c)!.inLoop).toBe(b); expect(scene().u(d)!.inLoop).toBeNull();
  });
});

describe("filho do for entra na primeira posição", () => {
  it("loopFirst: o novo item assume o laço e a task de antes vira membro", async () => {
    const { h, b, c, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "createSibling", refId: b, position: "after", title: "m" });         // membro existente
    const e = (await h.run({ type: "createSibling", refId: b, position: "before", loopFirst: true, title: "primeiro" })).created[0]!;
    const s = scene();
    expect(s.u(e)!.loop).toEqual(["item", "lista"]); expect(s.u(b)!.loop).toBeNull();
    expect(s.u(b)!.inLoop).toBe(e);
    expect(s.loops).toHaveLength(1);
    expect(s.loops[0]!.u.id).toBe(e);
    expect(s.idx[e]!).toBeLessThan(s.idx[b]!);                                              // logo abaixo do cabeçalho do for
    expect(s.loops[0]!.end).toBeGreaterThanOrEqual(s.idx[c]! - 1);
  });
});

describe("if em várias camadas", () => {
  it("o if cobre também os filhos (em todas as camadas) da função do corpo", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setSelection", id: b, on: true });
    const c = (await h.run({ type: "createChild", refId: b, title: "C" })).created[0]!;
    const d = (await h.run({ type: "createChild", refId: c, title: "D" })).created[0]!;
    const s = scene(), st = s.structs[0]!;
    expect(st.end).toBeGreaterThanOrEqual(s.idx[d]!);                    // a faixa do if desce até o neto
    expect(st.hi).toBeLessThan(s.idx[b]!);                               // o if fica em cima do elemento
  });
});

describe("filho do for de fora com for aninhado", () => {
  it("loopFirst: o item novo fica no for de fora, antes do for aninhado e da função", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "setRepetition", id: b, on: true });                  // for aninhado na mesma task
    const e = (await h.run({ type: "createSibling", refId: b, position: "before", loopFirst: true, title: "novo" })).created[0]!;
    const s = scene();
    expect(s.u(e)!.loop).toEqual(["item", "lista"]);                          // assume o for de fora
    expect(s.u(b)!.loop).toEqual(["item_2", "lista_2"]);                      // a função fica com o aninhado, como membro
    expect(s.u(b)!.inLoop).toBe(e);
    const kinds = s.disp.filter(d => d.lp || d.row).map(d => (d.lp ? "for" : d.u!.title));
    expect(kinds.slice(0, 5)).toContain("novo");
    expect(kinds.indexOf("for")).toBeLessThan(kinds.indexOf("novo"));        // for de fora
    expect(kinds.indexOf("novo")).toBeLessThan(kinds.lastIndexOf("for"));    // depois o for aninhado
    expect(kinds.lastIndexOf("for")).toBeLessThan(kinds.indexOf("Cobrar"));  // e então a função
  });
});

describe("irmão à direita do bloco (outside)", () => {
  it("for: o irmão fica depois do bloco, sem herdar o laço", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    const e = (await h.run({ type: "createSibling", refId: b, position: "after", outside: true, title: "fora" })).created[0]!;
    const s = scene();
    expect(s.u(e)!.inLoop ?? null).toBeNull(); expect(s.u(e)!.loop).toBeNull();
    expect(s.loops[0]!.last.id).toBe(b);
  });
  it("try: o irmão não é coberto; if: o irmão não entra no if", async () => {
    const { h, b, c, scene } = await three();
    await h.run({ type: "setTryCatch", id: b, on: true });
    const e = (await h.run({ type: "createSibling", refId: b, position: "after", outside: true, title: "fora" })).created[0]!;
    expect(scene().u(e)!.onError ?? null).toBeNull();
    await h.run({ type: "setSelection", id: c, on: true });
    const st = scene().structs[0]!;
    const f = (await h.run({ type: "createSibling", refId: c, position: "after", outside: true, structId: st.id, title: "fora2" })).created[0]!;
    expect(scene().structs[0]!.body).not.toContain(f);
  });
  it("if criado depois do for fica dentro do for (afterLoop)", async () => {
    const { h, b, scene } = await three();
    await h.run({ type: "setRepetition", id: b, on: true });
    await h.run({ type: "setSelection", id: b, on: true });
    const kinds = scene().disp.filter(d => d.st || d.lp).map(d => (d.st ? "if" : "for"));
    expect(kinds).toEqual(["for", "if"]);                                  // if embaixo da tag do for, em cima do elemento
  });
});

describe("regras compartilhadas dos blocos (if · for · try · catch)", () => {
  /** filho do bloco entra no lugar exato do cabeçalho: primeiro membro, herdando o escopo do bloco. */
  it("filho entra na primeira posição do bloco, qualquer que seja o tipo", async () => {
    // try
    { const { h, b, c, d, scene } = await three();
      await h.run({ type: "setTryCatch", id: b, on: true, through: c });
      const n = (await h.run(addChildCmd(blockOf(scene(), "try", h.s.elements.find(e => e.id === b)!)))).created[0]!;
      const s = scene(), el = h.s.elements.find(e => e.id === n)!;
      expect(el.onError).toBe(h.s.elements.find(e => e.id === b)!.onError);
      expect(s.idx[n]!).toBeLessThan(s.idx[b]!); expect(s.idx[n]!).toBeLessThan(s.idx[d]!); }
    // catch
    { const { h, b, c, d, scene } = await three();
      await h.run({ type: "setCatch", id: b, handlerId: d });
      const n = (await h.run(addChildCmd(blockOf(scene(), "catch", h.s.elements.find(e => e.id === d)!)))).created[0]!;
      const el = h.s.elements.find(e => e.id === n)!, s = scene();
      expect(el.inCatch).toBe(d); expect(s.idx[n]!).toBeGreaterThan(s.idx[d]!);   // a função de tratamento é a cabeça: o filho vem logo abaixo dela, dentro do catch
      void c; }
    // for
    { const { h, c, d, scene } = await three();
      await h.run({ type: "setRepetition", id: c, on: true });
      const n = (await h.run(addChildCmd(blockOf(scene(), "loop", h.s.elements.find(e => e.id === c)!)))).created[0]!;
      const s = scene(); expect(h.s.elements.find(e => e.id === n)!.loop).toBeTruthy();
      expect(s.idx[n]!).toBeLessThan(s.idx[c]!); expect(s.idx[c]!).toBeLessThan(s.idx[d]!); }
    // if
    { const { h, c, d, scene } = await three();
      await h.run({ type: "setSelection", id: c, on: true });
      const st = h.s.structs[0]!;
      const n = (await h.run(addChildCmd(blockOf(scene(), "if", h.s.elements.find(e => e.id === c)!, st.id)))).created[0]!;
      const s = scene(); expect(h.s.structs[0]!.body).toContain(n);
      expect(s.idx[n]!).toBeLessThan(s.idx[c]!); expect(s.idx[c]!).toBeLessThan(s.idx[d]!); }
  });
  it("irmão à direita nasce fora do bloco e a condição cobre os membros do bloco", async () => {
    const { h, b, c, d, scene } = await three();
    await h.run({ type: "setTryCatch", id: b, on: true, through: c });
    const blk = () => blockOf(scene(), "try", h.s.elements.find(e => e.id === b)!);
    const n = (await h.run(addSiblingOutsideCmd(blk()))).created[0]!;
    expect(h.s.elements.find(e => e.id === n)!.onError ?? null).toBeNull();
    for (const cmd of addIfCmds(blk())) await h.run(cmd);
    expect(h.s.structs.at(-1)!.body).toEqual(expect.arrayContaining([b, c])); void d;
  });
});
