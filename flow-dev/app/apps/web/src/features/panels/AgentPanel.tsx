import { useState } from "react";
import { Icon } from "../../ui/Icon";
import { Face, initials } from "../../ui/parts";
import { api } from "../../api/client";
import { useIde } from "../ide/ide";

export function AgentPanel() {
  const ide = useIde();
  const { m, s, set } = ide;
  const a = m.agent(s.agCfg); if (!a) return null;
  const uses = m.els.filter(u => !u.archived && (u.agentId === a.id || u.respId === a.id) && !m.kids(u.id).length);
  return <AgentForm key={a.id} id={a.id} uses={uses.map(u => ({ id: u.id, title: u.title, plan: m.plans.find(p => p.id === u.planId)?.name ?? "" }))} close={() => set({ agCfg: null })} />;
}
function AgentForm({ id, uses, close }: { id: string; uses: { id: string; title: string; plan: string }[]; close: () => void }) {
  const ide = useIde();
  const a = ide.m.agent(id)!;
  const [prompt, setPrompt] = useState(a.prompt ?? "");
  const patch = (b: Record<string, unknown>) => ide.call(() => api.patch(ide.pid, `/agents/${id}`, b));
  return (
    <aside className="side w360" aria-label="Configurar agente">
      <div className="side-h"><span className="k"><Icon n="bot" />Agente · prompt + modelo</span><span className="sp" /><button className="ib" title="Fechar" onClick={close}><Icon n="x" /></button></div>
      <div className="side-b">
        <div className="fld face-edit"><Face a={a} lg />
          <div className="face-acts">
            <label className="btn" style={{ cursor: "pointer" }}><Icon n="image" />Foto<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              if (f.size > 250_000) { ide.toast("Foto grande demais (máx. 250 KB)", "triangle-alert"); return; }
              const r = new FileReader(); r.onload = () => { void patch({ photoUrl: r.result }).then(() => ide.toast(`${a.name}: foto atualizada`, "image")); }; r.readAsDataURL(f);
            }} /></label>
            {a.photoUrl ? <button type="button" className="btn ghost" onClick={() => void patch({ photoUrl: null })}><Icon n="user-round" />Só iniciais ({initials(a.name)})</button> : <span style={{ fontSize: 12, color: "var(--muted)" }}>Sem foto · iniciais <b>{initials(a.name)}</b> · selo IA</span>}</div></div>
        <input className="ttl" defaultValue={a.name} aria-label="Nome do agente" onBlur={e => { const v = e.target.value.trim(); if (v && v !== a.name) void patch({ name: v }); }} />
        <div className="fld"><label>Modelo</label>
          <select className="sel-in" value={a.modelId ?? ""} onChange={e => { void patch({ modelId: e.target.value || null }); ide.toast(`${a.name} agora usa ${ide.m.modelOf(e.target.value)?.name ?? "—"}`, "sparkles"); }}>
            <option value="">—</option>{ide.m.models.map(x => <option key={x.id} value={x.id}>{x.name} · {x.vendor}</option>)}</select></div>
        <div className="fld"><label>Prompt</label><textarea rows={6} value={prompt} onChange={e => setPrompt(e.target.value)} onBlur={() => { if (prompt !== (a.prompt ?? "")) void patch({ prompt }); }} /></div>
        <div className="fld"><span className="l">Usado em</span>{uses.length ? <div className="list-r">{uses.map(u => <button key={u.id} onClick={() => ide.openDrawer(u.id)}><Icon n="circle" />{u.title}<span className="r">{u.plan}</span></button>)}</div> : <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhuma etapa ainda.</p>}</div>
      </div>
    </aside>
  );
}
