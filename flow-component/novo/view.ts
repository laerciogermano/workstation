import { icon, KIND_ICON } from "./icons";
import { agentOf, flowFile, insideBlock, isRoot, locate, type Agent, type Fn, type Node, type Project } from "./model";
import { layout, links, type Row, type Scene } from "./layout";

/** Geometria do plano (px). */
export const G = { RH: 34, HEAD: 52, OX: 40, W: 130, INS: 28, BH: 22, IND: 14 } as const;
export interface Ui { closed: ReadonlySet<string>; sel: string | null; txtIn: boolean }

export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const tw = (t: string, px = 6.1): number => Math.ceil(t.length * px);
export const colX = (s: number): number => G.OX + s * G.W;
export const rowY = (i: number): number => G.HEAD + i * G.RH;
export const planWidth = (sc: Scene): number => colX(sc.nSteps) + 160;
export const planHeight = (sc: Scene): number => rowY(sc.rows.length) + 64;
export const tableWidth = (sc: Scene): number => 520 + sc.maxDepth * G.IND * 2;

// ───────────────────────── ferramentas (regras ÚNICAS, usadas pela tabela e pelo plano) ─────────────────────────
export interface Tool { act: string; id: string; icon: string; title: string; danger?: boolean; data?: Record<string, string> }

/** Botões de um nó. Os blocos (if · for · try · catch) compartilham as mesmas ações; só mudam os rótulos. */
export function toolsFor(p: Project, id: string, part: "main" | "catch" = "main"): Tool[] {
  const l = locate(p, id); if (!l) return [];
  const n = l.node, root = isRoot(p, id), t = (act: string, ic: string, title: string, extra: Partial<Tool> = {}): Tool => ({ act, id, icon: ic, title, ...extra });
  if (n.t === "fn") {
    const out: Tool[] = [];
    if (n.kids.length) out.push(t("toggle", "chevron", "Abrir / fechar filhos"));
    out.push(t("addChild", "sibling", "Adicionar filho (dentro desta função)"));
    if (!root) {
      out.push(t("addSibling", "child", "Adicionar irmão (ao lado, no mesmo bloco)"), t("wrap", "diamond", "Adicionar seleção (if)", { data: { kind: "if" } }), t("wrap", "repeat", "Adicionar repetição (for)", { data: { kind: "for" } }), t("wrap", "shield", "Adicionar try/catch", { data: { kind: "try" } }));
      if (l.list[l.index - 1]?.t === "fn") out.push(t("parallel", "parallel", n.par ? "Rodar em sequência" : "Rodar junto da anterior", { data: { on: String(!n.par) } }));
      if (insideBlock(p, id)) out.push(t("exitScope", "log-out", "Sair do bloco (esta e as seguintes)"));
      out.push(t("remove", "trash", "Remover", { danger: true }));
    }
    return out;
  }
  const where = n.t === "for" ? "for" : n.t === "if" ? "if" : part === "catch" ? "catch" : "try";
  const out: Tool[] = [t("addChild", "sibling", `Adicionar filho (dentro do ${where})`, part === "catch" ? { data: { catch: "1" } } : {})];
  if (part === "main") out.push(t("wrap", "diamond", "Adicionar condição (if) neste bloco", { data: { kind: "if" } }));
  out.push(t("addSibling", "child", "Adicionar irmão à direita (fora do bloco)"));
  if (part === "main") out.push(t("setScope", "grow", "Incluir a próxima no bloco", { data: { delta: "1" } }), t("setScope", "shrink", "Tirar a última do bloco", { data: { delta: "-1" } }));
  out.push(t("unwrap", n.t === "for" ? "repeat" : n.t === "if" ? "diamond" : "shield", `Remover ${n.t === "try" ? "try/catch" : n.t === "for" ? "repetição (for)" : "seleção (if)"}`, { danger: true }));
  return out;
}
export const toolsHtml = (tools: Tool[]): string => tools.map(x => `<button type="button" class="ib${x.danger ? " danger" : ""}" data-act="${x.act}" data-id="${esc(x.id)}" ${Object.entries(x.data ?? {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} title="${esc(x.title)}" aria-label="${esc(x.title)}">${icon(x.icon)}</button>`).join("");

// ───────────────────────── textos ─────────────────────────
export const blockLabel = (p: Project, n: Node): string => {
  if (n.t === "if") { const to = n.elseTo ? locate(p, n.elseTo)?.node : null; return `if (${n.test})${to && to.t === "fn" ? ` · senão → ${to.title}` : ""}`; }
  if (n.t === "for") return `for (${n.v} of ${n.coll})`;
  return "try";
};
export const fnKind = (p: Project, f: Fn): "conc" | "abs" | "nag" => { const a = agentOf(p, f.agent); return !a ? "nag" : a.kind === "maquina" ? "conc" : "abs"; };

// ───────────────────────── tabela (esquerda) ─────────────────────────
const circle = (cls: string, ic: string, title: string): string => `<span class="fav ${cls}" title="${esc(title)}">${ic ? icon(ic) : ""}</span>`;
function agentSelect(p: Project, f: Fn, kind: "agent" | "resp"): string {
  const cur = agentOf(p, kind === "agent" ? f.agent : f.resp), want = (a: Agent): boolean => (kind === "resp" ? a.kind === "pessoa" : true);
  const groups = (["maquina", "pessoa", "ia"] as const).map(k => { const list = p.agents.filter(a => a.kind === k && want(a)); return list.length ? `<optgroup label="${{ maquina: "Libs Node.js", pessoa: "Pessoas", ia: "Agentes de IA" }[k]}">${list.map(a => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : ""; }).join("");
  return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Responsável de ${esc(f.title)}"><option value="">${cur ? "Sem responsável" : "Escolher responsável"}</option>${groups}</select>`;
}
function respCell(p: Project, r: Row): string {
  const f = r.node as Fn;
  if (isRoot(p, f.id)) return `<span class="c-ag" title="Responsável: o arquivo deste fluxo">${circle("arquivo", "file", "Arquivo")}<span class="rp-n">${esc(flowFile(f))}</span></span>`;
  if (!r.leaf) return `<span class="c-ag muted">—</span>`;
  const a = agentOf(p, f.agent);
  if (a?.kind === "ia") { const pe = agentOf(p, f.resp); return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Pessoa: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Escolher a pessoa responsável")}${agentSelect(p, f, "resp")}</span>`; }
  return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Escolher responsável")}${agentSelect(p, f, "agent")}</span>`;
}
function taskCell(p: Project, r: Row): string {
  const f = r.node as Fn, a = agentOf(p, f.agent), pad = 10 + r.depth * G.IND * 2;
  const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Função"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Abrir / fechar filhos">${icon("chevron")}</span><span class="gi">${icon("network")}</span>`;
  const name = a?.kind === "maquina" && r.leaf
    ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Task de ${esc(a.name)}">${a.tasks.map(t => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`
    : `<b data-act="rename" data-id="${esc(f.id)}" title="Clique para renomear">${esc(f.title || "sem task")}</b>`;
  const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
  return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Roda junto da anterior">∥</span>' : ""}</span>`;
}
function ioCell(r: Row): string {
  const names = (list: string[], kind: "in" | "out", id: string): string => list.map(n => `<span class="io-d"><i class="sq ${kind}"></i>${esc(n)}<button type="button" class="x" data-act="rmIo" data-id="${esc(id)}" data-kind="${kind}" data-name="${esc(n)}" title="Remover ${kind === "in" ? "entrada" : "saída"} ${esc(n)}" aria-label="Remover ${esc(n)}">×</button></span>`).join("");
  const ins = r.ins ?? [], outs = r.outs ?? [], pad = 24 + r.depth * G.IND * 2;
  const label = ins.length && outs.length ? "entrada · saída" : ins.length ? "entrada" : "saída";
  return `<span class="nm" style="padding-left:${pad}px"><span class="io-k">${label}</span>${names(ins, "in", r.id)}${ins.length && outs.length ? '<span class="io-sep">→</span>' : ""}${names(outs, "out", r.id)}</span>`;
}

export function renderTable(p: Project, sc: Scene, ui: Ui): string {
  return sc.rows.map((r, i) => {
    const sel = ui.sel === r.id && r.kind !== "io" ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
    if (r.kind === "io") return `<div class="grow iorow" ${base}><span class="c-ag"></span>${ioCell(r)}</div>`;
    if (r.kind === "block" || r.kind === "catch") {
      const n = r.node as Exclude<Node, Fn>, isCatch = r.kind === "catch", pad = 10 + r.depth * G.IND * 2;
      const tag = isCatch ? `<span class="trd c">catch</span><b class="mono">se o try falhar</b>` : n.t === "if" ? `${icon("diamond", "mini")}<b class="mono">${esc(blockLabel(p, n))}</b>` : n.t === "for" ? `<span class="lpd">↻</span><b class="mono">${esc(blockLabel(p, n))}</b>` : `<span class="trd">try</span><b class="mono">catch ↓ ${esc((n.t === "try" && n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "tratamento"))}</b>`;
      return `<div class="grow ifrow ${isCatch ? "catchrow" : n.t + "row"}${sel}" ${base} data-part="${isCatch ? "catch" : "main"}"><span class="c-ag"></span><span class="nm" style="padding-left:${pad}px">${tag}</span><span class="fl-tools">${toolsHtml(toolsFor(p, r.id, isCatch ? "catch" : "main"))}</span></div>`;
    }
    return `<div class="grow${sel}" ${base}>${respCell(p, r)}${taskCell(p, r)}<span class="fl-tools">${toolsHtml(toolsFor(p, r.id))}</span></div>`;
  }).join("");
}

// ───────────────────────── plano (direita, SVG) ─────────────────────────
export function renderPlan(p: Project, flow: Fn, sc: Scene, ui: Ui): string {
  const W = planWidth(sc), H = planHeight(sc), by = new Map<string, number>();
  sc.rows.forEach((r, i) => { if (r.kind === "fn" || r.kind === "block") by.set(r.id, i); });
  const ym = (i: number): number => rowY(i) + G.RH / 2;
  const out: string[] = [], bands: string[] = [], over: string[] = [];
  // grade e passos
  for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX(s)}" y1="${G.HEAD - 8}" x2="${colX(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
  sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="0" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
  const chip = (s: number, y: number): string => `<g class="chip"><rect x="${colX(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
  const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
  out.push(`<text class="ttl" x="${W / 2}" y="16" text-anchor="middle">${esc(p.name)} · ${esc(flow.title)}</text>`);
  for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
  out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);

  // bandas dos blocos + etiquetas (pills)
  sc.rows.forEach((r, i) => {
    if (r.kind !== "block" && r.kind !== "catch") return;
    const n = r.node as Exclude<Node, Fn>, x0 = r.depth * G.IND, cls = r.kind === "catch" ? "ca" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
    bands.push(`<rect class="band ${cls}" x="${x0}" y="${rowY(i)}" width="${W - x0}" height="${(r.last - i + 1) * G.RH}"/><line class="bandl ${cls}" x1="${x0 + 1}" y1="${rowY(i)}" x2="${x0 + 1}" y2="${rowY(r.last + 1)}"/>`);
    const diamond = r.kind === "block" && n.t === "if", px = colX(r.s) + (diamond ? 11 : 4);
    const txt = r.kind === "catch" ? "catch · se o try falhar" : n.t === "for" ? `↻ ${blockLabel(p, n)}` : n.t === "try" ? `try · catch ↓ ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "tratamento"}` : blockLabel(p, n);
    const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
    if (diamond) over.push(`<path class="fif" d="M${colX(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
    over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
    if (r.kind === "block") over.push(`<rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 7}" y="${ym(i) - 8}" width="7" height="16"><title>Arraste para aumentar ou diminuir o bloco</title></rect>`);
  });

  // funções
  const produced = new Set<string>(); sc.leaves.forEach(l => (l.node as Fn).outs.forEach(o => produced.add(o)));
  const ioRow = new Map<string, number>(); sc.rows.forEach((r, i) => { if (r.kind === "io") ioRow.set(r.id, i); });
  const outY = (r: Row): number => ym(ioRow.get(r.id) ?? by.get(r.id) ?? 0);
  sc.rows.forEach((r, i) => {
    if (r.kind !== "fn") return;
    const f = r.node as Fn, selC = ui.sel === f.id ? " sel" : "";
    if (!r.leaf) {
      const x1 = colX(r.s) + 8, x2 = colX(r.e + 1) - 8;
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="sum${selC}" x="${x1}" y="${ym(i) - 3.5}" width="${x2 - x1}" height="7" rx="3.5"/><title>${esc(f.title)} · composição = camada</title></g><text class="lbl" x="${x2 + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      return;
    }
    const k = fnKind(p, f), x1 = colX(r.s) + G.INS, x2 = colX(r.e + 1) - G.INS;
    const shown = f.title;
    over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
    if (!ui.txtIn) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
    // entradas / saídas (marcas na linha de dados) e fantasmas
    const io = ioRow.get(f.id);
    if (io != null) {
      f.ins.forEach((n, j) => over.push(`<g class="dm"><rect class="${produced.has(n) ? "dot" : "dot a"}" x="${colX(r.s) - 4 + j * 0}" y="${ym(io) - 4}" width="8" height="8"/><title>${esc(n)} · ${produced.has(n) ? "entrada concreta (mesma camada)" : "entrada abstrata (state / outra camada)"}</title></g>`));
      if (f.ins.length) over.push(`<text class="dn" x="${colX(r.s) + 9}" y="${ym(io) + 3.5}">${esc(f.ins.join(", "))}</text>`);
      if (f.outs.length) { over.push(`<g class="dm"><rect class="dot" x="${colX(r.e + 1) - 4}" y="${ym(io) - 4}" width="8" height="8"/><title>${esc(f.outs.join(", "))} · saída</title></g><text class="dn" x="${colX(r.e + 1) + 9}" y="${ym(io) + 3.5}">${esc(f.outs.join(", "))}</text>`); }
    }
    const ghost = (x: number, kind: "in" | "out", tip: string): string => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
    if (!f.ins.length) over.push(ghost(colX(r.s), "in", "Adicionar entrada"));
    if (!f.outs.length) over.push(ghost(colX(r.e + 1), "out", "Adicionar saída"));
  });

  // sequência: A termina no passo anterior ao início de B → cotovelo da saída de A até a barra de B
  for (const [a, b] of links(sc)) {
    const ia = by.get(a.id)!, ib = by.get(b.id)!, xo = colX(a.e + 1);
    out.push(`<path class="dep" d="M${colX(a.e + 1) - G.INS} ${ym(ia)} H${xo} V${ym(ib)} H${colX(b.s) + G.INS}"/>`);
    void outY;
  }
  return `<svg class="plan" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano do fluxo ${esc(flow.title)}"><g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
}

export function build(p: Project, flowId: string, ui: Ui): { scene: Scene; table: string; plan: string } {
  const l = locate(p, flowId); if (!l || l.node.t !== "fn") throw new Error(`Fluxo ${flowId} não existe`);
  const scene = layout(l.node, { closed: ui.closed });
  return { scene, table: renderTable(p, scene, ui), plan: renderPlan(p, l.node, scene, ui) };
}
