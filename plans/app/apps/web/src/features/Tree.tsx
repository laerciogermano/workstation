// T-40 e T-41: árvore da esquerda para a direita, com criação no próprio nó.
import type { TreeNode } from '@plans/domain';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { askRemove, cancelCreate, createNode, select, startCreate, type State } from '../store/app.ts';

const W = 236, H = 56, GX = 52, GY = 18, P = 28;
type Pos = { x: number; y: number };
const NEW = 'novo';

function layout(roots: TreeNode[], creating: string | null) {
  const pos = new Map<string, Pos>();
  const order: { node: TreeNode; parent: string | null }[] = [];
  let y = P;
  const place = (n: TreeNode, parent: string | null) => {
    order.push({ node: n, parent });
    const ys = n.children.map((c) => (place(c, n.activity.id), pos.get(c.activity.id)!.y));
    if (creating === n.activity.id) {
      pos.set(NEW, { x: P + (n.depth + 1) * (W + GX), y });
      ys.push(y);
      y += H + GY;
    }
    if (!ys.length) {
      pos.set(n.activity.id, { x: P + n.depth * (W + GX), y });
      y += H + GY;
    } else pos.set(n.activity.id, { x: P + n.depth * (W + GX), y: (ys[0]! + ys.at(-1)!) / 2 });
  };
  roots.forEach((r) => (place(r, null), (y += 10)));
  if (creating === 'root') {
    pos.set(NEW, { x: P, y });
    y += H + GY;
  }
  const width = Math.max(0, ...[...pos.values()].map((p) => p.x + W)) + P;
  return { pos, order, width, height: y + P };
}

const edge = (a: Pos, b: Pos) => `M${a.x + W} ${a.y + H / 2} H${a.x + W + GX / 2} V${b.y + H / 2} H${b.x}`;

function NewNode({ at, parent }: { at: Pos; parent: string | null }) {
  const [title, setTitle] = useState('');
  const sending = useRef(false);
  return (
    <form
      className="tnew"
      style={{ left: at.x, top: at.y }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || sending.current) return;
        sending.current = true;
        await createNode(parent, title);
        sending.current = false;
      }}
    >
      <input
        autoFocus
        aria-label="Título da atividade"
        placeholder="Título da atividade"
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') cancelCreate();
        }}
      />
      <small>Enter cria · Esc cancela</small>
    </form>
  );
}

export function Tree({ app }: { app: State }) {
  const { pos, order, width, height } = layout(app.tree, app.creating);
  const names = new Map(app.snapshot.assignees.map((a) => [a.id, a]));
  const refs = useRef(new Map<string, HTMLDivElement>());
  const focusable = app.selected ?? order[0]?.node.activity.id;

  useEffect(() => {
    if (app.selected && !app.creating) {
      const el = refs.current.get(app.selected);
      // não rouba o foco de quem está digitando no painel
      if (el && (document.activeElement === document.body || document.activeElement?.closest('.tree'))) el.focus();
    }
  }, [app.selected, app.creating, app.tree]);

  function onKey(e: KeyboardEvent, index: number) {
    if (e.target !== e.currentTarget) return;
    const { node, parent } = order[index]!;
    const go = (id: string | null | undefined) => {
      if (!id) return;
      select(id);
      refs.current.get(id)?.focus();
    };
    const keys: Record<string, () => void> = {
      ArrowUp: () => go(order[index - 1]?.node.activity.id),
      ArrowDown: () => go(order[index + 1]?.node.activity.id),
      ArrowLeft: () => go(parent),
      ArrowRight: () => go(node.children[0]?.activity.id),
      Enter: () => !app.readOnly && startCreate(node.activity.id),
      ' ': () => select(node.activity.id),
      Delete: () => void askRemove(node.activity.id),
      Backspace: () => void askRemove(node.activity.id),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  }

  return (
    <section className="canvas" aria-label="Árvore de execução">
      <div className="bar">
        <button type="button" className="btn pri" onClick={() => startCreate(null)} disabled={app.readOnly}>+ Atividade</button>
        <span className="muted">Enter cria filho · Delete remove · setas navegam</span>
      </div>
      <div className="scroll">
        {!order.length && !app.creating && (
          <p className="empty">Nenhuma atividade ainda. Crie a primeira em <strong>+ Atividade</strong>.</p>
        )}
        <div className="tree" role="tree" style={{ width, height }}>
          <svg width={width} height={height} aria-hidden="true">
            {order.map(({ node, parent }) => parent && <path key={node.activity.id} d={edge(pos.get(parent)!, pos.get(node.activity.id)!)} />)}
            {app.creating && app.creating !== 'root' && pos.has(NEW) && <path className="new" d={edge(pos.get(app.creating)!, pos.get(NEW)!)} />}
          </svg>
          {order.map(({ node }, i) => {
            const a = node.activity;
            const p = pos.get(a.id)!;
            const who = a.assignee ? names.get(a.assignee) : undefined;
            return (
              <div
                key={a.id}
                ref={(el) => void (el ? refs.current.set(a.id, el) : refs.current.delete(a.id))}
                role="treeitem"
                aria-level={node.depth + 1}
                aria-selected={app.selected === a.id}
                aria-label={a.title}
                tabIndex={focusable === a.id ? 0 : -1}
                className={`tnode${app.selected === a.id ? ' sel' : ''}`}
                style={{ left: p.x, top: p.y }}
                onClick={() => select(a.id)}
                onKeyDown={(e) => onKey(e, i)}
                title={node.warning ?? a.title}
              >
                <b>{node.warning && <span className="warn" aria-label={node.warning}>⚠ </span>}{a.title}</b>
                <span className="meta">
                  {a.assignee ? <span className={`chip ${who?.type ?? 'unknown'}`}>{who?.name ?? `${a.assignee} (?)`}</span> : <span className="chip none">sem responsável</span>}
                  {node.children.length > 0 && <span className="count">{node.children.length}</span>}
                </span>
                {!app.readOnly && (
                  <span className="tools">
                    <button type="button" tabIndex={-1} aria-label={`Nova atividade filha de ${a.title}`} title="Nova atividade filha" onClick={(e) => (e.stopPropagation(), startCreate(a.id))}>+</button>
                    <button type="button" tabIndex={-1} aria-label={`Remover ${a.title}`} title="Remover" onClick={(e) => (e.stopPropagation(), void askRemove(a.id))}>✕</button>
                  </span>
                )}
              </div>
            );
          })}
          {app.creating && pos.has(NEW) && <NewNode key={app.creating} at={pos.get(NEW)!} parent={app.creating === 'root' ? null : app.creating} />}
        </div>
      </div>
    </section>
  );
}
