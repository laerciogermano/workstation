import type { ExportFormat } from "./commands";
import { children } from "./graph";
import type { Exporter } from "./ports";
import { err, ok } from "./result";
import type { Agent, FlowElement, Snapshot } from "./types";
import { buildScene, DEFAULT_FLAGS, planTops } from "./view/scene";

/**
 * Transpilador Flow → TypeScript (estilo FOP): cada função do fluxo vira uma função `async (state)`;
 * composição = camada que encadeia as filhas por passo (sequência `await`, paralelo `Promise.all`),
 * `for` = laço sobre a coleção, `if` = retorno ao "senão", `try/catch` = desvio para a função de tratamento.
 * Puro: (snapshot, opções) → texto + mapa de linhas por função.
 */
export interface CodegenOptions {
  /** Plano (padrão: o primeiro). */
  readonly planId?: string;
  /** Função raiz do fluxo (padrão: todas as raízes do plano). */
  readonly rootId?: string | null;
}
export interface Generated {
  readonly code: string;
  /** IDR da função → [linha inicial, linha final] (1-based) da função gerada. */
  readonly map: Readonly<Record<string, readonly [number, number]>>;
  /** Sugestão de nome de arquivo (`atender-pedido.ts`). */
  readonly fileName: string;
}

const slug = (t: string): string => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const camel = (t: string): string => slug(t).replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const RESERVED = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await async state error".split(" "));
const IDENT = /^[A-Za-z_$][\w$]*$/;
const q = (s: string): string => JSON.stringify(s);
const uniq = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
/** Nome de dado → variável (campos filhos `a.b` entram pelo dado raiz `a`). */
const dvar = (n: string): string => { const r = n.split(".")[0]!; return RESERVED.has(r) ? r + "_" : r; };

export function generateTypeScript(snap: Snapshot, opts: CodegenOptions = {}): Generated {
  const planId = opts.planId ?? snap.plans[0]?.id ?? "";
  const planName = snap.plans.find(p => p.id === planId)?.name ?? "plano";
  const rootId = opts.rootId ?? null;
  const S = buildScene(snap, { planId, rootId, closed: new Set(), flags: DEFAULT_FLAGS });
  const byId = new Map(snap.elements.map(e => [e.id, e] as const));
  // função de tratamento (alvo de onError) é exclusiva do catch: não entra na sequência
  const catchIds = new Set(snap.elements.filter(e => !e.archived && e.onError && byId.get(e.onError) && !byId.get(e.onError)!.archived).map(e => e.onError!));
  const roots = rootId ? [byId.get(rootId)].filter((e): e is FlowElement => !!e) : planTops(snap, planId).filter(t => !catchIds.has(t.id));
  const kidsOf = (e: FlowElement): FlowElement[] => children(snap, e.id).filter(k => k.kind === "file" && !k.archived && k.planId === planId && !catchIds.has(k.id));
  const isComp = (e: FlowElement): boolean => kidsOf(e).length > 0;
  const leavesOf = (e: FlowElement): FlowElement[] => (isComp(e) ? kidsOf(e).flatMap(leavesOf) : [e]);

  // ---------- nomes únicos ----------
  const used = new Set<string>(), names = new Map<string, string>();
  const nameOf = (e: FlowElement): string => {
    const hit = names.get(e.id); if (hit) return hit;
    let base = IDENT.test(e.title) ? e.title : camel(e.title) || "funcao";
    if (/^\d/.test(base)) base = "_" + base; if (RESERVED.has(base)) base += "_";
    let n = base, i = 2; while (used.has(n)) n = `${base}_${i++}`;
    used.add(n); names.set(e.id, n); return n;
  };

  // ---------- responsáveis e imports ----------
  const imports = new Map<string, string>(); // alias → linha
  let usesAgents = false, usesHumans = false;
  const aliasOf = (a: Agent): string => {
    const alias = slug(a.name.replace(/\.js$/, "")) || "mod";
    if (a.kind === "maquina") imports.set(alias, `import * as ${alias} from ${q(a.name)};`);
    else imports.set(alias, `import * as ${alias} from ${q("./" + (a.moduleFile ?? a.name))};`);
    return alias;
  };
  const agentOf = (e: FlowElement): Agent | undefined => S.agent(e.agentId);
  const respLabel = (e: FlowElement): string => { const a = agentOf(e); return a ? `${a.name} (${a.kind})` : "sem responsável"; };

  // ---------- entradas necessárias de uma função ----------
  const needsOf = (e: FlowElement): string[] => {
    if (!isComp(e)) return uniq(e.ins.map(dvar));
    const lv = kidsOf(e).flatMap(leavesOf), mine = new Set(lv.flatMap(x => x.outs.map(o => dvar(o[0]))));
    return uniq(lv.flatMap(x => x.ins.map(dvar)).filter(n => !mine.has(n)));
  };

  // ---------- geração ----------
  const out: string[] = [], map: Record<string, [number, number]> = {};
  const emitted = new Set<string>(), queue: FlowElement[] = [];
  const need = (e: FlowElement | undefined): void => { if (e && !emitted.has(e.id) && !queue.includes(e)) queue.push(e); };

  const leafCall = (e: FlowElement): string[] => {
    const a = agentOf(e), ins = uniq(e.ins.map(dvar)), args = ins.join(", ");
    if (!a) return [`// TODO: defina o responsável de "${e.title}"`];
    if (a.kind === "maquina") return [`${aliasOf(a)}.${IDENT.test(e.title) ? e.title : camel(e.title)}(${args})`];
    if (a.kind === "arquivo" || a.kind === "script") return [`${aliasOf(a)}.${IDENT.test(e.title) ? e.title : camel(e.title)}(${args})`];
    if (a.kind === "pessoa") { usesHumans = true; return [`humans.ask(${q(a.name)}, ${q(e.title)}, { ${ins.join(", ")} })`]; }
    usesAgents = true; return [`agents.${a.kind === "modelo" ? "model" : "ia"}(${q(a.name)}).run(${q(e.title)}, { ${ins.join(", ")} })`];
  };

  const emitLeaf = (e: FlowElement): string[] => {
    const L: string[] = [], outs = uniq(e.outs.map(o => dvar(o[0])));
    const ins = uniq([...e.ins.map(dvar), ...(e.loop ? [dvar(e.loop[0])] : [])]);
    L.push(`async function ${nameOf(e)}(state: State): Promise<State> {`);
    if (ins.length) L.push(`  const { ${ins.join(", ")} } = state;`);
    const call = leafCall(e);
    if (call[0]!.startsWith("//")) { L.push(`  ${call[0]}`, `  return { ${outs.map(o => `${o}: undefined`).join(", ")} };`.replace("{  }", "{}")); }
    else if (!outs.length) L.push(`  await ${call[0]};`, "  return {};");
    else if (outs.length === 1) L.push(`  const ${outs[0]} = await ${call[0]};`, `  return { ${outs[0]} };`);
    else L.push(`  const { ${outs.join(", ")} } = (await ${call[0]}) as State;`, `  return { ${outs.join(", ")} };`);
    L.push("}");
    return L;
  };

  /** Chamada de uma filha dentro da camada: `const { a } = await f({ ...state, x })`, com for / try / if.
   *  `inBlock`: o try é de um bloco com várias funções (declara as saídas e envolve o bloco todo), então aqui só atribui. */
  const emitCall = (x: FlowElement, scope: string[], ind: string, inBlock = false): string[] => {
    const L: string[] = [], fn = nameOf(x), outs = uniq(x.outs.map(o => dvar(o[0]))), handler = x.onError ? byId.get(x.onError) : undefined;
    const withErr = !inBlock && handler && !handler.archived ? handler : undefined;
    const args = (extra: string[] = []): string => { const n = needsOf(x).filter(v => scope.includes(v)); return `{ ...state${[...n, ...extra].map(v => ", " + v).join("")} }`; };
    const ctx = (extra = ""): string => `{ ...state${scope.map(v => ", " + v).join("")}${extra} }`;
    const assign = (!!withErr || !!x.loop || inBlock) && outs.length > 0;
    const bind = outs.length ? `{ ${outs.join(", ")} }` : "";
    const core: string[] = [];
    if (x.loop && !isComp(x)) {
      core.push(`for (const ${dvar(x.loop[0])} of ${dvar(x.loop[1])}) {`, `  ${outs.length ? `(${bind} = ` : ""}await ${fn}(${args([dvar(x.loop[0])])})${outs.length ? ")" : ""};`, "}");
    } else core.push(`${outs.length ? (assign ? `(${bind} = ` : `const ${bind} = `) : ""}await ${fn}(${args()})${assign ? ")" : ""};`);
    if (assign && !inBlock) L.push(`let ${outs.map(o => `${o}: unknown`).join(", ")};`);
    if (withErr) {
      need(withErr);
      L.push("try {", ...core.map(l => "  " + l), "} catch (error) {", `  return ${nameOf(withErr)}(${ctx(", error")});  // catch → ${withErr.title}`, "}");
    } else L.push(...core);
    outs.forEach(o => { if (!scope.includes(o)) scope.push(o); });
    if (x.cond) {
      const back = byId.get(x.cond[1]);
      if (back) { need(back); L.push(`if (!${dvar(x.cond[0])}) return ${nameOf(back)}(${ctx()});  // senão → ${back.title}`); }
    }
    return L.map(l => ind + l);
  };

  /** Um passo (estado) do fluxo: uma chamada, ou várias em paralelo (`Promise.all`). */
  const emitGroup = (g: FlowElement[], scope: string[], ind: string, inBlock: boolean): string[] => {
    g.forEach(k => { need(k); });
    if (g.length === 1) return emitCall(g[0]!, scope, ind, inBlock);
    const L: string[] = [];
    const outsOf = (k: FlowElement): string[] => uniq(k.outs.map(o => dvar(o[0])));
    const any = g.some(k => outsOf(k).length);
    const calls = g.map(k => {
      const fn = nameOf(k), n = needsOf(k).filter(v => scope.includes(v)), a = `{ ...state${n.map(v => ", " + v).join("")}${k.loop ? ", " + dvar(k.loop[0]) : ""} }`;
      let c = k.loop && !isComp(k) ? `Promise.all(${dvar(k.loop[1])}.map(${dvar(k.loop[0])} => ${fn}(${a}))).then(r => Object.assign({}, ...r) as State)` : `${fn}(${a})`;
      const h = !inBlock && k.onError ? byId.get(k.onError) : undefined;
      if (h && !h.archived) { need(h); c += `.catch(error => ${nameOf(h)}({ ...state${scope.map(v => ", " + v).join("")}, error }))`; }
      return c;
    });
    const pat = g.map(k => (outsOf(k).length ? `{ ${outsOf(k).join(", ")} }` : "")).join(", ");
    const head = any ? (inBlock ? `([${pat}] = ` : `const [${pat}] = `) : "";
    L.push(`${head}await Promise.all([  // paralelo`, ...calls.map(c => `  ${c},`), `])${any && inBlock ? ")" : ""};`);
    g.forEach(k => outsOf(k).forEach(o => { if (!scope.includes(o)) scope.push(o); }));
    g.filter(k => k.cond).forEach(k => { const back = byId.get(k.cond![1]); if (back) { need(back); L.push(`if (!${dvar(k.cond![0])}) return ${nameOf(back)}({ ...state${scope.map(v => ", " + v).join("")} });  // senão → ${back.title}`); } });
    return L.map(l => ind + l);
  };

  const emitComp = (e: FlowElement): string[] => {
    const L: string[] = [], kids = kidsOf(e), scope: string[] = [], nd = needsOf(e);
    L.push(`async function ${nameOf(e)}(state: State): Promise<State> {`);
    if (nd.length) L.push(`  // entradas esperadas (de outra camada): ${nd.join(", ")}`);
    const steps = new Map<number, FlowElement[]>();
    kids.forEach(k => { const st = S.layout[k.id]?.s ?? 0; (steps.get(st) ?? steps.set(st, []).get(st)!).push(k); });
    const groups = [...steps.keys()].sort((a, b) => a - b).map(k => steps.get(k)!);
    // blocos try com várias funções consecutivas (mesmo tratamento) → um único try { … } catch
    const blockOf = new Map<string, FlowElement[]>();
    let run: FlowElement[] = [];
    const flushRun = (): void => { if (run.length > 1) run.forEach(k => blockOf.set(k.id, run)); run = []; };
    kids.forEach(k => { if (k.onError && run.length && run[0]!.onError === k.onError) run.push(k); else { flushRun(); run = k.onError ? [k] : []; } });
    flushRun();
    for (let gi = 0; gi < groups.length;) {
      const g = groups[gi]!, B = g.map(k => blockOf.get(k.id)).find(Boolean);
      if (!B) { L.push(...emitGroup(g, scope, "  ", false)); gi++; continue; }
      const ids = new Set(B.map(k => k.id)), gs: FlowElement[][] = []; let seen = 0;
      while (gi < groups.length && seen < B.length) { const gg = groups[gi]!; gs.push(gg); seen += gg.filter(k => ids.has(k.id)).length; gi++; }
      const h = byId.get(B[0]!.onError!); if (!h) continue; need(h);
      const outsAll = uniq(gs.flat().flatMap(k => k.outs.map(o => dvar(o[0])))), before = scope.slice();
      if (outsAll.length) L.push(`  let ${outsAll.map(o => `${o}: unknown`).join(", ")};`);
      L.push("  try {", ...gs.flatMap(gg => emitGroup(gg, scope, "    ", true)), "  } catch (error) {", `    return ${nameOf(h)}({ ...state${before.map(v => ", " + v).join("")}, error });  // catch → ${h.title}`, "  }");
    }
    L.push(scope.length ? `  return { ${scope.join(", ")} };` : "  return {};", "}");
    return L;
  };

  const emit = (e: FlowElement): void => {
    if (emitted.has(e.id)) return; emitted.add(e.id);
    const body = isComp(e) ? emitComp(e) : emitLeaf(e);
    const doc = [`/** ${e.title} · ${respLabel(e)}${e.loop ? ` · for (${e.loop[0]} of ${e.loop[1]})` : ""}${e.onError ? " · try/catch" : ""} */`];
    const exp = roots.some(r => r.id === e.id) ? "export " : "";
    const start = out.length + 1;
    out.push(...doc, exp + body[0], ...body.slice(1), "");
    map[e.id] = [start, out.length - 1];
  };

  // raízes primeiro; depois as funções que elas referenciam (filhas, tratamentos, "senão")
  roots.forEach(r => { need(r); });
  while (queue.length) { const e = queue.shift()!; if (!emitted.has(e.id)) { emit(e); } }

  const external = uniq(roots.flatMap(needsOf));
  const head: string[] = [`// Gerado por @flow/component · plano ${q(planName)}${roots.length === 1 ? ` · fluxo ${q(roots[0]!.title)}` : ""}`];
  imports.forEach(l => head.push(l));
  if (usesAgents || usesHumans) head.push(`import { ${[usesAgents ? "agents" : "", usesHumans ? "humans" : ""].filter(Boolean).join(", ")} } from "@flow/runtime";`);
  head.push("", "type State = Record<string, unknown>;", "");
  const tail = roots.length === 1 && external.length ? [`// execução: await ${nameOf(roots[0]!)}({ ${external.join(", ")} });`] : [];
  const shift = head.length;
  Object.keys(map).forEach(k => { const [a, b] = map[k]!; map[k] = [a + shift, b + shift]; });
  const code = [...head, ...out, ...tail].join("\n").trimEnd() + "\n";
  const fileName = `${(slug(roots.length === 1 ? roots[0]!.title : planName) || "fluxo").replace(/_/g, "-")}.ts`;
  return { code, map, fileName };
}

/** Exporter pronto para o formato `ts` (os demais ficam para o host). */
export const typeScriptExporter: Exporter = {
  async export(planId: string, format: ExportFormat, snapshot: Snapshot) {
    return format === "ts" ? ok(generateTypeScript(snapshot, { planId }).code) : err("unsupported", `Formato "${format}" não suportado por este exporter`);
  },
};
