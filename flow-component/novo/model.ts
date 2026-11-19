/**
 * Modelo do Flow (versão nova, do zero).
 *
 * O fluxo é uma ÁRVORE: função (fn) ou bloco (if · for · try), e todo bloco guarda os filhos numa lista.
 * "Estar dentro de um bloco" = estar na lista dele, então as regras valem igual para todos os blocos e nada
 * precisa de marcas soltas (inLoop, inCatch, onError…): inserir, sair, ampliar e reduzir escopo são operações
 * sobre listas.
 */
export type AgentKind = "maquina" | "ia" | "pessoa";
export interface Agent { id: string; kind: AgentKind; name: string; tasks: string[] }

export interface Fn { t: "fn"; id: string; title: string; agent: string | null; resp: string | null; ins: string[]; outs: string[]; kids: Node[]; par: boolean }
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
export const need = (p: Project, id: string): Loc => locate(p, id) ?? fail("not_found", `Elemento ${id} não existe`);
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
export const cubeName = (f: Fn, side: "in" | "out"): string => `${side === "in" ? "entrada" : "saida"}_${f.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "funcao"}`;

/** Nome do arquivo gerado para o fluxo. */
export const slug = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "fluxo";
export const flowFile = (f: Fn): string => `${slug(f.title)}.ts`;

// ───────────────────────── construção ─────────────────────────
const nextId = (p: Project): string => `n${++p.seq}`;
export const newFn = (p: Project, title = "Fazer nova função"): Fn => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
const ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
const cleanName = (s: unknown, what: string): string => { const v = String(s ?? "").trim(); return ident.test(v) ? v : fail("invalid", `${what} inválido: use letras, números e _ (ex.: dados_cliente)`); };
const cleanText = (s: unknown, what: string, max = 120): string => { const v = String(s ?? "").trim(); return v && v.length <= max ? v : fail("invalid", `${what} não pode ser vazio`); };

export function emptyProject(name = "Novo projeto"): Project { return { name, flows: [], agents: [], seq: 0 }; }

export const DEFAULT_AGENTS: readonly Agent[] = [
  { id: "http", kind: "maquina", name: "node:http", tasks: ["get", "post", "request", "createServer", "put", "patch", "delete", "head"] },
  { id: "fs", kind: "maquina", name: "node:fs", tasks: ["readFile", "writeFile", "readdir", "mkdir", "rm", "stat"] },
  { id: "console", kind: "maquina", name: "node:console", tasks: ["log", "info", "warn", "error", "debug", "table"] },
  { id: "os", kind: "maquina", name: "node:os", tasks: ["hostname", "platform", "arch", "cpus", "totalmem", "freemem", "uptime", "homedir", "tmpdir"] },
  { id: "path", kind: "maquina", name: "node:path", tasks: ["join", "resolve", "basename", "dirname", "extname", "normalize"] },
  { id: "crypto", kind: "maquina", name: "node:crypto", tasks: ["randomUUID", "randomBytes", "randomInt", "createHash"] },
  { id: "lia", kind: "ia", name: "Lia", tasks: [] }, { id: "teo", kind: "ia", name: "Teo", tasks: [] }, { id: "davi", kind: "ia", name: "Davi", tasks: [] },
  { id: "ana", kind: "pessoa", name: "Ana Souza", tasks: [] }, { id: "bruno", kind: "pessoa", name: "Bruno Lima", tasks: [] },
];

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
  if (kind === "if") return { t: "if", id, test: a["test"] ? cleanText(a["test"], "Condição") : "condicao", kids: [inner], elseKids: [] };
  if (kind === "for") return { t: "for", id, v: a["v"] ? cleanName(a["v"], "Variável") : "item", coll: a["coll"] ? cleanText(a["coll"], "Coleção") : "itens", kids: [inner] };
  return { t: "try", id, kids: [inner], catchKids: [newFn(p, "Tratar erro")] };
}

export const HANDLERS = {
  /** Novo fluxo (função raiz). */
  newFlow: (p, a) => { const f = newFn(p, a["title"] ? cleanText(a["title"], "Título", 80) : "Fazer novo fluxo"); p.flows.push(f); return f.id; },
  /** Exclui um fluxo inteiro; o projeto sempre mantém pelo menos um. */
  removeFlow: (p, a) => {
    const l = need(p, str(a, "id")); if (!isRoot(p, l.node.id)) return fail("invalid", "Só um fluxo inteiro pode ser excluído");
    if (p.flows.length <= 1) return fail("invalid", "O projeto precisa de pelo menos um fluxo"); p.flows.splice(l.index, 1);
  },
  /** Cadastro de responsáveis: lib do Node (com as funções dela), pessoa ou agente de IA. */
  addAgent: (p, a) => {
    const kind = str(a, "kind") as AgentKind; if (!["maquina", "ia", "pessoa"].includes(kind)) return fail("invalid", `Tipo de responsável desconhecido: ${kind}`);
    const name = cleanText(a["name"], "Nome do responsável", 60); if (p.agents.some(x => x.name.toLowerCase() === name.toLowerCase())) return fail("invalid", `Já existe um responsável chamado ${name}`);
    const raw = Array.isArray(a["tasks"]) ? a["tasks"] : String(a["tasks"] ?? "").split(","), tasks = [...new Set(raw.map(t => String(t).trim()).filter(Boolean))];
    if (kind === "maquina" && !tasks.length) return fail("invalid", "Uma lib precisa de pelo menos uma função (ex.: gzip, gunzip)");
    const id = `a${++p.seq}`; p.agents.push({ id, kind, name, tasks: kind === "maquina" ? tasks : [] }); return id;
  },
  /** Remove o responsável; as funções que o usavam ficam sem responsável. */
  removeAgent: (p, a) => {
    const id = str(a, "id"); if (!agentOf(p, id)) return fail("not_found", `Responsável ${id} não existe`); p.agents = p.agents.filter(x => x.id !== id);
    for (const f of p.flows) walk([f], n => { if (n.t === "fn") { if (n.agent === id) n.agent = null; if (n.resp === id) n.resp = null; } });
  },
  rename: (p, a) => { const l = need(p, str(a, "id")); if (l.node.t !== "fn") return fail("invalid", "Só funções têm nome"); l.node.title = cleanText(a["title"], "Nome", 80); },

  /** Filho: função → no fim da lista dela; bloco → na PRIMEIRA posição (o lugar do cabeçalho); `catch` → primeira posição do catch. */
  addChild: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? cleanText(a["title"], "Nome", 80) : undefined);
    if (n.t === "fn") n.kids.push(f);
    else if (n.t === "try" && a["catch"]) n.catchKids.unshift(f);
    else if (n.t === "if" && a["else"]) n.elseKids.unshift(f);
    else n.kids.unshift(f);
    return f.id;
  },
  /** Irmão: entra na lista de quem o recebe (dentro do bloco, se for o caso). Num bloco = irmão à direita, fora dele. */
  addSibling: (p, a) => {
    const l = need(p, str(a, "id")); if (isRoot(p, l.node.id)) return fail("root", "A raiz do fluxo não ganha irmão");
    const f = newFn(p, a["title"] ? cleanText(a["title"], "Nome", 80) : undefined);
    l.list.splice(l.index + (a["before"] ? 0 : 1), 0, f); return f.id;
  },
  remove: (p, a) => {
    const l = need(p, str(a, "id")); if (isRoot(p, l.node.id)) return fail("root", "A raiz do fluxo não pode ser removida");
    l.list.splice(l.index, 1); for (const f of p.flows) prune(f.kids); fixRefs(p);
  },
  /** Cerca a função (ou o bloco) com um if / for / try. A raiz não aceita. */
  wrap: (p, a) => {
    const l = need(p, str(a, "id")), kind = str(a, "kind") as BlockKind;
    if (!["if", "for", "try"].includes(kind)) return fail("invalid", `Bloco desconhecido: ${kind}`);
    if (isRoot(p, l.node.id)) return fail("root", `O fluxo raiz não aceita ${kind}`);
    const b = blockOf(kind, p, a, l.node); l.list.splice(l.index, 1, b); return b.id;
  },
  /** Remove o bloco e devolve os filhos à lista de fora (no try, o catch some). */
  unwrap: (p, a) => {
    const l = need(p, str(a, "id")); if (l.node.t === "fn") return fail("invalid", "Só blocos podem ser desfeitos");
    l.list.splice(l.index, 1, ...l.node.kids); fixRefs(p);
  },
  /** Sair do escopo: o item e os seguintes saem do bloco e ficam logo depois dele. */
  exitScope: (p, a) => {
    const l = need(p, str(a, "id")); if (!l.parent || l.parent.t === "fn") return fail("invalid", "Esta função não está dentro de um bloco");
    const block = l.parent, outer = need(p, block.id), moved = l.list.splice(l.index);
    outer.list.splice(outer.index + 1, 0, ...moved); for (const f of p.flows) prune(f.kids); fixRefs(p);
  },
  /** Tamanho do bloco: aumentar adota os irmãos seguintes; diminuir devolve os últimos para fora. */
  setScope: (p, a) => {
    const l = need(p, str(a, "id")), b = l.node; if (b.t === "fn") return fail("invalid", "Só blocos têm escopo");
    const target = Math.max(1, Math.floor(Number(a["count"])) || 1);
    if (target > b.kids.length) b.kids.push(...l.list.splice(l.index + 1, target - b.kids.length));
    else if (target < b.kids.length) l.list.splice(l.index + 1, 0, ...b.kids.splice(target));
  },
  setFor: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "for") return fail("invalid", "Não é um for"); n.v = cleanName(a["v"], "Variável"); n.coll = cleanText(a["coll"], "Coleção"); },
  setIf: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Não é um if"); n.test = cleanText(a["test"], "Condição"); },
  /** Cria o else do if (uma função dentro dele, como o try cria o catch). */
  addElse: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Só o if tem else");
    if (n.elseKids.length) return fail("invalid", "Este if já tem else"); const f = newFn(p, a["title"] ? cleanText(a["title"], "Nome", 80) : undefined); n.elseKids.push(f); return f.id;
  },
  removeElse: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Só o if tem else"); n.elseKids = []; },

  addInput: (p, a) => io(p, a, "ins", true), removeInput: (p, a) => io(p, a, "ins", false),
  addOutput: (p, a) => io(p, a, "outs", true), removeOutput: (p, a) => io(p, a, "outs", false),

  /** Responsável: lib (concreta), pessoa ou IA (abstrata). Concreta força uma função do catálogo da lib. */
  assign: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Só funções têm responsável");
    const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Responsável ${str(a, "agent")} não existe`) : undefined;
    n.agent = ag?.id ?? null; if (ag?.kind !== "ia") n.resp = null;
    if (ag?.kind === "maquina" && !ag.tasks.includes(n.title)) n.title = ag.tasks[0] ?? n.title;
  },
  setTask: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Só funções têm função de lib");
    const ag = agentOf(p, n.agent), t = cleanText(a["task"], "Função", 80);
    if (ag?.kind === "maquina" && !ag.tasks.includes(t)) return fail("invalid", `Função "${t}" não existe em ${ag.name}`); n.title = t;
  },
  /** Pessoa responsável por uma função de IA. */
  setResp: (p, a) => {
    const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Só funções têm responsável");
    const ag = a["resp"] ? agentOf(p, str(a, "resp")) : undefined; if (a["resp"] && ag?.kind !== "pessoa") return fail("invalid", "O responsável da IA é uma pessoa"); n.resp = ag?.id ?? null;
  },
  /** Executa junto da função anterior (mesmo passo). */
  setParallel: (p, a) => {
    const l = need(p, str(a, "id")); if (l.node.t !== "fn") return fail("invalid", "Só funções rodam em paralelo");
    if (a["on"] && !(l.list[l.index - 1]?.t === "fn")) return fail("invalid", "Não há função anterior para rodar junto");
    l.node.par = !!a["on"];
  },
} satisfies Record<string, Handler>;

function io(p: Project, a: Args, key: "ins" | "outs", add: boolean): void {
  const n = need(p, str(a, "id")).node; if (n.t !== "fn") return fail("invalid", "Só funções têm entradas e saídas");
  const name = cleanName(a["name"], "Nome do dado");
  if (add) { if (!n[key].includes(name)) n[key].push(name); } else n[key] = n[key].filter(x => x !== name);
}

export type CommandName = keyof typeof HANDLERS;
export const COMMAND_NAMES = Object.keys(HANDLERS) as CommandName[];
export interface Command { type: CommandName; [k: string]: unknown }

/** Aplica um comando a uma cópia do projeto. */
export function apply(p: Project, cmd: Command): { project: Project; created?: string } {
  const h = (HANDLERS as Record<string, Handler | undefined>)[cmd.type]; if (!h) throw new FlowError("invalid", `Comando desconhecido: ${String(cmd.type)}`);
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
  let raw: unknown; try { raw = JSON.parse(text); } catch { return fail("invalid", "O arquivo não é um JSON válido"); }
  const o = raw as { format?: unknown; version?: unknown; project?: unknown }; if (o?.format !== FORMAT) return fail("invalid", "Este arquivo não é um projeto do Flow");
  if (o.version !== VERSION) return fail("invalid", `Versão ${String(o.version)} não suportada (esperado ${VERSION})`);
  const pr = o.project as Partial<Project> | undefined; if (!pr || typeof pr.name !== "string" || !Array.isArray(pr.flows) || !Array.isArray(pr.agents)) return fail("invalid", "Projeto sem nome, fluxos ou responsáveis");
  if (!pr.flows.length) return fail("invalid", "O projeto não tem nenhum fluxo");
  const ids = new Set<string>(), strs = (v: unknown, what: string): string[] => (Array.isArray(v) && v.every(x => typeof x === "string") ? (v as string[]) : fail("invalid", `${what} deve ser uma lista de textos`));
  const agents: Agent[] = pr.agents.map((a: Partial<Agent>) => {
    if (!a || typeof a.id !== "string" || typeof a.name !== "string" || !["maquina", "ia", "pessoa"].includes(String(a.kind))) return fail("invalid", "Responsável inválido");
    if (ids.has(a.id)) return fail("invalid", `Id repetido: ${a.id}`); ids.add(a.id); return { id: a.id, kind: a.kind as AgentKind, name: a.name, tasks: strs(a.tasks ?? [], "tasks") };
  });
  const node = (n: Partial<Node> & Record<string, unknown>): Node => {
    if (!n || typeof n.id !== "string") return fail("invalid", "Elemento sem id"); if (ids.has(n.id)) return fail("invalid", `Id repetido: ${n.id}`); ids.add(n.id);
    const list = (v: unknown): Node[] => (Array.isArray(v) ? v.map(x => node(x as never)) : fail("invalid", `Lista de filhos inválida em ${String(n.id)}`));
    if (n.t === "fn") {
      if (typeof n.title !== "string") return fail("invalid", `Função ${n.id} sem nome`);
      const agent = n.agent == null ? null : String(n.agent), resp = n.resp == null ? null : String(n.resp);
      if (agent && !agents.some(a => a.id === agent)) return fail("invalid", `Função ${n.id} usa um responsável que não existe`); if (resp && !agents.some(a => a.id === resp)) return fail("invalid", `Função ${n.id} usa uma pessoa que não existe`);
      return { t: "fn", id: n.id, title: n.title, agent, resp, ins: strs(n.ins ?? [], "ins"), outs: strs(n.outs ?? [], "outs"), kids: list(n.kids ?? []), par: !!n.par };
    }
    if (n.t === "if") return { t: "if", id: n.id, test: String(n.test ?? "condicao"), kids: list(n.kids), elseKids: list(n.elseKids ?? []) };
    if (n.t === "for") return { t: "for", id: n.id, v: String(n.v ?? "item"), coll: String(n.coll ?? "itens"), kids: list(n.kids) };
    if (n.t === "try") return { t: "try", id: n.id, kids: list(n.kids), catchKids: list(n.catchKids ?? []) };
    return fail("invalid", `Tipo de elemento desconhecido em ${n.id}`);
  };
  const flows = pr.flows.map(f => { const n = node(f as never); return n.t === "fn" ? n : fail("invalid", "Todo fluxo começa numa função"); });
  const seq = Math.max(0, ...[...ids].map(i => Number(/(\d+)$/.exec(i)?.[1] ?? 0)));
  return { name: pr.name, flows, agents, seq: Math.max(seq, Number(pr.seq) || 0) };
}
