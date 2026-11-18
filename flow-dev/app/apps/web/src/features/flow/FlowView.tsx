import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { TYPE_INFO, type AgentDto, type ElementDto } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { brandOf, ST } from "../../ui/parts";
import { useIde } from "../ide/ide";
import { FopPanel } from "../panels/FopPanel";
import { MachPanel } from "../panels/MachPanel";

const Z_MIN = 0.25, Z_MAX = 2.5;
const tw = (t: string, px: number) => Math.ceil(String(t).length * px);

/** Tela Flow: tabela Nome · Responsável + plano cartesiano FOP em SVG (estados sN nas divisórias). */
export function FlowView() {
  const ide = useIde();
  const { m, s, set } = ide;
  const plan = s.plan!;
  const rootId = ide.activeFlowRoot();
  // a raiz ativa e a sanfona acompanham o fluxo visível
  useEffect(() => { if (rootId && s.flowRoot !== rootId) { set({ flowRoot: rootId }); ide.openFlowView(rootId); } }, [rootId, s.flowRoot]); // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState({ z: 1, x: 16, y: 16 });
  const canvasRef = useRef<HTMLDivElement>(null), grightRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ id: number; x: number; y: number; ox: number; oy: number; moved: boolean; soft: boolean } | null>(null);
  const [hov, setHov] = useState<{ id: string; x: number } | null>(null);
  const hovT = useRef<number>(0);
  const skipBlur = useRef(false);

  const hidden = (id: string): boolean => { let p = m.u(id)?.parentId; while (p && !m.isFolder(m.u(p))) { if (s.flowClosed.has(p)) return true; p = m.u(p)?.parentId ?? null; } return false; };
  const rows = m.ganttRows(plan, rootId).filter(r => !m.isData(r.u) && !hidden(r.u.id));

  // sequência pela ordem das linhas (igual ao layout): cada passo liga no seguinte entre irmãos; dado não conta
  const FD: [string, string][] = [];
  const fnSibs = (pid: string | null) => (pid ? m.kidsPlan(pid) : []).filter(k => !m.isFolder(k) && !m.isData(k) && k.planId === plan);
  const seqLink = (list: ElementDto[]) => {
    const groups: ElementDto[][] = [];
    list.forEach(u => { const g = groups[groups.length - 1]; if (g && g.some(x => m.isPar(x.id, u.id))) g.push(u); else groups.push([u]); });
    for (let i = 1; i < groups.length; i++) groups[i - 1]!.forEach(a => groups[i]!.forEach(b => FD.push([a.id, b.id])));
  };
  seqLink(rootId ? [m.u(rootId)!].filter(Boolean) : m.planTops(plan));
  rows.forEach(r => { if (m.flowKids(r.u).length) seqLink(fnSibs(r.u.id)); });
  const { layout, nSteps } = m.flowLayout(plan, rootId);
  const LW = 440, RH = 34, TAIL = 440;
  const maxT = Math.max(0, ...rows.filter(r => !m.isData(r.u) && !m.flowKids(r.u).length).map(r => r.u.title.length));
  const INS = s.txtIn ? 22 : 28;
  const W = Math.max(s.txtIn ? Math.ceil(maxT * 5.6 + 20 + INS * 2) : 118, Math.floor((1152 - LW - 60) / Math.max(nSteps + 1, 1)));
  const OX = W, CW = OX + nSteps * W + TAIL;
  const tops = [...new Set(rows.map(r => m.flowTop(r.u).id))];
  const rIdx: Record<string, number> = {}; rows.forEach((r, i) => { rIdx[r.u.id] = i; });
  const structs = m.structs.map(st => ({ ...st, body: st.body.filter(id => rIdx[id] != null), i0: 0, hi: 0, x: 0 })).filter(st => st.body.length);
  const headAt: Record<number, typeof structs> = {};
  structs.forEach(st => { st.i0 = Math.min(...st.body.map(id => rIdx[id]!)); (headAt[st.i0] = headAt[st.i0] || []).push(st); });
  const leaf = (u: ElementDto) => !m.isData(u) && !m.flowKids(u).length;
  const synthIn = (u: ElementDto): string => { const n = "entrada_" + String(u.title).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); m.registerSynth(n, u.ins); return n; };
  const newIns = (u: ElementDto): string[] => (u.ins.length > 1 ? [synthIn(u)] : u.ins);

  interface Disp { st?: (typeof structs)[number]; lp?: ElementDto; io?: "in" | "out"; u?: ElementDto; d: number; nm?: string; first?: boolean; to?: ElementDto; row?: boolean }
  const disp: Disp[] = [];
  rows.forEach((r, i) => {
    (headAt[i] || []).forEach(st => disp.push({ st, d: r.d }));
    if (leaf(r.u) && r.u.loop) disp.push({ lp: r.u, d: r.d });
    if (!s.compacto && leaf(r.u) && newIns(r.u).length) {
      let k = disp.length - 1; while (k >= 0 && (disp[k]!.st || disp[k]!.lp)) k--;
      const grp: Disp[] = []; while (k >= 0 && disp[k]!.io === "out" && (!grp.length || disp[k]!.u === grp[0]!.u)) { grp.unshift(disp[k]!); k--; }
      const same = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x));
      if (grp.length && !grp[0]!.to && same(grp.map(g => g.nm!), newIns(r.u))) grp.forEach(g => { g.to = r.u; });
      else newIns(r.u).forEach((n, j) => disp.push({ io: "in", u: r.u, d: r.d, nm: n, first: j === 0 }));
    }
    disp.push({ u: r.u, d: r.d, row: true });
    if (!s.compacto && leaf(r.u) && r.u.outs.length) r.u.outs.forEach((o, j) => disp.push({ io: "out", u: r.u, d: r.d, nm: o[0], first: j === 0 }));
  });
  const idx: Record<string, number> = {}, idxIn: Record<string, number> = {}, idxOut: Record<string, number> = {}, idxEnd: Record<string, number> = {}, idxLoop: Record<string, number> = {};
  disp.forEach((r, i) => {
    if (r.lp) idxLoop[r.lp.id] = i; else if (r.st) r.st.hi = i;
    else if (r.io === "in") { if (r.first) idxIn[r.u!.id] = i; }
    else if (r.io === "out") { if (r.first) { idxOut[r.u!.id] = i; if (r.to) idxIn[r.to.id] = i; } idxEnd[r.u!.id] = i; }
    else idx[r.u!.id] = i;
  });
  const hasK = (u: ElementDto) => m.flowKids(u).length > 0;
  const leafFns = (id: string) => m.desc(id).filter(x => !x.archived && !m.isFolder(x) && !m.isData(x) && !m.flowKids(x).length);
  const prodIn = (id: string) => new Set(leafFns(id).flatMap(x => x.outs.map(o => o[0])));
  const layerProd: Record<string, Set<string>> = {}; tops.forEach(t => { layerProd[t] = prodIn(t); });
  const absData = (u: ElementDto, n: string): boolean => (m.synthIn.has(n) ? m.dKids(n).some(k => absData(u, k)) : !m.dadoHasValue(n) && !(layerProd[m.flowTop(u).id] ?? new Set()).has(n));
  const geo = (u: ElementDto) => {
    const L = layout[u.id] || { s: 0, e: 0 };
    if (m.isData(u)) { const cx = OX + (L.s + 1) * W; return { x1: cx - 7, x2: cx + 7, cx, ix: cx, ox: cx, data: true }; }
    return { x1: OX + L.s * W + INS, x2: OX + (L.e + 1) * W - INS, ix: OX + L.s * W, ox: OX + (L.e + 1) * W, data: false, cx: 0 };
  };
  const s0Root = (rootId && layout[rootId] ? layout[rootId]!.s : 0);
  const stepOf = (u: ElementDto) => Math.max(0, ((layout[u.id] || { s: s0Root }).s - s0Root));
  const ind = (u: ElementDto, d: number) => d * 16 + stepOf(u) * 10;
  const ancs = (u: ElementDto) => { const out: ElementDto[] = []; let p = m.u(u.parentId); while (p && !m.isFolder(p)) { out.unshift(p); if (p.id === rootId) break; p = m.u(p.parentId); } return out; };
  const dOf = (u: ElementDto) => { let d = 0, p = m.u(u.parentId); while (p && !m.isFolder(p) && p.id !== rootId) { d++; p = m.u(p.parentId); } return p && p.id === rootId ? d + 1 : d; };
  const gx = (a: ElementDto) => ind(a, dOf(a)) + 6;
  const gdA = (u: ElementDto, self = false): ReactNode[] => [...ancs(u).map(gx), ...(self ? [ind(u, dOf(u)) + 13] : [])].map((x, i) => <i key={i} className="fl-g" style={{ left: 14 + x }} aria-hidden="true" />);
  const lpTxt = (u: ElementDto) => `for (${u.loop![0]} of ${u.loop![1]})`;
  const senaoOf = (st: { test: string }): string => {
    const hits = rows.map(r => r.u).filter(u => u.cond && u.cond[0] === st.test && m.u(u.cond[1]));
    const uniq = [...new Map(hits.map(u => m.u(u.cond![1])!).map(t => [t.id, t])).values()];
    return uniq.length ? ` · senão → ${uniq.map(t => t.title).join(", ")}` : "";
  };

  // ---------- coluna Nome (tabela) ----------
  const agentSelect = (u: ElementDto, a: AgentDto | undefined, respMode: boolean) => {
    const kinds = respMode ? (["ia", "pessoa", "maquina", "script"] as const) : (["script", "maquina", "ia", "pessoa"] as const);
    const cur = respMode ? m.agent(u.respId) : a;
    const fav = cur
      ? <><span className={"fav " + cur.kind} style={brandOf(m, cur) ? ({ "--brand": brandOf(m, cur) } as React.CSSProperties) : undefined} title={`${TYPE_INFO[cur.kind].one}: ${cur.name}`}><Icon n={TYPE_INFO[cur.kind].ic} /></span>{respMode ? <span className="rp-n">{cur.name}</span> : <span className="fav-n">{cur.name}</span>}</>
      : <><span className="fav none" title={respMode ? "Adicionar responsável" : "Sem agente"}><Icon n="plus" /></span>{!respMode && <span className="fav-n" style={{ color: "var(--muted)" }}>sem agente</span>}</>;
    return (
      <span className={"resp-pick" + (cur ? " on" : "")}>{fav}
        <select aria-label={`Responsável de ${u.title}`} title="Escolher responsável" value={cur?.id ?? ""}
          onClick={e => e.stopPropagation()}
          onChange={e => { const v = e.target.value || null; void ide.patchEl(u.id, respMode ? { respId: v } : { agentId: v }); }}>
          <option value="">Selecionar…</option>
          {kinds.map(k => <optgroup key={k} label={TYPE_INFO[k].n}>{m.agents.filter(c => c.kind === k).map(c => <option key={c.id} value={c.id}>{c.name}{c.moduleFile ? " · " + c.moduleFile : ""}</option>)}</optgroup>)}
        </select>
      </span>
    );
  };
  const leftRow = (u: ElementDto, d: number) => {
    const has = hasK(u), a = m.agent(u.agentId);
    const open = has && !s.flowClosed.has(u.id);
    const editing = s.ren === u.id;
    return (
      <div key={"r" + u.id} className={"grow fl-cols" + (s.sel === u.id ? " sel" : "") + (has ? " grp" : "") + (open ? " open" : "")} onClick={() => ide.select(u.id)}>
        {gdA(u)}
        <span className="nm" style={{ paddingLeft: ind(u, d) + (has ? 0 : 10) }}>
          {has ? <><span className="car" title="Abrir / fechar sanfona" onClick={e => { e.stopPropagation(); ide.toggleFlowClosed(u.id); }}><Icon n="chevron-down" /></span><span className="gi"><Icon n="network" /></span></> : <span className="dot" />}
          {editing
            ? <input className="fl-ren" defaultValue={u.title} autoFocus aria-label="Nome do elemento" onClick={e => e.stopPropagation()}
                onFocus={e => e.currentTarget.select()}
                onBlur={e => {
                  // clicar fora salva e desseleciona
                  if (skipBlur.current) { skipBlur.current = false; return; }
                  const v = e.currentTarget.value.trim();
                  if (v && v !== u.title && !isVerb(v) && !m.isData(u)) { ide.toast("Função começa com verbo: Comprar…, Enviar…, Fazer…", "triangle-alert"); void ide.renameCommit(u.id, ""); }
                  else void ide.renameCommit(u.id, v);
                  set({ sel: null });
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); const v = e.currentTarget.value.trim(); if (v && !isVerb(v)) { ide.toast("Função começa com verbo: Comprar…, Enviar…, Fazer…", "triangle-alert"); return; } skipBlur.current = true; void ide.renameCommit(u.id, v); }
                  if (e.key === "Escape") { e.stopPropagation(); skipBlur.current = true; void ide.renameCancel(u.id); }
                }} />
            : <b title="Clique para renomear" style={{ cursor: "text" }} onClick={e => { e.stopPropagation(); set({ ren: u.id, fresh: null, sel: u.id }); }}>{u.title}</b>}
        </span>
        {!editing && (
          <span className="fl-tools" role="toolbar" aria-label="Ações do elemento">
            {has && <><button className="ib" title={open ? "Fechar filhos" : "Abrir filhos"} onClick={e => { e.stopPropagation(); ide.toggleFlowClosed(u.id); }}><Icon n={open ? "chevrons-down-up" : "chevrons-up-down"} /></button><i className="sep" /></>}
            <button className="ib" title="Editar (abre a janela de edição)" onClick={e => { e.stopPropagation(); ide.openDrawer(u.id); }}><Icon n="pencil" /></button><i className="sep" />
            <button className="ib" title="Filho · elemento filho" onClick={e => { e.stopPropagation(); void ide.addFn(u.id, "child"); }}><Icon n="plus" /></button>
            {!m.isTopFn(u) && <button className="ib" title="Irmão · abaixo" onClick={e => { e.stopPropagation(); void ide.addFn(u.id, "after"); }}><Icon n="between-horizontal-end" /></button>}<i className="sep" />
            <button className="ib danger" title="Remover" onClick={e => { e.stopPropagation(); ide.askRemove([u.id]); }}><Icon n="trash-2" /></button>
          </span>)}
        <span className="c-ag">{has ? null : a?.kind === "ia" ? agentSelect(u, a, true) : agentSelect(u, a, false)}
          {a?.kind === "maquina" && !has && <button className="code-b" title="Programar" onClick={e => { e.stopPropagation(); set({ mach: u.id, sel: u.id, drawer: null, console: null }); }}><Icon n="code-xml" /></button>}</span>
      </div>);
  };
  const left = disp.map((r, i) => {
    if (r.lp) return <div key={"lp" + i} className="grow fl-cols ifrow forrow" title="Repetição (documento FOP, item 13)">{gdA(r.lp)}<span className="nm" style={{ paddingLeft: ind(r.lp, r.d) + 10 }}><span className="lpd">↻</span><b className="mono">{lpTxt(r.lp)}</b></span><span /></div>;
    if (r.io) {
      const u = r.u!;
      return (
        <div key={"io" + i} className={"grow fl-cols iorow" + (s.sel === u.id ? " sel" : "")}>{gdA(u, true)}
          <span className="nm" style={{ paddingLeft: ind(u, r.d) + 28 }}>
            <span className="io-k">{!r.first ? "" : r.io === "in" ? "entrada" : r.to ? "entrada · saída" : "saída"}</span>
            <span className="io-l" title={r.nm}><b className="io-d" onClick={() => ide.editDado(r.nm!)}>
              {m.isCube(r.nm!) ? <svg className="io-cube" viewBox="0 0 10 11" aria-label="cubo"><path d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5" /></svg> : <i className="io-sq" aria-label="dado" />}{r.nm}</b></span>
          </span><span /></div>);
    }
    if (r.st) return <div key={"if" + i} className="grow fl-cols ifrow" title={"Seleção (documento FOP, item 12)" + senaoOf(r.st)}>{gdA(rows[r.st.i0]!.u)}<span className="nm" style={{ paddingLeft: ind(rows[r.st.i0]!.u, r.d) + 10 }}><span className="ifd" /><b className="mono">if ({r.st.test}){senaoOf(r.st)}</b></span><span /></div>;
    return leftRow(r.u!, r.d);
  });

  // ---------- estados: dados por sN ----------
  const fnRowsPre = rows.map(r => r.u).filter(u => !m.isData(u) && !hasK(u));
  const prodSetPre = new Set(fnRowsPre.flatMap(u => u.outs.map(o => o[0])));
  const stNew: [string, boolean][][] = Array.from({ length: nSteps + 1 }, () => []);
  const valued = m.snap.data.filter(d => m.dadoHasValue(d.name)).map(d => d.name);
  fnRowsPre.forEach(u => {
    const L = layout[u.id]; if (!L) return;
    u.ins.filter(n => absData(u, n) && !m.dadoHasValue(n)).forEach(n => { if (!stNew[L.s]!.some(d => d[0] === n)) stNew[L.s]!.push([n, true]); });
    u.outs.forEach(([n]) => { const i = Math.min(L.e + 1, nSteps); if (!stNew[i]!.some(d => d[0] === n)) stNew[i]!.push([n, false]); });
  });
  valued.forEach(n => { if (!stNew[0]!.some(d => d[0] === n)) stNew[0]!.push([n, false]); });
  const stBag: [string, boolean][][] = Array.from({ length: nSteps + 1 }, (_, i) => {
    const mp = new Map<string, boolean>();
    for (let j = 0; j <= i; j++) stNew[j]!.forEach(([n, ext]) => { if (!mp.has(n)) mp.set(n, ext); });
    fnRowsPre.forEach(u => { const L = layout[u.id]; if (!L || L.s > i) return; u.ins.filter(n => absData(u, n) && !m.dadoHasValue(n)).forEach(n => mp.set(n, true)); });
    valued.forEach(n => { if (mp.has(n)) mp.set(n, false); });
    return [...mp.entries()];
  });
  const stExpand = (list: [string, boolean][]): [string, boolean, number][] => {
    const out: [string, boolean, number][] = [];
    const walk = (n: string, ext: boolean, depth: number) => { out.push([n, ext, depth]); m.dKids(n).forEach(k => walk(k, false, depth + 1)); };
    list.forEach(([n, ext]) => walk(n, ext, 0));
    return out;
  };
  const stShow = (s.dadosTodos ? stBag : stNew).map(stExpand);
  const FOOT = 48 + Math.max(0, ...stShow.map(d => d.length)) * 14;

  // ---------- SVG ----------
  const yMid = (i: number) => i * RH + RH / 2, yTop = (i: number) => i * RH;
  const isFn = (u: ElementDto) => !m.isData(u) && !hasK(u);
  const srcOf = new Set(FD.map(d => d[0])), dstOf = new Set(FD.map(d => d[1]));
  const tagsOf = (u: ElementDto): [string, string][] => (u.status === "fail" ? [["fail", "falhou"]] : u.status === "exec" ? [["exec", "executando"]] : u.status === "cancel" ? [["cancel", "cancelada"]] : []);
  const pill = (x: number, y: number, txt: string, cls: string, key: string) => <g key={key} className={"sv-pill " + cls}><rect x={x} y={y - 8} width={tw(txt, 6.1) + 10} height={16} rx={3} /><text x={x + 5} y={y + 3.5}>{txt}</text></g>;
  const dnames = (x: number, y: number, list: string[], key: string) => (
    <text key={key} className="sv-dn" x={x} y={y + 3.5}>{list.map((n, i) => <tspan key={n}>{i ? <tspan>, </tspan> : null}<tspan className={"sv-dl" + (s.estado === n ? " on" : "")} onClick={() => ide.editDado(n)} style={{ cursor: "pointer" }}>{n}</tspan></tspan>)}<title>{list.join(", ")}</title></text>);
  const after = (x: number, y: number, u: ElementDto, extra: string[] = [], key: string): ReactNode => {
    const out: ReactNode[] = []; let cx = x;
    if (!s.txtIn) { out.push(<text key="l" className="sv-lbl" x={cx} y={y + 3.5}>{u.title}</text>); cx += tw(u.title, 5.4) + 10; }
    if (extra.length) { out.push(dnames(cx, y, extra, "e")); cx += tw(extra.join(", "), 6.3) + 10; }
    tagsOf(u).forEach(([k, t]) => { out.push(pill(cx, y, t, k, "t" + k)); cx += tw(t, 6.1) + 16; });
    return <g key={key}>{out}</g>;
  };
  const rowSvg = (r: Disp, i: number): ReactNode => {
    const y0 = yTop(i), ym = yMid(i);
    if (r.lp) return pill(geo(r.lp).ix + 12, ym, `↻ ${lpTxt(r.lp)}`, "loop", "lp" + i);
    if (r.st) return pill(geo(rows[r.st.i0]!.u).ix + 12, ym, `if (${r.st.test})${senaoOf(r.st)}`, "if", "if" + i);
    if (r.io) { const g = geo(r.u!); return dnames((r.io === "in" ? g.ix : g.ox) + 9, ym, [r.nm!], "io" + i); }
    const u = r.u!, g = geo(u), sel = s.sel === u.id;
    if (hasK(u)) return <g key={"s" + u.id}><g className="sv-sumg" style={{ cursor: "pointer" }} onClick={() => ide.select(u.id)}><rect className={"sv-sum" + (sel ? " sel" : "")} x={g.x1} y={y0 + 12} width={g.x2 - g.x1} height={7} rx={3.5} /><title>{u.title} · composição = camada</title></g>{after(g.ox + 10, ym, u, [], "a")}</g>;
    const k = m.fnKind(u), a = m.agent(u.agentId);
    const kt = k === "abs" ? `função abstrata · ${a?.name} vem do state` : k === "conc" ? `função concreta · import ${a?.name}` : "sem agente";
    return (
      <g key={"f" + u.id}>
        <g style={{ cursor: "pointer" }} onClick={() => ide.select(u.id)} onMouseEnter={e => onBarEnter(u.id, e.clientX)}>
          <rect className={`sv-fn ${k}${u.status === "fail" ? " fail" : ""}${sel ? " sel" : ""}`} x={g.x1} y={y0 + 6} width={g.x2 - g.x1} height={22} rx={11} />
          {s.txtIn && <text className={"sv-fbt " + k} x={(g.x1 + g.x2) / 2} y={ym + 3.5} textAnchor="middle">{u.title}</text>}
          <title>{u.title} · {kt}</title>
        </g>
        {after(g.ox + 10, ym, u, s.compacto && u.outs.length ? u.outs.map(o => o[0]) : [], "a")}
      </g>);
  };
  const dMark = (n: string, cx: number, cy: number, cls: string, tip: string, key: string): ReactNode => {
    const common = { className: cls, onClick: () => ide.editDado(n), style: { cursor: "pointer" } as React.CSSProperties };
    if (m.isCube(n)) { const x = cx - 5, y = cy - 5.5; return <path key={key} {...common} strokeLinejoin="round" d={`M${x + 5} ${y} L${x + 10} ${y + 2.7} L${x + 10} ${y + 8.3} L${x + 5} ${y + 11} L${x} ${y + 8.3} L${x} ${y + 2.7} Z M${x} ${y + 2.7} L${x + 5} ${y + 5.4} L${x + 10} ${y + 2.7} M${x + 5} ${y + 5.4} V${y + 11}`}><title>{tip}</title></path>; }
    return <rect key={key} {...common} x={cx - 4} y={cy - 4} width={8} height={8}><title>{tip}</title></rect>;
  };
  const ioMarks = (names: string[], cx: number, cy: number, cls: string, tipSuf: string, key: string) => { const list = names.length ? names : [""]; return dMark(list.find(n => m.isCube(n)) ?? list[0]!, cx, cy, cls, `${list.join(", ")} · ${tipSuf}`, key); };
  const svgEls: ReactNode[] = [];
  rows.forEach(({ u }) => {
    if (!u.loop || !isFn(u)) return;
    const g = geo(u), t = yTop(idx[u.id]!);
    svgEls.push(<rect key={"fl" + u.id} className="floop" x={g.x1 - 4} y={t + 3} width={g.x2 - g.x1 + 8} height={28} rx={6}><title>for ({u.loop[0]} of {u.loop[1]})</title></rect>);
    svgEls.push(<path key={"fa" + u.id} className="farc" d={`M${g.x2 - 8} ${t + 3} C${g.x2 - 8} ${t - 5} ${g.x1 + 8} ${t - 5} ${g.x1 + 8} ${t + 1}`} markerEnd="url(#fahl)" />);
  });
  if (!s.noDeps) FD.filter(([a, b]) => idx[a] != null && idx[b] != null).forEach(([a, b]) => {
    const A = m.u(a)!, B = m.u(b)!, ga = geo(A), gb = geo(B), ra = idxOut[a] ?? idx[a]!, rb = idxIn[b] ?? idx[b]!, y1 = yMid(ra), y2 = yMid(rb);
    const dir = y2 > y1 ? 1 : -1, r1 = ga.data ? 8 : hasK(A) ? 5 : 4, r2 = gb.data ? 8 : hasK(B) ? 5 : 4;
    const yB = dir > 0 ? yTop(rb) : yTop(rb) + RH;
    const d = ga.ox === gb.ix ? `M${ga.ox} ${y1 + dir * r1} V${y2 - dir * r2}` : `M${ga.ox} ${y1 + dir * r1} V${yB} H${gb.ix} V${y2 - dir * r2}`;
    const midY = (y1 + y2) / 2, midX = ga.ox === gb.ix ? ga.ox : (ga.ox + gb.ix) / 2;
    const open = (e: React.MouseEvent) => {
      e.stopPropagation();
      const gr = grightRef.current; let x = midX, y = 52 + midY;
      if (gr) { const r = gr.getBoundingClientRect(), sx = gr.offsetWidth / (r.width || 1), sy = gr.offsetHeight / (r.height || 1); x = (e.clientX - r.left) * sx; y = (e.clientY - r.top) * sy; }
      set({ edgeMenu: { a, b, x, y }, sel: b });
    };
    svgEls.push(<path key={"eh" + a + b} className="fdep-hit" onClick={open} d={d} />, <path key={"e" + a + b} className={"fdep" + (hasK(A) || hasK(B) ? " dash" : "")} onClick={open} d={d}><title>Clique: seleção ou repetição</title></path>);
  });
  rows.forEach(({ u }) => {
    if (!isFn(u)) return;
    const g = geo(u), y = yMid(idx[u.id]!), inNames = newIns(u), inAbs = inNames.some(n => absData(u, n));
    const inTip = inAbs ? "entrada abstrata (state / outra camada)" : "entrada concreta (mesma camada)";
    if (idxIn[u.id] != null) { const yi = yMid(idxIn[u.id]!); svgEls.push(<path key={"i" + u.id} className="fdep" d={`M${g.ix} ${yi + 4} V${y} H${g.x1}`} />); }
    else if (u.ins.length || dstOf.has(u.id)) svgEls.push(<line key={"is" + u.id} className="fstub" x1={g.ix + 4} y1={y} x2={g.x1} y2={y} />, ioMarks(inNames, g.ix, y, "fdot" + (inAbs ? " a" : ""), inTip, "im" + u.id));
    if (idxOut[u.id] != null) { const yo = yMid(idxEnd[u.id]!); svgEls.push(<path key={"o" + u.id} className="fdep" d={`M${g.x2} ${y} H${g.ox} V${yo - 4}`} />); }
    else if (u.outs.length || srcOf.has(u.id)) svgEls.push(<line key={"os" + u.id} className="fstub" x1={g.x2} y1={y} x2={g.ox - 4} y2={y} />, ioMarks(u.outs.map(o => o[0]), g.ox, y, "fdot", "saída concreta", "om" + u.id));
  });
  disp.forEach((r, i) => { if (!r.io) return; const g = geo(r.u!), ab = r.io === "in" && absData(r.u!, r.nm!); svgEls.push(dMark(r.nm!, r.io === "in" ? g.ix : g.ox, yMid(i), "fdot" + (ab ? " a" : ""), `${r.nm} · ${r.io === "in" ? (ab ? "entrada abstrata (state / outra camada)" : "entrada concreta (mesma camada)") : "saída"}`, "d" + i)); });
  const bandEls: ReactNode[] = [];
  structs.forEach((st, k) => {
    const i1 = Math.max(...st.body.map(id => idxEnd[id] ?? idx[id]!)), x = geo(rows[st.i0]!.u).ix, y = yMid(st.hi);
    svgEls.push(<path key={"if" + k} className="fif" d={`M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y}Z`}><title>if ({st.test})</title></path>);
    bandEls.push(<rect key={"b" + k} className="sv-band" x={0} y={yTop(st.hi)} width={CW} height={(i1 - st.hi + 1) * RH} />, <line key={"bl" + k} className="sv-bandl" x1={1} y1={yTop(st.hi)} x2={1} y2={yTop(i1) + RH} />);
  });
  Object.keys(idxLoop).forEach(id => { const a = idxLoop[id]!, b = idxEnd[id] ?? idx[id]!; bandEls.push(<rect key={"lb" + id} className="sv-band lp" x={0} y={yTop(a)} width={CW} height={(b - a + 1) * RH} />, <line key={"lbl" + id} className="sv-bandl lp" x1={1} y1={yTop(a)} x2={1} y2={yTop(b) + RH} />); });
  const H = disp.length * RH, rootU = rootId ? m.u(rootId) : null;
  const pl = (m.plans.find(p => p.id === plan)?.name ?? "") + (rootU ? " · " + rootU.title : "");
  const HH = 52 + Math.max(H, RH) + FOOT, yF = 52 + H, axW = nSteps * W, worldW = LW + CW, worldH = HH;
  const xs = (i: number) => OX + i * W;
  const fdMark = (n: string, x: number, y: number) => m.isCube(n)
    ? <path d={`M${x + 4.2} ${y} L${x + 8.4} ${y + 2.2} L${x + 8.4} ${y + 6} L${x + 4.2} ${y + 8.4} L${x} ${y + 6} L${x} ${y + 2.2} Z M${x} ${y + 2.2} L${x + 4.2} ${y + 4.4} L${x + 8.4} ${y + 2.2} M${x + 4.2} ${y + 4.4} V${y + 8.4}`} />
    : <rect x={x} y={y} width={8.4} height={8.4} />;

  // ações flutuantes na barra (hover)
  function onBarEnter(id: string, clientX: number) { window.clearTimeout(hovT.current); setHov({ id, x: clientX }); }
  const leaveBar = () => { window.clearTimeout(hovT.current); hovT.current = window.setTimeout(() => setHov(null), 250); };
  const barTools = (() => {
    if (!hov) return null;
    const i = idx[hov.id], u = m.u(hov.id); if (i == null || !u) return null;
    const g = geo(u), top = 52 + yTop(i) + (hasK(u) ? 12 : 6) - 30, gr = grightRef.current;
    let left = Math.max(4, g.x1);
    if (gr) { const r = gr.getBoundingClientRect(), sx = gr.offsetWidth / (r.width || 1); left = Math.max(4, Math.min((hov.x - r.left) * sx - 14, gr.offsetWidth - 130)); }
    return (
      <div className="bar-tools hov on" role="toolbar" aria-label="Ações da task" style={{ left, top: Math.max(54, top) }} onMouseEnter={() => window.clearTimeout(hovT.current)} onMouseLeave={leaveBar}>
        {hasK(u) && <button className="ib" title={s.flowClosed.has(u.id) ? "Abrir filhos" : "Fechar filhos"} onClick={() => ide.toggleFlowClosed(u.id)}><Icon n={s.flowClosed.has(u.id) ? "chevrons-up-down" : "chevrons-down-up"} /></button>}
        <button className="ib" title="Editar" onClick={() => ide.openDrawer(u.id)}><Icon n="pencil" /></button>
        <button className="ib" title="Filho" onClick={() => void ide.addFn(u.id, "child")}><Icon n="plus" /></button>
        {!m.isTopFn(u) && <button className="ib" title="Irmão" onClick={() => void ide.addFn(u.id, "after")}><Icon n="between-horizontal-end" /></button>}
        <button className="ib danger" title="Remover" onClick={() => ide.askRemove([u.id])}><Icon n="trash-2" /></button>
      </div>);
  })();
  const edgePop = s.edgeMenu && (
    <div className="edge-pop" role="menu" aria-label="Estrutura na sequência" style={{ left: Math.max(4, s.edgeMenu.x - 28), top: Math.max(56, s.edgeMenu.y - 36) }}>
      <button className="ib" title="Seleção (if)" onClick={async () => { const e = s.edgeMenu!; const t = await ide.call(() => import("../../api/client").then(({ api }) => api.post<string>(ide.pid, "/edge-if", { fromId: e.a, toId: e.b }))); set({ edgeMenu: null }); if (t) ide.toast(`Seleção if (${t})`, "diamond"); }}><Icon n="diamond" /></button>
      <button className="ib" title="Repetição (for)" onClick={async () => { const e = s.edgeMenu!; await ide.call(() => import("../../api/client").then(({ api }) => api.post(ide.pid, "/edge-loop", { toId: e.b }))); set({ edgeMenu: null }); ide.toast("Repetição adicionada", "repeat"); }}><Icon n="repeat" /></button>
      <button className="ib" title="Fechar" onClick={() => set({ edgeMenu: null })}><Icon n="x" /></button>
    </div>);

  // ---------- zoom / pan ----------
  const zoomAt = (lx: number, ly: number, nz: number) => setView(v => {
    const z = Math.min(Z_MAX, Math.max(Z_MIN, nz)); if (Math.abs(z - v.z) < 1e-6) return v;
    const wx = (lx - v.x) / v.z, wy = (ly - v.y) / v.z; return { z, x: lx - wx * z, y: ly - wy * z };
  });
  const fit = () => { const c = canvasRef.current; if (!c) return; const z = Math.max(0.55, Math.min(1.15, (c.clientWidth - 56) / worldW)); setView({ z, x: Math.max(12, (c.clientWidth - worldW * z) / 2), y: 16 }); };
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); setHov(null);
      const r = c.getBoundingClientRect(), step = e.ctrlKey || e.metaKey ? 1.08 : 1.12;
      zoomAt(e.clientX - r.left, e.clientY - r.top, view.z * (e.deltaY < 0 ? step : 1 / step));
    };
    c.addEventListener("wheel", wheel, { passive: false });
    return () => c.removeEventListener("wheel", wheel);
  }, [view.z]); // eslint-disable-line react-hooks/exhaustive-deps
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea, .dz, .bar-tools, .fl-tools, .edge-pop, .vdock, .ex-tools, .picker, .ctx, .modal, .scrim")) return;
    const soft = !!(e.target as HTMLElement).closest("[style*='cursor'], .grow, .sv-lbl, .sv-dn, .nm, .io-d, .io-l, text");
    pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: view.x, oy: view.y, moved: false, soft };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const p = pan.current; if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) < 5) return;
    if (!p.moved) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    p.moved = true; e.currentTarget.classList.add("panning"); setHov(null);
    setView(v => ({ ...v, x: p.ox + dx, y: p.oy + dy }));
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    const p = pan.current; pan.current = null; e.currentTarget.classList.remove("panning");
    if (p?.moved) { const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener("click", stop, { capture: true, once: true }); }
  };
  useEffect(() => { fit(); }, [rootId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- cabeçalho / rodapé ----------
  const running = m.els.filter(u => u.planId === plan && u.status === "exec" && m.agent(u.agentId)?.kind === "ia");
  const { missing } = m.fopCheck(plan);
  const fnAll = rows.map(r => r.u).filter(isFn);
  const nAbs = new Set(fnAll.filter(u => m.fnKind(u) === "abs").map(u => u.agentId)).size + new Set(fnAll.flatMap(u => u.ins.filter(n => absData(u, n)))).size;
  const nConc = new Set(fnAll.filter(u => m.fnKind(u) === "conc").map(u => u.agentId)).size + prodSetPre.size;
  void nAbs; void nConc; void missing; void ST;

  return (
    <div className="gantt flow zview">
      {running.length > 0 && <div className="runbar"><b><Icon n="loader-circle" />Executando {running.length} tarefa{running.length > 1 ? "s" : ""} de IA</b><span>{running.map(u => u.title).join(" · ")}</span><span className="sp" /><span>Só tarefas com responsável IA rodam. Pessoas e máquinas seguem como estão.</span><button className="btn" onClick={() => void ide.cancelRun()}><Icon n="square" />Cancelar</button></div>}
      <div className="ztoolbar"><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}><Icon n="workflow" /> Flow</span>
        <button className={"btn ghost" + (s.ctxPanel ? " on" : "")} style={{ height: 26, fontSize: 12 }} title="Contexto e camadas" onClick={() => set({ ctxPanel: !s.ctxPanel })}>
          <Icon n={missing.length ? "circle-x" : "circle-check"} />{tops.length} camada{tops.length === 1 ? "" : "s"} · {nAbs} abstratos · {nConc} concretos · {missing.length ? "contexto incompleto" : "contexto completo · executável"}</button>
        <div className="dz" role="group" aria-label="Zoom">
          <button className="ib" title="Zoom out" aria-label="Zoom out" onClick={() => { const c = canvasRef.current!; zoomAt(c.clientWidth / 2, c.clientHeight / 2, view.z / 1.15); }}><Icon n="minus" /></button>
          <span className="pct">{Math.round(view.z * 100)}%</span>
          <button className="ib" title="Zoom in" aria-label="Zoom in" onClick={() => { const c = canvasRef.current!; zoomAt(c.clientWidth / 2, c.clientHeight / 2, view.z * 1.15); }}><Icon n="plus" /></button>
          <button className="ib" title="Ajustar à tela" aria-label="Ajustar à tela" onClick={fit}><Icon n="maximize-2" /></button>
        </div></div>
      <div className="gmain">
        <div className="zcanvas" ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onMouseLeave={leaveBar}>
          <div className="zworld" style={{ width: worldW, height: worldH, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
            <div className="gtable" style={{ gridTemplateColumns: `${LW}px ${CW}px`, width: worldW }}>
              <div className="gleft"><div className="ghead fhead"><div className="fl-cols"><span>Nome</span><span>Responsável</span></div></div>{left}</div>
              <div className="gright" ref={grightRef} onClick={() => { if (s.edgeMenu) set({ edgeMenu: null }); }}>
                <svg className="fsvg fview" width={CW} height={HH} xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="fahl" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="var(--ok)" /></marker>
                  </defs>
                  <text className="sv-title" x={OX + axW / 2} y={17}>{pl}</text>
                  <line className="sv-hl" x1={OX} y1={26} x2={OX + axW} y2={26} /><line className="sv-hl" x1={0} y1={52} x2={CW} y2={52} />
                  {Array.from({ length: nSteps + 1 }, (_, i) => <g key={"h" + i}><g className="sv-chip"><rect x={xs(i) - 11} y={29} width={22} height={15} rx={2} /><text x={xs(i)} y={40}>s{i}</text><title>state {i}</title></g><rect className="sv-los" x={xs(i) - 3} y={49} width={6} height={6} transform={`rotate(45 ${xs(i)} 52)`} /></g>)}
                  {Array.from({ length: nSteps + 1 }, (_, i) => <line key={"d" + i} className="sv-div" x1={xs(i)} y1={52} x2={xs(i)} y2={yF + FOOT} />)}
                  <line className="sv-hl" x1={0} y1={yF} x2={CW} y2={yF} /><line className="sv-ax" x1={OX} y1={yF + 10} x2={OX + axW} y2={yF + 10} />
                  {Array.from({ length: nSteps + 1 }, (_, i) => (
                    <g key={"f" + i}>
                      <rect className="sv-los" x={xs(i) - 3} y={yF + 7} width={6} height={6} transform={`rotate(45 ${xs(i)} ${yF + 10})`} />
                      <g className="sv-chip"><rect x={xs(i) - 11} y={yF + 19} width={22} height={15} rx={2} /><text x={xs(i)} y={yF + 30}>s{i}</text></g>
                      {stShow[i]!.map(([n, ext, depth], j) => {
                        const x0 = xs(i) - 4.2 + depth * 5;
                        return (
                          <g key={n + j} className={"sv-fd" + (ext ? " ext" : "") + (m.dKids(n).length ? " tree" : "") + (depth ? " kid" : "") + (s.estado === n ? " on" : "")} style={{ cursor: "pointer" }} onClick={() => ide.editDado(n)}>
                            <g transform={`translate(0 ${yF + 44 + j * 14 - 0})`}>{fdMark(n, x0, 0)}</g>
                            <text x={x0 + 12.4} y={yF + 51.5 + j * 14}>{depth ? m.dLeaf(n) : n}</text>
                            <title>{n} · em s{i}{m.dKids(n).length ? " · árvore (cubo)" : " · folha (□)"}{ext ? " · entrada externa" : ""} · abrir painel do dado</title>
                          </g>);
                      })}
                    </g>))}
                  <g transform="translate(0 52)" onMouseLeave={leaveBar}>
                    {bandEls}
                    {disp.map((r, i) => (r.u && s.sel === r.u.id && !r.lp ? <rect key={"sr" + i} className="sv-selr" x={0} y={yTop(i)} width={CW} height={RH} /> : null))}
                    {disp.map((_, i) => <line key={"ln" + i} className="sv-row" x1={0} y1={yTop(i) + RH} x2={CW} y2={yTop(i) + RH} />)}
                    {svgEls}
                    {disp.map(rowSvg)}
                  </g>
                </svg>
                {barTools}{edgePop}
              </div>
            </div>
          </div>
        </div>
        {s.ctxPanel && <FopPanel />}
      </div>
      <div className="flfoot"><span className="flegend">
        <span><i className="lg-fc" />função concreta (import node:*)</span><span><i className="lg-fa" />função abstrata (IA · state)</span><span><i className="lg-da" />dado abstrato (state)</span>
        <span><i className="lg-dot" />dado concreto</span><span><i className="lg-sum" />composição · camada</span><span><i className="lg-seq" />sequência</span><span><i className="lg-if" />seleção</span><span className="ftag loop">↻ repetição</span></span></div>
      <nav className="vdock fdock" aria-label="Filtro transversal">
        <button aria-current={!s.compacto} title="Uma linha para entrada, task e saída" aria-label="Por linha" onClick={() => set({ compacto: false })}><Icon n="rows-3" /></button>
        <button aria-current={s.compacto} title="Compacto: dados nas pontas da barra" aria-label="Compacto" onClick={() => set({ compacto: true })}><Icon n="chart-gantt" /></button><i className="fd-sep" />
        <button title="Abrir elementos filhos" aria-label="Abrir filhos" onClick={() => { ide.patch(u => { const fc = new Set(u.flowClosed); rows.forEach(r => fc.delete(r.u.id)); m.els.filter(x => rootId && (x.id === rootId || m.isDesc(x.id, rootId))).forEach(x => fc.delete(x.id)); return { flowClosed: fc }; }); ide.toast("Filhos abertos", "chevrons-up-down"); }}><Icon n="chevrons-up-down" /></button>
        <button title="Fechar elementos filhos" aria-label="Fechar filhos" onClick={() => { ide.patch(u => { const fc = new Set(u.flowClosed); m.els.filter(x => !x.archived && !m.isFolder(x) && !m.isData(x) && hasK(x) && (!rootId || x.id === rootId || m.isDesc(x.id, rootId))).forEach(x => fc.add(x.id)); return { flowClosed: fc }; }); ide.toast("Filhos fechados", "chevrons-down-up"); }}><Icon n="chevrons-down-up" /></button><i className="fd-sep" />
        <button aria-pressed={s.txtIn} aria-current={s.txtIn} title="Texto dentro da barra" aria-label="Texto dentro da barra" onClick={() => set({ txtIn: !s.txtIn })}><Icon n="type" /></button><i className="fd-sep" />
        <button aria-current={s.dadosTodos} title="Todos os dados de cada estado" aria-label="Todos os dados" onClick={() => set({ dadosTodos: true })}><Icon n="layers" /></button>
        <button aria-current={!s.dadosTodos} title="Só os dados novos de cada estado" aria-label="Só os novos" onClick={() => set({ dadosTodos: false })}><Icon n="list-plus" /></button>
      </nav>
      {s.mach && <MachPanel />}
    </div>
  );
}
const isVerb = (t: string): boolean => { const w = String(t).trim().split(/\s+/)[0]!.toLowerCase().replace(/-(se|lo|la|los|las)$/, ""); return /(ar|er|ir|or|ôr)$/.test(w) && w.length > 2; };
