import type { Agent, FlowElement, Snapshot, Struct } from "../types";
import { FILE_AGENT, MODEL_AGENT } from "../types";

/** Geometria da vista Flow (porta pura do FlowView do Flow IDE): sem DOM, testável. */
export const LW = 440, RH = 34, TAIL = 440, HEAD = 52;
export const NEST = 16;

export interface ViewFlags {
  /** Uma linha por task, dados nas pontas da barra. */
  readonly compact: boolean;
  /** Indenta a coluna Task pela hierarquia. */
  readonly indent: boolean;
  /** Texto dentro da barra. */
  readonly txtIn: boolean;
  /** Mostra todos os dados de cada estado (não só os novos). */
  readonly allStates: boolean;
}
export const DEFAULT_FLAGS: ViewFlags = { compact: false, indent: true, txtIn: false, allStates: false };

export interface SceneInput {
  readonly planId: string;
  readonly rootId: string | null;
  readonly closed: ReadonlySet<string>;
  readonly flags: ViewFlags;
  /** Largura livre à direita do último passo (padrão 440). */
  readonly tail?: number;
}

export interface StructRow extends Struct { readonly i0: number; hi: number }
/** Linha exibida (tabela e SVG compartilham o mesmo índice). */
export interface Disp {
  st?: StructRow; lp?: FlowElement; tr?: FlowElement; ca?: FlowElement; from?: FlowElement; io?: "in" | "out"; u?: FlowElement;
  d: number; nm?: string; first?: boolean; to?: FlowElement; row?: boolean;
}
/** Bloco try/catch visível: cabeçalho, extensão em linhas e função de tratamento. */
export interface TryBlock { readonly u: FlowElement; /** Última função coberta pelo try (o bloco vai de `u` até `last`). */ readonly last: FlowElement; readonly hi: number; readonly end: number; readonly to: FlowElement; /** Faixa do catch (abaixo do try): cabeçalho e última linha. */ readonly catchHi?: number; readonly catchEnd?: number }
export type FnKind = "nag" | "abs" | "conc";
export interface Geo { x1: number; x2: number; ix: number; ox: number }

export interface Scene {
  readonly snap: Snapshot;
  readonly input: SceneInput;
  readonly rows: readonly { u: FlowElement; d: number; catchFor?: string }[];
  readonly disp: readonly Disp[];
  readonly structs: readonly StructRow[];
  readonly layout: Readonly<Record<string, { s: number; e: number }>>;
  readonly nSteps: number;
  readonly FD: readonly (readonly [string, string])[];
  readonly W: number; readonly OX: number; readonly CW: number; readonly INS: number;
  readonly H: number; readonly HH: number; readonly yF: number; readonly FOOT: number;
  readonly worldW: number; readonly worldH: number; readonly axW: number;
  readonly idx: Readonly<Record<string, number>>; readonly idxIn: Readonly<Record<string, number>>;
  readonly idxTry: Readonly<Record<string, number>>;
  readonly idxOut: Readonly<Record<string, number>>; readonly idxEnd: Readonly<Record<string, number>>; readonly idxLoop: Readonly<Record<string, number>>;
  readonly tries: readonly TryBlock[];
  tryBlockOf(e: FlowElement): FlowElement[];
  prevSibling(e: FlowElement): FlowElement | undefined;
  readonly stShow: readonly (readonly (readonly [string, boolean, number])[])[];
  readonly planName: string;
  // consultas
  u(id: string | null | undefined): FlowElement | undefined;
  agent(id: string | null | undefined): Agent | undefined;
  hasKids(u: FlowElement): boolean;
  isFn(u: FlowElement): boolean;
  fnKind(u: FlowElement): FnKind;
  geo(u: FlowElement): Geo;
  newIns(u: FlowElement): string[];
  absData(u: FlowElement, name: string): boolean;
  isCube(name: string): boolean;
  dKids(name: string): string[];
  dLeaf(name: string): string;
  inIf(id: string): boolean;
  senaoOf(st: { test: string }): string;
  bidOf(st: StructRow): string;
  padL(u: FlowElement, d: number, nest: number, base?: number): number;
  nestOf(r: Disp): number;
  guides(u: FlowElement, self: boolean, nest: number): number[];
  topsOfPlan(): FlowElement[];
}

const uniqNames = (xs: readonly string[]): string[] => [...new Set(xs)];
const byPos = (a: FlowElement, b: FlowElement): number => a.position - b.position;
const tw = (t: string, px: number): number => Math.ceil(String(t).length * px);
export const textWidth = tw;

export function planTops(snap: Snapshot, planId: string): FlowElement[] {
  const parentIsFolder = (e: FlowElement): boolean => !e.parentId || snap.elements.find(p => p.id === e.parentId)?.kind === "folder";
  return snap.elements.filter(e => !e.archived && e.kind === "file" && e.planId === planId && parentIsFolder(e)).sort(byPos);
}

export function buildScene(snap: Snapshot, input: SceneInput): Scene {
  const { planId, rootId, closed, flags } = input;
  const els = [...snap.elements].filter(e => e.kind !== "data").sort(byPos);
  const byId = new Map(els.map(e => [e.id, e] as const));
  const u = (id: string | null | undefined): FlowElement | undefined => (id ? byId.get(id) : undefined);
  const isFolder = (e?: FlowElement): boolean => !!e && e.kind === "folder";

  // responsável: catálogo + virtuais (arquivo / modelo)
  const titleOf = new Map(els.map(e => [e.id, e.title] as const));
  const agent = (id: string | null | undefined): Agent | undefined => {
    if (!id) return undefined;
    const hit = snap.agents.find(a => a.id === id); if (hit) return hit;
    if (id.startsWith(FILE_AGENT)) {
      const m = snap.modules.find(x => x.id === id.slice(FILE_AGENT.length)); if (!m) return undefined;
      return { id, kind: "arquivo", name: m.file, sub: "Arquivo · funções e dados", moduleFile: m.file, modelId: null, prompt: null, photoUrl: null, tasks: m.items.filter(i => i.kind === "fn").map(i => titleOf.get(i.ref)).filter((t): t is string => !!t) };
    }
    if (id.startsWith(MODEL_AGENT)) {
      const m = snap.models.find(x => x.id === id.slice(MODEL_AGENT.length)); if (!m) return undefined;
      return { id, kind: "modelo", name: m.name, sub: `${m.vendor} · modelo de IA`, moduleFile: null, modelId: m.id, prompt: null, photoUrl: null, tasks: [] };
    }
    return undefined;
  };

  // função de tratamento (alvo de um onError) é exclusiva do catch: sai da sequência e vira uma faixa abaixo do try
  const handlerOf = (e: FlowElement): FlowElement | undefined => { const t = e.onError ? u(e.onError) : undefined; return t && !t.archived ? t : undefined; };
  const catchIds = new Set<string>();
  els.forEach(e => { if (!e.archived) { const h = handlerOf(e); if (h) catchIds.add(h.id); } });
  // bloco try: irmãs consecutivas do fluxo principal com o mesmo tratamento formam um único try
  const sibsOf = (x: FlowElement): FlowElement[] => els.filter(e => e.parentId === x.parentId && !e.archived && e.kind === "file" && !catchIds.has(e.id));
  const prevSibling = (x: FlowElement): FlowElement | undefined => { const sb = sibsOf(x), i = sb.findIndex(e => e.id === x.id); return i > 0 ? sb[i - 1] : undefined; };
  const isTryHead = (x: FlowElement): boolean => !!handlerOf(x) && prevSibling(x)?.onError !== x.onError;
  const tryBlockOf = (x: FlowElement): FlowElement[] => {
    if (!x.onError) return [x]; const sb = sibsOf(x); let i = sb.findIndex(e => e.id === x.id), j = i; if (i < 0) return [x];
    while (i > 0 && sb[i - 1]!.onError === x.onError) i--; while (j < sb.length - 1 && sb[j + 1]!.onError === x.onError) j++;
    return sb.slice(i, j + 1);
  };
  const kidsPlan = (id: string | null): FlowElement[] => els.filter(x => x.parentId === id && !x.archived);
  const flowKids = (e: FlowElement): FlowElement[] => kidsPlan(e.id).filter(k => !isFolder(k) && !catchIds.has(k.id));
  const hasKids = (e: FlowElement): boolean => flowKids(e).length > 0;
  const isFn = (e: FlowElement): boolean => !hasKids(e);
  const parSet = new Set<string>();
  snap.links.filter(l => l.kind === "par").forEach(l => { parSet.add(l.from + "|" + l.to); parSet.add(l.to + "|" + l.from); });
  const isPar = (a: string, b: string): boolean => parSet.has(a + "|" + b);
  const topOf = (e: FlowElement): FlowElement => { let x = e; while (x.parentId && !isFolder(u(x.parentId))) x = u(x.parentId)!; return x; };
  const tops = (): FlowElement[] => {
    const all = els.filter(e => !e.archived && !isFolder(e) && e.planId === planId && (!e.parentId || isFolder(u(e.parentId))));
    return rootId ? all.filter(t => t.id === rootId) : all.filter(t => !catchIds.has(t.id));
  };
  const descOf = (id: string): FlowElement[] => { const out: FlowElement[] = []; const walk = (p: string): void => els.filter(x => x.parentId === p).forEach(k => { out.push(k); walk(k.id); }); walk(id); return out; };

  const hidden = (id: string): boolean => { let p = u(id)?.parentId ?? null; while (p && !isFolder(u(p))) { if (closed.has(p)) return true; p = u(p)?.parentId ?? null; } return false; };
  interface RowEntry { u: FlowElement; d: number; catchFor?: string; catchAfter?: string; lane?: string; laneRoot?: string }
  const allRows: RowEntry[] = [], seenCatch = new Set<string>();
  type Pending = { x: FlowElement; h: FlowElement; d: number; after: string };
  // faixas catch ficam por último, no fim do bloco que contém o try: o fluxo principal segue contínuo e o catch vem embaixo
  const flush = (pend: Pending[]): void => pend.forEach(({ x, h, d, after }) => { const own: Pending[] = []; walkOne(h, d, { id: x.id, root: h.id }, x.id, own, after); flush(own); });
  const walkOne = (x: FlowElement, d: number, lane: { id: string; root: string } | undefined, catchFor: string | undefined, pend: Pending[], catchAfter?: string): void => {
    allRows.push({ u: x, d, ...(lane ? { lane: lane.id, laneRoot: lane.root } : {}), ...(catchFor ? { catchFor } : {}), ...(catchAfter ? { catchAfter } : {}) });
    const mine: Pending[] = [];
    flowKids(x).forEach(k => walkOne(k, d + 1, lane, undefined, mine));
    flush(mine);
    const h = handlerOf(x);
    if (!h || seenCatch.has(h.id)) return;
    const blk = tryBlockOf(x), head = blk[0]!, last = blk.at(-1)!;
    // o catch sempre vem logo depois da última função do bloco try; o elemento seguinte do fluxo vem depois do catch
    if (last.id === x.id) { seenCatch.add(h.id); const own: Pending[] = []; walkOne(h, d, { id: head.id, root: h.id }, head.id, own, last.id); flush(own); }
  };
  tops().forEach(t => { const pend: Pending[] = []; walkOne(t, 0, undefined, undefined, pend); flush(pend); });
  const laneHidden = (r: RowEntry): boolean => {
    if (hidden(r.lane!)) return true;
    if (r.u.id === r.laneRoot) return false;
    let p = u(r.u.parentId)?.id ?? null;
    while (p) { if (closed.has(p)) return true; if (p === r.laneRoot) break; p = u(p)?.parentId ?? null; }
    return false;
  };
  const rows = allRows.filter(r => (r.lane ? !laneHidden(r) : !hidden(r.u.id)));

  // ---------- sequência (FD) ----------
  const FD: [string, string][] = [];
  const seqLink = (list: FlowElement[]): void => {
    const groups: FlowElement[][] = [];
    list.forEach(x => { const g = groups[groups.length - 1]; if (g && g.some(y => isPar(y.id, x.id))) g.push(x); else groups.push([x]); });
    for (let i = 1; i < groups.length; i++) groups[i - 1]!.forEach(a => groups[i]!.forEach(b => FD.push([a.id, b.id])));
  };
  const fnSibs = (pid: string): FlowElement[] => kidsPlan(pid).filter(k => !isFolder(k) && !catchIds.has(k.id) && k.planId === planId);
  seqLink(rootId ? [u(rootId)].filter((x): x is FlowElement => !!x) : planTops(snap, planId).filter(t => !catchIds.has(t.id)));
  rows.forEach(r => { if (hasKids(r.u)) seqLink(fnSibs(r.u.id)); });

  // ---------- layout em passos ----------
  const layout: Record<string, { s: number; e: number }> = {};
  const stepsAmong = (ids: string[]): Record<string, number> => {
    const step: Record<string, number> = {}; let col = -1; let grp: string[] = [];
    ids.forEach(id => {
      if (col >= 0 && grp.some(g => isPar(g, id))) { step[id] = col; grp.push(id); return; }
      step[id] = ++col; grp = [id];
    });
    return step;
  };
  const kidsOf = (pid: string): FlowElement[] => kidsPlan(pid).filter(k => !isFolder(k) && !catchIds.has(k.id) && k.planId === planId);
  const Wc: Record<string, number> = {};
  const maxByStep = (ks: FlowElement[], step: Record<string, number>): Record<number, number> => {
    const mw: Record<number, number> = {};
    ks.forEach(k => { const s = step[k.id]!; mw[s] = Math.max(mw[s] ?? 0, width(k.id)); });
    return mw;
  };
  const width = (id: string): number => {
    if (Wc[id] != null) return Wc[id]!;
    const ks = kidsOf(id); if (!ks.length) return (Wc[id] = 1);
    const mw = maxByStep(ks, stepsAmong(ks.map(k => k.id)));
    return (Wc[id] = Math.max(1, Object.values(mw).reduce((a, b) => a + b, 0)));
  };
  const place = (id: string, base: number): void => {
    const ks = kidsOf(id);
    if (!ks.length) { layout[id] = { s: base, e: base }; return; }
    const step = stepsAmong(ks.map(k => k.id)), mw = maxByStep(ks, step);
    const start: Record<number, number> = {}; let x = base;
    [...new Set(Object.values(step))].sort((a, b) => a - b).forEach(c => { start[c] = x; x += mw[c] ?? 0; });
    ks.forEach(k => place(k.id, start[step[k.id]!]!));
    layout[id] = { s: base, e: base + width(id) - 1 };
  };
  let offset = 0;
  tops().forEach(t => { place(t.id, offset); offset += width(t.id); });
  // try/catch no tempo: catch na coluna seguinte ao fim do try; o próximo da sequência principal vem depois do catch inteiro
  const catchRows = allRows.filter(r => r.catchFor)
    .sort((a, b) => (layout[a.catchAfter ?? a.catchFor!]?.e ?? 0) - (layout[b.catchAfter ?? b.catchFor!]?.e ?? 0));
  catchRows.forEach(r => {
    const tryE = layout[r.catchAfter ?? r.catchFor!]?.e ?? 0;
    place(r.u.id, tryE + 1);
    const catchE = layout[r.u.id]!.e;
    const oldNext = tryE + 1;
    const delta = catchE + 1 - oldNext;
    if (delta <= 0) return;
    const skip = new Set([r.u.id, ...descOf(r.u.id).map(x => x.id)]);
    Object.keys(layout).forEach(id => {
      if (skip.has(id)) return;
      const L = layout[id]!;
      if (L.s >= oldNext) layout[id] = { s: L.s + delta, e: L.e + delta };
      else if (L.e >= oldNext) layout[id] = { s: L.s, e: L.e + delta };
    });
  });
  const nSteps = Math.max(1, ...Object.values(layout).map(l => l.e + 1), offset > 0 ? offset - 1 : 1);

  // ---------- dados ----------
  const dataByName = new Map(snap.data.map(d => [d.name, d] as const));
  const kidsOfData = new Map<string, string[]>();
  [...snap.data].sort((a, b) => a.position - b.position).forEach(d => {
    const i = d.name.lastIndexOf(".");
    if (i > 0) { const p = d.name.slice(0, i); (kidsOfData.get(p) ?? kidsOfData.set(p, []).get(p)!).push(d.name); }
  });
  const synthKids = new Map<string, string[]>();
  const dKids = (n: string): string[] => synthKids.get(n) ?? kidsOfData.get(n) ?? [];
  const dLeaf = (n: string): string => n.split(".").pop()!;
  const isCube = (n: string): boolean => dKids(n).length > 0 || dataByName.get(n)?.type === "objeto";
  const hasValue = (n: string): boolean => { const ks = dKids(n); if (ks.length) return ks.every(hasValue); const v = dataByName.get(n)?.value; return v != null && v.length > 0; };
  const slugIn = (t: string): string => "entrada_" + t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const newIns = (e: FlowElement): string[] => { if (e.ins.length <= 1) return [...e.ins]; const n = slugIn(e.title); synthKids.set(n, [...e.ins]); return [n]; };
  const leafFns = (id: string): FlowElement[] => descOf(id).filter(x => !x.archived && !isFolder(x) && !hasKids(x));
  const layerProd = new Map<string, Set<string>>();
  [...new Set(rows.map(r => topOf(r.u).id))].forEach(t => layerProd.set(t, new Set(leafFns(t).flatMap(x => x.outs.map(o => o[0])))));
  const absData = (e: FlowElement, n: string): boolean =>
    synthKids.has(n) ? dKids(n).some(k => absData(e, k)) : !hasValue(n) && !(layerProd.get(topOf(e).id) ?? new Set()).has(n);

  // ---------- estruturas (if) e linhas exibidas ----------
  const rIdx: Record<string, number> = {}; rows.forEach((r, i) => { rIdx[r.u.id] = i; });
  const structs: StructRow[] = snap.structs.map(st => ({ ...st, body: st.body.filter(id => rIdx[id] != null), i0: 0, hi: 0 })).filter(st => st.body.length)
    .map(st => ({ ...st, i0: Math.min(...st.body.map(id => rIdx[id]!)) }));
  const headAt: Record<number, StructRow[]> = {};
  structs.forEach(st => { (headAt[st.i0] ??= []).push(st); });
  const leaf = (e: FlowElement): boolean => !hasKids(e);

  const disp: Disp[] = [];
  rows.forEach((r, i) => {
    if (r.catchFor) disp.push({ ca: r.u, from: u(r.catchFor)!, d: r.d });
    if (handlerOf(r.u) && isTryHead(r.u)) disp.push({ tr: r.u, d: r.d });
    (headAt[i] ?? []).forEach(st => disp.push({ st, d: r.d }));
    if (leaf(r.u) && r.u.loop) disp.push({ lp: r.u, d: r.d });
    if (!flags.compact && leaf(r.u) && newIns(r.u).length) {
      let k = disp.length - 1; while (k >= 0 && (disp[k]!.st || disp[k]!.lp || disp[k]!.tr || disp[k]!.ca)) k--;
      const grp: Disp[] = []; while (k >= 0 && disp[k]!.io === "out" && (!grp.length || disp[k]!.u === grp[0]!.u)) { grp.unshift(disp[k]!); k--; }
      const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every(x => b.includes(x));
      if (grp.length && !grp[0]!.to && same(grp.map(g => g.nm!), newIns(r.u))) grp.forEach(g => { g.to = r.u; });
      else newIns(r.u).forEach((n, j) => disp.push({ io: "in", u: r.u, d: r.d, nm: n, first: j === 0 }));
    }
    disp.push({ u: r.u, d: r.d, row: true });
    if (!flags.compact && leaf(r.u) && r.u.outs.length) r.u.outs.forEach((o, j) => disp.push({ io: "out", u: r.u, d: r.d, nm: o[0], first: j === 0 }));
  });
  const idx: Record<string, number> = {}, idxIn: Record<string, number> = {}, idxOut: Record<string, number> = {}, idxEnd: Record<string, number> = {}, idxLoop: Record<string, number> = {}, idxTry: Record<string, number> = {}, idxCa: Record<string, number> = {};
  disp.forEach((r, i) => {
    if (r.ca) idxCa[r.ca.id] = i; else if (r.tr) idxTry[r.tr.id] = i; else if (r.lp) idxLoop[r.lp.id] = i; else if (r.st) r.st.hi = i;
    else if (r.io === "in") { if (r.first) idxIn[r.u!.id] = i; }
    else if (r.io === "out") { if (r.first) { idxOut[r.u!.id] = i; if (r.to) idxIn[r.to.id] = i; } idxEnd[r.u!.id] = i; }
    else idx[r.u!.id] = i;
  });

  const tries: TryBlock[] = [];
  Object.keys(idxTry).forEach(id => {
    const e = u(id)!, to = handlerOf(e)!, members = tryBlockOf(e);
    const ids = new Set(members.flatMap(m => [m.id, ...descOf(m.id).map(x => x.id)]));
    const last = Math.max(...[...ids].map(x => idxEnd[x] ?? idx[x] ?? -1));
    const catchHi = idxCa[to.id];
    let catchEnd: number | undefined;
    if (catchHi != null) { const hs = new Set([to.id, ...descOf(to.id).map(x => x.id)]); catchEnd = Math.max(catchHi, ...[...hs].map(x => idxEnd[x] ?? idx[x] ?? -1)); }
    tries.push({ u: e, last: members.at(-1)!, hi: idxTry[id]!, end: Math.max(last, idxTry[id]!), to, ...(catchHi != null ? { catchHi, catchEnd: catchEnd! } : {}) });
  });

  // ---------- dimensões ----------
  const maxT = Math.max(0, ...rows.filter(r => leaf(r.u)).map(r => r.u.title.length));
  const INS = flags.txtIn ? 22 : 28;
  const W = Math.max(flags.txtIn ? Math.ceil(maxT * 5.6 + 20 + INS * 2) : 118, Math.floor((1152 - LW - 60) / Math.max(nSteps + 1, 1)));
  const OX = W, CW = OX + nSteps * W + (input.tail ?? TAIL);
  const geo = (e: FlowElement): Geo => {
    const L = layout[e.id] ?? { s: 0, e: 0 };
    return { x1: OX + L.s * W + INS, x2: OX + (L.e + 1) * W - INS, ix: OX + L.s * W, ox: OX + (L.e + 1) * W };
  };
  const fnKind = (e: FlowElement): FnKind => {
    const a = agent(e.agentId); if (!a) return "nag";
    return a.kind === "ia" || a.kind === "modelo" ? "abs" : a.kind === "maquina" || a.kind === "arquivo" || a.kind === "script" ? "conc" : "abs";
  };

  // ---------- estados s0..sN (rodapé) ----------
  const fnRows = rows.map(r => r.u).filter(isFn);
  // só dados que ESTE fluxo usa (entrada/saída das suas funções, ou campos/pai deles); o catálogo do projeto não entra
  const usedNames = uniqNames(fnRows.flatMap(e => [...e.ins, ...e.outs.map(o => o[0])]));
  const related = (n: string): boolean => usedNames.some(x => n === x || n.startsWith(x + ".") || x.startsWith(n + "."));
  const valued = snap.data.filter(d => hasValue(d.name) && related(d.name)).map(d => d.name);
  const stNew: [string, boolean][][] = Array.from({ length: nSteps + 1 }, () => []);
  fnRows.forEach(e => {
    const L = layout[e.id]; if (!L) return;
    e.ins.filter(n => absData(e, n) && !hasValue(n)).forEach(n => { if (!stNew[L.s]!.some(d => d[0] === n)) stNew[L.s]!.push([n, true]); });
    e.outs.forEach(([n]) => { const i = Math.min(L.e + 1, nSteps); if (!stNew[i]!.some(d => d[0] === n)) stNew[i]!.push([n, false]); });
  });
  valued.forEach(n => { if (!stNew[0]!.some(d => d[0] === n)) stNew[0]!.push([n, false]); });
  const stBag: [string, boolean][][] = Array.from({ length: nSteps + 1 }, (_, i) => {
    const mp = new Map<string, boolean>();
    for (let j = 0; j <= i; j++) stNew[j]!.forEach(([n, ext]) => { if (!mp.has(n)) mp.set(n, ext); });
    fnRows.forEach(e => { const L = layout[e.id]; if (!L || L.s > i) return; e.ins.filter(n => absData(e, n) && !hasValue(n)).forEach(n => mp.set(n, true)); });
    valued.forEach(n => { if (mp.has(n)) mp.set(n, false); });
    return [...mp.entries()];
  });
  const stExpand = (list: [string, boolean][]): [string, boolean, number][] => {
    const out: [string, boolean, number][] = [];
    const walk = (n: string, ext: boolean, depth: number): void => { out.push([n, ext, depth]); dKids(n).forEach(k => walk(k, false, depth + 1)); };
    list.forEach(([n, ext]) => walk(n, ext, 0));
    return out;
  };
  const stShow = (flags.allStates ? stBag : stNew).map(stExpand);
  const FOOT = 48 + Math.max(0, ...stShow.map(d => d.length)) * 14;
  const H = disp.length * RH;
  const HH = HEAD + Math.max(H, RH) + FOOT, yF = HEAD + H;

  // ---------- indentação ----------
  const s0Root = rootId && layout[rootId] ? layout[rootId]!.s : 0;
  const stepOf = (e: FlowElement): number => Math.max(0, (layout[e.id]?.s ?? s0Root) - s0Root);
  const ind = (e: FlowElement, d: number): number => d * 16 + stepOf(e) * 10;
  const inIf = (id: string): boolean => structs.some(st => st.body.includes(id));
  const nestOf = (r: Disp): number => { if (r.lp || r.st || r.tr || r.ca) return 0; const e = r.u; if (!e) return 0; return (e.loop && !hasKids(e) ? 1 : 0) + (inIf(e.id) ? 1 : 0); };
  const padL = (e: FlowElement, d: number, nest: number, base = 10): number => (flags.indent ? ind(e, d) + nest * NEST + base : base);
  const ancs = (e: FlowElement): FlowElement[] => { const out: FlowElement[] = []; let p = u(e.parentId); while (p && !isFolder(p)) { out.unshift(p); if (p.id === rootId) break; p = u(p.parentId); } return out; };
  const dOf = (e: FlowElement): number => { let d = 0, p = u(e.parentId); while (p && !isFolder(p) && p.id !== rootId) { d++; p = u(p.parentId); } return p && p.id === rootId ? d + 1 : d; };
  const guides = (e: FlowElement, self: boolean, nest: number): number[] =>
    !flags.indent ? [] : [...ancs(e).map(a => ind(a, dOf(a)) + 6), ...(self ? [ind(e, dOf(e)) + nest * NEST + 13] : [])];

  const senaoOf = (st: { test: string }): string => {
    const hits = rows.map(r => r.u).filter(x => x.cond && x.cond[0] === st.test && u(x.cond[1]));
    const uniq = [...new Map(hits.map(x => u(x.cond![1])!).map(t => [t.id, t] as const)).values()];
    return uniq.length ? ` · senão → ${uniq.map(t => t.title).join(", ")}` : "";
  };
  const bidOf = (st: StructRow): string => st.body[0]!;

  return {
    snap, input, rows, disp, structs, layout, nSteps, FD, W, OX, CW, INS, H, HH, yF, FOOT, worldW: LW + CW, worldH: HH, axW: nSteps * W,
    idx, idxIn, idxOut, idxEnd, idxLoop, idxTry, tries, stShow, planName: (snap.plans.find(p => p.id === planId)?.name ?? "") + (rootId && u(rootId) ? " · " + u(rootId)!.title : ""),
    u, agent, hasKids, isFn, fnKind, geo, newIns, absData, isCube, dKids, dLeaf, inIf, senaoOf, bidOf, padL, nestOf, guides, tryBlockOf, prevSibling, topsOfPlan: () => planTops(snap, planId),
  };
}
