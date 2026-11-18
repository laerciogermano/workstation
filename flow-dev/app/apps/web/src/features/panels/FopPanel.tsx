import { camel } from "@flow/shared";
import { Icon } from "../../ui/Icon";
import { useIde } from "../ide/ide";

export function FopPanel() {
  const { m, s } = useIde();
  const plan = s.plan!;
  const { prod, orphans, missing } = m.fopCheck(plan);
  const { rows, ia, libs, ext } = m.fopLayers(plan);
  const arts = Object.entries(prod);
  const cons = (n: string) => m.ganttRows(plan).filter(({ u }) => !m.isData(u) && u.ins.includes(n)).map(r => r.u.title);
  const by = (a: { id: string }) => rows.filter(u => u.agentId === a.id).map(u => u.title).join(", ");
  const planName = m.plans.find(p => p.id === plan)?.name ?? "plano";
  return (
    <aside className="fop">
      <div><h4><Icon n="play" />Contexto</h4>
        {missing.length ? <div className="chk fail"><Icon n="circle-x" /><div>Contexto incompleto<small>A execução só ocorre quando o contexto está completo.</small></div></div>
          : <div className="chk ok"><Icon n="circle-check" /><div>Contexto completo<small>Diferentes camadas formam o contexto; o fluxo pode executar.</small></div></div>}
        <pre className="sig" style={{ marginTop: 8 }}><span className="k">await</span> <span className="f">{camel(planName)}</span>({"{"}{"\n"}{ia.map(a => `  ${camel(a.name)}: agents.ia("${a.name}"),\n`).join("")}{ext.map(n => `  ${n}: /* entrada */,\n`).join("")}{"}"});</pre></div>
      <div><h4><Icon n="layers" />Camadas · unidades substituíveis</h4><div style={{ marginTop: 8 }}>
        {ia.length > 0 && <div className="layer"><b><Icon n="bot" />IA · endereço abstrato</b><span>Chega pelo contexto (<span className="mono">state.{ia.map(a => camel(a.name)).join(", ")}</span>). Trocar Claude por GPT não reescreve o fluxo.{ia.map(a => <span key={a.id}><br /><b style={{ display: "inline" }}>{a.name}</b>: {by(a)}</span>)}</span></div>}
        {libs.length > 0 && <div className="layer"><b><Icon n="package" />Node.js · endereço concreto</b><span>Importado pela função (<span className="mono">{libs.map(a => a.name).join(", ")}</span>). Mesma camada de quem conhece o endereço.{libs.map(a => <span key={a.id}><br /><b style={{ display: "inline" }}>{a.name}</b>: {by(a)}</span>)}</span></div>}
        <div className="layer"><b><Icon n="arrow-down-to-line" />Entradas</b><span>Toda entrada forma uma camada. {ext.length ? <>Externas: <span className="mono">{ext.join(", ")}</span>.</> : "Nenhuma entrada externa: tudo é produzido dentro do fluxo."}</span></div></div></div>
      <div><h4><Icon n="shield-check" />Validação</h4>
        <div className="chk ok"><Icon n="circle-check" /><div>Sem ciclo de estado<small>Repetição só por seleção explícita (if → volta)</small></div></div>
        {orphans.length ? orphans.map(([n, u]) => <div key={n} className="chk warn"><Icon n="triangle-alert" /><div>Saída órfã <span className="mono">{n}</span><small>{u.title} produz e ninguém consome. Aviso, não bloqueia.</small></div></div> ) : <div className="chk ok"><Icon n="circle-check" /><div>Toda saída tem destino</div></div>}
        {missing.map(([n, u]) => <div key={n + u.id} className="chk fail"><Icon n="circle-x" /><div>Entrada sem origem <span className="mono">{n}</span><small>{u.title} só executa com o contexto completo.</small></div></div>)}</div>
      <div><h4><Icon n="database" />Dados · {arts.length}</h4><div style={{ marginTop: 8 }}>{arts.map(([n, u]) => { const c = cons(n); return <div key={n} className={"art" + (!c.length && orphans.some(o => o[0] === n) ? " orphan" : "")}><span className="mono">{n}</span><span>de</span>{u.title}<span>para</span>{c.length ? c.join(", ") : "—"}</div>; })}</div></div>
    </aside>
  );
}
