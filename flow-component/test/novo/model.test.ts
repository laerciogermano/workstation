import { describe, expect, it } from "vitest";
import { apply, COMMAND_NAMES, DEFAULT_AGENTS, emptyProject, FlowError, insideBlock, isRoot, locate, parseProject, serialize, Store, walk, type Command, type Fn, type Node, type Project } from "../../novo/model";

/** Projeto de teste: raiz "R" com filhos A, B, C, D (todos folhas). */
function base() {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "R" });
  const [a, b, c, d] = ["A", "B", "C", "D"].map(t => run({ type: "addChild", id: root, title: t })) as [string, string, string, string];
  const titles = (list: readonly Node[]): string[] => list.map(n => (n.t === "fn" ? n.title : n.t));
  const kids = (id: string): Node[] => { const n = locate(p, id)!.node; return n.t === "try" ? n.kids : n.kids; };
  return { run, root, a, b, c, d, get p() { return p; }, set: (np: Project) => { p = np; }, titles, kids, rootKids: () => titles(locate(p, root)!.node.kids as Node[]) };
}
const fails = (f: () => unknown, code?: string): void => { try { f(); } catch (e) { expect(e).toBeInstanceOf(FlowError); if (code) expect((e as FlowError).code).toBe(code); return; } throw new Error("deveria falhar"); };
const kinds = ["if", "for", "try"] as const;

describe("fluxos e funções", () => {
  it("newFlow cria uma raiz; renomear só vale para funções", () => {
    const t = base(); expect(t.p.flows.map(f => f.title)).toEqual(["R"]);
    const n = t.run({ type: "newFlow" }); expect(locate(t.p, n)!.node).toMatchObject({ t: "fn", title: "Fazer novo fluxo" });
    t.run({ type: "rename", id: t.a, title: "Renomeada" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("Renomeada");
    const ifId = t.run({ type: "wrap", id: t.b, kind: "if" }); fails(() => apply(t.p, { type: "rename", id: ifId, title: "x" }), "invalid");
    fails(() => apply(t.p, { type: "rename", id: t.a, title: "  " }), "invalid");
  });
  it("addChild em função: no fim; função folha vira composta", () => {
    const t = base(); const x = t.run({ type: "addChild", id: t.a, title: "A1" });
    expect(locate(t.p, t.a)!.node.kids.map(k => k.id)).toEqual([x]); expect(t.rootKids()).toEqual(["A", "B", "C", "D"]);
    const y = t.run({ type: "addChild", id: t.root, title: "E" }); expect(t.rootKids().at(-1)).toBe("E"); expect(y).toBeTruthy();
  });
  it("addSibling entra logo depois, na mesma lista; a raiz não ganha irmão", () => {
    const t = base(); t.run({ type: "addSibling", id: t.b, title: "B2" }); expect(t.rootKids()).toEqual(["A", "B", "B2", "C", "D"]);
    t.run({ type: "addSibling", id: t.b, title: "B0", before: true }); expect(t.rootKids()).toEqual(["A", "B0", "B", "B2", "C", "D"]);
    fails(() => apply(t.p, { type: "addSibling", id: t.root }), "root");
  });
  it("remove tira a subárvore; a raiz não pode ser removida; blocos vazios somem", () => {
    const t = base(); const ifId = t.run({ type: "wrap", id: t.b, kind: "if" });
    t.run({ type: "remove", id: t.a }); expect(t.rootKids()).toEqual(["if", "C", "D"]);
    t.run({ type: "remove", id: t.b }); expect(locate(t.p, ifId)).toBeNull();
    fails(() => apply(t.p, { type: "remove", id: t.root }), "root");
    fails(() => apply(t.p, { type: "remove", id: "zzz" }), "not_found");
  });
});

describe.each(kinds)("bloco %s: regras compartilhadas", kind => {
  const mk = () => { const t = base(), id = t.run({ type: "wrap", id: t.b, kind }); return Object.assign(t, { id }); };
  it("wrap cerca a função e mantém a posição", () => {
    const t = mk(); expect(t.rootKids()).toEqual(["A", kind, "C", "D"]); expect(locate(t.p, t.b)!.parent!.id).toBe(t.id); expect(insideBlock(t.p, t.b)).toBe(true);
  });
  it("addChild entra na PRIMEIRA posição do bloco (o lugar do cabeçalho)", () => {
    const t = mk(); t.run({ type: "addChild", id: t.id, title: "N" }); expect(t.titles(t.kids(t.id))).toEqual(["N", "B"]);
  });
  it("addSibling no bloco = irmão à direita, FORA do bloco", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.id, title: "X" }); expect(t.rootKids()).toEqual(["A", kind, "X", "C", "D"]); expect(t.titles(t.kids(t.id))).toEqual(["B"]);
  });
  it("irmão de quem está dentro do bloco continua dentro do bloco", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.b, title: "Y" }); expect(t.titles(t.kids(t.id))).toEqual(["B", "Y"]);
  });
  it("setScope aumenta (adota os seguintes) e diminui (devolve os últimos para fora)", () => {
    const t = mk(); t.run({ type: "setScope", id: t.id, count: 3 }); expect(t.titles(t.kids(t.id))).toEqual(["B", "C", "D"]); expect(t.rootKids()).toEqual(["A", kind]);
    t.run({ type: "setScope", id: t.id, count: 1 }); expect(t.titles(t.kids(t.id))).toEqual(["B"]); expect(t.rootKids()).toEqual(["A", kind, "C", "D"]);
    t.run({ type: "setScope", id: t.id, count: 0 }); expect(t.kids(t.id).length).toBe(1);        // nunca esvazia
    t.run({ type: "setScope", id: t.id, count: 99 }); expect(t.kids(t.id).length).toBe(3);        // limitado ao que existe
  });
  it("exitScope tira o item e os seguintes do bloco, para depois dele", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.b, title: "B2" }); t.run({ type: "addSibling", id: t.b, title: "B3" });
    const b3 = t.kids(t.id)[1]!.id; t.run({ type: "exitScope", id: b3 });   // [B, B3, B2]: sai B3 e a seguinte (B2)
    expect(t.titles(t.kids(t.id))).toEqual(["B"]); expect(t.rootKids()).toEqual(["A", kind, "B3", "B2", "C", "D"]);
    fails(() => apply(t.p, { type: "exitScope", id: t.a }), "invalid");
  });
  it("exitScope do primeiro item esvazia e remove o bloco", () => {
    const t = mk(); t.run({ type: "exitScope", id: t.b }); expect(locate(t.p, t.id)).toBeNull(); expect(t.rootKids()).toEqual(["A", "B", "C", "D"]);
  });
  it("unwrap devolve os filhos à lista de fora; remover o último filho remove o bloco", () => {
    const t = mk(); t.run({ type: "addChild", id: t.id, title: "N" }); t.run({ type: "unwrap", id: t.id }); expect(t.rootKids()).toEqual(["A", "N", "B", "C", "D"]);
    const u = mk(); u.run({ type: "remove", id: u.b }); expect(locate(u.p, u.id)).toBeNull();
  });
  it("blocos aninham: wrap de um bloco cria bloco dentro de bloco; e a raiz não aceita", () => {
    const t = mk(); const outer = t.run({ type: "wrap", id: t.id, kind: kind === "if" ? "for" : "if" }); expect(locate(t.p, t.id)!.parent!.id).toBe(outer);
    fails(() => apply(t.p, { type: "wrap", id: t.root, kind }), "root");
  });
});

describe("if, for e try: particularidades", () => {
  it("wrap aceita parâmetros e valida", () => {
    const t = base(); const f = t.run({ type: "wrap", id: t.a, kind: "for", v: "pedido", coll: "pedidos" }); expect(locate(t.p, f)!.node).toMatchObject({ t: "for", v: "pedido", coll: "pedidos" });
    const i = t.run({ type: "wrap", id: t.b, kind: "if", test: "estoque_ok" }); expect(locate(t.p, i)!.node).toMatchObject({ t: "if", test: "estoque_ok", elseKids: [] });
    fails(() => apply(t.p, { type: "wrap", id: t.c, kind: "for", v: "1x" }), "invalid"); fails(() => apply(t.p, { type: "wrap", id: t.c, kind: "while" }), "invalid");
  });
  it("setFor / setIf editam e validam", () => {
    const t = base(); const f = t.run({ type: "wrap", id: t.a, kind: "for" }), i = t.run({ type: "wrap", id: t.b, kind: "if" });
    t.run({ type: "setFor", id: f, v: "linha", coll: "linhas" }); expect(locate(t.p, f)!.node).toMatchObject({ v: "linha", coll: "linhas" });
    t.run({ type: "setIf", id: i, test: "ok" }); expect(locate(t.p, i)!.node).toMatchObject({ test: "ok", elseKids: [] });
    fails(() => apply(t.p, { type: "setIf", id: f, test: "x" }), "invalid"); fails(() => apply(t.p, { type: "setFor", id: i, v: "a", coll: "b" }), "invalid"); fails(() => apply(t.p, { type: "setIf", id: i, test: " " }), "invalid");
  });
  it("else do if: mesmo princípio do catch (lista própria, primeira posição, sair do bloco, vazio some)", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.b, kind: "if" }); const node = () => locate(t.p, i)!.node as { elseKids: Node[]; kids: Node[] };
    expect(node().elseKids).toEqual([]);                                             // sem else até alguém pedir
    const e1 = t.run({ type: "addElse", id: i, title: "E1" }); expect(t.titles(node().elseKids)).toEqual(["E1"]); expect(locate(t.p, e1)!.slot).toBe("else"); expect(locate(t.p, e1)!.parent!.id).toBe(i);
    fails(() => apply(t.p, { type: "addElse", id: i }), "invalid"); fails(() => apply(t.p, { type: "addElse", id: t.a }), "invalid");
    t.run({ type: "addChild", id: i, else: true, title: "E0" }); expect(t.titles(node().elseKids)).toEqual(["E0", "E1"]);   // primeira posição do else
    t.run({ type: "addChild", id: i, title: "T0" }); expect(t.titles(node().kids)).toEqual(["T0", "B"]); expect(t.titles(node().elseKids)).toEqual(["E0", "E1"]);
    t.run({ type: "addSibling", id: e1, title: "E2" }); expect(t.titles(node().elseKids)).toEqual(["E0", "E1", "E2"]);                    // irmão de quem está no else fica no else
    t.run({ type: "exitScope", id: e1 }); expect(t.titles(node().elseKids)).toEqual(["E0"]); expect(t.rootKids()).toEqual(["A", "if", "E1", "E2", "C", "D"]);
    t.run({ type: "remove", id: node().elseKids[0]!.id }); expect(node().elseKids).toEqual([]);                                            // else vazio some
    t.run({ type: "addElse", id: i }); t.run({ type: "removeElse", id: i }); expect(node().elseKids).toEqual([]); fails(() => apply(t.p, { type: "removeElse", id: t.a }), "invalid");
  });
  it("desfazer o if descarta o else; remover o último filho do if remove o if inteiro", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.b, kind: "if" }); t.run({ type: "addElse", id: i }); t.run({ type: "unwrap", id: i }); expect(t.rootKids()).toEqual(["A", "B", "C", "D"]);
    const j = t.run({ type: "wrap", id: t.b, kind: "if" }); t.run({ type: "addElse", id: j }); t.run({ type: "remove", id: t.b }); expect(locate(t.p, j)).toBeNull();
  });
  it("try nasce com um catch contendo a função de tratamento; addChild catch entra na primeira posição do catch", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.b, kind: "try" }); const node = () => locate(t.p, tr)!.node as { catchKids: Node[] };
    expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["Tratar erro"]);
    t.run({ type: "addChild", id: tr, catch: true, title: "Primeiro do catch" }); expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["Primeiro do catch", "Tratar erro"]);
    const h = node().catchKids[1]!.id; t.run({ type: "addSibling", id: h, title: "Depois" }); expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["Primeiro do catch", "Tratar erro", "Depois"]);
    t.run({ type: "exitScope", id: h }); expect(t.rootKids()).toEqual(["A", "try", "Tratar erro", "Depois", "C", "D"]);
  });
  it("a raiz não aceita try/if/for nem irmãos", () => { const t = base(); for (const k of kinds) fails(() => apply(t.p, { type: "wrap", id: t.root, kind: k }), "root"); expect(isRoot(t.p, t.root)).toBe(true); });
});

describe("entradas, saídas, responsável e paralelo", () => {
  it("addInput/addOutput validam o nome, ignoram repetidos; remove tira", () => {
    const t = base(); t.run({ type: "addInput", id: t.a, name: "pedido" }); t.run({ type: "addInput", id: t.a, name: "pedido" }); t.run({ type: "addOutput", id: t.a, name: "nota" });
    expect(locate(t.p, t.a)!.node).toMatchObject({ ins: ["pedido"], outs: ["nota"] });
    t.run({ type: "removeInput", id: t.a, name: "pedido" }); t.run({ type: "removeOutput", id: t.a, name: "nota" }); expect(locate(t.p, t.a)!.node).toMatchObject({ ins: [], outs: [] });
    fails(() => apply(t.p, { type: "addInput", id: t.a, name: "nome inválido" }), "invalid"); fails(() => apply(t.p, { type: "addOutput", id: t.a, name: "" }), "invalid");
    const i = t.run({ type: "wrap", id: t.b, kind: "if" }); fails(() => apply(t.p, { type: "addInput", id: i, name: "x" }), "invalid");
  });
  it("assign: lib concreta força uma task do catálogo; setTask só aceita tasks da lib; IA/pessoa mantêm o nome", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "http" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("get");
    t.run({ type: "setTask", id: t.a, task: "post" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("post"); fails(() => apply(t.p, { type: "setTask", id: t.a, task: "voar" }), "invalid");
    t.run({ type: "assign", id: t.b, agent: "lia" }); expect((locate(t.p, t.b)!.node as Fn)).toMatchObject({ title: "B", agent: "lia" });
    t.run({ type: "assign", id: t.b, agent: null }); expect((locate(t.p, t.b)!.node as Fn).agent).toBeNull(); fails(() => apply(t.p, { type: "assign", id: t.b, agent: "nao-existe" }), "not_found");
  });
  it("setResp: só pessoa; trocar de IA para outro responsável limpa a pessoa", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "lia" }); t.run({ type: "setResp", id: t.a, resp: "ana" }); expect((locate(t.p, t.a)!.node as Fn).resp).toBe("ana");
    fails(() => apply(t.p, { type: "setResp", id: t.a, resp: "lia" }), "invalid"); t.run({ type: "assign", id: t.a, agent: "http" }); expect((locate(t.p, t.a)!.node as Fn).resp).toBeNull();
  });
  it("setParallel precisa de uma função irmã anterior", () => {
    const t = base(); fails(() => apply(t.p, { type: "setParallel", id: t.a, on: true }), "invalid"); t.run({ type: "setParallel", id: t.b, on: true }); expect((locate(t.p, t.b)!.node as Fn).par).toBe(true);
    t.run({ type: "setParallel", id: t.b, on: false }); expect((locate(t.p, t.b)!.node as Fn).par).toBe(false);
  });
});

describe("infraestrutura", () => {
  it("apply não muda o projeto original e rejeita comando desconhecido", () => {
    const t = base(); const before = JSON.stringify(t.p); apply(t.p, { type: "addChild", id: t.a }); expect(JSON.stringify(t.p)).toBe(before);
    fails(() => apply(t.p, { type: "voar" as never })); expect(COMMAND_NAMES.length).toBeGreaterThanOrEqual(19);
  });
  it("Store: dispatch, desfazer, refazer e notificação", () => {
    const t = base(), s = new Store(t.p); let n = 0; const off = s.subscribe(() => n++);
    const id = s.dispatch({ type: "addChild", id: t.a, title: "X" }); expect(id).toBeTruthy(); expect(n).toBe(1); expect(s.canUndo).toBe(true);
    s.undo(); expect(locate(s.project, t.a)!.node.kids.length).toBe(0); expect(s.canRedo).toBe(true); s.redo(); expect(locate(s.project, t.a)!.node.kids.length).toBe(1);
    s.dispatch({ type: "rename", id: t.a, title: "Z" }); expect(s.canRedo).toBe(false); off(); s.undo(); expect(n).toBe(4);
    let seen = 0; walk(s.project.flows[0]!.kids, () => seen++); expect(seen).toBeGreaterThan(0);
  });
});

describe("fluxos: excluir", () => {
  it("removeFlow exclui só fluxos inteiros e o projeto sempre mantém um", () => {
    const t = base(); const f2 = t.run({ type: "newFlow", title: "Outro" }); expect(t.p.flows).toHaveLength(2);
    fails(() => apply(t.p, { type: "removeFlow", id: t.a }), "invalid");                       // função, não fluxo
    t.run({ type: "removeFlow", id: f2 }); expect(t.p.flows.map(f => f.title)).toEqual(["R"]); fails(() => apply(t.p, { type: "removeFlow", id: t.root }), "invalid");   // o último fica
    fails(() => apply(t.p, { type: "removeFlow", id: "zzz" }), "not_found");
  });
});

describe("cadastro de responsáveis", () => {
  it("addAgent: lib (com funções), pessoa e IA; valida tipo, nome repetido e funções da lib", () => {
    const t = base(); const lib = t.run({ type: "addAgent", kind: "maquina", name: "node:zlib", tasks: "gzip, gunzip, gzip" }); const pe = t.run({ type: "addAgent", kind: "pessoa", name: "Maria", tasks: "ignorado" }); const ia = t.run({ type: "addAgent", kind: "ia", name: "Redator" });
    const find = (id: string) => t.p.agents.find(a => a.id === id)!; expect(find(lib)).toMatchObject({ kind: "maquina", name: "node:zlib", tasks: ["gzip", "gunzip"] }); expect(find(pe)).toMatchObject({ kind: "pessoa", tasks: [] }); expect(find(ia).kind).toBe("ia");
    fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "NODE:ZLIB", tasks: "x" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "node:vm" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "robo", name: "x" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "pessoa", name: " " }), "invalid");
    t.run({ type: "assign", id: t.a, agent: lib }); expect((locate(t.p, t.a)!.node as Fn)).toMatchObject({ agent: lib, title: "gzip" });   // o responsável novo já serve
  });
  it("removeAgent tira o responsável e solta as funções que o usavam", () => {
    const t = base(); const ia = t.run({ type: "addAgent", kind: "ia", name: "Redator" }), pe = t.run({ type: "addAgent", kind: "pessoa", name: "Maria" });
    t.run({ type: "assign", id: t.a, agent: ia }); t.run({ type: "setResp", id: t.a, resp: pe }); t.run({ type: "removeAgent", id: ia }); t.run({ type: "removeAgent", id: pe });
    expect(locate(t.p, t.a)!.node).toMatchObject({ agent: null, resp: null }); expect(t.p.agents.some(a => a.id === ia || a.id === pe)).toBe(false); fails(() => apply(t.p, { type: "removeAgent", id: "zzz" }), "not_found");
  });
});

describe("salvar e abrir (serialize / parseProject)", () => {
  const rich = () => { const t = base(); const i = t.run({ type: "wrap", id: t.b, kind: "if", test: "ok" }); t.run({ type: "addElse", id: i }); t.run({ type: "wrap", id: t.c, kind: "try" }); t.run({ type: "wrap", id: t.d, kind: "for", v: "n", coll: "xs" });
    t.run({ type: "assign", id: t.a, agent: "http" }); t.run({ type: "addInput", id: t.a, name: "x" }); t.run({ type: "addOutput", id: t.a, name: "y" }); t.run({ type: "setParallel", id: t.b, on: false }); return t; };
  it("ida e volta preserva o projeto inteiro (blocos, else, catch, dados, responsáveis)", () => { const t = rich(); expect(parseProject(serialize(t.p))).toEqual(t.p); });
  it("depois de abrir, os ids novos não colidem com os existentes", () => { const t = rich(), q = parseProject(serialize(t.p)); const ids = new Set<string>(); walk(q.flows[0]!.kids, n => ids.add(n.id)); const r = apply(q, { type: "addChild", id: q.flows[0]!.id }); expect(ids.has(r.created!)).toBe(false); });
  it("recusa arquivo inválido com mensagem clara", () => {
    const t = rich(), good = JSON.parse(serialize(t.p)); const bad = (mut: (g: any) => void): string => { const g = structuredClone(good); mut(g); try { parseProject(JSON.stringify(g)); return "ok"; } catch (e) { return (e as Error).message; } };
    expect(() => parseProject("{ não é json")).toThrow(/JSON válido/); expect(() => parseProject("{}")).toThrow(/não é um projeto do Flow/);
    expect(bad(g => { g.version = 9; })).toMatch(/Versão 9/); expect(bad(g => { g.project.flows = []; })).toMatch(/nenhum fluxo/); expect(bad(g => { g.project.flows[0].kids[0].id = g.project.flows[0].id; })).toMatch(/Id repetido/);
    expect(bad(g => { g.project.flows[0].kids[0].t = "while"; })).toMatch(/desconhecido/); expect(bad(g => { g.project.flows[0].kids[0].agent = "fantasma"; })).toMatch(/não existe/); expect(bad(g => { delete g.project.flows[0].kids[0].title; })).toMatch(/sem nome|desconhecido/);
    expect(bad(g => { g.project.agents[0].kind = "robo"; })).toMatch(/Responsável inválido/); expect(bad(g => { g.project.flows[0].kids[0].ins = "x"; })).toMatch(/lista de textos/); expect(bad(() => undefined)).toBe("ok");
  });
  it("Store.load troca o projeto e zera o histórico", () => { const t = base(), s = new Store(t.p); s.dispatch({ type: "addChild", id: t.a }); expect(s.canUndo).toBe(true); let n = 0; s.subscribe(() => n++); s.load(emptyProject("novo")); expect(s.project.name).toBe("novo"); expect(s.canUndo).toBe(false); expect(n).toBe(1); });
});
