import { useState } from "react";
import { DATA_TYPES, DTYPE_N, type DataType } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { api } from "../../api/client";
import { useIde } from "../ide/ide";

export function DadoPanel() {
  const ide = useIde();
  const { m, s, set } = ide;
  const name = s.dadoEdit; if (!name) return null;
  const prod = m.els.find(x => !x.archived && x.outs.some(o => o[0] === name));
  const cons = m.els.filter(x => !x.archived && x.ins.includes(name));
  const has = m.dadoHasValue(name), abs = m.dadoIsAbs(name), ks = m.dKids(name), ty = m.dType(name);
  const sug = m.moduleOfData(name.split(".")[0]!)?.file ?? defaultModule(name);
  const files = [...new Set([...m.modules.map(l => l.file), sug])];
  return <DadoForm key={name + (m.dValue(name) ?? "") + ty} name={name} prod={prod?.id} cons={cons.map(c => ({ id: c.id, title: c.title }))} prodTitle={prod?.title} has={has} abs={abs} kids={ks} ty={ty} files={files} sug={sug} close={() => set({ dadoEdit: null })} />;

  function defaultModule(n: string): string {
    const c = m.els.find(x => !x.archived && x.ins.includes(n));
    const home = c ? (c.parentId && !m.isFolder(m.u(c.parentId)) ? m.u(c.parentId)! : c) : null;
    return home ? home.title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".layer.js" : "estado.data.js";
  }
}

function DadoForm(p: { name: string; prod?: string; prodTitle?: string; cons: { id: string; title: string }[]; has: boolean; abs: boolean; kids: string[]; ty: DataType; files: string[]; sug: string; close: () => void }) {
  const ide = useIde();
  const { m, s } = ide;
  const { name, ty } = p;
  const [val, setVal] = useState(m.dValue(name) ?? "");
  const [type, setType] = useState<DataType>(ty);
  const [file, setFile] = useState(p.sug);
  const [newFile, setNewFile] = useState("");
  const [kid, setKid] = useState("");
  const composite = p.kids.length > 0 || type === "objeto";
  const input = type === "booleano"
    ? <select className="dado-layer dado-val" aria-label="Valor" value={val} onChange={e => setVal(e.target.value)}><option value="">—</option><option>true</option><option>false</option></select>
    : type === "numero" || type === "inteiro" ? <input className="dado-layer" type="number" step={type === "inteiro" ? 1 : "any"} value={val} aria-label="Valor" placeholder="Valor" onChange={e => setVal(e.target.value)} />
    : type === "data" ? <input className="dado-layer" type="date" value={val} aria-label="Valor" onChange={e => setVal(e.target.value)} />
    : <input className="dado-layer" type="text" value={val} aria-label="Valor" placeholder={type === "lista" ? "Itens separados por vírgula" : type === "arquivo" ? "Caminho (out/…)" : "Valor"} onChange={e => setVal(e.target.value)} />;
  const typeSel = <select className="dado-layer" aria-label="Tipo" value={type} onChange={e => { const t = e.target.value as DataType; setType(t); void ide.saveDado(name, { type: t }); }}>{DATA_TYPES.map(k => <option key={k} value={k}>{DTYPE_N[k]}</option>)}</select>;
  const fileVal = file === "__new" ? newFile.trim() : file;
  const save = () => {
    const f = fileVal && !/\.js$/.test(fileVal) ? fileVal + ".data.js" : fileVal;
    void ide.saveDado(name, composite ? { moduleFile: f || undefined } : { type, value: val.trim(), moduleFile: f || undefined });
  };
  const parent = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : null;
  return (
    <aside className="side w360" aria-label="Definir valor do dado">
      <div className="side-h"><span className="k"><Icon n="box" />Dado · valor no state</span><span className="sp" /><button className="ib" title="Fechar" onClick={p.close}><Icon n="x" /></button></div>
      <div className="side-b">
        <div className="fld" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={"fi dado" + (p.abs ? " abs" : "")} style={{ width: 22, height: 22, display: "grid", placeItems: "center", color: "var(--dado)" }}><Icon n={m.isCube(name) ? "box" : "square"} /></span>
          <div><b className="mono" style={{ fontSize: 16 }}>{name}</b><div style={{ fontSize: 12, color: "var(--muted)" }}>{p.abs ? "Abstrato (preto) · sem valor no state" : "Concreto (sólido) · valor definido"}</div></div></div>
        {parent && <div className="fld"><span className="l">Campo de</span><button onClick={() => ide.editDado(parent)}><Icon n="corner-left-up" /><span className="mono">{parent}</span></button></div>}
        {composite ? (
          <>
            <div className="fld"><label>Tipo</label>{typeSel}</div>
            <div className="fld"><label>Campos (filhos)</label>
              <div className="dado-kids">
                {p.kids.map(k => { const hv = m.dadoHasValue(k); const vv = hv ? m.dValue(k) || (m.dKids(k).length ? "completo" : "") : "sem valor"; return <button key={k} onClick={() => ide.editDado(k)}><span className={"fi dado" + (m.dadoIsAbs(k) ? " abs" : "")} style={{ color: "var(--dado)", display: "grid" }}><Icon n={m.isCube(k) ? "box" : "square"} /></span>{m.dLeaf(k)}<span className="dado-k-ty">{DTYPE_N[m.dType(k)]}</span><span className={"dado-k-val" + (hv ? "" : " empty")}>{vv}</span></button>; })}
                <form onSubmit={e => { e.preventDefault(); if (kid.trim()) { void ide.addKid(name, kid.trim()); setKid(""); } }}>
                  <input name="k" placeholder="novo_campo" aria-label="Nome do campo" value={kid} onChange={e => setKid(e.target.value)} /><button className="btn"><Icon n="plus" />Campo</button></form></div>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{p.kids.length ? "Fica sólido quando todos os campos têm valor." : "Objeto sem campos: adicione os campos filhos ou troque o tipo."}</p></div>
            <div className="fld">
              <ModuleField files={p.files} file={file} setFile={setFile} newFile={newFile} setNewFile={setNewFile} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn pri" onClick={save}><Icon n="check" />Salvar módulo</button></div></div>
          </>
        ) : (
          <div className="fld">
            <div className="fld"><label>Tipo e valor</label><div className="dado-tv">{typeSel}{input}</div></div>
            <ModuleField files={p.files} file={file} setFile={setFile} newFile={newFile} setNewFile={setNewFile} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn pri" onClick={save}><Icon n="check" />Salvar valor</button>
              {p.has && <button className="btn" onClick={() => { setVal(""); void ide.saveDado(name, { value: "" }); }}><Icon n="eraser" />Limpar</button>}</div>
          </div>)}
        <div className="fld"><span className="l">Origem</span>{p.prod ? <button onClick={() => ide.openDrawer(p.prod!)}><Icon n="circle" />{p.prodTitle}</button> : <p style={{ fontSize: 12, color: "var(--muted)" }}>Entrada externa / state</p>}</div>
        <div className="fld"><span className="l">Usado em</span>{p.cons.length ? <div className="list-r">{p.cons.map(c => <button key={c.id} onClick={() => ide.openDrawer(c.id)}><Icon n="circle" />{c.title}</button>)}</div> : <p style={{ fontSize: 12, color: "var(--muted)" }}>Ninguém consome ainda.</p>}</div>
      </div>
      <span hidden>{s.v}</span>
    </aside>
  );
}

function ModuleField(p: { files: string[]; file: string; setFile: (f: string) => void; newFile: string; setNewFile: (f: string) => void }) {
  const { m } = useIde();
  return (
    <>
      <label>Módulo (dados + funções)</label>
      <select className="dado-layer" value={p.file} onChange={e => p.setFile(e.target.value)}>
        {p.files.map(f => <option key={f} value={f}>{f}{!m.modules.some(l => l.file === f) ? " · novo" : ""}</option>)}<option value="__new">Outro módulo…</option></select>
      {p.file === "__new" && <input className="dado-layer" placeholder="nome.data.js" style={{ marginTop: 6 }} value={p.newFile} onChange={e => p.setNewFile(e.target.value)} />}
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Com valor, o dado fica concreto e passa a morar neste módulo (Explorar › Módulos).</p>
    </>
  );
}
void api;
