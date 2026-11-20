import { exprIdents } from "./args";
import { agentOf, contractOf, fnsOf, flowFile, isComposite, locate, slug, walk, type Fn, type Node, type Project } from "./model";

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
  /** JavaScript puro (sem tipos nem export), para rodar no navegador; implica a versão executável. */
  js?: boolean;
  /** Versão executável: pessoas viram um simulador local, funções abstratas ganham simuladores (stubs) e o fluxo é chamado no fim. */
  runnable?: boolean;
}

/** Palavras que não podem ser nome de variável/função em JavaScript/TypeScript. */
const JS_WORDS = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await async of type state error call data humans wrappers stubs result".split(" "));
export const camel = (s: string): string => {
  const w = s.normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const j = w.map((x, i) => (i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x.charAt(0).toUpperCase() + x.slice(1))).join("");
  const id = /^[0-9]/.test(j) ? `_${j}` : j || "flow";
  return JS_WORDS.has(id) ? `${id}_` : id;
};

export function generate(p: Project, rootId: string, options: GenOptions = {}): Generated {
  const opts: GenOptions = options.js ? { ...options, runnable: true } : options, ts = !opts.js;
  const ty = (withTypes: string, plain = ""): string => (ts ? withTypes : plain);   // trechos que só existem em TypeScript
  const loc = locate(p, rootId), flow = loc?.node.t === "fn" ? loc.node : null;
  if (!flow) throw new Error(`Flow ${rootId} does not exist`);
  const fns = flow.kids.length ? fnsOf(flow) : [flow];
  // nomes únicos por função
  const used = new Map<string, number>(), names = new Map<string, string>();
  // nomes de dados (entradas, saídas, variáveis de for): uma função nunca pode ter o mesmo nome que um dado
  const dataNames = new Set<string>([...fns.flatMap(f => [...f.ins, ...f.outs])]); walk(flow.kids, n => { if (n.t === "for") dataNames.add(n.v); });
  for (const f of fns) {
    let base = camel(f.title); if (dataNames.has(base)) base = `${base}Fn`;
    const n = (used.get(base) ?? 0) + 1; used.set(base, n); let name = n === 1 ? base : `${base}${n}`; while (dataNames.has(name) && name !== base) name = `${name}_`; names.set(f.id, name);
  }
  const nameOf = (f: Fn): string => names.get(f.id) ?? camel(f.title);
  const kindOf = (f: Fn): "abs" | "lib" | "pessoa" => { const a = agentOf(p, f.agent); return a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs"; };
  /** Lib global do navegador (`Math`, `console`…) é usada pelo nome; módulo (`node:zlib`, `pkg/sub`) vira import. */
  const isModule = (n: string): boolean => /[:/@]/.test(n);
  const libVar = (n: string): string => (isModule(n) ? n.replace(/[^A-Za-z0-9_]/g, "_") : n);

  const produced = [...new Set(fns.flatMap(f => f.outs))];
  // entradas que vêm de fora (state): as de funções comuns que ninguém produz e as de lib que não foram preenchidas
  const needed = [...new Set(fns.flatMap(f => f.ins.filter(i => !f.args?.[i]?.trim() && !contractOf(p, f)?.optional?.includes(i))))].filter(i => !produced.includes(i));
  const abstract = fns.filter(f => kindOf(f) === "abs").map(nameOf);   // sem responsável (ou IA): só o nome; chegam pelo state
  const libFns = fns.filter(f => kindOf(f) === "lib"), callables = fns.filter(f => kindOf(f) !== "pessoa").map(nameOf);   // as de lib também chegam pelo state, como wrappers
  const libs = [...new Set(fns.filter(f => kindOf(f) === "lib").map(f => agentOf(p, f.agent)!.name))].filter(isModule);
  const hasHumans = fns.some(f => kindOf(f) === "pessoa");

  const lines: string[] = [], map: Record<string, [number, number]> = {};
  const emit = (s: string): void => { lines.push(s); };
  const mark = (id: string, a: number): void => { map[id] = [a, lines.length]; };

  /** Chamada de uma função: abstratas e funções de lib vêm do state (as de lib são os wrappers abaixo); pessoas vão por `humans.ask`. */
  const callOf = (f: Fn, scope: string[], err: boolean): string => {
    const entries = new Map<string, string>();
    for (const v of scope) entries.set(v, v);
    for (const i of f.ins) if (produced.includes(i) || scope.includes(i)) entries.set(i, i);
    // entrada de lib preenchida: o valor fixo ou o dado escolhido vai pelo nome da entrada do contrato
    for (const i of f.ins) { const expr = f.args?.[i]?.trim(); if (expr) entries.set(i, expr); }   // valor preenchido (qualquer função, lib ou abstrata)
    const args = `{ ...state${[...entries].map(([k, v]) => (k === v ? `, ${k}` : `, ${k}: ${v}`)).join("")}${err ? ", error" : ""} }`;
    const a = agentOf(p, f.agent);
    return kindOf(f) === "pessoa" ? `humans.ask(${JSON.stringify(a!.name)}, ${JSON.stringify(f.title)}, ${opts.runnable ? `data(${args})` : args})` : `${nameOf(f)}(${args})`;
  };
  const assign = (f: Fn, expr: string): string => (f.outs.length ? `({ ${f.outs.join(", ")} } = await ${expr});` : `await ${expr};`);
  /** Wrapper de uma função de lib: converte o formato do flow (state com os nomes das entradas) para os argumentos da lib e devolve as saídas no formato do flow. */
  const wrapperOf = (f: Fn): string[] => {
    const a = agentOf(p, f.agent)!, c = contractOf(p, f), call = (args: string): string => `${libVar(a.name)}.${f.title}(${args})`, ind = "    ";
    const head = `  ${nameOf(f)}: async (state${ty(": State")})${ty(": Promise<State>")} => {`;
    if (!c) return [head, `${ind}await ${call(`state${ty(" as never")}`)};`, `${ind}return {};`, "  },"];
    const body = [...(c.ins.length ? [`${ind}const { ${c.ins.join(", ")} } = state;`] : [])], expr = call(c.ins.map(i => `${i}${ty(" as never")}`).join(", "));
    if (!f.outs.length) body.push(`${ind}await ${expr};`, `${ind}return {};`);
    else if (f.outs.length === 1) body.push(`${ind}return { ${f.outs[0]}: await ${expr} };`);
    else body.push(`${ind}return (await ${expr})${ty(" as State")};`);
    return [head, ...body, "  },"];
  };

  const list = (nodes: readonly Node[], ind: string, scope: string[], err: boolean): void => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!, a = lines.length + 1;
      if (n.t === "fn" && n.kids.length === 0) {
        // função + as que rodam junto dela (par)
        const group: Fn[] = [n];
        while (nodes[i + 1]?.t === "fn" && (nodes[i + 1] as Fn).par && (nodes[i + 1] as Fn).kids.length === 0) group.push(nodes[++i] as Fn);
        if (group.length === 1) { emit(`${ind}${assign(n, callOf(n, scope, err))}`); mark(n.id, a); continue; }
        emit(`${ind}const par${a} = await Promise.all([  // parallel`);
        group.forEach(g => emit(`${ind}  ${callOf(g, scope, err)},`));
        emit(`${ind}]);`);
        group.forEach((g, k) => { if (g.outs.length) emit(kindOf(g) === "lib" && contractOf(p, g) && g.outs.length === 1 ? `${ind}${g.outs[0]} = par${a}[${k}];` : `${ind}({ ${g.outs.join(", ")} } = par${a}[${k}]${ty(" as State")});`); });
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
  const idsOf = exprIdents;
  const inExpr = new Set<string>(), fromStateSet = new Set<string>();
  const scan = (nodes: readonly Node[], scope: string[]): void => {
    for (const n of nodes) {
      if (n.t === "fn") for (const v of Object.values(n.args ?? {})) for (const id of idsOf(v)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); }
      if (n.t === "if") { for (const id of idsOf(n.test)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); } scan(n.kids, scope); scan(n.elseKids, scope); }
      else if (n.t === "for") { for (const id of idsOf(n.coll)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); } scan(n.kids, [...scope, n.v]); }
      else if (n.t === "try") { scan(n.kids, scope); scan(n.catchKids, scope); } else scan(n.kids, scope);
    }
  };
  scan(flow.kids, []);
  const fromState = [...fromStateSet].filter(n => !callables.includes(n) && n !== "humans");

  emit(`// Generated by Flow · flow ${JSON.stringify(flow.title)}`);
  for (const l of libs) emit(opts.js ? `const ${libVar(l)} = await import(${JSON.stringify(l)});   // module: only works if the browser can load it` : `import * as ${libVar(l)} from ${JSON.stringify(l)};`);
  if (lines.length > 1) emit("");
  if (ts) { emit("type State = Record<string, unknown>;"); if (callables.length) emit("type Fn = (state: State) => Promise<State>;"); if (hasHumans) emit("type Humans = { ask: (who: string, what: string, args: State) => Promise<State> };"); }
  emit("");
  emit(`/** ${flow.title} · ${flowFile(flow)} */`);
  emit(`${ty("export ")}async function ${camel(flow.title)}(state${ty(": State")})${ty(": Promise<State>")} {`);
  const startBody = lines.length + 1;
  if (needed.length) emit(`  // expected inputs (from another layer): ${needed.join(", ")}`);
  if (hasHumans) emit(`  const { humans } = state${ty(" as { humans: Humans }")};  // people: come from the state`);
  if (callables.length) emit(`  const { ${callables.join(", ")} } = state${ty(` as Record<${callables.map(n => JSON.stringify(n)).join(" | ")}, Fn>`)};  // functions: come from the state (lib ones are the wrappers exported below)`);
  if (fromState.length) emit(`  const { ${fromState.join(", ")} } = state${ty(" as Record<string, any>")};  // data read in conditions and loops`);
  if (produced.length) emit(`  let ${produced.map(o => `${o}${ty(`: ${inExpr.has(o) ? "any" : "unknown"}`)}`).join(", ")};`);
  if (flow.kids.length) list(flow.kids, "  ", [], false);
  else { const a = lines.length + 1; emit(`  ${assign(flow, callOf(flow, [], false))}`); mark(flow.id, a); }
  emit(produced.length ? `  return { ${produced.join(", ")} };` : "  return state;");
  emit("}");
  map[flow.id] = [startBody, lines.length - 1];
  emit("");
  if (libFns.length) {
    emit("/** Lib function wrappers: turn the flow input (state) into the lib input, and the lib output back into the flow format. Pass them in the state. */");
    emit(`${ty("export ")}const wrappers${ty(": Record<string, Fn>")} = {`);
    for (const f of libFns) { const start = lines.length + 1; for (const l of wrapperOf(f)) emit(l); map[`${f.id}:wrapper`] = [start, lines.length]; }
    emit("};"); emit("");
  }
  const fnName = camel(flow.title), runFile = `${slug(flow.title)}.mts`, runCommand = `node --experimental-strip-types ${runFile}`;
  if (opts.runnable) {
    emit(opts.js ? "// ── runs in the browser" : `// ── local run: ${runCommand}  (Node ≥ 22.6; the flag is optional on 23.6+)`);
    if (abstract.length) {
      emit(`const stubs${ty(": Record<string, Fn>")} = {  // simulators of the abstract functions (in the real system they come from the state)`);
      for (const f of fns.filter(x => kindOf(x) === "abs")) emit(`  ${nameOf(f)}: async state => { console.log("[abstract] ${nameOf(f)}", data(state)); return {${f.outs.length ? " " : ""}${f.outs.map(o => `${o}: ${JSON.stringify(`${o} (simulated)`)}`).join(", ")}${f.outs.length ? " " : ""}}; },`);
      emit("};");
    }
    if (abstract.length || hasHumans || produced.length) emit(`function data(state${ty(": State")})${ty(": State")} { return Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== "function")); }`);
    if (hasHumans) emit(`const humans${ty(": Humans")} = { ask: async (who, what, args) => { console.log(\`[person] \${who}: \${what}\`, data(args)); return {}; } };`);
    const given = [...(libFns.length ? ["...wrappers"] : []), ...(abstract.length ? ["...stubs"] : []), ...(hasHumans ? ["humans"] : []), ...needed.map(n => `${n}: ${JSON.stringify(`${n} (simulated)`)}`)];
    // só imprime o que o fluxo produz (nunca o state inteiro, que carrega as funções); sem saídas, só o que as funções logam
    if (produced.length) { emit(`const result = await ${fnName}({ ${given.join(", ")} });`); emit('console.log("result:", data(result));'); }
    else emit(`await ${fnName}({ ${given.join(", ")} });`);
  } else emit(`// run: await ${fnName}({ ${[...(libFns.length ? ["...wrappers"] : []), ...needed].join(", ")}${libFns.length || needed.length ? " " : ""}});`);
  void isComposite; void walk;
  return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: fnName, runFile, runCommand };
}
