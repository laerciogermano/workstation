import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";

/** Projeto de partida: `main` (o projeto novo, só a raiz) e `example` (roda no navegador só com libs do navegador: Math, crypto, Date, JSON, console; tem um if). */
export function sampleProject(): { project: Project; main: string; example: string } {
  let p = emptyProject("New project"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  const ex = run({ type: "newFlow", title: "example" });
  // a função de primeira ordem tem entrada (threshold, com valor de exemplo) e saídas (score e report)
  run({ type: "addInput", id: ex, name: "threshold" }); run({ type: "setArg", id: ex, name: "threshold", value: "50" }); run({ type: "addOutput", id: ex, name: "score" }); run({ type: "addOutput", id: ex, name: "report" });
  // cada passo é uma função de lib: o contrato traz entradas e saída; o nome da saída liga a próxima função
  const step = (lib: string, task: string, out?: string, args: Record<string, string> = {}): string => {
    const id = run({ type: "addChild", id: ex, title: task }); run({ type: "assign", id, agent: lib }); run({ type: "setTask", id, task });
    for (const [name, value] of Object.entries(args)) run({ type: "setArg", id, name, value });
    if (out) run({ type: "renameData", id, to: out }); return id;
  };
  step("crypto", "randomUUID", "id");
  step("math", "random", "ratio");
  step("math", "round", "score", { value: "ratio * 100" });   // round(value): o valor é uma expressão sobre o dado produzido antes
  step("date", "now", "at");
  const hi = step("console", "log", undefined, { text: "`High score: ${score}`" });
  step("json", "stringify", "report", { value: "{ id, score, at }" });
  const report = step("console", "log", undefined, { text: "report" });
  // if (score >= threshold) log "High score"
  run({ type: "wrap", id: hi, kind: "if", test: "score >= threshold" });
  void report;
  return { project: p, main, example: ex };
}
