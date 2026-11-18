import { useEffect, useRef } from "react";
import { Icon } from "../../ui/Icon";
import { useIde } from "../ide/ide";

/** realce simples de sintaxe (JS/TS/Py/IR) — texto puro vindo do servidor, escapado pelo React */
const KW = /\b(import|from|export|default|async|function|await|const|let|return|if|for|of|while|do|def|not|in|plan|state|task|seq|par|select|repeat|group|else|goto|then|true|false)\b/g;
export function Highlight({ code }: { code: string }) {
  return <>{code.split("\n").map((line, i) => {
    const ci = line.search(/(\/\/|#\s|^#)/);
    const body = ci >= 0 ? line.slice(0, ci) : line, com = ci >= 0 ? line.slice(ci) : "";
    const parts: (string | React.ReactElement)[] = []; let last = 0, k = 0;
    const re = new RegExp(`${KW.source}|("[^"]*"|'[^']*')`, "g"); let mt: RegExpExecArray | null;
    while ((mt = re.exec(body))) { if (mt.index > last) parts.push(body.slice(last, mt.index)); parts.push(<span key={k++} className={mt[2] ? "s" : "k"}>{mt[0]}</span>); last = mt.index + mt[0].length; }
    parts.push(body.slice(last));
    return <span key={i}>{parts}{com && <span className="c">{com}</span>}{"\n"}</span>;
  })}</>;
}

export function ExportDialog() {
  const ide = useIde();
  const { s, set, exportData: d, m } = ide;
  const tabs: [Ide4, string, string, string][] = [["ir", "braces", "FOP-IR", "intermediário"], ["js", "file-code", "JavaScript", "FOP · state"], ["ts", "file-code", "TypeScript", "via IR"], ["py", "file-code", "Python", "via IR"]];
  const planName = m.plans.find(p => p.id === s.plan)?.name ?? "";
  const blocked = !d || d.blocked;
  const close = () => set({ exp: false });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="scrim" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal export" role="dialog" aria-label="Exportar" tabIndex={-1} ref={ref} onKeyDown={e => { if (e.key === "Escape") close(); }}>
        <div className="modal-h"><Icon n="file-code-2" /><h3>Exportar · {planName}</h3><span className="sp" /><button className="ib" aria-label="Fechar" onClick={close}><Icon n="x" /></button></div>
        <div className="b"><div className="chks">
          <div><h4 style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>Consistência</h4>
            <div className="chk ok"><Icon n="circle-check" /><div>Sem ciclo de estado</div></div>
            {d?.blocked ? <div className="chk fail"><Icon n="circle-x" /><div>Contexto incompleto<small>Compilação bloqueada</small></div></div> : <div className="chk ok"><Icon n="circle-check" /><div>Contexto completo</div></div>}
            {d?.missing.map(x => <div key={x.name + x.element} className="chk fail"><Icon n="circle-x" /><div>Entrada sem origem <span className="mono">{x.name}</span><small>{x.element}</small></div></div>)}
            {d?.orphans.map(o => <div key={o.name} className="chk warn"><Icon n="triangle-alert" /><div>Saída órfã <span className="mono">{o.name}</span><small>Exporta com aviso</small></div></div>)}</div>
          <div className="dest"><h4 style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 2 }}>Destino</h4>
            {tabs.map(([k, ic, n, sub]) => <button key={k} className={s.expTab === k ? "on" : ""} onClick={() => set({ expTab: k })}><Icon n={ic} />{n}<small>{sub}</small></button>)}
            <button disabled title="Fora da v1"><Icon n="file-x" />Go<small>não suportado em v1</small></button></div>
        </div><div className="code"><div className="ch"><Icon n="file" /><span className="mono">{d?.fileName ?? "…"}</span><span className="sp" />
          <button className="btn" disabled={!d} onClick={() => { void navigator.clipboard?.writeText(d?.code ?? ""); ide.toast("Código copiado", "copy"); }}><Icon n="copy" />Copiar</button>
          <button className="btn pri" disabled={blocked} onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([d!.code], { type: "text/plain" })); a.download = d!.fileName; a.click(); URL.revokeObjectURL(a.href); ide.toast(`${d!.fileName} baixado`, "download"); }}><Icon n="download" />Baixar</button></div>
          <pre>{d ? <Highlight code={d.code} /> : "Gerando…"}</pre></div></div>
      </div></div>
  );
}
type Ide4 = "ir" | "js" | "ts" | "py";

export function ConfirmDialog() {
  const ide = useIde();
  const { m, s, set } = ide;
  const ids = s.confirm ?? [], us = ids.map(i => m.u(i)).filter(Boolean);
  const n = new Set(us.flatMap(u => m.desc(u!.id).filter(k => !k.archived).map(k => k.id))).size;
  const name = us.length === 1 ? `“${us[0]!.title}”` : `${us.length} itens`;
  return (
    <div className="scrim" onClick={e => { if (e.target === e.currentTarget) set({ confirm: null }); }}>
      <div className="modal confirm" role="alertdialog" aria-label="Remover">
        <div className="modal-h"><h3>Remover {name}?</h3></div>
        <div className="b">{n ? <p>Também saem <b>{n} item{n > 1 ? "s" : ""} filho{n > 1 ? "s" : ""}</b>. A remoção vale no Flow e no Explorar.</p> : <p>A unidade sai do Flow e do Explorar.</p>}<p style={{ fontSize: 12, color: "var(--muted)" }}>Para guardar sem apagar, use Arquivar no detalhe.</p></div>
        <div className="f"><button className="btn" onClick={() => set({ confirm: null })}>Cancelar</button><button className="btn pri" autoFocus style={{ background: "var(--fail)", borderColor: "var(--fail)", color: "#fff" }} onClick={() => void ide.confirmRemove()}><Icon n="trash-2" />Remover</button></div></div></div>
  );
}

export function ContextMenu() {
  const ide = useIde();
  const { m, s, set } = ide;
  const c = s.ctx!, u = m.u(c.id);
  const It = ({ ic, n, k, danger, on }: { ic: string; n: string; k?: string; danger?: boolean; on: () => void }) => <button className={danger ? "danger" : ""} onClick={() => { set({ ctx: null }); on(); }}><Icon n={ic} />{n}{k && <kbd>{k}</kbd>}</button>;
  const path = () => "/" + m.path(c.id!).join("/");
  return (
    <div className="ctx" style={{ left: c.x, top: c.y }} role="menu">
      <It ic="workflow" n="Novo fluxo" on={() => void ide.newFlow()} /><It ic="box" n="Novo dado" on={() => void ide.newDado()} /><hr />
      {u && <>
        <It ic="pencil" n="Renomear" k="F2" on={() => set({ ren: u.id })} />
        <It ic="copy-plus" n="Duplicar" k="⌘D" on={() => void ide.dup(u.id)} />
        <It ic="scissors" n="Recortar" k="⌘X" on={() => { set({ clip: { mode: "cut", ids: [u.id] } }); ide.toast("Recortado. Cole no destino com ⌘V", "scissors"); }} />
        <It ic="copy" n="Copiar" k="⌘C" on={() => { set({ clip: { mode: "copy", ids: [u.id] } }); ide.toast("Copiado", "copy"); }} />
        {s.clip && <It ic="clipboard-paste" n="Colar" k="⌘V" on={() => void ide.paste(u.id)} />}
        <It ic="link" n="Copiar caminho" on={() => { void navigator.clipboard?.writeText(path()); ide.toast(`Caminho copiado: ${path()}`, "link"); }} /><hr />
        {!m.isFolder(u) && !m.isData(u) && <>
          {!m.isTopFn(u) && <It ic="between-horizontal-start" n="Elemento irmão acima" on={() => void ide.addFn(u.id, "before")} />}
          {!m.isTopFn(u) && <It ic="between-horizontal-end" n="Elemento irmão abaixo" on={() => void ide.addFn(u.id, "after")} />}
          <It ic="corner-down-right" n="Elemento filho" on={() => void ide.addFn(u.id, "child")} /><hr /></>}
        {!m.isFolder(u) && <><It ic="workflow" n="Abrir no Flow" on={() => { ide.select(u.id); set({ v: "flow" }); }} /><hr /></>}
        <It ic="trash-2" n="Remover" k="⌫" danger on={() => ide.askRemove([u.id])} /></>}
    </div>
  );
}
