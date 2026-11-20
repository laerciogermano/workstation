import { icon, KIND_ICON } from "./icons";
import { agentOf, contractOf, cubeName, flowFile, insideBlock, isCube, isRoot, locate, type Agent, type Fn, type Node, type Project } from "./model";
import { exprIdents } from "./args";
import { layout, type Row, type Scene } from "./layout";

/** Geometria do plano (px). */
export const G = { RH: 34, HEAD: 52, OX: 230, W: 160, INS: 28, BH: 22, IND: 14, GAP: 16 } as const;
export interface Ui { closed: ReadonlySet<string>; sel: string | null; txtIn: boolean }

export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const tw = (t: string, px = 6.1): number => Math.ceil(t.length * px);
/** Lista de dados em uma linha só, com reticências quando passa de `max` caracteres (a lista completa vai no tooltip). */
/** Texto do dado de entrada ao lado do marcador: o nome E o valor (`text = "Hello"`; `?` quando ainda não foi preenchido). Cubo: nome do cubo + os campos com valores. */
const valueOf = (f: Fn, n: string): string => f.args?.[n]?.trim() || "";
export function inputLabel(p: Project, f: Fn): string {
  const lib = !!contractOf(p, f), one = (n: string): string => (lib ? `${n} = ${valueOf(f, n) || "?"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n);
  return isCube(f.ins) ? (lib || f.ins.some(n => valueOf(f, n)) ? `${cubeName(f, "in")} { ${f.ins.map(one).join(", ")} }` : cubeName(f, "in")) : one(f.ins[0] ?? "");
}
/** Tooltip do dado de entrada: todos os campos, com valores completos. */
export const inputTip = (p: Project, f: Fn): string => { const lib = !!contractOf(p, f); return f.ins.map(n => (lib ? `${n} = ${valueOf(f, n) || "(not filled in yet)"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n)).join("\n"); };
export const dataText = (names: readonly string[], max = 24): string => { const t = names.join(", "); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };
export const colX = (s: number, w: number = G.W): number => G.OX + s * w;
export const rowY = (i: number): number => G.HEAD + i * G.RH;
export const planWidth = (sc: Scene, w: number = G.W): number => colX(sc.nSteps, w) + 160;
/** Largura da coluna de um passo: no modo texto cresce para o nome inteiro caber na barra, com folga dos dois lados. */
export const PAD = 12;
export const colW = (sc: Scene, ui: Pick<Ui, "txtIn">): number => (ui.txtIn ? Math.max(G.W, ...sc.leaves.map(l => tw((l.node as Fn).title, 6.2) + 2 * PAD + 2 * G.INS)) : G.W);
/** Estados (dados produzidos) que aparecem embaixo de cada coluna, como no Flow IDE: quem termina no passo anterior à coluna. */
export interface StateItem { name: string; cube: boolean; fields: string[] }
export function statesByStep(sc: Scene): Map<number, StateItem[]> {
  const m = new Map<number, StateItem[]>();
  for (const r of sc.rows) {
    if (r.kind !== "fn" || !r.leaf) continue; const f = r.node as Fn; if (!f.outs.length) continue;
    const col = r.e + 1, list = m.get(col) ?? []; list.push({ name: isCube(f.outs) ? cubeName(f, "out") : f.outs[0]!, cube: isCube(f.outs), fields: f.outs }); m.set(col, list);
  }
  return m;
}
export const STATE_ROW = 15;
export const planHeight = (sc: Scene): number => rowY(sc.rows.length) + 64 + Math.max(0, ...[...statesByStep(sc).values()].map(l => l.length)) * STATE_ROW;
/** A tabela cresce para a linha de dados caber, mas até um limite (o que passar vira reticências; a lista completa fica no tooltip). */
export const tableWidth = (sc: Scene): number => 440 + sc.maxDepth * G.IND * 2;

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
  out.push(part === "else" ? t("removeElse", "trash", "Remove else", { danger: true }) : t("unwrap", "trash", `Remove ${n.t === "try" ? "try/catch" : n.t === "for" ? "repetition (for)" : "selection (if)"}`, { danger: true }));
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
export const fnKind = (p: Project, f: Fn): "conc" | "abs" | "nag" => { const a = agentOf(p, f.agent); return !a ? "nag" : a.kind === "maquina" ? "conc" : "abs"; };

// ───────────────────────── tabela (esquerda) ─────────────────────────
const circle = (cls: string, ic: string, title: string): string => `<span class="fav ${cls}" title="${esc(title)}">${ic ? icon(ic) : ""}</span>`;
function agentSelect(p: Project, f: Fn, kind: "agent" | "resp"): string {
  const cur = agentOf(p, kind === "agent" ? f.agent : f.resp), want = (a: Agent): boolean => (kind === "resp" ? a.kind === "pessoa" : true);
  const groups = (["maquina", "pessoa", "ia"] as const).map(k => { const list = p.agents.filter(a => a.kind === k && want(a)); return list.length ? `<optgroup label="${{ maquina: "Browser libs", pessoa: "People", ia: "AI agents" }[k]}">${list.map(a => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : ""; }).join("");
  return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Source of ${esc(f.title)}"><option value="">${cur ? "No source" : "Choose source"}</option>${groups}</select>`;
}
function respCell(p: Project, r: Row): string {
  const f = r.node as Fn;
  if (isRoot(p, f.id)) return `<span class="c-ag" title="Source: the file of this flow">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(flowFile(f))}</span></span>`;
  if (!r.leaf) return `<span class="c-ag muted">—</span>`;
  const a = agentOf(p, f.agent);
  if (a?.kind === "ia") { const pe = agentOf(p, f.resp); return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Person: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Choose the person in charge") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "resp")}</span>`; }
  return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Choose source") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "agent")}</span>`;
}
function taskCell(p: Project, r: Row): string {
  const f = r.node as Fn, a = agentOf(p, f.agent), pad = 10 + r.depth * G.IND * 2;
  const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Function"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Open / close children">${icon("chevron")}</span><span class="gi">${icon("network")}</span>`;
  const name = a?.kind === "maquina" && r.leaf
    ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Function of ${esc(a.name)}">${a.tasks.map(t => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`
    : `<b data-act="rename" data-id="${esc(f.id)}" title="Click to rename">${esc(f.title || "unnamed")}</b>`;
  const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
  return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Runs together with the previous one">∥</span>' : ""}</span>`;
}
export function renderTable(p: Project, sc: Scene, ui: Ui): string {
  return sc.rows.map((r, i) => {
    const sel = ui.sel === r.id ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
    if (r.kind === "block" || r.kind === "catch" || r.kind === "else") {
      const n = r.node as Exclude<Node, Fn>, part = r.kind === "block" ? "main" : r.kind, pad = 10 + r.depth * G.IND * 2;
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
  const cw = colW(sc, ui), W = planWidth(sc, cw), H = planHeight(sc), by = new Map<string, number>();
  const colX = (n: number): number => G.OX + n * cw;
  sc.rows.forEach((r, i) => { if (r.kind === "fn" || r.kind === "block") by.set(r.id, i); });
  const ym = (i: number): number => rowY(i) + G.RH / 2;
  const out: string[] = [], bands: string[] = [], over: string[] = [];
  // grade e passos
  for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX(s)}" y1="${G.HEAD - 8}" x2="${colX(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
  sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="0" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
  const chip = (s: number, y: number): string => `<g class="chip"><rect x="${colX(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
  const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
  out.push(`<text class="ttl" x="${W / 2}" y="16" text-anchor="middle">${esc(flow.title)}</text>`);
  for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
  // os estados embaixo de cada coluna (como no Flow IDE): um quadrado (ou cubo) e o nome do dado que chega ali
  for (const [col, items] of statesByStep(sc)) items.forEach((it, k) => { const y = bot + 34 + k * STATE_ROW;
    out.push(`<g class="stt"><${it.cube ? `path class="scube" transform="translate(${colX(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"` : `rect class="sdot" x="${colX(col) - 4}" y="${y - 4}" width="8" height="8"`}/><text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(dataText([it.name], 26))}</text><title>${esc(it.fields.join(", "))}</title></g>`); });
  out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);

  // bandas dos blocos + etiquetas (pills)
  sc.rows.forEach((r, i) => {
    if (r.kind !== "block" && r.kind !== "catch" && r.kind !== "else") return;
    const n = r.node as Exclude<Node, Fn>, x0 = r.depth * G.IND, cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
    bands.push(`<rect class="band ${cls}" x="${x0}" y="${rowY(i)}" width="${W - x0}" height="${(r.last - i + 1) * G.RH}"/><line class="bandl ${cls}" x1="${x0 + 1}" y1="${rowY(i)}" x2="${x0 + 1}" y2="${rowY(r.last + 1)}"/>`);
    const diamond = r.kind === "block" && n.t === "if", px = colX(r.s) + (diamond ? 11 : 4);
    const txt = r.kind === "catch" ? "catch · if the try fails" : r.kind === "else" ? "else" : n.t === "for" ? `↻ ${blockLabel(p, n)}` : n.t === "try" ? `try · catch ↓ ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
    const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
    if (diamond) over.push(`<path class="fif" d="M${colX(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
    over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
    if (r.kind === "block") over.push(`<rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 7}" y="${ym(i) - 8}" width="7" height="16"><title>Drag to grow or shrink the block</title></rect>`);
  });

  // funções
  const produced = new Set<string>(); sc.leaves.forEach(l => (l.node as Fn).outs.forEach(o => produced.add(o)));
  sc.rows.forEach((r, i) => {
    if (r.kind !== "fn") return;
    const f = r.node as Fn, selC = ui.sel === f.id ? " sel" : "";
    if (!r.leaf) {
      const x1 = colX(r.s) + 8, x2 = colX(r.e + 1) - 8;
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="sum${selC}" x="${x1}" y="${ym(i) - 3.5}" width="${x2 - x1}" height="7" rx="3.5"/><title>${esc(f.title)} · composition = layer</title></g><text class="lbl" x="${x2 + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      return;
    }
    const k = fnKind(p, f), x1 = colX(r.s) + G.INS, x2 = colX(r.e + 1) - G.INS;
    const shown = f.title;
    over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
    const outsTxt = dataText([isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? ""]);
    if (!ui.txtIn) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10 + (f.outs.length ? G.GAP - 10 + tw(outsTxt, 5.6) + 22 : 0)}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
    // entradas / saídas (marcas na linha de dados) e fantasmas
    // o quadrado do dado fica EXATAMENTE onde a caixa fantasma aparece: na linha da função, sobre a coluna de entrada / saída;
    // o nome do dado fica na linha de dados logo abaixo
    const lib = !!contractOf(p, f), inAbs = f.ins.some(n => !(produced.has(n) || f.args?.[n]?.trim() || contractOf(p, f)?.optional?.includes(n)));
    const mark = (x: number, list: readonly string[], kind: "in" | "out", abs: boolean, tip: string): string => !list.length ? "" : isCube(list)
      ? `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><path class="cube${abs ? " a" : ""}" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(`${cubeName(f, kind)}: ${list.join(", ")}`)} · ${tip}</title></g>`
      : `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><rect class="${abs ? "dot a" : "dot"}" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(list[0]!)} · ${tip}</title></g>`;
    over.push(mark(colX(r.s), f.ins, "in", inAbs, inAbs ? "abstract input (state / another layer)" : "concrete input (same layer)"), mark(colX(r.e + 1), f.outs, "out", false, "output"));
    // nome do dado na MESMA altura do quadrado: os da esquerda (entradas) à esquerda dele, os da direita (saídas) à direita; cubo mostra o nome do cubo
    const insLabel = inputLabel(p, f), insTip = inputTip(p, f), outsLabel = isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? "";
    if (f.ins.length) over.push(`<text class="dn in"${!lib && f.ins.length === 1 ? ` data-act="renameData" data-id="${esc(f.id)}" data-side="in" data-name="${esc(f.ins[0]!)}"` : ""} x="${colX(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(dataText([insLabel], 40))}<title>${esc(insTip)}</title></text>`);
    if (f.outs.length) over.push(`<text class="dn out"${f.outs.length === 1 ? ` data-act="${lib ? "renameOut" : "renameData"}" data-id="${esc(f.id)}" data-side="out" data-name="${esc(f.outs[0]!)}"` : ""} x="${colX(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(dataText([outsLabel]))}<title>${esc(f.outs.join(", "))}</title></text>`);
    const ghost = (x: number, kind: "in" | "out", tip: string): string => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
    if (!lib && !f.ins.length) over.push(ghost(colX(r.s), "in", "Add input"));
    if (!lib && !f.outs.length) over.push(ghost(colX(r.e + 1), "out", "Add output"));
  });

  // sequência: A termina no passo anterior ao início de B → cotovelo da saída de A até a barra de B
  // o traço existe só onde há DADO ligando as funções: a saída de uma é entrada (ou valor) da outra, no passo vizinho. Tirou a entrada, o traço some.
  const elbow = (a: Row, b: Row): string => `M${colX(a.e + 1) - G.INS} ${ym(by.get(a.id)!)} H${colX(a.e + 1)} V${ym(by.get(b.id)!)} H${colX(b.s) + G.INS}`;
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
