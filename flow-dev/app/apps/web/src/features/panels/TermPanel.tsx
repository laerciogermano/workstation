import { Icon } from "../../ui/Icon";
import { useIde } from "../ide/ide";

/** Terminal global: logs de Executar / runMachine (barra inferior). */
export function TermPanel() {
  const { s, set, clearTerm } = useIde();
  if (!s.termOpen) return null;
  return (
    <section className="term" aria-label="Terminal">
      <header>
        <Icon n="terminal" /><b>Terminal</b><span className="sp" />
        <button className="ib" title="Limpar" onClick={() => clearTerm()}><Icon n="trash-2" /></button>
        <button className="ib" title="Fechar" onClick={() => set({ termOpen: false })}><Icon n="x" /></button>
      </header>
      <div className="term-b" data-term>
        {s.termLines.length
          ? s.termLines.map((l, i) => <div key={i}><span className={l.kind === "dim" || l.kind === "cmd" ? "dim" : l.kind === "ok" ? "ok" : l.kind === "er" ? "er" : undefined}>{l.text}</span></div>)
          : <span className="dim">Terminal pronto. Execute um projeto para ver os logs aqui.</span>}
      </div>
    </section>
  );
}
