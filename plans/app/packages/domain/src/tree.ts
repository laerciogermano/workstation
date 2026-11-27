import type { Activity } from './format.ts';

export type TreeNode = { activity: Activity; depth: number; children: TreeNode[]; warning?: string };

const order = (a: Activity, b: Activity) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

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
