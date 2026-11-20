import { describe, expect, it } from "vitest";
import { apply, COMMAND_NAMES, contractOf, statesFor, DEFAULT_AGENTS, emptyProject, FlowError, insideBlock, isRoot, locate, parseProject, parseSignature, resolveDataOrigin, serialize, Store, walk, type Command, type Fn, type Node, type Project } from "../../novo/model";

/** Projeto de teste: raiz "root" com filhos a, b, c, d (todos folhas). */
function base() {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "root" });
  const [a, b, c, d] = ["fa", "fb", "fc", "fd"].map(t => run({ type: "addChild", id: root, title: t })) as [string, string, string, string];
  const titles = (list: readonly Node[]): string[] => list.map(n => (n.t === "fn" ? n.title : n.t));
  const kids = (id: string): Node[] => { const n = locate(p, id)!.node; return n.t === "try" ? n.kids : n.kids; };
  return { run, root, a, b, c, d, get p() { return p; }, set: (np: Project) => { p = np; }, titles, kids, rootKids: () => titles(locate(p, root)!.node.kids as Node[]) };
}
const fails = (f: () => unknown, code?: string): void => { try { f(); } catch (e) { expect(e).toBeInstanceOf(FlowError); if (code) expect((e as FlowError).code).toBe(code); return; } throw new Error("deveria falhar"); };
const kinds = ["if", "for", "try"] as const;

describe("fluxos e funções", () => {
  it("newFlow cria uma raiz; renomear só vale para funções", () => {
    const t = base(); expect(t.p.flows.map(f => f.title)).toEqual(["root"]);
    const n = t.run({ type: "newFlow" }); expect(locate(t.p, n)!.node).toMatchObject({ t: "fn", title: "newFlow" });
    t.run({ type: "rename", id: t.a, title: "renomeada" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("renomeada");
    const ifId = t.run({ type: "wrap", id: t.b, kind: "if" }); fails(() => apply(t.p, { type: "rename", id: ifId, title: "x" }), "invalid");
    fails(() => apply(t.p, { type: "rename", id: t.a, title: "  " }), "invalid");
  });
  it("addChild em função: no fim; função folha vira composta", () => {
    const t = base(); const x = t.run({ type: "addChild", id: t.a, title: "a1" });
    expect(locate(t.p, t.a)!.node.kids.map(k => k.id)).toEqual([x]); expect(t.rootKids()).toEqual(["fa", "fb", "fc", "fd"]);
    const y = t.run({ type: "addChild", id: t.root, title: "e" }); expect(t.rootKids().at(-1)).toBe("e"); expect(y).toBeTruthy();
  });
  it("addSibling entra logo depois, na mesma lista; a raiz não ganha irmão", () => {
    const t = base(); t.run({ type: "addSibling", id: t.b, title: "b2" }); expect(t.rootKids()).toEqual(["fa", "fb", "b2", "fc", "fd"]);
    t.run({ type: "addSibling", id: t.b, title: "b0", before: true }); expect(t.rootKids()).toEqual(["fa", "b0", "fb", "b2", "fc", "fd"]);
    fails(() => apply(t.p, { type: "addSibling", id: t.root }), "root");
  });
  it("remove tira a subárvore; a raiz não pode ser removida; blocos vazios somem", () => {
    const t = base(); const ifId = t.run({ type: "wrap", id: t.b, kind: "if" });
    t.run({ type: "remove", id: t.a }); expect(t.rootKids()).toEqual(["if", "fc", "fd"]);
    t.run({ type: "remove", id: t.b }); expect(locate(t.p, ifId)).toBeNull();
    fails(() => apply(t.p, { type: "remove", id: t.root }), "root");
    fails(() => apply(t.p, { type: "remove", id: "zzz" }), "not_found");
  });
});

describe.each(kinds)("bloco %s: regras compartilhadas", kind => {
  const mk = () => { const t = base(), id = t.run({ type: "wrap", id: t.b, kind }); return Object.assign(t, { id }); };
  it("wrap cerca a função e mantém a posição", () => {
    const t = mk(); expect(t.rootKids()).toEqual(["fa", kind, "fc", "fd"]); expect(locate(t.p, t.b)!.parent!.id).toBe(t.id); expect(insideBlock(t.p, t.b)).toBe(true);
  });
  it("addChild entra na PRIMEIRA posição do bloco (o lugar do cabeçalho)", () => {
    const t = mk(); t.run({ type: "addChild", id: t.id, title: "n" }); expect(t.titles(t.kids(t.id))).toEqual(["n", "fb"]);
  });
  it("addSibling no bloco = irmão à direita, FORA do bloco", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.id, title: "x" }); expect(t.rootKids()).toEqual(["fa", kind, "x", "fc", "fd"]); expect(t.titles(t.kids(t.id))).toEqual(["fb"]);
  });
  it("irmão de quem está dentro do bloco continua dentro do bloco", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.b, title: "y" }); expect(t.titles(t.kids(t.id))).toEqual(["fb", "y"]);
  });
  it("setScope aumenta (adota os seguintes) e diminui (devolve os últimos para fora)", () => {
    const t = mk(); t.run({ type: "setScope", id: t.id, count: 3 }); expect(t.titles(t.kids(t.id))).toEqual(["fb", "fc", "fd"]); expect(t.rootKids()).toEqual(["fa", kind]);
    t.run({ type: "setScope", id: t.id, count: 1 }); expect(t.titles(t.kids(t.id))).toEqual(["fb"]); expect(t.rootKids()).toEqual(["fa", kind, "fc", "fd"]);
    t.run({ type: "setScope", id: t.id, count: 0 }); expect(t.kids(t.id).length).toBe(1);        // nunca esvazia
    t.run({ type: "setScope", id: t.id, count: 99 }); expect(t.kids(t.id).length).toBe(3);        // limitado ao que existe
  });
  it("exitScope tira o item e os seguintes do bloco, para depois dele", () => {
    const t = mk(); t.run({ type: "addSibling", id: t.b, title: "b2" }); t.run({ type: "addSibling", id: t.b, title: "b3" });
    const b3 = t.kids(t.id)[1]!.id; t.run({ type: "exitScope", id: b3 });   // [B, B3, B2]: sai B3 e a seguinte (B2)
    expect(t.titles(t.kids(t.id))).toEqual(["fb"]); expect(t.rootKids()).toEqual(["fa", kind, "b3", "b2", "fc", "fd"]);
    fails(() => apply(t.p, { type: "exitScope", id: t.a }), "invalid");
  });
  it("exitScope do primeiro item esvazia e remove o bloco", () => {
    const t = mk(); t.run({ type: "exitScope", id: t.b }); expect(locate(t.p, t.id)).toBeNull(); expect(t.rootKids()).toEqual(["fa", "fb", "fc", "fd"]);
  });
  it("unwrap devolve os filhos à lista de fora; remover o último filho remove o bloco", () => {
    const t = mk(); t.run({ type: "addChild", id: t.id, title: "n" }); t.run({ type: "unwrap", id: t.id }); expect(t.rootKids()).toEqual(["fa", "n", "fb", "fc", "fd"]);
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
    const e1 = t.run({ type: "addElse", id: i, title: "e1" }); expect(t.titles(node().elseKids)).toEqual(["e1"]); expect(locate(t.p, e1)!.slot).toBe("else"); expect(locate(t.p, e1)!.parent!.id).toBe(i);
    fails(() => apply(t.p, { type: "addElse", id: i }), "invalid"); fails(() => apply(t.p, { type: "addElse", id: t.a }), "invalid");
    t.run({ type: "addChild", id: i, else: true, title: "e0" }); expect(t.titles(node().elseKids)).toEqual(["e0", "e1"]);   // primeira posição do else
    t.run({ type: "addChild", id: i, title: "t0" }); expect(t.titles(node().kids)).toEqual(["t0", "fb"]); expect(t.titles(node().elseKids)).toEqual(["e0", "e1"]);
    t.run({ type: "addSibling", id: e1, title: "e2" }); expect(t.titles(node().elseKids)).toEqual(["e0", "e1", "e2"]);                    // irmão de quem está no else fica no else
    t.run({ type: "exitScope", id: e1 }); expect(t.titles(node().elseKids)).toEqual(["e0"]); expect(t.rootKids()).toEqual(["fa", "if", "e1", "e2", "fc", "fd"]);
    t.run({ type: "remove", id: node().elseKids[0]!.id }); expect(node().elseKids).toEqual([]);                                            // else vazio some
    t.run({ type: "addElse", id: i }); t.run({ type: "removeElse", id: i }); expect(node().elseKids).toEqual([]); fails(() => apply(t.p, { type: "removeElse", id: t.a }), "invalid");
  });
  it("desfazer o if descarta o else; remover o último filho do if remove o if inteiro", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.b, kind: "if" }); t.run({ type: "addElse", id: i }); t.run({ type: "unwrap", id: i }); expect(t.rootKids()).toEqual(["fa", "fb", "fc", "fd"]);
    const j = t.run({ type: "wrap", id: t.b, kind: "if" }); t.run({ type: "addElse", id: j }); t.run({ type: "remove", id: t.b }); expect(locate(t.p, j)).toBeNull();
  });
  it("try nasce com um catch contendo a função de tratamento; addChild catch entra na primeira posição do catch", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.b, kind: "try" }); const node = () => locate(t.p, tr)!.node as { catchKids: Node[] };
    expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["handleError"]);
    t.run({ type: "addChild", id: tr, catch: true, title: "primeiroDoCatch" }); expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["primeiroDoCatch", "handleError"]);
    const h = node().catchKids[1]!.id; t.run({ type: "addSibling", id: h, title: "depois" }); expect(node().catchKids.map(k => (k as Fn).title)).toEqual(["primeiroDoCatch", "handleError", "depois"]);
    t.run({ type: "exitScope", id: h }); expect(t.rootKids()).toEqual(["fa", "try", "handleError", "depois", "fc", "fd"]);
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
    const t = base(); t.run({ type: "assign", id: t.a, agent: "math" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("random");
    t.run({ type: "setTask", id: t.a, task: "round" }); expect((locate(t.p, t.a)!.node as Fn).title).toBe("round"); fails(() => apply(t.p, { type: "setTask", id: t.a, task: "voar" }), "invalid");
    t.run({ type: "assign", id: t.b, agent: "lia" }); expect((locate(t.p, t.b)!.node as Fn)).toMatchObject({ title: "fb", agent: "lia" });
    t.run({ type: "assign", id: t.b, agent: null }); expect((locate(t.p, t.b)!.node as Fn).agent).toBeNull(); fails(() => apply(t.p, { type: "assign", id: t.b, agent: "nao-existe" }), "not_found");
  });
  it("setResp: só pessoa; trocar de IA para outro responsável limpa a pessoa", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "lia" }); t.run({ type: "setResp", id: t.a, resp: "ana" }); expect((locate(t.p, t.a)!.node as Fn).resp).toBe("ana");
    fails(() => apply(t.p, { type: "setResp", id: t.a, resp: "lia" }), "invalid"); t.run({ type: "assign", id: t.a, agent: "math" }); expect((locate(t.p, t.a)!.node as Fn).resp).toBeNull();
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
    const id = s.dispatch({ type: "addChild", id: t.a, title: "x" }); expect(id).toBeTruthy(); expect(n).toBe(1); expect(s.canUndo).toBe(true);
    s.undo(); expect(locate(s.project, t.a)!.node.kids.length).toBe(0); expect(s.canRedo).toBe(true); s.redo(); expect(locate(s.project, t.a)!.node.kids.length).toBe(1);
    s.dispatch({ type: "rename", id: t.a, title: "z" }); expect(s.canRedo).toBe(false); off(); s.undo(); expect(n).toBe(4);
    let seen = 0; walk(s.project.flows[0]!.kids, () => seen++); expect(seen).toBeGreaterThan(0);
  });
});

describe("fluxos: excluir", () => {
  it("removeFlow exclui só fluxos inteiros e o projeto sempre mantém um", () => {
    const t = base(); const f2 = t.run({ type: "newFlow", title: "outro" }); expect(t.p.flows).toHaveLength(2);
    fails(() => apply(t.p, { type: "removeFlow", id: t.a }), "invalid");                       // função, não fluxo
    t.run({ type: "removeFlow", id: f2 }); expect(t.p.flows.map(f => f.title)).toEqual(["root"]); fails(() => apply(t.p, { type: "removeFlow", id: t.root }), "invalid");   // o último fica
    fails(() => apply(t.p, { type: "removeFlow", id: "zzz" }), "not_found");
  });
});

describe("cadastro de responsáveis", () => {
  it("addAgent: lib (com funções), pessoa e IA; valida tipo, nome repetido e funções da lib", () => {
    const t = base(); const lib = t.run({ type: "addAgent", kind: "maquina", name: "node:zlib", tasks: "gzip, gunzip, gzip" }); const pe = t.run({ type: "addAgent", kind: "pessoa", name: "Maria", tasks: "ignorado" }); const ia = t.run({ type: "addAgent", kind: "ia", name: "Redator" });
    const find = (id: string) => t.p.agents.find(a => a.id === id)!; expect(find(lib)).toMatchObject({ kind: "maquina", name: "node:zlib", tasks: ["gzip", "gunzip"], contracts: { gzip: { ins: ["input"], outs: ["result"] } } }); expect(find(pe)).toMatchObject({ kind: "pessoa", tasks: [] }); expect(find(ia).kind).toBe("ia");
    fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "NODE:ZLIB", tasks: "x" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "node:vm" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "robo", name: "x" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "pessoa", name: " " }), "invalid");
    t.run({ type: "assign", id: t.a, agent: lib }); expect((locate(t.p, t.a)!.node as Fn)).toMatchObject({ agent: lib, title: "gzip", ins: ["input"], outs: ["result"] });   // o responsável novo já serve, com o contrato padrão
  });
  it("removeAgent tira o responsável e solta as funções que o usavam", () => {
    const t = base(); const ia = t.run({ type: "addAgent", kind: "ia", name: "Redator" }), pe = t.run({ type: "addAgent", kind: "pessoa", name: "Maria" });
    t.run({ type: "assign", id: t.a, agent: ia }); t.run({ type: "setResp", id: t.a, resp: pe }); t.run({ type: "removeAgent", id: ia }); t.run({ type: "removeAgent", id: pe });
    expect(locate(t.p, t.a)!.node).toMatchObject({ agent: null, resp: null }); expect(t.p.agents.some(a => a.id === ia || a.id === pe)).toBe(false); fails(() => apply(t.p, { type: "removeAgent", id: "zzz" }), "not_found");
  });
});

describe("salvar e abrir (serialize / parseProject)", () => {
  const rich = () => { const t = base(); const i = t.run({ type: "wrap", id: t.b, kind: "if", test: "ok" }); t.run({ type: "addElse", id: i }); t.run({ type: "wrap", id: t.c, kind: "try" }); t.run({ type: "wrap", id: t.d, kind: "for", v: "n", coll: "xs" });
    t.run({ type: "assign", id: t.a, agent: "web" }); t.run({ type: "setArg", id: t.a, name: "url", value: '"https://x.com"' }); t.run({ type: "renameData", id: t.a, to: "dado" }); t.run({ type: "addInput", id: t.d, name: "x" }); t.run({ type: "addOutput", id: t.d, name: "y" }); t.run({ type: "addAgent", kind: "maquina", name: "node:zlib", tasks: "gzip(data) -> comprimido" }); t.run({ type: "setParallel", id: t.b, on: false }); return t; };
  it("ida e volta preserva o projeto inteiro (blocos, else, catch, data, responsáveis)", () => { const t = rich(); expect(parseProject(serialize(t.p))).toEqual(t.p); });
  it("depois de abrir, os ids novos não colidem com os existentes", () => { const t = rich(), q = parseProject(serialize(t.p)); const ids = new Set<string>(); walk(q.flows[0]!.kids, n => ids.add(n.id)); const r = apply(q, { type: "addChild", id: q.flows[0]!.id }); expect(ids.has(r.created!)).toBe(false); });
  it("recusa arquivo inválido com mensagem clara", () => {
    const t = rich(), good = JSON.parse(serialize(t.p)); const bad = (mut: (g: any) => void): string => { const g = structuredClone(good); mut(g); try { parseProject(JSON.stringify(g)); return "ok"; } catch (e) { return (e as Error).message; } };
    expect(() => parseProject("{ não é json")).toThrow(/valid JSON/); expect(() => parseProject("{}")).toThrow(/not a Flow project/);
    expect(bad(g => { g.version = 9; })).toMatch(/Version 9/); expect(bad(g => { g.project.flows = []; })).toMatch(/no flow/); expect(bad(g => { g.project.flows[0].kids[0].id = g.project.flows[0].id; })).toMatch(/Duplicate id/);
    expect(bad(g => { g.project.flows[0].kids[0].t = "while"; })).toMatch(/nknown/); expect(bad(g => { g.project.flows[0].kids[0].agent = "fantasma"; })).toMatch(/does not exist/); expect(bad(g => { delete g.project.flows[0].kids[0].title; })).toMatch(/without a name|nknown/);
    expect(bad(g => { g.project.agents[0].kind = "robo"; })).toMatch(/Invalid source/); expect(bad(g => { g.project.flows[0].kids[0].ins = "x"; })).toMatch(/list of texts/); expect(bad(() => undefined)).toBe("ok");
  });
  it("Store.load troca o projeto e zera o histórico", () => { const t = base(), s = new Store(t.p); s.dispatch({ type: "addChild", id: t.a }); expect(s.canUndo).toBe(true); let n = 0; s.subscribe(() => n++); s.load(emptyProject("novo")); expect(s.project.name).toBe("novo"); expect(s.canUndo).toBe(false); expect(n).toBe(1); });
});

describe("funções de lib: contrato (entradas e saídas)", () => {
  it("parseSignature lê nome(entradas) -> saídas; só o nome vira entrada → result; lixo é recusado", () => {
    expect(parseSignature("log(text)")).toEqual({ task: "log", contract: { ins: ["text"], outs: [] } }); expect(parseSignature("max(a, b) -> result")).toEqual({ task: "max", contract: { ins: ["a", "b"], outs: ["result"] } });
    expect(parseSignature("now() -> agora")).toEqual({ task: "now", contract: { ins: [], outs: ["agora"] } }); expect(parseSignature("gzip")).toEqual({ task: "gzip", contract: { ins: ["input"], outs: ["result"] } });
    expect(parseSignature("123 inválido")).toBeNull(); expect(parseSignature("")).toBeNull();
  });
  it("escolher uma função da lib traz as entradas (abstratas) e saídas do contrato; trocar de função troca o contrato e guarda o que já foi preenchido", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "console" }); const f = () => locate(t.p, t.a)!.node as Fn;
    expect(f()).toMatchObject({ title: "log", ins: ["text"], outs: [] }); expect(contractOf(t.p, f())).toEqual({ ins: ["text"], outs: [] });
    t.run({ type: "setArg", id: t.a, name: "text", value: '"Olá"' }); t.run({ type: "setTask", id: t.a, task: "error" }); expect(f()).toMatchObject({ title: "error", ins: ["text"], args: { text: '"Olá"' } });   // mesma entrada: value mantido
    t.run({ type: "setTask", id: t.a, task: "table" }); expect(f()).toMatchObject({ title: "table", ins: ["data"] }); expect(f().args).toBeUndefined();                                            // entrada diferente: volta a ficar abstrata
    t.run({ type: "assign", id: t.a, agent: "math" }); t.run({ type: "setTask", id: t.a, task: "max" }); expect(f()).toMatchObject({ ins: ["a", "b"], outs: ["result"] });
    t.run({ type: "assign", id: t.a, agent: "lia" }); expect(f().args).toBeUndefined(); expect(contractOf(t.p, f())).toBeNull();   // IA não tem contrato de lib
  });
  it("as entradas e saídas de uma função de lib vêm do contrato: não dá para adicionar nem remover à mão", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "console" });
    for (const type of ["addInput", "removeInput", "addOutput", "removeOutput"] as const) fails(() => apply(t.p, { type, id: t.a, name: "x" }), "invalid");
  });
  it("setArg preenche (value fixo ou dado), limpa com vazio e valida", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "math" }); t.run({ type: "setTask", id: t.a, task: "max" }); const f = () => locate(t.p, t.a)!.node as Fn;
    t.run({ type: "setArg", id: t.a, name: "a", value: " 10 " }); t.run({ type: "setArg", id: t.a, name: "b", value: "nome" }); expect(f().args).toEqual({ a: "10", b: "nome" });
    t.run({ type: "setArg", id: t.a, name: "a", value: "" }); expect(f().args).toEqual({ b: "nome" }); t.run({ type: "setArg", id: t.a, name: "b", value: "" }); expect(f().args).toBeUndefined();
    fails(() => apply(t.p, { type: "setArg", id: t.a, name: "naoexiste", value: "x" }), "not_found"); fails(() => apply(t.p, { type: "setArg", id: t.b, name: "x", value: "y" }), "not_found");   // a função b não tem a entrada x fails(() => apply(t.p, { type: "setArg", id: t.a, name: "a", value: "x".repeat(301) }), "invalid");
  });
  it("renameData dá nome ao dado que a lib devolve (só quando é um); o novo nome liga a próxima função", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "date" }); t.run({ type: "setTask", id: t.a, task: "now" }); t.run({ type: "renameData", id: t.a, to: "agora" }); expect((locate(t.p, t.a)!.node as Fn).outs).toEqual(["agora"]);
    fails(() => apply(t.p, { type: "renameData", id: t.a, to: "nome inválido" }), "invalid"); fails(() => apply(t.p, { type: "renameData", id: t.b, to: "x" }), "invalid");
    t.run({ type: "assign", id: t.c, agent: "console" }); fails(() => apply(t.p, { type: "renameData", id: t.c, to: "x" }), "invalid");          // log não devolve nada
  });
  it("renameData na entrada única da lib: referência que a função pai usa (text → input)", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "console" }); t.run({ type: "setArg", id: t.a, name: "text", value: '"hi"' });
    t.run({ type: "renameData", id: t.a, side: "in", to: "input" }); const f = locate(t.p, t.a)!.node as Fn;
    expect(f.ins).toEqual(["input"]); expect(f.args).toEqual({ input: '"hi"' });
    fails(() => apply(t.p, { type: "renameData", id: t.b, side: "in", to: "x" }), "invalid");   // abstrata
    t.run({ type: "assign", id: t.b, agent: "math" }); t.run({ type: "setTask", id: t.b, task: "max" });
    fails(() => apply(t.p, { type: "renameData", id: t.b, side: "in", to: "x" }), "invalid");   // max tem 2 params no contrato
  });
  it("entrada opcional (nome?) não é exigida do state; o contrato guarda quais são", () => {
    expect(parseSignature("fetch(url, options?) -> response")).toEqual({ task: "fetch", contract: { ins: ["url", "options"], outs: ["response"], optional: ["options"] } });
    const t = base(); t.run({ type: "assign", id: t.a, agent: "web" }); expect(contractOf(t.p, locate(t.p, t.a)!.node as Fn)).toMatchObject({ ins: ["url", "options"], optional: ["options"] });
  });
  it("addAgent aceita contratos por assinatura (nome(entradas) -> saídas; separadas por ;) e valida os nomes", () => {
    const t = base(); const id = t.run({ type: "addAgent", kind: "maquina", name: "node:zlib", tasks: "gzip(data) -> comprimido; gunzip(data, nivel) -> original" }); const ag = t.p.agents.find(a => a.id === id)!;
    expect(ag.tasks).toEqual(["gzip", "gunzip"]); expect(ag.contracts).toEqual({ gzip: { ins: ["data"], outs: ["comprimido"] }, gunzip: { ins: ["data", "nivel"], outs: ["original"] } });
    fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "x", tasks: "ok(a b) -> c" }), "invalid"); fails(() => apply(t.p, { type: "addAgent", kind: "maquina", name: "y", tasks: "9 ruim" }), "invalid");
  });
  it("o contrato e os values preenchidos sobrevivem a salvar e abrir; contrato inválido no arquivo é recusado", () => {
    const t = base(); t.run({ type: "assign", id: t.a, agent: "math" }); t.run({ type: "setTask", id: t.a, task: "max" }); t.run({ type: "setArg", id: t.a, name: "a", value: "7" });
    const q = parseProject(serialize(t.p)); expect(q).toEqual(t.p); expect((locate(q, t.a)!.node as Fn).args).toEqual({ a: "7" });
    const g = JSON.parse(serialize(t.p)); g.project.agents.find((a: { id: string }) => a.id === "math").contracts.max.ins = "x"; expect(() => parseProject(JSON.stringify(g))).toThrow(/list of texts/);
  });
});

describe("projetos salvos antes das libs do navegador (migração)", () => {
  const old = () => JSON.stringify({ format: "flow-novo", version: 1, project: { name: "Antigo", seq: 9, agents: [
    { id: "console", kind: "maquina", name: "node:console", tasks: ["log", "table"] }, { id: "http", kind: "maquina", name: "node:http", tasks: ["get", "post"] }, { id: "lia", kind: "ia", name: "Lia", tasks: [] }, { id: "meu", kind: "maquina", name: "node:zlib", tasks: ["gzip"], contracts: { gzip: { ins: ["data"], outs: ["comprimido"] } } }],
    flows: [{ t: "fn", id: "n1", title: "main", agent: null, resp: null, ins: [], outs: [], par: false, kids: [
      { t: "fn", id: "n2", title: "log", agent: "console", resp: null, ins: [], outs: [], kids: [], par: false },
      { t: "fn", id: "n3", title: "get", agent: "http", resp: null, ins: ["x"], outs: ["y"], kids: [], par: false },
      { t: "fn", id: "n4", title: "gzip", agent: "meu", resp: null, ins: ["data"], outs: ["comprimido"], kids: [], par: false }] }] } });
  it("troca as libs do Node pelas do navegador (mesmo id), solta quem usava as que saíram e completa o contrato", () => {
    const p = parseProject(old()), find = (id: string) => locate(p, id)!.node as Fn;
    expect(p.agents.find(a => a.id === "console")).toMatchObject({ name: "console", contracts: { log: { ins: ["text"], outs: [] } } }); expect(p.agents.some(a => a.id === "http")).toBe(false);
    expect(find("n2")).toMatchObject({ agent: "console", title: "log", ins: ["text"] }); expect(find("n3")).toMatchObject({ agent: null, title: "get" });   // a lib saiu: a função fica sem responsável, com o nome
    expect(p.agents.find(a => a.id === "meu")!.name).toBe("node:zlib");                                                                        // lib do usuário não é tocada
    for (const n of ["Math", "JSON", "Date", "performance", "globalThis", "crypto"]) expect(p.agents.some(a => a.name === n), n).toBe(true);   // as libs novas aparecem
  });
  it("o código gerado pelo projeto migrado não tem import nem tipos no modo navegador (módulo vira import dinâmico)", async () => {
    const { generate } = await import("../../novo/codegen"), p = parseProject(old()), g = generate(p, "n1", { js: true });
    expect(g.code).not.toMatch(/^import /m); expect(g.code).toContain('const node_zlib = await import("node:zlib");'); expect(g.code).not.toContain("node_console");
  });
  it("migrar duas vezes dá o mesmo result (idempotente)", () => { const p = parseProject(old()); expect(parseProject(serialize(p))).toEqual(p); });
});

describe("estados disponíveis no contexto de uma função (o que a caixa de edição oferece)", () => {
  const flow = () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "x" }); t.run({ type: "addOutput", id: t.b, name: "y" }); t.run({ type: "addOutput", id: t.b, name: "y2" }); t.run({ type: "addOutput", id: t.d, name: "z" });
    const f = t.run({ type: "wrap", id: t.b, kind: "for", v: "item", coll: "xs" }); t.run({ type: "setScope", id: f, count: 2 }); return { ...t, f, st: (id: string) => statesFor(t.p, id).map(s => s.name) };
  };
  it("só o que vem antes: saídas das funções anteriores e as variáveis dos for que cercam a função", () => {
    const t = flow(); expect(t.st(t.a)).toEqual([]); expect(t.st(t.b)).toEqual(["x", "item"]); expect(t.st(t.c)).toEqual(["x", "y", "y2", "item"]);
    expect(t.st(t.d)).toEqual(["x", "y", "y2"]);                       // fora do for: a variável item não vale
    const s = statesFor(t.p, t.d); expect(s.map(r => r.from)).toEqual(["fa", "fb", "fb"]); expect(statesFor(t.p, t.c).at(-1)).toEqual({ name: "item", from: "for", kind: "loop" });
  });
  it("funções dentro de composta, do if/else e do catch também contam; raiz e id desconhecido não têm estados", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "x" }); const k = t.run({ type: "addChild", id: t.b, title: "filho" }); t.run({ type: "addOutput", id: k, name: "k" });
    const i = t.run({ type: "wrap", id: t.c, kind: "if", test: "ok" }); const e = t.run({ type: "addElse", id: i, title: "senao" }); t.run({ type: "addOutput", id: e, name: "e" });
    expect(statesFor(t.p, t.d).map(s => s.name)).toEqual(["x", "k", "e"]); expect(statesFor(t.p, t.root)).toEqual([]); expect(statesFor(t.p, "zzz")).toEqual([]);
  });
  it("sem repetir nomes e sem as saídas da própria função", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "dup" }); t.run({ type: "addOutput", id: t.b, name: "dup" }); t.run({ type: "addOutput", id: t.c, name: "mine" });
    expect(statesFor(t.p, t.c).map(s => s.name)).toEqual(["dup"]);
  });
});

describe("nome = referência no fluxo", () => {
  it("renomear o pai (origem) atualiza consumidores, args e if/for", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "x" }); t.run({ type: "addInput", id: t.b, name: "x" }); t.run({ type: "setArg", id: t.b, name: "x", value: "x + 1" });
    const i = t.run({ type: "wrap", id: t.c, kind: "if", test: "x > 0" });
    t.run({ type: "renameIo", id: t.a, side: "out", from: "x", to: "score" });
    expect((locate(t.p, t.a)!.node as Fn).outs).toEqual(["score"]);
    expect((locate(t.p, t.b)!.node as Fn)).toMatchObject({ ins: ["score"], args: { score: "score + 1" } });
    expect((locate(t.p, i)!.node as { test: string }).test).toBe("score > 0");
  });
  it("renomear o filho desvincula do pai (pai mantém o nome)", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "teste" }); t.run({ type: "addInput", id: t.b, name: "teste" });
    t.run({ type: "addOutput", id: t.b, name: "teste" }); t.run({ type: "addInput", id: t.c, name: "teste" });
    t.run({ type: "renameIo", id: t.c, side: "in", from: "teste", to: "outro" });
    expect((locate(t.p, t.a)!.node as Fn).outs).toEqual(["teste"]);
    expect((locate(t.p, t.b)!.node as Fn)).toMatchObject({ ins: ["teste"], outs: ["teste"] });
    expect((locate(t.p, t.c)!.node as Fn).ins).toEqual(["outro"]);
  });
  it("entrada para nome já usado: só reassocia o porto (referência); não renomeia o produtor", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "score" }); t.run({ type: "addInput", id: t.b, name: "x" });
    t.run({ type: "renameIo", id: t.b, side: "in", from: "x", to: "score" });
    expect((locate(t.p, t.a)!.node as Fn).outs).toEqual(["score"]);
    expect((locate(t.p, t.b)!.node as Fn)).toMatchObject({ ins: ["score"] });
    expect((locate(t.p, t.b)!.node as Fn).args).toBeUndefined();
  });
  it("entrada-pai (literal) não pode tomar nome de outro dado", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "score" }); t.run({ type: "addInput", id: t.b, name: "x" }); t.run({ type: "setArg", id: t.b, name: "x", value: "1" });
    fails(() => apply(t.p, { type: "renameIo", id: t.b, side: "in", from: "x", to: "score" }), "invalid");
  });
  it("saída-filho não pode tomar nome de dado já existente", () => {
    const t = base(); t.run({ type: "addOutput", id: t.a, name: "text" }); t.run({ type: "addOutput", id: t.b, name: "result" });
    fails(() => apply(t.p, { type: "renameIo", id: t.b, side: "out", from: "result", to: "text" }), "invalid");
  });
  it("saída na origem pode igualar a própria entrada (mesmo dado)", () => {
    const t = base(); t.run({ type: "addInput", id: t.a, name: "text" }); t.run({ type: "setArg", id: t.a, name: "text", value: '"hi"' });
    t.run({ type: "addOutput", id: t.a, name: "result" });
    t.run({ type: "renameIo", id: t.a, side: "out", from: "result", to: "text" });
    expect((locate(t.p, t.a)!.node as Fn)).toMatchObject({ ins: ["text"], outs: ["text"] });
  });
  it("função abstrata: nome único no fluxo; lib pode repetir a task", () => {
    const t = base(); t.run({ type: "rename", id: t.a, title: "passo" });
    fails(() => apply(t.p, { type: "rename", id: t.b, title: "passo" }), "invalid");
    t.run({ type: "rename", id: t.a, title: "etapa" });
    expect((locate(t.p, t.a)!.node as Fn).title).toBe("etapa"); expect((locate(t.p, t.b)!.node as Fn).title).toBe("fb");
    t.run({ type: "assign", id: t.c, agent: "console" }); t.run({ type: "assign", id: t.d, agent: "console" });
    expect((locate(t.p, t.c)!.node as Fn).title).toBe("log"); expect((locate(t.p, t.d)!.node as Fn).title).toBe("log");
    t.run({ type: "rename", id: t.c, title: "info" }); expect((locate(t.p, t.c)!.node as Fn).title).toBe("info"); expect((locate(t.p, t.d)!.node as Fn).title).toBe("log");
  });
  it("esquerda (origem) propaga; direita (referência) só muda o porto local", () => {
    const t = base();
    t.run({ type: "addInput", id: t.a, name: "teste" }); t.run({ type: "setArg", id: t.a, name: "teste", value: '{ field1: "aaa" }' });
    t.run({ type: "addOutput", id: t.a, name: "output" }); t.run({ type: "addInput", id: t.b, name: "teste" });
    expect(resolveDataOrigin(t.p, t.b, "in")).toEqual({ id: t.a, side: "in" });
    // direita: renomeia só o filho
    t.run({ type: "renameIo", id: t.b, side: "in", from: "teste", to: "outro" });
    expect((locate(t.p, t.a)!.node as Fn)).toMatchObject({ ins: ["teste"], args: { teste: '{ field1: "aaa" }' } });
    expect((locate(t.p, t.b)!.node as Fn).ins).toEqual(["outro"]);
    // esquerda: propaga o nome a todos
    t.run({ type: "addInput", id: t.c, name: "teste" });
    t.run({ type: "renameIo", id: t.a, side: "in", from: "teste", to: "base" });
    expect((locate(t.p, t.a)!.node as Fn).ins).toEqual(["base"]);
    expect((locate(t.p, t.c)!.node as Fn).ins).toEqual(["base"]);
    expect((locate(t.p, t.b)!.node as Fn).ins).toEqual(["outro"]);   // já desvinculado
    // direita: valor local não altera a origem
    t.run({ type: "setArg", id: t.b, name: "outro", value: '{ field1: "bbb" }' });
    expect((locate(t.p, t.a)!.node as Fn).args?.base).toBe('{ field1: "aaa" }');
    expect((locate(t.p, t.b)!.node as Fn).args?.outro).toBe('{ field1: "bbb" }');
  });
});

describe("valores também em função abstrata (setArg / setData)", () => {
  it("setArg vale para qualquer função com a entrada; o valor acompanha renomear e some ao remover a entrada", () => {
    const t = base(); t.run({ type: "addInput", id: t.a, name: "preco" }); t.run({ type: "setArg", id: t.a, name: "preco", value: "10" }); const f = () => locate(t.p, t.a)!.node as Fn;
    expect(f().args).toEqual({ preco: "10" }); fails(() => apply(t.p, { type: "setArg", id: t.a, name: "outro", value: "1" }), "not_found");
    t.run({ type: "renameIo", id: t.a, side: "in", from: "preco", to: "valor" }); expect(f().args).toEqual({ valor: "10" }); t.run({ type: "removeInput", id: t.a, name: "valor" }); expect(f().args).toBeUndefined();
  });
  it("trocar de responsável mantém os valores das entradas que continuam existindo", () => {
    const t = base(); t.run({ type: "addInput", id: t.a, name: "x" }); t.run({ type: "setArg", id: t.a, name: "x", value: '"a"' }); t.run({ type: "assign", id: t.a, agent: "lia" }); expect((locate(t.p, t.a)!.node as Fn).args).toEqual({ x: '"a"' });
  });
  it("setData troca os nomes e os valores de um lado de uma vez (só função comum)", () => {
    const t = base(); const f = () => locate(t.p, t.a)!.node as Fn;
    t.run({ type: "setData", id: t.a, side: "in", names: ["a", "b"], values: ['"x"', ""] }); expect(f()).toMatchObject({ ins: ["a", "b"], args: { a: '"x"' } });
    t.run({ type: "setData", id: t.a, side: "in", names: ["b"], values: ["2"] }); expect(f()).toMatchObject({ ins: ["b"], args: { b: "2" } }); t.run({ type: "setData", id: t.a, side: "out", names: ["r", "s"] }); expect(f().outs).toEqual(["r", "s"]);
    t.run({ type: "setData", id: t.a, side: "in", names: [], values: [] }); expect(f().ins).toEqual([]); expect(f().args).toBeUndefined();
    fails(() => apply(t.p, { type: "setData", id: t.a, side: "in", names: ["a", "a"], values: [] }), "invalid"); fails(() => apply(t.p, { type: "setData", id: t.a, side: "in", names: ["class"], values: [] }), "invalid");
    fails(() => apply(t.p, { type: "setData", id: t.a, side: "in", names: ["a"], values: ["x".repeat(301)] }), "invalid"); t.run({ type: "assign", id: t.b, agent: "console" }); fails(() => apply(t.p, { type: "setData", id: t.b, side: "in", names: ["a"], values: [] }), "invalid");
  });
});
