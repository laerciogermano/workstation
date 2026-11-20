import { icon, KIND_ICON } from "./icons";
import { agentOf, contractOf, filesOf, hasContract,  cubeName, flowFile, insideBlock, isCube, isRoot, locate, type Agent, type Fn, type Node, type Project } from "./model";
import { exprIdents, isDataRef } from "./args";
import { layout, type Row, type Scene } from "./layout";

/** Geometria do plano (px). IND = degrau de indentação; no diagrama, cada barra lateral tem largura IND. */
export const G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 } as const;   // WS: largura da coluna com o texto fora da barra (a função fica pequena)
/** Gutter do plano (só SVG à direita) = maxDepth × IND. */
export const planGutter = (sc: Pick<Scene, "maxDepth">): number => sc.maxDepth * G.IND;
export interface Ui { closed: ReadonlySet<string>; sel: string | null; txtIn: boolean; /** true = em cada estado, todos os dados disponíveis; ausente/false = só os novos (os que chegam naquele passo) */ allData?: boolean; /** largura mínima da coluna do plano (alinha as funções de um arquivo) */ minW?: number }

export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const tw = (t: string, px = 6.1): number => Math.ceil(t.length * px);
/** Lista de dados em uma linha só, com reticências quando passa de `max` caracteres (a lista completa vai no tooltip). */
/** Valor preenchido de uma entrada (vazio = abstrata / ainda sem valor). */
const valueOf = (f: Fn, n: string): string => f.args?.[n]?.trim() || "";
/** Nome do dado ao lado do marcador — sem valor; o valor fica só no estado embaixo. Cubo: só o nome do cubo. */
export function inputLabel(_p: Project, f: Fn): string {
  return isCube(f.ins) ? cubeName(f, "in") : (f.ins[0] ?? "");
}
/** Tooltip do dado de entrada: todos os campos, com valores completos. */
export const inputTip = (p: Project, f: Fn): string => { const lib = !!contractOf(p, f); return f.ins.map(n => (lib ? `${n} = ${valueOf(f, n) || "(not filled in yet)"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n)).join("\n"); };
export const dataText = (names: readonly string[], max = 24): string => { const t = names.join(", "); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };
/** Rótulo do estado embaixo: `nome` ou `nome = valor` (cortado). */
export const stateLabel = (name: string, value?: string, max = 26): string => value != null && value !== "" ? dataText([`${name} = ${value}`], max) : dataText([name], max);
export const colX = (s: number, w: number = G.W, gutter = 0): number => gutter + G.OX + s * w;
export const rowY = (i: number): number => G.HEAD + i * G.RH;
export const planWidth = (sc: Scene, w: number = G.W): number => colX(sc.nSteps, w, planGutter(sc)) + 160;
/** Largura da coluna de um passo: no modo texto cresce para o nome inteiro caber na barra, com folga dos dois lados. */
export const PAD = 12;
export const colW = (sc: Scene, ui: Pick<Ui, "txtIn" | "minW">): number => Math.max(ui.minW ?? 0, ui.txtIn ? Math.max(G.W, ...sc.leaves.map(l => tw((l.node as Fn).title, 6.2) + 2 * PAD + 2 * G.INS)) : G.WS);
/** Estados (dados produzidos) que aparecem embaixo de cada coluna, como no Flow IDE: quem termina no passo anterior à coluna. */
export interface StateItem {
  name: string; cube: boolean; fields: string[];
  /** valor inicializado (literal/expr); no rodapé aparece como `nome = valor` */
  value?: string;
  /** valor de cada campo quando o valor é um objeto literal */
  fieldValues?: Readonly<Record<string, string>>;
  /** já existia em estado anterior (só aparece em "todos") */ old?: boolean;
  /** dado de fora (state): entrada que ninguém produz */ abs?: boolean;
  /** função dona do dado e lado (para o menu do estado) */ owner?: string; side?: "in" | "out";
}
/** Pares nome/valor de um objeto literal (`{ a: 1, b, ...c }` → a=1, b, c); null se não for objeto. */
export function objectPairs(expr: string): { name: string; value?: string }[] | null {
  const e = expr.trim(); if (!e.startsWith("{") || !e.endsWith("}")) return null;
  const parts: string[] = []; let depth = 0, cur = "", q = "";
  for (const ch of e.slice(1, -1)) {
    if (q) { cur += ch; if (ch === q) q = ""; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { q = ch; cur += ch; continue; }
    if ("{[(".includes(ch)) depth++; else if ("}])".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  return parts.map(x => x.trim()).filter(Boolean).map(x => {
    const m = /^([A-Za-z_$][\w$]*)\s*:\s*(.+)$/s.exec(x);
    if (m) return { name: m[1]!, value: m[2]!.trim() };
    return { name: x.replace(/^\.\.\./, "").trim() };
  });
}
/** Campos de primeiro nível de um objeto literal; null se não for objeto. */
export function objectFields(expr: string): string[] | null {
  const p = objectPairs(expr); return p && p.map(x => x.name);
}
export const stateRows = (items: readonly StateItem[]): number => items.reduce((n, it) => n + 1 + (it.cube ? it.fields.length : 0), 0);
export function statesByStep(sc: Scene, all = false): Map<number, StateItem[]> {
  // composição (não-folha) também entra: as entradas/saídas da camada aparecem no rodapé como as marcas no diagrama
  const m = new Map<number, StateItem[]>(), add = (col: number, it: StateItem): void => { const list = m.get(col) ?? []; if (list.some(x => x.name === it.name)) return; list.push(it); m.set(col, list); };
  for (const r of sc.rows) {
    if (r.kind !== "fn") continue; const f = r.node as Fn;
    // dado inicializado com um valor logo antes da função (ex.: value = { id, score } / text = false): existe a partir do início dela; o valor vai só no rodapé
    for (const i of f.ins) {
      const e = f.args?.[i]?.trim(); if (!e || isDataRef(e)) continue;
      const pairs = objectPairs(e), fields = pairs?.map(p => p.name) ?? null;
      const fieldValues = pairs ? Object.fromEntries(pairs.filter(p => p.value != null).map(p => [p.name, p.value!])) : undefined;
      add(r.s, { name: i, cube: !!fields, fields: fields ?? [i], value: e, fieldValues, owner: f.id, side: "in" });
    }
    if (f.outs.length) add(r.e + 1, { name: isCube(f.outs) ? cubeName(f, "out") : f.outs[0]!, cube: isCube(f.outs), fields: f.outs, owner: f.id, side: "out" });
  }
  // dados abstratos (entradas de fora: as do flow, das composições e das folhas que ninguém produz): aparecem no estado em que são usados, como a marca no diagrama
  const made = new Set<string>(); for (const r of sc.rows) if (r.kind === "fn") (r.node as Fn).outs.forEach(o => made.add(o));
  const loopVars = new Set<string>(); for (const r of sc.rows) if (r.kind === "block" && r.node.t === "for") loopVars.add(r.node.v);   // a variável do for não vem de fora
  const ext = new Map<string, { col: number; owner: string }>();
  for (const r of sc.rows) if (r.kind === "fn") for (const n of (r.node as Fn).ins) if (!(r.node as Fn).args?.[n]?.trim() && !ext.has(n)) ext.set(n, { col: r.s, owner: r.node.id }); else if (ext.has(n) && r.s < ext.get(n)!.col) ext.set(n, { col: r.s, owner: ext.get(n)!.owner });
  for (const [n, e] of ext) if (!made.has(n) && !loopVars.has(n)) add(e.col, { name: n, cube: false, fields: [n], abs: true, owner: e.owner, side: "in" });
  if (!all) return m;
  // todos os disponíveis: cada estado repete o que já existia (um nome produzido de novo substitui o antigo)
  const cols = [...m.keys()].sort((x, y) => x - y), out = new Map<number, StateItem[]>(); let acc: StateItem[] = [];
  for (let c = cols[0] ?? 0; c <= sc.nSteps; c++) {
    const fresh = m.get(c) ?? [], names = new Set(fresh.map(i => i.name));
    acc = [...acc.filter(i => !names.has(i.name)).map(i => ({ ...i, old: true })), ...fresh]; if (acc.length) out.set(c, acc);
  }
  return out;
}
export const STATE_ROW = 15;
export const planHeight = (sc: Scene, all = false): number => rowY(sc.rows.length) + 64 + Math.max(0, ...[...statesByStep(sc, all).values()].map(stateRows)) * STATE_ROW;
/** Chrome fixo da tabela: padding esquerdo 18 + coluna Source 120 + padding direito 14. */
const TABLE_CHROME = 18 + 120 + 14;
/** A tabela cresce com o aninhamento (padding por depth) para o texto não invadir o plano. */
export function tableWidth(sc: Scene, p: Project): number {
  // coluna Function: indent (depth×IND×2, igual ao CSS) + texto + folga do menu hover
  let need = 90;
  for (const r of sc.rows) {
    const pad = 10 + r.depth * G.IND * 2; let w: number;
    if (r.kind === "fn") {
      const f = r.node as Fn, a = agentOf(p, f.agent);
      w = pad + (r.leaf ? 22 : 38) + (f.title || "unnamed").length * 7.4 + (a?.kind === "ia" ? 28 + a.name.length * 6.5 : 0) + (f.par ? 22 : 0) + (hasContract(a) && r.leaf ? 30 : 0);
    } else {
      const n = r.node as Exclude<Node, Fn>;
      const txt = r.kind === "catch" ? "if the try fails" : r.kind === "else" ? "otherwise" : n.t === "try" ? `catch ↓ ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
      w = pad + 54 + txt.length * 7.4;
    }
    // espaço seguro: o menu de opções (aparece ao passar o mouse na linha) tem de caber ao lado do texto, sem cobri-lo
    const part = r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main", menu = toolsFor(p, r.id, part).length * 25 + 12 + 24;
    need = Math.max(need, w + menu);
  }
  // piso: aninhamento empurra a coluna — não engole o plano
  need = Math.max(need, 90 + sc.maxDepth * G.IND * 2 + 48);
  return Math.round(TABLE_CHROME + need);
}

// ───────────────────────── painel de código (largura e abrir/fechar, como nas IDEs) ─────────────────────────
export const CODE_MIN = 300, CODE_DEFAULT = 480, CODE_MAX_RATIO = 0.7;
/** Largura do painel de código dentro de [mínimo, 70% da área], para o fluxo nunca sumir. */
export const clampCodeWidth = (w: number, total: number): number => Math.round(Math.min(Math.max(Number.isFinite(w) ? w : CODE_DEFAULT, CODE_MIN), Math.max(CODE_MIN, total * CODE_MAX_RATIO)));
export interface Prefs { codeW: number; codeOpen: boolean }
export const DEFAULT_PREFS: Prefs = { codeW: CODE_DEFAULT, codeOpen: true };
/** Lê as preferências salvas (qualquer coisa fora do formato volta ao padrão). */
export function parsePrefs(raw: string | null): Prefs {
  try { const o = JSON.parse(raw ?? "null") as Partial<Prefs> | null; return { codeW: typeof o?.codeW === "number" && Number.isFinite(o.codeW) ? o.codeW : CODE_DEFAULT, codeOpen: typeof o?.codeOpen === "boolean" ? o.codeOpen : true }; } catch { return { ...DEFAULT_PREFS }; }
}

// ───────────────────────── ferramentas (regras ÚNICAS, usadas pela tabela e pelo plano) ─────────────────────────
export interface Tool { act: string; id: string; icon: string; title: string; danger?: boolean; data?: Record<string, string> }

/** Menu de um dado listado nos estados: renomear / remover (função comum), editar (cubo ou entrada de lib) ou renomear a saída (lib). */
export function stateTools(p: Project, owner: string, side: "in" | "out", name: string): Tool[] {
  const n = locate(p, owner)?.node; if (!n || n.t !== "fn") return [];
  const t = (act: string, icon: string, title: string, extra: Partial<Tool> = {}): Tool => ({ act, id: owner, icon, title, data: { side, name }, ...extra });
  if (!name) return [t("editData", "cube", "Edit the data")];
  if (contractOf(p, n)) return side === "out" ? [t("renameOut", "text", "Rename the data")] : [t("editData", "cube", "Set the value")];
  return [t("renameData", "text", "Rename the data"), t("removeIo", "trash", side === "in" ? "Remove the input" : "Remove the output", { danger: true })];
}

/** Botões de um nó. Os blocos (if · for · try · catch) compartilham as mesmas ações; só mudam os rótulos. */
export function toolsFor(p: Project, id: string, part: "main" | "catch" | "else" = "main"): Tool[] {
  const l = locate(p, id); if (!l) return [];
  const n = l.node, root = isRoot(p, id), t = (act: string, ic: string, title: string, extra: Partial<Tool> = {}): Tool => ({ act, id, icon: ic, title, ...extra });
  if (n.t === "fn") {
    const out: Tool[] = [];
    if (n.kids.length) out.push(t("toggle", "chevron", "Open / close children"));
    out.push(t("addChild", "sibling", "Add child (inside this function)"));
    if (!root) {
      out.push(t("addSibling", "child", "Add sibling (next to it, same block)"), t("wrap", "diamond", "Add selection (if)", { data: { kind: "if" } }), t("wrap", "repeat", "Add repetition (for)", { data: { kind: "for" } }), t("wrap", "shield", "Add try/catch", { data: { kind: "try" } }));
      if (l.list[l.index - 1]?.t === "fn") out.push(t("parallel", "parallel", n.par ? "Run in sequence" : "Run together with the previous one", { data: { on: String(!n.par) } }));
      if (insideBlock(p, id)) out.push(t("exitScope", "log-out", "Leave the block (this and the following ones)"));
      out.push(t("remove", "trash", "Remove", { danger: true }));
    }
    return out;
  }
  const where = part === "else" ? "else" : part === "catch" ? "catch" : n.t === "for" ? "for" : n.t === "if" ? "if" : "try";
  const out: Tool[] = [t("addChild", "sibling", `Add child (inside the ${where})`, part === "catch" ? { data: { catch: "1" } } : part === "else" ? { data: { else: "1" } } : {})];
  if (part === "main") out.push(t("wrap", "diamond", "Add condition (if) to this block", { data: { kind: "if" } }), t("wrap", "repeat", "Add loop (for) to this block", { data: { kind: "for" } }), t("wrap", "shield", "Add try/catch to this block", { data: { kind: "try" } }));
  if (part === "main" && n.t === "if" && !n.elseKids.length) out.push(t("addElse", "branch", "Add else"));
  out.push(t("addSibling", "child", "Add sibling to the right (outside the block)"));
  if (part === "main") out.push(t("setScope", "grow", "Include the next one in the block", { data: { delta: "1" } }), t("setScope", "shrink", "Take the last one out of the block", { data: { delta: "-1" } }));
  // lixeira = remove a subárvore inteira (if/for/try + todos os filhos aninhados); unwrap fica só no modelo
  out.push(part === "else" ? t("removeElse", "trash", "Remove else", { danger: true }) : t("remove", "trash", `Remove ${n.t === "try" ? "try/catch" : n.t === "for" ? "repetition (for)" : "selection (if)"} and everything inside`, { danger: true }));
  return out;
}
export const toolsHtml = (tools: Tool[]): string => tools.map(x => `<button type="button" class="ib${x.danger ? " danger" : ""}" data-act="${x.act}" data-id="${esc(x.id)}" ${Object.entries(x.data ?? {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} title="${esc(x.title)}" aria-label="${esc(x.title)}">${icon(x.icon)}</button>`).join("");

/**
 * Ligações de DADO só entre passos vizinhos (o traço nunca pula uma coluna): de quem produz um dado até quem o usa (entrada de mesmo nome,
 * ou citado no valor preenchido) quando o produtor termina no passo imediatamente anterior. Cobre as funções do catch / else, que não fazem
 * parte da sequência principal e por isso ficariam sem traço.
 */
export interface DataLink { from: Row; to: Row; name: string }
export function dataLinks(p: Project, sc: Scene): DataLink[] {
  const fns = sc.rows.filter(r => r.kind === "fn" && r.leaf), out: DataLink[] = [];
  fns.forEach((b, i) => {
    const f = b.node as Fn, c = contractOf(p, f), names = new Set<string>();
    for (const n of f.ins) if (!f.args?.[n]?.trim()) names.add(n);                          // entrada de mesmo nome (só quando não foi preenchida à mão)
    for (const v of Object.values(f.args ?? {})) for (const id of exprIdents(v)) names.add(id);
    for (const name of names) for (let j = i - 1; j >= 0; j--) { const a = fns[j]!; if ((a.node as Fn).outs.includes(name) && a.e + 1 === b.s) { out.push({ from: a, to: b, name }); break; } }
  });
  return out;
}

// ───────────────────────── textos ─────────────────────────
export const blockLabel = (_p: Project, n: Node): string => {
  if (n.t === "if") return `if (${n.test})`;
  if (n.t === "for") return `for (${n.v} of ${n.coll})`;
  return "try";
};
export const fnKind = (p: Project, f: Fn): "conc" | "abs" | "nag" => { if (f.kids.length) return "conc"; const a = agentOf(p, f.agent); return !a ? "nag" : a.kind === "maquina" || a.kind === "arquivo" ? "conc" : "abs"; };

// ───────────────────────── tabela (esquerda) ─────────────────────────
const circle = (cls: string, ic: string, title: string): string => `<span class="fav ${cls}" title="${esc(title)}">${ic ? icon(ic) : ""}</span>`;
function agentSelect(p: Project, f: Fn, kind: "agent" | "resp"): string {
  const cur = agentOf(p, kind === "agent" ? f.agent : f.resp), want = (a: Agent): boolean => (kind === "resp" ? a.kind === "pessoa" : true);
  const groups = (["maquina"] as const).map(k => { const list = p.agents.filter(a => a.kind === k && want(a)); return list.length ? `<optgroup label="${{ maquina: "Browser libs", pessoa: "People", ia: "AI agents" }[k]}">${list.map(a => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : ""; }).join("");
  // fonte "arquivo": uma função de outro arquivo do projeto (a do próprio arquivo não entra: evita a chamada recursiva a si mesma)
  const own = locate(p, f.id)?.flow, files = kind === "agent" ? filesOf(p).filter(x => !own || x !== flowFile(own)) : [];
  const fileGroup = files.map(x => `<optgroup label="${esc(x)}">${(agentOf(p, `file:${x}`)?.tasks ?? []).map(t => `<option value="file:${esc(x)}#${esc(t)}"${f.agent === `file:${x}` && f.title === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</optgroup>`).join("");
  return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Source of ${esc(f.title)}"><option value="">Abstract</option>${groups}${fileGroup}</select>`;
}
function respCell(p: Project, r: Row): string {
  const f = r.node as Fn;
  if (isRoot(p, f.id)) return `<span class="c-ag" title="Source: the file of this flow">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(flowFile(f).replace(/\.[^.]+$/, ""))}</span></span>`;
  if (!r.leaf) { const own = locate(p, f.id)?.flow, file = own ? flowFile(own).replace(/\.[^.]+$/, "") : ""; return `<span class="c-ag" title="Source: the file of this flow (a function with children is concrete: it runs its own steps)">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(file)}</span></span>`; }   // composição = concreta; a origem é o arquivo local
  const a = agentOf(p, f.agent);
  if (a?.kind === "ia") { const pe = agentOf(p, f.resp); return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Person: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Choose the person in charge") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "resp")}</span>`; }
  return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Choose source") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "agent")}</span>`;
}
function taskCell(p: Project, r: Row): string {
  const f = r.node as Fn, a = agentOf(p, f.agent), pad = r.depth * G.IND * 2;
  const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Function"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Open / close children">${icon("chevron")}</span><span class="fn-dot ${fnKind(p, f)}" title="Function"></span>`;
  const name = hasContract(a) && r.leaf
    ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Function of ${esc(a!.name)}">${a!.tasks.map(t => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`
    : `<b data-act="rename" data-id="${esc(f.id)}" title="Click to rename">${esc(f.title || "unnamed")}</b>`;
  const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
  return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Runs together with the previous one">∥</span>' : ""}</span>`;
}
export function renderTable(p: Project, sc: Scene, ui: Ui): string {
  return sc.rows.map((r, i) => {
    const sel = ui.sel === r.id ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
    if (r.kind === "block" || r.kind === "catch" || r.kind === "else") {
      const n = r.node as Exclude<Node, Fn>, part = r.kind === "block" ? "main" : r.kind, pad = r.depth * G.IND * 2;
      const tag = r.kind === "catch" ? `<span class="trd c">catch</span><b class="mono">if the try fails</b>` : r.kind === "else" ? `<span class="trd e">else</span><b class="mono">otherwise</b>`
        : n.t === "if" ? `${icon("diamond", "mini")}<b class="mono">${esc(blockLabel(p, n))}</b>` : n.t === "for" ? `<span class="lpd">↻</span><b class="mono">${esc(blockLabel(p, n))}</b>`
        : `<span class="trd">try</span><b class="mono">catch ↓ ${esc(n.t === "try" && n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler")}</b>`;
      return `<div class="grow ifrow ${part === "main" ? n.t + "row" : part + "row"}${sel}" ${base} data-part="${part}"><span class="c-ag"></span><span class="nm" style="padding-left:${pad}px">${tag}</span><span class="fl-tools">${toolsHtml(toolsFor(p, r.id, part))}</span></div>`;
    }
    return `<div class="grow${sel}" ${base}>${respCell(p, r)}${taskCell(p, r)}<span class="fl-tools">${toolsHtml(toolsFor(p, r.id))}</span></div>`;
  }).join("");
}

// ───────────────────────── plano (direita, SVG) ─────────────────────────
export function renderPlan(p: Project, flow: Fn, sc: Scene, ui: Ui): string {
  const cw = colW(sc, ui), gutter = planGutter(sc), W = planWidth(sc, cw), H = planHeight(sc, ui.allData), by = new Map<string, number>();
  const colX = (n: number): number => gutter + G.OX + n * cw;
  sc.rows.forEach((r, i) => { if (r.kind === "fn" || r.kind === "block") by.set(r.id, i); });
  const ym = (i: number): number => rowY(i) + G.RH / 2;
  const out: string[] = [], bands: string[] = [], over: string[] = [];
  // grade e passos (deslocados pelo gutter das barras de indentação)
  for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX(s)}" y1="${G.HEAD - 8}" x2="${colX(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
  sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="${gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
  const chip = (s: number, y: number): string => `<g class="chip"><rect x="${colX(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
  const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
  for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
  // os estados embaixo de cada coluna (como no Flow IDE): um quadrado (ou cubo) e o nome do dado que chega ali
  for (const [col, items] of statesByStep(sc, ui.allData)) {
    let row = 0;
    for (const it of items) {
      const y = bot + 34 + row++ * STATE_ROW;
      out.push(`<g class="stt${it.old ? " old" : ""}"${it.owner ? ` data-sthover="${esc(it.owner)}" data-side="${it.side}" data-name="${esc(it.cube ? "" : it.name)}"` : ""}><${it.cube ? `path class="scube" transform="translate(${colX(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"` : `rect class="sdot${it.abs ? " a" : ""}" x="${colX(col) - 4}" y="${y - 4}" width="8" height="8"`}/><text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(it.cube ? dataText([it.name], 26) : stateLabel(it.name, it.value, 26))}</text><title>${esc(it.value ?? it.fields.join(", "))}</title></g>`);
      // o cubo mostra os campos (com valor, se houver) logo abaixo, indentados
      if (it.cube) for (const fld of it.fields) { const fy = bot + 34 + row++ * STATE_ROW, fv = it.fieldValues?.[fld]; out.push(`<g class="stt sub${it.old ? " old" : ""}"><rect class="sdot sm" x="${colX(col) + 8}" y="${fy - 2.5}" width="5" height="5"/><text class="dn st" x="${colX(col) + 18}" y="${fy + 3.2}">${esc(stateLabel(fld, fv, 24))}</text><title>${esc(fv != null ? `${fld} = ${fv}` : fld)}</title></g>`); }
    }
  }
  out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);

  /** Só a barra vertical: 1ª colada na divisória (x=0); as seguintes a cada IND. */
  const rail = (cls: string, depth: number, y0: number, h: number): void => {
    if (depth <= 0 || h <= 0) return;
    const x = (depth - 1) * G.IND + 0.5;
    bands.push(`<line class="bande ${cls}" x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}"/>`);
  };
  // composição (pai): faixa lateral sobre as linhas dos filhos
  sc.rows.forEach((r, i) => {
    if (r.kind !== "fn" || r.leaf || r.depth === 0 || r.last <= i) return;
    rail("co", r.depth, rowY(i + 1), (r.last - i) * G.RH);
  });
  // bandas dos blocos + etiquetas (pills)
  sc.rows.forEach((r, i) => {
    if (r.kind !== "block" && r.kind !== "catch" && r.kind !== "else") return;
    const n = r.node as Exclude<Node, Fn>, cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
    rail(cls, r.depth, rowY(i), (r.last - i + 1) * G.RH);
    // if e for: ícone na linha (losango / ↻), pill alinhada depois — catch/else/try ficam colados na coluna
    const mark = r.kind === "block" && (n.t === "if" || n.t === "for"), px = colX(r.s) + (mark ? 11 : 4);
    const txt = r.kind === "catch" ? "catch · if the try fails" : r.kind === "else" ? "else" : n.t === "try" ? `try · catch ↓ ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
    const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
    if (mark && n.t === "if") over.push(`<path class="fif" d="M${colX(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
    if (mark && n.t === "for") over.push(`<text class="flp" x="${colX(r.s)}" y="${ym(i) + 3.5}" text-anchor="middle">↻</text>`);
    over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
    // hit transparente (toque) + traço fino (visual discreto)
    if (r.kind === "block") over.push(`<rect class="handle-hit" data-drag="${esc(r.id)}" x="${px + w - 6}" y="${ym(i) - 12}" width="18" height="26"/><rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 4}" y="${ym(i) - 8}" width="4" height="16" rx="1"><title>Drag to grow or shrink the block</title></rect>`);
  });

  // funções
  const produced = new Set<string>(); sc.leaves.forEach(l => (l.node as Fn).outs.forEach(o => produced.add(o)));
  /** Entradas e saídas de uma função (marca, linha até a barra, nome do dado e fantasma de adicionar): funções comuns e a função de primeira ordem. */
  const ioMarks = (f: Fn, r: Row, i: number, x1: number, x2: number): void => {
    // entradas / saídas (marcas na linha de dados) e fantasmas
    // o quadrado do dado fica EXATAMENTE onde a caixa fantasma aparece: na linha da função, sobre a coluna de entrada / saída;
    // o nome do dado fica na linha de dados logo abaixo
    const lib = !!contractOf(p, f), inAbs = f.ins.some(n => !(produced.has(n) || f.args?.[n]?.trim() || contractOf(p, f)?.optional?.includes(n)));
    const mark = (x: number, list: readonly string[], kind: "in" | "out", abs: boolean, tip: string): string => !list.length ? "" : (isCube(list) || (kind === "in" && list.length === 1 && /^\s*\{/.test(f.args?.[list[0]!] ?? "")))   // vários dados ou um dado do tipo objeto = cubo
      ? `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><path class="cube${abs ? " a" : ""}" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(isCube(list) ? `${cubeName(f, kind)}: ${list.join(", ")}` : list[0]!)} · ${tip}</title></g>`
      : `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><rect class="${abs ? "dot a" : "dot"}" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(list[0]!)} · ${tip}</title></g>`;
    // a linha que liga o dado à função: da marca da entrada até a barra, e da barra até a marca da saída
    if (f.ins.length) over.push(`<line class="dlk" x1="${colX(r.s) + 4}" y1="${ym(i)}" x2="${x1}" y2="${ym(i)}"/>`);
    if (f.outs.length) over.push(`<line class="dlk" x1="${x2}" y1="${ym(i)}" x2="${colX(r.e + 1) - 4}" y2="${ym(i)}"/>`);
    over.push(mark(colX(r.s), f.ins, "in", inAbs, inAbs ? "abstract input (state / another layer)" : "concrete input (same layer)"), mark(colX(r.e + 1), f.outs, "out", false, "output"));
    // nome do dado na MESMA altura do quadrado: os da esquerda (entradas) à esquerda dele, os da direita (saídas) à direita; cubo mostra o nome do cubo
    const insLabel = inputLabel(p, f), insTip = inputTip(p, f), outsLabel = isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? "";
    if (f.ins.length) over.push(`<text class="dn in"${!lib && f.ins.length === 1 ? ` data-act="renameData" data-id="${esc(f.id)}" data-side="in" data-name="${esc(f.ins[0]!)}"` : ""} x="${colX(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(dataText([insLabel], 40))}<title>${esc(insTip)}</title></text>`);
    if (f.outs.length) over.push(`<text class="dn out"${f.outs.length === 1 ? ` data-act="${lib ? "renameOut" : "renameData"}" data-id="${esc(f.id)}" data-side="out" data-name="${esc(f.outs[0]!)}"` : ""} x="${colX(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(dataText([outsLabel]))}<title>${esc(f.outs.join(", "))}</title></text>`);
    const ghost = (x: number, kind: "in" | "out", tip: string): string => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
    if (!lib && !f.ins.length) over.push(ghost(colX(r.s), "in", "Add input"));
    if (!lib && !f.outs.length) over.push(ghost(colX(r.e + 1), "out", "Add output"));
  };
  const barX = new Map<string, { x1: number; x2: number }>();   // onde a barra de cada função começa e termina (as ligações saem e chegam nela)
  sc.rows.forEach((r, i) => {
    if (r.kind !== "fn") return;
    const f = r.node as Fn, selC = ui.sel === f.id ? " sel" : "";
    /** X do nome à direita: depois da marca + rótulo de saída, para não cair em cima do retorno. */
    const lblAfterOuts = (fr: Fn): number => {
      const outsTxt = dataText([isCube(fr.outs) ? cubeName(fr, "out") : fr.outs[0] ?? ""]);
      return colX(r.e + 1) + 10 + (fr.outs.length ? G.GAP - 10 + tw(outsTxt, 6.2) + 36 : 0);
    };
    if (!r.leaf) {
      const inset = 21, x1 = colX(r.s) + inset, x2 = colX(r.e + 1) - inset;   // mesmo recuo em toda composição: a barra pai nunca é menor que a filha (igual quando cobrem os mesmos estados) e nunca maior que ela por recuo
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><path class="sum${selC}" d="M${x1} ${ym(i) - 3.5}H${x2}V${ym(i) + 7.5}L${x2 - 5} ${ym(i) + 3.5}H${x1 + 5}L${x1} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} · composition = layer</title></g>`);
      ioMarks(f, r, i, x1, x2);   // toda composição (a raiz e as internas) também tem entradas e saídas
      // nome depois das saídas (e depois no SVG) — não sobrepõe o retorno
      over.push(`<text class="lbl" x="${lblAfterOuts(f)}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      return;
    }
    const k = fnKind(p, f), shown = f.title;
    // sem texto dentro da barra (título vazio ou nome fora da barra): círculo perfeito; com texto, a barra se expande até a largura do estado
    const hasText = ui.txtIn && shown.trim() !== "", cx = (colX(r.s) + colX(r.e + 1)) / 2;
    const x1 = hasText ? colX(r.s) + G.INS : cx - G.BH / 2, x2 = hasText ? colX(r.e + 1) - G.INS : cx + G.BH / 2;
    barX.set(f.id, { x1, x2 });
    over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
    ioMarks(f, r, i, x1, x2);
    if (!ui.txtIn) over.push(`<text class="lbl" x="${lblAfterOuts(f)}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
  });

  // sequência: A termina no passo anterior ao início de B → cotovelo da saída de A até a barra de B
  // o traço existe só onde há DADO ligando as funções: a saída de uma é entrada (ou valor) da outra, no passo vizinho. Tirou a entrada, o traço some.
  const elbow = (a: Row, b: Row): string => `M${barX.get(a.id)?.x2 ?? colX(a.e + 1) - G.INS} ${ym(by.get(a.id)!)} H${colX(a.e + 1)} V${ym(by.get(b.id)!)} H${barX.get(b.id)?.x1 ?? colX(b.s) + G.INS}`;
  const pairs = new Map<string, { from: Row; to: Row; names: string[] }>();
  for (const l of dataLinks(p, sc)) { const k = `${l.from.id}>${l.to.id}`, e = pairs.get(k); if (e) e.names.push(l.name); else pairs.set(k, { from: l.from, to: l.to, names: [l.name] }); }
  for (const { from, to, names } of pairs.values()) out.push(`<path class="dep" d="${elbow(from, to)}"><title>${esc(names.join(", "))}</title></path>`);
  return `<svg class="plan" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano do fluxo ${esc(flow.title)}"><g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
}

export function build(p: Project, flowId: string, ui: Ui): { scene: Scene; table: string; plan: string; w: number } {
  const l = locate(p, flowId); if (!l || l.node.t !== "fn") throw new Error(`Flow ${flowId} does not exist`);
  const scene = layout(l.node, { closed: ui.closed });
  return { scene, table: renderTable(p, scene, ui), plan: renderPlan(p, l.node, scene, ui), w: colW(scene, ui) };
}
