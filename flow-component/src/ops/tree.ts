import type { ModelCommand } from "../commands";
import { children, compact, descendants, findEl, fnSiblings, nextPosition, withOrder } from "../graph";
import { err, ok, type Result } from "../result";
import type { FlowElement, Link, LinkKind, Snapshot, Struct } from "../types";
import { applied, type Op, type OpContext } from "./context";

type Cmd<T extends ModelCommand["type"]> = Extract<ModelCommand, { type: T }>;
type Mode = "child" | "after" | "before";

// ---------- links e estruturas ----------
const addLink = (links: readonly Link[], from: string, to: string, kind: LinkKind = "seq"): readonly Link[] =>
  from === to || links.some(l => l.from === from && l.to === to && l.kind === kind) ? links : [...links, { from, to, kind }];

const dedupe = (links: readonly Link[]): readonly Link[] =>
  links.reduce<readonly Link[]>((acc, l) => addLink(acc, l.from, l.to, l.kind), []);

/** Remove ids dos corpos de `if` e descarta estruturas vazias. */
const pruneStructs = (structs: readonly Struct[], gone: ReadonlySet<string>): readonly Struct[] =>
  structs.map(st => ({ ...st, body: st.body.filter(id => !gone.has(id)) })).filter(st => st.body.length > 0);

/** Tira `id` da sequência sem apagar: a → id → b vira a → b. */
function unlinkSeq(s: Snapshot, id: string): Snapshot {
  const ins = s.links.filter(l => l.kind === "seq" && l.to === id).map(l => l.from);
  const outs = s.links.filter(l => l.kind === "seq" && l.from === id).map(l => l.to);
  let links: readonly Link[] = s.links.filter(l => l.from !== id && l.to !== id);
  for (const a of ins) for (const b of outs) links = addLink(links, a, b);
  return { ...s, links, structs: s.structs.map(st => ({ ...st, body: st.body.filter(x => x !== id) })) };
}

/** Encaixa `uId` (com subárvore) junto de `refId`; religa a sequência e entra no corpo do `if` de ref. */
function linkInto(s: Snapshot, uId: string, refId: string, mode: Mode): Snapshot {
  const u = findEl(s, uId)!, ref = findEl(s, refId)!;
  const parentId = mode === "child" ? ref.id : ref.parentId;
  const sibIds = new Set(fnSiblings(s, parentId, u.id).map(e => e.id));
  const sibs = fnSiblings(s, parentId, u.id);

  let elements: readonly FlowElement[] = s.elements;
  if (u.parentId !== parentId) elements = withOrder(elements, children(s, u.parentId).filter(e => e.id !== u.id).map(e => e.id));
  elements = elements.map(e => (e.id === u.id ? { ...e, parentId } : e));
  const moved: Snapshot = { ...s, elements };
  const order = children(moved, parentId).filter(e => e.id !== u.id).map(e => e.id);
  const at = mode === "child" ? order.length : order.indexOf(ref.id) + (mode === "after" ? 1 : 0);
  order.splice(at < 0 ? order.length : at, 0, u.id);
  elements = withOrder(elements, order);
  const block = new Set([u.id, ...descendants({ ...s, elements }, u.id).map(e => e.id)]);
  elements = elements.map(e => (block.has(e.id) && e.planId !== ref.planId ? { ...e, planId: ref.planId } : e));

  let links: readonly Link[] = s.links;
  if (mode === "child") {
    const last = sibs.at(-1);
    if (last) links = addLink(links, last.id, u.id);
  } else if (mode === "after") {
    links = addLink(links.map(l => (l.kind === "seq" && l.from === ref.id && sibIds.has(l.to) && l.to !== u.id ? { ...l, from: u.id } : l)), ref.id, u.id);
  } else {
    links = addLink(links.map(l => (l.kind === "seq" && l.to === ref.id && sibIds.has(l.from) && l.from !== u.id ? { ...l, to: u.id } : l)), u.id, ref.id);
  }

  const structs = mode === "child" ? s.structs : s.structs.map(st => {
    const i = st.body.indexOf(ref.id);
    if (i < 0 || st.body.includes(u.id)) return st;
    const body = [...st.body]; body.splice(i + (mode === "after" ? 1 : 0), 0, u.id);
    return { ...st, body };
  });
  return { ...s, elements, links: dedupe(links), structs };
}

export const newFunction = (id: string, planId: string, title: string, context: string | null, position: number): FlowElement => ({
  id, planId, parentId: null, kind: "file", title, context, agentId: null, respId: null, status: null, error: null, progress: null,
  loop: null, cond: null, code: null, archived: false, position, ins: [], outs: [],
});

const cleanTitle = (t: string | undefined, fallback: string): Result<string> => {
  const v = (t ?? fallback).trim();
  return !v ? err("invalid", "Título não pode ser vazio") : v.length > 200 ? err("invalid", "Título excede 200 caracteres") : ok(v);
};

// ---------- criação ----------
export const createFunction: Op<Cmd<"createFunction">> = (s, c, ctx) => {
  if (!s.plans.some(p => p.id === c.planId)) return err("not_found", `Plano ${c.planId} não existe`);
  const title = cleanTitle(c.title, "Fazer novo fluxo"); if (!title.ok) return title;
  const root = s.elements.filter(e => e.planId === c.planId && e.kind === "folder" && e.parentId === null && !e.archived).sort((a, b) => a.position - b.position)[0];
  const el = { ...newFunction(ctx.newId(), c.planId, title.value, c.context ?? "Fluxo adicionado no Explorar", nextPosition(s, root?.id ?? null)), parentId: root?.id ?? null };
  return applied({ ...s, elements: [...s.elements, el] }, { created: [el.id] });
};

function createNear(s: Snapshot, refId: string, mode: Mode, title: string | undefined, context: string | undefined, ctx: OpContext): Result<import("../commands").Applied> {
  // irmão da função de tratamento (catch) fica dentro do catch: vira filha dela (depois da última, ou antes da primeira)
  const target = findEl(s, refId);
  if (target && mode !== "child" && s.elements.some(x => !x.archived && x.onError === target.id)) {
    const first = mode === "before" ? children(s, target.id).find(k => k.kind !== "folder" && !k.archived) : undefined;
    return createNear(s, first ? first.id : target.id, first ? "before" : "child", title, context, ctx);
  }
  const ref = findEl(s, refId); if (!ref) return err("not_found", `Elemento ${refId} não existe`);
  if (ref.kind === "data") return err("invalid", "Dado não aceita filhos nem irmãos");
  if (mode !== "child" && ref.parentId === null) return err("invalid", "A raiz do fluxo não ganha irmão");
  const t = cleanTitle(title, "Fazer nova função"); if (!t.ok) return t;
  const el = newFunction(ctx.newId(), ref.planId, t.value, context ?? null, 999_999);
  // irmão de uma função coberta por try entra no mesmo bloco try/catch (o `if` já é tratado em linkInto)
  const inherited = mode !== "child" && ref.onError ? { ...el, onError: ref.onError } : el;
  return applied(linkInto({ ...s, elements: [...s.elements, inherited] }, el.id, ref.id, mode), { created: [el.id] });
}
export const createChild: Op<Cmd<"createChild">> = (s, c, ctx) => createNear(s, c.refId, "child", c.title, c.context, ctx);
export const createSibling: Op<Cmd<"createSibling">> = (s, c, ctx) => createNear(s, c.refId, c.position, c.title, c.context, ctx);

// ---------- rename / archive ----------
export const renameFunction: Op<Cmd<"renameFunction">> = (s, c) => {
  const e = findEl(s, c.id); if (!e) return err("not_found", `Elemento ${c.id} não existe`);
  const t = cleanTitle(c.title, ""); if (!t.ok) return t;
  return applied({ ...s, elements: s.elements.map(x => (x.id === c.id ? { ...x, title: t.value } : x)) });
};

const setArchived = (s: Snapshot, id: string, archived: boolean): Result<import("../commands").Applied> => {
  if (!findEl(s, id)) return err("not_found", `Elemento ${id} não existe`);
  const elements = s.elements.map(x => (x.id === id ? { ...x, archived } : x));
  return applied({ ...s, elements, structs: archived ? pruneStructs(s.structs, new Set([id])) : s.structs });
};
export const archive: Op<Cmd<"archive">> = (s, c) => setArchived(s, c.id, true);
export const unarchive: Op<Cmd<"unarchive">> = (s, c) => setArchived(s, c.id, false);

// ---------- remoção ----------
export const removeElements: Op<Cmd<"removeElements">> = (s, c) => {
  let cur = s; const removed: string[] = [];
  for (const id of c.ids) {
    const u = findEl(cur, id); if (!u) continue; // já saiu junto de um ancestral
    const gone = new Set([u.id, ...descendants(cur, u.id).map(e => e.id)]);
    const base = unlinkSeq(cur, u.id);
    const elements = base.elements.filter(e => !gone.has(e.id)).map(e => ({ ...e, ...(e.cond && gone.has(e.cond[1]) ? { cond: null } : {}), ...(e.onError && gone.has(e.onError) ? { onError: null } : {}) }));
    cur = { ...base, elements, links: base.links.filter(l => !gone.has(l.from) && !gone.has(l.to)), structs: pruneStructs(base.structs, gone) };
    cur = { ...cur, elements: compact(cur, u.parentId) };
    removed.push(...gone);
  }
  return removed.length ? applied(cur, { removed }) : err("not_found", "Nenhum dos elementos existe");
};

// ---------- clonar / duplicar / colar ----------
function cloneTree(s: Snapshot, srcId: string, parentId: string | null, ctx: OpContext): { snapshot: Snapshot; topId: string } {
  const src = findEl(s, srcId)!;
  const titles = new Set(s.elements.filter(e => e.parentId === parentId).map(e => e.title));
  let title = src.title;
  if (titles.has(title)) { title = `${src.title} (cópia)`; let n = 2; while (titles.has(title)) title = `${src.title} (cópia ${n++})`; }
  const id = ctx.newId();
  const copy: FlowElement = { ...src, id, parentId, title, position: nextPosition(s, parentId), status: src.status ? "pendente" : null, error: null, progress: null };
  let cur: Snapshot = { ...s, elements: [...s.elements, copy] };
  for (const k of children(s, srcId)) cur = cloneTree(cur, k.id, id, ctx).snapshot;
  return { snapshot: cur, topId: id };
}

function pasteInto(s: Snapshot, ids: readonly string[], mode: "cut" | "copy", destId: string | null, ctx: OpContext): Result<import("../commands").Applied> {
  const dest = destId ? findEl(s, destId) : null;
  if (destId && !dest) return err("not_found", `Destino ${destId} não existe`);
  if (dest?.kind === "data") return err("invalid", "Destino inválido");
  let cur = s; const created: string[] = [];
  for (const id of ids) {
    const u = findEl(cur, id); if (!u) return err("not_found", `Elemento ${id} não existe`);
    if (mode === "copy") { const r = cloneTree(cur, u.id, dest?.id ?? null, ctx); cur = r.snapshot; created.push(r.topId); continue; }
    if (dest && (u.id === dest.id || descendants(cur, u.id).some(d => d.id === dest.id))) return err("invalid", "Não dá para colar dentro dele mesmo");
    const oldParent = u.parentId;
    cur = unlinkSeq(cur, u.id);
    const pos = nextPosition(cur, dest?.id ?? null);
    const block = new Set([u.id, ...descendants(cur, u.id).map(e => e.id)]);
    cur = { ...cur, elements: cur.elements.map(e => (e.id === u.id ? { ...e, parentId: dest?.id ?? null, position: pos } : dest && block.has(e.id) ? { ...e, planId: dest.planId } : e)) };
    cur = { ...cur, elements: compact(cur, oldParent) };
  }
  return applied(cur, { created });
}
export const paste: Op<Cmd<"paste">> = (s, c, ctx) => c.ids.length ? pasteInto(s, c.ids, c.mode, c.destId, ctx) : err("invalid", "Nada para colar");
export const duplicate: Op<Cmd<"duplicate">> = (s, c, ctx) => {
  const u = findEl(s, c.id); if (!u) return err("not_found", `Elemento ${c.id} não existe`);
  return pasteInto(s, [c.id], "copy", u.parentId, ctx);
};

// ---------- mover ----------
export const move: Op<Cmd<"move">> = (s, c) => {
  const u = findEl(s, c.id), ref = findEl(s, c.refId);
  if (!u || !ref) return err("not_found", "Elemento ou referência não existe");
  if (u.id === ref.id || u.kind === "data") return err("invalid", "Movimento inválido");
  if (descendants(s, u.id).some(d => d.id === ref.id)) return err("invalid", "Não dá para mover para dentro dele mesmo");
  if (c.mode !== "child" && ref.parentId === null) return err("invalid", "A raiz do fluxo não ganha irmão");
  return applied(linkInto(unlinkSeq(s, u.id), u.id, ref.id, c.mode));
};

// ---------- paralelo ----------
export const setParallel: Op<Cmd<"setParallel">> = (s, c) => {
  if (!findEl(s, c.a) || !findEl(s, c.b)) return err("not_found", "Elemento não existe");
  if (c.a === c.b) return err("invalid", "Paralelo exige duas funções distintas");
  const links = c.on ? addLink(s.links, c.a, c.b, "par")
    : s.links.filter(l => !(l.kind === "par" && ((l.from === c.a && l.to === c.b) || (l.from === c.b && l.to === c.a))));
  return applied({ ...s, links });
};
