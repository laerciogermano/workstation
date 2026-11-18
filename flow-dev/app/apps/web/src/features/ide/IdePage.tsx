import { useEffect } from "react";
import type { Me } from "../../api/client";
import { Icon } from "../../ui/Icon";
import { TEMAS, setTema } from "../../ui/themes";
import { IdeProvider, useIde } from "./ide";
import { Explorer } from "../explorer/Explorer";
import { FlowView } from "../flow/FlowView";
import { CatalogView } from "../catalog/CatalogView";
import { Drawer } from "../panels/Drawer";
import { DadoPanel } from "../panels/DadoPanel";
import { AgentPanel } from "../panels/AgentPanel";
import { ModelPanel } from "../panels/ModelPanel";
import { ConfirmDialog, ContextMenu, ExportDialog } from "../panels/Dialogs";

export function IdePage({ projectId, user, onExit, onAccount }: { projectId: string; user: Me; onExit: () => void; onAccount: () => void }) {
  return <IdeProvider pid={projectId}><Shell user={user} onExit={onExit} onAccount={onAccount} /></IdeProvider>;
}

function Shell({ user, onExit, onAccount }: { user: Me; onExit: () => void; onAccount: () => void }) {
  const ide = useIde();
  const { m, s, set } = ide;
  const sel = s.sel ? m.u(s.sel) : undefined;
  const crumb = sel ? m.path(sel.id) : [];
  const tema = document.documentElement.dataset.tema;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if (e.key === "Escape") { if (s.ctx || s.edgeMenu) set({ ctx: null, edgeMenu: null }); else if (s.confirm) set({ confirm: null }); else if (s.exp) set({ exp: false }); else if (!typing) ide.closePanels(); return; }
      if (typing) return;
      const mod = e.metaKey || e.ctrlKey, u = sel;
      if (u && e.key === "F2") { e.preventDefault(); set({ ren: u.id }); return; }
      if (u && (e.key === "Delete" || (e.key === "Backspace" && mod))) { e.preventDefault(); ide.askRemove([u.id]); return; }
      if (u && mod && e.key.toLowerCase() === "c") { set({ clip: { mode: "copy", ids: [u.id] } }); ide.toast("Copiado", "copy"); }
      if (u && mod && e.key.toLowerCase() === "x") { set({ clip: { mode: "cut", ids: [u.id] } }); ide.toast("Recortado. Cole no destino com ⌘V", "scissors"); }
      if (mod && e.key.toLowerCase() === "v" && s.clip) { e.preventDefault(); void ide.paste(u?.id ?? null); }
      if (u && mod && e.key.toLowerCase() === "d") { e.preventDefault(); void ide.dup(u.id); }
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); set({ q: s.q == null ? "" : null }); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="win" data-win onClick={e => { if (s.ctx && !(e.target as HTMLElement).closest(".ctx")) set({ ctx: null }); }}>
      <header className="tb">
        <button className="proj-back" onClick={onExit} title="Voltar aos projetos"><Icon n="chevron-right" />Projetos</button>
        <span className="logo"><svg className="mark" viewBox="0 0 30 28" aria-hidden="true"><path d="M2 2h26v3.2l-2.2-1.6H4.2L2 5.2z" fill="var(--accent)" /><rect x="2" y="8" width="8" height="3.6" rx="1" fill="var(--accent)" /><rect x="2.6" y="13.6" width="6.8" height="2.8" rx=".8" fill="none" stroke="var(--accent)" strokeWidth="1.2" /><path d="M10 9.8H11V20H12M19.4 20H20.4V24.8H21.4" fill="none" stroke="var(--accent)" strokeWidth="1" strokeOpacity=".55" /><rect x="12.6" y="18.6" width="6.8" height="2.8" rx=".8" fill="none" stroke="var(--accent)" strokeWidth="1.2" /><rect x="21.6" y="23.4" width="6.8" height="2.8" rx=".8" fill="none" stroke="var(--accent)" strokeWidth="1.2" /></svg>{m.snap.project.name}</span>
        <span className="sp" />
        <span className="cmdk" role="button" tabIndex={0} onClick={() => set({ q: s.q == null ? "" : null })}><Icon n="search" />Buscar ou executar comando<kbd>⌘K</kbd></span>
        <span className="sp" />
        <span className="tb-temas" aria-label="Temas">{TEMAS.map(t => <button key={t.id} title={`Tema ${t.name}`} aria-label={`Tema ${t.name}`} aria-pressed={tema === t.id} onClick={() => { setTema(t.id); set({}); }}><span><i style={{ background: t.a }} /><i style={{ background: t.b }} /></span></button>)}</span>
        <button className="av" style={{ border: 0 }} onClick={onAccount} title={user.guest ? "Visitante · salvar com uma conta" : user.email ?? ""}>{user.guest ? "V" : user.name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}</button>
      </header>
      <div className="body">
        <Explorer />
        <section className="content">
          {s.v === "catalog"
            ? <div className="bar"><div className="crumb"><span>Configurações</span><Icon n="chevron-right" /><b>IAs e bibliotecas Node.js</b></div><div className="acts" /></div>
            : <div className="bar">
                <div className="crumb">{crumb.length ? crumb.map((p, i, a) => i === a.length - 1 ? <b key={i}>{p}</b> : <span key={i}>{p}<Icon n="chevron-right" /></span>) : <b>Flow IDE</b>}</div>
                <div className="acts">
                  {m.plans.length > 1 && <select aria-label="Plano" value={s.plan ?? ""} onChange={e => { const p = e.target.value; set({ plan: p, flowRoot: null, mach: null, drawer: null, sel: null }); }} style={{ height: 30, borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--paper)", padding: "0 8px", fontSize: 12 }}>{m.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
                  <button className="btn" onClick={() => void ide.runPlan()}><Icon n="play" />Executar</button>
                  <button className="btn pri" onClick={() => ide.openExport()}><Icon n="file-code-2" />Exportar</button></div></div>}
          <div className="viewport">
            {s.v === "catalog" ? <CatalogView /> : s.plan ? <FlowView /> : null}
            {s.drawer && <Drawer />}{s.agCfg && <AgentPanel />}{s.mdCfg && <ModelPanel />}{s.dadoEdit && <DadoPanel />}
          </div>
        </section>
      </div>
      {s.ctx && <ContextMenu />}{s.confirm && <ConfirmDialog />}{s.exp && <ExportDialog />}
    </div>
  );
}
