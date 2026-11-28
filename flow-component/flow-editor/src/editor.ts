// O editor sem tela: árvore atual, seleção e histórico.
import { find } from './model.ts';
import type { FnNode, FlowNode } from './model.ts';
import { apply, check, EditError, type Command } from './ops.ts';

const LIMIT = 200;

export interface EditorState {
  readonly tree: FnNode;
  /** Sempre aponta para um nó que existe. */
  readonly selected: string;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export type Result = { ok: true } | { ok: false; error: string };

export interface Editor {
  readonly state: EditorState;
  readonly node: FlowNode;
  run(command: Command): Result;
  /** `null` se o comando é possível; senão, o motivo. */
  why(command: Command): string | null;
  select(id: string): void;
  undo(): void;
  redo(): void;
  /** Troca o fluxo inteiro (entra no histórico). */
  load(tree: FnNode): void;
  subscribe(listener: (state: EditorState, change: 'tree' | 'selection') => void): () => void;
}

export function createEditor(initial: FnNode): Editor {
  type Snapshot = { tree: FnNode; selected: string };
  let current: Snapshot = { tree: structuredClone(initial), selected: initial.id };
  const past: Snapshot[] = [];
  const future: Snapshot[] = [];
  const listeners = new Set<(state: EditorState, change: 'tree' | 'selection') => void>();

  const state = (): EditorState => ({ ...current, canUndo: past.length > 0, canRedo: future.length > 0 });
  const emit = (change: 'tree' | 'selection') => listeners.forEach((l) => l(state(), change));
  const commit = (next: Snapshot) => {
    past.push(current);
    if (past.length > LIMIT) past.shift();
    future.length = 0;
    current = next;
    emit('tree');
  };

  return {
    get state() {
      return state();
    },
    get node() {
      return find(current.tree, current.selected)!.node;
    },
    run(command) {
      try {
        const next = apply(current.tree, command);
        // comando que não muda nada não vira passo do histórico
        if (JSON.stringify(next.tree) !== JSON.stringify(current.tree)) commit(next);
        return { ok: true };
      } catch (error) {
        if (error instanceof EditError) return { ok: false, error: error.message };
        throw error;
      }
    },
    why: (command) => check(current.tree, command),
    select(id) {
      if (id === current.selected || !find(current.tree, id)) return;
      current = { tree: current.tree, selected: id };
      emit('selection');
    },
    undo() {
      const previous = past.pop();
      if (!previous) return;
      future.push(current);
      current = previous;
      emit('tree');
    },
    redo() {
      const next = future.pop();
      if (!next) return;
      past.push(current);
      current = next;
      emit('tree');
    },
    load(tree) {
      commit({ tree: structuredClone(tree), selected: tree.id });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
