import { TYPE_INFO, type AgentKind } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { AgChip, StBadge } from "../../ui/parts";
import { useIde } from "../ide/ide";

export function Drawer() {
  const ide = useIde();
  const { m, s, set } = ide;
  const u = m.u(s.drawer); if (!u) return null;
  const p = m.u(u.parentId), ks = m.kidsPlan(u.id).filter(k => !m.isFolder(k));
  const a = m.agent(u.agentId);
  const L = m.flowLayout(u.planId).layout[u.id] ?? { s: 0, e: 0 };
  const chk = m.fopCheck(u.planId);
  const from = "Etapa";
  const kinds: AgentKind[] = ["ia", "pessoa", "maquina", "script"];
  const comp = ks.some(k => !m.isData(k));
  return (
    <aside className="side" aria-label="Detalhe da unidade">
      <div className="side-h"><span className="k"><Icon n={m.isFolder(u) ? "folder" : "file-text"} />{from}
        <button className="uid" title="Copiar IDR" onClick={() => { void navigator.clipboard?.writeText(u.id); ide.toast("IDR copiado", "copy"); }}>{u.id.slice(0, 13)}… <Icon n="copy" /></button></span><span className="sp" />
        {u.archived && <span className="tag">arquivada</span>}<button className="ib" aria-label="Fechar" onClick={() => set({ drawer: null, picker: false })}><Icon n="x" /></button></div>
      <div className="side-b">
        <div className="fld"><input key={u.id + u.title} className="ttl" defaultValue={u.title} aria-label="Título"
          onBlur={e => { const v = e.target.value.trim(); if (!v) { e.target.value = u.title; ide.toast("O título é obrigatório", "triangle-alert"); return; } if (v !== u.title) void ide.patchEl(u.id, { title: v }); }} />
          <div className="vocab"><span className="on">Etapa</span><span>Arquivo</span><span>Agente</span><span style={{ border: 0, padding: 0 }}>mesma unidade no Flow e no Explorar</span></div></div>
        <div className="fld"><label>Contexto</label><textarea key={u.id + "c"} defaultValue={u.context ?? ""} placeholder="Orçamento, preferências, restrições" onBlur={e => { if (e.target.value !== (u.context ?? "")) void ide.patchEl(u.id, { context: e.target.value || null }); }} /></div>
        {m.isData(u) ? (
          <div className="fld"><span className="l">Dado</span><div className="list-r"><div><Icon n="diamond" />Unidade de informação · 0 passos<span className="r">reúne</span></div>
            {u.ins.map(n => <div key={n}><Icon n="box" /><span className="mono" style={{ color: "var(--accent)" }}>{n}</span><span className="r">{chk.prod[n]?.title ?? "contexto"}</span></div>)}</div></div>
        ) : (
          <div className="fld"><span className="l">Responsável</span>
            <button className="resp" onClick={() => set({ picker: !s.picker })}><AgChip a={a} />{a && <small style={{ color: "var(--muted)" }}>{TYPE_INFO[a.kind].one}</small>}<Icon n="chevron-down" className="chev" /></button>
            {s.picker && (
              <div className="picker">
                {kinds.map(t => <div key={t}><h5>{TYPE_INFO[t].n}</h5>{m.agents.filter(c => c.kind === t).map(c => <button key={c.id} className={u.agentId === c.id ? "on" : ""} onClick={() => void ide.assign(u.id, c.id)}><AgChip a={c} /><small>{c.sub}</small></button>)}</div>)}
                <button onClick={() => void ide.assign(u.id, null)}><AgChip /></button>
                <div className="note">Só quem está no catálogo do projeto. Filhos não herdam o responsável do pai.</div>
              </div>)}
          </div>)}
        {(u.status || u.error) && (
          <div className="fld"><span className="l">Execução</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><StBadge st={u.status} />{u.status === "wait" && <button className="btn pri" onClick={() => void ide.complete(u.id)}><Icon n="check" />Concluir (feito pela pessoa)</button>}{(u.status === "fail" || u.status === "cancel") && <button className="btn" onClick={() => void ide.retry(u.id)}><Icon n="rotate-ccw" />Tentar de novo</button>}</div>
            {u.error && u.status === "fail" && <p style={{ fontSize: 12, color: "var(--fail)" }}>{u.error}</p>}</div>)}
        {!m.isFolder(u) && <div className="g2"><div className="fld"><label>Início</label><input type="text" value={`passo ${L.s}`} readOnly /></div><div className="fld"><label>Passos</label><input type="text" value={m.isData(u) ? "0 · dado" : String(L.e - L.s + 1)} readOnly /></div></div>}
        {(u.ins.length > 0 || u.outs.length > 0) && (
          <div className="fld"><span className="l">Estado (entradas e saídas)</span><div className="list-r">
            {u.ins.map(n => <div key={"i" + n}><Icon n="arrow-down-to-line" /><button className="dkind" title={m.isCube(n) ? "Cubo (composto) · clique para virar dado simples □" : "Dado simples □ · clique para virar cubo (composto)"} onClick={() => void ide.toggleCube(n)}><Icon n={m.isCube(n) ? "box" : "square"} /></button><span className="mono" style={{ color: "var(--accent)" }}>{n}</span><span className="r">entrada</span></div>)}
            {u.outs.map(([n, ref]) => <div key={"o" + n}><Icon n="arrow-up-from-line" /><button className="dkind" title={m.isCube(n) ? "Cubo (composto) · clique para virar dado simples □" : "Dado simples □ · clique para virar cubo (composto)"} onClick={() => void ide.toggleCube(n)}><Icon n={m.isCube(n) ? "box" : "square"} /></button><span className="mono" style={{ color: "var(--accent)" }}>{n}</span><span className="r mono">{ref}</span></div>)}
          </div></div>)}
        {!m.isFolder(u) && <div className="fld"><span className="l">Função FOP · {m.isData(u) ? "dado" : comp ? "composição" : a?.kind === "ia" ? "endereço abstrato (IA no contexto)" : a ? "endereço concreto (import)" : "sem agente"}</span><pre className="sig">{m.fopSig(u)}</pre></div>}
        <div className="fld"><span className="l">Hierarquia</span><div className="list-r">
          {p ? <button onClick={() => ide.openDrawer(p.id)}><Icon n="corner-left-up" />{p.title}<span className="r">pai</span></button> : <div style={{ color: "var(--muted)" }}><Icon n="corner-left-up" />Raiz</div>}
          {ks.map(k => <button key={k.id} onClick={() => ide.openDrawer(k.id)}><Icon n="corner-down-right" />{k.title}<span className="r"><AgChip a={m.agent(k.agentId)} short /><StBadge st={k.status} /></span></button>)}
        </div></div>
        {a?.kind === "maquina" && <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => set({ mach: u.id, sel: u.id, drawer: null, console: null })}><Icon n="code-xml" />Programar no Flow</button>}
        <div className="fld"><span className="l">Abrir em</span><div className="openin">
          <button className="btn" onClick={() => { ide.select(u.id); set({ v: "flow" }); }}><Icon n="workflow" />Flow</button>
          <button className="btn" onClick={() => { let q = u.parentId; const open = new Set(s.open); while (q) { open.add(q); q = m.u(q)?.parentId ?? null; } set({ sel: u.id, flash: u.id, open, drawer: null }); }}><Icon n="folder-tree" />Explorar</button></div></div>
      </div>
      <div className="side-f"><button className="btn ghost" onClick={() => { void ide.patchEl(u.id, { archived: !u.archived }); ide.toast(u.archived ? "Desarquivada" : "Arquivada. Fica fora das visões até desarquivar.", "archive"); if (!u.archived) set({ drawer: null, sel: null }); }}><Icon n={u.archived ? "archive-restore" : "archive"} />{u.archived ? "Desarquivar" : "Arquivar"}</button><span className="sp" />
        <button className="btn ghost danger" onClick={() => ide.askRemove([u.id])}><Icon n="trash-2" />Excluir</button></div>
    </aside>
  );
}
