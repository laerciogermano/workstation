import type { AgentDto, DataDto, DataType, ElementDto, ModelDto, ModuleDto, PlanDto, Snapshot, StructDto } from "./types";
import { camel, slug } from "./text";

export interface Layout { s: number; e: number }
export interface FopCheck {
  prod: Record<string, ElementDto>; orphans: [string, ElementDto][]; missing: [string, ElementDto][]; rows: { u: ElementDto; d: number }[];
}

/** Modelo indexado sobre um Snapshot: portado das funções puras do protótipo (kids, flowLayout, fopCheck…). */
export class FlowModel {
  readonly els: ElementDto[];
  private byId = new Map<string, ElementDto>();
  private agentById = new Map<string, AgentDto>();
  private dataByName = new Map<string, DataDto>();
  private kidsOfData = new Map<string, string[]>();
  /** entradas sintéticas (várias entradas viram um cubo só na visualização) */
  readonly synthIn = new Set<string>();
  private synthKids = new Map<string, string[]>();
  private parSet = new Set<string>();
  private layoutCache = new Map<string, { layout: Record<string, Layout>; nSteps: number }>();

  constructor(readonly snap: Snapshot) {
    this.els = [...snap.elements].sort((a, b) => a.position - b.position);
    this.els.forEach(e => this.byId.set(e.id, e));
    snap.agents.forEach(a => this.agentById.set(a.id, a));
    [...snap.data].sort((a, b) => a.position - b.position).forEach(d => {
      this.dataByName.set(d.name, d);
      const i = d.name.lastIndexOf(".");
      if (i > 0) { const p = d.name.slice(0, i); (this.kidsOfData.get(p) ?? this.kidsOfData.set(p, []).get(p)!).push(d.name); }
    });
    snap.links.filter(l => l.kind === "par").forEach(l => { this.parSet.add(l.from + "|" + l.to); this.parSet.add(l.to + "|" + l.from); });
  }
  get plans(): PlanDto[] { return this.snap.plans; }
  get agents(): AgentDto[] { return this.snap.agents; }
  get models(): ModelDto[] { return this.snap.models; }
  get modules(): ModuleDto[] { return this.snap.modules; }
  get structs(): StructDto[] { return this.snap.structs; }
  get seqLinks(): [string, string][] { return this.snap.links.filter(l => l.kind === "seq").map(l => [l.from, l.to]); }

  // ---------- elementos ----------
  u = (id: string | null | undefined): ElementDto | undefined => (id ? this.byId.get(id) : undefined);
  agent = (id: string | null | undefined): AgentDto | undefined => (id ? this.agentById.get(id) : undefined);
  modelOf = (id: string | null | undefined): ModelDto | undefined => this.snap.models.find(m => m.id === id);
  isFolder = (u?: ElementDto): boolean => !!u && u.kind === "folder";
  isData = (u?: ElementDto): boolean => !!u && u.kind === "data";
  isPar = (a: string, b: string): boolean => this.parSet.has(a + "|" + b);
  /** pastas primeiro, depois ordem alfabética (Explorar) */
  kids = (id: string | null): ElementDto[] =>
    this.els.filter(x => x.parentId === id && !x.archived).sort((a, b) => (a.kind === "folder" ? 0 : 1) - (b.kind === "folder" ? 0 : 1) || a.title.localeCompare(b.title, "pt-BR"));
  /** ordem de criação (Flow) */
  kidsPlan = (id: string | null): ElementDto[] => this.els.filter(x => x.parentId === id && !x.archived);
  desc(id: string): ElementDto[] {
    const out: ElementDto[] = [];
    const walk = (p: string) => this.els.filter(x => x.parentId === p).forEach(k => { out.push(k); walk(k.id); });
    walk(id);
    return out;
  }
  isDesc(a: string, b: string): boolean { let p = this.u(a)?.parentId; while (p) { if (p === b) return true; p = this.u(p)?.parentId; } return false; }
  path(id: string): string[] { const out: string[] = []; let u = this.u(id); while (u) { out.unshift(u.title); u = this.u(u.parentId); } return out; }
  topOf(u: ElementDto): ElementDto { let x = u; while (x.parentId && !this.isFolder(this.u(x.parentId))) x = this.u(x.parentId)!; return x; }
  flowTop = (u: ElementDto): ElementDto => this.topOf(u);
  flowKids = (u: ElementDto): ElementDto[] => this.kidsPlan(u.id).filter(k => !this.isFolder(k));
  isTopFn = (u?: ElementDto): boolean => !!u && (!u.parentId || this.isFolder(this.u(u.parentId)));
  planTops(plan: string): ElementDto[] {
    return this.els.filter(u => !u.archived && !this.isFolder(u) && !this.isData(u) && u.planId === plan && (!u.parentId || this.isFolder(this.u(u.parentId))));
  }
  planRoot(plan: string): ElementDto | undefined { return this.els.find(u => !u.archived && this.isFolder(u) && u.planId === plan && !u.parentId); }
  ganttRows(plan: string, rootId?: string | null): { u: ElementDto; d: number }[] {
    const rows: { u: ElementDto; d: number }[] = [];
    let tops = this.els.filter(u => !u.archived && !this.isFolder(u) && u.planId === plan && (!u.parentId || this.isFolder(this.u(u.parentId))));
    if (rootId) tops = tops.filter(t => t.id === rootId);
    const walk = (list: ElementDto[], d: number) => list.forEach(u => { rows.push({ u, d }); walk(this.kidsPlan(u.id).filter(k => !this.isFolder(k)), d + 1); });
    walk(tops, 0);
    return rows;
  }
  /** Função preenchida = folha com responsável; composição = todas as filhas preenchidas. */
  fnFilled(u: ElementDto): boolean { const ks = this.kids(u.id).filter(k => !this.isData(k)); return ks.length ? ks.every(k => this.fnFilled(k)) : !!this.agent(u.agentId); }
  fnKind(u: ElementDto): "nag" | "abs" | "conc" { const a = this.agent(u.agentId); return !a ? "nag" : a.kind === "ia" ? "abs" : "conc"; }

  // ---------- dados ----------
  dKids = (name: string): string[] => this.synthKids.get(name) ?? this.kidsOfData.get(name) ?? [];
  dLeaf = (name: string): string => name.split(".").pop()!;
  dType = (name: string): DataType => (this.dataByName.get(name)?.type as DataType | undefined) ?? (this.synthKids.has(name) ? "objeto" : this.dKids(name).length ? "objeto" : "texto");
  dValue = (name: string): string | null => this.dataByName.get(name)?.value ?? null;
  isCube = (name: string): boolean => this.dKids(name).length > 0 || this.dType(name) === "objeto";
  dadoHasValue = (name: string): boolean => { const ks = this.dKids(name); if (ks.length) return ks.every(k => this.dadoHasValue(k)); const v = this.dValue(name); return v != null && v.length > 0; };
  registerSynth(name: string, kids: string[]): void { this.synthKids.set(name, kids.slice()); this.synthIn.add(name); }
  stateCatalog(): { name: string; ref: string; id: string; title: string; st: string | null }[] {
    const list: { name: string; ref: string; id: string; title: string; st: string | null }[] = [];
    this.els.filter(u => !u.archived && u.outs.length).forEach(u => u.outs.forEach(([name, ref]) => list.push({ name, ref, id: u.id, title: u.title, st: u.status })));
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  /** Dado abstrato = sem valor definido e usado numa camada que não o produz. */
  dadoIsAbs(name: string): boolean {
    if (this.dadoHasValue(name)) return false;
    const producers = this.els.filter(u => !u.archived && u.outs.some(o => o[0] === name));
    if (!producers.length) return true;
    const prodTops = new Set(producers.map(p => this.topOf(p).id));
    return this.els.some(u => !u.archived && u.ins.includes(name) && !prodTops.has(this.topOf(u).id));
  }
  moduleOfData = (name: string): ModuleDto | undefined => this.snap.modules.find(m => m.items.some(i => i.kind === "dado" && i.ref === name));
  usesOfAgent = (id: string): ElementDto[] => this.els.filter(u => u.agentId === id && !u.archived);

  // ---------- layout (ordem, sem datas) ----------
  flowLayout(plan: string, rootId?: string | null): { layout: Record<string, Layout>; nSteps: number } {
    const key = plan + "|" + (rootId ?? "");
    const hit = this.layoutCache.get(key); if (hit) return hit;
    const layout: Record<string, Layout> = {};
    const stepsAmong = (ids: string[]): Record<string, number> => {
      const step: Record<string, number> = {}; let col = -1; let grp: string[] = [];
      ids.forEach(id => {
        if (this.isData(this.u(id))) { step[id] = Math.max(0, col); return; }
        if (col >= 0 && grp.some(g => this.isPar(g, id))) { step[id] = col; grp.push(id); return; }
        step[id] = ++col; grp = [id];
      });
      return step;
    };
    const kidsOf = (pid: string) => this.kidsPlan(pid).filter(k => !this.isFolder(k) && k.planId === plan);
    const W: Record<string, number> = {};
    const maxByStep = (ks: ElementDto[], step: Record<string, number>) => {
      const mw: Record<number, number> = {};
      ks.forEach(k => { if (!this.isData(k)) mw[step[k.id]!] = Math.max(mw[step[k.id]!] || 0, width(k.id)); });
      return mw;
    };
    const width = (id: string): number => {
      if (W[id] != null) return W[id]!;
      const ks = kidsOf(id); if (!ks.length) return (W[id] = 1);
      const step = stepsAmong(ks.map(k => k.id)), mw = maxByStep(ks, step);
      return (W[id] = Math.max(1, Object.values(mw).reduce((a, b) => a + b, 0)));
    };
    const place = (id: string, base: number): void => {
      const ks = kidsOf(id);
      if (!ks.length) { layout[id] = { s: base, e: base }; return; }
      const step = stepsAmong(ks.map(k => k.id)), mw = maxByStep(ks, step);
      const start: Record<number, number> = {}; let x = base;
      [...new Set(Object.values(step))].sort((a, b) => a - b).forEach(c => { start[c] = x; x += mw[c] || 0; });
      ks.forEach(k => {
        const c = step[k.id]!;
        if (this.isData(k)) { const e = start[c]! + Math.max(1, mw[c] || 1) - 1; layout[k.id] = { s: e, e }; }
        else place(k.id, start[c]!);
      });
      layout[id] = { s: base, e: base + width(id) - 1 };
    };
    let tops = this.els.filter(u => !u.archived && !this.isFolder(u) && u.planId === plan && (!u.parentId || this.isFolder(this.u(u.parentId))));
    if (rootId) tops = tops.filter(t => t.id === rootId);
    let offset = 0;
    tops.forEach(t => { place(t.id, offset); offset += width(t.id); });
    const nSteps = Math.max(1, ...Object.values(layout).map(l => l.e + 1), offset > 0 ? offset - 1 : 1);
    const res = { layout, nSteps };
    this.layoutCache.set(key, res);
    return res;
  }

  // ---------- FOP ----------
  fopCheck(plan: string): FopCheck {
    const rows = this.ganttRows(plan);
    const prod: Record<string, ElementDto> = {}; const used = new Set<string>();
    rows.forEach(({ u }) => u.outs.forEach(([n]) => { prod[n] = u; }));
    rows.forEach(({ u }) => u.ins.forEach(n => used.add(n)));
    const seq = this.seqLinks;
    const finals = new Set(rows.filter(({ u }) => !seq.some(([a]) => a === u.id) && !this.kidsPlan(u.id).length).map(r => r.u.id));
    const orphans = Object.keys(prod).filter(n => !used.has(n) && !finals.has(prod[n]!.id)).map(n => [n, prod[n]!] as [string, ElementDto]);
    const missing: [string, ElementDto][] = [];
    rows.forEach(({ u }) => u.ins.forEach(n => { if (!prod[n]) missing.push([n, u]); }));
    return { prod, orphans, missing, rows };
  }
  fopLayers(plan: string): { rows: ElementDto[]; ia: AgentDto[]; libs: AgentDto[]; ext: string[] } {
    const rows = this.ganttRows(plan).map(r => r.u).filter(u => !this.isData(u) && !this.flowKids(u).length);
    const prod = new Set<string>(); rows.forEach(u => u.outs.forEach(([n]) => prod.add(n)));
    const ag = (k: string) => [...new Set(rows.map(u => this.agent(u.agentId)).filter((a): a is AgentDto => a?.kind === k))];
    const ext = [...new Set(rows.flatMap(u => u.ins).filter(n => !prod.has(n)))];
    return { rows, ia: ag("ia"), libs: ag("maquina"), ext };
  }
  /** Assinatura no estilo do documento “Programação Orientada a Fluxo” (texto puro). */
  fopSig(u: ElementDto): string {
    if (this.isData(u)) return `const ${slug(u.title)} = { ${u.ins.join(", ")} };  // dado`;
    const a = this.agent(u.agentId), ks = this.flowKids(u).filter(x => !this.isData(x));
    const L: string[] = [];
    if (a?.kind === "maquina" && !ks.length) L.push(`import ${a.name.replace("node:", "")} from "${a.name}";  // concreto`);
    L.push(`export default async function ${camel(u.title)}(state) {`);
    const take = [...u.ins, ...(a?.kind === "ia" && !ks.length ? [camel(a.name)] : [])];
    if (take.length) L.push(`  const { ${take.join(", ")} } = state;${a?.kind === "ia" && !ks.length ? `  // ${camel(a.name)} = abstrato` : ""}`);
    if (ks.length) {
      const { layout } = this.flowLayout(u.planId);
      const steps: Record<number, ElementDto[]> = {}; ks.forEach(x => (steps[layout[x.id]?.s ?? 0] ||= []).push(x));
      Object.keys(steps).map(Number).sort((x, y) => x - y).forEach(st => {
        const g = steps[st]!;
        if (g.length > 1) L.push(`  await Promise.all([${g.map(x => camel(x.title) + "(state)").join(", ")}]);`);
        else L.push(`  await ${camel(g[0]!.title)}({ ...state });`);
      });
    } else if (u.loop) L.push(`  for (const ${u.loop[0]} of ${u.loop[1]}) { /* repetição */ }`);
    else L.push(`  // ${a ? a.name : "sem agente"}: ${u.context || u.title}`);
    if (u.cond) { const t = this.u(u.cond[1]); if (t) L.push(`  if (!${u.cond[0]}) return ${camel(t.title)}({ ...state });  // seleção`); }
    const outs = u.outs.map(o => o[0]);
    L.push(outs.length ? `  return { ${outs.join(", ")} };` : "  return;", "}");
    return L.join("\n");
  }
}
