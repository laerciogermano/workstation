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

  // ───────── Conceitos do livro (fop-conceitos.html): um exemplo por conceito/variante, mesmo formato do PDF ─────────
  ...conceitos(),

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

/** Um projeto `f` com entradas/saídas e passos; `abs` = entradas sem valor (abstratas), `init` = entradas inicializadas (concretas). */
function conceitos(): Record<string, () => DocExample> {
  const mk = (build: (run: Run, root: string) => void, title = "f"): (() => DocExample) => () => {
    const { p, run } = fresh(); const root = run({ type: "newFlow", title }); build(run, root); return { project: p(), flow: root };
  };
  const ins = (run: Run, id: string, names: string[], init: Record<string, string> = {}): void => { for (const n of names) { run({ type: "addInput", id, name: n }); if (init[n] !== undefined) run({ type: "setArg", id, name: n, value: init[n]! }); } };
  const outs = (run: Run, id: string, names: string[]): void => { for (const n of names) run({ type: "addOutput", id, name: n }); };
  /** Função concreta vinda de um arquivo `.ts` (o import do livro). */
  const fromFile = (run: Run, parent: string, title: string, i: string[] = [], o: string[] = []): string => {
    const src = run({ type: "newFlow", title, file: `${title}.ts` }); ins(run, src, i); outs(run, src, o);
    const id = run({ type: "addChild", id: parent }); run({ type: "assign", id, agent: `file:${title}.ts` }); return id;
  };
  return {
    c01: mk((run, r) => { ins(run, r, ["a"]); }),
    c02a: mk((run, r) => { ins(run, r, ["a"]); }),
    c02b: mk((run, r) => { ins(run, r, ["a"], { a: '"texto"' }); }),
    c03a: mk((run, r) => { ins(run, r, ["a", "b"]); }),
    c03b: mk((run, r) => { step(run, r, "criarA", [], ["a"]); step(run, r, "criarB", [], ["b"], undefined, { par: true }); }),
    c04: mk((run, r) => { outs(run, r, ["a"]); }),
    c05a: mk(() => { /* sem entrada nem saída */ }),
    c05b: mk((run, r) => { ins(run, r, ["a"]); }),
    c05c: mk((run, r) => { ins(run, r, ["a"]); outs(run, r, ["a"]); }),
    c05e: mk((run, r) => { ins(run, r, ["a", "b", "c"]); outs(run, r, ["a", "b", "c"]); }),
    c06a: mk((run, r) => { lib(run, r, "crypto", "randomUUID", "uuid"); }, "gerarId"),
    c06b: mk((run, r) => { ins(run, r, ["a"], { a: '"texto"' }); lib(run, r, "console", "log", undefined, { text: "a" }); }),
    c07a: mk((run, r) => { ins(run, r, ["a"]); }),
    c07b: mk((run, r) => { step(run, r, "f1", [], []); }),
    c07c: mk((run, r) => { step(run, r, "f1", [], [], "lia"); step(run, r, "f2", [], [], "ana"); }),
    c08a: mk((run, r) => { ins(run, r, ["a"]); }),
    c08b: mk((run, r) => { step(run, r, "f1", [], []); }),
    c09a: mk((run, r) => { outs(run, r, ["a"]); }),
    c09b: mk((run, r) => { outs(run, r, ["f1"]); }),
    c10: mk((run, r) => { step(run, r, "f1", [], []); step(run, r, "f2", [], []); }),
    c11: mk((run, r) => { step(run, r, "f1", [], []); step(run, r, "f2", [], [], undefined, { par: true }); }),
    c12: mk((run, r) => {
      const f1 = step(run, r, "f1", [], ["a"]); void f1; const f2 = step(run, r, "f2", ["a"], []);
      run({ type: "wrap", id: f2, kind: "if", test: "a" });
    }),
    c13: mk((run, r) => {
      ins(run, r, ["itens"]); const f1 = step(run, r, "f1", ["item"], []);
      run({ type: "wrap", id: f1, kind: "for", v: "item", coll: "itens" });
    }),
    c14: mk((run, r) => {
      ins(run, r, ["a"], { a: '""' });
      const f1 = fromFile(run, r, "f1", ["a"], ["b"]); const f2 = fromFile(run, r, "f2", ["a"], ["c"]); void f1;
      run({ type: "setParallel", id: f2, on: true });
      const again = step(run, r, "g", ["a"], []); run({ type: "wrap", id: again, kind: "if", test: "b && c" });
    }),
    c15: mk((run, r) => {
      ins(run, r, ["a"]);
      fromFile(run, r, "f1", ["a"], ["b"]); const f2 = step(run, r, "f2", ["a"], ["c"], undefined, { par: true }); void f2;
      const again = step(run, r, "g", ["a"], []); run({ type: "wrap", id: again, kind: "if", test: "b && c" });
    }),
    c16: mk((run, r) => { ins(run, r, ["a"]); step(run, r, "f2", ["a"], ["c"]); }),
    c17a: mk((run, r) => { ins(run, r, ["a"]); step(run, r, "f2", ["a"], ["c"]); }),
    c17b: mk((run, r) => { ins(run, r, ["a"], { a: "2.5" }); lib(run, r, "math", "round", "c", { value: "a" }); }),
    c18a: mk((run, r) => { ins(run, r, ["a"]); step(run, r, "f2", ["a"], ["c"]); }),
    c18b: mk((run, r) => { ins(run, r, ["a"], { a: "2.5" }); }, "camadaB"),
    c18c: mk((run, r) => { ins(run, r, ["a"], { a: "2.5" }); step(run, r, "f2", ["a"], ["c"]); }, "camadaAB"),
    c19a: mk((run, r) => { ins(run, r, ["a"]); step(run, r, "f2", ["a"], ["c"]); }),
    c19b: mk((run, r) => { ins(run, r, ["a"], { a: "2.5" }); lib(run, r, "math", "round", "c", { value: "a" }); lib(run, r, "console", "log", undefined, { text: "c" }); }),
    c20: mk((run, r) => {
      ins(run, r, ["a"], { a: "2.5" }); lib(run, r, "math", "round", "c", { value: "a" });
      step(run, r, "g", ["c"], ["d"]);
    }),
  };
}
