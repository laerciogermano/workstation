import { COMMAND_NAMES, FlowError, locate, Store, type Command, type Project } from "./model";
import { generate } from "./codegen";
import { icon } from "./icons";
import { countForStep } from "./scope";
import { build, colX, esc, G, planHeight, planWidth, tableWidth, toolsFor, toolsHtml, type Ui } from "./view";
import { sampleProject } from "./sample";

/** Casca de DOM fina: toda regra vive em model/layout/view/codegen (testados sem navegador). */
declare const mountTemas: ((el: HTMLElement) => void) | undefined;

const EXAMPLES: Record<string, (id: string) => Record<string, unknown>> = {
  newFlow: () => ({ title: "novo_fluxo" }), rename: id => ({ id, title: "novo_nome" }), addChild: id => ({ id }), addSibling: id => ({ id }), remove: id => ({ id }),
  wrap: id => ({ id, kind: "if", test: "condicao" }), unwrap: id => ({ id }), exitScope: id => ({ id }), setScope: id => ({ id, count: 2 }),
  setFor: id => ({ id, v: "item", coll: "itens" }), setIf: id => ({ id, test: "condicao", elseTo: null }),
  addInput: id => ({ id, name: "entrada" }), removeInput: id => ({ id, name: "entrada" }), addOutput: id => ({ id, name: "saida" }), removeOutput: id => ({ id, name: "saida" }),
  assign: id => ({ id, agent: "lia" }), setTask: id => ({ id, task: "get" }), setResp: id => ({ id, resp: "ana" }), setParallel: id => ({ id, on: true }),
};

export interface App { store: Store; ui: Ui & { flow: string; zoom: number }; render(): void; destroy(): void }

export function mount(host: HTMLElement, store: Store, flow: string): App {
  const ui: App["ui"] = { closed: new Set<string>(), sel: null, txtIn: false, flow, zoom: 1 };
  let tab: "ts" | "cmd" = "ts", hovT = 0, fitted = false, last: ReturnType<typeof build> | null = null, gen: ReturnType<typeof generate> | null = null;
  host.innerHTML = `
  <div class="app">
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <span class="fx-t">Flow</span><select id="flowSel" aria-label="Fluxo"></select>
        <button type="button" id="newFlow" class="btn">${icon("plus")}Nova função</button><span class="sp"></span>
        <button type="button" class="ib" id="undo" title="Desfazer (⌘Z)">${icon("undo")}</button><button type="button" class="ib" id="redo" title="Refazer (⇧⌘Z)">${icon("redo")}</button><i class="vsep"></i>
        <button type="button" class="ib" id="zout" title="Menos zoom (−)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Mais zoom (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Ajustar à tela (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Nome dentro da barra" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="expand" title="Abrir tudo">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Fechar tudo">${icon("collapse")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
      <div class="fx-hint">roda do mouse = zoom · arrastar o fundo = mover · + − 0</div>
      <div class="fx-legend" id="legend">
        <span><i class="lg fc"></i>função concreta (lib node:*)</span><span><i class="lg fa"></i>função abstrata (IA · state)</span><span><i class="lg da"></i>dado abstrato (state)</span><span><i class="lg dc"></i>dado concreto</span>
        <span><i class="lg dia"></i>seleção (if)</span><span><i class="lg lp">↻</i>repetição (for)</span><span><i class="lg tr"></i>try</span><span><i class="lg ca"></i>catch</span>
      </div>

    </section>
    <aside class="side">
      <div class="tabs" role="tablist"><button role="tab" data-tab="ts" aria-selected="true">TypeScript</button><button role="tab" data-tab="cmd" aria-selected="false">Chamar comando</button><span class="sp"></span><span class="meta" id="meta"></span></div>
      <section class="pane on" id="p-ts"><div class="fhead"><span class="tsb">TS</span><span id="fname">fluxo.ts</span><span class="selname" id="selname"></span><button type="button" id="copy">Copiar</button></div><div class="code" id="code" tabindex="0" aria-label="Código TypeScript gerado"></div></section>
      <section class="pane cmd" id="p-cmd"><label for="cmdSel">Comando</label><select id="cmdSel"></select><label for="payload">Payload (JSON)</label><textarea id="payload" spellcheck="false"></textarea>
        <div class="row"><button type="button" id="run" class="pri">Executar</button><button type="button" id="reset">Reiniciar</button></div><div id="res"></div></section>
    </aside>
  </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string): T => host.querySelector(s) as T;
  const el = { sel: $<HTMLSelectElement>("#flowSel"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), cmdSel: $<HTMLSelectElement>("#cmdSel"), payload: $<HTMLTextAreaElement>("#payload"), res: $("#res"), zv: $("#zv") };
  el.cmdSel.innerHTML = COMMAND_NAMES.map(c => `<option>${c}</option>`).join("");
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
    el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>Responsável</span><span>Task</span></div>${last.table}` : "";
    el.plan.innerHTML = last.plan;
    const tw0 = tableWidth(last.scene); el.table.style.width = tw0 + "px"; (el.table.style as CSSStyleDeclaration).setProperty("--tw", tw0 + "px");
    const W = tw0 + planWidth(last.scene), H = planHeight(last.scene);
    el.zoom.style.width = W + "px"; el.zoom.style.height = H + "px"; el.zoom.style.transform = `scale(${ui.zoom})`; el.sizer.style.width = W * ui.zoom + "px"; el.sizer.style.height = H * ui.zoom + "px"; el.zv.textContent = Math.round(ui.zoom * 100) + "%";
    el.sel.innerHTML = p.flows.map(f => `<option value="${f.id}"${f.id === ui.flow ? " selected" : ""}>${esc(f.title)}</option>`).join("");
    ($("#undo") as HTMLButtonElement).disabled = !store.canUndo; ($("#redo") as HTMLButtonElement).disabled = !store.canRedo;
    ($("#txtIn")).setAttribute("aria-pressed", String(ui.txtIn));
    if (!fitted) { fitted = true; fit(); }
    renderCode();
  }
  function renderCode(): void {
    const p = P(); gen = generate(p, ui.flow);
    const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel ? gen.map[ui.sel] : undefined;
    const hl = (l: string): string => esc(l).replace(/(\/\/.*$)|(&quot;[^&]*?&quot;)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g, (m, c, s, n, w, par) => c ? `<span class="tk-c">${c}</span>` : s ? `<span class="tk-s">${s}</span>` : n ? `<span class="tk-n">${n}</span>` : /^(?:const|let|await|async|import|from|export|type|return|if|else|for|of|try|catch|function|as)$/.test(w) ? `<span class="tk-k">${w}</span>${par ?? ""}` : /^(?:State|Promise|Record|unknown|Fn)$/.test(w) ? `<span class="tk-t">${w}</span>${par ?? ""}` : par ? `<span class="tk-f">${w}</span>(` : m);
    el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
    el.fname.textContent = gen.fileName; el.meta.textContent = `${lines.length} linhas`;
    const n = ui.sel ? locate(p, ui.sel)?.node : undefined; el.selname.textContent = n ? (n.t === "fn" ? n.title : n.t) : "";
  }
  const scrollToSel = (): void => { const r = ui.sel && gen?.map[ui.sel]; if (!r) return; const e = el.code.querySelector<HTMLElement>(`[data-n="${r[0]}"]`); if (e) el.code.scrollTo({ top: Math.max(0, e.offsetTop - 60), behavior: "smooth" }); };
  function fit(): void { if (!last) return; const W = tableWidth(last.scene) + planWidth(last.scene), k = Math.max(0.3, Math.min(1, (el.scroll.clientWidth - 8) / W)); ui.zoom = Math.round(k * 100) / 100; el.zoom.style.transform = `scale(${ui.zoom})`; el.sizer.style.width = W * ui.zoom + "px"; el.sizer.style.height = planHeight(last.scene) * ui.zoom + "px"; el.zv.textContent = Math.round(ui.zoom * 100) + "%"; }
  /** Zoom ancorado: o ponto sob (mx, my) (px da área rolável) continua no mesmo lugar. */
  const zoomTo = (k: number, mx = el.scroll.clientWidth / 2, my = el.scroll.clientHeight / 2): void => {
    const old = ui.zoom, next = Math.min(2.5, Math.max(0.2, Math.round(k * 100) / 100)); if (next === old) return;
    const cx = (el.scroll.scrollLeft + mx) / old, cy = (el.scroll.scrollTop + my) / old; ui.zoom = next; render();
    el.scroll.scrollLeft = cx * next - mx; el.scroll.scrollTop = cy * next - my;
  };
  // roda do mouse / pinça do trackpad = zoom no ponteiro; arrastar o fundo = mover; teclas + − 0
  el.scroll.addEventListener("wheel", e => { e.preventDefault(); const r = el.scroll.getBoundingClientRect(); zoomTo(ui.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  el.scroll.addEventListener("pointerdown", e => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-act],[data-hover],[data-drag],[data-sel],button,select,input,.ghost,.bar-tools,.fl-tools,.grow")) return;
    const x0 = e.clientX, y0 = e.clientY, sl = el.scroll.scrollLeft, st = el.scroll.scrollTop; let moved = false;
    const move = (ev: PointerEvent): void => { if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return; moved = true; el.scroll.classList.add("panning"); el.scroll.scrollLeft = sl - (ev.clientX - x0); el.scroll.scrollTop = st - (ev.clientY - y0); };
    const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); el.scroll.classList.remove("panning"); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  // ───────── ações (data-act) ─────────
  const kids = (id: string): number => { const n = locate(P(), id)?.node; return n && n.t !== "fn" ? n.kids.length : 0; };
  const ACT: Record<string, (d: DOMStringMap) => void | Promise<void>> = {
    toggle: d => { const id = d["id"]!; if (ui.closed.has(id)) (ui.closed as Set<string>).delete(id); else (ui.closed as Set<string>).add(id); render(); },
    addChild: d => void run({ type: "addChild", id: d["id"]!, ...(d["catch"] ? { catch: true } : {}) }),
    addSibling: d => void run({ type: "addSibling", id: d["id"]! }),
    wrap: d => void run({ type: "wrap", id: d["id"]!, kind: d["kind"]! }),
    unwrap: d => void run({ type: "unwrap", id: d["id"]! }, false),
    exitScope: d => void run({ type: "exitScope", id: d["id"]! }),
    parallel: d => void run({ type: "setParallel", id: d["id"]!, on: d["on"] === "true" }),
    setScope: d => void run({ type: "setScope", id: d["id"]!, count: kids(d["id"]!) + Number(d["delta"]) }, false),
    remove: async d => { const l = locate(P(), d["id"]!); if (l && l.node.kids.length && !(await confirmAsk(`Remover “${l.node.t === "fn" ? l.node.title : l.node.t}” e tudo dentro dela?`))) return; if (ui.sel === d["id"]) ui.sel = null; run({ type: "remove", id: d["id"]! }, false); },
    rename: async d => { const n = locate(P(), d["id"]!)?.node; if (!n || n.t !== "fn") return; ui.sel = n.id; const v = await ask("Novo nome da task:", n.title); if (v) run({ type: "rename", id: n.id, title: v }); else render(); },
    editBlock: async d => {
      const id = d["id"]!, n = locate(P(), id)?.node; if (!n) return;
      if (n.t === "for") { const v = await ask("Variável do for (cada item):", n.v); if (!v) return; const c = await ask("Coleção percorrida:", n.coll); if (c) run({ type: "setFor", id, v, coll: c }, false); }
      else if (n.t === "if") {
        const test = await ask("Condição do if (dado testado, ex.: estoque_ok):", n.test); if (!test) return;
        const names = locate(P(), id)!.flow.kids.length ? [] : [], fns: { id: string; title: string }[] = []; void names;
        const walkF = (list: readonly import("./model").Node[]): void => { for (const x of list) { if (x.t === "fn") fns.push({ id: x.id, title: x.title }); if (x.t === "try") { walkF(x.kids); walkF(x.catchKids); } else walkF(x.kids); } }; walkF(locate(P(), id)!.flow.kids);
        const cur = fns.find(f => f.id === n.elseTo)?.title ?? "";
        const to = await ask(`Senão, voltar para qual função? (${fns.map(f => f.title).join(", ")}) — vazio = nenhuma`, cur);
        run({ type: "setIf", id, test, elseTo: fns.find(f => f.title.toLowerCase() === (to ?? "").toLowerCase())?.id ?? null }, false);
      }
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
  $("#newFlow").addEventListener("click", () => void run({ type: "newFlow" }));
  $("#undo").addEventListener("click", () => store.undo()); $("#redo").addEventListener("click", () => store.redo());
  $("#zin").addEventListener("click", () => zoomTo(ui.zoom * 1.15)); $("#zout").addEventListener("click", () => zoomTo(ui.zoom / 1.15)); $("#fit").addEventListener("click", () => { fitted = false; render(); });
  $("#txtIn").addEventListener("click", () => { ui.txtIn = !ui.txtIn; render(); });
  $("#expand").addEventListener("click", () => { (ui.closed as Set<string>).clear(); render(); });
  $("#collapse").addEventListener("click", () => { const f = locate(P(), ui.flow)?.node; if (f?.t === "fn") f.kids.forEach(function mark(n): void { if (n.t === "fn" && n.kids.length) (ui.closed as Set<string>).add(n.id); }); render(); });
  host.querySelectorAll<HTMLElement>("[data-tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset["tab"] as "ts" | "cmd"; host.querySelectorAll("[data-tab]").forEach(x => x.setAttribute("aria-selected", String(x === b))); $("#p-ts").classList.toggle("on", tab === "ts"); $("#p-cmd").classList.toggle("on", tab === "cmd"); }));
  $("#copy").addEventListener("click", async () => { await navigator.clipboard?.writeText(gen?.code ?? "").catch(() => {}); $("#copy").textContent = "Copiado"; setTimeout(() => ($("#copy").textContent = "Copiar"), 1200); });
  const fillPayload = (): void => { const ex = EXAMPLES[el.cmdSel.value]; el.payload.value = JSON.stringify(ex ? ex(ui.sel ?? ui.flow) : {}, null, 2); };
  el.cmdSel.addEventListener("change", fillPayload); fillPayload();
  $("#run").addEventListener("click", () => {
    try { const id = store.dispatch({ type: el.cmdSel.value as Command["type"], ...JSON.parse(el.payload.value || "{}") }); el.res.innerHTML = `<span class="ok">ok</span><pre class="res">${esc(JSON.stringify({ created: id ?? null }, null, 2))}</pre>`; }
    catch (err) { el.res.innerHTML = `<span class="er">erro</span><pre class="res">${esc(err instanceof Error ? err.message : String(err))}</pre>`; }
  });
  $("#reset").addEventListener("click", () => { const s = sampleProject(); store.project = s.project; ui.flow = s.main; ui.sel = null; (ui.closed as Set<string>).clear(); fitted = false; render(); });
  host.ownerDocument.addEventListener("keydown", e => {
    const tg = e.target as HTMLElement; if (/input|textarea|select/i.test(tg.tagName)) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey) { if (e.key === "+" || e.key === "=") { zoomTo(ui.zoom * 1.15); return; } if (e.key === "-") { zoomTo(ui.zoom / 1.15); return; } if (e.key === "0") { fitted = false; render(); return; } }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
  });

  // ───────── barra de ferramentas ao passar o mouse nas barras e etiquetas do plano ─────────
  const leaveBar = (): void => { window.clearTimeout(hovT); hovT = window.setTimeout(() => el.plan.querySelector(".bar-tools")?.remove(), 450); };
  el.plan.addEventListener("mouseover", e => {
    const h = (e.target as HTMLElement).closest<SVGElement>("[data-hover]"); if (!h) return;
    window.clearTimeout(hovT); const id = h.dataset["hover"]!, part = (h.dataset["part"] as "main" | "catch" | undefined) ?? "main", key = id + part;
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
    const at = (ev: PointerEvent): number => { const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / ui.zoom; return countForStep(p0, last!.scene, id, Math.floor((x - G.OX) / G.W)); };
    const place = (n: number): void => { const l = locate(p0, id)!, items = [...(l.node as { kids: { id: string }[] }).kids, ...l.list.slice(l.index + 1)], last2 = items[n - 1], sp = last2 ? last!.scene.span.get(last2.id) : undefined; guide.style.left = colX((sp?.e ?? 0) + 1) + "px"; };
    let n = at(e); place(n);
    const move = (ev: PointerEvent): void => { n = at(ev); place(n); };
    const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); guide.remove(); const cur = kids(id); if (n !== cur) run({ type: "setScope", id, count: n }, false); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  const off = store.subscribe(render);
  render();
  return { store, ui, render, destroy: () => { off(); host.innerHTML = ""; } };
}

export function boot(): App {
  const s = sampleProject(), app = mount(document.getElementById("app")!, new Store(s.project), s.main);
  (window as unknown as { flowApp: App }).flowApp = app; return app;
}
if (typeof document !== "undefined" && document.getElementById("app")) boot();
