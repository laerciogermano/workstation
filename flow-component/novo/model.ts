/**
 * Modelo do Flow (versão nova, do zero).
 *
 * O fluxo é uma ÁRVORE: função (fn) ou bloco (if · for · try), e todo bloco guarda os filhos numa lista.
 * "Being inside de um bloco" = estar na lista dele, então as regras valem igual para todos os blocos e nada
 * precisa de marcas soltas (inLoop, inCatch, onError…): inserir, sair, ampliar e reduzir escopo são operações
 * sobre listas.
 */
export type AgentKind = "maquina" | "ia" | "pessoa" | "arquivo";
/** Contrato de uma função de lib: as entradas (parâmetros, nesta ordem) e as saídas. Um lado com 1 nome é um dado (quadrado); com vários é um objeto (cubo). */
export interface Contract { ins: string[]; outs: string[]; /** Entradas opcionais (escritas com ? na assinatura): não são exigidas do state. */ optional?: string[] }
export interface Agent { id: string; kind: AgentKind; name: string; tasks: string[]; /** Contratos das funções da lib (por nome). */ contracts?: Record<string, Contract> }

/** `args`: valor de cada entrada de uma função de lib — um texto/expressão fixa (ex.: "Olá") ou o nome de um dado produzido antes. */
export interface Fn { t: "fn"; id: string; title: string; agent: string | null; resp: string | null; ins: string[]; outs: string[]; kids: Node[]; par: boolean; args?: Record<string, string>; /** Só em função raiz: arquivo onde ela mora (várias funções podem dividir o mesmo arquivo). */ file?: string }
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
/** Arquivos do projeto (uma fonte "arquivo" por .ts): as funções de primeira ordem de cada um são as tarefas que outra função pode referenciar. */
export const filesOf = (p: Project): string[] => [...new Set(p.flows.map(f => flowFile(f)))];
const fileAgent = (p: Project, file: string): Agent | undefined => { const fns = p.flows.filter(f => flowFile(f) === file); return fns.length ? { id: `file:${file}`, kind: "arquivo", name: file, tasks: fns.map(f => f.title), contracts: Object.fromEntries(fns.map(f => [f.title, { ins: [...f.ins], outs: [...f.outs] }])) } : undefined; };
/** Encoding de origem importada: `from:utils.ts#r` (arquivo + out de uma função de 1ª ordem). */
const FROM_ARG = /^from:([^#\s]+)#([A-Za-z_$][\w$]*)$/;
export const isFromArg = (expr: string): boolean => FROM_ARG.test(expr.trim());
export const parseFromArg = (expr: string): { file: string; name: string } | null => {
  const m = FROM_ARG.exec(expr.trim()); return m ? { file: m[1]!, name: m[2]! } : null;
};
/** Dados exportados por um arquivo = outs das funções de primeira ordem nesse `.ts`. */
export function fileData(p: Project, file: string): { name: string; from: string }[] {
  const out: { name: string; from: string }[] = [], seen = new Set<string>();
  for (const f of p.flows.filter(x => flowFile(x) === file)) for (const name of f.outs) {
    if (seen.has(name)) continue; seen.add(name); out.push({ name, from: f.title });
  }
  return out;
}
/** Função raiz que produz o out `name` no arquivo (primeira que declarar). */
export const fileDataProducer = (p: Project, file: string, name: string): Fn | null =>
  p.flows.find(f => flowFile(f) === file && f.outs.includes(name)) ?? null;
/**
 * Tipo semântico do retorno de uma lib (`agentId:task` → tipo).
 * Objetos desse tipo, quando estão no estado, podem ser source com os métodos de `OBJ_TYPE_SIGS`.
 */
const LIB_RETURN_TYPE: Record<string, string> = { "web:fetch": "Response" };
/** Métodos disponíveis quando o objeto do contexto tem aquele tipo. */
const OBJ_TYPE_SIGS: Record<string, string[]> = {
  Response: ["json() -> value", "text() -> text", "blob() -> blob", "arrayBuffer() -> buffer", "formData() -> formData"],
};
/** Tipo de retorno da função de lib (se conhecido). */
export const returnTypeOf = (p: Project, f: Fn): string | null => (f.agent && f.title ? LIB_RETURN_TYPE[`${f.agent}:${f.title}`] ?? null : null);
/** Quem produziu o dado `name` antes de `consumerId` no mesmo fluxo (mesma ordem de `statesFor`). */
export function producerOf(p: Project, consumerId: string, name: string): Fn | null {
  const l = locate(p, consumerId); if (!l) return null;
  let found = false, hit: Fn | null = null;
  const visit = (nodes: readonly Node[]): void => {
    for (const n of nodes) {
      if (found) return;
      if (n.id === consumerId) { found = true; return; }
      if (n.t === "fn") {
        if (n.kids.length) visit(n.kids);
        else if (!found && n.outs.includes(name)) hit = n;
      } else { visit(n.kids); if (!found && n.t === "try") visit(n.catchKids); if (!found && n.t === "if") visit(n.elseKids); }
    }
  };
  visit(l.flow.kids); return found ? hit : null;
}
/** Fonte sintética `obj:<dado>`: métodos do tipo do objeto produzido antes (ex.: Response.json). */
export function objAgent(p: Project, dataName: string, consumerId?: string): Agent | undefined {
  const producer = consumerId ? producerOf(p, consumerId, dataName) : (() => {
    let hit: Fn | null = null;
    for (const f of p.flows) walk(f.kids, n => { if (n.t === "fn" && n.outs.includes(dataName) && returnTypeOf(p, n)) hit = n; });
    return hit;
  })();
  if (!producer) return undefined;
  const type = returnTypeOf(p, producer); if (!type) return undefined;
  const sigs = OBJ_TYPE_SIGS[type]; if (!sigs?.length) return undefined;
  const contracts: Record<string, Contract> = {}, tasks: string[] = [];
  for (const sg of sigs) { const r = parseSignature(sg)!; tasks.push(r.task); contracts[r.task] = r.contract; }
  return { id: `obj:${dataName}`, kind: "maquina", name: dataName, tasks, contracts };
}
/** Objetos do contexto (antes de `consumerId`) que têm métodos utilizáveis como source. */
export function objectSources(p: Project, consumerId: string): { name: string; agent: Agent }[] {
  return statesFor(p, consumerId).filter(s => s.kind === "data").flatMap(s => {
    const agent = objAgent(p, s.name, consumerId); return agent?.tasks.length ? [{ name: s.name, agent }] : [];
  });
}
export const agentOf = (p: Project, id: string | null): Agent | undefined => {
  if (!id) return undefined;
  if (id.startsWith("file:")) return fileAgent(p, id.slice(5));
  if (id.startsWith("obj:")) return objAgent(p, id.slice(4));
  return p.agents.find(a => a.id === id);
};
/** Fonte com contrato (lib do navegador, objeto do contexto ou função de outro arquivo): entradas e saídas vêm dela. */
export const hasContract = (a: Agent | undefined): boolean => a?.kind === "maquina" || a?.kind === "arquivo";
export const isComposite = (n: Node): boolean => n.kids.length > 0;
/** Está dentro de um bloco (if/for/try/catch), não só dentro de uma função composta. */
export const insideBlock = (p: Project, id: string): boolean => { const l = locate(p, id); return !!l && !!l.parent && l.parent.t !== "fn"; };
export const kidsOf = (n: Node): Node[] => (n.t === "try" ? [...n.kids, ...n.catchKids] : n.t === "if" ? [...n.kids, ...n.elseKids] : n.kids);
/** Lista alternativa do bloco (catch do try, else do if). */
export const altKids = (n: Node): Node[] | null => (n.t === "try" ? n.catchKids : n.t === "if" ? n.elseKids : null);
export function walk(list: readonly Node[], f: (n: Node) => void): void { for (const n of list) { f(n); walk(kidsOf(n), f); } }

/** Troca um identificador em expressão (respeita strings). */
const renameIdentInExpr = (expr: string, from: string, to: string): string => {
  if (!expr || from === to) return expr;
  const strings: string[] = [];
  const masked = expr.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, m => { strings.push(m); return `\0${strings.length - 1}\0`; });
  const re = new RegExp(`(?<![.\\w$])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w$])`, "g");
  return masked.replace(re, to).replace(/\0(\d+)\0/g, (_, i) => strings[Number(i)]!);
};
/**
 * No mesmo fluxo o nome do dado é a referência: renomear o **pai** (origem) atualiza ins/outs/args/if/for/obj em todos.
 * `from` e `to` já validados (`cleanName`).
 */
export function renameDatumInFlow(flow: Fn, from: string, to: string): void {
  if (from === to) return;
  const patch = (n: Fn): void => {
    n.ins = n.ins.map(x => (x === from ? to : x));
    n.outs = n.outs.map(x => (x === from ? to : x));
    if (n.args) {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(n.args)) next[k === from ? to : k] = renameIdentInExpr(v, from, to);
      n.args = next; if (!Object.keys(next).length) delete n.args;
    }
    if (n.agent?.startsWith("obj:")) {
      const rest = n.agent.slice(4), hash = rest.indexOf("#"), data = hash >= 0 ? rest.slice(0, hash) : rest, meth = hash >= 0 ? rest.slice(hash) : "";
      if (data === from) n.agent = `obj:${to}${meth}`;
    }
  };
  patch(flow);
  walk(flow.kids, n => {
    if (n.t === "fn") patch(n);
    else if (n.t === "if") n.test = renameIdentInExpr(n.test, from, to);
    else if (n.t === "for") { if (n.v === from) n.v = to; n.coll = renameIdentInExpr(n.coll, from, to); }
  });
}
/** Entrada com valor próprio (literal/expressão/import), não só ref a outro dado — produz o nome. */
const LITERAL_IDENTS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);
export const initsDatum = (f: Fn, name: string): boolean => {
  const e = f.args?.[name]?.trim(); if (!e) return false;
  if (e.startsWith("from:") || LITERAL_IDENTS.has(e)) return true;
  return !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(e);
};
/** Origem do nome no fluxo (primeiro produtor na ordem): entrada com literal ou primeira saída. */
export function originPort(flow: Fn, name: string): { id: string; side: "in" | "out" } | null {
  const hit = (f: Fn): { id: string; side: "in" | "out" } | null => {
    if (f.ins.includes(name) && initsDatum(f, name)) return { id: f.id, side: "in" };
    if (f.outs.includes(name)) return { id: f.id, side: "out" };
    return null;
  };
  const at = hit(flow); if (at) return at;
  let found: { id: string; side: "in" | "out" } | null = null;
  const visit = (nodes: readonly Node[]): void => {
    for (const n of nodes) {
      if (found) return;
      if (n.t === "fn") {
        found = hit(n);
        if (!found && n.kids.length) visit(n.kids);
      } else { visit(n.kids); if (!found && n.t === "try") visit(n.catchKids); if (!found && n.t === "if") visit(n.elseKids); }
    }
  };
  visit(flow.kids); return found;
}
/**
 * Mesma referência = mesmo editor: clique num porto/estado resolve para a origem do nome.
 * Porto com um só nome que só referencia → origem; senão mantém o alvo clicado.
 */
export function resolveDataEdit(p: Project, id: string, side: "in" | "out", name?: string): { id: string; side: "in" | "out" } {
  const loc = locate(p, id); if (!loc || loc.node.t !== "fn") return { id, side };
  const n = loc.node, key = name?.trim() || (side === "in" ? (n.ins.length === 1 ? n.ins[0] : "") : (n.outs.length === 1 ? n.outs[0] : ""));
  if (!key) return { id, side };
  const origin = originPort(loc.flow, key);
  if (!origin || (origin.id === id && origin.side === side)) return { id, side };
  return origin;
}
/** Renomeia só este porto (filho): desvincula do pai; não propaga. */
export function renamePortLocal(n: Fn, side: "in" | "out", from: string, to: string, clearValue = false): void {
  if (from === to) return;
  const key = side === "out" ? "outs" : "ins";
  n[key] = n[key].map(x => (x === from ? to : x));
  if (side === "in" && n.args) {
    if (clearValue) { delete n.args[from]; delete n.args[to]; }
    else if (from in n.args) { n.args[to] = n.args[from]!; delete n.args[from]; }
    if (!Object.keys(n.args).length) delete n.args;
  }
}
export const fnsOf = (flow: Fn): Fn[] => { const out: Fn[] = []; walk(flow.kids, n => { if (n.t === "fn") out.push(n); }); return out; };

/**
 * Forma do lado (entrada/saída) alinhada ao TypeScript gerado:
 *  - `[]` → cubo (objeto/state vazio: o código manda/recebe `state` / `{}`);
 *  - um nome → quadrado (dado único);
 *  - dois ou mais → cubo (objeto com campos).
 */
export const isCube = (names: readonly string[]): boolean => names.length !== 1;
/** Nome do cubo de uma função: `entrada_<função>` / `saida_<função>`. */
export const cubeName = (f: Fn, side: "in" | "out"): string => `${side === "in" ? "input" : "output"}_${f.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "function"}`;

/** Nome do arquivo gerado para o fluxo. */
export const slug = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "flow";
export const flowFile = (f: Fn): string => f.file ?? `${slug(f.title)}.ts`;

// ───────────────────────── construção ─────────────────────────
const nextId = (p: Project): string => `n${++p.seq}`;
export const newFn = (p: Project, title = "newFunction"): Fn => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
const ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Nome de função/método: lowerCamelCase (começa minúscula, sem _ nem espaços). */
const CAMEL_FN = /^[a-z][a-zA-Z0-9]*$/;
const RESERVED = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await".split(" "));
const cleanName = (s: unknown, what: string): string => { const v = String(s ?? "").trim(); if (RESERVED.has(v)) return fail("invalid", `${what} cannot be the reserved word “${v}”`); return ident.test(v) ? v : fail("invalid", `${what} is invalid: use letters, numbers and _ (e.g. customer_data)`); };
const cleanText = (s: unknown, what: string, max = 120): string => { const v = String(s ?? "").trim(); return v && v.length <= max ? v : fail("invalid", `${what} cannot be empty`); };
/** Valida lowerCamelCase de função (ex.: processOrder, newId). */
export const cleanFnTitle = (s: unknown, what = "Function name"): string => {
  const v = String(s ?? "").trim();
  if (!v || v.length > 80) return fail("invalid", `${what} cannot be empty`);
  if (RESERVED.has(v)) return fail("invalid", `${what} cannot be the reserved word “${v}”`);
  if (!CAMEL_FN.test(v)) return fail("invalid", `${what} must be lowerCamelCase (e.g. processOrder)`);
  return v;
};
/** Nomes de dados no fluxo (ins/outs + variáveis de for). */
export function dataNamesInFlow(flow: Fn): Set<string> {
  const out = new Set<string>([...flow.ins, ...flow.outs]);
  walk(flow.kids, n => {
    if (n.t === "fn") { for (const x of n.ins) out.add(x); for (const x of n.outs) out.add(x); }
    else if (n.t === "for") out.add(n.v);
  });
  return out;
}
/** Títulos de função no fluxo (raiz + árvore), opcionalmente ignorando um id. */
export function fnTitlesInFlow(flow: Fn, exceptId?: string): Set<string> {
  const out = new Set<string>();
  if (flow.id !== exceptId) out.add(flow.title);
  walk(flow.kids, n => { if (n.t === "fn" && n.id !== exceptId) out.add(n.title); });
  return out;
}
/** Título livre (abstrato) no fluxo: camelCase, único entre abstratas; não colide com dado. Libs podem repetir o nome da task (vários `log`). */
const claimAbstractTitle = (p: Project, flow: Fn, raw: unknown, exceptId?: string): string => {
  const name = cleanFnTitle(raw);
  if (dataNamesInFlow(flow).has(name)) return fail("invalid", `“${name}” is already a data name in this flow`);
  const hit = (n: Fn): boolean => n.id !== exceptId && n.title === name && !contractOf(p, n);
  if (hit(flow)) return fail("invalid", `Function “${name}” already exists in this flow`);
  let clash = false; walk(flow.kids, n => { if (n.t === "fn" && hit(n)) clash = true; });
  if (clash) return fail("invalid", `Function “${name}” already exists in this flow`);
  return name;
};
/** Ao renomear abstrata: camelCase; único no fluxo (não colide com dado nem com outra função). Libs de catálogo podem repetir a task. */
const claimRenameAbstract = (p: Project, flow: Fn, raw: unknown, exceptId: string): string => {
  const name = cleanFnTitle(raw);
  if (dataNamesInFlow(flow).has(name)) return fail("invalid", `“${name}” is already a data name in this flow`);
  const hit = (n: Fn): boolean => n.id !== exceptId && n.title === name;
  if (hit(flow)) return fail("invalid", `Function “${name}” already exists in this flow`);
  let clash = false; walk(flow.kids, n => { if (n.t === "fn" && hit(n)) clash = true; });
  if (clash) return fail("invalid", `Function “${name}” already exists in this flow`);
  return name;
};
/** Dado não pode ter o mesmo nome de uma função no fluxo. */
const claimDataInFlow = (flow: Fn, raw: unknown, what = "Data name"): string => {
  const name = cleanName(raw, what);
  if (fnTitlesInFlow(flow).has(name)) return fail("invalid", `“${name}” is already a function name in this flow`);
  return name;
};
/** Próximo título camelCase livre no fluxo (newFunction, newFunction2…). */
export const freshFnTitle = (flow: Fn, base = "newFunction"): string => {
  const taken = fnTitlesInFlow(flow), data = dataNamesInFlow(flow);
  if (!taken.has(base) && !data.has(base) && CAMEL_FN.test(base)) return base;
  let n = 2; for (;;) { const t = `${base}${n}`; if (!taken.has(t) && !data.has(t)) return t; n++; }
};

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
export const contractOf = (p: Project, f: Fn): Contract | null => { const a = agentOf(p, f.agent); return hasContract(a) ? a!.contracts?.[f.title] ?? null : null; };
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
  return { t: "try", id, kids: [inner], catchKids: [newFn(p, "handleError")] };
}

export const HANDLERS = {
  /** Novo fluxo (função raiz). */
  newFlow: (p, a) => {
    const file = a["file"] ? cleanText(a["file"], "File", 80) : undefined;
    const title = a["title"] ? cleanFnTitle(a["title"], "Title") : "newFlow";
    if (p.flows.some(x => x.title === title && flowFile(x) === (file ?? `${slug(title)}.ts`))) return fail("invalid", `Function “${title}” already exists in this file`);
    const f = newFn(p, title); if (file) f.file = file; p.flows.push(f); return f.id;
  },
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
  rename: (p, a) => {
    const l = need(p, str(a, "id")); if (l.node.t !== "fn") return fail("invalid", "Only functions have a name");
    const from = l.node.title;
    if (contractOf(p, l.node)) {
      const to = cleanFnTitle(a["title"], "Name"); if (from === to) return;
      if (dataNamesInFlow(l.flow).has(to)) return fail("invalid", `“${to}” is already a data name in this flow`);
      l.node.title = to; return;   // lib: título = task desta chamada (instâncias podem repetir o nome da task)
    }
    const to = claimRenameAbstract(p, l.flow, a["title"], l.node.id); if (from === to) return;
    l.node.title = to;   // abstrata: nome único no fluxo — só este nó
  },
  /** Renomeia um arquivo: todas as funções dele passam ao novo nome e quem o usa como fonte (file:nome) acompanha. */
  renameFile: (p, a) => {
    const from = str(a, "from"), to = cleanText(a["to"], "File name", 80).replace(/\s+/g, "-"), file = /\.[A-Za-z0-9]+$/.test(to) ? to : `${to}.ts`;
    const own = p.flows.filter(f => flowFile(f) === from); if (!own.length) return fail("not_found", `File ${from} does not exist`);
    if (file !== from && p.flows.some(f => flowFile(f) === file)) return fail("invalid", `File ${file} already exists`);
    for (const f of own) f.file = file;
    for (const f of p.flows) walk([f], n => { if (n.t === "fn" && n.agent === `file:${from}`) n.agent = `file:${file}`; });
  },

  /** Filho: função → no fim da lista dela; bloco → na PRIMEIRA posição (o lugar do cabeçalho); `catch` → primeira posição do catch. */
  addChild: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow));
    if (n.t === "fn") n.kids.push(f);
    else if (n.t === "try" && a["catch"]) n.catchKids.unshift(f);
    else if (n.t === "if" && a["else"]) n.elseKids.unshift(f);
    else n.kids.unshift(f);
    return f.id;
  },
  /** Irmão: entra na lista de quem o recebe (dentro do bloco, se for o caso). Num bloco = irmão à direita, fora dele. */
  addSibling: (p, a) => {
    const l = need(p, str(a, "id")); if (isRoot(p, l.node.id)) return fail("root", "The flow root cannot have siblings");
    const f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow));
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
    const b = blockOf(kind, p, a, l.node);
    if (b.t === "try" && b.catchKids[0]?.t === "fn") (b.catchKids[0] as Fn).title = freshFnTitle(l.flow, "handleError");
    l.list.splice(l.index, 1, b); return b.id;
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
  setFor: (p, a) => { const l = need(p, str(a, "id")), n = l.node; if (n.t !== "for") return fail("invalid", "Not a for"); n.v = claimDataInFlow(l.flow, a["v"], "Variable"); n.coll = cleanText(a["coll"], "Collection"); },
  setIf: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Not an if"); n.test = cleanText(a["test"], "Condition"); },
  /** Cria o else do if (uma função dentro dele, como o try cria o catch). */
  addElse: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "if") return fail("invalid", "Only an if has an else");
    if (n.elseKids.length) return fail("invalid", "This if already has an else");
    const f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow)); n.elseKids.push(f); return f.id;
  },
  removeElse: (p, a) => { const n = need(p, str(a, "id")).node; if (n.t !== "if") return fail("invalid", "Only an if has an else"); n.elseKids = []; },

  addInput: (p, a) => io(p, a, "ins", true), removeInput: (p, a) => io(p, a, "ins", false),
  addOutput: (p, a) => io(p, a, "outs", true), removeOutput: (p, a) => io(p, a, "outs", false),

  /** Responsável: lib (concreta), pessoa ou IA (abstrata). Concreta força uma função do catálogo da lib. */
  assign: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "fn") return fail("invalid", "Only functions have a source");
    const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Source ${str(a, "agent")} does not exist`) : undefined;
    n.agent = ag?.id ?? null; if (ag?.kind !== "ia") n.resp = null;
    if (hasContract(ag) && !ag!.tasks.includes(n.title)) {
      const task = ag!.tasks[0] ?? n.title;
      if (dataNamesInFlow(l.flow).has(task)) return fail("invalid", `“${task}” is already a data name in this flow`);
      n.title = task;
    }
    if (hasContract(ag)) applyContract(p, n);   // entradas e saídas passam a ser as do contrato da lib
    if (n.args) { n.args = Object.fromEntries(Object.entries(n.args).filter(([k]) => n.ins.includes(k))); if (!Object.keys(n.args).length) delete n.args; }
  },
  setTask: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "fn") return fail("invalid", "Only functions have a lib function");
    const ag = agentOf(p, n.agent), t = cleanFnTitle(a["task"], "Function");
    if (hasContract(ag) && !ag!.tasks.includes(t)) return fail("invalid", `Function "${t}" does not exist in ${ag!.name}`);
    if (dataNamesInFlow(l.flow).has(t)) return fail("invalid", `“${t}” is already a data name in this flow`);
    n.title = t; applyContract(p, n);
  },
  /**
   * Renomeia um dado. Pai (origem do nome) → propaga a todos. Filho (só referência) → renomeia
   * este porto e desvincula do pai. Entrada para nome já usado → só aponta (referência; limpa literal).
   * No mesmo contexto não há dois dados distintos com o mesmo nome nem duas funções com o mesmo título.
   */
  renameIo: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs"); if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
    const side = str(a, "side") === "out" ? "out" : "in", key = side === "out" ? "outs" : "ins", from = str(a, "from"), to = claimDataInFlow(l.flow, a["to"]);
    if (!n[key].includes(from)) return fail("not_found", `${from} does not exist`);
    if (from !== to && n[key].includes(to)) return fail("invalid", `${to} already exists`);
    if (from === to) return;
    const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === side;
    if (!isParent) {
      if (side === "in" && dataNamesInFlow(l.flow).has(to)) { renamePortLocal(n, "in", from, to, true); return; }
      if (side === "out" && dataNamesInFlow(l.flow).has(to) && to !== from) return fail("invalid", `“${to}” is already a data name in this flow`);
      renamePortLocal(n, side, from, to); return;
    }
    // pai → nome já usado só se for o outro lado desta mesma função (passthrough in↔out)
    if (dataNamesInFlow(l.flow).has(to) && to !== from) {
      const other = side === "out" ? n.ins : n.outs;
      if (!other.includes(to)) return fail("invalid", `“${to}” is already a data name in this flow`);
    }
    renameDatumInFlow(l.flow, from, to);
  },
  /** Troca de uma vez todos os dados de um lado (entrada ou saída) de uma função comum: nomes e, nas entradas, os valores. */
  setData: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs"); if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
    const side = str(a, "side") === "out" ? "out" : "in", names = (Array.isArray(a["names"]) ? a["names"] : []).map(x => claimDataInFlow(l.flow, x)), values = Array.isArray(a["values"]) ? a["values"].map(x => String(x ?? "").trim()) : [];
    if (new Set(names).size !== names.length) return fail("invalid", "Duplicate data name"); if (values.some(v => v.length > 300)) return fail("invalid", "Value too large");
    const prev = side === "out" ? [...n.outs] : [...n.ins];
    for (let i = 0; i < Math.min(prev.length, names.length); i++) {
      const from = prev[i]!, to = names[i]!; if (from === to) continue;
      // nome já usado: a atribuição final resolve (rebind / shrink); não propaga colisão
      if (dataNamesInFlow(l.flow).has(to)) continue;
      const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === side;
      if (isParent) renameDatumInFlow(l.flow, from, to);
      else renamePortLocal(n, side, from, to);
    }
    if (side === "out") { n.outs = names; return; }
    n.ins = names; const args: Record<string, string> = {}; names.forEach((nm, i) => { if (values[i]) args[nm] = values[i]!; }); if (Object.keys(args).length) n.args = args; else delete n.args;
  },
  /** Nome do dado no flow: pai propaga; filho desvincula; entrada→nome existente só aponta. */
  renameData: (p, a) => {
    const l = need(p, str(a, "id")), n = l.node; if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
    const c = contractOf(p, n); if (!c) return fail("invalid", "The data name can only change on lib functions");
    const side = str(a, "side") === "in" ? "in" : "out", to = claimDataInFlow(l.flow, a["to"]);
    if (side === "out") {
      if (c.outs.length !== 1) return fail("invalid", "Renaming only works when the lib returns a single data");
      const from = n.outs[0] ?? c.outs[0]!; if (from === to) return;
      const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === "out";
      if (!isParent) {
        if (dataNamesInFlow(l.flow).has(to) && to !== from) return fail("invalid", `“${to}” is already a data name in this flow`);
        renamePortLocal(n, "out", from, to); return;
      }
      if (dataNamesInFlow(l.flow).has(to) && to !== from && !n.ins.includes(to)) return fail("invalid", `“${to}” is already a data name in this flow`);
      renameDatumInFlow(l.flow, from, to); return;
    }
    if (c.ins.length !== 1) return fail("invalid", "Renaming only works when the lib takes a single parameter");
    const from = n.ins[0] ?? c.ins[0]!; if (from === to) return;
    const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === "in";
    if (!isParent) {
      if (dataNamesInFlow(l.flow).has(to)) { renamePortLocal(n, "in", from, to, true); return; }
      renamePortLocal(n, "in", from, to); return;
    }
    renameDatumInFlow(l.flow, from, to);
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
  const l = need(p, str(a, "id"));
  const name = add ? claimDataInFlow(l.flow, a["name"]) : cleanName(a["name"], "Data name");
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
      if (agent && !agent.startsWith("file:") && !agents.some(a => a.id === agent)) return fail("invalid", `Function ${n.id} uses a source that does not exist`); if (resp && !agents.some(a => a.id === resp)) return fail("invalid", `Function ${n.id} uses a person that does not exist`);
      const args = n.args && typeof n.args === "object" ? Object.fromEntries(Object.entries(n.args as Record<string, unknown>).map(([k, v]) => [k, String(v)])) : undefined;
      return { t: "fn", id: n.id, title: n.title, agent, resp, ins: strs(n.ins ?? [], "ins"), outs: strs(n.outs ?? [], "outs"), kids: list(n.kids ?? []), par: !!n.par, ...(args && Object.keys(args).length ? { args } : {}), ...(typeof n.file === "string" && n.file ? { file: n.file } : {}) };
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
    const a = agentOf(p, n.agent); if (hasContract(a)) { if (!a!.tasks.includes(n.title)) { n.title = a!.tasks[0] ?? n.title; applyContract(p, n); } else if (!n.ins.length && !n.outs.length) applyContract(p, n); }   // só completa o que falta: nomes dados às saídas e valores preenchidos ficam
  });
  return p;
}
