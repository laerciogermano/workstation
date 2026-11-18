import { useState } from "react";
import { TYPE_INFO, type AgentKind } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { AgChip } from "../../ui/parts";
import { api } from "../../api/client";
import { useIde } from "../ide/ide";

export function CatalogView() {
  const ide = useIde();
  const { m, s, set } = ide;
  const t = s.catTab;
  const list = m.agents.filter(c => c.kind === t);
  const [n, setN] = useState(""), [d, setD] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!n.trim()) return;
    const id = await ide.call(() => api.post<string>(ide.pid, "/agents", { kind: t, name: n.trim(), sub: d.trim(), prompt: t === "ia" ? "" : undefined, moduleFile: t === "script" ? "meu-modulo.layer.js" : undefined }));
    if (id) { setN(""); setD(""); ide.toast(`${n.trim()} entrou no catálogo`, "plus"); }
  };
  const remove = async (id: string) => {
    const a = m.agent(id)!;
    if (m.usesOfAgent(id).length) { set({ catBlock: s.catBlock === id ? null : id }); return; }
    const r = await ide.call(() => api.del(ide.pid, `/agents/${id}`));
    if (r !== undefined) ide.toast(`${a.name} saiu do catálogo`);
  };
  return (
    <div className="cat"><div className="cat-in">
      <div><h2>Agentes do fluxo</h2><p className="lead">Só IA e bibliotecas Node.js. Atribuir a uma etapa não muda o roteiro — só o executor.</p></div>
      <nav className="seg" style={{ alignSelf: "flex-start" }}>
        {(Object.keys(TYPE_INFO) as AgentKind[]).map(k => <button key={k} aria-current={k === t} onClick={() => set({ catTab: k, catBlock: null })}><Icon n={TYPE_INFO[k].ic} />{TYPE_INFO[k].n}<span style={{ color: "var(--muted)", fontWeight: 500 }}>{m.agents.filter(c => c.kind === k).length}</span></button>)}</nav>
      <form className="cat-add" onSubmit={add}>
        <input placeholder={t === "ia" ? "Nome do modelo ou agente" : "Biblioteca Node (node:fs, node:http…)"} aria-label="Nome" value={n} onChange={e => setN(e.target.value)} maxLength={120} />
        <input placeholder={t === "ia" ? "Fornecedor · uso" : "Pacote / runtime Node.js"} aria-label="Descrição" value={d} onChange={e => setD(e.target.value)} maxLength={200} />
        <button className="btn pri"><Icon n="plus" />Incluir</button></form>
      <div className="ctable"><div className="crow"><span>Nome</span><span>Descrição</span><span>Uso</span><span /></div>
        {list.map(c => { const us = m.usesOfAgent(c.id); return (
          <div className="crow" key={c.id}><AgChip a={c} /><span className="sub">{c.sub}</span>
            <span className={"use" + (us.length ? "" : " free")}>{us.length ? <><b className="num">{us.length}</b> unidade{us.length > 1 ? "s" : ""}</> : "livre"}</span>
            <button className="btn ghost danger rm" onClick={() => void remove(c.id)}><Icon n="trash-2" />Remover</button>
            {s.catBlock === c.id && <div className="block"><p><b>{c.name}</b> é responsável por {us.length} unidade{us.length > 1 ? "s" : ""}. Troque o responsável nelas para remover.</p>
              <div className="list-r">{us.map(u => <button key={u.id} onClick={() => ide.openDrawer(u.id)}><Icon n="file-text" />{u.title}<span className="r">{m.path(u.id).slice(0, -1).join(" / ")}</span></button>)}</div></div>}
          </div>); })}
      </div></div></div>
  );
}
