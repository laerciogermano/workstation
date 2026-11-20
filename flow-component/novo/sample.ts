import { apply, DEFAULT_AGENTS, emptyProject, type Command, type Project } from "./model";

/** Projeto de partida: só `main` (raiz vazia). */
export function sampleProject(): { project: Project; main: string } {
  let p = emptyProject("New project"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const main = run({ type: "newFlow", title: "main" });
  return { project: p, main };
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
