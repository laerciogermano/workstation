import type { ModelCommand } from "../commands";
import { descendants, ensureData, findAgent, findEl, flowSiblings, fnSiblings, isConcrete, isLeafFn, nextPosition, respExists } from "../graph";
import { err, ok, type Result } from "../result";
import type { FlowElement, Snapshot } from "../types";
import { applied, DATA_NAME, text, type Op } from "./context";
import { newFunction, removeElements } from "./tree";

type Cmd<T extends ModelCommand["type"]> = Extract<ModelCommand, { type: T }>;
const OUT_REF = (name: string): string => `out/${name}.json`;

const update = (s: Snapshot, id: string, f: (e: FlowElement) => FlowElement): Snapshot => ({ ...s, elements: s.elements.map(e => (e.id === id ? f(e) : e)) });
const needFn = (s: Snapshot, id: string): Result<FlowElement> => {
  const e = findEl(s, id);
  return !e ? err("not_found", `Elemento ${id} não existe`) : e.kind !== "file" ? err("invalid", "Só em funções") : ok(e);
};
const dataName = (n: string): Result<string> => (DATA_NAME.test(n.trim()) && n.trim().length <= 160 ? ok(n.trim()) : err("invalid", `Nome de dado inválido: "${n}"`));

/** Muda o responsável aplicando as regras de status e de task concreta. */
function withAgent(s: Snapshot, e: FlowElement, agentId: string | null, titleGiven: boolean): Result<FlowElement> {
  if (agentId !== null && !respExists(s, agentId)) return err("not_found", `Responsável ${agentId} não existe`);
  const a = agentId ? findAgent(s, agentId) : undefined;
  let next: FlowElement = { ...e, agentId };
  if (!agentId || a?.kind === "pessoa") next = { ...next, status: null, error: null };
  else if (!e.status) next = { ...next, status: "pendente" };
  if (isConcrete(a) && a!.tasks.length && !titleGiven && !a!.tasks.includes(next.title)) next = { ...next, title: a!.tasks[0]! };
  return ok(next);
}

// ---------- I/O ----------
export const addInput: Op<Cmd<"addInput">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const n = dataName(c.name); if (!n.ok) return n;
  if (e.value.ins.includes(n.value)) return applied(s);
  return applied({ ...update(s, c.id, x => ({ ...x, ins: [...x.ins, n.value] })), data: ensureData(s.data, n.value) });
};
export const removeInput: Op<Cmd<"removeInput">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  return e.value.ins.includes(c.name) ? applied(update(s, c.id, x => ({ ...x, ins: x.ins.filter(i => i !== c.name) }))) : err("not_found", `Entrada "${c.name}" não existe`);
};
export const addOutput: Op<Cmd<"addOutput">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const n = dataName(c.name); if (!n.ok) return n;
  if (e.value.outs.some(o => o[0] === n.value)) return applied(s);
  return applied({ ...update(s, c.id, x => ({ ...x, outs: [...x.outs, [n.value, c.ref ?? OUT_REF(n.value)] as const] })), data: ensureData(s.data, n.value) });
};
export const removeOutput: Op<Cmd<"removeOutput">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  return e.value.outs.some(o => o[0] === c.name) ? applied(update(s, c.id, x => ({ ...x, outs: x.outs.filter(o => o[0] !== c.name) }))) : err("not_found", `Saída "${c.name}" não existe`);
};

// ---------- cond (if) / loop (for) ----------
export const setCond: Op<Cmd<"setCond">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  if (c.cond === null) return applied(update(s, c.id, x => ({ ...x, cond: null })));
  const test = dataName(c.cond.test); if (!test.ok) return test;
  if (!findEl(s, c.cond.gotoId)) return err("not_found", `Destino ${c.cond.gotoId} não existe`);
  return applied({ ...update(s, c.id, x => ({ ...x, cond: [test.value, c.cond!.gotoId] as const })), data: ensureData(s.data, test.value) });
};
export const setLoopVars: Op<Cmd<"setLoopVars">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  if (c.loop === null) return applied(update(s, c.id, x => ({ ...x, loop: null })));
  const v = text("Variável", c.loop[0], 160), l = text("Coleção", c.loop[1], 160);
  if (!v.ok) return v; if (!l.ok) return l;
  return applied(update(s, c.id, x => ({ ...x, loop: [v.value, l.value] as const })));
};

// ---------- try / catch ----------
/** Funções cobertas: `id` até `through` (inclusive) entre as irmãs do fluxo principal. */
function tryRange(s: Snapshot, e: FlowElement, through?: string): Result<FlowElement[]> {
  if (!through || through === e.id) return ok([e]);
  const sibs = flowSiblings(s, e.parentId), i = sibs.findIndex(x => x.id === e.id), j = sibs.findIndex(x => x.id === through);
  if (i < 0 || j < 0) return err("invalid", "`through` deve ser uma irmã no fluxo principal");
  if (j < i) return err("invalid", "`through` deve vir depois de `id`");
  return ok(sibs.slice(i, j + 1));
}
/** Bloco try que contém `e`: irmãs consecutivas com o mesmo tratamento. */
function tryBlock(s: Snapshot, e: FlowElement): FlowElement[] {
  if (!e.onError) return [e];
  const sibs = flowSiblings(s, e.parentId); let i = sibs.findIndex(x => x.id === e.id), j = i;
  if (i < 0) return [e];
  while (i > 0 && sibs[i - 1]!.onError === e.onError) i--;
  while (j < sibs.length - 1 && sibs[j + 1]!.onError === e.onError) j++;
  return sibs.slice(i, j + 1);
}
const setOnError = (s: Snapshot, ids: readonly string[], handlerId: string | null): Snapshot => {
  const set = new Set(ids);
  return { ...s, elements: s.elements.map(x => (set.has(x.id) ? { ...x, onError: handlerId } : x)) };
};

/** Define (ou limpa) a função que trata a falha de `id` até `through`. O tratamento não pode estar dentro do try. */
export const setCatch: Op<Cmd<"setCatch">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const range = tryRange(s, e.value, c.through); if (!range.ok) return range;
  if (c.handlerId === null) return applied(setOnError(s, range.value.map(x => x.id), null));
  const hd = findEl(s, c.handlerId);
  if (!hd || hd.kind !== "file") return err("not_found", `Função ${c.handlerId} não existe`);
  if (range.value.some(m => m.id === hd.id || descendants(s, m.id).some(d => d.id === hd.id))) return err("invalid", "O tratamento não pode estar dentro do próprio try");
  return applied(setOnError(s, range.value.map(x => x.id), c.handlerId));
};

/** Contexto da função de tratamento criada automaticamente (permite removê-la ao desligar o try). */
export const CATCH_CONTEXT = "Tratamento de falha";

/**
 * try/catch liga/desliga. Ligar cria a função de tratamento ("Tratar falha"): exclusiva do catch, fora da
 * sequência e desenhada abaixo do try. `through` faz um único try cobrir várias funções consecutivas.
 * Desligar limpa o bloco inteiro e remove a função de tratamento se ainda estiver intocada.
 */
export const setTryCatch: Op<Cmd<"setTryCatch">> = (s, c, ctx) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  if (!c.on) {
    if (!e.value.onError) return err("invalid", "Esta função não tem try/catch");
    const handlerId = e.value.onError, h = findEl(s, handlerId);
    const cleared = setOnError(s, tryBlock(s, e.value).map(x => x.id), null);
    const shared = cleared.elements.some(x => x.onError === handlerId);
    const pristine = h && h.context === CATCH_CONTEXT && !shared && !h.agentId && !h.ins.length && !h.outs.length && !h.loop && !h.cond && !h.onError
      && !cleared.elements.some(x => x.parentId === h.id);
    return pristine ? removeElements(cleared, { type: "removeElements", ids: [h.id] }, ctx) : applied(cleared);
  }
  const range = tryRange(s, e.value, c.through); if (!range.ok) return range;
  if (e.value.onError) return c.through ? applied(setOnError(s, range.value.map(x => x.id), e.value.onError)) : applied(s); // estende o bloco
  const h = { ...newFunction(ctx.newId(), e.value.planId, "Tratar falha", CATCH_CONTEXT, nextPosition(s, e.value.parentId)), parentId: e.value.parentId };
  return applied(setOnError({ ...s, elements: [...s.elements, h] }, range.value.map(x => x.id), h.id), { created: [h.id] });
};

/** `for` liga/desliga numa função folha. */
export const setRepetition: Op<Cmd<"setRepetition">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  if (!c.on) return applied(update(s, c.id, x => ({ ...x, loop: null })));
  if (!isLeafFn(s, e.value)) return err("invalid", "Repetição aplica-se a uma task folha");
  return applied(update(s, c.id, x => ({ ...x, loop: x.loop ?? (["item", "lista"] as const) })));
};

/** `if` liga/desliga: o corpo guarda os membros; ligar volta para a função anterior. */
export const setSelection: Op<Cmd<"setSelection">> = (s, c, ctx) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const st = s.structs.find(x => x.body.includes(c.id));
  if (!c.on) {
    if (!st) return err("invalid", "Esta task não está numa seleção");
    const members = new Set(st.body);
    return applied({ ...s, elements: s.elements.map(x => (members.has(x.id) ? { ...x, cond: null } : x)), structs: s.structs.filter(x => x.id !== st.id) });
  }
  if (!isLeafFn(s, e.value)) return err("invalid", "Seleção aplica-se a uma task folha");
  if (st) return applied(s);
  const test = e.value.ins[0] ?? "condicao";
  const sibs = fnSiblings(s, e.value.parentId, e.value.id).filter(x => x.planId === e.value.planId);
  const prev = [...sibs].reverse().find(x => x.position < e.value.position);
  const elements = prev ? s.elements.map(x => (x.id === c.id ? { ...x, cond: [test, prev.id] as const } : x)) : s.elements;
  return applied({ ...s, elements, structs: [...s.structs, { id: ctx.newId(), test, body: [c.id] }], data: ensureData(s.data, test) });
};

// ---------- patch / responsável / task ----------
export const patchFunction: Op<Cmd<"patchFunction">> = (s, c, ctx) => {
  const e = findEl(s, c.id); if (!e) return err("not_found", `Elemento ${c.id} não existe`);
  const p = c.patch; let cur: FlowElement = e; let snap = s;
  if (p.title !== undefined) { const t = text("Título", p.title, 200); if (!t.ok) return t; cur = { ...cur, title: t.value }; }
  if (p.context !== undefined) { if (p.context !== null && p.context.length > 2000) return err("invalid", "Contexto excede 2000 caracteres"); cur = { ...cur, context: p.context }; }
  if (p.code !== undefined) { if (p.code !== null && p.code.length > 100_000) return err("invalid", "Código excede 100000 caracteres"); cur = { ...cur, code: p.code }; }
  if (p.respId !== undefined) { if (p.respId !== null && !respExists(s, p.respId)) return err("not_found", `Responsável ${p.respId} não existe`); cur = { ...cur, respId: p.respId }; }
  if (p.agentId !== undefined) { const r = withAgent(s, cur, p.agentId, p.title !== undefined); if (!r.ok) return r; cur = r.value; }
  snap = update(snap, c.id, () => cur);
  const steps: ModelCommand[] = [];
  if (p.loop !== undefined) steps.push({ type: "setLoopVars", id: c.id, loop: p.loop });
  if (p.cond !== undefined) steps.push({ type: "setCond", id: c.id, cond: p.cond });
  if (p.onError !== undefined) steps.push({ type: "setCatch", id: c.id, handlerId: p.onError });
  if (p.ins) {
    const ins = [...new Set(p.ins)]; for (const n of ins) { const v = dataName(n); if (!v.ok) return v; }
    snap = update(snap, c.id, x => ({ ...x, ins })); snap = { ...snap, data: ins.reduce((d, n) => ensureData(d, n), snap.data) };
  }
  if (p.outs) {
    const seen = new Set<string>(), outs: (readonly [string, string])[] = [];
    for (const [n, ref] of p.outs) { const v = dataName(n); if (!v.ok) return v; if (!seen.has(n)) { seen.add(n); outs.push([n, ref ?? OUT_REF(n)]); } }
    snap = update(snap, c.id, x => ({ ...x, outs })); snap = { ...snap, data: outs.reduce((d, [n]) => ensureData(d, n), snap.data) };
  }
  const run = (cmds: readonly ModelCommand[], from: Snapshot): Result<Snapshot> => {
    let cs = from;
    for (const cm of cmds) { const r = cm.type === "setLoopVars" ? setLoopVars(cs, cm, ctx) : cm.type === "setCond" ? setCond(cs, cm, ctx) : cm.type === "setCatch" ? setCatch(cs, cm, ctx) : ok(null); if (r && !r.ok) return r; if (r?.ok && r.value) cs = r.value.snapshot; }
    return ok(cs);
  };
  const out = run(steps, snap); if (!out.ok) return out;
  return applied(out.value);
};

export const assignResponsible: Op<Cmd<"assignResponsible">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const r = withAgent(s, e.value, c.agentId, false); if (!r.ok) return r;
  return applied(update(s, c.id, () => r.value));
};

/** Task: concreto → precisa estar em `agent.tasks`; abstrato → verbo livre. */
export const setTask: Op<Cmd<"setTask">> = (s, c) => {
  const e = needFn(s, c.id); if (!e.ok) return e;
  const t = text("Task", c.task, 200); if (!t.ok) return t;
  const a = e.value.agentId ? findAgent(s, e.value.agentId) : undefined;
  if (isConcrete(a) && a!.tasks.length && !a!.tasks.includes(t.value)) return err("invalid", `Task "${t.value}" não existe em ${a!.name}`);
  return applied(update(s, c.id, x => ({ ...x, title: t.value })));
};
