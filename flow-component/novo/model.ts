/**
 * Modelo do Flow (versão nova, do zero).
 *
 * O fluxo é uma ÁRVORE: função (fn) ou bloco (if · for · try), e todo bloco guarda os filhos numa lista.
 * "Being inside de um bloco" = estar na lista dele, então as regras valem igual para todos os blocos e nada
 * precisa de marcas soltas (inLoop, inCatch, onError…): inserir, sair, ampliar e reduzir escopo são operações
 * sobre listas.
 */
export type AgentKind = "maquina" | "ia" | "pessoa";
/** Contrato de uma função de lib: as entradas (parâmetros, nesta ordem) e as saídas. Um lado com 1 nome é um dado (quadrado); com vários é um objeto (cubo). */
export interface Contract { ins: string[]; outs: string[]; /** Entradas opcionais (escritas com ? na assinatura): não são exigidas do state. */ optional?: string[] }
export interface Agent { id: string; kind: AgentKind; name: string; tasks: string[]; /** Contratos das funções da lib (por nome). */ contracts?: Record<string, Contract> }

/** `args`: valor de cada entrada de uma função de lib — um texto/expressão fixa (ex.: "Olá") ou o nome de um dado produzido antes. */
export interface Fn { t: "fn"; id: string; title: string; agent: string | null; resp: string | null; ins: string[]; outs: string[]; kids: Node[]; par: boolean; args?: Record<string, string> }
/** `elseKids` vazio = sem else; com filhos o else aparece no flow como o catch do try (cabeçalho, faixa e lista própria). */
export interface IfB { t: "if"; id: string; test: string; kids: Node[]; elseKids: Node[] }
export interface ForB { t: "for"; id: string; v: string; coll: string; kids: Node[] }
export interface TryB { t: "try"; id: string; kids: Node[]; catchKids: Node[] }
export type Block = IfB | ForB | TryB;
export type Node = Fn | Block;
export type BlockKind = Block["t"];

export interface Project { name: string; flows: Fn[]; agents: Agent[]; seq: number }

export class FlowError extends Error {
  constructor(readonly code: "invalid" | "not_found" | "root", message: string) { super(message); }
}
const fail = (code: FlowError["code"], msg: string): never => { throw new FlowError(code, msg); };

// ───────────────────────── consultas ─────────────────────────
export interface Loc { node: Node; list: Node[]; index: number; parent: Block | Fn | null; slot: "kids" | "catch" | "else"; flow: Fn }

/** Acha o nó, a lista que o contém, a posição e o pai. */
export function locate(p: Project, id: string): Loc | null {
  const visit = (list: Node[], parent: Block | Fn | null, slot: "kids" | "catch" | "else", flow: Fn): Loc | null => {
    for (let i = 0; i < list.length; i++) {
      const n = list[i]!;
      if (n.id === id) return { node: n, list, index: i, parent, slot, flow };
      const sub = n.t === "try" ? visit(n.kids, n, "kids", flow) ?? visit(n.catchKids, n, "catch", flow) : n.t === "if" ? visit(n.kids, n, "kids", flow) ?? visit(n.elseKids, n, "else", flow) : visit(n.kids, n, "kids", flow);
      if (sub) return sub;
    }
    return null;
  };
  for (const f of p.flows) {
    if (f.id === id) return { node: f, list: p.flows, index: p.flows.indexOf(f), parent: null, slot: "kids", flow: f };
    const hit = visit(f.kids, f, "kids", f); if (hit) return hit;
  }
  return null;
}
export const need = (p: Project, id: string): Loc => locate(p, id) ?? fail("not_found", `Element ${id} does not exist`);
export const isRoot = (p: Project, id: string): boolean => p.flows.some(f => f.id === id);
export const agentOf = (p: Project, id: string | null): Agent | undefined => (id ? p.agents.find(a => a.id === id) : undefined);
export const isComposite = (n: Node): boolean => n.kids.length > 0;
/** Está dentro de um bloco (if/for/try/catch), não só dentro de uma função composta. */
export const insideBlock = (p: Project, id: string): boolean => { const l = locate(p, id); return !!l && !!l.parent && l.parent.t !== "fn"; };
export const kidsOf = (n: Node): Node[] => (n.t === "try" ? [...n.kids, ...n.catchKids] : n.t === "if" ? [...n.kids, ...n.elseKids] : n.kids);
/** Lista alternativa do bloco (catch do try, else do if). */
export const altKids = (n: Node): Node[] | null => (n.t === "try" ? n.catchKids : n.t === "if" ? n.elseKids : null);
export function walk(list: readonly Node[], f: (n: Node) => void): void { for (const n of list) { f(n); walk(kidsOf(n), f); } }
export const fnsOf = (flow: Fn): Fn[] => { const out: Fn[] = []; walk(flow.kids, n => { if (n.t === "fn") out.push(n); }); return out; };

/** Um lado (entrada ou saída) tem UM dado (quadrado); com mais de um vira um CUBO, que agrupa os dados. */
export const isCube = (names: readonly string[]): boolean => names.length > 1;
/** Nome do cubo de uma função: `entrada_<função>` / `saida_<função>`. */
export const cubeName = (f: Fn, side: "in" | "out"): string => `${side === "in" ? "input" : "output"}_${f.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "function"}`;

/** Nome do arquivo gerado para o fluxo. */
export const slug = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "flow";
export const flowFile = (f: Fn): string => `${slug(f.title)}.ts`;

// ───────────────────────── construção ─────────────────────────
const nextId = (p: Project): string => `n${++p.seq}`;
export const newFn = (p: Project, title = "New function"): Fn => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
const ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await".split(" "));
const cleanName = (s: unknown, what: string): string => { const v = String(s ?? "").trim(); if (RESERVED.has(v)) return fail("invalid", `${what} cannot be the reserved word “${v}”`); return ident.test(v) ? v : fail("invalid", `${what} is invalid: use letters, numbers and _ (e.g. customer_data)`); };
const cleanText = (s: unknown, what: string, max = 120): string => { const v = String(s ?? "").trim(); return v && v.length <= max ? v : fail("invalid", `${what} cannot be empty`); };

export function emptyProject(name = "New project"): Project { return { name, flows: [], agents: [], seq: 0 }; }

/** Lê "nome(a, b) -> x, y" ou só "nome" (contrato padrão: entrada → resultado). */
export function parseSignature(text: string): { task: string; contract: Contract } | null {
  const m = /^\s*([A-Za-z_$][\w$]*)\s*(?:\(([^)]*)\))?\s*(?:->\s*(.*))?$/.exec(text); if (!m) return null;
  const names = (s: string | undefined): string[] => (s ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const hasSig = m[2] !== undefined || m[3] !== undefined, raw = names(m[2]), optional = raw.filter(x => x.endsWith("?")).map(x => x.slice(0, -1));
  return { task: m[1]!, contract: hasSig ? { ins: raw.map(x => x.replace(/\?$/, "")), outs: names(m[3]), ...(optional.length ? { optional } : {}) } : { ins: ["input"], outs: ["result"] } };
}
const lib = (id: string, name: string, sigs: string[]): Agent => {
  const contracts: Record<string, Contract> = {}, tasks: string[] = [];
  for (const sg of sigs) { const r = parseSignature(sg)!; tasks.push(r.task); contracts[r.task] = r.contract; }
  return { id, kind: "maquina", name, tasks, contracts };
};
/** Libs do NAVEGADOR (globais): rodam no próprio browser, num Worker, sem instalar nada. */
export const DEFAULT_AGENTS: readonly Agent[] = [
  lib("console", "console", ["log(text)", "info(text)", "warn(text)", "error(text)", "debug(text)", "table(data)"]),
  lib("math", "Math", ["random() -> number", "round(value) -> result", "floor(value) -> result", "ceil(value) -> result", "abs(value) -> result", "max(a, b) -> result", "min(a, b) -> result", "pow(base, exponent) -> result", "sqrt(value) -> result"]),
  lib("json", "JSON", ["stringify(value) -> text", "parse(text) -> value"]),
  lib("date", "Date", ["now() -> timestamp", "parse(text) -> timestamp"]),
  lib("crypto", "crypto", ["randomUUID() -> uuid"]),
  lib("perf", "performance", ["now() -> time"]),
  lib("web", "globalThis", ["fetch(url, options?) -> response", "atob(text) -> result", "btoa(text) -> result", "structuredClone(value) -> copy"]),
  { id: "lia", kind: "ia", name: "Lia", tasks: [] }, { id: "teo", kind: "ia", name: "Teo", tasks: [] }, { id: "davi", kind: "ia", name: "Davi", tasks: [] },
  { id: "ana", kind: "pessoa", name: "Ana Souza", tasks: [] }, { id: "bruno", kind: "pessoa", name: "Bruno Lima", tasks: [] },
];
/** Contrato da função de lib de `f` (ou nada, se não for uma função de lib com contrato). */
export const contractOf = (p: Project, f: Fn): Contract | null => { const a = agentOf(p, f.agent); return a?.kind === "maquina" ? a.contracts?.[f.title] ?? null : null; };
/**
 * Estados disponíveis para uma função: os dados produzidos pelas funções que rodam ANTES dela no fluxo
 * (inclusive dentro de blocos já fechados) e as variáveis dos `for` que a cercam. É o que a caixa de edição oferece.
 */
export interface StateRef { name: string; from: string; kind: "data" | "loop" }
export function statesFor(p: Project, id: string): StateRef[] {
  const l = locate(p, id); if (!l) return [];
  const out: StateRef[] = [], seen = new Set<string>(); let found = false;
  const add = (r: StateRef): void => { if (!seen.has(r.name)) { seen.add(r.name); out.push(r); } };
  const visit = (nodes: readonly Node[], loops: string[]): void => {
    for (const n of nodes) {
      if (found) return;
      if (n.id === id) { found = true; loops.forEach(v => add({ name: v, from: "for", kind: "loop" })); return; }
      if (n.t === "fn") { if (n.kids.length) visit(n.kids, loops); else if (!found) n.outs.forEach(o => add({ name: o, from: n.title, kind: "data" })); }
      else if (n.t === "for") visit(n.kids, [...loops, n.v]);
      else { visit(n.kids, loops); if (!found && n.t === "try") visit(n.catchKids, loops); if (!found && n.t === "if") visit(n.elseKids, loops); }
    }
  };
  visit(l.flow.kids, []); if (!found) return [];
  // loops: as variáveis só valem dentro do for; o `visit` acima as soma quando acha a função dentro dele
  return out.filter(r => r.kind === "data" || r.kind === "loop");
}

/** Aplica o contrato: entradas e saídas passam a ser as da lib (as entradas ficam abstratas até alguém preencher). Mantém os valores já dados às entradas de mesmo nome. */
export function applyContract(p: Project, f: Fn): void {
  const c = contractOf(p, f); if (!c) return;
  f.ins = [...c.ins]; f.outs = [...c.outs];
  if (f.args) { f.args = Object.fromEntries(Object.entries(f.args).filter(([k]) => c.ins.includes(k))); if (!Object.keys(f.args).length) delete f.args; }
}

// ───────────────────────── comandos ─────────────────────────
type Args = Record<string, unknown>;
type Handler = (p: Project, a: Args) => string | void;
const str = (a: Args, k: string): string => String(a[k] ?? "");

/** Sempre que um bloco ficar vazio ele some (sem bloco "oco"). */
function prune(list: Node[]): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const n = list[i]!;
    if (n.t !== "fn") { prune(n.kids); if (n.t === "try") prune(n.catchKids); if (n.t === "if") prune(n.elseKids); }
    else prune(n.kids);
    if (n.t !== "fn" && n.kids.length === 0) list.splice(i, 1);
  }
}
const fixRefs = (_p: Project): void => { void _p; };   // não há mais referências soltas entre nós (o else agora é uma lista)

function blockOf(kind: BlockKind, p: Project, a: Args, inner: Node): Block {
  const id = nextId(p);
  if (kind === "if") return { t: "if", id, test: a["test"] ? cleanText(a["test"], "Condition") : "condition", kids: [inner], elseKids: [] };
  if (kind === "for") return { t: "for", id, v: a["v"] ? cleanName(a["v"], "Variable") : "item", coll: a["coll"] ? cleanText(a["coll"], "Collection") : "items", kids: [inner] };
  return { t: "try", id, kids: [inner], catchKids: [newFn(p, "Handle error")] };
}

export const HANDLERS = {
  /** Novo fluxo (função raiz). */
  newFlow: (p, a) => { const f = newFn(p, a["title"] ? cleanText(a["title"], "Title", 80) : "New flow"); p.flows.push(f); return f.id; },
  /** Exclui um fluxo inteiro; o projeto sempre mantém pelo menos um. */
  removeFlow: (p, a) => {
    const l = need(p, str(a, "id")); if (!isRoot(p, l.node.id)) return fail("invalid", "Only a whole flow can be deleted");
    if (p.flows.length <= 1) return fail("invalid", "The project needs at least one flow"); p.flows.splice(l.index, 1);
  },
  /** Cadastro de responsáveis: lib do Node (com as funções dela), pessoa ou agente de IA. */
  addAgent: (p, a) => {
    const kind = str(a, "kind") as AgentKind; if (!["maquina", "ia", "pessoa"].includes(kind)) return fail("invalid", `Unknown source type: ${kind}`);
    const name = cleanText(a["name"], "Source name", 60); if (p.agents.some(x => x.name.toLowerCase() === name.toLowerCase())) return fail("invalid", `A source named ${name} already exists`);
    // funções da lib: "nome(a, b) -> x" separadas por ; (ou só nomes separados por vírgula: contrato padrão entrada → resultado)
    const txt = Array.isArray(a["tasks"]) ? a["tasks"].map(String).join(";") : String(a["tasks"] ?? ""), parts = (txt.includes("(") || txt.includes("->") ? txt.split(/[;\n]/) : txt.split(",")).map(x => x.trim()).filter(Boolean);
    const contracts: Record<string, Contract> = {}, tasks: string[] = [];
    if (kind === "maquina") for (const part of parts) { const r = parseSignature(part); if (!r) return fail("invalid", `Invalid function: "${part}" (use name(inputs) -> outputs)`); if (tasks.includes(r.task)) continue; for (const nm of [...r.contract.ins, ...r.contract.outs]) cleanName(nm, "Data name"); tasks.push(r.task); contracts[r.task] = r.contract; }
    if (kind === "maquina" && !tasks.length) return fail("invalid", "A lib needs at least one function (e.g. gzip(data) -> compressed)");
    const id = `a${++p.seq}`; p.agents.push(kind === "maquina" ? { id, kind, name, tasks, contracts } : { id, kind, name, tasks: [] }); return id;
  },
  /** Remove o responsável; as funções que o usavam ficam sem responsável. */
  removeAgent: (p, a) => {
    const id = str(a, "id"); if (!agentOf(p, id)) return fail("not_found", `Source ${id} does not exist`); p.agents = p.agents.filter(x => x.id !== id);
    for (const f of p.flows) walk([f], n => { if (n.t === "fn") { if (n.agent === id) n.agent = null; if (n.resp === id) n.resp = null; } });
  },
  rename: (p, a) => { const l = need(p, str(a, "id")); if (l.node.t !== "fn") return fail("invalid", "Only functions have a name"); l.node.title = cleanText(a["title"], "Name", 80); },

  /** Filho: função → no fim da lista dela; bloco → na PRIMEIRA posição (o lugar do cabeçalho); `catch` → primeira posição do catch. */
  addChild: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : undefined);
    if (n.t === "fn") n.kids.push(f);
    else if (n.t === "try" && a["catch"]) n.catchKids.unshift(f);
    else if (n.t === "if" && a["else"]) n.elseKids.unshift(f);
    else n.kids.unshift(f);
    return f.id;
  },
  /** Irmão: entra na lista de quem o recebe (dentro do bloco, se for o caso). Num bloco = irmão à direita, fora dele. */
  addSibling: (p, a) => {
    const l = need(p, str(a, "id")); if (isRoot(p, l.node.id)) return fail("root", "The flow root cannot have siblings");
    const f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : undefined);
    l.list.splice(l.index + (a["before"] ? 0 : 1), 0, f); return f.id;
  },
  remove: (p, a) => {
    const l = need(p, str(a, "id")); if (isRoot(p, l.node.id)) return fail("root", "The flow root cannot be removed");
    l.list.splice(l.index, 1); for (const f of p.flows) prune(f.kids); fixRefs(p);
  },
  /** Cerca a função (ou o bloco) com um if / for / try. A raiz não aceita. */
  wrap: (p, a) => {
    const l = need(p, str(a, "id")), kind = str(a, "kind") as BlockKind;
    if (!["if", "for", "try"].includes(kind)) return fail("invalid", `Unknown block: ${kind}`);
    if (isRoot(p, l.node.id)) return fail("root", `The root flow does not accept ${kind}`);
    const b = blockOf(kind, p, a, l.node); l.list.splice(l.index, 1, b); return b.id;
  },
  /** Remove o bloco e devolve os filhos à lista de fora (no try, o catch some). */
  unwrap: (p, a) => {
    const l = need(p, str(a, "id")); if (l.node.t === "fn") return fail("invalid", "Only blocks can be undone");
    l.list.splice(l.index, 1, ...l.node.kids); fixRefs(p);
  },
  /** Sair do escopo: o item e os seguintes saem do bloco e ficam logo depois dele. */
  exitScope: (p, a) => {
    const l = need(p, str(a, "id")); if (!l.parent || l.parent.t === "fn") return fail("invalid", "This function is not inside a block");
    const block = l.parent, outer = need(p, block.id), moved = l.list.splice(l.index);
    outer.list.splice(outer.index + 1, 0, ...moved); for (const f of p.flows) prune(f.kids); fixRefs(p);
  },
  /** Tamanho do bloco: aumentar adota os irmãos seguintes; diminuir devolve os últimos para fora. */
  setScope: (p, a) => {
    const l = need(p, str(a, "id")), b = l.node; if (b.t === "fn") return fail("invalid", "Only blocks have a scope");
    const target = Math.max(1, Math.floor(Number(a["count"])) || 1);
    if (target > b.kids.length) b.kids.push(...l.list.splice(l.index + 1, target - b.kids.length));
    else if (target < b.kids.length) l.list.splice(l.index + 1, 0, ...b.kids.splice(target));
  },
  setFor: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "for") return fail("invalid", "Not a for"); n.v = cleanName(a["v"], "Variable"); n.coll = cleanText(a["coll"], "Collection"); },
  setIf: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Not an if"); n.test = cleanText(a["test"], "Condition"); },
  /** Cria o else do if (uma função dentro dele, como o try cria o catch). */
  addElse: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Only an if has an else");
    if (n.elseKids.length) return fail("invalid", "This if already has an else"); const f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : undefined); n.elseKids.push(f); return f.id;
  },
  removeElse: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Only an if has an else"); n.elseKids = []; },

  addInput: (p, a) => io(p, a, "ins", true), removeInput: (p, a) => io(p, a, "ins", false),
  addOutput: (p, a) => io(p, a, "outs", true), removeOutput: (p, a) => io(p, a, "outs", false),

  /** Responsável: lib (concreta), pessoa ou IA (abstrata). Concreta força uma função do catálogo da lib. */
  assign: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have a source");
    const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Source ${str(a, "agent")} does not exist`) : undefined;
    n.agent = ag?.id ?? null; if (ag?.kind !== "ia") n.resp = null;
    if (ag?.kind === "maquina" && !ag.tasks.includes(n.title)) n.title = ag.tasks[0] ?? n.title;
    if (ag?.kind === "maquina") applyContract(p, n);   // entradas e saídas passam a ser as do contrato da lib
    if (n.args) { n.args = Object.fromEntries(Object.entries(n.args).filter(([k]) => n.ins.includes(k))); if (!Object.keys(n.args).length) delete n.args; }
  },
  setTask: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have a lib function");
    const ag = agentOf(p, n.agent), t = cleanText(a["task"], "Function", 80);
    if (ag?.kind === "maquina" && !ag.tasks.includes(t)) return fail("invalid", `Function "${t}" does not exist in ${ag.name}`); n.title = t; applyContract(p, n);
  },
  /** Renomeia um dado de entrada ou saída de uma função comum (nas de lib o contrato manda). */
  renameIo: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs"); if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
    const key = str(a, "side") === "out" ? "outs" : "ins", from = str(a, "from"), to = cleanName(a["to"], "Data name"), i = n[key].indexOf(from);
    if (i < 0) return fail("not_found", `${from} does not exist`); if (from !== to && n[key].includes(to)) return fail("invalid", `${to} already exists`); n[key][i] = to;
    if (key === "ins" && n.args?.[from] !== undefined) { const { [from]: v, ...rest } = n.args; n.args = { ...rest, [to]: v ?? "" }; }   // o valor acompanha o nome
  },
  /** Troca de uma vez todos os dados de um lado (entrada ou saída) de uma função comum: nomes e, nas entradas, os valores. */
  setData: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs"); if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
    const side = str(a, "side") === "out" ? "out" : "in", names = (Array.isArray(a["names"]) ? a["names"] : []).map(x => cleanName(x, "Data name")), values = Array.isArray(a["values"]) ? a["values"].map(x => String(x ?? "").trim()) : [];
    if (new Set(names).size !== names.length) return fail("invalid", "Duplicate data name"); if (values.some(v => v.length > 300)) return fail("invalid", "Value too large");
    if (side === "out") { n.outs = names; return; }
    n.ins = names; const args: Record<string, string> = {}; names.forEach((nm, i) => { if (values[i]) args[nm] = values[i]!; }); if (Object.keys(args).length) n.args = args; else delete n.args;
  },
  /** Dá um nome ao dado que a lib devolve (quando ela devolve um só): é o nome que as outras funções usam para pegá-lo. */
  renameData: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have an output");
    const c = contractOf(p, n); if (!c) return fail("invalid", "The output name can only change on lib functions"); if (c.outs.length !== 1) return fail("invalid", "Renaming only works when the lib returns a single data");
    n.outs = [cleanName(a["to"], "Data name")];
  },
  /** Preenche uma entrada de função de lib: um texto/expressão fixa (ex.: "Olá") ou o nome de um dado produzido antes. Vazio limpa. */
  setArg: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs");
    const name = str(a, "name"); if (!n.ins.includes(name)) return fail("not_found", `${n.title} has no input ${name}`);   // vale para qualquer função (lib ou abstrata)
    const v = str(a, "value").trim(); if (v.length > 300) return fail("invalid", "Value too large");
    const args = { ...(n.args ?? {}) }; if (v) args[name] = v; else delete args[name]; if (Object.keys(args).length) n.args = args; else delete n.args;
  },
  /** Pessoa responsável por uma função de IA. */
  setResp: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have a source");
    const ag = a["resp"] ? agentOf(p, str(a, "resp")) : undefined; if (a["resp"] && ag?.kind !== "pessoa") return fail("invalid", "The AI’s person in charge must be a person"); n.resp = ag?.id ?? null;
  },
  /** Executa junto da função anterior (mesmo passo). */
  setParallel: (p, a) => {
    const l = need(p, str(a, "id")); if (l.node.t !== "fn") return fail("invalid", "Only functions run in parallel");
    if (a["on"] && !(l.list[l.index - 1]?.t === "fn")) return fail("invalid", "There is no previous function to run together with");
    l.node.par = !!a["on"];
  },
} satisfies Record<string, Handler>;

function io(p: Project, a: Args, key: "ins" | "outs", add: boolean): void {
  const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
  if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
  const name = cleanName(a["name"], "Data name");
  if (add) { if (!n[key].includes(name)) n[key].push(name); } else { n[key] = n[key].filter(x => x !== name); if (key === "ins" && n.args) { delete n.args[name]; if (!Object.keys(n.args).length) delete n.args; } }
}

export type CommandName = keyof typeof HANDLERS;
export const COMMAND_NAMES = Object.keys(HANDLERS) as CommandName[];
export interface Command { type: CommandName; [k: string]: unknown }

/** Aplica um comando a uma cópia do projeto. */
export function apply(p: Project, cmd: Command): { project: Project; created?: string } {
  const h = (HANDLERS as Record<string, Handler | undefined>)[cmd.type]; if (!h) throw new FlowError("invalid", `Unknown command: ${String(cmd.type)}`);
  const next = structuredClone(p), { type: _t, ...args } = cmd; void _t;
  const created = h(next, args);
  return created ? { project: next, created } : { project: next };
}

/** Projeto com desfazer / refazer. */
export class Store {
  private past: Project[] = []; private future: Project[] = []; private subs = new Set<() => void>();
  constructor(public project: Project) {}
  subscribe(f: () => void): () => void { this.subs.add(f); return () => this.subs.delete(f); }
  dispatch(cmd: Command): string | undefined {
    const r = apply(this.project, cmd); this.past.push(this.project); this.future = []; this.project = r.project; this.emit(); return r.created;
  }
  /** Troca o projeto inteiro (abrir arquivo, reiniciar): zera o histórico. */
  load(project: Project): void { this.past = []; this.future = []; this.project = project; this.emit(); }
  get canUndo(): boolean { return this.past.length > 0; } get canRedo(): boolean { return this.future.length > 0; }
  undo(): void { const prev = this.past.pop(); if (!prev) return; this.future.push(this.project); this.project = prev; this.emit(); }
  redo(): void { const nx = this.future.pop(); if (!nx) return; this.past.push(this.project); this.project = nx; this.emit(); }
  private emit(): void { for (const f of this.subs) f(); }
}

// ───────────────────────── salvar e abrir ─────────────────────────
export const FORMAT = "flow-novo", VERSION = 1;
export const serialize = (p: Project): string => JSON.stringify({ format: FORMAT, version: VERSION, project: p }, null, 2);

/** Lê um projeto salvo, validando tudo (formato, tipos, ids únicos, referências). */
export function parseProject(text: string): Project {
  let raw: unknown; try { raw = JSON.parse(text); } catch { return fail("invalid", "The file is not valid JSON"); }
  const o = raw as { format?: unknown; version?: unknown; project?: unknown }; if (o?.format !== FORMAT) return fail("invalid", "This file is not a Flow project");
  if (o.version !== VERSION) return fail("invalid", `Version ${String(o.version)} is not supported (expected ${VERSION})`);
  const pr = o.project as Partial<Project> | undefined; if (!pr || typeof pr.name !== "string" || !Array.isArray(pr.flows) || !Array.isArray(pr.agents)) return fail("invalid", "Project without a name, flows or sources");
  if (!pr.flows.length) return fail("invalid", "The project has no flow");
  const ids = new Set<string>(), strs = (v: unknown, what: string): string[] => (Array.isArray(v) && v.every(x => typeof x === "string") ? (v as string[]) : fail("invalid", `${what} must be a list of texts`));
  const agents: Agent[] = pr.agents.map((a: Partial<Agent>) => {
    if (!a || typeof a.id !== "string" || typeof a.name !== "string" || !["maquina", "ia", "pessoa"].includes(String(a.kind))) return fail("invalid", "Invalid source");
    if (ids.has(a.id)) return fail("invalid", `Duplicate id: ${a.id}`); ids.add(a.id); const tasks = strs(a.tasks ?? [], "tasks"), cs = (a as { contracts?: Record<string, Partial<Contract>> }).contracts;
    const contracts = cs ? Object.fromEntries(Object.entries(cs).map(([k, c]) => [k, { ins: strs(c?.ins ?? [], "contract ins"), outs: strs(c?.outs ?? [], "contract outs"), ...(c?.optional ? { optional: strs(c.optional, "contract optional") } : {}) }])) : undefined;
    return { id: a.id, kind: a.kind as AgentKind, name: a.name, tasks, ...(contracts ? { contracts } : {}) };
  });
  const node = (n: Partial<Node> & Record<string, unknown>): Node => {
    if (!n || typeof n.id !== "string") return fail("invalid", "Element without an id"); if (ids.has(n.id)) return fail("invalid", `Duplicate id: ${n.id}`); ids.add(n.id);
    const list = (v: unknown): Node[] => (Array.isArray(v) ? v.map(x => node(x as never)) : fail("invalid", `Invalid children list in ${String(n.id)}`));
    if (n.t === "fn") {
      if (typeof n.title !== "string") return fail("invalid", `Function ${n.id} without a name`);
      const agent = n.agent == null ? null : String(n.agent), resp = n.resp == null ? null : String(n.resp);
      if (agent && !agents.some(a => a.id === agent)) return fail("invalid", `Function ${n.id} uses a source that does not exist`); if (resp && !agents.some(a => a.id === resp)) return fail("invalid", `Function ${n.id} uses a person that does not exist`);
      const args = n.args && typeof n.args === "object" ? Object.fromEntries(Object.entries(n.args as Record<string, unknown>).map(([k, v]) => [k, String(v)])) : undefined;
      return { t: "fn", id: n.id, title: n.title, agent, resp, ins: strs(n.ins ?? [], "ins"), outs: strs(n.outs ?? [], "outs"), kids: list(n.kids ?? []), par: !!n.par, ...(args && Object.keys(args).length ? { args } : {}) };
    }
    if (n.t === "if") return { t: "if", id: n.id, test: String(n.test ?? "condition"), kids: list(n.kids), elseKids: list(n.elseKids ?? []) };
    if (n.t === "for") return { t: "for", id: n.id, v: String(n.v ?? "item"), coll: String(n.coll ?? "items"), kids: list(n.kids) };
    if (n.t === "try") return { t: "try", id: n.id, kids: list(n.kids), catchKids: list(n.catchKids ?? []) };
    return fail("invalid", `Unknown element type in ${n.id}`);
  };
  const flows = pr.flows.map(f => { const n = node(f as never); return n.t === "fn" ? n : fail("invalid", "Every flow starts with a function"); });
  const seq = Math.max(0, ...[...ids].map(i => Number(/(\d+)$/.exec(i)?.[1] ?? 0)));
  return migrate({ name: pr.name, flows, agents, seq: Math.max(seq, Number(pr.seq) || 0) });
}

/** Projetos salvos antes das libs do navegador: troca as libs antigas do Node (mesmos ids) pelas novas e solta quem usava as que saíram. */
export function migrate(p: Project): Project {
  const dflt = (id: string): Agent | undefined => DEFAULT_AGENTS.find(a => a.id === id);
  for (const d of DEFAULT_AGENTS) {
    if (d.kind !== "maquina") continue;
    const i = p.agents.findIndex(a => a.id === d.id);
    if (i >= 0 && p.agents[i]!.kind === "maquina" && p.agents[i]!.name !== d.name) p.agents[i] = structuredClone(d);
    else if (i < 0 && !p.agents.some(a => a.name === d.name)) p.agents.push(structuredClone(d));
  }
  const gone = p.agents.filter(a => a.kind === "maquina" && /^node:/.test(a.name) && ["http", "fs", "os", "path", "crypto", "console"].includes(a.id) && !dflt(a.id)).map(a => a.id);
  if (gone.length) p.agents = p.agents.filter(a => !gone.includes(a.id));
  for (const f of p.flows) walk([f], n => {
    if (n.t !== "fn") return; if (n.agent && !p.agents.some(a => a.id === n.agent)) { n.agent = null; delete n.args; }
    const a = agentOf(p, n.agent); if (a?.kind === "maquina") { if (!a.tasks.includes(n.title)) { n.title = a.tasks[0] ?? n.title; applyContract(p, n); } else if (!n.ins.length && !n.outs.length) applyContract(p, n); }   // só completa o que falta: nomes dados às saídas e valores preenchidos ficam
  });
  return p;
}
