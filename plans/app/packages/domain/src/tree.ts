import type { Activity } from './format.ts';

export type TreeNode = { activity: Activity; depth: number; children: TreeNode[]; warning?: string };

/** Chave de ordenação entre irmãos: a posição escolhida ou, sem ela, o instante da criação. */
export const orderKey = (a: Activity) => a.order ?? (Date.parse(a.createdAt) || 0);
const order = (a: Activity, b: Activity) => orderKey(a) - orderKey(b) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * Monta a floresta. Pai inexistente ou ciclo: o nó aparece como raiz, com aviso.
 * Nada é alterado nos arquivos.
 */
export function buildTree(activities: Activity[]): TreeNode[] {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const warnings = new Map<string, string>();
  const parentOf = new Map<string, string | null>();

  for (const a of [...activities].sort(order)) {
    let parent = a.parent;
    if (parent && !byId.has(parent)) {
      warnings.set(a.id, 'O pai deste nó não existe na pasta.');
      parent = null;
    }
    parentOf.set(a.id, parent);
  }
  // quebra ciclos: sobe pelos pais e, se voltar a um nó visitado, esse vira raiz
  for (const a of [...activities].sort(order)) {
    const seen = new Set<string>();
    let id: string | null = a.id;
    while (id) {
      if (seen.has(id)) {
        parentOf.set(id, null);
        warnings.set(id, 'Ciclo entre pais: mostrado como raiz.');
        break;
      }
      seen.add(id);
      id = parentOf.get(id) ?? null;
    }
  }

  const children = new Map<string | null, Activity[]>();
  for (const a of activities) {
    const p = parentOf.get(a.id) ?? null;
    children.set(p, [...(children.get(p) ?? []), a]);
  }
  const make = (a: Activity, depth: number): TreeNode => ({
    activity: a,
    depth,
    warning: warnings.get(a.id),
    children: (children.get(a.id) ?? []).sort(order).map((c) => make(c, depth + 1)),
  });
  return (children.get(null) ?? []).sort(order).map((a) => make(a, 0));
}

export type Leaf = { activity: Activity; path: string[] };

/** Só as atividades sem filhas, na ordem da árvore; `path` são os títulos dos pais, do topo para baixo. */
export function leaves(nodes: TreeNode[], path: string[] = []): Leaf[] {
  return nodes.flatMap((n) => (n.children.length ? leaves(n.children, [...path, n.activity.title]) : [{ activity: n.activity, path }]));
}

/** Da maior para a menor prioridade, sem prioridade no fim; no empate, mantém a ordem recebida. */
export const sortByPriority = (list: Leaf[]): Leaf[] => [...list].sort((a, b) => (b.activity.priority ?? 0) - (a.activity.priority ?? 0));

/** O nó e toda a subárvore, das folhas para o nó — ordem segura para apagar. */
export function subtreeLeavesFirst(activities: Activity[], id: string): Activity[] {
  const find = (nodes: TreeNode[]): TreeNode | undefined => {
    for (const n of nodes) {
      if (n.activity.id === id) return n;
      const inner = find(n.children);
      if (inner) return inner;
    }
    return undefined;
  };
  const root = find(buildTree(activities));
  if (!root) return [];
  const out: Activity[] = [];
  const walk = (n: TreeNode) => {
    n.children.forEach(walk);
    out.push(n.activity);
  };
  walk(root);
  return out;
}

export type MovePatch = { id: string; parent?: string | null; order?: number };
const GAP = 1000;

const findNode = (nodes: TreeNode[], id: string, parent: string | null = null): { node: TreeNode; parent: string | null } | undefined => {
  for (const node of nodes) {
    if (node.activity.id === id) return { node, parent };
    const inner = findNode(node.children, id, node.activity.id);
    if (inner) return inner;
  }
  return undefined;
};

/**
 * O que gravar para mover `id` para dentro de `parent` (null = raiz), antes de `before` (null = no fim).
 * Em geral só o arquivo movido muda; sem espaço entre os vizinhos, os irmãos são renumerados.
 * Lista vazia quando já está nesse lugar.
 */
export function planMove(activities: Activity[], id: string, parent: string | null, before: string | null): MovePatch[] {
  const tree = buildTree(activities);
  const moving = findNode(tree, id);
  if (!moving) throw new Error('Atividade não encontrada.');
  if (parent === id || (parent && findNode(moving.node.children, parent))) throw new Error('Não dá para mover uma atividade para dentro dela mesma.');
  const target = parent ? findNode(tree, parent)?.node.children : tree;
  if (!target) throw new Error('Destino não encontrado.');

  const all = target.map((n) => n.activity);
  const siblings = all.filter((a) => a.id !== id);
  const at = before ? siblings.findIndex((a) => a.id === before) : siblings.length;
  if (at < 0) throw new Error('Destino não encontrado.');
  if (moving.parent === parent && all.findIndex((a) => a.id === id) === at) return [];

  const prev = siblings[at - 1];
  const next = siblings[at];
  if (!prev && !next) return [{ id, parent }];
  if (!prev) return [{ id, parent, order: orderKey(next!) - GAP }];
  if (!next) return [{ id, parent, order: orderKey(prev) + GAP }];
  const middle = (orderKey(prev) + orderKey(next)) / 2;
  if (middle > orderKey(prev) && middle < orderKey(next)) return [{ id, parent, order: middle }];
  const list = [...siblings.slice(0, at), moving.node.activity, ...siblings.slice(at)];
  return list.map((a, i) => (a.id === id ? { id, parent, order: (i + 1) * GAP } : { id: a.id, order: (i + 1) * GAP }));
}
