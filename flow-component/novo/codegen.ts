import { agentOf, fnsOf, flowFile, isComposite, locate, slug, walk, type Fn, type Node, type Project } from "./model";

/**
 * Fluxo → TypeScript.
 *  - função SEM responsável (ou de IA) é abstrata: não é declarada, chega pelo `state` e é só chamada pelo nome;
 *  - função de lib (node:*) é concreta: `import * as lib` e `lib.task(...)`; de pessoa: `humans.ask(...)`;
 *  - if → `if { } else { return <volta> }`, for → `for … of`, try → `try { } catch (error) { … }`,
 *    funções em paralelo → `Promise.all`.
 */
export interface Generated {
  code: string; map: Record<string, [number, number]>; fileName: string; name: string;
  /** Arquivo e comando para rodar a versão executável no Node (≥ 22.6). */
  runFile: string; runCommand: string;
}
export interface GenOptions {
  /** Versão executável: pessoas viram um simulador local, funções abstratas ganham simuladores (stubs) e o fluxo é chamado no fim. */
  runnable?: boolean;
}

export const camel = (s: string): string => {
  const w = s.normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const j = w.map((x, i) => (i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x.charAt(0).toUpperCase() + x.slice(1))).join("");
  return /^[0-9]/.test(j) ? `_${j}` : j || "fluxo";
};

export function generate(p: Project, rootId: string, opts: GenOptions = {}): Generated {
  const loc = locate(p, rootId), flow = loc?.node.t === "fn" ? loc.node : null;
  if (!flow) throw new Error(`Fluxo ${rootId} não existe`);
  const fns = flow.kids.length ? fnsOf(flow) : [flow];
  // nomes únicos por função
  const used = new Map<string, number>(), names = new Map<string, string>();
  for (const f of fns) { const base = camel(f.title), n = (used.get(base) ?? 0) + 1; used.set(base, n); names.set(f.id, n === 1 ? base : `${base}${n}`); }
  const nameOf = (f: Fn): string => names.get(f.id) ?? camel(f.title);
  const kindOf = (f: Fn): "abs" | "lib" | "pessoa" => { const a = agentOf(p, f.agent); return a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs"; };
  const libVar = (n: string): string => n.replace(/[^A-Za-z0-9_]/g, "_");

  const produced = [...new Set(fns.flatMap(f => f.outs))];
  const needed = [...new Set(fns.flatMap(f => f.ins))].filter(i => !produced.includes(i));
  const abstract = fns.filter(f => kindOf(f) === "abs").map(nameOf);
  const libs = [...new Set(fns.filter(f => kindOf(f) === "lib").map(f => agentOf(p, f.agent)!.name))];
  const hasHumans = fns.some(f => kindOf(f) === "pessoa");

  const lines: string[] = [], map: Record<string, [number, number]> = {};
  const emit = (s: string): void => { lines.push(s); };
  const mark = (id: string, a: number): void => { map[id] = [a, lines.length]; };

  const callOf = (f: Fn, scope: string[], err: boolean): string => {
    const ins = f.ins.filter(i => produced.includes(i) || scope.includes(i));
    const args = `{ ...state${[...new Set([...scope.filter(v => !ins.includes(v)), ...ins])].map(v => `, ${v}`).join("")}${err ? ", error" : ""} }`;
    const k = kindOf(f), a = agentOf(p, f.agent);
    const shown = opts.runnable ? `data(${args})` : args;   // no executável o log não mostra as funções do state
    return k === "lib" ? `call(${libVar(a!.name)}, ${JSON.stringify(f.title)}, ${shown})` : k === "pessoa" ? `humans.ask(${JSON.stringify(a!.name)}, ${JSON.stringify(f.title)}, ${shown})` : `${nameOf(f)}(${args})`;
  };
  const assign = (f: Fn, expr: string): string => (f.outs.length ? `({ ${f.outs.join(", ")} } = await ${expr});` : `await ${expr};`);

  const list = (nodes: readonly Node[], ind: string, scope: string[], err: boolean): void => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!, a = lines.length + 1;
      if (n.t === "fn" && n.kids.length === 0) {
        // função + as que rodam junto dela (par)
        const group: Fn[] = [n];
        while (nodes[i + 1]?.t === "fn" && (nodes[i + 1] as Fn).par && (nodes[i + 1] as Fn).kids.length === 0) group.push(nodes[++i] as Fn);
        if (group.length === 1) { emit(`${ind}${assign(n, callOf(n, scope, err))}`); mark(n.id, a); continue; }
        emit(`${ind}const par${a} = await Promise.all([  // paralelo`);
        group.forEach(g => emit(`${ind}  ${callOf(g, scope, err)},`));
        emit(`${ind}]);`);
        group.forEach((g, k) => { if (g.outs.length) emit(`${ind}({ ${g.outs.join(", ")} } = par${a}[${k}] as State);`); });
        group.forEach(g => { map[g.id] = [a, lines.length]; });
      } else if (n.t === "fn") { list(n.kids, ind, scope, err); map[n.id] = [map[n.kids[0]!.id]?.[0] ?? a, lines.length]; }
      else if (n.t === "if") {
        emit(`${ind}if (${n.test}) {`); list(n.kids, ind + "  ", scope, err);
        if (n.elseKids.length) { emit(`${ind}} else {`); list(n.elseKids, ind + "  ", scope, err); }
        emit(`${ind}}`); mark(n.id, a);
      } else if (n.t === "for") {
        emit(`${ind}for (const ${n.v} of ${n.coll}) {`); list(n.kids, ind + "  ", [...scope, n.v], err); emit(`${ind}}`); mark(n.id, a);
      } else {
        emit(`${ind}try {`); list(n.kids, ind + "  ", scope, err); emit(`${ind}} catch (error) {`);
        list(n.catchKids, ind + "  ", scope, true); emit(`${ind}  return { ...state, error };`); emit(`${ind}}`); mark(n.id, a);
      }
    }
  };

  // dados citados nas condições (if) e repetições (for): sem eles o TypeScript reclamaria de nomes inexistentes.
  // Os que alguém produz viram `let x: any`; os de fora são lidos do state.
  const RESERVED = new Set(["true", "false", "null", "undefined", "typeof", "instanceof", "in", "of", "new", "void", "NaN", "Infinity", "Math", "JSON", "Object", "Array", "Number", "String", "Boolean", "Date", "Set", "Map", "state", "error"]);
  const idsOf = (expr: string): string[] => [...expr.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").matchAll(/(?<![.\w$])[A-Za-z_$][\w$]*/g)].map(m => m[0]).filter(w => !RESERVED.has(w));
  const inExpr = new Set<string>(), fromStateSet = new Set<string>();
  const scan = (nodes: readonly Node[], scope: string[]): void => {
    for (const n of nodes) {
      if (n.t === "if") { for (const id of idsOf(n.test)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); } scan(n.kids, scope); scan(n.elseKids, scope); }
      else if (n.t === "for") { for (const id of idsOf(n.coll)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); } scan(n.kids, [...scope, n.v]); }
      else if (n.t === "try") { scan(n.kids, scope); scan(n.catchKids, scope); } else scan(n.kids, scope);
    }
  };
  scan(flow.kids, []);
  const fromState = [...fromStateSet].filter(n => !abstract.includes(n) && n !== "humans");

  emit(`// Gerado por Flow · fluxo ${JSON.stringify(flow.title)}`);
  for (const l of libs) emit(`import * as ${libVar(l)} from ${JSON.stringify(l)};`);
  if (lines.length > 1) emit("");
  emit("type State = Record<string, unknown>;");
  if (abstract.length) emit("type Fn = (state: State) => Promise<State>;");
  if (hasHumans) emit("type Humans = { ask: (who: string, what: string, args: State) => Promise<State> };");
  if (libs.length) { emit(""); emit("// chama a função `task` de uma lib do Node passando o estado; o que ela devolver vira o estado"); emit("const call = async (lib: object, task: string, args: State): Promise<State> => ((await (lib as Record<string, Function>)[task]!(args)) ?? {}) as State;"); }
  emit("");
  emit(`/** ${flow.title} · ${flowFile(flow)} */`);
  emit(`export async function ${camel(flow.title)}(state: State): Promise<State> {`);
  const startBody = lines.length + 1;
  if (needed.length) emit(`  // entradas esperadas (de outra camada): ${needed.join(", ")}`);
  if (hasHumans) emit("  const { humans } = state as { humans: Humans };  // pessoas: vêm do state");
  if (abstract.length) emit(`  const { ${abstract.join(", ")} } = state as Record<${abstract.map(n => JSON.stringify(n)).join(" | ")}, Fn>;  // funções abstratas: vêm do state`);
  if (fromState.length) emit(`  const { ${fromState.join(", ")} } = state as Record<string, any>;  // dados lidos nas condições e repetições`);
  if (produced.length) emit(`  let ${produced.map(o => `${o}: ${inExpr.has(o) ? "any" : "unknown"}`).join(", ")};`);
  if (flow.kids.length) list(flow.kids, "  ", [], false);
  else { const a = lines.length + 1; emit(`  ${assign(flow, callOf(flow, [], false))}`); mark(flow.id, a); }
  emit(produced.length ? `  return { ${produced.join(", ")} };` : "  return state;");
  emit("}");
  map[flow.id] = [startBody, lines.length - 1];
  emit("");
  const fnName = camel(flow.title), runFile = `${slug(flow.title)}.mts`, runCommand = `node --experimental-strip-types ${runFile}`;
  if (opts.runnable) {
    emit(`// ── execução local: ${runCommand}  (Node ≥ 22.6; no 23.6+ o flag é opcional)`);
    if (abstract.length) {
      emit("const stubs: Record<string, Fn> = {  // simuladores das funções abstratas (no sistema real vêm do state)");
      for (const f of fns.filter(x => kindOf(x) === "abs")) emit(`  ${nameOf(f)}: async state => { console.log("[abstrata] ${nameOf(f)}", data(state)); return {${f.outs.length ? " " : ""}${f.outs.map(o => `${o}: ${JSON.stringify(`${o} (simulado)`)}`).join(", ")}${f.outs.length ? " " : ""}}; },`);
      emit("};");
    }
    emit("function data(state: State): State { return Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== \"function\")); }");
    if (hasHumans) emit('const humans: Humans = { ask: async (who, what, args) => { console.log(`[pessoa] ${who}: ${what}`, data(args)); return {}; } };');
    const given = [...(abstract.length ? ["...stubs"] : []), ...(hasHumans ? ["humans"] : []), ...needed.map(n => `${n}: ${JSON.stringify(`${n} (simulado)`)}`)];
    emit(`const result = await ${fnName}({ ${given.join(", ")} });`);
    emit('console.log("resultado:", result);');
  } else emit(`// execução: await ${fnName}({ ${needed.join(", ")}${needed.length ? " " : ""}});`);
  void isComposite; void walk;
  return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: fnName, runFile, runCommand };
}
