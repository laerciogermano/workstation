import { ARG_TYPES, buildArg, emptyDraft, inferArg, type ArgDraft, type ArgType } from "./args";
import { buildCond, COND_OPS, emptyClause, inferCond, JOINERS, needsRight, type CondDraft, type CondOp, type Joiner } from "./cond";
import { runInWorker, type LogLevel, type Running } from "./runner";
import { contractOf, cubeName, fileData, fileDataProducer, filesOf, FlowError, flowFile, fnsOf, kidsOf, type Node, isCube, locate, parseProject, serialize, statesFor, Store, type Command, type Fn, type Project, type StateRef } from "./model";
import { generate, generateFile } from "./codegen";
import { icon } from "./icons";
import { countForStep } from "./scope";
import { build, fnKind, esc, G, parsePrefs, planGutter, planHeight, planWidth, tableWidth, stateTools, toolsFor, toolsHtml, type Prefs, type Ui } from "./view";
import { sampleProject, SAMPLE_TITLES } from "./sample";
import { docExample } from "./docs-examples";

/** Casca de DOM fina: toda regra vive em model/layout/view/codegen (testados sem navegador). */
declare const mountTemas: ((el: HTMLElement) => void) | undefined;


export interface App { store: Store; ui: Ui & { flow: string; zoom: number; pan: { x: number; y: number } }; render(): void; /** Volta ao projeto de exemplo. */ reset(): void; destroy(): void }

export function mount(host: HTMLElement, store: Store, flow: string): App {
  const ui: App["ui"] = { closed: new Set<string>(), sel: null, txtIn: true, allData: true, flow, zoom: 1, pan: { x: 8, y: 8 } };
  /** `?dev=true` (ou `1`): abre o painel com aba TypeScript para ver o código gerado. */
  const SHOW_CODE = /^(1|true|yes)$/i.test(new URLSearchParams(host.ownerDocument.defaultView?.location.search ?? "").get("dev") ?? "");
  let fileCodeText: string | null = null, fileView: string | null = "*", multi: { W: number; H: number } | null = null, tab: "ts" | "term" = SHOW_CODE ? "ts" : "term", hovT = 0, fitted = false, auto = true, last: ReturnType<typeof build> | null = null, gen: ReturnType<typeof generate> | null = null;
  const histBtns = `<button type="button" class="ib hist-btn" data-hist="undo" title="Undo (Ctrl+Z)" aria-label="Undo">${icon("undo")}</button><button type="button" class="ib hist-btn" data-hist="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">${icon("redo")}</button>`;
  host.innerHTML = `
  <div class="app">
    <aside class="explorer" id="explorer" aria-label="File explorer"><div class="ex-head"><span>Explorer</span><button type="button" class="ib" id="agents" title="Sources: register libs, people and AI agents" aria-label="Sources">${icon("users")}</button><button type="button" class="ib" id="exCollapse" title="Collapse all" aria-label="Collapse all">${icon("collapse")}</button></div><div class="ex-tree" id="exTree" role="tree"></div></aside>
    <div class="splitter" id="exSplitter" role="separator" aria-orientation="vertical" aria-label="Resize the explorer" tabindex="0" title="Drag to resize · double-click to reset"><i></i></div>
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <button type="button" class="ib" id="exToggle" title="Show / hide the explorer (Ctrl+B)" aria-pressed="true" aria-label="Explorer">${icon("panel-left")}</button><span class="fx-t" id="flowName">Flow</span><span class="sp"></span><span class="hist-inline"><button type="button" class="ib run" id="exec" title="Run this flow in the browser (Ctrl+Enter)" aria-label="Run">${icon("play")}</button>${histBtns}</span><i class="vsep"></i>
                <button type="button" class="ib" id="zout" title="Zoom out (−)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Zoom in (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Fit to screen (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Name inside the bar" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="dataAll" title="States: showing all available data (click for only the new ones)" aria-pressed="true">${icon("cube")}</button><button type="button" class="ib" id="expand" title="Expand all">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Collapse all">${icon("collapse")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
    </section>
    <div class="splitter" id="splitter" role="separator" aria-orientation="horizontal" aria-label="Resize the terminal" tabindex="0" title="Drag to resize · double-click to reset"><i></i></div>
    <aside class="side">
      <div class="tabs" role="tablist"${SHOW_CODE ? "" : " hidden"}><button type="button" role="tab" data-tab="ts" aria-selected="${SHOW_CODE}">TypeScript</button><button type="button" role="tab" data-tab="term" aria-selected="${!SHOW_CODE}">Terminal</button><span class="sp"></span></div>
      <section class="pane${SHOW_CODE ? " on" : ""}" id="p-ts"${SHOW_CODE ? "" : " hidden"}><div class="fhead"><span class="tsb">TS</span><span id="fname">flow.ts</span><span class="selname" id="selname"></span><span class="meta" id="meta"></span><button type="button" id="dl" title="Download the file">Download</button><button type="button" id="copy">Copy</button></div><div class="code" id="code" tabindex="0" aria-label="Generated TypeScript code"></div></section>
      <section class="pane term${!SHOW_CODE ? " on" : ""}" id="p-term"><div class="thead"><button type="button" class="term-toggle" id="codeToggle" title="Show / hide the terminal (Ctrl+\\)" aria-pressed="false" aria-label="Terminal panel">${icon("terminal")}<span class="tstat" id="tstat">Terminal</span></button><button type="button" id="tRun" class="tbtn" title="Run (Ctrl+Enter)" aria-label="Run">${icon("play")}</button><button type="button" id="tClear" class="tbtn" title="Clear" aria-label="Clear">${icon("eraser")}</button></div><div class="tbody" id="tbody" role="log" aria-live="polite" tabindex="0" aria-label="Terminal"><div class="tline system">Click Run to execute the flow here in the browser.</div></div></section>
    </aside>
  </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string): T => host.querySelector(s) as T;
  const el = { flowName: $("#flowName"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), zv: $("#zv"), explorer: $("#exTree") };
  const multiClick = (e: Event): void => {   // clicar em qualquer ponto da área da função (vista de arquivo / Files) a seleciona
    const t = e.target as HTMLElement; if (t.closest("[data-act],[data-sel],[data-hover],[data-drag],button,select,input,.ghost,.bar-tools,.fl-tools")) return;
    const id = t.closest<HTMLElement>("[data-fid]")?.dataset["fid"]; if (!id || ui.sel === id) return; ui.sel = id; ui.flow = id; render();
  };
  const multiEl = host.ownerDocument.createElement("div"); multiEl.className = "multi"; multiEl.hidden = true; el.zoom.append(multiEl); multiEl.addEventListener("click", multiClick);
  // desfazer / refazer: só ao lado das opções do cabeçalho do Flow (nunca nas dicas dos componentes nem no topo da página)
  const themes = host.ownerDocument.createElement("div"); themes.id = "temas"; host.ownerDocument.querySelector(".topbar")?.append(themes); themes.hidden = true;   // seletor de temas escondido (o tema ainda vem de ?tema= ou do salvo)

  // ───────── diálogos e avisos dentro da própria vista (prompt() do navegador pode ser bloqueado) ─────────
  const modal = <T,>(label: string, fill: (form: HTMLFormElement, done: (v: T) => void) => void): Promise<T> => new Promise(res => {
    host.querySelector(".dlg")?.remove();
    const dlg = host.ownerDocument.createElement("div"); dlg.className = "dlg"; dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-label", label);
    const form = host.ownerDocument.createElement("form"); dlg.append(form);
    const done = (v: T): void => { dlg.remove(); res(v); };
    fill(form, done); dlg.addEventListener("mousedown", e => { if (e.target === dlg) done(null as T); }); host.append(dlg);
    (form.querySelector("input") as HTMLInputElement | null)?.focus();
  });
  /** Edição direta: um campo de texto sobre o próprio rótulo (sem modal). Enter/clicar fora confirma, Esc cancela. */
  let actEl: HTMLElement | null = null;
  /** O clique caiu em cima do TEXTO do elemento (e não na caixa em volta dele, que pode ser bem mais larga que o texto)? */
  const onText = (el: Element, e: MouseEvent): boolean => {
    const r = el.ownerDocument.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect();
    return b.width > 0 && e.clientX >= b.left - 1 && e.clientX <= b.right + 1 && e.clientY >= b.top - 1 && e.clientY <= b.bottom + 1;
  };
  const editInline = (value: string, label: string): Promise<string | null> => new Promise(res => {
    const el = actEl; if (!el) { void ask(label, value).then(res); return; }
    const rc = el.getBoundingClientRect(), cs = getComputedStyle(el), k = el instanceof SVGElement ? ui.zoom : 1;
    const input = document.createElement("input"); input.type = "text"; input.value = value; input.spellcheck = false; input.setAttribute("aria-label", label);
    const txtColor = el instanceof SVGElement && cs.fill && cs.fill !== "none" ? cs.fill : cs.color;
    const w = Math.max(rc.width + 16, 48), h = Math.max(rc.height, 16);
    // sem caixa: o campo fica transparente sobre o próprio texto (que some enquanto edita), só o cursor e a seleção aparecem
    input.style.cssText = `position:fixed;z-index:60;box-sizing:border-box;left:${rc.left}px;top:${rc.top + rc.height / 2 - h / 2}px;width:${w}px;height:${h}px;margin:0;padding:0;border:0;border-radius:0;background:transparent;color:${txtColor};caret-color:${txtColor};outline:none;box-shadow:none;font-family:${cs.fontFamily};font-size:${(parseFloat(cs.fontSize) || 12) * k}px;font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};text-align:left`;
    const prevVis = el.style.visibility; el.style.visibility = "hidden";
    let done = false; const fin = (v: string | null): void => { if (done) return; done = true; input.remove(); el.style.visibility = prevVis; res(v); };
    input.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") fin(input.value.trim() || null); else if (e.key === "Escape") fin(null); });
    input.addEventListener("blur", () => fin(input.value.trim() || null));
    for (const t of ["pointerdown", "mousedown", "click", "dblclick"]) input.addEventListener(t, e => e.stopPropagation());
    document.body.appendChild(input); input.focus(); input.select();
  });
  const ask = (label: string, value = ""): Promise<string | null> => modal<string | null>(label, (form, done) => {
    form.innerHTML = `<label>${esc(label)}</label><input type="text" value="${esc(value)}" spellcheck="false" aria-label="${esc(label)}"><div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">OK</button></div>`;
    const input = form.querySelector("input") as HTMLInputElement; input.select();
    form.addEventListener("submit", e => { e.preventDefault(); done(input.value.trim()); });
    form.querySelector("[data-no]")!.addEventListener("click", () => done(null)); form.addEventListener("keydown", e => { if (e.key === "Escape") done(null); });
  });
  /** Quantas funções há DENTRO do nó (filhas, netas…, inclusive dentro de blocos). Só pede confirmação para remover quando são mais de uma. */
  const innerFns = (n: Node): number => { let c = 0; const go = (list: readonly Node[]): void => { for (const x of list) { if (x.t === "fn") c++; go(kidsOf(x)); } }; go(kidsOf(n)); return c; };
  const confirmAsk = (label: string): Promise<boolean> => modal<boolean>(label, (form, done) => {
    form.innerHTML = `<label>${esc(label)}</label><div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri danger">Remove</button></div>`;
    form.addEventListener("submit", e => { e.preventDefault(); done(true); }); form.querySelector("[data-no]")!.addEventListener("click", () => done(false));
  }).then(v => !!v);
  let toastT = 0;
  const toast = (msg: string): void => { host.querySelector(".toast")?.remove(); const t = host.ownerDocument.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; host.append(t); window.clearTimeout(toastT); toastT = window.setTimeout(() => t.remove(), 3200); };

  // ───────── comandos ─────────
  const run = (cmd: Command, select = true): string | undefined => {
    try { const id = store.dispatch(cmd); if (select && id && cmd.type !== "newFlow") ui.sel = id; if (cmd.type === "newFlow" && id) { ui.flow = id; fitted = false; const nf = locate(P(), id)?.node; if (fileView && fileView !== "*" && nf?.t === "fn" && flowFile(nf) !== fileView) fileView = null; render(); } return id; }
    catch (e) { toast(e instanceof FlowError ? e.message : String(e)); return undefined; }
  };
  const P = (): Project => store.project;

  // ───────── desenho ─────────
  /** Há uma função de primeira ordem em foco: aberta direto, ou clicada dentro da vista de arquivo / Files. */
  const canRun = (): boolean => !fileView || !!(ui.sel && locate(P(), ui.sel));
  function render(): void {
    const p = P(); if (!locate(p, ui.flow)) ui.flow = p.flows[0]?.id ?? ui.flow;
    if (fileView && ui.sel) { const r = locate(p, ui.sel)?.flow; if (r) ui.flow = r.id; }   // clicou numa função dentro da vista de arquivo / Files: o fluxo dela passa a ser o que roda
    last = build(p, ui.flow, ui);
    // "*" = o projeto inteiro: os arquivos lado a lado, cada um com suas funções empilhadas; um arquivo com várias funções: só a pilha dele
    const star = fileView === "*", byFile = new Map<string, Fn[]>(); for (const f of p.flows) byFile.set(flowFile(f), [...(byFile.get(flowFile(f)) ?? []), f]);
    const groups: [string, Fn[]][] = star ? [...byFile] : fileView && (byFile.get(fileView)?.length ?? 0) > 1 ? [[fileView, byFile.get(fileView)!]] : [];
    if (fileView && !star && !byFile.has(fileView)) fileView = null;
    if (groups.length) {
      // todas as funções de um arquivo com as mesmas colunas: a maior tabela e a maior coluna do plano valem para todas (se uma cresce, todas crescem)
      const stack = (fns: Fn[]): { html: string; W: number; H: number } => {
        const first = fns.map(f => build(p, f.id, ui)), minW = Math.max(...first.map(b => b.w)), tw = Math.max(...first.map(b => tableWidth(b.scene, p))); let W = 0, H = 0;
        const html = fns.map(f => { const b = build(p, f.id, { ...ui, minW }), h = planHeight(b.scene, ui.allData); W = Math.max(W, tw + planWidth(b.scene, b.w)); H += h + 34;
          return `<div class="blk${ui.sel === f.id ? " on" : ""}" data-fid="${f.id}"><div class="blk-t"><span class="fn-dot ${fnKind(p, f)}"></span>${esc(f.title)}</div><div class="blk-r" style="height:${h}px"><div class="gtable" style="width:${tw}px;--tw:${tw}px"><div class="ghead"><span>source</span><span>function</span></div>${b.table}</div><div class="gplan">${b.plan}</div></div></div>`; }).join("");
        return { html, W, H };
      };
      let W = 0, H = 0; const GAP = 28;
      multiEl.className = star ? "multi row" : "multi";
      multiEl.innerHTML = groups.map(([file, fns]) => { const st = stack(fns); if (star) { W += st.W + GAP; H = Math.max(H, st.H + 34); return `<div class="mcol" style="width:${st.W}px"><div class="mcol-t">${icon("file")}${esc(file.replace(/\.[^.]+$/, ""))}</div>${st.html}</div>`; } W = st.W; H = st.H; return st.html; }).join("");
      if (star) W -= GAP;
      multiEl.hidden = false; el.table.innerHTML = ""; el.plan.innerHTML = ""; el.table.hidden = el.plan.hidden = true; multi = { W, H };
      el.zoom.style.width = W + "px"; el.zoom.style.height = H + "px"; applyView();
    } else {
      multi = null; multiEl.hidden = true; multiEl.innerHTML = ""; el.table.hidden = el.plan.hidden = false;
    el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>source</span><span>function</span></div>${last.table}` : "";
    el.plan.innerHTML = last.plan;
    const tw0 = tableWidth(last.scene, P()); el.table.style.width = tw0 + "px"; (el.table.style as CSSStyleDeclaration).setProperty("--tw", tw0 + "px");
    const W = tw0 + planWidth(last.scene, last.w), H = planHeight(last.scene, ui.allData);
    el.zoom.style.width = W + "px"; el.zoom.style.height = H + "px"; applyView();
    }
    const bare = (f: string): string => f.replace(/\.[^.]+$/, ""), fl = locate(p, ui.flow)?.flow;   // cabeçalho: arquivo › função em foco (sem função em foco na vista de arquivo / Files: só o arquivo)
    el.flowName.textContent = fileView && !canRun() ? (fileView === "*" ? "src" : bare(fileView)) : fl ? `${bare(flowFile(fl))} › ${fl.title}` : "Flow";
    host.ownerDocument.querySelectorAll<HTMLButtonElement>(".hist-btn").forEach(b => { b.disabled = b.dataset["hist"] === "undo" ? !store.canUndo : !store.canRedo; });
    ($("#txtIn")).setAttribute("aria-pressed", String(ui.txtIn)); $("#dataAll").setAttribute("aria-pressed", String(ui.allData !== false));
    if (!fitted || auto) { fitted = true; fit(); }
    $("#exec").hidden = !canRun();   // o play só existe com uma função de primeira ordem selecionada (não na vista de arquivo / projeto)
    renderCode(); renderExplorer();
  }
  // ───────── explorador: cada flow é um arquivo .ts; dentro dele ficam as funções e os dados (entradas/saídas) ─────────
  const exClosed = new Set<string>();
  /** Explorador: arquivos .ts; cada arquivo lista só as funções de primeira ordem (sem filhos); clicar numa função abre o fluxo dela. */
  function renderExplorer(): void {
    const p = P(), chev = (open: boolean): string => `<span class="ex-car${open ? "" : " shut"}">${icon("chevron")}</span>`;
    const bare = (f: string): string => f.replace(/\.[^.]+$/, ""), files = new Map<string, Fn[]>(); for (const f of p.flows) { const k = flowFile(f); files.set(k, [...(files.get(k) ?? []), f]); }
    const curFile = (() => { const r = locate(p, ui.flow)?.flow; return r ? flowFile(r) : ""; })();
    const secOpen = !exClosed.has("sec:files");
    el.explorer.innerHTML = `<div class="ex-sec-h${fileView === "*" && multi ? " sel" : ""}" data-ex="all" title="Open all files side by side"><span data-exfold="sec:files">${chev(secOpen)}</span><span>src</span><button type="button" class="ex-new" data-exnew title="New function" aria-label="New function">${icon("plus")}</button><button type="button" class="ex-reset" data-exreset title="Reset everything to the initial setup" aria-label="Reset to the initial setup">${icon("reset")}</button><span class="n">${files.size}</span></div>` + (secOpen ? [...files].map(([file, fns]) => {
      const fid = "f:" + file, open = !exClosed.has(fid);
      const body = open ? fns.map(fn => `<div class="ex-row ex-fn${ui.flow === fn.id && !(fileView && multi) ? " sel cur" : ""}" role="treeitem" style="--lv:2" data-ex="fn" data-flow="${fn.id}" title="Open the flow of ${esc(fn.title)}"><span class="fn-dot ${fnKind(p, fn)}"></span><span class="ex-n">${esc(fn.title)}</span><span class="ex-tools"><button type="button" class="ib danger ex-del" data-exdel="${fn.id}" title="Delete this function" aria-label="Delete ${esc(fn.title)}">${icon("trash")}</button></span></div>`).join("") : "";
      return `<div class="ex-row ex-file${file === curFile ? " cur" : ""}${file === fileView && multi ? " sel" : ""}" role="treeitem" style="--lv:1" data-ex="file" data-file="${esc(file)}" data-flow="${fns[0]!.id}"><span data-exfold="${esc(fid)}">${chev(open)}</span><span class="ex-fi">${icon("file")}</span><span class="ex-n">${esc(bare(file))}</span><span class="ex-c">${fns.length}</span><span class="ex-tools"><button type="button" class="ib ex-add" data-exadd="${esc(file)}" title="New function in ${esc(file)}" aria-label="New function in ${esc(file)}">${icon("plus")}</button><button type="button" class="ib danger ex-delfile" data-exdelfile="${esc(file)}" title="Remove ${esc(file)}" aria-label="Remove ${esc(file)}">${icon("trash")}</button></span></div>${body}`;
    }).join("") : "");
  }
  /** Renomeia direto na árvore: arquivo (sem a extensão) ou função. */
  async function editExName(row: HTMLElement, nameEl: HTMLElement): Promise<void> {
    actEl = nameEl;
    if (row.dataset["ex"] === "file") { const file = row.dataset["file"]!, v = await editInline(file.replace(/\.[^.]+$/, ""), "File name"); if (v && v + ".ts" !== file && v !== file) { const to = /\.[A-Za-z0-9]+$/.test(v) ? v : v + ".ts"; if (fileView === file) fileView = to; run({ type: "renameFile", from: file, to: v }, false); } return; }
    const n = locate(P(), row.dataset["flow"]!)?.node; if (!n || n.t !== "fn") return;
    const v = await editInline(n.title, "Function name"); if (v && v !== n.title) run({ type: "rename", id: n.id, title: v }, false);
  }
  el.explorer.addEventListener("dblclick", e => { const t = e.target as HTMLElement, nameEl = t.closest<HTMLElement>(".ex-n"), row = t.closest<HTMLElement>("[data-ex]"); if (nameEl && row && row.dataset["ex"] !== "all" && onText(nameEl, e)) void editExName(row, nameEl); });
  el.explorer.addEventListener("click", e => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-exnew]")) { void run({ type: "newFlow" }); return; }
    const add = t.closest<HTMLElement>("[data-exadd]"); if (add) { { const taken = new Set(P().flows.map(f => f.title)); let n = 1, t = "new_function"; while (taken.has(t)) t = `new_function_${++n}`; run({ type: "newFlow", title: t, file: add.dataset["exadd"]! }); } return; }
    if (t.closest("[data-exreset]")) { void confirmAsk("Reset everything to the initial setup? All files and functions you created will be removed.").then(ok => { if (!ok) return; exClosed.clear(); fileView = "*"; fitted = false; reset(); render(); }); return; }
    const delFile = t.closest<HTMLElement>("[data-exdelfile]");
    if (delFile) { const file = delFile.dataset["exdelfile"]!, ids = P().flows.filter(f => flowFile(f) === file).map(f => f.id); const total = P().flows.filter(f => flowFile(f) === file).reduce((n, f) => n + 1 + innerFns(f), 0); void (total > 1 ? confirmAsk(`Remove the file “${file}” and its ${total} function(s)?`) : Promise.resolve(true)).then(ok => { if (ok) for (const id of ids) if (run({ type: "removeFlow", id }, false) === undefined && P().flows.length <= 1) break; }); return; }
    const del = t.closest<HTMLElement>("[data-exdel]"); if (del) { void delFlow(del.dataset["exdel"]!); return; }
    const fold = t.closest<HTMLElement>("[data-exfold]");
    if (fold) { const k = fold.dataset["exfold"]!; if (exClosed.has(k)) exClosed.delete(k); else exClosed.add(k); renderExplorer(); return; }
    const row = t.closest<HTMLElement>("[data-ex]"); if (!row) return;
    const nameEl = t.closest<HTMLElement>(".ex-n"); if (nameEl && row.dataset["ex"] !== "all" && row.classList.contains("cur") && onText(nameEl, e)) { void editExName(row, nameEl); return; }   // clicar de novo no nome do item aberto edita
    if (row.dataset["ex"] === "all") { fileView = "*"; ui.sel = null; fitted = false; render(); return; }
    ui.flow = row.dataset["flow"]!; ui.sel = null; fitted = false; fileView = row.dataset["ex"] === "file" ? row.dataset["file"]! : null; render();   // arquivo: todas as funções dele (uma embaixo da outra); função: o fluxo dela
  });
  $("#exCollapse").addEventListener("click", () => { for (const f of P().flows) exClosed.add("f:" + flowFile(f)); renderExplorer(); });
  function renderCode(): void {
    const p = P(); gen = generate(p, ui.flow, { runnable: true });   // uma só versão do código: a completa (função, wrappers, simuladores e a chamada)
    let fileCode: ReturnType<typeof generateFile> | null; const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel && !(fileView && multi) ? gen.map[ui.sel] : undefined;
    fileCode = fileView && multi ? (fileView === "*" ? { code: [...new Set(p.flows.map(f => flowFile(f)))].map(file => generateFile(p, p.flows.filter(f => flowFile(f) === file).map(f => f.id)).code).join("\n"), fileName: "project.ts" } : generateFile(p, p.flows.filter(f => flowFile(f) === fileView).map(f => f.id))) : null;
    fileCodeText = fileCode?.code ?? null;
    if (fileCode) { lines.splice(0, lines.length, ...fileCode.code.replace(/\n$/, "").split("\n")); }
    // cores do plano: if âmbar · for branco · try verde · catch/dado vermelho · função azul
    // highlight no texto cru e só depois esc — escapar antes quebrava &lt;/&gt; (o regex coloria "lt"/"gt")
    const kw = (w: string): string | null => /^(?:if|else)$/.test(w) ? "tk-if" : /^(?:for|of)$/.test(w) ? "tk-for" : w === "try" ? "tk-try" : w === "catch" ? "tk-catch" : /^(?:const|let|await|async|import|from|export|type|return|function|as)$/.test(w) ? "tk-k" : null;
    const hl = (l: string): string => {
      let out = "", i = 0; const re = /(\/\/.*$)|("(?:\\.|[^"\\])*")|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g; let m: RegExpExecArray | null;
      while ((m = re.exec(l))) {
        out += esc(l.slice(i, m.index));
        const [, c, s, n, w, par] = m;
        if (c) out += `<span class="tk-c">${esc(c)}</span>`;
        else if (s) out += `<span class="tk-s">${esc(s)}</span>`;
        else if (n) out += `<span class="tk-n">${esc(n)}</span>`;
        else {
          const k = kw(w!);
          if (k) out += `<span class="${k}">${esc(w!)}</span>${par ?? ""}`;
          else if (/^(?:State|Promise|Record|unknown|Fn)$/.test(w!)) out += `<span class="tk-t">${esc(w!)}</span>${par ?? ""}`;
          else out += par ? `<span class="tk-f">${esc(w!)}</span>(` : `<span class="tk-d">${esc(w!)}</span>`;
        }
        i = m.index + m[0].length;
      }
      return out + esc(l.slice(i));
    };
    el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
    el.fname.textContent = fileCode ? fileCode.fileName.replace(/\.ts$/, ".mts") : gen.runFile; el.meta.textContent = `${lines.length} lines`;
    const n = ui.sel ? locate(p, ui.sel)?.node : undefined; el.selname.textContent = n ? (n.t === "fn" ? n.title : n.t) : "";
  }
  const scrollToSel = (): void => { const r = ui.sel && gen?.map[ui.sel]; if (!r) return; const e = el.code.querySelector<HTMLElement>(`[data-n="${r[0]}"]`); if (e) el.code.scrollTo({ top: Math.max(0, e.offsetTop - 60), behavior: "smooth" }); };
  /** Posição e escala da vista (a "câmera"): arrastar o fundo mexe no pan, a roda mexe no zoom. */
  function applyView(): void { el.zoom.style.transform = `translate(${ui.pan.x}px, ${ui.pan.y}px) scale(${ui.zoom})`; el.zv.textContent = Math.round(ui.zoom * 100) + "%"; }
  function fit(): void {
    if (!last) return; const W = multi?.W ?? tableWidth(last.scene, P()) + planWidth(last.scene, last.w), H = multi?.H ?? planHeight(last.scene, ui.allData), cw = el.scroll.clientWidth, ch = el.scroll.clientHeight;
    const narrow = cw < 640 && !document.documentElement.classList.contains("embed"), k = Math.max(narrow ? 0.55 : 0.2, Math.min(1, (cw - 16) / W, (ch - 16) / H)); ui.zoom = Math.round(k * 100) / 100; ui.pan = { x: Math.max(8, (cw - W * ui.zoom) / 2), y: 8 }; applyView();   // em tela estreita não encolhe até ficar ilegível: arrasta com um dedo, pinça com dois
  }
  /** Zoom ancorado: o ponto sob (mx, my) (px da área da vista) continua no mesmo lugar. */
  const zoomTo = (k: number, mx = el.scroll.clientWidth / 2, my = el.scroll.clientHeight / 2): void => {
    const old = ui.zoom, next = Math.min(2.5, Math.max(0.2, Math.round(k * 100) / 100)); if (next === old) return;
    auto = false; ui.pan = { x: mx - (mx - ui.pan.x) * (next / old), y: my - (my - ui.pan.y) * (next / old) }; ui.zoom = next; applyView();
  };
  // dois dedos (celular / tablet) = pinça: zoom ancorado no ponto médio dos dedos; um dedo continua movendo a vista
  const touches = new Map<number, { x: number; y: number }>(); let pinch: { d: number; k: number } | null = null;
  const dist = (): number => { const [a, b] = [...touches.values()]; return Math.hypot(a!.x - b!.x, a!.y - b!.y); };
  el.scroll.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (touches.size === 2) pinch = { d: dist() || 1, k: ui.zoom }; }, true);
  window.addEventListener("pointermove", e => {
    if (e.pointerType !== "touch" || !touches.has(e.pointerId)) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size === 2) { const [a, b] = [...touches.values()], r = el.scroll.getBoundingClientRect(); zoomTo(pinch.k * dist() / pinch.d, (a!.x + b!.x) / 2 - r.left, (a!.y + b!.y) / 2 - r.top); }
  });
  const liftTouch = (e: PointerEvent): void => { if (e.pointerType !== "touch") return; touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
  window.addEventListener("pointerup", liftTouch); window.addEventListener("pointercancel", liftTouch);
  // roda do mouse / pinça do trackpad = zoom no ponteiro; arrastar o fundo = mover; teclas + − 0
  el.scroll.addEventListener("wheel", e => { e.preventDefault(); const r = el.scroll.getBoundingClientRect(); zoomTo(ui.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  el.scroll.addEventListener("mousedown", e => { if (e.button === 1) e.preventDefault(); });   // sem o autoscroll do botão do meio
  el.scroll.addEventListener("pointerdown", e => {
    // botão esquerdo no fundo ou botão do meio em qualquer lugar (inclusive sobre barras e linhas)
    const middle = e.button === 1;
    if (!middle && (e.button !== 0 || (e.target as HTMLElement).closest("[data-act],[data-hover],[data-drag],button,select,input,.ghost,.bar-tools,.fl-tools"))) return;
    if (middle) e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY, p0 = { ...ui.pan }; let moved = false;
    const move = (ev: PointerEvent): void => { if (touches.size > 1) return; if (!moved && !middle && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return; moved = true; auto = false; el.scroll.classList.add("panning"); ui.pan = { x: p0.x + ev.clientX - x0, y: p0.y + ev.clientY - y0 }; applyView(); };
    const up = (): void => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); el.scroll.classList.remove("panning");
      if (moved) { const stop = (ev: Event): void => ev.stopPropagation(); window.addEventListener("click", stop, { capture: true, once: true }); window.setTimeout(() => window.removeEventListener("click", stop, true), 0); }   // arrastar não seleciona
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  // ───────── cadastro de responsáveis ─────────
  const KIND_NAME = { maquina: "Browser lib", pessoa: "Person", ia: "AI agent", arquivo: "File" } as const;
  const agentsDialog = (): Promise<void> => modal<void>("Sources", (form, done) => {
    const draw = (): void => {
      form.classList.add("wide");
      form.innerHTML = `<label>Project sources</label><div class="agl">${P().agents.filter(a => a.kind === "maquina").map(a => `<div class="agr"><span class="fav ${a.kind}">${icon(a.kind === "maquina" ? "package" : a.kind === "pessoa" ? "user" : "ia")}</span><b>${esc(a.name)}</b><span class="k">${KIND_NAME[a.kind]}${a.tasks.length ? ` · ${esc(a.tasks.join(", "))}` : ""}</span><button type="button" class="ib danger" data-rm-agent="${esc(a.id)}" title="Remove ${esc(a.name)}" aria-label="Remove ${esc(a.name)}">${icon("trash")}</button></div>`).join("")}</div>
        <div class="agadd"><select name="kind" aria-label="Type"><option value="maquina">Browser lib</option></select><input name="name" placeholder="name (e.g. Math, Maria, Writer)" aria-label="Name" spellcheck="false"><input name="tasks" placeholder="functions: round(value) -> result; max(a, b) -> result" aria-label="Lib functions with inputs and outputs" spellcheck="false"><button type="submit" class="pri">Add</button></div>
        <div class="row"><button type="button" data-no>Close</button></div>`;
      form.querySelector("[data-no]")!.addEventListener("click", () => done());
      form.querySelectorAll<HTMLElement>("[data-rm-agent]").forEach(b => b.addEventListener("click", () => { run({ type: "removeAgent", id: b.dataset["rmAgent"]! }, false); draw(); }));
      const kind = form.elements.namedItem("kind") as HTMLSelectElement, tasks = form.elements.namedItem("tasks") as HTMLInputElement; const sync = (): void => { tasks.hidden = kind.value !== "maquina"; }; kind.addEventListener("change", sync); sync();
      (form.elements.namedItem("name") as HTMLInputElement).focus();
    };
    form.addEventListener("submit", e => { e.preventDefault(); const f = new FormData(form); if (run({ type: "addAgent", kind: String(f.get("kind")), name: String(f.get("name") ?? ""), tasks: String(f.get("tasks") ?? "") }, false)) draw(); });
    form.addEventListener("keydown", e => { if (e.key === "Escape") done(); }); draw();
  });

  // ───────── caixas de edição das entradas ─────────
  const refNames = (n: Fn): string[] => { const f = locate(P(), n.id)?.flow; return f ? [...new Set(fnsOf(f).flatMap(x => x.outs))] : []; };
  /** Dados de outros arquivos (outs das roots), para origem import no editor. */
  const fileOrigins = (n: Fn): { file: string; name: string; from: string }[] => {
    const own = locate(P(), n.id)?.flow, ownFile = own ? flowFile(own) : "";
    return filesOf(P()).filter(f => f !== ownFile).flatMap(file => fileData(P(), file).map(d => ({ file, ...d })));
  };
  /** O select de tipo: tipos, estados do contexto e dados de outros arquivos (origem). */
  const typeOpts = (d: ArgDraft, states: StateRef[], removable = false, files: { file: string; name: string; from: string }[] = []): string => {
    const isState = d.type === "ref" && states.some(s => s.name === d.value);
    const isImport = d.type === "import";
    const byFile = new Map<string, { file: string; name: string; from: string }[]>();
    for (const x of files) byFile.set(x.file, [...(byFile.get(x.file) ?? []), x]);
    return ARG_TYPES.map(t => `<option value="${t.type}"${t.type === d.type && !isState && !isImport ? " selected" : ""}>${t.label}</option>`).join("")
      + (states.length ? `<optgroup label="States available in the context">${states.map(s => `<option value="state:${esc(s.name)}"${isState && d.value === s.name ? " selected" : ""}>${esc(s.name)} — ${s.kind === "loop" ? "for variable" : `from ${esc(s.from)}`}</option>`).join("")}</optgroup>` : "")
      + [...byFile].map(([file, list]) => `<optgroup label="From file · ${esc(file.replace(/\.[^.]+$/, ""))}">${list.map(x => `<option value="from:${esc(x.file)}#${esc(x.name)}"${isImport && d.value === `${x.file}#${x.name}` ? " selected" : ""}>${esc(x.name)} — from ${esc(x.from)}</option>`).join("")}</optgroup>`).join("")
      + (removable ? `<optgroup label="Data"><option value="__remove">remove this data</option></optgroup>` : "");
  };
  /** Acha o rascunho por caminho: "0" = o parâmetro 0; "0/fields/2" = o campo 2 dele (nome); "0/fields/2/draft" = o valor desse campo. */
  const draftAt = (root: ArgDraft[], path: string): { d?: ArgDraft; field?: { name: string; draft: ArgDraft }; parent?: ArgDraft; idx?: number } => {
    const seg = path.split("/"); let cur: ArgDraft = root[Number(seg[0])]!, field: { name: string; draft: ArgDraft } | undefined, parent: ArgDraft | undefined, idx: number | undefined, i = 1;
    while (i < seg.length) {
      if (seg[i] !== "fields") break; parent = cur; idx = Number(seg[i + 1]); field = cur.fields[idx]; i += 2;
      if (seg[i] === "draft" && field) { cur = field.draft; i++; }
    }
    return { d: cur, ...(field ? { field } : {}), ...(parent ? { parent } : {}), ...(idx !== undefined ? { idx } : {}) };
  };
  /** Um valor editável: tipo + valor; objeto mostra os filhos (campo, tipo, valor) e "Add child". */
  const draftHtml = (d: ArgDraft, path: string, states: StateRef[], depth = 0, removable = false, files: { file: string; name: string; from: string }[] = []): string => {
    const importChip = (): string => {
      const [file, name] = d.value.split("#"), bare = (file ?? "").replace(/\.[^.]+$/, "");
      return `<span class="statechip" title="Imported from ${esc(file ?? "")}">${icon("file", "mini")}${esc(bare)} › ${esc(name ?? "")}</span>`;
    };
    const val = d.type === "boolean" ? `<select data-k="value" data-path="${path}" aria-label="Value"><option value="true"${d.value === "true" ? " selected" : ""}>true</option><option value="false"${d.value !== "true" ? " selected" : ""}>false</option></select>`
      : d.type === "import" ? importChip()
      : d.type === "ref" && states.some(x => x.name === d.value) ? `<span class="statechip" title="Bound to this state">${icon("diamond", "mini")}${esc(d.value)}</span>`
      : d.type === "ref" ? `<input data-k="value" data-path="${path}" list="refnames" value="${esc(d.value)}" placeholder="data name (e.g. customer.name)" spellcheck="false" aria-label="Data">`
      : d.type === "object" ? ""
      : `<input data-k="value" data-path="${path}" value="${esc(d.value)}" placeholder="${d.type === "text" ? "text (e.g. Hello)" : d.type === "number" ? "number (e.g. 42)" : "TypeScript expression"}" spellcheck="false" aria-label="Value">`;
    const kids = d.type === "object" ? `<div class="argkids">${d.fields.map((f, i) => `<div class="argf"><input data-k="name" data-path="${path}/fields/${i}" value="${esc(f.name)}" placeholder="field" spellcheck="false" aria-label="Field name"><div class="argcell">${draftHtml(f.draft, `${path}/fields/${i}/draft`, states, depth + 1, false, files)}</div><button type="button" class="ib danger" data-rm="${path}/fields/${i}" title="Remove the field ${esc(f.name)}" aria-label="Remove the field ${esc(f.name)}">${icon("trash")}</button></div>`).join("")}<button type="button" class="addkid" data-add="${path}">${icon("plus")}Add child</button></div>` : "";
    const sel = `<select data-k="type" data-path="${path}" aria-label="Type">${typeOpts(d, states, removable, depth === 0 ? files : [])}</select>`;
    // dado de primeiro nível: nome em cima (cabeçalho do bloco), depois o tipo e, embaixo, "Value" com o valor
    if (depth === 0) return `<div class="argd d0"><span class="fl">Type / origin</span>${sel}${val ? `<span class="fl">Value</span>${val}` : ""}</div>${kids}`;
    return `<div class="argd d${depth}">${sel}${val}</div>${kids}`;
  };
  /**
   * A caixa de um dado (clicar no marcador). Função de LIB: os nomes vêm do contrato; cada entrada tem TIPO e VALOR. Função ABSTRATA: os mesmos
   * campos de valor (tipo, valor, estados do contexto, objeto com filhos) e, além disso, os nomes são editáveis, dá para remover e "Add child".
   * Saídas só têm nome. Tudo é rascunho até o "Save" do diálogo.
   */
  const dataEditor = (n: Fn, side: "in" | "out", opts: { names?: string[]; start?: boolean } = {}): Promise<void> => modal<void>(side === "in" ? `Input of ${n.title}` : `Output of ${n.title}`, (form, done) => {
    const lib = !!contractOf(P(), n), editable = !lib, withValue = side === "in";
    const names: string[] = opts.names ? [...opts.names] : [...(side === "in" ? n.ins : n.outs)]; if (opts.start && !names.length) { const base = side === "in" ? "input" : "output"; names.push(base); }   // dado novo: nome automático (renomeia-se clicando no texto do dado)
    const drafts: ArgDraft[] = names.map(nm => (withValue ? inferArg(n.args?.[nm] ?? "") : emptyDraft())), refs = refNames(n), states = statesFor(P(), n.id), files = withValue ? fileOrigins(n) : []; form.classList.add("wide");
    // o nome só é editável em linhas NOVAS (e nas saídas, que só têm nome); uma entrada que já existe abre igual à de lib: nome fixo, select de tipo e valor
    const fresh: boolean[] = names.map(() => false), orig: string[] = [...names];   // orig: nome de cada linha ao abrir ("" = linha nova)
    // qualquer dado tem o campo de nome; só o parâmetro de entrada de uma lib é fixo (vem do contrato dela)
    const nameEditable = (i: number): boolean => editable || (side === "out" && i === 0);
    const canAdd = (): boolean => editable && (!withValue || names.length > 1);   // "Add child": numa saída, num objeto (cubo) com vários dados ou ao criar
    const title = (): string => (names.length > 1 ? `${side === "in" ? "Input" : "Output"} of ${esc(n.title)} — object ${esc(cubeName(n, side))}` : `${side === "in" ? "Input" : "Output"} data of ${esc(n.title)}`);
    const draw = (): void => {
      form.innerHTML = `<label>${title()}</label><p class="hint">${withValue ? "Name, type/origin and value. Origin can be a literal, a state in the context, or a data import from another file. Left blank, the input stays abstract (it comes from the state)." : "Name of the data this function produces."}${canAdd() ? " Add child adds one more data (it becomes an object)." : ""}</p>
        ${names.map((nm, i) => `<div class="param"><div class="prow">${names.length > 1 || (withValue && drafts[i]!.type === "object") ? `<span class="cubei" title="object (cube)">${icon("cube")}</span>` : ""}${nameEditable(i) ? `<input data-k="pname" data-i="${i}" value="${esc(nm)}" placeholder="name" spellcheck="false" aria-label="Data name">` : `<b class="pn">${esc(nm)}</b>`}${editable && (!withValue || fresh[i]) ? `<button type="button" class="ib danger" data-del="${i}" title="Remove this data" aria-label="Remove this data">${icon("trash")}</button>` : ""}</div>${withValue ? draftHtml(drafts[i]!, String(i), states, 0, editable, files) : ""}</div>`).join("")}
        ${canAdd() ? `<button type="button" class="addkid" data-newrow>${icon("plus")}Add child</button>` : ""}<datalist id="refnames">${refs.map(r => `<option value="${esc(r)}">`).join("")}</datalist>
        <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
      form.querySelector("[data-no]")!.addEventListener("click", () => done());
    };
    form.addEventListener("change", e => {
      const t = e.target as HTMLInputElement | HTMLSelectElement, path = t.dataset["path"], k = t.dataset["k"]; if (!k) return;
      if (k === "pname") { names[Number(t.dataset["i"])] = t.value.trim(); return; }
      if (!path) return; const hit = draftAt(drafts, path);
      if (k === "name" && hit.field) hit.field.name = t.value; else if (k === "value" && hit.d) hit.d.value = t.value;
      else if (k === "type" && hit.d) {
        if (t.value === "__remove") {   // "remove this data" no select de tipo (função comum): tira a linha; se era a única, aplica na hora
          const i = Number(path.split("/")[0]); names.splice(i, 1); drafts.splice(i, 1); fresh.splice(i, 1); orig.splice(i, 1);
          if (!names.length) { run({ type: "setData", id: n.id, side, names: [], values: [] }, false); done(); return; } draw(); return;
        }
        if (t.value.startsWith("state:")) Object.assign(hit.d, emptyDraft("ref"), { value: t.value.slice(6) });   // um estado do contexto
        else if (t.value.startsWith("from:")) {   // import de out de outro arquivo
          const rest = t.value.slice(5), hash = rest.indexOf("#"), file = hash >= 0 ? rest.slice(0, hash) : rest, name = hash >= 0 ? rest.slice(hash + 1) : "";
          const prod = fileDataProducer(P(), file, name);
          if (prod && prod.ins.some(i => !(prod.args?.[i]?.trim()))) toast(`“${prod.title}” still has abstract inputs; the generated call will use {}.`);
          Object.assign(hit.d, emptyDraft("import"), { value: `${file}#${name}` });
        }
        else { const keep = hit.d.value; Object.assign(hit.d, emptyDraft(t.value as ArgType), t.value === "expr" || t.value === "text" ? { value: keep } : {}); }
        draw();
      }
    });
    form.addEventListener("click", e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-add],[data-rm],[data-del],[data-newrow]"); if (!b) return;
      if (b.dataset["add"] !== undefined) { const o = draftAt(drafts, b.dataset["add"]).d!; let i = o.fields.length + 1; while (o.fields.some(f => f.name === `field${i}`)) i++; o.fields.push({ name: `field${i}`, draft: emptyDraft() }); }
      else if (b.dataset["rm"] !== undefined) { const r = draftAt(drafts, b.dataset["rm"]); r.parent!.fields.splice(r.idx!, 1); }
      else if (b.dataset["del"] !== undefined) { const i = Number(b.dataset["del"]); names.splice(i, 1); drafts.splice(i, 1); fresh.splice(i, 1); orig.splice(i, 1); }
      else { let i = names.length + 1; while (names.includes(`field${i}`)) i++; names.push(`field${i}`); drafts.push(emptyDraft()); fresh.push(true); orig.push(""); }
      draw();
    });
    form.addEventListener("keydown", e => { if (e.key === "Escape") done(); });
    form.addEventListener("submit", e => {
      e.preventDefault(); form.querySelectorAll<HTMLInputElement>("input[data-k]").forEach(i => { const k = i.dataset["k"]; if (k === "pname") { names[Number(i.dataset["i"])] = i.value.trim(); return; } const hit = draftAt(drafts, i.dataset["path"]!); if (k === "value" && hit.d) hit.d.value = i.value; if (k === "name" && hit.field) hit.field.name = i.value; });
      try {
        const values = withValue ? drafts.map(d => buildArg(d)) : [];
        // renomear um dado que já existia: propaga para quem o usa (renameIo / renameData da saída de uma lib)
        if (!editable && side === "out" && names[0] && orig[0] && names[0] !== orig[0]) store.dispatch({ type: "renameData", id: n.id, to: names[0] });
        if (editable) { names.forEach((nm, i) => { if (nm && orig[i] && nm !== orig[i]) store.dispatch({ type: "renameIo", id: n.id, side, from: orig[i]!, to: nm }); orig[i] = nm; }); }
        if (editable) { const keep = names.map((nm, i) => [nm, values[i] ?? ""] as const).filter(([nm]) => nm); run({ type: "setData", id: n.id, side, names: keep.map(k => k[0]), values: keep.map(k => k[1]) }, false); }
        else names.forEach((nm, i) => { run({ type: "setArg", id: n.id, name: nm, value: values[i]! }, false); });
        done();
      } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    });
    draw();
  });

  /** Caixa do for (igual à do if): variável de cada item e a coleção, que pode ser um dado do contexto (estado) ou uma expressão. */
  const forDialog = (id: string, v0: string, coll0: string, kids: readonly Node[]): Promise<void> => modal<void>("Repetition", (form, done) => {
    const first = (ns: readonly Node[]): string | undefined => { for (const x of ns) { if (x.t === "fn" && !x.kids.length) return x.id; const r = first(kidsOf(x)); if (r) return r; } return undefined; };
    const fid = first(kids), states = fid ? statesFor(P(), fid) : [];
    form.classList.add("wide");
    form.innerHTML = `<label>Repetition (for)</label>
      <div class="param"><span class="pn">Variable</span><input data-k="fv" value="${esc(v0)}" placeholder="item" spellcheck="false" aria-label="Variable"></div>
      <div class="param"><span class="pn">Collection</span><input data-k="fe" list="forcoll" value="${esc(coll0)}" placeholder='["a", "b"]  or  a data name' spellcheck="false" aria-label="Collection"><datalist id="forcoll">${states.map(x => `<option value="${esc(x.name)}">`).join("")}</datalist></div>
      <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
    const fv = form.querySelector<HTMLInputElement>("[data-k=fv]")!, fe = form.querySelector<HTMLInputElement>("[data-k=fe]")!;
    form.querySelector("[data-no]")!.addEventListener("click", () => done()); form.addEventListener("keydown", e => { if (e.key === "Escape") done(); });
    form.addEventListener("submit", e => { e.preventDefault(); try { store.dispatch({ type: "setFor", id, v: fv.value.trim(), coll: fe.value.trim() }); done(); } catch (err) { toast(err instanceof Error ? err.message : String(err)); } });
  });

  /** Caixa da condição do if: cláusulas (dado + operador + valor) ligadas por AND / OR, com os estados do contexto no select. */
  const condDialog = (ifId: string, current: string, kids: readonly import("./model").Node[]): Promise<void> => modal<void>("Condition", (form, done) => {
    const first = (ns: readonly import("./model").Node[]): string | undefined => { for (const x of ns) { if (x.t === "fn" && !x.kids.length) return x.id; const r = first(x.t === "try" ? [...x.kids, ...x.catchKids] : x.t === "if" ? [...x.kids, ...x.elseKids] : x.kids); if (r) return r; } return undefined; };
    const states = (() => { const f = first(kids); return f ? statesFor(P(), f) : []; })(), draft: CondDraft = inferCond(current); form.classList.add("wide");
    const stateOpts = (sel: string): string => states.length ? `<optgroup label="States available in the context">${states.map(s => `<option value="state:${esc(s.name)}"${sel === s.name ? " selected" : ""}>${esc(s.name)} — ${s.kind === "loop" ? "for variable" : `from ${esc(s.from)}`}</option>`).join("")}</optgroup>` : "";
    const preview = (): string => { try { return buildCond(draft) || "(empty)"; } catch (e) { return e instanceof Error ? e.message : String(e); } };
    const draw = (): void => {
      form.innerHTML = `<label>Condition of the if</label><p class="hint">Pick a state from the context or type a data path, choose how to compare it, and chain more conditions with AND / OR (AND is evaluated before OR).</p>
        <div class="conds">${draft.clauses.map((c, i) => {
          const isState = states.some(s => s.name === c.left.value), r = c.right, rIsState = r.type === "ref" && states.some(s => s.name === r.value);
          return `<div class="cond">${i === 0 ? '<span class="cj">IF</span>' : `<select class="cj" data-ci="${i}" data-k="join" aria-label="Join">${JOINERS.map(j => `<option value="${j.join}"${c.join === j.join ? " selected" : ""}>${j.label}</option>`).join("")}</select>`}
            <select data-ci="${i}" data-k="left" aria-label="Data"><option value="custom"${isState ? "" : " selected"}>data path / expression…</option>${stateOpts(isState ? c.left.value : "")}</select>
            ${isState ? "" : `<input data-ci="${i}" data-k="leftv" value="${esc(c.left.value)}" placeholder="e.g. customer.status" spellcheck="false" aria-label="Data path or expression">`}
            <select data-ci="${i}" data-k="op" aria-label="Operator">${COND_OPS.map(o => `<option value="${o.op}"${c.op === o.op ? " selected" : ""}>${o.label}</option>`).join("")}</select>
            ${needsRight(c.op) ? `<select data-ci="${i}" data-k="rtype" aria-label="Value type"><option value="text"${r.type === "text" ? " selected" : ""}>text</option><option value="number"${r.type === "number" ? " selected" : ""}>number</option><option value="boolean"${r.type === "boolean" ? " selected" : ""}>boolean</option><option value="expr"${r.type === "expr" || (r.type === "ref" && !rIsState) ? " selected" : ""}>expression</option>${stateOpts(rIsState ? r.value : "")}</select>${
              r.type === "boolean" ? `<select data-ci="${i}" data-k="rvalue" aria-label="Value"><option value="true"${r.value === "true" ? " selected" : ""}>true</option><option value="false"${r.value !== "true" ? " selected" : ""}>false</option></select>` : rIsState ? "" : `<input data-ci="${i}" data-k="rvalue" value="${esc(r.value)}" placeholder="${r.type === "number" ? "number (e.g. 3)" : r.type === "text" ? "text (e.g. active)" : "expression"}" spellcheck="false" aria-label="Value">`}` : ""}
            <button type="button" class="ib danger" data-cdel="${i}" title="Remove this condition" aria-label="Remove this condition">${icon("trash")}</button></div>`; }).join("")}</div>
        <div class="row"><button type="button" class="addkid" data-cadd="&&">${icon("plus")}Add AND</button><button type="button" class="addkid" data-cadd="||">${icon("plus")}Add OR</button><span class="sp"></span></div>
        <code class="preview" id="cpreview">${esc(preview())}</code>
        <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
      form.querySelector("[data-no]")!.addEventListener("click", () => done());
    };
    const upd = (t: HTMLInputElement | HTMLSelectElement): boolean => {
      const i = Number(t.dataset["ci"]), c = draft.clauses[i]; if (!c) return false; const k = t.dataset["k"];
      if (k === "join") c.join = t.value as Joiner;
      else if (k === "left") { if (t.value.startsWith("state:")) { c.left = { type: "ref", value: t.value.slice(6), fields: [] }; } else c.left = { type: "ref", value: "", fields: [] }; return true; }
      else if (k === "leftv") c.left = { type: "expr", value: t.value, fields: [] };
      else if (k === "op") { c.op = t.value as CondOp; return true; }
      else if (k === "rtype") { if (t.value.startsWith("state:")) c.right = { type: "ref", value: t.value.slice(6), fields: [] }; else c.right = { type: t.value as "text" | "number" | "boolean" | "expr", value: t.value === "boolean" ? "true" : (c.right.type === "ref" ? "" : c.right.value), fields: [] }; return true; }
      else if (k === "rvalue") c.right = { ...c.right, value: t.value };
      return false;
    };
    form.addEventListener("input", e => { const t = e.target as HTMLInputElement; if (t.dataset["k"] === "leftv" || t.dataset["k"] === "rvalue") { upd(t); const pv = form.querySelector("#cpreview"); if (pv) pv.textContent = preview(); } });
    form.addEventListener("change", e => { const t = e.target as HTMLInputElement | HTMLSelectElement; if (!t.dataset["k"]) return; if (upd(t)) draw(); else { const pv = form.querySelector("#cpreview"); if (pv) pv.textContent = preview(); } });
    form.addEventListener("click", e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-cadd],[data-cdel]"); if (!b) return;
      if (b.dataset["cadd"]) draft.clauses.push(emptyClause(b.dataset["cadd"] as Joiner)); else { draft.clauses.splice(Number(b.dataset["cdel"]), 1); if (!draft.clauses.length) draft.clauses.push(emptyClause()); } draw();
    });
    form.addEventListener("keydown", e => { if (e.key === "Escape") done(); });
    form.addEventListener("submit", e => {
      e.preventDefault(); try { const test = buildCond(draft); if (!test) { toast("Add at least one condition"); return; } run({ type: "setIf", id: ifId, test }, false); done(); } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    });
    draw();
  });

  // ───────── ações (data-act) ─────────
  const kids = (id: string): number => { const n = locate(P(), id)?.node; return n && n.t !== "fn" ? n.kids.length : 0; };
  const ACT: Record<string, (d: DOMStringMap) => void | Promise<void>> = {
    toggle: d => { const id = d["id"]!; if (ui.closed.has(id)) (ui.closed as Set<string>).delete(id); else (ui.closed as Set<string>).add(id); render(); },
    addChild: d => void run({ type: "addChild", id: d["id"]!, ...(d["catch"] ? { catch: true } : {}), ...(d["else"] ? { else: true } : {}) }),
    addElse: d => void run({ type: "addElse", id: d["id"]! }),
    removeElse: d => void run({ type: "removeElse", id: d["id"]! }, false),
    addSibling: d => void run({ type: "addSibling", id: d["id"]! }),
    wrap: d => void run({ type: "wrap", id: d["id"]!, kind: d["kind"]! }),
    unwrap: d => void run({ type: "unwrap", id: d["id"]! }, false),
    exitScope: d => void run({ type: "exitScope", id: d["id"]! }),
    parallel: d => void run({ type: "setParallel", id: d["id"]!, on: d["on"] === "true" }),
    setScope: d => void run({ type: "setScope", id: d["id"]!, count: kids(d["id"]!) + Number(d["delta"]) }, false),
    remove: async d => {
      const l = locate(P(), d["id"]!); if (!l) return;
      const label = l.node.t === "fn" ? l.node.title : l.node.t === "try" ? "try/catch" : l.node.t;
      if (innerFns(l.node) > 0 && !(await confirmAsk(`Remove “${label}” and everything inside it?`))) return;
      if (ui.sel === d["id"]) ui.sel = null; run({ type: "remove", id: d["id"]! }, false);
    },
    rename: async d => { const n = locate(P(), d["id"]!)?.node; if (!n || n.t !== "fn") return; ui.sel = n.id; const v = await editInline(n.title, "Function name"); if (v) run({ type: "rename", id: n.id, title: v }); else render(); },
    editBlock: async d => {
      const id = d["id"]!, n = locate(P(), id)?.node; if (!n) return;
      if (n.t === "for") await forDialog(n.id, n.v, n.coll, n.kids);
      else if (n.t === "if") await condDialog(n.id, n.test, n.kids);
    },
    editData: async d => {
      const n = locate(P(), d["id"]!)?.node; if (!n || n.t !== "fn") return; const side = d["side"] === "out" ? "out" : "in", list = side === "in" ? n.ins : n.outs;
      if (contractOf(P(), n)) { if (side === "in") await dataEditor(n, "in"); else if (list.length === 1) await ACT["renameOut"]!(d); else toast("This function’s outputs come from the lib contract"); return; }
      await dataEditor(n, side);
    },
    removeIo: d => { const n = locate(P(), d["id"]!)?.node; if (n?.t !== "fn") return; run({ type: d["side"] === "out" ? "removeOutput" : "removeInput", id: n.id, name: d["name"]! }, false); },
    renameOut: async d => { const n = locate(P(), d["id"]!)?.node; if (!n || n.t !== "fn") return; const v = await editInline(n.outs[0] ?? "", "Output data name"); if (v) run({ type: "renameData", id: n.id, to: v }, false); },
    // caixa fantasma: entrada abre a caixa só com select e valor (o nome é automático); saída é criada na hora, só tem nome
    addIo: async d => {
      const n = locate(P(), d["id"]!)?.node; if (n?.t !== "fn") return;
      if (d["kind"] === "in") { await dataEditor(n, "in", { start: true }); return; }
      let i = 2, name = "output"; while (n.outs.includes(name)) name = `output${i++}`; run({ type: "setData", id: n.id, side: "out", names: [...n.outs, name] }, false);
    },
    /** Clicar no texto do dado (função comum, um dado só) renomeia. */
    renameData: async d => { const n = locate(P(), d["id"]!)?.node; if (n?.t !== "fn") return; const side = d["side"] === "out" ? "out" : "in", cur = d["name"]!; const v = await editInline(cur, side === "in" ? "Input data name" : "Output data name"); if (v && v !== cur) run({ type: "renameIo", id: n.id, side, from: cur, to: v }, false); },
  };

  host.addEventListener("click", e => {
    const t = e.target as HTMLElement;
    if (t.closest(".dlg, select")) return;
    const a = t.closest<HTMLElement>("[data-act]");
    if (a?.dataset["act"] && ACT[a.dataset["act"]] && !(a.dataset["act"] === "rename" && !onText(a, e))) { e.stopPropagation(); actEl = a; void ACT[a.dataset["act"]]!(a.dataset); return; }   // renomear: só clicando em cima do texto; na caixa em volta, só seleciona
    const row = t.closest<HTMLElement>(".grow[data-id], [data-sel]");
    if (row) { ui.sel = row.dataset["id"] ?? row.dataset["sel"] ?? null; render(); scrollToSel(); }
  });
  host.addEventListener("change", e => {
    const s = e.target as HTMLSelectElement, c = s.dataset["change"], id = s.dataset["id"]; if (!c || !id) return;
    if (c === "assign" && (s.value.startsWith("file:") || s.value.startsWith("obj:")) && s.value.includes("#")) { const i = s.value.indexOf("#"), agent = s.value.slice(0, i), task = s.value.slice(i + 1); if (run({ type: "assign", id, agent }, false) !== undefined || true) run({ type: "setTask", id, task }, false); }   // arquivo ou objeto do contexto: fonte + função
    else if (c === "assign") run({ type: "assign", id, agent: s.value || null }, false);
    else if (c === "setResp") run({ type: "setResp", id, resp: s.value || null }, false);
    else if (c === "setTask") run({ type: "setTask", id, task: s.value }, false);
  });
  const delFlow = async (id: string): Promise<void> => { const f = locate(P(), id)?.node; if (!f || f.t !== "fn") return; if (innerFns(f) > 1 && !(await confirmAsk(`Delete the flow “${f.title}” and everything inside it?`))) return; run({ type: "removeFlow", id: f.id }, false); };
  $("#agents").addEventListener("click", () => void agentsDialog());
  host.ownerDocument.addEventListener("click", e => { const b = (e.target as HTMLElement).closest<HTMLElement>(".hist-btn"); if (b) { if (b.dataset["hist"] === "undo") store.undo(); else store.redo(); } });
  $("#zin").addEventListener("click", () => zoomTo(ui.zoom * 1.15)); $("#zout").addEventListener("click", () => zoomTo(ui.zoom / 1.15)); $("#fit").addEventListener("click", () => { auto = true; render(); });
  $("#txtIn").addEventListener("click", () => { ui.txtIn = !ui.txtIn; render(); });
  $("#dataAll").addEventListener("click", () => { ui.allData = !ui.allData; $("#dataAll").title = ui.allData ? "States: showing all available data (click for only the new ones)" : "States: showing only the new data (click for all available)"; render(); });
  $("#expand").addEventListener("click", () => { (ui.closed as Set<string>).clear(); render(); });
  $("#collapse").addEventListener("click", () => { const f = locate(P(), ui.flow)?.node; if (f?.t === "fn") { const mark = (list: readonly Node[]): void => list.forEach(n => { if (n.t === "fn" && n.kids.length) (ui.closed as Set<string>).add(n.id); mark(kidsOf(n)); }); mark(f.kids); if (f.kids.length) (ui.closed as Set<string>).add(f.id); } auto = true; render(); });   // recolhe as funções com filhos (também dentro de if/for/try) e a própria função do fluxo
  const showTab = (name: "ts" | "term"): void => {
    if (!SHOW_CODE) name = "term";
    tab = name;
    host.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", String((x as HTMLElement).dataset["tab"] === name)));
    host.querySelectorAll(".pane").forEach(pn => { const on = pn.id === `p-${name}`; pn.classList.toggle("on", on); if (pn.id === "p-ts") pn.hidden = !SHOW_CODE || !on; });
  };
  host.querySelectorAll<HTMLElement>("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset["tab"] as "ts" | "term")));
  $("#dl").addEventListener("click", () => { if (!gen) return; const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([fileCodeText ?? gen.code], { type: "text/plain" })); a.href = url; a.download = gen.runFile; host.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); });
  $("#copy").addEventListener("click", async () => { await navigator.clipboard?.writeText(fileCodeText ?? gen?.code ?? "").catch(() => {}); $("#copy").textContent = "Copied"; setTimeout(() => ($("#copy").textContent = "Copy"), 1200); });
  const reset = (): void => { const s = sampleProject(); store.load(s.project); ui.flow = s.main; ui.sel = null; (ui.closed as Set<string>).clear(); auto = true; };
  host.ownerDocument.addEventListener("keydown", e => {
    const tg = e.target as HTMLElement; if (/input|textarea|select/i.test(tg.tagName)) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey) { if (e.key === "+" || e.key === "=") { zoomTo(ui.zoom * 1.15); return; } if (e.key === "-") { zoomTo(ui.zoom / 1.15); return; } if (e.key === "0") { auto = true; render(); return; } }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
  });

  // ───────── barra de ferramentas ao passar o mouse nas barras e etiquetas do plano ─────────
  const SWITCH_MS = 110, LEAVE_MS = 180;   // trocar de alvo e sumir: rápido, mas com folga para o mouse chegar ao menu
  const leaveBar = (): void => { window.clearTimeout(hovT); hovT = window.setTimeout(() => el.zoom.querySelectorAll(".bar-tools").forEach(b => b.remove()), LEAVE_MS); };
  el.zoom.addEventListener("mouseover", e => {   // vale para o plano único e para cada função da vista de arquivo (multi)
    const h = (e.target as HTMLElement).closest<SVGElement>("[data-hover],[data-sthover]"); if (!h) return;
    const plan = h.closest<HTMLElement>(".gplan") ?? el.plan, isSt = h.dataset["sthover"] !== undefined;   // estado (dado embaixo da coluna) ou barra/etiqueta
    window.clearTimeout(hovT); const id = (isSt ? h.dataset["sthover"] : h.dataset["hover"])!, part = (h.dataset["part"] as "main" | "catch" | "else" | undefined) ?? "main", key = isSt ? `${id}|${h.dataset["side"]}|${h.dataset["name"]}|st` : id + part;
    const cur = el.zoom.querySelector<HTMLElement>(".bar-tools"); if (cur && cur.parentElement === plan && cur.dataset["key"] === key) return;
    const show = (): void => {
      el.zoom.querySelectorAll(".bar-tools").forEach(b => b.remove()); const bar = host.ownerDocument.createElement("div"); bar.className = "bar-tools"; bar.dataset["key"] = key; bar.setAttribute("role", "toolbar");
      bar.innerHTML = toolsHtml(isSt ? stateTools(P(), id, h.dataset["side"] === "out" ? "out" : "in", h.dataset["name"] ?? "") : toolsFor(P(), id, part)); const hr = h.getBoundingClientRect(), pr = plan.getBoundingClientRect(), k = ui.zoom;
      bar.style.left = Math.max(4, (hr.left - pr.left) / k) + "px"; bar.style.top = Math.max(2, (hr.top - pr.top) / k - 30) + "px";
      bar.addEventListener("mouseenter", () => window.clearTimeout(hovT)); bar.addEventListener("mouseleave", leaveBar); plan.append(bar);
    };
    if (cur) hovT = window.setTimeout(show, SWITCH_MS); else show();
  });
  el.zoom.addEventListener("mouseout", e => { if ((e.target as HTMLElement).closest("[data-hover],[data-sthover]")) leaveBar(); });

  // ───────── alça da etiqueta: arrastar na horizontal aumenta / diminui o bloco (desktop + touch) ─────────
  el.zoom.addEventListener("pointerdown", e => {   // vale para o plano único e para cada função da vista de arquivo
    const hd = (e.target as Element).closest<SVGElement>("[data-drag]"); if (!hd) return;
    const id = hd.dataset["drag"]!, p0 = P(), loc = locate(p0, id), svg = hd.closest("svg"), plan = hd.closest<HTMLElement>(".gplan") ?? el.plan; if (!loc || !svg) return;
    e.preventDefault(); e.stopPropagation();
    try { hd.setPointerCapture(e.pointerId); } catch { /* Safari antigo */ }
    const built = build(p0, loc.flow.id, ui), scene = built.scene, cw = built.w, gutter = planGutter(scene);
    const guide = host.ownerDocument.createElement("div"); guide.className = "guide"; plan.append(guide);
    const at = (ev: PointerEvent): number => {
      const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / ui.zoom;
      return countForStep(p0, scene, id, Math.floor((x - gutter - G.OX) / cw));
    };
    const place = (n: number): void => {
      const l = locate(p0, id)!;
      const items = [...(l.node.t === "fn" ? [] : l.node.kids), ...l.list.slice(l.index + 1)];
      const lastItem = items[n - 1], sp = lastItem ? scene.span.get(lastItem.id) : undefined;
      guide.style.left = gutter + G.OX + ((sp?.e ?? 0) + 1) * cw + "px";
    };
    let n = at(e); place(n);
    const move = (ev: PointerEvent): void => { if (ev.pointerId !== e.pointerId) return; n = at(ev); place(n); };
    const up = (ev: PointerEvent): void => {
      if (ev.pointerId !== e.pointerId) return;
      hd.removeEventListener("pointermove", move); hd.removeEventListener("pointerup", up); hd.removeEventListener("pointercancel", up);
      try { hd.releasePointerCapture(e.pointerId); } catch { /* já solto */ }
      guide.remove(); if (n !== kids(id)) run({ type: "setScope", id, count: n }, false);
    };
    hd.addEventListener("pointermove", move); hd.addEventListener("pointerup", up); hd.addEventListener("pointercancel", up);
  });

  // ───────── terminal: abrir/fechar (toggle no header) e arrastar a linha divisória ─────────
  const app = host.querySelector<HTMLElement>(".app")!, splitter = $("#splitter"), PREFS_KEY = "flow-novo-ui-v2";
  let prefs: Prefs = parsePrefs((() => { try { return localStorage.getItem(PREFS_KEY); } catch { return null; } })());
  if (SHOW_CODE) prefs.codeOpen = true;   // ?dev=true: painel aberto na aba TypeScript
  const total = (): number => app.clientWidth;
  const totalH = (): number => app.clientHeight;
  const TERM_MIN = 120, TERM_DEFAULT = 220;
  const clampTermH = (h: number): number => Math.round(Math.min(Math.max(Number.isFinite(h) ? h : TERM_DEFAULT, TERM_MIN), Math.max(TERM_MIN, totalH() * 0.55)));
  const applyPrefs = (save = true): void => {
    prefs.codeW = clampTermH(prefs.codeW); app.style.setProperty("--codew", prefs.codeW + "px"); app.classList.toggle("code-off", !prefs.codeOpen);
    if (!prefs.codeOpen && SHOW_CODE && tab === "ts") showTab("term");   // faixa minimizada: volta ao header do Terminal
    const tog = $("#codeToggle"); tog.setAttribute("aria-pressed", String(prefs.codeOpen)); tog.title = prefs.codeOpen ? "Hide the terminal (Ctrl+\\)" : "Show the terminal (Ctrl+\\)"; tog.setAttribute("aria-label", prefs.codeOpen ? "Hide terminal" : "Show terminal"); tog.classList.toggle("open", prefs.codeOpen);
    splitter.setAttribute("aria-valuenow", String(prefs.codeW)); splitter.setAttribute("aria-valuemin", String(TERM_MIN)); splitter.hidden = !prefs.codeOpen;
    if (save) try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* sem espaço: segue */ }
    window.requestAnimationFrame(() => { if (auto) fit(); });
  };
  // explorador: mesma mecânica do painel de código (abrir/fechar, arrastar, duplo clique, teclado), salvo à parte
  const EX_KEY = "flow-novo-explorer-v1", EX_MIN = 160, EX_DEFAULT = 232;
  const exPrefs = ((): { w: number; open: boolean } => { try { const o = JSON.parse(localStorage.getItem(EX_KEY) ?? "null") as { w?: unknown; open?: unknown } | null; return { w: typeof o?.w === "number" && Number.isFinite(o.w) ? o.w : EX_DEFAULT, open: typeof o?.open === "boolean" ? o.open : true }; } catch { return { w: EX_DEFAULT, open: true }; } })();
  const exSplitter = $("#exSplitter");
  const applyEx = (save = true): void => {
    exPrefs.w = Math.round(Math.min(Math.max(exPrefs.w, EX_MIN), Math.max(EX_MIN, total() * 0.4))); app.style.setProperty("--exw", exPrefs.w + "px"); app.classList.toggle("ex-off", !exPrefs.open);
    $("#exToggle").setAttribute("aria-pressed", String(exPrefs.open)); exSplitter.setAttribute("aria-valuenow", String(exPrefs.w)); exSplitter.setAttribute("aria-valuemin", String(EX_MIN)); exSplitter.hidden = !exPrefs.open;
    if (save) try { localStorage.setItem(EX_KEY, JSON.stringify(exPrefs)); } catch { /* sem espaço: segue */ }
    window.requestAnimationFrame(() => { if (auto) fit(); });
  };
  const toggleEx = (): void => { exPrefs.open = !exPrefs.open; applyEx(); };
  $("#exToggle").addEventListener("click", toggleEx);
  exSplitter.addEventListener("pointerdown", e => {
    if (e.button !== 0) return; e.preventDefault(); app.classList.add("resizing");
    const move = (ev: PointerEvent): void => { const r = app.getBoundingClientRect(); exPrefs.w = ev.clientX - r.left - 12 - 6; applyEx(false); };
    const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); app.classList.remove("resizing"); applyEx(); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
  exSplitter.addEventListener("dblclick", () => { exPrefs.w = EX_DEFAULT; applyEx(); });
  exSplitter.addEventListener("keydown", e => { const step = e.shiftKey ? 80 : 24; if (e.key === "ArrowLeft") exPrefs.w -= step; else if (e.key === "ArrowRight") exPrefs.w += step; else if (e.key === "Enter") toggleEx(); else return; e.preventDefault(); applyEx(); });
  host.ownerDocument.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggleEx(); } });
  const toggleCode = (): void => { prefs.codeOpen = !prefs.codeOpen; applyPrefs(); };
  $("#codeToggle").addEventListener("click", toggleCode);
  splitter.addEventListener("pointerdown", e => {
    if (e.button !== 0) return; e.preventDefault(); app.classList.add("resizing", "resizing-v");
    const move = (ev: PointerEvent): void => { const r = app.getBoundingClientRect(); prefs.codeW = r.bottom - 12 - ev.clientY; applyPrefs(false); };
    const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); app.classList.remove("resizing", "resizing-v"); applyPrefs(); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
  splitter.addEventListener("dblclick", () => { prefs.codeW = TERM_DEFAULT; applyPrefs(); });
  splitter.addEventListener("keydown", e => { const step = e.shiftKey ? 80 : 24; if (e.key === "ArrowUp") prefs.codeW += step; else if (e.key === "ArrowDown") prefs.codeW -= step; else if (e.key === "Enter") toggleCode(); else return; e.preventDefault(); applyPrefs(); });
  host.ownerDocument.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); toggleCode(); } });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => { if (auto && last) fit(); }).observe(el.scroll);
  window.addEventListener("resize", () => { applyPrefs(false); applyEx(false); }); applyPrefs(false); applyEx(false);

  // ───────── executar no navegador + terminal ─────────
  let running: Running | null = null; const tbody = $("#tbody"), tstat = $("#tstat");
  const addLine = (level: LogLevel, text: string, t?: number): void => {
    const d = host.ownerDocument.createElement("div"); d.className = `tline ${level}`;
    if (t !== undefined) { const ts = host.ownerDocument.createElement("span"); ts.className = "tt"; ts.textContent = `${Math.round(t)} ms`; d.append(ts); }
    const body = host.ownerDocument.createElement(level === "table" || text.includes("\n") ? "pre" : "span"); body.textContent = text; d.append(body); tbody.append(d);
    while (tbody.children.length > 2000) tbody.firstElementChild?.remove(); tbody.scrollTop = tbody.scrollHeight;
  };
  const setRunning = (on: boolean): void => {
    $("#exec").innerHTML = icon(on ? "square" : "play"); $("#exec").title = on ? "Stop the run (Ctrl+Enter)" : "Run this flow in the browser (Ctrl+Enter)"; $("#exec").setAttribute("aria-label", on ? "Stop" : "Run"); $("#exec").classList.toggle("on", on);
    const tRun = $("#tRun"); tRun.innerHTML = icon(on ? "square" : "play"); tRun.title = on ? "Stop (Ctrl+Enter)" : "Run (Ctrl+Enter)"; tRun.setAttribute("aria-label", on ? "Stop" : "Run"); tRun.classList.toggle("on", on);
    tstat.textContent = on ? "running…" : tstat.textContent; tstat.classList.toggle("busy", on);
  };
  const runFlow = (): void => {
    if (!canRun()) { toast("Select a function to run it"); return; }
    if (running) { running.stop(); return; }
    const flow = locate(P(), ui.flow)?.node; if (!flow || flow.t !== "fn") return; if (!prefs.codeOpen) { prefs.codeOpen = true; applyPrefs(); }   // o Terminal mora no painel de código: se ele está escondido, abre
    tbody.innerHTML = "";
    let code: string; try { code = generate(P(), ui.flow, { js: true }).code; } catch (e) { addLine("error", String(e)); return; }
    addLine("system", `▶ ${flow.title}`); setRunning(true);
    running = runInWorker(code, ev => {
      if (ev.type === "log") { addLine(ev.level, ev.text, ev.t); return; }
      running = null; setRunning(false);
      if (ev.type === "done") { addLine("system", `✓ finished in ${Math.round(ev.ms)} ms`); tstat.textContent = "done"; }
      else { addLine("error", ev.message); addLine("system", `✗ failed after ${Math.round(ev.ms)} ms`); tstat.textContent = "error"; }
    });
  };
  $("#exec").addEventListener("click", runFlow); $("#tRun").addEventListener("click", runFlow);
  $("#tClear").addEventListener("click", () => { tbody.innerHTML = ""; if (!running) tstat.textContent = "Terminal"; });
  host.ownerDocument.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runFlow(); } });

  // ───────── dicas rápidas dos botões (o title nativo demora ~1s; esta aparece em 50 ms, fora do zoom do canvas) ─────────
  const tip = host.ownerDocument.createElement("div"); tip.className = "tip"; tip.setAttribute("role", "tooltip"); host.ownerDocument.body.append(tip); let tipT = 0;
  const hideTip = (): void => { window.clearTimeout(tipT); tip.classList.remove("on"); };
  host.ownerDocument.addEventListener("mouseover", e => {
    const b = (e.target as HTMLElement).closest?.<HTMLElement>("button[title], [data-tip]"); if (!b) return;
    if (b.hasAttribute("title")) { b.dataset["tip"] = b.getAttribute("title")!; b.removeAttribute("title"); }   // sem a dica nativa, que demora
    const text = b.dataset["tip"]; if (!text) return; window.clearTimeout(tipT);
    tipT = window.setTimeout(() => {
      tip.textContent = text; tip.classList.add("on"); const r = b.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, r.left + r.width / 2 - w / 2)) + "px"; tip.style.top = (r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6) + "px";
    }, 50);
  });
  for (const t of ["mouseout", "mousedown", "wheel", "keydown"]) host.ownerDocument.addEventListener(t, hideTip, true);

  const off = store.subscribe(render);
  render();
  return { store, ui, render, reset, destroy: () => { running?.stop(); off(); tip.remove(); host.innerHTML = ""; } };
}

const STORE_KEY = "flow-novo-projeto-v1";
/** Abre o projeto salvo no navegador (se houver e for válido); senão, o exemplo. */
function startProject(): { project: Project; flow: string } {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const p = parseProject(raw); const rest = p.flows.filter(f => !(f.file === "samples.ts" && SAMPLE_TITLES.includes(f.title))); if (rest.length && rest.length < p.flows.length) p.flows = rest;   /* os samples já foram o padrão: saem do que ficou salvo */ return { project: p, flow: p.flows[0]!.id }; } } catch { /* salvo corrompido: volta ao exemplo */ }
  const s = sampleProject(); return { project: s.project, flow: s.main };
}
export function boot(): App {
  // ?demo=<id>: exemplo da documentação, incorporado (sem barra, Explorer nem código) e que nunca grava no navegador
  const demo = new URLSearchParams(location.search).get("demo"), ex = demo ? docExample(demo) : null;
  if (ex) document.documentElement.classList.add("embed");
  const s = ex ? { project: ex.project, flow: ex.flow } : startProject(), store = new Store(s.project), app = mount(document.getElementById("app")!, store, s.flow);
  if (ex) { if (new URLSearchParams(location.search).get("txt") === "0") { app.ui.txtIn = false; app.render(); } (window as unknown as { flowApp: App }).flowApp = app; return app; }
  const save = (): void => { try { localStorage.setItem(STORE_KEY, serialize(store.project)); } catch { /* sem espaço ou bloqueado: segue sem salvar */ } };
  store.subscribe(save);
  (window as unknown as { flowApp: App }).flowApp = app; return app;
}
if (typeof document !== "undefined" && document.getElementById("app")) boot();
