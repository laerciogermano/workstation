import { exprIdents, isDataRef } from "./args";
import { agentOf, contractOf, fileDataProducer, fnsOf, flowFile, isComposite, isFromArg, kidsOf, locate, parseFromArg, slug, walk, type Fn, type Node, type Project } from "./model";

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
  /** Uso interno: gera só a função local de uma composição (sem cabeçalho, imports, wrappers nem execução). */
  inner?: boolean;
  /** Uso interno: nomes únicos no arquivo todo (compartilhado entre a função e as locais). */
  names?: Map<string, string>; reg?: Map<string, number>; fnName?: string;
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
  const allFns = flow.kids.length ? fnsOf(flow) : [flow];
  /** Funções deste escopo: as filhas diretas (e dentro de blocos). Uma composição é uma só chamada: o que há dentro dela vira uma função local do arquivo. */
  const scopeFns = (nodes: readonly Node[]): Fn[] => nodes.flatMap(n => (n.t === "fn" ? [n] : scopeFns(kidsOf(n))));
  const fns = flow.kids.length ? scopeFns(flow.kids) : [flow];
  // nomes únicos por função
  const used = opts.reg ?? new Map<string, number>(), names = opts.names ?? new Map<string, string>();
  // nomes de dados (entradas, saídas, variáveis de for): uma função nunca pode ter o mesmo nome que um dado
  const dataNames = new Set<string>([...allFns.flatMap(f => [...f.ins, ...f.outs])]); walk(flow.kids, n => { if (n.t === "for") dataNames.add(n.v); });
  if (!opts.names) for (const f of allFns) {
    let base = camel(f.title); if (dataNames.has(base)) base = `${base}Fn`;
    const n = (used.get(base) ?? 0) + 1; used.set(base, n); let name = n === 1 ? base : `${base}${n}`; while (dataNames.has(name) && name !== base) name = `${name}_`; names.set(f.id, name);
  }
  const nameOf = (f: Fn): string => names.get(f.id) ?? camel(f.title);
  const kindOf = (f: Fn): "abs" | "lib" | "obj" | "pessoa" | "file" | "local" => { if (f.kids.length) return "local"; const a = agentOf(p, f.agent); if (f.agent?.startsWith("obj:")) return "obj"; return a?.kind === "arquivo" ? "file" : a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs"; };
  /** Lib global do navegador (`Math`, `console`…) é usada pelo nome; módulo (`node:zlib`, `pkg/sub`) vira import. */
  const isModule = (n: string): boolean => /[:/@]/.test(n);
  const libVar = (n: string): string => (isModule(n) ? n.replace(/[^A-Za-z0-9_]/g, "_") : n);

  const produced = [...new Set(fns.flatMap(f => f.outs))];
  // entradas que vêm de fora (state): as de funções comuns que ninguém produz e as de lib que não foram preenchidas
  const rootIns = flow.kids.length ? flow.ins : [];   // entradas declaradas na própria função de primeira ordem: chegam pelo state
  const producedAll = [...new Set(allFns.flatMap(f => f.outs))];
  const needed = [...new Set([...rootIns, ...allFns.flatMap(f => f.ins.filter(i => !f.args?.[i]?.trim() && !contractOf(p, f)?.optional?.includes(i)))])].filter(i => !producedAll.includes(i));
  const returned = flow.outs;   // saídas declaradas na função de primeira ordem; sem elas, tudo o que o fluxo produz
  const abstract = fns.filter(f => kindOf(f) === "abs").map(nameOf);   // sem responsável (ou IA): só o nome; chegam pelo state
  const libFns = allFns.filter(f => kindOf(f) === "lib" || kindOf(f) === "obj"), callables = fns.filter(f => kindOf(f) !== "pessoa" && kindOf(f) !== "file" && kindOf(f) !== "local").map(nameOf);   // libs e métodos de objeto chegam pelo state, como wrappers
  const libs = [...new Set(allFns.filter(f => kindOf(f) === "lib").map(f => agentOf(p, f.agent)!.name))].filter(isModule);
  const hasHumans = fns.some(f => kindOf(f) === "pessoa"), hasHumansAll = allFns.some(f => kindOf(f) === "pessoa"), needFn = allFns.some(f => !["pessoa", "file", "local"].includes(kindOf(f)));

  const lines: string[] = [], map: Record<string, [number, number]> = {};
  const emit = (s: string): void => { lines.push(s); };
  const mark = (id: string, a: number): void => { map[id] = [a, lines.length]; };

  /** Chamada de uma função: abstratas e funções de lib vêm do state (as de lib são os wrappers abaixo); pessoas vão por `humans.ask`. */
  const callOf = (f: Fn, scope: string[], err: boolean): string => {
    const entries = new Map<string, string>();
    for (const v of scope) entries.set(v, v);
    if (kindOf(f) === "local") for (const d of declared) entries.set(d, d);   // a função local não enxerga as variáveis do pai: recebe pelo state tudo o que já nasceu
    for (const i of f.ins) if (produced.includes(i) || scope.includes(i) || needed.includes(i)) entries.set(i, i);   // entrada definida no flow e vinda de fora: lida do state e repassada
    // entrada preenchida: literal → variável local; ref → nome do dado; from:file#name → nome importado;
    // se o nome colide com HELPERS do gerador, a expressão fica inline na chamada
    for (const i of f.ins) {
      const expr = f.args?.[i]?.trim(); if (!expr) continue;
      const from = parseFromArg(expr);
      if (from) { entries.set(i, from.name); continue; }
      if (initOf(f, i, scope)) entries.set(i, i);
      else if (isDataRef(expr)) entries.set(i, expr);
      else if (HELPERS.has(i)) entries.set(i, expr);
      else entries.set(i, i);
    }
    const args = `{ ...state${[...entries].map(([k, v]) => (k === v ? `, ${k}` : `, ${k}: ${v}`)).join("")}${err ? ", error" : ""} }`;
    const a = agentOf(p, f.agent);
    return kindOf(f) === "pessoa" ? `humans.ask(${JSON.stringify(a!.name)}, ${JSON.stringify(f.title)}, ${args})` : `${nameOf(f)}(${args})`;
  };
  /** Valor preenchido que não é só uma referência a outro dado (literal, objeto, template, chamada…): vira variável inicializada logo antes da função. */
  const HELPERS = new Set(["data", "humans", "state", "error", "stubs", "wrappers", "result"]);   // nomes que o código gerado já usa: ficam inline
  const initOf = (f: Fn, i: string, scope: string[]): string | undefined => {
    const e = f.args?.[i]?.trim();
    return e && !isFromArg(e) && !isDataRef(e) && !scope.includes(i) && !fromStateSet.has(i) && !callables.includes(i) && !dataNamesLoop.has(i) && !HELPERS.has(i) ? e : undefined;
  };
  const initLines = (fs: readonly Fn[], scope: string[], ind: string): string[] => fs.flatMap(f => f.ins.map(i => [i, initOf(f, i, scope)] as const).filter((x): x is readonly [string, string] => !!x[1]).map(([i, e]) => `${ind}${i} = ${e};`));
  const assign = (f: Fn, expr: string): string => (f.outs.length ? `({ ${f.outs.join(", ")} } = await ${expr});` : `await ${expr};`);
  /** Wrapper de uma função de lib: converte o formato do flow (state com os nomes das entradas) para os argumentos da lib e devolve as saídas no formato do flow. */
  const wrapperOf = (f: Fn): string[] => {
    const a = agentOf(p, f.agent)!, c = contractOf(p, f), obj = kindOf(f) === "obj";
    const call = (args: string): string => obj ? `${a.name}.${f.title}(${args})` : `${libVar(a.name)}.${f.title}(${args})`, ind = "    ";
    const head = `  ${nameOf(f)}: async (state${ty(": State")})${ty(": Promise<State>")} => {`;
    if (!c) return [head, ...(obj ? [`${ind}const { ${a.name} } = state;`] : []), `${ind}await ${call(`state${ty(" as never")}`)};`, `${ind}return {};`, "  },"];
    // nomes no state = f.ins (referência no flow); ordem do contrato = c.ins → chamada da lib por índice
    const flowIns = c.ins.map((ci, i) => f.ins[i] ?? ci);
    const fromState = [...(obj ? [a.name] : []), ...flowIns].filter((n, i, arr) => arr.indexOf(n) === i);
    const body = [...(fromState.length ? [`${ind}const { ${fromState.join(", ")} } = state;`] : [])], expr = call(flowIns.map(i => `${i}${ty(" as never")}`).join(", "));
    if (!f.outs.length) body.push(`${ind}await ${expr};`, `${ind}return {};`);
    else if (f.outs.length === 1) body.push(`${ind}return { ${f.outs[0]}: await ${expr} };`);
    else body.push(`${ind}return (await ${expr})${ty(" as State")};`);
    return [head, ...body, "  },"];
  };

  const declared = new Set<string>();   // nomes já declarados (let / const) até o ponto da emissão
  /** Tipo do valor quando a expressão deixa claro (texto, número, booleano, lista, objeto); senão não chuta. */
  const inferType = (e: string): string | undefined => {
    const x = e.trim();
    if (/^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$|^`[^`]*`$/.test(x)) return "string";
    if (/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(x)) return "number";
    if (/^(?:true|false)$/.test(x)) return "boolean";
    if (/^\[[\s\S]*\]$/.test(x)) return "unknown[]";
    if (/^\{[\s\S]*\}$/.test(x)) return "Record<string, unknown>";
    const bare = x.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "");   // sem o conteúdo de textos
    if (!bare.includes(x) && /["'`]/.test(x)) return undefined;
    if (/^!|(?:===?|!==?|<=?|>=?)/.test(bare) && !/[?]/.test(bare)) return "boolean";
    if (/^[\w$.\s()+\-*/%]+$/.test(x) && /[*/%]|\s-\s/.test(x) && !/["'`]/.test(x)) return "number";
    return undefined;
  };
  const typeOf = (n: string): string => (inExpr.has(n) ? "any" : "unknown");
  const letLine = (names: readonly string[], ind: string): void => { const ns = names.filter(n => !declared.has(n)); if (!ns.length) return; ns.forEach(n => declared.add(n)); emit(`${ind}let ${ns.map(n => `${n}${ty(`: ${typeOf(n)}`)}`).join(", ")};`); };
  const list = (nodes: readonly Node[], ind: string, scope: string[], err: boolean, key = "r"): void => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!, a = lines.length + 1;
      if (n.t === "fn") {
        // função (ou composição: uma chamada à função local) + as que rodam junto dela (par)
        const group: Fn[] = [n];
        while (nodes[i + 1]?.t === "fn" && (nodes[i + 1] as Fn).par) group.push(nodes[++i] as Fn);
        const ds = (declAt.get(`${key}|${n.id}`) ?? []).filter(x => !declared.has(x));   // dados que nascem aqui: declarados logo antes do primeiro uso
        if (group.length === 1) {
          const inl = new Set<string>();
          // valores preenchidos: `const x = ...` se só esta função o escreve, `let x = ...` se outras também escrevem; se já existe, só atribui
          const pre = n.ins.flatMap(x => { const e = initOf(n, x, scope); if (!e) return []; if (ds.includes(x)) { inl.add(x); declared.add(x); return [`${ind}${writers.get(x) === 1 ? "const" : "let"} ${x}${ty(`: ${writers.get(x) === 1 && !inExpr.has(x) ? inferType(e) ?? typeOf(x) : typeOf(x)}`)} = ${e};`]; } return [`${ind}${x} = ${e};`]; });
          const constOut = n.outs.length > 0 && n.outs.every(o => ds.includes(o) && writers.get(o) === 1);
          letLine(ds.filter(x => !inl.has(x) && !(constOut && n.outs.includes(x))), ind);
          pre.forEach(l => emit(l)); const a0 = lines.length + 1;
          if (constOut) { n.outs.forEach(o => declared.add(o)); emit(`${ind}const { ${n.outs.join(", ")} }${ty(n.outs.some(o => inExpr.has(o)) ? ": any" : "")} = await ${callOf(n, scope, err)};`); }
          else emit(`${ind}${assign(n, callOf(n, scope, err))}`);
          map[n.id] = [pre.length || ds.length ? a : a0, lines.length]; continue;
        }
        letLine(ds, ind); initLines(group, scope, ind).forEach(l => emit(l)); const a0 = lines.length + 1;
        const anyOut = group.some(g => g.outs.length);   // sem saída definida no flow, não há variável
        emit(`${ind}${anyOut ? `const par${a0} = ` : ""}await Promise.all([`);
        group.forEach(g => emit(`${ind}  ${callOf(g, scope, err)},`));
        emit(`${ind}]);`);
        group.forEach((g, k) => { if (g.outs.length) emit(kindOf(g) === "lib" && contractOf(p, g) && g.outs.length === 1 ? `${ind}${g.outs[0]} = par${a0}[${k}];` : `${ind}({ ${g.outs.join(", ")} } = par${a0}[${k}]${ty(" as State")});`); });
        group.forEach(g => { map[g.id] = [a, lines.length]; });
      } else if (n.t === "if") {
        letLine(declAt.get(`${key}|${n.id}`) ?? [], ind); const a1 = lines.length + 1;
        emit(`${ind}if (${n.test}) {`); list(n.kids, ind + "  ", scope, err, `${n.id}:k`);
        if (n.elseKids.length) { emit(`${ind}} else {`); list(n.elseKids, ind + "  ", scope, err, `${n.id}:e`); }
        emit(`${ind}}`); mark(n.id, a1);
      } else if (n.t === "for") {
        letLine(declAt.get(`${key}|${n.id}`) ?? [], ind); const a1 = lines.length + 1;
        emit(`${ind}for (const ${n.v} of ${n.coll}) {`); list(n.kids, ind + "  ", [...scope, n.v], err, `${n.id}:k`); emit(`${ind}}`); mark(n.id, a1);
      } else if (n.t === "switch") {
        letLine(declAt.get(`${key}|${n.id}`) ?? [], ind); const a1 = lines.length + 1;
        emit(`${ind}switch (${n.expr}) {`);
        for (const c of n.kids) {
          if (c.t === "if") {
            const m = /===?\s*(.+)$/.exec(c.test);
            emit(`${ind}  case ${m ? m[1]!.trim() : c.test}:`);
            list(c.kids, ind + "    ", scope, err, `${c.id}:k`);
            emit(`${ind}    break;`);
          } else list([c], ind + "  ", scope, err, `${n.id}:k`);
        }
        emit(`${ind}}`); mark(n.id, a1);
      } else {
        letLine(declAt.get(`${key}|${n.id}`) ?? [], ind); const a1 = lines.length + 1;
        emit(`${ind}try {`); list(n.kids, ind + "  ", scope, err, `${n.id}:k`); emit(`${ind}} catch (error) {`);
        list(n.catchKids, ind + "  ", scope, true, `${n.id}:c`); emit(returned.length ? `${ind}  return { ...state, error };` : `${ind}  return;`); emit(`${ind}}`); mark(n.id, a1);
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
      else if (n.t === "switch") { for (const id of idsOf(n.expr)) { if (scope.includes(id)) continue; inExpr.add(id); if (!produced.includes(id)) fromStateSet.add(id); } scan(n.kids, scope); }
      else if (n.t === "try") { scan(n.kids, scope); scan(n.catchKids, scope); }   // fn: o que há dentro de uma composição é de outro escopo (função local)
    }
  };
  scan(flow.kids, []);
  const fromState = [...fromStateSet].filter(n => !callables.includes(n) && n !== "humans");
  const dataNamesLoop = new Set<string>(); walk(flow.kids, n => { if (n.t === "for") dataNamesLoop.add(n.v); });
  // dados que nascem de um valor preenchido no flow view: declarados no início, inicializados antes de cada função que os usa
  const inits = [...new Set(fns.flatMap(f => f.ins.filter(i => initOf(f, i, []))))].filter(i => !produced.includes(i) && !fromState.includes(i));

  // onde cada dado nasce: no menor bloco que cobre todos os usos, imediatamente antes da primeira instrução que o usa
  const declarable = new Set<string>([...produced, ...(flow.kids.length ? flow.outs : []), ...inits]);
  type Use = { keys: string[]; ids: string[]; seq: number };
  const usesOf = new Map<string, Use[]>(), writers = new Map<string, number>(); let seq = 0;
  const addUse = (name: string, trail: readonly (readonly [string, string])[]): void => { if (!declarable.has(name)) return; const l = usesOf.get(name) ?? []; l.push({ keys: trail.map(t => t[0]), ids: trail.map(t => t[1]), seq: seq++ }); usesOf.set(name, l); };
  const scanDecl = (nodes: readonly Node[], key: string, trail: readonly (readonly [string, string])[], scope: string[]): void => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      if (n.t === "fn") {
        const group: Fn[] = [n]; while (nodes[i + 1]?.t === "fn" && (nodes[i + 1] as Fn).par) group.push(nodes[++i] as Fn);
        const here = [...trail, [key, n.id] as const];
        for (const g of group) {
          for (const x of g.ins) {
            const e = g.args?.[x]?.trim();
            if (e) {
              if (isFromArg(e)) { /* origem de outro arquivo: binding emitido no início do body */ }
              else { idsOf(e).forEach(id => addUse(id, here)); if (initOf(g, x, scope)) { addUse(x, here); writers.set(x, (writers.get(x) ?? 0) + 1); } }
            } else if (produced.includes(x)) addUse(x, here);
          }
          for (const o of g.outs) { addUse(o, here); writers.set(o, (writers.get(o) ?? 0) + 1); }
        }
      } else {
        const here = [...trail, [key, n.id] as const];
        if (n.t === "if") { idsOf(n.test).forEach(id => addUse(id, here)); scanDecl(n.kids, `${n.id}:k`, here, scope); scanDecl(n.elseKids, `${n.id}:e`, here, scope); }
        else if (n.t === "for") { idsOf(n.coll).forEach(id => addUse(id, here)); scanDecl(n.kids, `${n.id}:k`, here, [...scope, n.v]); }
        else if (n.t === "switch") { idsOf(n.expr).forEach(id => addUse(id, here)); scanDecl(n.kids, `${n.id}:k`, here, scope); }
        else { scanDecl(n.kids, `${n.id}:k`, here, scope); scanDecl(n.catchKids, `${n.id}:c`, here, scope); }
      }
    }
  };
  scanDecl(flow.kids, "r", [], []); returned.forEach(o => addUse(o, [["r", "__ret"]]));
  const declAt = new Map<string, string[]>();
  for (const [name, us] of usesOf) {
    const f0 = us[0]!; let l = 0;
    while (us.every(u => u.keys.length > l + 1 && u.keys[l + 1] === f0.keys[l + 1] && u.ids[l] === f0.ids[l])) l++;
    const firstUse = us.reduce((m, u) => (u.seq < m.seq ? u : m)), k = `${f0.keys[l]}|${firstUse.ids[l]}`;
    declAt.set(k, [...(declAt.get(k) ?? []), name]);
  }

  // origem `from:file#name`: produtoras de outros arquivos a importar e chamar no início do body
  const fromImps: { file: string; name: string; producer: Fn }[] = [];
  const seenFrom = new Set<string>();
  const collectFrom = (f: Fn): void => {
    for (const i of f.ins) {
      const parsed = parseFromArg(f.args?.[i]?.trim() ?? ""); if (!parsed) continue;
      const key = `${parsed.file}#${parsed.name}`; if (seenFrom.has(key)) continue;
      const producer = fileDataProducer(p, parsed.file, parsed.name); if (!producer) continue;
      seenFrom.add(key); fromImps.push({ file: parsed.file, name: parsed.name, producer });
    }
  };
  for (const f of allFns) collectFrom(f);
  if (flow.kids.length) collectFrom(flow);
  const fromNames = new Set(fromImps.map(x => x.name));

  if (!opts.inner) {
    for (const l of libs) emit(opts.js ? `const ${libVar(l)} = await import(${JSON.stringify(l)});` : `import * as ${libVar(l)} from ${JSON.stringify(l)};`);
    // funções de outros arquivos: fonte `file:` e produtoras de dados `from:file#name`
    const byFile = new Map<string, string[]>();
    for (const f of allFns.filter(x => kindOf(x) === "file")) {
      const k = agentOf(p, f.agent)!.name, exp = `${camel(f.title)}${camel(f.title) === nameOf(f) ? "" : ` as ${nameOf(f)}`}`;
      byFile.set(k, [...new Set([...(byFile.get(k) ?? []), exp])]);
    }
    for (const imp of fromImps) {
      const exp = camel(imp.producer.title);
      byFile.set(imp.file, [...new Set([...(byFile.get(imp.file) ?? []), exp])]);
    }
    for (const [file, list] of byFile) {
      emit(opts.js ? `const { ${list.map(n => n.replace(" as ", ": ")).join(", ")} } = await import(${JSON.stringify("./" + file)});` : `import { ${list.join(", ")} } from ${JSON.stringify("./" + file)};`);
    }
    if (lines.length > 0) emit("");
    if (ts) { emit("type State = Record<string, unknown>;"); if (needFn) emit("type Fn = (state: State) => Promise<State>;"); if (hasHumansAll) emit("type Humans = { ask: (who: string, what: string, args: State) => Promise<State> };"); }
    if (lines.length > 0) emit("");
  }
  emit(`${opts.inner ? "" : ty("export ")}async function ${opts.fnName ?? camel(flow.title)}(state${ty(": State")})${ty(returned.length ? ": Promise<State>" : ": Promise<void>")} {`);
  const startBody = lines.length + 1;
  if (hasHumans) emit(`  const { humans } = state${ty(" as { humans: Humans }")};`);
  if (callables.length) emit(`  const { ${callables.join(", ")} } = state${ty(` as Record<${callables.map(n => JSON.stringify(n)).join(" | ")}, Fn>`)};`);
  const stateNames = [...new Set([...fromState, ...needed.filter(n => !callables.includes(n) && n !== "humans")])].filter(n => !fromNames.has(n));   // lidas do state; nomes já vindos de from: ficam de fora
  if (stateNames.length) emit(`  const { ${stateNames.join(", ")} } = state${ty(" as Record<string, any>")};`);
  for (const imp of fromImps) {
    const fn = camel(imp.producer.title);
    emit(`  const { ${imp.name} } = await ${fn}({})${ty(" as State")};`);
    declared.add(imp.name);
  }
  if (flow.kids.length) list(flow.kids, "  ", [...fromNames], false);
  else { letLine([...produced, ...inits].filter(n => !fromNames.has(n)), "  "); initLines([flow], [...fromNames], "  ").forEach(l => emit(l)); const a = lines.length + 1; emit(`  ${assign(flow, callOf(flow, [...fromNames], false))}`); mark(flow.id, a); }
  letLine(declAt.get("r|__ret") ?? [], "  ");   // saída que nenhuma função produz: nasce antes do retorno
  if (returned.length) emit(`  return { ${returned.join(", ")} };`);   // só há return quando o flow define saídas
  emit("}");
  map[flow.id] = [startBody, lines.length - 1];
  emit("");
  // composição = função concreta, definida aqui no arquivo (não vem do state): cada uma vira uma função local com os passos dela
  for (const f of fns.filter(x => kindOf(x) === "local")) {
    const g = generate(p, f.id, { ...options, inner: true, names, reg: used, fnName: nameOf(f) }), off = lines.length;
    g.code.replace(/\n$/, "").split("\n").forEach(l => emit(l));
    for (const [k, [a, b]] of Object.entries(g.map)) map[k] = [a + off, b + off];
    emit("");
  }
  if (!opts.inner && libFns.length) {
    emit(`${ty("export ")}const wrappers${ty(": Record<string, Fn>")} = {`);
    for (const f of libFns) { const start = lines.length + 1; for (const l of wrapperOf(f)) emit(l); map[`${f.id}:wrapper`] = [start, lines.length]; }
    emit("};"); emit("");
  }
  const fnName = camel(flow.title), runFile = `${slug(flow.title)}.mts`, runCommand = `node --experimental-strip-types ${runFile}`;
  if (opts.inner) { /* a função local não tem execução própria */ } else if (opts.runnable) {
    // simuladores inline: abstratas devolvem as saídas "(simulated)"; a pessoa só registra a pergunta; o que vem de fora entra com valor de exemplo
    const sim = (f: Fn): string => `${nameOf(f)}: async () => (${f.outs.length ? `{ ${f.outs.map(o => `${o}: ${JSON.stringify(`${o} (simulated)`)}`).join(", ")} }` : "{}"})`;
    const given = [...(libFns.length ? ["...wrappers"] : []), ...allFns.filter(x => kindOf(x) === "abs").map(sim), ...(hasHumansAll ? [`humans: { ask: async (who${ty(": string")}, what${ty(": string")}) => (console.log(\`[person] \${who}: \${what}\`), {}) }`] : []), ...needed.map(n => `${n}: ${flow.args?.[n]?.trim() || JSON.stringify(`${n} (simulated)`)}`)];
    const arg = !given.length ? "" : given.length < 3 && given.every(g => g.length < 30) ? `{ ${given.join(", ")} }` : `{\n${given.map(g => `  ${g},`).join("\n")}\n}`;
    if (returned.length) { emit(`const result = await ${fnName}(${arg});`); emit("console.log(result);"); }
    else emit(`await ${fnName}(${arg});`);
  }
  void isComposite; void walk;
  return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: fnName, runFile, runCommand };
}

/** Código do arquivo inteiro: cabeçalho (imports e tipos) uma vez, cada função uma embaixo da outra e os wrappers de lib juntos. */
export function generateFile(p: Project, ids: readonly string[], options: GenOptions = {}): { code: string; fileName: string } {
  const imports = new Set<string>(), types = new Set<string>(), parts: string[][] = [], wrappers = new Map<string, string[]>(); let wOpen = "";
  let fileName = "";
  for (const id of ids) {
    const g = generate(p, id, { ...options, runnable: false }); fileName ||= g.fileName;
    const L = g.code.replace(/\n$/, "").split("\n"), fnI = Math.max(0, L.findIndex(l => /^(export )?async function /.test(l))), wI = L.findIndex(l => /^(export )?const wrappers\b/.test(l));
    for (const l of L.slice(0, fnI)) { if (/^(import |const \{.*\} = await import)/.test(l)) imports.add(l); else if (l.startsWith("type ")) types.add(l); }
    const part = L.slice(fnI, wI === -1 ? L.length : wI); while (part.length && !part[part.length - 1]!.trim()) part.pop(); parts.push(part);
    if (wI !== -1) {
      wOpen ||= L[wI]!; let cur: string[] | null = null;
      for (const l of L.slice(wI + 1)) {
        if (l === "};") break;
        if (/^  \w+: async/.test(l)) cur = wrappers.has(l) ? null : (wrappers.set(l, []), wrappers.get(l)!);   // o mesmo wrapper de outra função não se repete
        cur?.push(l);
      }
    }
  }
  const out: string[] = [...imports, ...(imports.size ? [""] : []), ...types, ...(types.size ? [""] : [])];
  parts.forEach(pt => { out.push(...pt, ""); });
  if (wrappers.size) out.push(wOpen, ...[...wrappers.values()].flat(), "};", "");
  return { code: out.join("\n"), fileName };
}
