import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowModel, type ElementDto, type Snapshot } from "@flow/shared";
import { api, ApiError, type ConsoleLine, type ExportResult, type MutationResult } from "../../api/client";
import { useToast } from "../../ui/toast";

export type View = "flow" | "catalog";
export interface Ui {
  v: View; plan: string | null; flowRoot: string | null; sel: string | null; multi: string[];
  drawer: string | null; picker: boolean; dadoEdit: string | null; agCfg: string | null; mdCfg: string | null; mach: string | null; console: ConsoleLine[] | null;
  exp: boolean; expTab: "ir" | "js" | "ts" | "py"; ctx: { id: string | null; x: number; y: number } | null; confirm: string[] | null;
  q: string | null; ren: string | null; fresh: string | null; renLy: string | null; renCat: string | null; edgeMenu: { a: string; b: string; x: number; y: number } | null;
  ctxPanel: boolean; compacto: boolean; txtIn: boolean; dadosTodos: boolean; noDeps: boolean; catTab: "ia" | "pessoa" | "maquina" | "script"; catBlock: string | null; estado: string | null;
  open: Set<string>; flowClosed: Set<string>; secClosed: Set<string>; clip: { mode: "cut" | "copy"; ids: string[] } | null; focusQ: boolean; flash: string | null;
}
const initial = (): Ui => ({
  v: "flow", plan: null, flowRoot: null, sel: null, multi: [], drawer: null, picker: false, dadoEdit: null, agCfg: null, mdCfg: null, mach: null, console: null,
  exp: false, expTab: "js", ctx: null, confirm: null, q: null, ren: null, fresh: null, renLy: null, renCat: null, edgeMenu: null,
  ctxPanel: false, compacto: false, txtIn: false, dadosTodos: false, noDeps: false, catTab: "ia", catBlock: null, estado: null,
  open: new Set(), flowClosed: new Set(), secClosed: new Set(), clip: null, focusQ: false, flash: null,
});

export interface Ide {
  pid: string; m: FlowModel; s: Ui; set: (p: Partial<Ui>) => void; patch: (fn: (u: Ui) => Partial<Ui>) => void;
  toast: (msg: string, icon?: string) => void; exportData: ExportResult | null;
  /** chama a API, aplica o snapshot novo e trata erro com toast */
  call: <R = unknown>(fn: () => Promise<MutationResult<R>>) => Promise<R | undefined>;
  // navegação / seleção
  select: (id: string) => void; openDrawer: (id: string) => void; closePanels: () => void; revealDado: (name: string) => void; editDado: (name: string) => void;
  setFlowRootFrom: (id: string) => void; openFlowView: (root: string) => void; activeFlowRoot: () => string | null;
  toggleOpen: (key: string) => void; toggleFlowClosed: (id: string) => void;
  // funções
  addFn: (refId: string, mode: "child" | "after" | "before") => Promise<void>; newFlow: () => Promise<void>;
  renameCommit: (id: string, title: string) => Promise<void>; renameCancel: (id: string) => Promise<void>;
  askRemove: (ids: string[]) => void; confirmRemove: () => Promise<void>; patchEl: (id: string, body: Record<string, unknown>) => Promise<void>;
  assign: (id: string, agentId: string | null) => Promise<void>; dup: (id: string) => Promise<void>; paste: (targetId: string | null) => Promise<void>; move: (id: string, ref: string, mode: "child" | "after" | "before") => Promise<void>;
  // dados e catálogo
  saveDado: (name: string, v: { type?: string; value?: string | null; moduleFile?: string }) => Promise<void>; addKid: (parent: string, name: string) => Promise<void>; toggleCube: (name: string) => Promise<void>; newDado: () => Promise<void>;
  // execução e exportação
  runPlan: () => Promise<void>; complete: (id: string) => Promise<void>; cancelRun: () => Promise<void>; retry: (id: string) => Promise<void>; runMachine: (id: string, code: string) => Promise<void>; openExport: (tab?: Ui["expTab"]) => void;
}
const IdeCtx = createContext<Ide | null>(null);
export const useIde = (): Ide => { const v = useContext(IdeCtx); if (!v) throw new Error("useIde fora do provider"); return v; };

export function IdeProvider({ pid, children }: { pid: string; children: ReactNode }) {
  const qc = useQueryClient(), toast = useToast();
  const [s, setS] = useState<Ui>(initial);
  const [runIds, setRunIds] = useState<string[]>([]);
  const [exportData, setExportData] = useState<ExportResult | null>(null);
  const key = useMemo(() => ["snap", pid], [pid]);
  const q = useQuery({
    queryKey: key, queryFn: async () => (await api.snapshot(pid)).snapshot,
    refetchInterval: query => {
      const d = query.state.data as Snapshot | undefined; if (!d) return false;
      const st = runIds.map(id => d.elements.find(e => e.id === id)?.status);
      // segue enquanto roda; para quando trava em pessoa (wait) ou falha
      return st.includes("exec") || (st.includes("pendente") && !st.includes("wait") && !st.includes("fail")) ? 900 : false;
    },
  });
  const snap = q.data;
  const m = useMemo(() => (snap ? new FlowModel(snap) : null), [snap]);
  const sRef = useRef(s); sRef.current = s;
  const mRef = useRef(m); mRef.current = m;
  const set = useCallback((p: Partial<Ui>) => setS(u => ({ ...u, ...p })), []);
  const patch = useCallback((fn: (u: Ui) => Partial<Ui>) => setS(u => ({ ...u, ...fn(u) })), []);

  // plano inicial
  useEffect(() => { if (m && !s.plan) { const n = (id: string) => m.els.filter(e => e.planId === id).length; set({ plan: [...m.plans].sort((a, b) => n(b.id) - n(a.id))[0]?.id ?? null }); } }, [m, s.plan, set]);

  const apply = useCallback((snapshot: Snapshot) => qc.setQueryData(key, snapshot), [qc, key]);
  const fail = useCallback((e: unknown) => { toast(e instanceof ApiError ? e.message : "Falha de conexão", "triangle-alert"); }, [toast]);
  const call: Ide["call"] = useCallback(async fn => {
    try { const r = await fn(); apply(r.snapshot); return r.result as never; } catch (e) { fail(e); return undefined; }
  }, [apply, fail]);

  if (q.isPending || !m || !snap) return <div className="boot">{q.isError ? "Projeto não encontrado." : "Abrindo projeto…"}</div>;

  const U = (id: string) => m.u(id);
  const isDesc = (a: string, b: string) => m.isDesc(a, b);
  const openFlowView = (root: string) => {
    if (!U(root)) return;
    patch(u => {
      const closed = new Set(u.flowClosed), stack = [root];
      while (stack.length) { const id = stack.pop()!; closed.delete(id); m.kidsPlan(id).forEach(k => { if (!m.isFolder(k) && !m.isData(k)) stack.push(k.id); }); }
      return { flowClosed: closed };
    });
  };
  const activeFlowRoot = (): string | null => {
    const st = sRef.current, tops = st.plan ? m.planTops(st.plan) : [];
    if (!tops.length) return null;
    if (st.flowRoot && tops.some(t => t.id === st.flowRoot)) return st.flowRoot;
    const su = st.sel ? U(st.sel) : undefined;
    if (su && su.planId === st.plan && !m.isFolder(su) && !m.isData(su)) return m.flowTop(su).id;
    return (tops.find(t => m.kidsPlan(t.id).some(k => !m.isFolder(k) && !m.isData(k))) ?? tops[0]!).id;
  };
  const setFlowRootFrom = (id: string) => {
    const u = U(id); if (!u || m.isFolder(u)) return;
    if (m.isData(u)) { set({ plan: u.planId }); return; }
    const root = m.flowTop(u).id;
    set({ plan: u.planId, flowRoot: root });
    if (sRef.current.flowRoot !== root) openFlowView(root);
  };
  const select = (id: string) => { set({ sel: id, drawer: null, dadoEdit: null, agCfg: null, mdCfg: null }); setFlowRootFrom(id); };
  const openDrawer = (id: string) => {
    let p = U(id)?.parentId; const open = new Set(sRef.current.open); while (p) { open.add(p); p = U(p)?.parentId ?? null; }
    set({ drawer: id, sel: id, agCfg: null, mdCfg: null, dadoEdit: null, picker: false, v: "flow", open });
  };
  const closePanels = () => set({ drawer: null, picker: false, dadoEdit: null, agCfg: null, mdCfg: null, ctx: null });
  const revealDado = (name: string) => {
    const u = m.els.find(x => !x.archived && x.outs.some(o => o[0] === name));
    const open = new Set(sRef.current.open); m.modules.filter(l => l.items.some(i => i.kind === "dado" && i.ref === name)).forEach(l => open.add("ly:" + l.id));
    set({ estado: name, sel: u?.id ?? sRef.current.sel, open, flash: name });
    setTimeout(() => { const n = document.querySelector(`.ex .node[data-estado="${CSS.escape(name)}"]`); n?.classList.add("flash"); n?.scrollIntoView({ block: "center" }); }, 30);
  };
  const editDado = (name: string) => { revealDado(name); set({ drawer: null, agCfg: null, mdCfg: null, mach: null, dadoEdit: name, estado: name }); };

  const addFn: Ide["addFn"] = async (refId, mode) => {
    const id = await call(() => api.post<string>(pid, "/elements", { mode, refId }));
    if (id) { const ref = U(refId); patch(u => ({ sel: id, ren: id, fresh: id, drawer: null, dadoEdit: null, ctx: null, open: new Set([...u.open, ...(mode === "child" ? [refId] : ref?.parentId ? [ref.parentId] : [])]) })); }
  };
  const newFlow: Ide["newFlow"] = async () => {
    const plan = sRef.current.plan ?? m.plans[0]!.id;
    const id = await call(() => api.post<string>(pid, "/elements", { mode: "root", planId: plan }));
    if (id) { set({ sel: id, drawer: id, plan, flowRoot: id }); toast("Fluxo adicionado", "workflow"); }
  };
  const patchEl: Ide["patchEl"] = async (id, body) => { await call(() => api.patch(pid, `/elements/${id}`, body)); };
  const renameCommit: Ide["renameCommit"] = async (id, title) => {
    const t = title.trim(); set({ ren: null, fresh: null });
    if (t && t !== U(id)?.title) await patchEl(id, { title: t });
  };
  const renameCancel: Ide["renameCancel"] = async id => {
    const fresh = sRef.current.fresh === id; set({ ren: null, fresh: null });
    if (fresh) { await call(() => api.del(pid, `/elements/${id}`)); set({ sel: null }); }
  };
  const askRemove: Ide["askRemove"] = ids => {
    const hasKids = ids.some(i => m.desc(i).length);
    set({ ctx: null });
    if (hasKids) set({ confirm: ids });
    else void call(() => api.post(pid, "/elements-remove", { ids })).then(() => { set({ drawer: null, multi: [], sel: null }); toast(ids.length > 1 ? `${ids.length} itens removidos` : "Removido de todas as visões", "trash-2"); });
  };
  const confirmRemove: Ide["confirmRemove"] = async () => {
    const ids = sRef.current.confirm ?? [];
    const n = new Set(ids.flatMap(i => [i, ...m.desc(i).map(d => d.id)])).size;
    await call(() => api.post(pid, "/elements-remove", { ids }));
    set({ confirm: null, drawer: null, multi: [], sel: null }); toast(`${n} itens removidos de todas as visões`, "trash-2");
  };
  const assign: Ide["assign"] = async (id, agentId) => {
    await patchEl(id, { agentId }); set({ picker: false });
    const a = agentId ? m.agent(agentId) : undefined;
    const u = m.u(id);
    toast(a ? `${a.name} · ${u?.title ?? ""}` : "Sem responsável");
  };
  const dup: Ide["dup"] = async id => { const nid = await call(() => api.post<string>(pid, `/elements/${id}/duplicate`)); if (nid) { set({ sel: nid, ctx: null }); toast("Duplicado, com IDRs novos"); } };
  const paste: Ide["paste"] = async targetId => {
    const clip = sRef.current.clip; if (!clip) return;
    const t = targetId ? U(targetId) : undefined;
    const dest = t ? (m.isFolder(t) || m.kids(t.id).length ? t.id : t.parentId) : null;
    if (clip.mode === "cut" && clip.ids.some(id => id === dest || (dest && isDesc(dest, id)))) { toast("Não dá para colar dentro dele mesmo", "triangle-alert"); return; }
    await call(() => api.post(pid, "/elements-paste", { ids: clip.ids, mode: clip.mode, destId: dest }));
    patch(u => ({ clip: clip.mode === "cut" ? null : u.clip, ctx: null, open: dest ? new Set([...u.open, dest]) : u.open })); toast(clip.mode === "cut" ? "Movido" : "Colado com IDRs novos");
  };
  const move: Ide["move"] = async (id, ref, mode) => { await call(() => api.post(pid, `/elements/${id}/move`, { refId: ref, mode })); set({ sel: id, drawer: null }); };
  const saveDado: Ide["saveDado"] = async (name, v) => {
    await call(() => api.put(pid, "/data", { name, ...v }));
    toast(v.value === "" || v.value === null ? `${name}: valor limpo · voltou a abstrato` : `${name}: concreto (sólido)`, "box");
  };
  const addKid: Ide["addKid"] = async (parent, name) => { const r = await call(() => api.post<string>(pid, "/data/kid", { parent, name })); if (r) patch(u => ({ open: new Set([...u.open, "dt:" + parent]) })); };
  const toggleCube: Ide["toggleCube"] = async name => { const cube = await call(() => api.post<boolean>(pid, "/data/toggle-cube", { name })); if (cube !== undefined) toast(`${name}: ${cube ? "cubo (composto)" : "dado simples □"}`, cube ? "box" : "square"); };
  const newDado: Ide["newDado"] = async () => {
    const plan = sRef.current.plan ?? m.plans[0]!.id;
    const r = await call(() => api.post<{ name: string; hostId: string }>(pid, `/plans/${plan}/new-dado`));
    if (r) { set({ dadoEdit: r.name, estado: r.name, sel: r.hostId, drawer: null }); toast(`Dado “${r.name}” — defina o valor para ficar concreto`, "box"); }
  };
  const runPlan: Ide["runPlan"] = async () => {
    const plan = sRef.current.plan; if (!plan) return;
    // Executar vale para tudo: Node executa lib, IA executa agente, pessoa fica aguardando
    const ids = m.ganttRows(plan).map(r => r.u).filter(u => !m.isData(u) && !m.flowKids(u).length && (!u.status || u.status === "pendente" || u.status === "wait")).map(u => u.id);
    if (!ids.length) { toast("Nada a executar. Falhas só voltam com “Tentar de novo”.", "info"); return; }
    try { const r = await api.run(pid, plan); apply(r.snapshot); setRunIds(ids); toast(`Executando ${r.started} etapa${r.started === 1 ? "" : "s"}`, "play"); } catch (e) { fail(e); }
  };
  const complete: Ide["complete"] = async id => {
    try { const r = await api.complete(pid, id); apply(r.snapshot); setRunIds(m.ganttRows(sRef.current.plan!).map(x => x.u.id)); toast(`${U(id)?.title}: concluída pela pessoa`, "check"); } catch (e) { fail(e); }
  };
  const cancelRun: Ide["cancelRun"] = async () => { const plan = sRef.current.plan; if (!plan) return; try { const r = await api.cancel(pid, plan); apply(r.snapshot); toast("Execução cancelada", "ban"); } catch (e) { fail(e); } };
  const retry: Ide["retry"] = async id => { try { const r = await api.retry(pid, id); apply(r.snapshot); setRunIds([id]); toast(`Tentando de novo: ${U(id)?.title}`, "rotate-ccw"); } catch (e) { fail(e); } };
  const runMachine: Ide["runMachine"] = async (id, code) => {
    set({ console: [] });
    try { const r = await api.runMachine(pid, id, code); set({ console: r.lines }); } catch (e) { fail(e); }
  };
  const openExport: Ide["openExport"] = tab => {
    set({ exp: true, expTab: tab ?? sRef.current.expTab });
  };
  const toggleOpen = (k: string) => patch(u => { const o = new Set(u.open); o.has(k) ? o.delete(k) : o.add(k); return { open: o }; });
  const toggleFlowClosed = (id: string) => patch(u => { const o = new Set(u.flowClosed); o.has(id) ? o.delete(id) : o.add(id); return { flowClosed: o, sel: id }; });

  const ide: Ide = {
    pid, m, s, set, patch, toast, exportData, call, select, openDrawer, closePanels, revealDado, editDado, setFlowRootFrom, openFlowView, activeFlowRoot, toggleOpen, toggleFlowClosed,
    addFn, newFlow, renameCommit, renameCancel, askRemove, confirmRemove, patchEl, assign, dup, paste, move, saveDado, addKid, toggleCube, newDado, runPlan, complete, cancelRun, retry, runMachine, openExport,
  };
  return <IdeCtx.Provider value={{ ...ide, exportData }}>{children}<ExportLoader ide={ide} setData={setExportData} /></IdeCtx.Provider>;
}

/** Busca o código exportado quando o diálogo abre / a aba muda / o snapshot muda. */
function ExportLoader({ ide, setData }: { ide: Ide; setData: (d: ExportResult | null) => void }) {
  const { s, pid, m } = ide;
  const stamp = m.snap.project.updatedAt;
  useEffect(() => {
    if (!s.exp || !s.plan) { setData(null); return; }
    let live = true;
    api.exportPlan(pid, s.plan, s.expTab).then(d => { if (live) setData(d); }).catch(() => { if (live) setData(null); });
    return () => { live = false; };
  }, [s.exp, s.expTab, s.plan, pid, stamp, setData]);
  return null;
}
export type { ElementDto };
