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
/** Passo abstrato: nome, entradas, saídas e (opcional) quem executa. */
const step = (run: Run, parent: string, title: string, ins: string[] = [], outs: string[] = [], agent?: string, extra: Partial<{ par: boolean; catch: boolean }> = {}): string => {
  const id = run({ type: "addChild", id: parent, title, ...(extra.catch ? { catch: true } : {}) });
  for (const n of ins) run({ type: "addInput", id, name: n }); for (const n of outs) run({ type: "addOutput", id, name: n });
  if (agent) run({ type: "assign", id, agent });
  if (extra.par) run({ type: "setParallel", id, on: true });
  return id;
};
const lib = (run: Run, parent: string, agent: string, task: string, out?: string, args: Record<string, string> = {}): string => {
  const id = run({ type: "addChild", id: parent, title: task }); run({ type: "assign", id, agent }); run({ type: "setTask", id, task });
  for (const [k, v] of Object.entries(args)) run({ type: "setArg", id, name: k, value: v });
  if (out) run({ type: "renameData", id, to: out }); return id;
};

const BUILDERS: Record<string, () => DocExample> = {
  /** UC-01: novo fluxo — uma função `main`, source arquivo `main`. */
  "novo-fluxo": () => { const { p, run } = fresh(); const main = run({ type: "newFlow", title: "main" }); return { project: p(), flow: main }; },

  /** Sequência: cada passo começa quando o anterior termina; o dado de mesmo nome liga os passos. */
  sequencia: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Fazer pedido" });
    step(run, root, "Receber pedido", [], ["pedido"]); step(run, root, "Cobrar cliente", ["pedido"], ["pagamento"]); step(run, root, "Enviar produto", ["pedido", "pagamento"], ["envio"]);
    return { project: p(), flow: root };
  },

  /** Paralelo: as duas funções ocupam o mesmo estado. */
  paralelo: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Ativar cliente" });
    step(run, root, "Gerar credenciais", [], ["credenciais"]);
    step(run, root, "Agendar kickoff", [], ["kickoff"], "lia"); step(run, root, "Criar conta", [], ["conta"], undefined, { par: true });
    return { project: p(), flow: root };
  },

  /** Seleção: if com else. */
  selecao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Revisar proposta" });
    step(run, root, "Rascunhar proposta", [], ["proposta"], "lia");
    const rev = step(run, root, "Revisar proposta", ["proposta"], ["aprovada"], "ana");
    const send = step(run, root, "Enviar ao cliente", ["proposta"], ["envio"]);
    const w = run({ type: "wrap", id: send, kind: "if", test: "aprovada" }); void rev;
    run({ type: "addElse", id: w, title: "Pedir nova revisao" }); return { project: p(), flow: root };
  },

  /** Repetição: for … of. */
  repeticao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Traduzir proposta" });
    run({ type: "addInput", id: root, name: "idiomas" });
    const t = step(run, root, "Traduzir texto", ["idioma"], ["traducao"], "teo"); step(run, root, "Publicar traducoes", ["traducao"], [], undefined);
    run({ type: "wrap", id: t, kind: "for", v: "idioma", coll: "idiomas" });
    return { project: p(), flow: root };
  },

  /** try / catch: a função de tratamento é o catch. */
  trycatch: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Cobrar com seguranca" });
    const c = step(run, root, "Cobrar cliente", ["pedido"], ["pagamento"]); step(run, root, "Emitir recibo", ["pagamento"], ["recibo"]);
    run({ type: "wrap", id: c, kind: "try" }); return { project: p(), flow: root };
  },

  /** Paralelo entre uma composição e a função seguinte. */
  "paralelo-composicao": () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Preparar e avisar" });
    const c = step(run, root, "Preparar conta", [], ["conta"]); step(run, c, "Criar usuario", [], ["usuario"]);
    step(run, root, "Avisar time", [], ["aviso"], undefined, { par: true });
    return { project: p(), flow: root };
  },

  /** Composição: função com filhas (camadas). */
  composicao: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Fazer onboarding" });
    const a = step(run, root, "Preparar conta", [], ["conta"]); step(run, a, "Criar usuario", [], ["usuario"]); step(run, a, "Gerar senha", ["usuario"], ["credenciais"]);
    step(run, root, "Enviar boas-vindas", ["credenciais"], []);
    return { project: p(), flow: root };
  },

  /** Exemplo completo do livro / Flow Language: seleção + paralelo + repetição, com IA, pessoa e libs. */
  onboarding: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Fazer onboarding da Acme" });
    step(run, root, "Coletar dados do cliente", [], ["dados_cliente"]);
    step(run, root, "Rascunhar proposta", ["dados_cliente"], ["rascunho"], "lia");
    step(run, root, "Revisar proposta", ["rascunho"], ["proposta_aprovada"], "ana");
    const trad = step(run, root, "Traduzir proposta", ["proposta_aprovada", "idioma"], ["proposta_traduzida"], "teo");
    const ctr = step(run, root, "Gerar contrato", ["proposta_aprovada", "dados_cliente"], ["contrato"]);
    step(run, root, "Registrar auditoria", ["dados_cliente"], [], undefined, { par: true });
    const env = step(run, root, "Enviar ao cliente", ["proposta_traduzida", "contrato"], ["envio_id"]);
    run({ type: "wrap", id: trad, kind: "for", v: "idioma", coll: '["en", "es"]' });
    void ctr; void env; return { project: p(), flow: root };
  },

  /** Uma função só de libs do navegador (concretas), com valores e um if. */
  libs: () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title: "Aplicar cupom" });
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
    const s = samplesProject(), f = s.project.flows.find(x => x.title === id.slice(7));
    return f ? { project: s.project, flow: f.id } : null;
  }
  return BUILDERS[id]?.() ?? null;
}
