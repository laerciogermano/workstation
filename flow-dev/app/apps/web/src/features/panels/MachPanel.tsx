import { useState } from "react";
import { Icon } from "../../ui/Icon";
import { AgChip } from "../../ui/parts";
import { useIde } from "../ide/ide";

const LIBS = ["node:fs", "node:http", "node:path", "node:crypto", "node:stream", "node:console"];

export function MachPanel() {
  const ide = useIde();
  const u = ide.m.u(ide.s.mach); if (!u) return null;
  return <Editor key={u.id} id={u.id} />;
}
function Editor({ id }: { id: string }) {
  const ide = useIde();
  const { m, s, set } = ide;
  const u = m.u(id)!;
  const [code, setCode] = useState(u.code ?? `// ${u.title} · Node.js\nimport fs from "node:fs";\n\nconsole.log("olá");`);
  const lines = code.split("\n").length;
  const save = () => { if (code !== (u.code ?? "")) void ide.patchEl(u.id, { code }); };
  return (
    <div className="mach"><div className="mach-ed">
      <div className="mach-h"><Icon n="code-xml" /><b>{u.title}</b><AgChip a={m.agent(u.agentId)} />
        <span className="libs">{LIBS.map(l => <span key={l} className={code.includes(l) ? "on" : ""}>{l.replace("node:", "")}</span>)}</span><span className="libs"><span>for</span><span>while</span></span><span className="sp" />
        <button className="btn" onClick={save}><Icon n="check" />Salvar</button>
        <button className="btn pri" onClick={() => { save(); void ide.runMachine(u.id, code); }}><Icon n="play" />Executar</button>
        <button className="ib" aria-label="Fechar" onClick={() => { save(); set({ mach: null, console: null }); }}><Icon n="x" /></button></div>
      <div className="editor"><div className="ln">{Array.from({ length: Math.max(lines, 12) }, (_, i) => i + 1).join("\n")}</div>
        <textarea spellCheck={false} rows={Math.max(lines, 12)} aria-label="Código" value={code} onChange={e => setCode(e.target.value)} onBlur={save}
          onKeyDown={e => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, p = t.selectionStart; setCode(code.slice(0, p) + "  " + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = p + 2; }); } }} /></div></div>
      <div className="mach-io">
        <div className="io"><h5>Entradas</h5>{u.ins.length ? u.ins.map(n => <div key={n}><Icon n="arrow-down-to-line" /><span className="mono">entrada.{n}</span></div>) : <div style={{ color: "var(--muted)" }}>nenhuma</div>}</div>
        <div className="io"><h5>Saídas</h5>{u.outs.length ? u.outs.map(([n, r]) => <div key={n}><Icon n="arrow-up-from-line" /><span className="mono">saida.{n}</span><span className="ref">{r}</span></div>) : <div style={{ color: "var(--muted)" }}>nenhuma</div>}</div>
        <div className="console">{s.console === null ? <span className="dim">Console Node (ambiente simulado, sem rede). Executar roda só esta etapa, com as entradas atuais.</span> : s.console.map((l, i) => <div key={i}><span className={l.kind === "dim" || l.kind === "cmd" ? "dim" : l.kind === "ok" ? "ok" : l.kind === "er" ? "er" : undefined}>{l.text}</span></div>)}</div>
      </div></div>
  );
}
