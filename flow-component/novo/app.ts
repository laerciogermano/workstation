import { COMMAND_NAMES, FlowError, locate, parseProject, serialize, Store, type Command, type Project } from "./model";
import { generate } from "./codegen";
import { icon } from "./icons";
import { countForStep } from "./scope";
import { build, esc, G, planHeight, planWidth, tableWidth, toolsFor, toolsHtml, type Ui } from "./view";
import { sampleProject } from "./sample";

/** Casca de DOM fina: toda regra vive em model/layout/view/codegen (testados sem navegador). */
declare const mountTemas: ((el: HTMLElement) => void) | undefined;

const EXAMPLES: Record<string, (id: string) => Record<string, unknown>> = {
  newFlow: () => ({ title: "novo_fluxo" }), rename: id => ({ id, title: "novo_nome" }), addChild: id => ({ id }), addSibling: id => ({ id }), remove: id => ({ id }),
  wrap: id => ({ id, kind: "if", test: "condicao" }), unwrap: id => ({ id }), exitScope: id => ({ id }), setScope: id => ({ id, count: 2 }),
  setFor: id => ({ id, v: "item", coll: "itens" }), setIf: id => ({ id, test: "condicao" }), addElse: id => ({ id }), removeElse: id => ({ id }),
  addInput: id => ({ id, name: "entrada" }), removeInput: id => ({ id, name: "entrada" }), addOutput: id => ({ id, name: "saida" }), removeOutput: id => ({ id, name: "saida" }),
  assign: id => ({ id, agent: "lia" }), setTask: id => ({ id, task: "get" }), setResp: id => ({ id, resp: "ana" }), setParallel: id => ({ id, on: true }),
};

export interface App { store: Store; ui: Ui & { flow: string; zoom: number; pan: { x: number; y: number } }; render(): void; destroy(): void }

export function mount(host: HTMLElement, store: Store, flow: string): App {
  const ui: App["ui"] = { closed: new Set<string>(), sel: null, txtIn: true, flow, zoom: 1, pan: { x: 8, y: 8 } };
  let tab: "ts" | "cmd" = "ts", hovT = 0, fitted = false, auto = true, exec = false, last: ReturnType<typeof build> | null = null, gen: ReturnType<typeof generate> | null = null;
  const histBtns = `<button type="button" class="ib hist-btn" data-hist="undo" title="Desfazer (Ctrl+Z)" aria-label="Desfazer">${icon("undo")}</button><button type="button" class="ib hist-btn" data-hist="redo" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer">${icon("redo")}</button>`;
  host.innerHTML = `
  <div class="app">
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <span class="fx-t">Flow</span><select id="flowSel" aria-label="Fluxo"></select>
        <button type="button" id="newFlow" class="btn">${icon("plus")}Nova função</button><button type="button" class="ib danger" id="delFlow" title="Excluir este fluxo" aria-label="Excluir este fluxo">${icon("trash")}</button><span class="sp"></span><span class="hist-inline">${histBtns}</span><i class="vsep"></i>
                <button type="button" class="ib" id="zout" title="Menos zoom (−)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Mais zoom (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Ajustar à tela (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Nome dentro da barra" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="expand" title="Abrir tudo">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Fechar tudo">${icon("collapse")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
      <div class="fx-hint">roda do mouse = zoom · arrastar o fundo = mover · + − 0</div>
      <div class="fx-legend" id="legend">
        <span><i class="lg fc"></i>função concreta (lib node:*)</span><span><i class="lg fa"></i>função abstrata (IA · state)</span><span><i class="lg da"></i>dado abstrato (state)</span><span><i class="lg dc"></i>dado concreto</span><span><i class="lg cb"></i>cubo (mais de um dado)</span>
        <span><i class="lg dia"></i>seleção (if)</span><span><i class="lg lp">↻</i>repetição (for)</span><span><i class="lg tr"></i>try</span><span><i class="lg ca"></i>catch</span><span><i class="lg el"></i>else</span>
      </div>

    </section>
    <aside class="side">
      <div class="tabs" role="tablist"><button role="tab" data-tab="ts" aria-selected="true">TypeScript</button><button role="tab" data-tab="cmd" aria-selected="false">Chamar comando</button><span class="sp"></span><span class="meta" id="meta"></span></div>
      <section class="pane on" id="p-ts"><div class="fhead"><span class="tsb">TS</span><span id="fname">fluxo.ts</span><span class="selname" id="selname"></span><span class="seg" role="group" aria-label="Versão do código"><button type="button" data-view="mod" aria-pressed="true" title="Módulo: exporta a função do fluxo">módulo</button><button type="button" data-view="run" aria-pressed="false" title="Executável: roda direto no Node">executável</button></span><button type="button" id="dl" title="Baixar o arquivo">Baixar</button><button type="button" id="copy">Copiar</button></div><div class="runhint" id="runhint" hidden><code id="runcmd"></code><button type="button" id="cmdcopy">Copiar comando</button></div><div class="code" id="code" tabindex="0" aria-label="Código TypeScript gerado"></div></section>
      <section class="pane cmd" id="p-cmd"><label for="cmdSel">Comando</label><select id="cmdSel"></select><label for="payload">Payload (JSON)</label><textarea id="payload" spellcheck="false"></textarea>
        <div class="row"><button type="button" id="run" class="pri">Executar</button><button type="button" id="reset">Reiniciar</button></div><div id="res"></div></section>
    </aside>
  </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string): T => host.querySelector(s) as T;
  const el = { sel: $<HTMLSelectElement>("#flowSel"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), cmdSel: $<HTMLSelectElement>("#cmdSel"), payload: $<HTMLTextAreaElement>("#payload"), res: $("#res"), zv: $("#zv") };
  el.cmdSel.innerHTML = COMMAND_NAMES.map(c => `<option>${c}</option>`).join("");
  // desfazer / refazer: no cabeçalho da página e ao lado das opções do cabeçalho do Flow (nunca nas dicas dos componentes)
  const hist = host.ownerDocument.createElement("div"); hist.id = "hist"; hist.className = "hist"; hist.setAttribute("role", "toolbar"); hist.setAttribute("aria-label", "Histórico"); hist.innerHTML = histBtns;
  const proj = host.ownerDocument.createElement("div"); proj.id = "proj"; proj.className = "proj"; proj.setAttribute("role", "toolbar"); proj.setAttribute("aria-label", "Projeto");
  proj.innerHTML = `<button type="button" class="btn sm" id="agents" title="Cadastrar libs, pessoas e agentes de IA">${icon("users")}Responsáveis</button><button type="button" class="btn sm" id="open" title="Abrir um projeto salvo (.json)">${icon("upload")}Abrir</button><button type="button" class="btn sm" id="save" title="Salvar o projeto (.json)">${icon("download")}Salvar</button><input type="file" id="openFile" accept=".json,application/json" hidden>`;
  host.ownerDocument.querySelector(".topbar")?.append(proj, hist);
  const themes = host.ownerDocument.createElement("div"); themes.id = "temas"; host.ownerDocument.querySelector(".topbar")?.append(themes); if (typeof mountTemas === "function") mountTemas(themes);

  // ───────── diálogos e avisos dentro da própria vista (prompt() do navegador pode ser bloqueado) ─────────
  const modal = <T,>(label: string, fill: (form: HTMLFormElement, done: (v: T) => void) => void): Promise<T> => new Promise(res => {
    host.querySelector(".dlg")?.remove();
    const dlg = host.ownerDocument.createElement("div"); dlg.className = "dlg"; dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-label", label);
    const form = host.ownerDocument.createElement("form"); dlg.append(form);
    const done = (v: T): void => { dlg.remove(); res(v); };
    fill(form, done); dlg.addEventListener("mousedown", e => { if (e.target === dlg) done(null as T); }); host.append(dlg);
    (form.querySelector("input") as HTMLInputElement | null)?.focus();
  });
  const ask = (label: string, value = ""): Promise<string | null> => modal<string | null>(label, (form, done) => {
    form.innerHTML = `<label>${esc(label)}</label><input type="text" value="${esc(value)}" spellcheck="false" aria-label="${esc(label)}"><div class="row"><button type="button" data-no>Cancelar</button><button type="submit" class="pri">OK</button></div>`;
    const input = form.querySelector("input") as HTMLInputElement; input.select();
    form.addEventListener("submit", e => { e.preventDefault(); done(input.value.trim() || null); });
    form.querySelector("[data-no]")!.addEventListener("click", () => done(null)); form.addEventListener("keydown", e => { if (e.key === "Escape") done(null); });
  });
  const confirmAsk = (label: string): Promise<boolean> => modal<boolean>(label, (form, done) => {
    form.innerHTML = `<label>${esc(label)}</label><div class="row"><button type="button" data-no>Cancelar</button><button type="submit" class="pri danger">Remover</button></div>`;
    form.addEventListener("submit", e => { e.preventDefault(); done(true); }); form.querySelector("[data-no]")!.addEventListener("click", () => done(false));
  }).then(v => !!v);
  let toastT = 0;
  const toast = (msg: string): void => { host.querySelector(".toast")?.remove(); const t = host.ownerDocument.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; host.append(t); window.clearTimeout(toastT); toastT = window.setTimeout(() => t.remove(), 3200); };

  // ───────── comandos ─────────
  const run = (cmd: Command, select = true): string | undefined => {
    try { const id = store.dispatch(cmd); if (select && id && cmd.type !== "newFlow") ui.sel = id; if (cmd.type === "newFlow" && id) { ui.flow = id; fitted = false; } return id; }
    catch (e) { toast(e instanceof FlowError ? e.message : String(e)); return undefined; }
  };
  const P = (): Project => store.project;

  // ───────── desenho ─────────
  function render(): void {
    const p = P(); if (!locate(p, ui.flow)) ui.flow = p.flows[0]?.id ?? ui.flow;
    last = build(p, ui.flow, ui);
    el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>source</span><span>function</span></div>${last.table}` : "";
    el.plan.innerHTML = last.plan;
    const tw0 = tableWidth(last.scene); el.table.style.width = tw0 + "px"; (el.table.style as CSSStyleDeclaration).setProperty("--tw", tw0 + "px");
    const W = tw0 + planWidth(last.scene, last.w), H = planHeight(last.scene);
    el.zoom.style.width = W + "px"; el.zoom.style.height = H + "px"; applyView();
    el.sel.innerHTML = p.flows.map(f => `<option value="${f.id}"${f.id === ui.flow ? " selected" : ""}>${esc(f.title)}</option>`).join("");
    host.ownerDocument.querySelectorAll<HTMLButtonElement>(".hist-btn").forEach(b => { b.disabled = b.dataset["hist"] === "undo" ? !store.canUndo : !store.canRedo; });
    ($("#txtIn")).setAttribute("aria-pressed", String(ui.txtIn));
    if (!fitted || auto) { fitted = true; fit(); }
    renderCode();
  }
  function renderCode(): void {
    const p = P(); gen = generate(p, ui.flow, { runnable: exec });
    const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel ? gen.map[ui.sel] : undefined;
    const hl = (l: string): string => esc(l).replace(/(\/\/.*$)|(&quot;[^&]*?&quot;)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g, (m, c, s, n, w, par) => c ? `<span class="tk-c">${c}</span>` : s ? `<span class="tk-s">${s}</span>` : n ? `<span class="tk-n">${n}</span>` : /^(?:const|let|await|async|import|from|export|type|return|if|else|for|of|try|catch|function|as)$/.test(w) ? `<span class="tk-k">${w}</span>${par ?? ""}` : /^(?:State|Promise|Record|unknown|Fn)$/.test(w) ? `<span class="tk-t">${w}</span>${par ?? ""}` : par ? `<span class="tk-f">${w}</span>(` : m);
    el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
    el.fname.textContent = exec ? gen.runFile : gen.fileName; $("#runhint").hidden = !exec; $("#runcmd").textContent = gen.runCommand; el.meta.textContent = `${lines.length} linhas`;
    const n = ui.sel ? locate(p, ui.sel)?.node : undefined; el.selname.textContent = n ? (n.t === "fn" ? n.title : n.t) : "";
  }
  const scrollToSel = (): void => { const r = ui.sel && gen?.map[ui.sel]; if (!r) return; const e = el.code.querySelector<HTMLElement>(`[data-n="${r[0]}"]`); if (e) el.code.scrollTo({ top: Math.max(0, e.offsetTop - 60), behavior: "smooth" }); };
  /** Posição e escala da vista (a "câmera"): arrastar o fundo mexe no pan, a roda mexe no zoom. */
  function applyView(): void { el.zoom.style.transform = `translate(${ui.pan.x}px, ${ui.pan.y}px) scale(${ui.zoom})`; el.zv.textContent = Math.round(ui.zoom * 100) + "%"; }
  function fit(): void {
    if (!last) return; const W = tableWidth(last.scene) + planWidth(last.scene, last.w), H = planHeight(last.scene), cw = el.scroll.clientWidth, ch = el.scroll.clientHeight;
    const k = Math.max(0.2, Math.min(1, (cw - 16) / W, (ch - 16) / H)); ui.zoom = Math.round(k * 100) / 100; ui.pan = { x: Math.max(8, (cw - W * ui.zoom) / 2), y: 8 }; applyView();
  }
  /** Zoom ancorado: o ponto sob (mx, my) (px da área da vista) continua no mesmo lugar. */
  const zoomTo = (k: number, mx = el.scroll.clientWidth / 2, my = el.scroll.clientHeight / 2): void => {
    const old = ui.zoom, next = Math.min(2.5, Math.max(0.2, Math.round(k * 100) / 100)); if (next === old) return;
    auto = false; ui.pan = { x: mx - (mx - ui.pan.x) * (next / old), y: my - (my - ui.pan.y) * (next / old) }; ui.zoom = next; applyView();
  };
  // roda do mouse / pinça do trackpad = zoom no ponteiro; arrastar o fundo = mover; teclas + − 0
  el.scroll.addEventListener("wheel", e => { e.preventDefault(); const r = el.scroll.getBoundingClientRect(); zoomTo(ui.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  el.scroll.addEventListener("mousedown", e => { if (e.button === 1) e.preventDefault(); });   // sem o autoscroll do botão do meio
  el.scroll.addEventListener("pointerdown", e => {
    // botão esquerdo no fundo ou botão do meio em qualquer lugar (inclusive sobre barras e linhas)
    const middle = e.button === 1;
    if (!middle && (e.button !== 0 || (e.target as HTMLElement).closest("[data-act],[data-hover],[data-drag],button,select,input,.ghost,.bar-tools,.fl-tools"))) return;
    if (middle) e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY, p0 = { ...ui.pan }; let moved = false;
    const move = (ev: PointerEvent): void => { if (!moved && !middle && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return; moved = true; auto = false; el.scroll.classList.add("panning"); ui.pan = { x: p0.x + ev.clientX - x0, y: p0.y + ev.clientY - y0 }; applyView(); };
    const up = (): void => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); el.scroll.classList.remove("panning");
      if (moved) { const stop = (ev: Event): void => ev.stopPropagation(); window.addEventListener("click", stop, { capture: true, once: true }); window.setTimeout(() => window.removeEventListener("click", stop, true), 0); }   // arrastar não seleciona
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  // ───────── cadastro de responsáveis ─────────
  const KIND_NAME = { maquina: "Lib do Node", pessoa: "Pessoa", ia: "Agente de IA" } as const;
  const agentsDialog = (): Promise<void> => modal<void>("Responsáveis", (form, done) => {
    const draw = (): void => {
      form.classList.add("wide");
      form.innerHTML = `<label>Responsáveis do projeto</label><div class="agl">${P().agents.map(a => `<div class="agr"><span class="fav ${a.kind}">${icon(a.kind === "maquina" ? "package" : a.kind === "pessoa" ? "user" : "ia")}</span><b>${esc(a.name)}</b><span class="k">${KIND_NAME[a.kind]}${a.tasks.length ? ` · ${esc(a.tasks.join(", "))}` : ""}</span><button type="button" class="ib danger" data-rm-agent="${esc(a.id)}" title="Remover ${esc(a.name)}" aria-label="Remover ${esc(a.name)}">${icon("trash")}</button></div>`).join("")}</div>
        <div class="agadd"><select name="kind" aria-label="Tipo"><option value="maquina">Lib do Node</option><option value="pessoa">Pessoa</option><option value="ia">Agente de IA</option></select><input name="name" placeholder="nome (ex.: node:zlib, Maria, Redator)" aria-label="Nome" spellcheck="false"><input name="tasks" placeholder="funções da lib (ex.: gzip, gunzip)" aria-label="Funções da lib" spellcheck="false"><button type="submit" class="pri">Adicionar</button></div>
        <div class="row"><button type="button" data-no>Fechar</button></div>`;
      form.querySelector("[data-no]")!.addEventListener("click", () => done());
      form.querySelectorAll<HTMLElement>("[data-rm-agent]").forEach(b => b.addEventListener("click", () => { run({ type: "removeAgent", id: b.dataset["rmAgent"]! }, false); draw(); }));
      const kind = form.elements.namedItem("kind") as HTMLSelectElement, tasks = form.elements.namedItem("tasks") as HTMLInputElement; const sync = (): void => { tasks.hidden = kind.value !== "maquina"; }; kind.addEventListener("change", sync); sync();
      (form.elements.namedItem("name") as HTMLInputElement).focus();
    };
    form.addEventListener("submit", e => { e.preventDefault(); const f = new FormData(form); if (run({ type: "addAgent", kind: String(f.get("kind")), name: String(f.get("name") ?? ""), tasks: String(f.get("tasks") ?? "") }, false)) draw(); });
    form.addEventListener("keydown", e => { if (e.key === "Escape") done(); }); draw();
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
    remove: async d => { const l = locate(P(), d["id"]!); if (l && l.node.kids.length && !(await confirmAsk(`Remover “${l.node.t === "fn" ? l.node.title : l.node.t}” e tudo dentro dela?`))) return; if (ui.sel === d["id"]) ui.sel = null; run({ type: "remove", id: d["id"]! }, false); },
    rename: async d => { const n = locate(P(), d["id"]!)?.node; if (!n || n.t !== "fn") return; ui.sel = n.id; const v = await ask("Novo nome da função:", n.title); if (v) run({ type: "rename", id: n.id, title: v }); else render(); },
    editBlock: async d => {
      const id = d["id"]!, n = locate(P(), id)?.node; if (!n) return;
      if (n.t === "for") { const v = await ask("Variável do for (cada item):", n.v); if (!v) return; const c = await ask("Coleção percorrida:", n.coll); if (c) run({ type: "setFor", id, v, coll: c }, false); }
      else if (n.t === "if") { const test = await ask("Condição do if (dado testado, ex.: estoque_ok):", n.test); if (test) run({ type: "setIf", id, test }, false); }
    },
    addIo: async d => { const v = await ask(d["kind"] === "in" ? "Nome da nova entrada:" : "Nome da nova saída:"); if (v) run({ type: d["kind"] === "in" ? "addInput" : "addOutput", id: d["id"]!, name: v }, false); },
    rmIo: d => void run({ type: d["kind"] === "in" ? "removeInput" : "removeOutput", id: d["id"]!, name: d["name"]! }, false),
  };

  host.addEventListener("click", e => {
    const t = e.target as HTMLElement;
    if (t.closest(".dlg, select")) return;
    const a = t.closest<HTMLElement>("[data-act]");
    if (a?.dataset["act"] && ACT[a.dataset["act"]]) { e.stopPropagation(); void ACT[a.dataset["act"]]!(a.dataset); return; }
    const row = t.closest<HTMLElement>(".grow[data-id], [data-sel]");
    if (row) { ui.sel = row.dataset["id"] ?? row.dataset["sel"] ?? null; render(); scrollToSel(); }
  });
  host.addEventListener("change", e => {
    const s = e.target as HTMLSelectElement, c = s.dataset["change"], id = s.dataset["id"]; if (!c || !id) return;
    if (c === "assign") run({ type: "assign", id, agent: s.value || null }, false);
    else if (c === "setResp") run({ type: "setResp", id, resp: s.value || null }, false);
    else if (c === "setTask") run({ type: "setTask", id, task: s.value }, false);
  });
  el.sel.addEventListener("change", () => { ui.flow = el.sel.value; ui.sel = null; fitted = false; render(); });
  $("#delFlow").addEventListener("click", async () => { const f = locate(P(), ui.flow)?.node; if (!f || f.t !== "fn") return; if (!(await confirmAsk(`Excluir o fluxo “${f.title}” e tudo dentro dele?`))) return; run({ type: "removeFlow", id: f.id }, false); });
  proj.querySelector("#save")!.addEventListener("click", () => { const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([serialize(P())], { type: "application/json" })); a.href = url; a.download = "projeto-flow.json"; host.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); });
  const fileIn = host.ownerDocument.getElementById("openFile") as HTMLInputElement; proj.querySelector("#open")!.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files?.[0]; fileIn.value = ""; if (!f) return;
    try { const p = parseProject(await f.text()); store.load(p); ui.flow = p.flows[0]!.id; ui.sel = null; (ui.closed as Set<string>).clear(); auto = true; toast(`Projeto “${p.name}” aberto`); } catch (e) { toast(e instanceof FlowError ? e.message : String(e)); }
  });
  proj.querySelector("#agents")!.addEventListener("click", () => void agentsDialog());
  $("#newFlow").addEventListener("click", () => void run({ type: "newFlow" }));
  host.ownerDocument.addEventListener("click", e => { const b = (e.target as HTMLElement).closest<HTMLElement>(".hist-btn"); if (b) { if (b.dataset["hist"] === "undo") store.undo(); else store.redo(); } });
  $("#zin").addEventListener("click", () => zoomTo(ui.zoom * 1.15)); $("#zout").addEventListener("click", () => zoomTo(ui.zoom / 1.15)); $("#fit").addEventListener("click", () => { auto = true; render(); });
  $("#txtIn").addEventListener("click", () => { ui.txtIn = !ui.txtIn; render(); });
  $("#expand").addEventListener("click", () => { (ui.closed as Set<string>).clear(); render(); });
  $("#collapse").addEventListener("click", () => { const f = locate(P(), ui.flow)?.node; if (f?.t === "fn") f.kids.forEach(function mark(n): void { if (n.t === "fn" && n.kids.length) (ui.closed as Set<string>).add(n.id); }); render(); });
  host.querySelectorAll<HTMLElement>("[data-tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset["tab"] as "ts" | "cmd"; host.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", String(x === b))); $("#p-ts").classList.toggle("on", tab === "ts"); $("#p-cmd").classList.toggle("on", tab === "cmd"); }));
  host.querySelectorAll<HTMLElement>("[data-view]").forEach(b => b.addEventListener("click", () => { exec = b.dataset["view"] === "run"; host.querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderCode(); }));
  $("#dl").addEventListener("click", () => { if (!gen) return; const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([gen.code], { type: "text/plain" })); a.href = url; a.download = exec ? gen.runFile : gen.fileName; host.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); });
  $("#cmdcopy").addEventListener("click", async () => { await navigator.clipboard?.writeText(gen?.runCommand ?? "").catch(() => {}); $("#cmdcopy").textContent = "Copiado"; setTimeout(() => ($("#cmdcopy").textContent = "Copiar comando"), 1200); });
  $("#copy").addEventListener("click", async () => { await navigator.clipboard?.writeText(gen?.code ?? "").catch(() => {}); $("#copy").textContent = "Copiado"; setTimeout(() => ($("#copy").textContent = "Copiar"), 1200); });
  const fillPayload = (): void => { const ex = EXAMPLES[el.cmdSel.value]; el.payload.value = JSON.stringify(ex ? ex(ui.sel ?? ui.flow) : {}, null, 2); };
  el.cmdSel.addEventListener("change", fillPayload); fillPayload();
  $("#run").addEventListener("click", () => {
    try { const id = store.dispatch({ type: el.cmdSel.value as Command["type"], ...JSON.parse(el.payload.value || "{}") }); el.res.innerHTML = `<span class="ok">ok</span><pre class="res">${esc(JSON.stringify({ created: id ?? null }, null, 2))}</pre>`; }
    catch (err) { el.res.innerHTML = `<span class="er">erro</span><pre class="res">${esc(err instanceof Error ? err.message : String(err))}</pre>`; }
  });
  $("#reset").addEventListener("click", () => { const s = sampleProject(); store.load(s.project); ui.flow = s.main; ui.sel = null; (ui.closed as Set<string>).clear(); auto = true; });
  host.ownerDocument.addEventListener("keydown", e => {
    const tg = e.target as HTMLElement; if (/input|textarea|select/i.test(tg.tagName)) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey) { if (e.key === "+" || e.key === "=") { zoomTo(ui.zoom * 1.15); return; } if (e.key === "-") { zoomTo(ui.zoom / 1.15); return; } if (e.key === "0") { auto = true; render(); return; } }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
  });

  // ───────── barra de ferramentas ao passar o mouse nas barras e etiquetas do plano ─────────
  const leaveBar = (): void => { window.clearTimeout(hovT); hovT = window.setTimeout(() => el.plan.querySelector(".bar-tools")?.remove(), 450); };
  el.plan.addEventListener("mouseover", e => {
    const h = (e.target as HTMLElement).closest<SVGElement>("[data-hover]"); if (!h) return;
    window.clearTimeout(hovT); const id = h.dataset["hover"]!, part = (h.dataset["part"] as "main" | "catch" | "else" | undefined) ?? "main", key = id + part;
    const cur = el.plan.querySelector<HTMLElement>(".bar-tools"); if (cur?.dataset["key"] === key) return;
    const show = (): void => {
      el.plan.querySelector(".bar-tools")?.remove(); const bar = host.ownerDocument.createElement("div"); bar.className = "bar-tools"; bar.dataset["key"] = key; bar.setAttribute("role", "toolbar");
      bar.innerHTML = toolsHtml(toolsFor(P(), id, part)); const hr = h.getBoundingClientRect(), pr = el.plan.getBoundingClientRect(), k = ui.zoom;
      bar.style.left = Math.max(4, (hr.left - pr.left) / k) + "px"; bar.style.top = Math.max(2, (hr.top - pr.top) / k - 30) + "px";
      bar.addEventListener("mouseenter", () => window.clearTimeout(hovT)); bar.addEventListener("mouseleave", leaveBar); el.plan.append(bar);
    };
    if (cur) hovT = window.setTimeout(show, 350); else show();
  });
  el.plan.addEventListener("mouseout", e => { if ((e.target as HTMLElement).closest("[data-hover]")) leaveBar(); });

  // ───────── alça da etiqueta: arrastar aumenta / diminui o bloco ─────────
  el.plan.addEventListener("pointerdown", e => {
    const hd = (e.target as HTMLElement).closest<SVGElement>("[data-drag]"); if (!hd || !last) return;
    e.preventDefault(); e.stopPropagation(); const id = hd.dataset["drag"]!, svg = el.plan.querySelector("svg")!, p0 = P();
    const guide = host.ownerDocument.createElement("div"); guide.className = "guide"; el.plan.append(guide);
    const at = (ev: PointerEvent): number => { const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / ui.zoom; return countForStep(p0, last!.scene, id, Math.floor((x - G.OX) / last!.w)); };
    const place = (n: number): void => { const l = locate(p0, id)!, items = [...(l.node as { kids: { id: string }[] }).kids, ...l.list.slice(l.index + 1)], last2 = items[n - 1], sp = last2 ? last!.scene.span.get(last2.id) : undefined; guide.style.left = G.OX + ((sp?.e ?? 0) + 1) * last!.w + "px"; };
    let n = at(e); place(n);
    const move = (ev: PointerEvent): void => { n = at(ev); place(n); };
    const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); guide.remove(); const cur = kids(id); if (n !== cur) run({ type: "setScope", id, count: n }, false); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  const off = store.subscribe(render);
  render();
  return { store, ui, render, destroy: () => { off(); hist.remove(); host.innerHTML = ""; } };
}

const STORE_KEY = "flow-novo-projeto-v1";
/** Abre o projeto salvo no navegador (se houver e for válido); senão, o exemplo. */
function startProject(): { project: Project; flow: string } {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const p = parseProject(raw); return { project: p, flow: p.flows[0]!.id }; } } catch { /* salvo corrompido: volta ao exemplo */ }
  const s = sampleProject(); return { project: s.project, flow: s.main };
}
export function boot(): App {
  const s = startProject(), store = new Store(s.project), app = mount(document.getElementById("app")!, store, s.flow);
  const save = (): void => { try { localStorage.setItem(STORE_KEY, serialize(store.project)); } catch { /* sem espaço ou bloqueado: segue sem salvar */ } };
  store.subscribe(save);
  (window as unknown as { flowApp: App }).flowApp = app; return app;
}
if (typeof document !== "undefined" && document.getElementById("app")) boot();
