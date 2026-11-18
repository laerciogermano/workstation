import { Icon } from "../../ui/Icon";
import { api } from "../../api/client";
import { useIde } from "../ide/ide";

export function ModelPanel() {
  const ide = useIde();
  const { m, s, set } = ide;
  const x = m.models.find(v => v.id === s.mdCfg); if (!x) return null;
  const patch = (b: Record<string, unknown>) => ide.call(() => api.patch(ide.pid, `/models/${x.id}`, b));
  const agents = m.agents.filter(a => a.modelId === x.id);
  return (
    <aside className="side w360" aria-label="Configurar modelo" key={x.id}>
      <div className="side-h"><span className="k"><Icon n="bot" />Modelo</span><span className="sp" /><button className="ib" title="Fechar" onClick={() => set({ mdCfg: null })}><Icon n="x" /></button></div>
      <div className="side-b">
        <input className="ttl" defaultValue={x.name} aria-label="Nome do modelo" onBlur={e => { const v = e.target.value.trim(); if (v && v !== x.name) void patch({ name: v }); }} />
        <div className="fld"><label>Fornecedor</label><input type="text" defaultValue={x.vendor} onBlur={e => { const v = e.target.value.trim(); if (v && v !== x.vendor) void patch({ vendor: v }); }} /></div>
        <div className="fld"><label>ID na API</label><input type="text" className="mono" defaultValue={x.api} onBlur={e => { const v = e.target.value.trim(); if (v && v !== x.api) void patch({ api: v }); }} /></div>
        <div className="fld"><label>Chave de API</label><input type="text" value={`definida no ambiente (FLOW_${x.vendor.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_KEY)`} disabled /></div>
        <div className="fld"><span className="l">Agentes que usam</span>{agents.length ? <div className="list-r">{agents.map(a => <button key={a.id} onClick={() => set({ mdCfg: null, agCfg: a.id })}><Icon n="user-round-cog" />{a.name}</button>)}</div> : <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum agente.</p>}</div>
        <button className="btn ghost danger" style={{ alignSelf: "flex-start" }} onClick={async () => { const ok = await ide.call(() => api.del(ide.pid, `/models/${x.id}`)); if (ok !== undefined) { set({ mdCfg: null }); ide.toast("Modelo removido", "trash-2"); } }}><Icon n="trash-2" />Remover modelo</button>
      </div>
    </aside>
  );
}
