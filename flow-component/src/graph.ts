import type { Agent, DataDef, DataType, FlowElement, Snapshot } from "./types";
import { FILE_AGENT, MODEL_AGENT } from "./types";

/** Consultas puras sobre um Snapshot. Nenhuma devolve estrutura mutável compartilhada. */
export const findEl = (s: Snapshot, id: string): FlowElement | undefined => s.elements.find(e => e.id === id);
export const byPosition = (a: FlowElement, b: FlowElement): number => a.position - b.position;

export const children = (s: Snapshot, parentId: string | null): FlowElement[] =>
  s.elements.filter(e => e.parentId === parentId).sort(byPosition);

/** Descendentes (profundidade) sem incluir o próprio nó. */
export function descendants(s: Snapshot, id: string): FlowElement[] {
  const byParent = new Map<string, FlowElement[]>();
  for (const e of s.elements) if (e.parentId) (byParent.get(e.parentId) ?? byParent.set(e.parentId, []).get(e.parentId)!).push(e);
  const out: FlowElement[] = [];
  const stack = [id];
  while (stack.length) for (const k of byParent.get(stack.pop()!) ?? []) { out.push(k); stack.push(k.id); }
  return out;
}

/** Funções ativas sob `parentId` (sem pasta/dado/arquivadas): base da sequência. */
export const fnSiblings = (s: Snapshot, parentId: string | null, exceptId: string): FlowElement[] =>
  children(s, parentId).filter(e => e.kind === "file" && !e.archived && e.id !== exceptId);

export const isLeafFn = (s: Snapshot, e: FlowElement): boolean =>
  e.kind === "file" && !s.elements.some(k => k.parentId === e.id && k.kind === "file" && !k.archived);

export const nextPosition = (s: Snapshot, parentId: string | null): number =>
  s.elements.reduce((m, e) => (e.parentId === parentId ? Math.max(m, e.position + 1) : m), 0);

/** Reescreve `position` 0..n-1 segundo a ordem dada. */
export function withOrder(elements: readonly FlowElement[], order: readonly string[]): FlowElement[] {
  const idx = new Map(order.map((id, i) => [id, i] as const));
  return elements.map(e => { const p = idx.get(e.id); return p === undefined || p === e.position ? e : { ...e, position: p }; });
}

/** Normaliza as posições dos filhos de `parentId` (0..n-1 preservando a ordem atual). */
export function compact(s: Snapshot, parentId: string | null): readonly FlowElement[] {
  return withOrder(s.elements, children(s, parentId).map(e => e.id));
}

export function findAgent(s: Snapshot, ref: string): Agent | undefined {
  return s.agents.find(a => a.id === ref);
}

/** Responsável existe? uuid do catálogo, ou virtual `file:<módulo>` / `md:<modelo>`. */
export function respExists(s: Snapshot, ref: string): boolean {
  if (ref.startsWith(FILE_AGENT)) return s.modules.some(m => m.id === ref.slice(FILE_AGENT.length));
  if (ref.startsWith(MODEL_AGENT)) return s.models.some(m => m.id === ref.slice(MODEL_AGENT.length));
  return s.agents.some(a => a.id === ref);
}

export const isConcrete = (a: Agent | undefined): boolean => !!a && (a.kind === "maquina" || a.kind === "arquivo" || a.kind === "script");

export const dataLeaf = (name: string): string => name.slice(name.lastIndexOf(".") + 1);
export const dataParent = (name: string): string | null => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(0, i) : null; };
export const dataChildren = (s: Snapshot, name: string): DataDef[] => s.data.filter(d => dataParent(d.name) === name);

export const usesOfAgent = (s: Snapshot, id: string): FlowElement[] =>
  s.elements.filter(e => !e.archived && (e.agentId === id || e.respId === id));

/** Garante que o dado exista (criação implícita ao usar em ins/outs). */
export function ensureData(data: readonly DataDef[], name: string, type: DataType = "texto"): readonly DataDef[] {
  if (data.some(d => d.name === name)) return data;
  return [...data, { name, type, value: null, position: data.reduce((m, d) => Math.max(m, d.position + 1), 0) }];
}

/** Funções de tratamento (alvos de onError): exclusivas do catch, fora da sequência principal. */
export function catchTargets(s: Snapshot): Set<string> {
  const byId = new Map(s.elements.map(e => [e.id, e] as const));
  const out = new Set<string>();
  for (const e of s.elements) if (!e.archived && e.onError) { const h = byId.get(e.onError); if (h && !h.archived) out.add(h.id); }
  return out;
}
/** Irmãs do fluxo principal (sem arquivadas nem funções de tratamento), em ordem. */
export function flowSiblings(s: Snapshot, parentId: string | null): FlowElement[] {
  const c = catchTargets(s);
  return children(s, parentId).filter(e => e.kind === "file" && !e.archived && !c.has(e.id));
}
