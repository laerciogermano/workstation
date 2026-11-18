import { useEffect, useRef, type ReactNode } from "react";
import { DTYPE_N, TYPE_INFO, type ElementDto } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { Face, FnIcon, Mark, ST } from "../../ui/parts";
import { useIde } from "../ide/ide";

const SECS = ["funcoes", "dados", "arquivos", "pessoas", "agentes", "modelos"] as const;
type Sec = (typeof SECS)[number];

export function Explorer() {
  const ide = useIde();
  const { m, s, set, patch, toggleOpen } = ide;
  const q = (s.q ?? "").trim().toLowerCase();
  let hits = 0;
  let show: Set<string> | null = null;
  if (q) {
    show = new Set();
    m.els.filter(u => !u.archived && u.title.toLowerCase().includes(q)).forEach(u => { hits++; show!.add(u.id); let p = u.parentId; while (p) { show!.add(p); p = m.u(p)?.parentId ?? null; } });
  }
  const secOpen = (k: Sec) => !!q || !s.secClosed.has(k);
  const tog = (k: Sec) => patch(u => { const c = new Set(u.secClosed); c.has(k) ? c.delete(k) : c.add(k); return { secClosed: c }; });
  const catalog = m.stateCatalog().filter(d => !q || d.name.toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
  if (q) hits += catalog.length;
  const secKids = (k: Sec): string[] => k === "dados" ? m.stateCatalog().filter(d => m.dKids(d.name).length).map(d => "dt:" + d.name) : k === "arquivos" ? m.modules.map(l => "ly:" + l.id) : [];
  const secExpand = (k: Sec) => patch(u => {
    const open = new Set(u.open); secKids(k).forEach(id => open.add(id));
    const sc = new Set(u.secClosed); sc.delete(k);
    return { open, secClosed: sc, flowClosed: k === "funcoes" ? new Set() : u.flowClosed };
  });
  const secCollapse = (k: Sec) => patch(u => {
    const ks = secKids(k), open = new Set(u.open);
    if (k === "funcoes") {
      const fc = new Set(u.flowClosed);
      m.els.filter(x => !x.archived && !m.isFolder(x) && !m.isData(x) && m.kidsPlan(x.id).some(y => !m.isFolder(y) && !m.isData(y))).forEach(x => fc.add(x.id));
      return { flowClosed: fc };
    }
    if (ks.length) { ks.forEach(id => open.delete(id)); return { open }; }
    const sc = new Set(u.secClosed); sc.add(k); return { secClosed: sc };
  });
  const secTools = (k: Sec) => (
    <>
      <button className="ib" title="Abrir os itens filhos" onClick={e => { e.stopPropagation(); secExpand(k); }}><Icon n="chevrons-up-down" /></button>
      <button className="ib" title="Fechar os itens filhos" onClick={e => { e.stopPropagation(); secCollapse(k); }}><Icon n="chevrons-down-up" /></button>
    </>
  );
  const head = (k: Sec, ic: string, label: string, n: number, add: () => void, addTitle: string): ReactNode => (
    <div className="ex-sec-h" title="Abrir / fechar" onClick={() => tog(k)}>
      <span className="car"><Icon n="chevron-right" /></span><Icon n={ic} /> {label}<span className="n">{n}</span>{secTools(k)}
      <button className="ib" title={addTitle} onClick={e => { e.stopPropagation(); add(); }}><Icon n="plus" /></button>
    </div>
  );

  // ----- Funções (roots por plano) -----
  const rows: ReactNode[] = [];
  const fnRow = (u: ElementDto, lvl: number) => {
    const ind = 8 + Math.min(lvl, 14) * 14;
    const isRoot = !u.parentId || m.isFolder(m.u(u.parentId));
    const onView = isRoot && s.flowRoot === u.id;
    const sel = s.sel === u.id || s.multi.includes(u.id) || onView;
    const a = m.agent(u.agentId);
    const editing = s.ren === u.id && s.fresh !== u.id;
    return (
      <div key={u.id} className={"node" + (sel ? " sel" : "") + (onView ? " root-on" : "") + (s.clip?.mode === "cut" && s.clip.ids.includes(u.id) ? " cut" : "") + (s.flash === u.id ? " flash" : "")}
        data-node={u.id} style={{ paddingLeft: ind }} title={onView ? "Visualização ativa no Flow" : ""}
        onClick={e => {
          if (e.metaKey || e.ctrlKey) { const mm = new Set(s.multi.length ? s.multi : s.sel ? [s.sel] : []); mm.has(u.id) ? mm.delete(u.id) : mm.add(u.id); set({ multi: [...mm], sel: u.id }); return; }
          set({ multi: [], ren: null, estado: null }); ide.select(u.id); set({ v: "flow", flash: u.id });
        }}
        onDoubleClick={() => { if (!m.isFolder(u)) ide.openDrawer(u.id); }}
        onContextMenu={e => { e.preventDefault(); set({ sel: u.id, ctx: { id: u.id, x: Math.min(e.clientX, innerWidth - 246), y: Math.min(e.clientY, innerHeight - 440) } }); }}>
        {Array.from({ length: Math.min(lvl, 14) }, (_, i) => <span key={i} className="guide" style={{ left: 16 + i * 14 }} />)}
        <span className="car" />
        <FnIcon m={m} u={u} />
        {editing ? <input defaultValue={u.title} autoFocus aria-label="Novo nome" onClick={e => e.stopPropagation()} onBlur={e => ide.renameCommit(u.id, e.currentTarget.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } if (e.key === "Escape") { e.stopPropagation(); set({ ren: null }); } }} />
          : <><span className="t"><Mark q={q} text={u.title} /></span>
            <span className="meta">{a && <Icon n={TYPE_INFO[a.kind].ic} />}{u.status && <span className={"st " + ST[u.status][0]} style={{ padding: "0 3px" }}><Icon n={ST[u.status][1]} /></span>}</span></>}
        {!editing && (
          <span className="ex-tools">
            <button className="ib" title="Editar" onClick={e => { e.stopPropagation(); ide.openDrawer(u.id); }}><Icon n="pencil" /></button>
            <button className="ib" title="Filho" onClick={e => { e.stopPropagation(); void ide.addFn(u.id, "child"); }}><Icon n="plus" /></button>
            <button className="ib danger" title="Remover" onClick={e => { e.stopPropagation(); ide.askRemove([u.id]); }}><Icon n="trash-2" /></button>
          </span>)}
      </div>
    );
  };
  m.plans.forEach(p => {
    const walk = (pid: string | null, lvl: number) => {
      m.kids(pid).forEach(u => {
        if (m.isData(u)) return;
        if (!pid && u.planId !== p.id) return;
        if (show && !show.has(u.id)) return;
        if (m.isFolder(u)) { walk(u.id, lvl); return; }
        rows.push(fnRow(u, lvl));
      });
    };
    walk(null, 1);
  });
  const nFuncoes = m.els.filter(u => !u.archived && !m.isFolder(u) && !m.isData(u) && (!u.parentId || m.isFolder(m.u(u.parentId)))).length;

  // ----- Dados -----
  const dadoRow = (name: string, lvl: number): ReactNode => {
    const ks = m.dKids(name), abs = m.dadoIsAbs(name), has = m.dadoHasValue(name), id = "dt:" + name, isOpen = q ? true : s.open.has(id);
    const val = ks.length ? <span className={"dado-val" + (has ? "" : " empty")}>{ks.filter(k => m.dadoHasValue(k)).length}/{ks.length} campos</span> : <span className={"dado-val" + (has ? "" : " empty")}>{has ? m.dValue(name) : "sem valor"}</span>;
    return (
      <div key={name}>
        <div className={"node" + (s.estado === name ? " sel" : "") + (ks.length && isOpen ? " openf" : "")} data-estado={name} style={{ paddingLeft: 8 + lvl * 14 }} onClick={() => ide.editDado(name)}>
          {Array.from({ length: lvl }, (_, i) => <span key={i} className="guide" style={{ left: 16 + i * 14 }} />)}
          <span className="car" onClick={ks.length ? e => { e.stopPropagation(); toggleOpen(id); } : undefined}>{ks.length ? <Icon n="chevron-right" /> : null}</span>
          <span className={"fi dado" + (abs ? " abs" : "")} title={`Dado ${abs ? "abstrato" : "concreto"} · ${DTYPE_N[m.dType(name)]}`}><Icon n={m.isCube(name) ? "box" : "square"} /></span>
          <span className="t mono"><Mark q={q} text={lvl ? m.dLeaf(name) : name} /></span>
          <span className="meta"><span className="dado-ty">{m.dType(name)}</span>{val}</span>
          <span className="ex-tools">
            <button className="ib" title="Editar valor e tipo" onClick={e => { e.stopPropagation(); ide.editDado(name); }}><Icon n="pencil" /></button>
            <button className="ib" title="Novo campo (filho)" onClick={e => { e.stopPropagation(); ide.editDado(name); set({ focusQ: false }); setTimeout(() => document.querySelector<HTMLInputElement>('input[name="k"]')?.focus(), 60); }}><Icon n="plus" /></button>
          </span>
        </div>
        {ks.length > 0 && isOpen && ks.map(k => dadoRow(k, lvl + 1))}
      </div>
    );
  };

  // ----- Módulos, pessoas, agentes, modelos -----
  ide.m.modules.forEach(() => undefined);
  const mods = m.modules.filter(l => !q || l.file.toLowerCase().includes(q) || l.items.some(i => (i.kind === "fn" ? m.u(i.ref)?.title ?? "" : i.kind === "script" ? m.agent(i.ref)?.name ?? "" : i.ref).toLowerCase().includes(q)));
  if (q) hits += mods.length;
  const pessoas = m.agents.filter(a => a.kind === "pessoa" && (!q || a.name.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q)));
  const ias = m.agents.filter(a => a.kind === "ia" && (!q || a.name.toLowerCase().includes(q) || (a.prompt ?? "").toLowerCase().includes(q)));
  const models = m.models.filter(x => !q || x.name.toLowerCase().includes(q) || x.vendor.toLowerCase().includes(q) || x.api.includes(q));
  if (q) hits += pessoas.length + ias.length + models.length;
  const empty = !rows.length && !catalog.length && !mods.length && !pessoas.length && !ias.length && !models.length;
  const emptyP = (t: string) => <p style={{ padding: "8px 14px", color: "var(--muted)", fontSize: 12 }}>{t}</p>;

  const renRef = useRef<HTMLInputElement>(null);
  useEffect(() => { renRef.current?.focus(); }, [s.renLy, s.renCat]);
  const addAgent = async (kind: "pessoa" | "ia") => {
    const id = await ide.call(() => import("../../api/client").then(({ api }) => api.post<string>(ide.pid, "/agents", kind === "ia" ? { kind, name: "Novo agente", sub: "Agente · defina o prompt", prompt: "" } : { kind, name: "Nova pessoa", sub: "Defina a função · responsabilidade" })));
    if (kind === "ia" && id) set({ agCfg: id, drawer: null, mdCfg: null, mach: null }); else ide.toast("Pessoa adicionada", "user-round");
  };
  const apiCall = async <T,>(fn: (api: typeof import("../../api/client").api) => Promise<import("../../api/client").MutationResult<T>>) => ide.call(() => import("../../api/client").then(({ api }) => fn(api)));

  return (
    <aside className="ex" aria-label="Explorar">
      <div className="ex-h"><b>Explorar</b>
        <button className="ib" title="Nova função" onClick={() => void ide.newFlow()}><Icon n="circle-plus" /></button>
        <button className={"ib" + (s.q != null ? " on" : "")} title="Buscar na árvore" onClick={() => set({ q: s.q != null ? null : "", focusQ: true })}><Icon n="search" /></button>
        <button className="ib" title="Abrir todas as sanfonas" onClick={() => patch(u => {
          const open = new Set<string>();
          m.els.filter(x => !x.archived && (m.isFolder(x) || m.kids(x.id).some(k => !k.archived))).forEach(x => open.add(x.id));
          m.modules.forEach(l => open.add("ly:" + l.id)); m.stateCatalog().forEach(d => { if (m.dKids(d.name).length) open.add("dt:" + d.name); });
          return { open, secClosed: new Set(), flowClosed: new Set() };
        })}><Icon n="chevrons-up-down" /></button>
        <button className="ib" title="Fechar todas as sanfonas" onClick={() => set({ open: new Set(), secClosed: new Set(SECS) })}><Icon n="chevrons-down-up" /></button>
      </div>
      {s.q != null && (
        <div className="ex-q"><Icon n="search" />
          <input autoFocus value={s.q} placeholder="Filtrar funções, dados, pessoas…" aria-label="Filtrar" onChange={e => set({ q: e.target.value })} onKeyDown={e => { if (e.key === "Escape") set({ q: null }); }} />
          {q && <small>{hits} resultado{hits === 1 ? "" : "s"} · caminhos abertos</small>}</div>)}
      <div className="ex-tree"><div className="inner">
        {empty ? <p style={{ padding: 14, color: "var(--muted)" }}>Nada com “{s.q}”.</p> : (<>
          <div className={"ex-sec" + (secOpen("funcoes") ? " open" : "")}>
            {head("funcoes", "circle", "Funções", nFuncoes, () => void ide.newFlow(), "Adicionar fluxo")}
            {rows.length ? rows : <p style={{ padding: "8px 14px", color: "var(--muted)", fontSize: 12 }}>Nenhuma função. <button className="btn" style={{ marginLeft: 6, height: 24, fontSize: 11 }} onClick={() => void ide.newFlow()}><Icon n="plus" />Fluxo</button></p>}
          </div>
          <div className={"ex-sec" + (secOpen("dados") ? " open" : "")}>
            {head("dados", "box", "Dados", m.stateCatalog().length, () => void ide.newDado(), "Adicionar dado")}
            {catalog.length ? catalog.map(d => dadoRow(d.name, 0)) : emptyP("Nenhum dado.")}
          </div>
          <div className={"ex-sec" + (secOpen("arquivos") ? " open" : "")}>
            {head("arquivos", "files", "Módulos", mods.length, async () => { const id = await apiCall(a => a.post<string>(ide.pid, "/modules", {})); if (id) { patch(u => ({ open: new Set([...u.open, "ly:" + id]) })); ide.toast("Módulo criado", "file-code-2"); } }, "Adicionar módulo")}
            {mods.map(l => {
              const id = "ly:" + l.id, isOpen = q ? true : s.open.has(id);
              const nf = l.items.filter(i => i.kind === "fn").length, ns = l.items.filter(i => i.kind === "script").length, nd = l.items.length - nf - ns;
              const resumo = [nf ? `${nf} ${nf === 1 ? "função" : "funções"}` : "", ns ? `${ns} script${ns > 1 ? "s" : ""}` : "", nd ? `${nd} dado${nd > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
              const g = <><span className="guide" style={{ left: 16 }} /><span className="car" /></>;
              return (
                <div key={l.id}>
                  <div className={"node" + (isOpen ? " openf" : "")} style={{ paddingLeft: 8 }} title={l.file} onClick={() => toggleOpen(id)}>
                    <span className="car"><Icon n="chevron-right" /></span><span className="fi lyr"><Icon n="file-code-2" /></span>
                    {s.renLy === l.id
                      ? <input ref={renRef} className="ex-ren mono" defaultValue={l.file} aria-label="Nome do módulo" onClick={e => e.stopPropagation()}
                          onKeyDown={async e => { if (e.key === "Escape") { e.stopPropagation(); set({ renLy: null }); } if (e.key === "Enter") { e.preventDefault(); let v = e.currentTarget.value.trim(); if (v) { if (!/\.js$/.test(v)) v = v.replace(/\.+$/, "") + ".layer.js"; await apiCall(a => a.patch(ide.pid, `/modules/${l.id}`, { file: v })); } set({ renLy: null }); } }} />
                      : <><span className="t mono"><Mark q={q} text={l.file} /></span><span className="meta">{resumo}</span>
                        <span className="ex-tools"><button className="ib" title="Renomear" onClick={e => { e.stopPropagation(); set({ renLy: l.id, renCat: null }); }}><Icon n="pencil" /></button></span></>}
                  </div>
                  {isOpen && l.items.map((it, i) => {
                    if (it.kind === "fn") { const u = m.u(it.ref); if (!u) return null; return <div key={i} className={"node" + (s.sel === u.id ? " sel" : "")} style={{ paddingLeft: 22 }} onClick={() => ide.openDrawer(u.id)}>{g}<FnIcon m={m} u={u} /><span className="t">{u.title}</span></div>; }
                    if (it.kind === "script") { const sc = m.agent(it.ref); if (!sc) return null; const n = m.usesOfAgent(sc.id).length; return <div key={i} className="node" style={{ paddingLeft: 22 }} title="Função escrita por você · pode ser responsável no Flow">{g}<span className="fi script"><Icon n="file-code-2" /></span><span className="t mono">{sc.name}</span><span className="meta">{n ? `responsável em ${n}` : "livre"}</span></div>; }
                    const abs = m.dadoIsAbs(it.ref), has = m.dadoHasValue(it.ref);
                    return <div key={i} className={"node" + (s.estado === it.ref ? " sel" : "")} data-estado={it.ref} style={{ paddingLeft: 22 }} onClick={() => ide.editDado(it.ref)}>{g}<span className={"fi dado" + (abs ? " abs" : "")} title={`Dado ${abs ? "abstrato" : "concreto"}`}><Icon n={m.isCube(it.ref) ? "box" : "square"} /></span><span className="t mono">{it.ref}</span><span className="meta"><span className={"dado-val" + (has ? "" : " empty")}>{has ? m.dValue(it.ref) : "sem valor"}</span></span></div>;
                  })}
                </div>);
            })}
          </div>
          <div className={"ex-sec" + (secOpen("pessoas") ? " open" : "")}>
            {head("pessoas", "users-round", "Pessoas", pessoas.length, () => void addAgent("pessoa"), "Adicionar pessoa")}
            {pessoas.length ? pessoas.map(a => {
              const uses = m.els.filter(u => !u.archived && u.respId === a.id).length;
              return (
                <div key={a.id} className="node" style={{ paddingLeft: 8 }} title={a.sub}><span className="car" /><Face a={a} />
                  {s.renCat === a.id
                    ? <input ref={renRef} className="ex-ren" defaultValue={a.name} aria-label="Nome da pessoa" onClick={e => e.stopPropagation()}
                        onKeyDown={async e => { if (e.key === "Escape") { e.stopPropagation(); set({ renCat: null }); } if (e.key === "Enter") { e.preventDefault(); const v = e.currentTarget.value.trim(); if (v) await apiCall(x => x.patch(ide.pid, `/agents/${a.id}`, { name: v })); set({ renCat: null }); } }} />
                    : <><span className="t"><Mark q={q} text={a.name} /></span><span className="meta"><span>{a.sub.split(" · ")[0]}</span>{uses > 0 && <span className="mono">· {uses}</span>}</span>
                      <span className="ex-tools"><button className="ib" title="Renomear" onClick={() => set({ renCat: a.id, renLy: null })}><Icon n="pencil" /></button></span></>}
                </div>);
            }) : emptyP("Nenhuma pessoa.")}
          </div>
          <div className={"ex-sec" + (secOpen("agentes") ? " open" : "")}>
            {head("agentes", "user-round-cog", "Agentes", ias.length, () => void addAgent("ia"), "Adicionar agente")}
            {ias.length ? ias.map(a => (
              <div key={a.id} className={"node" + (s.agCfg === a.id ? " sel" : "")} style={{ paddingLeft: 8 }} title={`Configurar ${a.name}`} onClick={() => set({ drawer: null, mdCfg: null, mach: null, agCfg: s.agCfg === a.id ? null : a.id })}>
                <span className="car" /><Face a={a} /><span className="t"><Mark q={q} text={a.name} /></span><span className="meta"><span>{m.modelOf(a.modelId)?.name ?? ""}</span></span></div>)) : emptyP("Nenhum agente configurado.")}
          </div>
          <div className={"ex-sec" + (secOpen("modelos") ? " open" : "")}>
            {head("modelos", "bot", "Modelos", models.length, async () => { const id = await apiCall(a => a.post<string>(ide.pid, "/models", { name: "Novo modelo", api: "novo-modelo", vendor: "Defina o fornecedor", color: "#8a8a8a" })); if (id) { set({ mdCfg: id, drawer: null, agCfg: null, mach: null }); ide.toast("Modelo adicionado", "bot"); } }, "Adicionar modelo")}
            {models.map(x => (
              <div key={x.id} className={"node" + (s.mdCfg === x.id ? " sel" : "")} style={{ paddingLeft: 8 }} title={`Configurar ${x.name}`} onClick={() => set({ drawer: null, agCfg: null, mach: null, mdCfg: s.mdCfg === x.id ? null : x.id })}>
                <span className="car" /><span className="fi modelo"><Icon n="bot" /></span><span className="t"><Mark q={q} text={x.name} /></span><span className="meta"><span>{x.vendor}</span></span></div>))}
          </div>
        </>)}
      </div></div>
      <div className="ex-cfg"><button className={s.v === "catalog" ? "on" : ""} onClick={() => set({ v: "catalog", drawer: null, dadoEdit: null, agCfg: null, mdCfg: null, mach: null })}>
        <Icon n="settings-2" /><span><b>Configurações</b><small>IA · Node.js · Pessoas · {m.agents.length} no catálogo</small></span></button></div>
    </aside>
  );
}
