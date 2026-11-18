import type { AgentDto, ElementDto, FlowModel, RunStatus } from "@flow/shared";
import { TYPE_INFO } from "@flow/shared";
import { Icon } from "./Icon";

export const ST: Record<RunStatus, [string, string, string]> = {
  pendente: ["pendente", "circle-dashed", "pendente"], exec: ["exec", "loader-circle", "em execução"], ok: ["ok", "check", "concluída"],
  fail: ["fail", "circle-x", "falhou"], cancel: ["cancel", "ban", "cancelada"], wait: ["wait", "hourglass", "aguardando pessoa"],
};
export const StBadge = ({ st }: { st: RunStatus | null }) => (st ? <span className={"st " + ST[st][0]}><Icon n={ST[st][1]} />{ST[st][2]}</span> : null);
export const initials = (name?: string): string => String(name || "?").trim().split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export function Face({ a, lg }: { a?: AgentDto; lg?: boolean }) {
  if (!a) return <span className="face none" title="Sem responsável"><Icon n="plus" /></span>;
  return (
    <span className={`face ${a.kind}${lg ? " lg" : ""}`} title={`${TYPE_INFO[a.kind].one}: ${a.name}`}>
      {a.photoUrl ? <img src={a.photoUrl} alt="" /> : initials(a.name)}
      {a.kind === "ia" && <span className="ia-mark" title="Agente de IA"><Icon n="bot" /></span>}
    </span>
  );
}
export function AgChip({ a, short }: { a?: AgentDto; short?: boolean }) {
  if (!a) return <span className="ag none"><span className="ico"><Icon n="plus" /></span>{short ? "" : "Sem responsável"}</span>;
  return <span className={"ag " + a.kind} title={`${TYPE_INFO[a.kind].one}: ${a.name}`}><Face a={a} />{short ? "" : a.name}</span>;
}
export function FnIcon({ m, u }: { m: FlowModel; u: ElementDto }) {
  if (u.kind === "folder") return <span className="fi folder"><Icon n="folder" /></span>;
  const comp = m.kids(u.id).some(k => !m.isData(k)), ok = m.fnFilled(u);
  const cls = ok ? " ok" : comp ? " pend" : "";
  const tip = ok ? (comp ? "Composição sólida · todas as funções preenchidas" : "Função sólida · responsável definido") : comp ? "Falta preencher: alguma função filha está sem responsável" : "Função abstrata · sem responsável";
  return <span className={"fi plan" + cls} title={tip}><Icon n="circle" /></span>;
}
export const brandOf = (m: FlowModel, a?: AgentDto): string => (!a ? "" : a.kind === "maquina" ? "#5FA04E" : a.kind === "ia" ? m.modelOf(a.modelId)?.color ?? "" : "");
export function Mark({ q, text }: { q: string; text: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}
