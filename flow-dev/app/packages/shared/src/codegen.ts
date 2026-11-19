import type { ElementDto } from "./types";
import type { FlowModel } from "./model";
import { camel, slug, slugFile } from "./text";

export type ExportFormat = "ir" | "js" | "ts" | "py";

export function exportFileName(m: FlowModel, planId: string, f: ExportFormat): string {
  const pl = m.plans.find(p => p.id === planId)?.name ?? "plano";
  return { ir: "plano.fop", js: slugFile(pl) + ".js", ts: slugFile(pl) + ".ts", py: slug(pl) + ".py" }[f];
}

const leavesOf = (m: FlowModel, u: ElementDto): ElementDto[] => (m.flowKids(u).length ? m.flowKids(u).flatMap(k => leavesOf(m, k)) : [u]);
const stepsOf = (m: FlowModel, kids: ElementDto[], plan: string): [number, ElementDto[]][] => {
  const { layout } = m.flowLayout(plan);
  const steps: Record<number, ElementDto[]> = {};
  kids.forEach(x => (steps[layout[x.id]?.s ?? 0] ||= []).push(x));
  return Object.keys(steps).map(Number).sort((a, b) => a - b).map(k => [k, steps[k]!]);
};
const bindOf = (u: ElementDto): string | null => (u.outs.length ? `{ ${u.outs.map(x => x[0]).join(", ")} }` : null);

/** JavaScript no estilo do documento FOP: camadas, endereços abstratos/concretos, Promise.all, if, recursão. */
export function jsCode(m: FlowModel, plan: string): string {
  const pl = m.plans.find(p => p.id === plan)?.name ?? "plano";
  const tops = m.planTops(plan);
  const leaves = tops.flatMap(t => leavesOf(m, t)).filter(u => !m.isData(u));
  const { ia, ext } = m.fopLayers(plan);
  const seq = m.seqLinks;
  const L: string[] = [`// Gerado pelo Flow.dev · Programação Orientada a Fluxo · plano "${pl}"`, "// endereços que se conhecem = mesma camada (import concreto)"];
  leaves.forEach(u => L.push(`import ${camel(u.title)} from './${slug(u.title)}';`));
  L.push("");
  const args = (u: ElementDto, extra: string[] = []) => `{ ...state${[...u.ins, ...extra].map(n => ", " + n).join("")} }`;
  const call = (u: ElementDto) => u.loop
    ? `Promise.all(${u.loop[1]}.map(${u.loop[0]} => ${camel(u.title)}(${args(u, [u.loop[0]])}))).then(r => Object.assign({}, ...r))`
    : `${camel(u.title)}(${args(u)})`;
  const fnOf = (g: ElementDto, all: ElementDto[]): string[] => {
    const B: string[] = [], kids = m.flowKids(g), lv = kids.flatMap(k => leavesOf(m, k));
    const mine = new Set(lv.flatMap(x => x.outs.map(o => o[0])));
    const need = [...new Set(lv.filter(x => !m.isData(x)).flatMap(x => x.ins).filter(n => !mine.has(n)))];
    const ias = [...new Set(lv.map(x => m.agent(x.agentId)).filter(a => (a?.kind === "ia" || a?.kind === "modelo")).map(a => camel(a!.name)))];
    B.push(`export async function ${camel(g.title)}(state) {`);
    if (need.length || ias.length) B.push(`  const { ${[...need, ...ias].join(", ")} } = state;  // endereços abstratos: outra camada`);
    stepsOf(m, kids, plan).forEach(([, items]) => {
      const fs = items.filter(x => !m.isData(x)), ds = items.filter(x => m.isData(x));
      if (fs.length > 1) {
        B.push(`  const [${fs.map(x => bindOf(x) || "_").join(", ")}] = await Promise.all([  // paralelo`);
        fs.forEach(x => B.push(`    ${call(x)},${x.loop ? "  // repetição" : ""}`));
        B.push("  ]);");
      } else fs.forEach(x => B.push(`  ${bindOf(x) ? "const " + bindOf(x) + " = " : ""}await ${call(x)};  // ${x.loop ? "repetição" : "sequência"}`));
      fs.filter(x => x.cond).forEach(x => B.push(`  if (!${x.cond![0]}) return ${camel(g.title)}({ ...state });  // seleção → repetição (volta a ${m.u(x.cond![1])?.title ?? "?"})`));
      ds.forEach(d => B.push(`  // ◆ ${d.title}: ${d.ins.join(", ")}`));
    });
    const used = new Set(all.filter(x => x !== g).flatMap(x => leavesOf(m, x)).flatMap(x => x.ins));
    const ret = [...mine].filter(n => used.has(n) || kids.some(x => !m.isData(x) && !seq.some(([a]) => a === x.id) && x.outs.some(o => o[0] === n)) || kids.some(x => m.isData(x) && x.ins.includes(n) && !seq.some(([a]) => a === x.id)));
    B.push(ret.length ? `  return { ${ret.join(", ")} };` : "  return;", "}", "");
    return B;
  };
  tops.filter(t => m.flowKids(t).length).forEach(t => L.push(...fnOf(t, tops)));
  L.push("// diferentes camadas formam um contexto", `export default async function ${camel(pl)}(state) {`);
  tops.forEach(t => L.push(m.flowKids(t).length ? `  state = { ...state, ...(await ${camel(t.title)}(state)) };` : `  state = { ...state, ...(await ${call(t)}) };`));
  L.push("  return state;", "}", "", "// a execução do fluxo ocorre quando o contexto está completo", `await ${camel(pl)}({`);
  ia.forEach(a => L.push(`  ${camel(a.name)}: agents.ia('${a.name}'),`));
  ext.forEach(n => L.push(`  ${n}: /* entrada externa */,`));
  L.push("});");
  return L.join("\n");
}

/** FOP-IR: representação intermediária (seq / par / select / repeat). */
export function irCode(m: FlowModel, plan: string): string {
  const pl = m.plans.find(p => p.id === plan)?.name ?? "plano";
  const L: string[] = [`# FOP-IR v1 · plano "${pl}" · gerado pelo Flow.dev`, `plan ${slug(pl)}`];
  const arts: Record<string, string> = {};
  m.ganttRows(plan).forEach(({ u }) => u.outs.forEach(([n, r]) => { arts[n] = r; }));
  Object.entries(arts).forEach(([n, r]) => L.push(`  state ${n}: "${r}"`));
  L.push("");
  const task = (u: ElementDto) => { const a = m.agent(u.agentId); return `task ${slug(u.title)} (${a ? a.kind + ":" + a.name : "sem-agente"}) ${u.ins.join(", ") || "∅"} → ${u.outs.map(o => o[0]).join(", ") || "∅"}`; };
  const emit = (u: ElementDto, ind: string): void => {
    const ks = m.flowKids(u).filter(k => !m.isData(k));
    if (!ks.length) {
      let p = ind;
      if (u.loop) { L.push(`${p}repeat ${u.loop[0]} in ${u.loop[1]}`); p += "  "; }
      L.push(`${p}${task(u)}`);
      if (u.cond) L.push(`${ind}select ${u.cond[0]}.ok`, `${ind}  else goto ${slug(m.u(u.cond[1])?.title ?? "?")}`);
      return;
    }
    L.push(`${ind}group ${slug(u.title)}`);
    stepsOf(m, ks, plan).forEach(([, items]) => {
      const fs = items.filter(x => !m.isData(x));
      if (fs.length > 1) { L.push(`${ind}  par`); fs.forEach(x => emit(x, ind + "    ")); } else fs.forEach(x => emit(x, ind + "  "));
    });
  };
  L.push("  seq");
  m.planTops(plan).forEach(t => emit(t, "    "));
  return L.join("\n");
}

const agentRef = (m: FlowModel, u: ElementDto): string => { const a = m.agent(u.agentId); return a ? `agents.${a.kind}("${a.name}")` : "agents.nenhum()"; };

/** TypeScript (via IR): run(agente, função, entradas). */
export function tsCode(m: FlowModel, plan: string): string {
  const pl = m.plans.find(p => p.id === plan)?.name ?? "plano";
  const L: string[] = [`// Gerado pelo Flow.dev a partir do FOP-IR · plano "${pl}"`, `import { run, agents } from "@flow/runtime"`];
  const leaves = m.planTops(plan).flatMap(t => leavesOf(m, t)).filter(u => !m.isData(u));
  L.push(`import { ${[...new Set(leaves.map(u => camel(u.title)))].join(", ")} } from "./tarefas"`, "");
  const inp = (u: ElementDto, extra: string[] = []) => `{ ${[...u.ins, ...extra].join(", ")} }`;
  const runCall = (u: ElementDto) => u.loop
    ? `Promise.all(${u.loop[1]}.map(${u.loop[0]} =>\n      run(${agentRef(m, u)}, ${camel(u.title)}, ${inp(u, [u.loop[0]])})))`
    : `run(${agentRef(m, u)}, ${camel(u.title)}, ${inp(u)})`;
  const body = (u: ElementDto, ind: string): string[] => {
    const out: string[] = [];
    const ks = m.flowKids(u).filter(k => !m.isData(k));
    if (!ks.length) { out.push(`${ind}${bindOf(u) ? "const " + bindOf(u) + " = " : ""}await ${runCall(u)}`); return out; }
    stepsOf(m, ks, plan).forEach(([, items]) => {
      const fs = items.filter(x => !m.isData(x));
      if (fs.length > 1) {
        out.push(`${ind}const [${fs.map(x => bindOf(x) || "_").join(", ")}] = await Promise.all([  // paralelo`);
        fs.forEach(x => out.push(`${ind}  ${runCall(x)},`));
        out.push(`${ind}])`);
      } else fs.forEach(x => {
        if (x.cond && m.flowKids(x).length === 0) {
          const back = m.u(x.cond[1]);
          out.push(`${ind}${bindOf(x) ? "const " + bindOf(x) + " = " : ""}await ${runCall(x)}`, `${ind}if (!${x.cond[0]}) return ${camel(u.title)}(state)  // seleção: volta a ${back?.title ?? "?"}`);
        } else out.push(...body(x, ind));
      });
    });
    return out;
  };
  m.planTops(plan).forEach(t => {
    L.push(`export async function ${camel(t.title)}(state: Record<string, unknown> = {}) {`);
    const need = [...new Set(leavesOf(m, t).flatMap(x => x.ins))];
    if (need.length) L.push(`  const { ${need.join(", ")} } = state as any`);
    L.push(...body(t, "  "), "}", "");
  });
  return L.join("\n").trimEnd();
}

/** Python (via IR): asyncio.gather. */
export function pyCode(m: FlowModel, plan: string): string {
  const pl = m.plans.find(p => p.id === plan)?.name ?? "plano";
  const leaves = m.planTops(plan).flatMap(t => leavesOf(m, t)).filter(u => !m.isData(u));
  const L: string[] = [`# Gerado pelo Flow.dev a partir do FOP-IR · plano "${pl}"`, "import asyncio", "from flow.runtime import run, agents", `from tarefas import ${[...new Set(leaves.map(u => slug(u.title)))].join(", ")}`, ""];
  const pyAgent = (u: ElementDto) => { const a = m.agent(u.agentId); return a ? `agents.${a.kind}("${a.name}")` : "agents.nenhum()"; };
  const dict = (u: ElementDto, extra: string[] = []) => `{${[...u.ins, ...extra].map(n => `"${n}": ${n}`).join(", ")}}`;
  const runCall = (u: ElementDto) => u.loop
    ? `asyncio.gather(*[run(${pyAgent(u)}, ${slug(u.title)}, ${dict(u, [u.loop[0]])}) for ${u.loop[0]} in ${u.loop[1]}])`
    : `run(${pyAgent(u)}, ${slug(u.title)}, ${dict(u)})`;
  const bind = (u: ElementDto) => (u.outs.length ? u.outs.map(o => o[0]).join(", ") : "_");
  const body = (u: ElementDto, ind: string): string[] => {
    const out: string[] = [];
    const ks = m.flowKids(u).filter(k => !m.isData(k));
    if (!ks.length) { out.push(`${ind}${bind(u)} = await ${runCall(u)}`); return out; }
    stepsOf(m, ks, plan).forEach(([, items]) => {
      const fs = items.filter(x => !m.isData(x));
      if (fs.length > 1) out.push(`${ind}${fs.map(bind).join(", ")} = await asyncio.gather(  # paralelo`, ...fs.map(x => `${ind}    ${runCall(x)},`), `${ind})`);
      else fs.forEach(x => {
        out.push(...body(x, ind));
        if (x.cond && !m.flowKids(x).length) out.push(`${ind}if not ${x.cond[0]}:  # seleção: volta a ${m.u(x.cond[1])?.title ?? "?"}`, `${ind}    return await ${slug(u.title)}(state)`);
      });
    });
    return out;
  };
  m.planTops(plan).forEach(t => {
    L.push(`async def ${slug(t.title)}(state=None):`, "    state = state or {}");
    [...new Set(leavesOf(m, t).flatMap(x => x.ins))].forEach(n => L.push(`    ${n} = state.get("${n}")`));
    L.push(...body(t, "    "), "");
  });
  return L.join("\n").trimEnd();
}

export function generate(m: FlowModel, plan: string, f: ExportFormat): string {
  return f === "ir" ? irCode(m, plan) : f === "js" ? jsCode(m, plan) : f === "ts" ? tsCode(m, plan) : pyCode(m, plan);
}
