import type { Command } from "../commands";
import type { FlowComponent } from "../component";
import type { Agent, AgentKind, FlowElement, Snapshot } from "../types";
import { FILE_AGENT, MODEL_AGENT } from "../types";
import { isFlowRoot } from "../graph";
import { h, sv, type Child } from "./dom";
import { icon, KIND_ICON, KIND_LABEL, KIND_ONE } from "./icons";
import { buildScene, DEFAULT_FLAGS, HEAD, RH, textWidth as tw, type Disp, type Scene, type StructRow, type ViewFlags } from "./scene";
import { FLOW_CSS } from "./style";

export interface FlowViewOptions {
  /** Plano exibido (padrão: o primeiro). */
  readonly planId?: string;
  /** Função raiz do fluxo exibido (padrão: a primeira do plano). */
  readonly rootId?: string | null;
  readonly flags?: Partial<ViewFlags>;
  /** Confirma remoção de função com filhos (padrão: `window.confirm`). */
  readonly confirm?: (message: string) => boolean;
  /** Pede um texto (nome da entrada/saída; padrão: `window.prompt`). Devolve null ao cancelar. */
  readonly prompt?: (message: string, initial?: string) => string | null;
  readonly onSelect?: (id: string | null) => void;
  /** O fluxo exibido mudou (troca no seletor ou criação de um novo). */
  readonly onRootChange?: (rootId: string | null) => void;
  /** Clique num dado (nome completo). */
  readonly onDataClick?: (name: string) => void;
  /** Comando negado/falho (padrão: toast na própria vista). */
  readonly onError?: (message: string) => void;
  /** Exibir o seletor de fluxo e o botão “Nova função” (padrão: true). */
  readonly chrome?: boolean;
  /** Somente leitura: sem toolbar, filtros, zoom/pan nem ações; altura ajustada ao conteúdo (para docs). */
  readonly readonly?: boolean;
}

export interface FlowViewHandle {
  readonly element: HTMLElement;
  update(): void;
  select(id: string | null): void;
  setRoot(id: string | null): void;
  setFlags(flags: Partial<ViewFlags>): void;
  fit(): void;
  /** Alterna (ou define) a tela cheia da vista. */
  fullscreen(on?: boolean): void;
  readonly isFullscreen: boolean;
  /** Fluxo (função raiz) exibido agora. */
  readonly rootId: string | null;
  /** Função selecionada. */
  readonly selected: string | null;
  destroy(): void;
}

const Z_MIN = 0.25, Z_MAX = 2.5;
const RESP_KINDS: AgentKind[] = ["arquivo", "maquina", "pessoa", "ia", "modelo"];
const isVerb = (t: string): boolean => { const w = t.trim().split(/\s+/)[0]!.toLowerCase().replace(/-(se|lo|la|los|las)$/, ""); return /(ar|er|ir|or|ôr)$/.test(w) && w.length > 2; };
const isConcrete = (a?: Agent): boolean => !!a && (a.kind === "maquina" || a.kind === "arquivo" || a.kind === "script");

let cssInjected = false;
function injectCss(): void {
  if (cssInjected || typeof document === "undefined") return;
  document.head.append(h("style", { "data-flow-component": "" }, FLOW_CSS)); cssInjected = true;
}

/** Monta a vista Flow (mesma do Flow IDE) em `container`, operada pelos comandos do componente. */
export function mountFlowView(container: HTMLElement, flow: FlowComponent, opts: FlowViewOptions = {}): FlowViewHandle {
  injectCss();
  const st = {
    sel: null as string | null, ren: null as string | null,
    closed: new Set<string>(), flags: { ...DEFAULT_FLAGS, ...opts.flags } as ViewFlags,
    full: false, curRoot: undefined as string | null | undefined, rootId: opts.rootId ?? null as string | null, view: { z: 1, x: 16, y: 16 }, fitted: false, toastT: 0,
  };
  const chrome = opts.chrome ?? true;
  const ro = !!opts.readonly;
  const promptFn = opts.prompt ?? ((m: string, d = "") => (typeof window !== "undefined" ? window.prompt(m, d) : null));
  const confirmFn = opts.confirm ?? ((m: string) => (typeof window !== "undefined" ? window.confirm(m) : true));
  let scene: Scene | null = null;
  let hovT = 0;

  // ---------- comandos ----------
  const toast = (msg: string): void => {
    if (opts.onError) { opts.onError(msg); return; }
    root.querySelector(".toast")?.remove();
    const t = h("div", { class: "toast", role: "status" }, msg); root.append(t);
    window.clearTimeout(st.toastT); st.toastT = window.setTimeout(() => t.remove(), 2800);
  };
  const run = async (cmd: Command): Promise<string | undefined> => {
    if (ro) return undefined; // vista somente leitura: nunca altera o modelo
    const r = await flow.execute(cmd);
    if (!r.ok) { toast(r.error.message); return undefined; }
    return r.value.kind === "model" ? r.value.created[0] ?? "" : "";
  };

  // ---------- plano / raiz ----------
  const planId = (snap: Snapshot): string => opts.planId ?? snap.plans[0]?.id ?? "";
  const resolveRoot = (snap: Snapshot): string | null => {
    const tops = buildScene(snap, { planId: planId(snap), rootId: null, closed: st.closed, flags: st.flags }).topsOfPlan();
    if (st.rootId && tops.some(t => t.id === st.rootId)) return st.rootId;
    return tops[0]?.id ?? null;
  };

  // ---------- esqueleto (montado uma vez) ----------
  const root = h("div", { class: "fcv" + (ro ? " ro" : ""), role: "region", "aria-label": "Flow" });
  const rootSel = h("select", { class: "root", "aria-label": "Fluxo", onChange: (e: Event) => { st.rootId = (e.target as HTMLSelectElement).value; st.fitted = false; draw(); } });
  const pct = h("span", { class: "pct" }, "100%");
  const btn = (title: string, ic: string, on: () => void, cls = "ib"): HTMLButtonElement => h("button", { class: cls, title, "aria-label": title, type: "button", onClick: on }, icon(ic));
  const zoomBy = (f: number): void => { const c = canvas; zoomAt(c.clientWidth / 2, c.clientHeight / 2, st.view.z * f); };
  const toolbar = h("div", { class: "ztoolbar" },
    h("span", { class: "ttl" }, icon("workflow"), "Flow"), chrome ? rootSel : null,
    chrome ? h("button", { class: "btn", type: "button", onClick: async () => { const id = await run({ type: "createFunction", planId: planId(flow.snapshot) }); if (id) { st.rootId = id; st.fitted = false; draw(); } } }, icon("plus"), "Nova função") : null,
    h("div", { class: "dz", role: "group", "aria-label": "Zoom" }, btn("Zoom out", "minus", () => zoomBy(1 / 1.15)), pct, btn("Zoom in", "plus", () => zoomBy(1.15)), btn("Ajustar à tela", "maximize-2", () => fit())));
  const world = h("div", { class: "zworld" });
  const canvas = h("div", { class: "zcanvas" }, world);
  const foot = h("div", { class: "flfoot" });
  if (ro) root.append(canvas); else root.append(toolbar, canvas, foot);
  container.append(root);

  // ---------- zoom / pan ----------
  const applyView = (): void => { world.style.transform = `translate(${st.view.x}px, ${st.view.y}px) scale(${st.view.z})`; pct.textContent = Math.round(st.view.z * 100) + "%"; };
  function zoomAt(lx: number, ly: number, nz: number): void {
    const z = Math.min(Z_MAX, Math.max(Z_MIN, nz)); if (Math.abs(z - st.view.z) < 1e-6) return;
    const v = st.view, wx = (lx - v.x) / v.z, wy = (ly - v.y) / v.z; st.view = { z, x: lx - wx * z, y: ly - wy * z }; applyView();
  }
  function fit(): void {
    if (!scene) return; const cw = canvas.clientWidth; if (!cw) return;
    const ch = canvas.clientHeight;
    const z = st.full ? Math.max(0.3, Math.min(1.6, (cw - 56) / scene.worldW, (ch - 40) / scene.worldH)) : Math.max(0.55, Math.min(1.15, (cw - 56) / scene.worldW));
    st.view = { z, x: Math.max(12, (cw - scene.worldW * z) / 2), y: st.full ? Math.max(16, (ch - scene.worldH * z) / 2) : 16 }; st.fitted = true; applyView();
    if (ro && !st.full) canvas.style.height = Math.ceil(scene.worldH * z + 32) + "px";
  }
  const onWheel = (e: WheelEvent): void => { e.preventDefault(); const r = canvas.getBoundingClientRect(), step = e.ctrlKey || e.metaKey ? 1.08 : 1.12; zoomAt(e.clientX - r.left, e.clientY - r.top, st.view.z * (e.deltaY < 0 ? step : 1 / step)); };
  canvas.addEventListener("wheel", onWheel, { passive: false });
  let pan: { id: number; x: number; y: number; ox: number; oy: number; moved: boolean } | null = null;
  canvas.addEventListener("pointerdown", e => {
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as HTMLElement).closest("button, select, input, .bar-tools, .fl-tools, .edge-pop, .resp-pick, .fdep-hit, [data-act]")) return;
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: st.view.x, oy: st.view.y, moved: false };
  });
  canvas.addEventListener("pointermove", e => {
    if (!pan || pan.id !== e.pointerId) return; const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) < 5) return;
    if (!pan.moved) { try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    pan.moved = true; canvas.classList.add("panning"); st.view = { ...st.view, x: pan.ox + dx, y: pan.oy + dy }; applyView();
  });
  const endPan = (): void => { pan = null; canvas.classList.remove("panning"); };
  canvas.addEventListener("pointerup", endPan); canvas.addEventListener("pointercancel", endPan);

  // ---------- tela cheia ----------
  const fsBtn = h("button", { class: "ib fs-btn", type: "button", title: "Tela cheia", "aria-label": "Tela cheia", onClick: () => setFull(!st.full) }, icon("expand"));
  const setFullState = (on: boolean): void => {
    if (st.full === on) return; st.full = on; root.classList.toggle("full", on);
    fsBtn.replaceChildren(icon(on ? "shrink" : "expand")); fsBtn.title = fsBtn.ariaLabel = on ? "Sair da tela cheia" : "Tela cheia";
    if (ro && on) canvas.style.height = ""; st.fitted = false;
    requestAnimationFrame(() => { fit(); if (ro && !on) fit(); });
  };
  function setFull(on: boolean): void {
    const native = typeof root.requestFullscreen === "function";
    if (on) { setFullState(true); if (native) root.requestFullscreen().catch(() => { /* sem permissão: segue no overlay fixo */ }); }
    else if (document.fullscreenElement === root) void document.exitFullscreen(); else setFullState(false);
  }
  const onFsChange = (): void => { if (document.fullscreenElement !== root && st.full) setFullState(false); };
  const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape" && st.full && document.fullscreenElement !== root) setFullState(false); };
  document.addEventListener("fullscreenchange", onFsChange); document.addEventListener("keydown", onKey);
  const zb = (title: string, ic: string, on: () => void): HTMLButtonElement => h("button", { class: "ib fs-extra", type: "button", title, "aria-label": title, onClick: on }, icon(ic));
  root.append(h("div", { class: "fs-bar" }, zb("Zoom out", "minus", () => zoomBy(1 / 1.15)), zb("Zoom in", "plus", () => zoomBy(1.15)), zb("Ajustar à tela", "maximize-2", () => fit()), fsBtn));

  // ---------- seleção ----------
  const select = (id: string | null): void => { st.sel = id; opts.onSelect?.(id); draw(); };

  // ---------- desenho ----------
  const kindsWithAgents = (snap: Snapshot): Map<AgentKind, Agent[]> => {
    const by = new Map<AgentKind, Agent[]>();
    const add = (a: Agent): void => { (by.get(a.kind) ?? by.set(a.kind, []).get(a.kind)!).push(a); };
    snap.agents.filter(a => a.kind !== "script").forEach(add);
    snap.modules.filter(m => !snap.agents.some(a => a.id === FILE_AGENT + m.id)).forEach(m => add({ id: FILE_AGENT + m.id, kind: "arquivo", name: m.file, sub: "", moduleFile: m.file, modelId: null, prompt: null, photoUrl: null, tasks: [] }));
    snap.models.filter(m => !snap.agents.some(a => a.id === MODEL_AGENT + m.id)).forEach(m => add({ id: MODEL_AGENT + m.id, kind: "modelo", name: m.name, sub: m.vendor, moduleFile: null, modelId: m.id, prompt: null, photoUrl: null, tasks: [] }));
    return by;
  };

  function draw(): void {
    const snap = flow.snapshot;
    const pid = planId(snap), rid = resolveRoot(snap);
    if (st.sel && !snap.elements.some(e => e.id === st.sel)) st.sel = null;
    if (rid !== st.curRoot) { st.curRoot = rid; opts.onRootChange?.(rid); }
    const S = (scene = buildScene(snap, { planId: pid, rootId: rid, closed: st.closed, flags: st.flags, ...(ro ? { tail: 230 } : {}) }));
    const tops = S.topsOfPlan();
    if (chrome) { rootSel.replaceChildren(...tops.map(t => h("option", { value: t.id, ...(t.id === rid ? { selected: "" } : {}) }, t.title))); rootSel.value = rid ?? ""; }
    world.style.width = S.worldW + "px"; world.style.height = S.worldH + "px";
    world.replaceChildren(S.rows.length ? buildTable(S, snap) : h("div", { class: "empty" }, "Sem funções neste plano. Use “Nova função”."));
    if (!ro) drawFoot();
    if (!st.fitted) { fit(); if (!st.fitted) requestAnimationFrame(fit); } else applyView();
  }

  function drawFoot(): void {
    const fl = st.flags;
    const set = (p: Partial<ViewFlags>): void => { st.flags = { ...st.flags, ...p }; draw(); };
    const allKids = (open: boolean): void => {
      if (!scene) return; const S = scene;
      S.rows.forEach(r => { if (S.hasKids(r.u)) { if (open) st.closed.delete(r.u.id); else st.closed.add(r.u.id); } });
      if (open) st.closed.clear(); draw();
    };
    const tg = (title: string, ic: string, pressed: boolean, on: () => void): HTMLButtonElement => h("button", { type: "button", title, "aria-label": title, "aria-pressed": pressed, onClick: on }, icon(ic));
    foot.replaceChildren(
      h("span", { class: "flegend" },
        h("span", null, h("i", { class: "lg-fc" }), "função concreta (import node:*)"), h("span", null, h("i", { class: "lg-fa" }), "função abstrata (IA · state)"),
        h("span", null, h("i", { class: "lg-da" }), "dado abstrato (state)"), h("span", null, h("i", { class: "lg-dot" }), "dado concreto"),
        h("span", null, h("i", { class: "lg-sum" }), "composição · camada"), h("span", null, h("i", { class: "lg-seq" }), "sequência"),
        h("span", null, h("i", { class: "lg-if" }), "seleção"), h("span", { class: "ftag" }, "↻ repetição (for)"), h("span", null, h("i", { class: "lg-try" }), "try"), h("span", null, h("i", { class: "lg-catch" }), "catch")),
      h("nav", { class: "vdock", "aria-label": "Filtro transversal" },
        tg("Uma linha para entrada, task e saída", "rows-3", !fl.compact, () => set({ compact: false })),
        tg("Compacto: dados nas pontas da barra", "chart-gantt", fl.compact, () => set({ compact: true })), h("i", { class: "fd-sep" }),
        tg(fl.indent ? "Indentação ligada" : "Indentação desligada", fl.indent ? "indent-increase" : "indent-decrease", fl.indent, () => set({ indent: !fl.indent })), h("i", { class: "fd-sep" }),
        tg("Abrir filhos", "chevrons-up-down", false, () => allKids(true)), tg("Fechar filhos", "chevrons-down-up", false, () => allKids(false)),
        tg("Texto dentro da barra", "type", fl.txtIn, () => set({ txtIn: !fl.txtIn })), h("i", { class: "fd-sep" }),
        tg("Todos os dados de cada estado", "layers", fl.allStates, () => set({ allStates: true })), tg("Só os dados novos de cada estado", "list-plus", !fl.allStates, () => set({ allStates: false }))));
  }

  // ---------- tabela (esquerda) + SVG (direita) ----------
  function buildTable(S: Scene, snap: Snapshot): HTMLElement {
    const left = h("div", { class: "gleft" }, h("div", { class: "ghead" }, h("div", { class: "fl-cols" }, h("span", null, "Responsável"), h("span", null, "Task"))));
    S.disp.forEach((r, i) => left.append(leftRowFor(S, snap, r, i)));
    const right = h("div", { class: "gright" });
    right.append(buildSvg(S, right));
    return h("div", { class: "gtable", style: { gridTemplateColumns: `${S.leftW}px ${S.CW}px`, width: S.worldW + "px" } }, left, right);
  }

  const guideEls = (S: Scene, u: FlowElement, self: boolean, nest: number): Node[] => S.guides(u, self, nest).map(x => h("i", { class: "fl-g", style: { left: 14 + x + "px" }, "aria-hidden": "true" }));
  const kindOk = (k: string): string => (KIND_ICON[k] ? k : "ia");

  function respPick(S: Scene, snap: Snapshot, u: FlowElement, respMode: boolean): HTMLElement {
    const cur = S.agent(respMode ? u.respId : u.agentId);
    const fav = cur
      ? [h("span", { class: "fav " + cur.kind, title: `${KIND_ONE[cur.kind] ?? ""}: ${cur.name}` }, icon(KIND_ICON[kindOk(cur.kind)]!)), h("span", { class: respMode ? "rp-n" : "fav-n" }, cur.name)]
      : [h("span", { class: "fav none", title: respMode ? "Adicionar responsável" : "Sem agente" }, icon("plus")), respMode ? null : h("span", { class: "fav-n", style: { color: "var(--muted)" } }, "sem agente")];
    const by = kindsWithAgents(snap);
    const select = h("select", {
      "aria-label": `Responsável de ${u.title}`, title: "Responsável: arquivo, lib, pessoa, agente ou modelo",
      onClick: (e: Event) => e.stopPropagation(),
      onChange: (e: Event) => { const v = (e.target as HTMLSelectElement).value || null; void (respMode ? run({ type: "patchFunction", id: u.id, patch: { respId: v } }) : run({ type: "assignResponsible", id: u.id, agentId: v })); },
    }, h("option", { value: "" }, cur ? "Sem responsável" : "Responsável…"),
      RESP_KINDS.map(k => { const list = by.get(k) ?? []; return list.length ? h("optgroup", { label: KIND_LABEL[k] }, list.map(c => h("option", { value: c.id, ...(cur?.id === c.id ? { selected: "" } : {}) }, c.name))) : null; }));
    select.value = cur?.id ?? "";
    // toda função precisa de responsável: sem ele, o seletor fica visível e ativo na própria célula
    if (!cur) return h("span", { class: "resp-pick vazio" }, select);
    return h("span", { class: "resp-pick on" }, ...fav, select);
  }

  function taskCell(S: Scene, u: FlowElement, has: boolean): Child {
    const a = S.agent(u.agentId);
    if (st.ren === u.id) {
      const input = h("input", { class: "fl-ren", value: u.title, "aria-label": "Task" }) as HTMLInputElement;
      const ts = isConcrete(a) ? a!.tasks : [];
      let done = false;
      const commit = async (): Promise<void> => {
        if (done) return; done = true; const v = input.value.trim(); st.ren = null;
        if (v && v !== u.title) {
          if (ts.length && !ts.includes(v)) toast("Escolha uma task do catálogo do responsável");
          else if (!ts.length && !isVerb(v)) toast("Função começa com verbo: Comprar…, Enviar…, Fazer…");
          else { await run({ type: "renameFunction", id: u.id, title: v }); return; }
        }
        draw();
      };
      input.addEventListener("click", e => e.stopPropagation());
      input.addEventListener("blur", () => void commit());
      input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); void commit(); } if (e.key === "Escape") { done = true; st.ren = null; draw(); } });
      queueMicrotask(() => { input.focus(); input.select(); });
      return input;
    }
    if (has) return h("b", null, u.title);
    const ts = isConcrete(a) ? a!.tasks : [];
    if (ts.length) {
      const ok = ts.includes(u.title);
      const sel = h("select", { class: "task-pick", "aria-label": `Task de ${a?.name ?? ""}`, title: "Método / task do responsável concreto", onClick: (e: Event) => e.stopPropagation(),
        onChange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v) void run({ type: "setTask", id: u.id, task: v }); } },
        !ok ? h("option", { value: "", disabled: "" }, u.title || "escolher task…") : null, ts.map(t => h("option", { value: t }, t)));
      sel.value = ok ? u.title : ""; return sel;
    }
    return h("b", { class: a ? "" : "task-miss", title: "Clique para renomear", style: { cursor: "text" }, onClick: (e: Event) => { e.stopPropagation(); st.ren = u.id; st.sel = u.id; draw(); } }, u.title || "sem task");
  }

  /** Ferramentas de try/catch de uma função: adicionar, incluir no try da vizinha ou remover do bloco. */
  const renameFn = (id: string): void => { st.ren = id; st.sel = id; opts.onSelect?.(id); draw(); };
  const S0 = (): Scene => scene!;
  /** Edita o for: variável e coleção. */
  const editLoop = async (id: string): Promise<void> => {
    const e = S0().u(id); if (!e?.loop) return;
    const v = promptFn("Variável do for (cada item):", e.loop[0])?.trim(); if (!v) return;
    const l = promptFn("Coleção percorrida:", e.loop[1])?.trim(); if (!l) return;
    await run({ type: "setLoopVars", id, loop: [v, l] });
  };
  /** Edita o if: o dado testado e a função para onde o fluxo volta no "senão". */
  const editIf = async (id: string): Promise<void> => {
    const S = S0(), s = S.structs.find(x => x.body.includes(id)); if (!s) return;
    const cur = S.u(S.u(s.body[0]!)?.cond?.[1] ?? null);
    const test = promptFn("Condição do if (dado testado, ex.: estoque_ok):", s.test)?.trim(); if (!test) return;
    const opts2 = S.snap.elements.filter(x => x.kind === "file" && !x.archived && x.planId === S.u(id)!.planId && !s.body.includes(x.id));
    const nm = promptFn(`Senão, voltar para qual função? (${opts2.map(x => x.title).join(", ")})`, cur?.title ?? "")?.trim(); if (!nm) return;
    const to = opts2.find(x => x.title.toLowerCase() === nm.toLowerCase()) ?? cur; if (!to) return;
    await run({ type: "setCond", id: s.body[0]!, cond: { test, gotoId: to.id } });
  };
  const addIo = async (u: FlowElement, kind: "Input" | "Output"): Promise<void> => {
    const nm = promptFn(kind === "Input" ? "Nome da nova entrada:" : "Nome da nova saída:"); const name = nm?.trim(); if (!name) return;
    await run(kind === "Input" ? { type: "addInput", id: u.id, name } : { type: "addOutput", id: u.id, name });
  };
  const tryTools = (S: Scene, u: FlowElement): HTMLElement[] => {
    const blk = S.tryBlockOf(u), prev = S.prevSibling(u);
    if (u.onError) return [ib(blk.length > 1 ? "Tirar do try (as outras continuam)" : "Remover try/catch", "trash-2", () => void (blk.length > 1 ? run({ type: "setCatch", id: u.id, handlerId: null }) : run({ type: "setTryCatch", id: u.id, on: false })), "on danger")];
    const add = ib("Adicionar try/catch", "shield-alert", () => void run({ type: "setTryCatch", id: u.id, on: true }));
    return prev?.onError ? [ib("Incluir no try da função anterior", "shield-plus", () => void run({ type: "setCatch", id: S.tryBlockOf(prev)[0]!.id, handlerId: prev.onError!, through: u.id })), add] : [add];
  };
  /** Rótulo do catch: genérico e curto; o detalhe (quais funções o try cobre) vai no tooltip. */
  const failLabel = (): string => "se o try falhar";
  const failTip = (S: Scene, from: FlowElement): string => `O fluxo segue aqui se qualquer função do try falhar: ${S.tryBlockOf(from).map(x => `“${x.title}”`).join(", ")}`;
  const isRoot = (S: Scene, u: FlowElement): boolean => isFlowRoot(S.snap, u);
  const askRemove = async (S: Scene, u: FlowElement): Promise<void> => {
    if (S.hasKids(u) && !confirmFn(`Remover “${u.title}” e todas as funções dentro dela?`)) return;
    if (st.sel === u.id) st.sel = null;
    await run({ type: "removeElements", ids: [u.id] });
  };
  const ib = (title: string, ic: string, on: () => void, cls = ""): HTMLButtonElement => h("button", { class: ("ib " + cls).trim(), type: "button", title, "aria-label": title, onClick: (e: Event) => { e.stopPropagation(); on(); } }, icon(ic));
  const setStruct = (id: string, kind: "if" | "loop", on: boolean): Promise<string | undefined> => run(kind === "if" ? { type: "setSelection", id, on } : { type: "setRepetition", id, on });

  function leftRowFor(S: Scene, snap: Snapshot, r: Disp, i: number): HTMLElement {
    if (r.lp) { const lp = r.lp; return h("div", { class: "grow fl-cols ifrow forrow", onClick: () => select(lp.id) },
      h("span", { class: "c-ag muted" }), h("span", { class: "nm", style: { paddingLeft: S.padL(lp, r.d, 0, 10) + "px" } }, ...guideEls(S, lp, false, 0), h("span", { class: "lpd" }, "↻"), h("b", { class: "mono", title: "Clique para editar o for", style: { cursor: "pointer" }, onClick: (e: Event) => { e.stopPropagation(); void editLoop(lp.id); } }, `for (${lp.loop![0]} of ${lp.loop![1]})`)),
      h("span", { class: "fl-tools", role: "toolbar" }, ib("Remover repetição (for)", "trash-2", () => void setStruct(lp.id, "loop", false), "danger"))); }
    if (r.ca) { const ca = r.ca, from = r.from!; return h("div", { class: "grow fl-cols ifrow catchrow", onClick: () => select(ca.id) },
      h("span", { class: "c-ag muted" }), h("span", { class: "nm", style: { paddingLeft: S.padL(ca, r.d, 0, 10) + "px" } }, ...guideEls(S, ca, false, 0), h("span", { class: "trd c" }, "catch"), h("b", { class: "mono", title: failTip(S, from) }, failLabel())),
      h("span", { class: "fl-tools", role: "toolbar" }, ib("Remover try/catch", "trash-2", () => void run({ type: "setTryCatch", id: from.id, on: false }), "danger"))); }
    if (r.tr) { const tr = r.tr, to = S.u(tr.onError); return h("div", { class: "grow fl-cols ifrow tryrow", onClick: () => select(tr.id) },
      h("span", { class: "c-ag muted" }), h("span", { class: "nm", style: { paddingLeft: S.padL(tr, r.d, 0, 10) + "px" } }, ...guideEls(S, tr, false, 0), h("span", { class: "trd" }, "try"), h("b", { class: "mono" }, `catch ↓ ${to?.title ?? "?"}`)),
      h("span", { class: "fl-tools", role: "toolbar" }, ib("Remover try/catch", "trash-2", () => void run({ type: "setTryCatch", id: tr.id, on: false }), "danger"))); }
    if (r.io) {
      const u = r.u!, nest = S.nestOf({ u, d: r.d });
      const mark = S.isCube(r.nm!) ? sv("svg", { class: "io-cube", viewBox: "0 0 10 11" }, sv("path", { d: "M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5" })) : h("i", { class: "io-sq" });
      return h("div", { class: "grow fl-cols iorow" + (st.sel === u.id ? " sel" : "") }, ...guideEls(S, u, true, nest), h("span", { class: "c-ag" }),
        h("span", { class: "nm", style: { paddingLeft: S.padL(u, r.d, nest, 14) + "px" } }, h("span", { class: "io-k" }, !r.first ? "" : r.io === "in" ? "entrada" : r.to ? "entrada · saída" : "saída"),
          h("b", { class: "io-d", title: r.nm, onClick: () => opts.onDataClick?.(r.nm!) }, mark, r.nm)));
    }
    if (r.st) { const s = r.st, bid = S.bidOf(s), head = S.rows[s.i0]?.u; return h("div", { class: "grow fl-cols ifrow", onClick: () => select(bid) },
      h("span", { class: "c-ag muted" }), h("span", { class: "nm", style: { paddingLeft: (head ? S.padL(head, r.d, 0, 10) : 10) + "px" } }, ...(head ? guideEls(S, head, false, 0) : []), h("span", { class: "ifd" }), h("b", { class: "mono", title: "Clique para editar o if", style: { cursor: "pointer" }, onClick: (e: Event) => { e.stopPropagation(); void editIf(bid); } }, `if (${s.test})${S.senaoOf(s)}`)),
      h("span", { class: "fl-tools", role: "toolbar" }, ib("Remover seleção (if)", "trash-2", () => void setStruct(bid, "if", false), "danger"))); }
    void i;
    const u = r.u!, has = S.hasKids(u), a = S.agent(u.agentId), nest = S.nestOf({ u, d: r.d }), open = has && !st.closed.has(u.id);
    const toggle = (): void => { if (st.closed.has(u.id)) st.closed.delete(u.id); else st.closed.add(u.id); draw(); };
    const lead = has ? [h("span", { class: "car", title: "Abrir / fechar sanfona", onClick: (e: Event) => { e.stopPropagation(); toggle(); } }, icon("chevron-down")), h("span", { class: "gi" }, icon("network"))] : [];
    const resp = has ? h("span", { class: "c-ag muted" }, "—") : h("span", { class: "c-ag" }, respPick(S, snap, u, a?.kind === "ia"));
    const editing = st.ren === u.id;
    return h("div", { class: "grow fl-cols" + (st.sel === u.id ? " sel" : "") + (has ? " grp" : "") + (open ? " open" : ""), onClick: () => select(u.id) },
      ...guideEls(S, u, false, nest), resp,
      h("span", { class: "nm", style: { paddingLeft: S.padL(u, r.d, nest, has ? 0 : 10) + "px" } }, ...lead, taskCell(S, u, has)),
      editing ? null : h("span", { class: "fl-tools", role: "toolbar", "aria-label": "Ações do elemento" },
        has ? [ib(open ? "Fechar filhos" : "Abrir filhos", open ? "chevrons-down-up" : "chevrons-up-down", toggle), h("i", { class: "sep" })] : null,
        ib("Adicionar filho (dentro desta função)", "sibling-add", () => void run({ type: "createChild", refId: u.id })),
        u.parentId && S.u(u.parentId)?.kind !== "folder" ? ib("Adicionar irmão (ao lado, no mesmo nível)", "child-add", () => void run({ type: "createSibling", refId: u.id, position: "after" })) : null,
        has || isRoot(S, u) ? null : [h("i", { class: "sep" }),
          S.inIf(u.id) ? ib("Remover seleção (if)", "trash-2", () => void setStruct(u.id, "if", false), "on danger") : ib("Adicionar seleção (if)", "diamond", () => void setStruct(u.id, "if", true)),
          u.loop ? ib("Remover repetição (for)", "trash-2", () => void setStruct(u.id, "loop", false), "on danger") : ib("Adicionar repetição (for)", "repeat", () => void setStruct(u.id, "loop", true))],
        h("i", { class: "sep" }), ...tryTools(S, u),
        isRoot(S, u) ? null : [h("i", { class: "sep" }), ib("Remover", "trash-2", () => void askRemove(S, u), "danger")]));
  }

  // ---------- SVG ----------
  function buildSvg(S: Scene, right: HTMLElement): SVGElement {
    const { disp, rows, structs, OX, CW, W, nSteps, yF, FOOT, HH, axW } = S;
    const yMid = (i: number): number => i * RH + RH / 2, yTop = (i: number): number => i * RH;
    const xs = (i: number): number => OX + i * W;
    const srcOf = new Set(S.FD.map(d => d[0])), dstOf = new Set(S.FD.map(d => d[1]));
    const dmark = (n: string, cx: number, cy: number, cls: string, tip: string): SVGElement => {
      const common = { class: cls, style: { cursor: "pointer" }, onClick: () => opts.onDataClick?.(n) };
      if (S.isCube(n)) { const x = cx - 5, y = cy - 5.5; return sv("path", { ...common, "stroke-linejoin": "round", d: `M${x + 5} ${y} L${x + 10} ${y + 2.7} L${x + 10} ${y + 8.3} L${x + 5} ${y + 11} L${x} ${y + 8.3} L${x} ${y + 2.7} Z M${x} ${y + 2.7} L${x + 5} ${y + 5.4} L${x + 10} ${y + 2.7} M${x + 5} ${y + 5.4} V${y + 11}` }, sv("title", null, tip)); }
      return sv("rect", { ...common, x: cx - 4, y: cy - 4, width: 8, height: 8 }, sv("title", null, tip));
    };
    const ioMarks = (names: string[], cx: number, cy: number, cls: string, tip: string): SVGElement => { const list = names.length ? names : [""]; return dmark(list.find(n => S.isCube(n)) ?? list[0]!, cx, cy, cls, `${list.join(", ")} · ${tip}`); };
    const pill = (x: number, y: number, txt: string, cls: string, onEnter?: () => void, tip?: string, onClick?: () => void): SVGElement =>
      sv("g", { class: "sv-pill " + cls, onMouseEnter: onEnter, ...(onClick ? { style: { cursor: "pointer" }, onClick: (e: Event) => { e.stopPropagation(); onClick(); } } : {}) }, sv("rect", { x, y: y - 8, width: tw(txt, 6.1) + 10, height: 16 }), sv("text", { x: x + 5, y: y + 3.5 }, txt), sv("title", null, tip ?? txt));
    const dnames = (x: number, y: number, list: string[]): SVGElement =>
      sv("text", { class: "sv-dn", x, y: y + 3.5 }, ...list.map((n, i) => sv("tspan", null, i ? ", " : "", sv("tspan", { class: "sv-dl", onClick: () => opts.onDataClick?.(n) }, n))), sv("title", null, list.join(", ")));
    const tagsOf = (u: FlowElement): [string, string][] => (u.status === "wait" ? [["wait", "aguardando pessoa"]] : u.status === "fail" ? [["fail", "falhou"]] : u.status === "exec" ? [["exec", "executando"]] : u.status === "cancel" ? [["cancel", "cancelada"]] : []);
    const after = (x: number, y: number, u: FlowElement, extra: string[]): SVGElement => {
      const out: SVGElement[] = []; let cx = x;
      if (!st.flags.txtIn) { out.push(sv("text", { class: "sv-lbl", x: cx, y: y + 3.5, ...(ro ? {} : { style: { cursor: "text" }, onClick: (e: Event) => { e.stopPropagation(); renameFn(u.id); } }) }, sv("title", null, ro ? u.title : "Clique para renomear"), u.title)); cx += tw(u.title, 5.4) + 10; }
      if (extra.length) { out.push(dnames(cx, y, extra)); cx += tw(extra.join(", "), 6.3) + 10; }
      tagsOf(u).forEach(([k, t]) => { out.push(pill(cx, y, t, k)); cx += tw(t, 6.1) + 16; });
      return sv("g", null, ...out);
    };
    const showBar = (id: string | null, kind: "fn" | "if" | "loop" | "try", anchorX: number, y: number): void => {
      if (ro) return;
      const cur = right.querySelector<HTMLElement>(".bar-tools"), key = kind + ":" + id;
      window.clearTimeout(hovT);
      // já há um menu: o mesmo alvo só o mantém; outro alvo só o troca depois de um instante, para dar tempo de o mouse chegar ao menu
      if (cur?.dataset["key"] === key) return;
      if (cur) { hovT = window.setTimeout(() => renderBar(id, kind, anchorX, y), 350); return; }
      renderBar(id, kind, anchorX, y);
    };
    const renderBar = (id: string | null, kind: "fn" | "if" | "loop" | "try", anchorX: number, y: number): void => {
      window.clearTimeout(hovT); right.querySelector(".bar-tools")?.remove();
      const u = id ? S.u(id) : undefined; if (!u) return;
      let tools: HTMLElement;
      if (kind === "try") tools = h("div", { class: "bar-tools", role: "toolbar" }, ib("Remover try/catch", "trash-2", () => void run({ type: "setTryCatch", id: u.id, on: false }), "danger"));
      else if (kind !== "fn") tools = h("div", { class: "bar-tools", role: "toolbar" }, ib(kind === "loop" ? "Remover repetição (for)" : "Remover seleção (if)", "trash-2", () => { void setStruct(u.id, kind, false); }, "danger"));
      else {
        const leaf = !S.hasKids(u);
        tools = h("div", { class: "bar-tools", role: "toolbar", "aria-label": "Ações da task" },
          S.hasKids(u) ? ib(st.closed.has(u.id) ? "Abrir filhos" : "Fechar filhos", st.closed.has(u.id) ? "chevrons-up-down" : "chevrons-down-up", () => { if (st.closed.has(u.id)) st.closed.delete(u.id); else st.closed.add(u.id); draw(); }) : null,
          ib("Adicionar filho (dentro desta função)", "sibling-add", () => void run({ type: "createChild", refId: u.id })),
          S.u(u.parentId)?.kind !== "folder" && u.parentId ? ib("Adicionar irmão (ao lado, no mesmo nível)", "child-add", () => void run({ type: "createSibling", refId: u.id, position: "after" })) : null,
          leaf && !isRoot(S, u) ? (S.inIf(u.id) ? ib("Remover seleção (if)", "trash-2", () => void setStruct(u.id, "if", false), "on danger") : ib("Adicionar seleção (if)", "diamond", () => void setStruct(u.id, "if", true))) : null,
          leaf && !isRoot(S, u) ? (u.loop ? ib("Remover repetição (for)", "trash-2", () => void setStruct(u.id, "loop", false), "on danger") : ib("Adicionar repetição (for)", "repeat", () => void setStruct(u.id, "loop", true))) : null,
          isRoot(S, u) ? null : ib("Remover", "trash-2", () => void askRemove(S, u), "danger"));
      }
      tools.dataset["key"] = kind + ":" + id;
      tools.style.left = Math.max(4, anchorX) + "px"; tools.style.top = Math.max(2, HEAD + y - 30) + "px";
      tools.addEventListener("mouseenter", () => window.clearTimeout(hovT)); tools.addEventListener("mouseleave", leaveBar);
      right.append(tools);
    };
    const leaveBar = (): void => { window.clearTimeout(hovT); hovT = window.setTimeout(() => right.querySelector(".bar-tools")?.remove(), 450); };

    const els: SVGElement[] = [], bands: SVGElement[] = [];
    // moldura do for
    rows.forEach(({ u }) => {
      if (!u.loop || !S.isFn(u)) return; const g = S.geo(u), t = yTop(S.idx[u.id]!);
      els.push(sv("g", { class: "floop-hit", onMouseEnter: () => showBar(u.id, "loop", g.ix + 12 - 12, yTop(S.idxLoop[u.id] ?? S.idx[u.id]!) + 6) },
        sv("rect", { class: "floop", x: g.ix, y: t, width: g.ox - g.ix, height: RH }),
        sv("title", null, `for (${u.loop[0]} of ${u.loop[1]}) · remover repetição`)));
    });
    // sequência
    S.FD.filter(([a, b]) => S.idx[a] != null && S.idx[b] != null).forEach(([a, b]) => {
      const A = S.u(a)!, B = S.u(b)!, ga = S.geo(A), gb = S.geo(B), ra = S.idxOut[a] ?? S.idx[a]!, rb = S.idxIn[b] ?? S.idx[b]!, y1 = yMid(ra), y2 = yMid(rb);
      const dir = y2 > y1 ? 1 : -1, r1 = S.hasKids(A) ? 5 : 4, r2 = S.hasKids(B) ? 5 : 4, yB = dir > 0 ? yTop(rb) : yTop(rb) + RH;
      const d = ga.ox === gb.ix ? `M${ga.ox} ${y1 + dir * r1} V${y2 - dir * r2}` : `M${ga.ox} ${y1 + dir * r1} V${yB} H${gb.ix} V${y2 - dir * r2}`;
      const open = (e: MouseEvent): void => {
        e.stopPropagation(); const rc = right.getBoundingClientRect(), sx = right.offsetWidth / (rc.width || 1), sy = right.offsetHeight / (rc.height || 1);
        if (!ro) edgePop(right, S, a, b, (e.clientX - rc.left) * sx, (e.clientY - rc.top) * sy); st.sel = b; opts.onSelect?.(b);
      };
      els.push(sv("path", { class: "fdep-hit", d, onClick: open }), sv("path", { class: "fdep" + (S.hasKids(A) || S.hasKids(B) ? " dash" : ""), d }, sv("title", null, "Clique: seleção ou repetição")));
    });
    // entradas/saídas das barras
    rows.forEach(({ u }) => {
      if (!S.isFn(u)) return;
      const g = S.geo(u), y = yMid(S.idx[u.id]!), inNames = S.newIns(u), inAbs = inNames.some(n => S.absData(u, n));
      if (S.idxIn[u.id] != null) els.push(sv("path", { class: "fdep", d: `M${g.ix} ${yMid(S.idxIn[u.id]!) + 4} V${y} H${g.x1}` }));
      else if (u.ins.length || dstOf.has(u.id)) els.push(sv("line", { class: "fstub", x1: g.ix + 4, y1: y, x2: g.x1, y2: y }), ioMarks(inNames, g.ix, y, "fdot" + (inAbs ? " a" : ""), inAbs ? "entrada abstrata (state / outra camada)" : "entrada concreta (mesma camada)"));
      if (S.idxOut[u.id] != null) els.push(sv("path", { class: "fdep", d: `M${g.x2} ${y} H${g.ox} V${yMid(S.idxEnd[u.id]!) - 4}` }));
      else if (u.outs.length || srcOf.has(u.id)) els.push(sv("line", { class: "fstub", x1: g.x2, y1: y, x2: g.ox - 4, y2: y }), ioMarks(u.outs.map(o => o[0]), g.ox, y, "fdot", "saída concreta"));
    });
    // onde ficaria a caixa da entrada/saída e ainda não há: passar o mouse mostra a caixa fantasma; clicar adiciona
    if (!ro) rows.forEach(({ u }) => {
      const g = S.geo(u), i = S.idx[u.id]; if (i == null) return;
      const ghost = (x: number, kind: "Input" | "Output", tip: string): SVGElement => sv("g", { class: "io-ghost", onClick: (e: Event) => { e.stopPropagation(); void addIo(u, kind); } },
        sv("circle", { class: "hit", cx: x, cy: yMid(i), r: 11 }), sv("rect", { class: "gh", x: x - 4, y: yMid(i) - 4, width: 8, height: 8 }),
        sv("path", { class: "gp", d: `M${x - 2} ${yMid(i)} H${x + 2} M${x} ${yMid(i) - 2} V${yMid(i) + 2}` }), sv("title", null, tip));
      if (!u.ins.length && !(S.isFn(u) && dstOf.has(u.id))) els.push(ghost(g.ix, "Input", "Adicionar entrada"));
      if (!u.outs.length && !(S.isFn(u) && srcOf.has(u.id))) els.push(ghost(g.ox, "Output", "Adicionar saída"));
    });
    disp.forEach((r, i) => { if (!r.io) return; const g = S.geo(r.u!), ab = r.io === "in" && S.absData(r.u!, r.nm!); els.push(dmark(r.nm!, r.io === "in" ? g.ix : g.ox, yMid(i), "fdot" + (ab ? " a" : ""), `${r.nm} · ${r.io === "in" ? (ab ? "entrada abstrata (state / outra camada)" : "entrada concreta (mesma camada)") : "saída"}`)); });
    // if: losango + banda
    structs.forEach((s: StructRow) => {
      const i1 = Math.max(...s.body.map(id => S.idxEnd[id] ?? S.idx[id]!)), x = S.geo(rows[s.i0]!.u).ix, y = yMid(s.hi), bid = S.bidOf(s);
      els.push(sv("g", { class: "fif-hit", onMouseEnter: () => showBar(bid, "if", x - 12, yTop(s.hi) + 6) }, sv("circle", { class: "fif-pad", cx: x, cy: y, r: 12 }),
        sv("path", { class: "fif", d: `M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y}Z` }), sv("title", null, `if (${s.test}) · remover seleção`)));
      bands.push(sv("rect", { class: "sv-band", x: 0, y: yTop(s.hi), width: CW, height: (i1 - s.hi + 1) * RH }), sv("line", { class: "sv-bandl", x1: 1, y1: yTop(s.hi), x2: 1, y2: yTop(i1) + RH }));
    });
    S.loops.forEach(({ hi: a, end: b }) => { bands.push(sv("rect", { class: "sv-band lp", x: 0, y: yTop(a), width: CW, height: (b - a + 1) * RH }), sv("line", { class: "sv-bandl lp", x1: 1, y1: yTop(a), x2: 1, y2: yTop(b) + RH })); });

    // try/catch: só rótulo e fundo (bandas); sem seta
    S.tries.forEach(t => {
      const gh = S.geo(t.u);
      bands.push(sv("rect", { class: "sv-band tr", x: 0, y: yTop(t.hi), width: CW, height: (t.end - t.hi + 1) * RH, onMouseEnter: () => showBar(t.u.id, "try", gh.ix, yTop(t.hi) + 6) }), sv("line", { class: "sv-bandl tr", x1: 1, y1: yTop(t.hi), x2: 1, y2: yTop(t.end) + RH }));
      if (t.catchHi != null && t.catchEnd != null) bands.push(sv("rect", { class: "sv-band ca", x: 0, y: yTop(t.catchHi), width: CW, height: (t.catchEnd - t.catchHi + 1) * RH, onMouseEnter: () => showBar(t.u.id, "try", gh.ix, yTop(t.catchHi!) + 6) }), sv("line", { class: "sv-bandl ca", x1: 1, y1: yTop(t.catchHi), x2: 1, y2: yTop(t.catchEnd) + RH }));
    });

    // barras / pills
    const rowSvg = (r: Disp, i: number): SVGElement | null => {
      const y0 = yTop(i), ym = yMid(i);
      if (r.ca) { const ca = r.ca, from = r.from!; return pill(S.geo(ca).ix + 12, ym, `catch · ${failLabel()}`, "catch", () => showBar(from.id, "try", S.geo(ca).ix, y0 + 6), failTip(S, from)); }
      if (r.tr) { const tr = r.tr, to = S.u(tr.onError); return pill(S.geo(tr).ix + 12, ym, `try · catch ↓ ${to?.title ?? "?"}`, "try", () => showBar(tr.id, "try", S.geo(tr).ix, y0 + 6)); }
      if (r.lp) { const lp = r.lp; return pill(S.geo(lp).ix + 12, ym, `↻ for (${lp.loop![0]} of ${lp.loop![1]})`, "loop", () => showBar(lp.id, "loop", S.geo(lp).ix, y0 + 6), "Clique para editar o for", () => void editLoop(lp.id)); }
      if (r.st) { const s = r.st; return pill(S.geo(rows[s.i0]!.u).ix + 12, ym, `if (${s.test})${S.senaoOf(s)}`, "if", () => showBar(S.bidOf(s), "if", S.geo(rows[s.i0]!.u).ix, y0 + 6), "Clique para editar o if", () => void editIf(S.bidOf(s))); }
      if (r.io) { const g = S.geo(r.u!); return dnames((r.io === "in" ? g.ix : g.ox) + 9, ym, [r.nm!]); }
      const u = r.u!, g = S.geo(u), sel = st.sel === u.id;
      if (S.hasKids(u)) return sv("g", null, sv("g", { "data-act": "", style: { cursor: "pointer" }, onClick: () => select(u.id), onMouseEnter: () => showBar(u.id, "fn", g.x1, y0 + 12) },
        sv("rect", { class: "sv-sum" + (sel ? " sel" : ""), x: g.x1, y: y0 + 12, width: g.x2 - g.x1, height: 7, rx: 3.5 }), sv("title", null, `${u.title} · composição = camada`)), after(g.ox + 10, ym, u, []));
      const k = S.fnKind(u), a = S.agent(u.agentId);
      const kt = k === "abs" ? `função abstrata · ${a?.name} vem do state` : k === "conc" ? `função concreta · import ${a?.name}` : "sem agente";
      return sv("g", null, sv("g", { "data-act": "", style: { cursor: "pointer" }, onClick: () => select(u.id), onMouseEnter: () => showBar(u.id, "fn", g.x1, y0 + 6) },
        sv("rect", { class: `sv-fn ${k}${u.status === "fail" ? " fail" : ""}${sel ? " sel" : ""}`, x: g.x1, y: y0 + 6, width: g.x2 - g.x1, height: 22, rx: 11 }),
        st.flags.txtIn ? sv("text", { class: "sv-fbt " + k, x: (g.x1 + g.x2) / 2, y: ym + 3.5, "text-anchor": "middle", ...(ro ? {} : { onClick: (e: Event) => { e.stopPropagation(); renameFn(u.id); } }) }, u.title) : null, sv("title", null, `${u.title} · ${kt}`)),
        after(g.ox + 10, ym, u, st.flags.compact && u.outs.length ? u.outs.map(o => o[0]) : []));
    };

    const svg = sv("svg", { class: "fview", width: CW, height: HH, onMouseLeave: leaveBar },
      sv("defs", null, sv("marker", { id: "fahl", viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: "auto" }, sv("path", { d: "M0 0 L8 4 L0 8z", fill: "var(--loop)" }))),
      sv("text", { class: "sv-title", x: OX + axW / 2, y: 17 }, S.planName),
      sv("line", { class: "sv-hl", x1: OX, y1: 26, x2: OX + axW, y2: 26 }), sv("line", { class: "sv-hl", x1: 0, y1: HEAD, x2: CW, y2: HEAD }),
      ...Array.from({ length: nSteps + 1 }, (_, i) => sv("g", null, sv("g", { class: "sv-chip" }, sv("rect", { x: xs(i) - 11, y: 29, width: 22, height: 15, rx: 2 }), sv("text", { x: xs(i), y: 40 }, `s${i}`), sv("title", null, `state ${i}`)),
        sv("rect", { class: "sv-los", x: xs(i) - 3, y: 49, width: 6, height: 6, transform: `rotate(45 ${xs(i)} 52)` }))),
      ...Array.from({ length: nSteps + 1 }, (_, i) => sv("line", { class: "sv-div", x1: xs(i), y1: HEAD, x2: xs(i), y2: yF + FOOT })),
      sv("line", { class: "sv-hl", x1: 0, y1: yF, x2: CW, y2: yF }), sv("line", { class: "sv-ax", x1: OX, y1: yF + 10, x2: OX + axW, y2: yF + 10 }),
      ...Array.from({ length: nSteps + 1 }, (_, i) => sv("g", null,
        sv("rect", { class: "sv-los", x: xs(i) - 3, y: yF + 7, width: 6, height: 6, transform: `rotate(45 ${xs(i)} ${yF + 10})` }),
        sv("g", { class: "sv-chip" }, sv("rect", { x: xs(i) - 11, y: yF + 19, width: 22, height: 15, rx: 2 }), sv("text", { x: xs(i), y: yF + 30 }, `s${i}`)),
        ...S.stShow[i]!.map(([n, ext, depth], j) => {
          const x0 = xs(i) - 4.2 + depth * 5, y = yF + 44 + j * 14;
          const mark = S.isCube(n) ? sv("path", { d: `M${x0 + 4.2} ${y} L${x0 + 8.4} ${y + 2.2} L${x0 + 8.4} ${y + 6} L${x0 + 4.2} ${y + 8.4} L${x0} ${y + 6} L${x0} ${y + 2.2} Z M${x0} ${y + 2.2} L${x0 + 4.2} ${y + 4.4} L${x0 + 8.4} ${y + 2.2} M${x0 + 4.2} ${y + 4.4} V${y + 8.4}` }) : sv("rect", { x: x0, y, width: 8.4, height: 8.4 });
          return sv("g", { class: "sv-fd" + (ext ? " ext" : ""), style: { cursor: "pointer" }, onClick: () => opts.onDataClick?.(n) }, mark, sv("text", { x: x0 + 12.4, y: y + 7.5 }, depth ? S.dLeaf(n) : n),
            sv("title", null, `${n} · em s${i}${S.dKids(n).length ? " · árvore (cubo)" : " · folha (□)"}${ext ? " · entrada externa" : ""}`));
        }))),
      sv("g", { transform: `translate(0 ${HEAD})` }, ...bands,
        ...disp.map((r, i) => (r.u && st.sel === r.u.id && !r.lp ? sv("rect", { class: "sv-selr", x: 0, y: yTop(i), width: CW, height: RH }) : null)),
        ...disp.map((_, i) => sv("line", { class: "sv-row", x1: 0, y1: yTop(i) + RH, x2: CW, y2: yTop(i) + RH })), ...els, ...disp.map(rowSvg)));
    return svg;
  }

  function edgePop(right: HTMLElement, S: Scene, a: string, b: string, x: number, y: number): void {
    right.querySelector(".edge-pop")?.remove();
    const B = S.u(b); if (!B) return;
    const hasIf = S.inIf(b), hasLoop = !!B.loop;
    void a;
    const close = (): void => { pop.remove(); };
    const pop = h("div", { class: "edge-pop", role: "menu", "aria-label": "Estrutura na sequência", style: { left: Math.max(4, x - 28) + "px", top: Math.max(56, y - 36) + "px" } },
      ib(hasIf ? "Remover seleção (if)" : "Adicionar seleção (if)", hasIf ? "trash-2" : "diamond", () => { close(); void setStruct(b, "if", !hasIf); }, hasIf ? "on danger" : ""),
      ib(hasLoop ? "Remover repetição (for)" : "Adicionar repetição (for)", hasLoop ? "trash-2" : "repeat", () => { close(); void setStruct(b, "loop", !hasLoop); }, hasLoop ? "on danger" : ""),
      ib("Fechar", "x", close));
    right.append(pop);
  }

  // ---------- ciclo de vida ----------
  const unsub = flow.subscribe(() => draw());
  draw();
  const rz = ro && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fit()) : null;
  rz?.observe(canvas);
  return {
    element: root,
    update: draw,
    select,
    setRoot(id) { st.rootId = id; st.fitted = false; draw(); },
    setFlags(f) { st.flags = { ...st.flags, ...f }; draw(); },
    fit,
    fullscreen(on) { setFull(on ?? !st.full); },
    get isFullscreen() { return st.full; },
    get rootId() { return st.curRoot ?? null; },
    get selected() { return st.sel; },
    destroy() { unsub(); rz?.disconnect(); document.removeEventListener("fullscreenchange", onFsChange); document.removeEventListener("keydown", onKey); if (document.fullscreenElement === root) void document.exitFullscreen(); canvas.removeEventListener("wheel", onWheel); window.clearTimeout(hovT); root.remove(); },
  };
}
