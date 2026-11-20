import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";
import { samplesProject } from "./sample";

/**
 * Exemplos da documentação (`fop-docs.html`): cada um é um projeto pequeno, montado só com comandos (os mesmos do editor),
 * aberto pelo próprio FOP em modo incorporado: `flow-novo.html?demo=<id>`.
 */
export interface DocExample { project: Project; flow: string }

const fresh = (): { p: () => Project; run: (c: Command) => string } => {
  let p = emptyProject("Docs"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  return { p: () => p, run: c => { const r = apply(p, c); p = r.project; return r.created ?? ""; } };
};

type Run = (c: Command) => string;
/** Passo abstrato: nome lowerCamelCase, entradas, saídas e (opcional) quem executa. */
const step = (run: Run, parent: string, title: string, ins: string[] = [], outs: string[] = [], agent?: string, extra: Partial<{ par: boolean; catch: boolean }> = {}): string => {
  const id = run({ type: "addChild", id: parent, title, ...(extra.catch ? { catch: true } : {}) });
  for (const n of ins) run({ type: "addInput", id, name: n }); for (const n of outs) run({ type: "addOutput", id, name: n });
  if (agent) run({ type: "assign", id, agent });
  if (extra.par) run({ type: "setParallel", id, on: true });
  return id;
};
const lib = (run: Run, parent: string, agent: string, task: string, out?: string, args: Record<string, string> = {}): string => {
  const id = run({ type: "addChild", id: parent }); run({ type: "assign", id, agent }); run({ type: "setTask", id, task });
  for (const [k, v] of Object.entries(args)) run({ type: "setArg", id, name: k, value: v });
  if (out) run({ type: "renameData", id, to: out }); return id;
};

const BUILDERS: Record<string, () => DocExample> = {
  /** UC-01: novo fluxo — uma função `main`, source arquivo `main`. */
  "novo-fluxo": () => { const { p, run } = fresh(); const main = run({ type: "newFlow", title: "main" }); return { project: p(), flow: main }; },

  /** Sequência: cada passo começa quando o anterior termina; o dado de mesmo nome liga os passos. */
  sequencia: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "fazerPedido" });
    step(run, root, "receberPedido", [], ["pedido"]); step(run, root, "cobrarCliente", ["pedido"], ["pagamento"]); step(run, root, "enviarProduto", ["pedido", "pagamento"], ["envio"]);
    return { project: p(), flow: root };
  },

  /** Paralelo: as duas funções ocupam o mesmo estado. */
  paralelo: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "ativarCliente" });
    step(run, root, "gerarCredenciais", [], ["credenciais"]);
    step(run, root, "agendarKickoff", [], ["kickoff"], "lia"); step(run, root, "criarConta", [], ["conta"], undefined, { par: true });
    return { project: p(), flow: root };
  },

  /** Seleção: if com else. */
  selecao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "revisarProposta" });
    step(run, root, "rascunharProposta", [], ["proposta"], "lia");
    const rev = step(run, root, "revisarComAna", ["proposta"], ["aprovada"], "ana");
    const send = step(run, root, "enviarAoCliente", ["proposta"], ["envio"]);
    const w = run({ type: "wrap", id: send, kind: "if", test: "aprovada" }); void rev;
    run({ type: "addElse", id: w, title: "pedirNovaRevisao" }); return { project: p(), flow: root };
  },

  /** Repetição: for … of. */
  repeticao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "traduzirProposta" });
    run({ type: "addInput", id: root, name: "idiomas" });
    const t = step(run, root, "traduzirTexto", ["idioma"], ["traducao"], "teo"); step(run, root, "publicarTraducoes", ["traducao"], [], undefined);
    run({ type: "wrap", id: t, kind: "for", v: "idioma", coll: "idiomas" });
    return { project: p(), flow: root };
  },

  /** try / catch: a função de tratamento é o catch. */
  trycatch: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "cobrarComSeguranca" });
    const c = step(run, root, "cobrarCliente", ["pedido"], ["pagamento"]); step(run, root, "emitirRecibo", ["pagamento"], ["recibo"]);
    run({ type: "wrap", id: c, kind: "try" }); return { project: p(), flow: root };
  },

  /** Paralelo entre uma composição e a função seguinte. */
  "paralelo-composicao": () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "prepararEAvisar" });
    const c = step(run, root, "prepararConta", [], ["conta"]); step(run, c, "criarUsuario", [], ["usuario"]);
    step(run, root, "avisarTime", [], ["aviso"], undefined, { par: true });
    return { project: p(), flow: root };
  },

  /** Composição: função com filhas (camadas). */
  composicao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "fazerOnboarding" });
    const a = step(run, root, "prepararConta", [], ["conta"]); step(run, a, "criarUsuario", [], ["usuario"]); step(run, a, "gerarSenha", ["usuario"], ["credenciais"]);
    step(run, root, "enviarBoasVindas", ["credenciais"], []);
    return { project: p(), flow: root };
  },

  /** Exemplo completo do livro / Flow Language: seleção + paralelo + repetição, com IA, pessoa e libs. */
  onboarding: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "fazerOnboardingDaAcme" });
    step(run, root, "coletarDadosDoCliente", [], ["dados_cliente"]);
    step(run, root, "rascunharProposta", ["dados_cliente"], ["rascunho"], "lia");
    step(run, root, "revisarProposta", ["rascunho"], ["proposta_aprovada"], "ana");
    const trad = step(run, root, "traduzirProposta", ["proposta_aprovada", "idioma"], ["proposta_traduzida"], "teo");
    const ctr = step(run, root, "gerarContrato", ["proposta_aprovada", "dados_cliente"], ["contrato"]);
    step(run, root, "registrarAuditoria", ["dados_cliente"], [], undefined, { par: true });
    const env = step(run, root, "enviarAoCliente", ["proposta_traduzida", "contrato"], ["envio_id"]);
    run({ type: "wrap", id: trad, kind: "for", v: "idioma", coll: '["en", "es"]' });
    void ctr; void env; return { project: p(), flow: root };
  },

  /** Uma função só de libs do navegador (concretas), com valores e um if. */
  libs: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "aplicarCupom" });
    run({ type: "addInput", id: root, name: "price" }); run({ type: "setArg", id: root, name: "price", value: "250" });
    run({ type: "addInput", id: root, name: "percent" }); run({ type: "setArg", id: root, name: "percent", value: "15" });
    lib(run, root, "math", "round", "total", { value: "price * (100 - percent) / 100" });
    const log = lib(run, root, "console", "log", undefined, { text: "`Coupon ${percent}% off: ${price} -> ${total}`" });
    run({ type: "wrap", id: log, kind: "if", test: "percent > 0" });
    return { project: p(), flow: root };
  },
};

export const DOC_EXAMPLE_IDS = Object.keys(BUILDERS);

/** `id`: um dos exemplos acima, ou `sample:<nome>` para uma função do arquivo `samples.ts`. */
export function docExample(id: string): DocExample | null {
  if (id.startsWith("sample:")) {
    const title = id.slice(7), p = samplesProject().project, flow = p.flows.find(f => f.title === title);
    return flow ? { project: p, flow: flow.id } : null;
  }
  return BUILDERS[id]?.() ?? null;
}
