import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";

/** Projeto de partida: `main` (o projeto novo, só a raiz) e `onboarding` (exemplo do Flow IDE: for, if/else, paralelo, libs do navegador com contrato, IA). */
export function sampleProject(): { project: Project; main: string; onboarding: string } {
  let p = emptyProject("New project"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  const onb = run({ type: "newFlow", title: "onboarding" });
  const kid = (t: string): string => run({ type: "addChild", id: onb, title: t });
  const get = kid("get"), redigir = kid("draft_proposal"), revisar = kid("review_proposal"), translate = kid("translate"), gerar = kid("generate_contract"), post = kid("post"), get2 = kid("get");
  for (const [id, agent] of [[redigir, "lia"], [revisar, "davi"], [translate, "teo"], [gerar, "lia"]] as const) run({ type: "assign", id, agent });
  // libs do navegador: o contrato já traz as entradas (abstratas até preencher) e a saída; o nome da saída liga a próxima função
  run({ type: "assign", id: get, agent: "web" }); run({ type: "setTask", id: get, task: "fetch" }); run({ type: "setArg", id: get, name: "url", value: '"https://api.example.com/customers/42"' }); run({ type: "renameData", id: get, to: "customer_data" });
  run({ type: "assign", id: post, agent: "web" }); run({ type: "setTask", id: post, task: "fetch" }); run({ type: "setArg", id: post, name: "url", value: '"https://api.example.com/shipments"' });
  run({ type: "setArg", id: post, name: "options", value: "{ method: \"POST\", body: JSON.stringify({ proposals, contract_package }) }" }); run({ type: "renameData", id: post, to: "shipment_id" });
  run({ type: "assign", id: get2, agent: "web" }); run({ type: "setTask", id: get2, task: "fetch" }); run({ type: "setArg", id: get2, name: "url", value: "`https://api.example.com/shipments/${shipment_id}`" }); run({ type: "renameData", id: get2, to: "crm_record" });
  const io = (id: string, ins: string[], outs: string[]): void => { ins.forEach(name => run({ type: "addInput", id, name })); outs.forEach(name => run({ type: "addOutput", id, name })); };
  io(redigir, ["customer_data"], ["draft"]); io(revisar, ["draft"], ["proposal_approved"]); io(translate, ["proposal_approved"], ["proposals"]); io(gerar, ["proposal_approved", "customer_data"], ["contract_package"]);
  run({ type: "setParallel", id: gerar, on: true });
  // if (proposal_approved) { for language { translate ∥ generate_contract }; for language { post } } else { reject_proposal }
  const ifId = run({ type: "wrap", id: translate, kind: "if", test: "proposal_approved" });
  const rej = run({ type: "addElse", id: ifId, title: "reject_proposal" }); run({ type: "assign", id: rej, agent: "lia" }); run({ type: "addInput", id: rej, name: "proposal_approved" });
  run({ type: "setScope", id: ifId, count: 2 });
  const forA = run({ type: "wrap", id: translate, kind: "for", v: "language", coll: '["en", "es"]' });
  run({ type: "setScope", id: forA, count: 2 });
  run({ type: "setScope", id: ifId, count: 2 });
  run({ type: "wrap", id: post, kind: "for", v: "language", coll: '["en", "es"]' });
  return { project: p, main, onboarding: onb };
}
