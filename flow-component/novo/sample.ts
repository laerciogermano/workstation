import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";

/** Projeto de partida: `main` (o projeto novo, só a raiz) e `fazer_onboarding` (exemplo do Flow IDE: for, if, paralelo, libs, IA). */
export function sampleProject(): { project: Project; main: string; onboarding: string } {
  let p = emptyProject("Novo projeto"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  const onb = run({ type: "newFlow", title: "fazer_onboarding" });
  const kid = (t: string): string => run({ type: "addChild", id: onb, title: t });
  const get = kid("get"), redigir = kid("redigir_proposta"), revisar = kid("revisar_proposta"), traduzir = kid("traduzir"), gerar = kid("gerar_contrato"), post = kid("post"), get2 = kid("get");
  for (const [id, agent] of [[get, "http"], [redigir, "lia"], [revisar, "davi"], [traduzir, "teo"], [gerar, "lia"], [post, "http"], [get2, "http"]] as const) run({ type: "assign", id, agent });
  run({ type: "setTask", id: get, task: "get" }); run({ type: "setTask", id: post, task: "post" }); run({ type: "setTask", id: get2, task: "get" });
  const io = (id: string, ins: string[], outs: string[]): void => { ins.forEach(name => run({ type: "addInput", id, name })); outs.forEach(name => run({ type: "addOutput", id, name })); };
  io(get, [], ["dados_cliente"]); io(redigir, ["dados_cliente"], ["rascunho"]); io(revisar, ["rascunho"], ["proposta_aprovada"]);
  io(traduzir, ["proposta_aprovada"], ["propostas"]); io(gerar, ["proposta_aprovada", "dados_cliente"], ["pacote_contrato"]);
  io(post, ["propostas", "pacote_contrato"], ["envio_id"]); io(get2, ["envio_id"], ["crm_registro"]);
  run({ type: "setParallel", id: gerar, on: true });
  // if (proposta_aprovada) { for idioma { traduzir ∥ gerar_contrato }; for idioma { post } } senão volta a redigir
  const ifId = run({ type: "wrap", id: traduzir, kind: "if", test: "proposta_aprovada" });
  run({ type: "setIf", id: ifId, test: "proposta_aprovada", elseTo: redigir });
  run({ type: "setScope", id: ifId, count: 2 });
  const forA = run({ type: "wrap", id: traduzir, kind: "for", v: "idioma", coll: '["en", "es"]' });
  run({ type: "setScope", id: forA, count: 2 });
  run({ type: "setScope", id: ifId, count: 2 });
  run({ type: "wrap", id: post, kind: "for", v: "idioma", coll: '["en", "es"]' });
  return { project: p, main, onboarding: onb };
}
