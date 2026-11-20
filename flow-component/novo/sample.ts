import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";

/** Projeto de partida: Hello World. `main` já tem um passo que escreve “Hello World” no Terminal (console.log). */
export function sampleProject(): { project: Project; main: string } {
  let p = emptyProject("New project"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  const log = run({ type: "addChild", id: main, title: "log" });
  run({ type: "assign", id: log, agent: "console" }); run({ type: "setTask", id: log, task: "log" }); run({ type: "setArg", id: log, name: "text", value: '"Hello World"' });
  return { project: p, main };
}

/** Projeto só com o arquivo `samples.ts` (não é o padrão): vira `fop-samples.json` no build, para abrir com Open, e alimenta a documentação. */
export function samplesProject(): { project: Project } {
  let p = emptyProject("Samples"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  addSamples(run);
  return { project: p };
}

/**
 * Arquivo `samples.ts`: tarefas comuns de front-end montadas só com as libs do navegador (sem instalar nada).
 * Cada função tem entradas com valor de exemplo — é só abrir e clicar em Run.
 */
/** Títulos das funções do `samples.ts` (para limpar projetos salvos quando os samples ainda eram o padrão). */
export const SAMPLE_TITLES = ["newId", "formatPrice", "applyCoupon", "clamp", "retryDelay", "basicAuthHeader", "readSession", "snapshotState", "isAdult", "measureAction", "fetchUser"];

export function addSamples(run: (c: Command) => string): void {
  const FILE = "samples.ts";
  /** Cria a função `title` com entradas de exemplo; `steps` monta os passos; `outs` são os dados que ela devolve. */
  const fn = (title: string, ins: Record<string, string>, outs: string[], steps: (step: Step) => void): string => {
    const id = run({ type: "newFlow", title, file: FILE });
    for (const [name, value] of Object.entries(ins)) { run({ type: "addInput", id, name }); run({ type: "setArg", id, name, value }); }
    for (const name of outs) run({ type: "addOutput", id, name });
    steps((lib, task, out, args = {}) => {
      const sid = run({ type: "addChild", id, title: task }); run({ type: "assign", id: sid, agent: lib }); run({ type: "setTask", id: sid, task });
      for (const [name, value] of Object.entries(args)) run({ type: "setArg", id: sid, name, value });
      if (out) run({ type: "renameData", id: sid, to: out }); return sid;
    });
    return id;
  };
  type Step = (lib: string, task: string, out?: string, args?: Record<string, string>) => string;
  const ifThen = (id: string, test: string): void => { run({ type: "wrap", id, kind: "if", test }); };

  // 1. Identificador único para itens novos (chave de lista, id de pedido, id de formulário)
  fn("newId", {}, ["id"], s => { s("crypto", "randomUUID", "id"); });

  // 2. Preço em reais para mostrar na tela (R$ 1999,90)
  fn("formatPrice", { amount: "1999.9" }, [], s => {
    s("math", "round", "cents", { value: "amount * 100" });
    s("console", "log", undefined, { text: "`R$ ${(cents / 100).toFixed(2).replace(\".\", \",\")}`" });
  });

  // 3. Preço com desconto de cupom (só mostra se o desconto for maior que zero)
  fn("applyCoupon", { price: "250", percent: "15" }, ["total"], s => {
    s("math", "round", "total", { value: "price * (100 - percent) / 100" });
    ifThen(s("console", "log", undefined, { text: "`Coupon ${percent}% off: ${price} -> ${total}`" }), "percent > 0");
  });

  // 4. Manter o valor dentro de uma faixa (volume, zoom, quantidade no carrinho)
  fn("clamp", { value: "130", low: "0", high: "100" }, ["clamped"], s => {
    s("math", "max", "atLeastLow", { a: "low", b: "value" });
    s("math", "min", "clamped", { a: "high", b: "atLeastLow" });
    s("console", "log", undefined, { text: "`${value} -> ${clamped}`" });
  });

  // 5. Espera exponencial entre tentativas de uma chamada que falhou (1s, 2s, 4s... até 30s)
  fn("retryDelay", { attempt: "3" }, ["delay"], s => {
    s("math", "pow", "seconds", { base: "2", exponent: "attempt" });
    s("math", "min", "delay", { a: "seconds", b: "30" });
    s("console", "log", undefined, { text: "`Try again in ${delay}s (attempt ${attempt})`" });
  });

  // 6. Cabeçalho Authorization do login (Basic) em base64
  fn("basicAuthHeader", { user: "\"ana\"", password: "\"1234\"" }, ["token"], s => {
    s("web", "btoa", "token", { text: "user + \":\" + password" });
    s("console", "log", undefined, { text: "`Authorization: Basic ${token}`" });
  });

  // 7. Ler a sessão guardada no navegador (base64 de um JSON) e dar boas-vindas
  fn("readSession", { session: "btoa('{\"name\":\"Ana\",\"role\":\"admin\"}')" }, ["user"], s => {
    s("web", "atob", "raw", { text: "session" });
    s("json", "parse", "user", { text: "raw" });
    s("console", "log", undefined, { text: "`Welcome ${user.name} (${user.role})`" });
  });

  // 8. Cópia do estado antes de editar (desfazer / rascunho de formulário)
  fn("snapshotState", { form: "{ cart: [1, 2, 3], total: 30 }" }, ["snapshot"], s => {
    s("web", "structuredClone", "snapshot", { value: "form" });
    s("console", "log", undefined, { text: "snapshot" });
  });

  // 9. Maior de idade a partir do ano de nascimento (validação de formulário)
  fn("isAdult", { birthYear: "1998" }, ["age"], s => {
    s("date", "now", "today");
    s("math", "floor", "age", { value: "(today - new Date(birthYear, 0, 1)) / 31557600000" });
    ifThen(s("console", "log", undefined, { text: "`${age} years old: adult`" }), "age >= 18");
  });

  // 10. Quanto tempo uma ação da tela levou (medir carregamento, clique, renderização)
  fn("measureAction", {}, ["ms"], s => {
    s("perf", "now", "start");
    s("math", "random", "work");
    s("perf", "now", "end");
    s("math", "round", "ms", { value: "end - start" });
    s("console", "log", undefined, { text: "`Action took ${ms}ms`" });
  });

  // 11. Buscar um usuário numa API pública e mostrar o status da resposta
  fn("fetchUser", { id: "1" }, ["response"], s => {
    s("web", "fetch", "response", { url: "\"https://jsonplaceholder.typicode.com/users/\" + id" });
    s("console", "log", undefined, { text: "`HTTP ${response.status}`" });
  });
}

/** Fluxo demo (libs do browser + if) — só para testes / receitas, não entra no projeto padrão. */
export function browserDemoProject(): { project: Project; main: string; example: string } {
  let p = emptyProject("New project"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  const ex = run({ type: "newFlow", title: "example" });
  run({ type: "addInput", id: ex, name: "threshold" }); run({ type: "setArg", id: ex, name: "threshold", value: "50" }); run({ type: "addOutput", id: ex, name: "score" }); run({ type: "addOutput", id: ex, name: "report" });
  const step = (lib: string, task: string, out?: string, args: Record<string, string> = {}): string => {
    const id = run({ type: "addChild", id: ex, title: task }); run({ type: "assign", id, agent: lib }); run({ type: "setTask", id, task });
    for (const [name, value] of Object.entries(args)) run({ type: "setArg", id, name, value });
    if (out) run({ type: "renameData", id, to: out }); return id;
  };
  step("crypto", "randomUUID", "id");
  step("math", "random", "ratio");
  step("math", "round", "score", { value: "ratio * 100" });
  step("date", "now", "at");
  const hi = step("console", "log", undefined, { text: "`High score: ${score}`" });
  step("json", "stringify", "report", { value: "{ id, score, at }" });
  step("console", "log", undefined, { text: "report" });
  run({ type: "wrap", id: hi, kind: "if", test: "score >= threshold" });
  return { project: p, main, example: ex };
}
