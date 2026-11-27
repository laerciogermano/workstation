// T-40 e T-41: árvore da esquerda para a direita, com criação no próprio nó, zoom e deslocamento.
import { STATUS_LABEL, STATUSES, type TreeNode } from '@plans/domain';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { askRemove, cancelCreate, createNode, expandAll, minimizeAll, moveNode, renameNode, select, setStatus, startCreate, toggleCollapse, type State } from '../store/app.ts';
import { dropTarget, edgeSpeed } from './dnd.ts';
import { edge, GY, layout, NEW, W, type Box } from './layout.ts';
import { cardHeight, useFontMetrics } from './measure.ts';
import { fit, reveal, STEP, zoomAt, type View } from './viewport.ts';
import { Icon } from '../ui/Icon.tsx';

const descendants = (n: TreeNode): string[] => n.children.flatMap((c) => [c.activity.id, ...descendants(c)]);
const heightOf = (n: TreeNode) => cardHeight(n.warning ? `⚠ ${n.activity.title}` : n.activity.title);

function NewNode({ at, parent }: { at: Box; parent: string | null }) {
  const [title, setTitle] = useState('');
  const sending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  // sem rolar o contêiner: quem desloca a tela é a árvore
  useEffect(() => input.current?.focus({ preventScroll: true }), []);
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
        ref={input}
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

/** Edição do título no próprio cartão. Enter ou sair do campo salva; Esc cancela. */
function Rename({ id, title, onDone }: { id: string; title: string; onDone: (refocus: boolean) => void }) {
  const [value, setValue] = useState(title);
  const input = useRef<HTMLTextAreaElement>(null);
  const from = useRef(title);
  const done = useRef(false);
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    input.current?.select();
  }, []);
  async function finish(save: boolean, refocus: boolean) {
    if (done.current) return;
    done.current = true;
    if (save) await renameNode(id, from.current, value);
    onDone(refocus);
  }
  return (
    <textarea
      ref={input}
      rows={1}
      className="rename"
      aria-label="Renomear atividade"
      maxLength={200}
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/[\r\n]+/g, ' '))}
      onBlur={() => void finish(true, false)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // as teclas daqui não podem chegar à árvore (Delete removeria o nó)
        e.stopPropagation();
        if (e.key === 'Enter') e.preventDefault();
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) void finish(true, true);
        if (e.key === 'Escape') void finish(false, true);
      }}
    />
  );
}

export function Tree({ app }: { app: State }) {
  const collapsed = new Set(app.collapsed);
  useFontMetrics();
  const { pos, order, width, height } = layout(app.tree, app.creating, collapsed, heightOf);
  const names = new Map(app.snapshot.assignees.map((a) => [a.id, a]));
  const refs = useRef(new Map<string, HTMLDivElement>());
  const [renaming, setRenaming] = useState<string | null>(null);
  const focusable = app.selected ?? order[0]?.node.activity.id;

  const screen = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  /** arrasto no fundo; enquanto não passar de poucos pixels ainda é um clique */
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  /** seleção feita com o ponteiro: o nó já está à vista, a tela não deve pular */
  const clicked = useRef<string | null>(null);

  const size = () => ({ width: screen.current?.clientWidth ?? 0, height: screen.current?.clientHeight ?? 0 });
  const show = (id: string) => {
    const p = pos.get(id);
    if (p) setView((v) => reveal(v, { x: p.x, y: p.y, width: W, height: p.h }, size()));
  };
  const zoomCenter = (factor: number) => setView((v) => zoomAt(v, factor, size().width / 2, size().height / 2));
  // reserva a faixa de baixo para os botões não cobrirem a árvore
  const fitAll = () => setView(fit({ width, height }, { ...size(), height: size().height - 60 }));

  // rolar aproxima no cursor (precisa de um ouvinte não passivo para segurar a rolagem da página)
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      // a pinça no trackpad chega como roda com Ctrl e passos pequenos
      const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015));
      setView((v) => zoomAt(v, factor, e.clientX - box.left, e.clientY - box.top));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!app.selected) shown.current = clicked.current = null;
    if (!app.selected || app.creating || renaming) return;
    const el = refs.current.get(app.selected);
    if (!el) return;
    if (shown.current !== app.selected) {
      shown.current = app.selected;
      if (clicked.current !== app.selected) show(app.selected);
    }
    // não rouba o foco de quem está digitando no painel
    if (document.activeElement === document.body || document.activeElement?.closest('.tree')) el.focus({ preventScroll: true });
  }, [app.selected, app.creating, app.tree]);

  useEffect(() => {
    if (app.creating) show(NEW);
  }, [app.creating]);

  /** cartão pressionado: vira arrasto depois de alguns pixels */
  const pressed = useRef<{ id: string; pointer: number; x: number; y: number } | null>(null);
  /** arrasto em andamento; x e y relativos à tela da árvore */
  const [carry, setCarry] = useState<{ id: string; x: number; y: number } | null>(null);
  const found = carry && order.find((o) => o.node.activity.id === carry.id)?.node;
  const moving = new Set(found ? [carry.id, ...descendants(found)] : []);
  const drop = found ? dropTarget(pos, order, { x: (carry.x - view.x) / view.k, y: (carry.y - view.y) / view.k }, moving) : null;

  const local = (e: PointerEvent) => {
    const box = screen.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  function stopCarry() {
    pressed.current = null;
    setCarry(null);
  }
  function finishCarry() {
    if (carry && drop) {
      shown.current = clicked.current = null; // o cartão muda de lugar: pode ser preciso mostrar
      void moveNode(carry.id, drop.parent, drop.before);
    }
    stopCarry();
  }

  // perto da borda, a tela anda junto
  const pointer = useRef({ x: 0, y: 0 });
  if (carry) pointer.current = carry;
  const carrying = !!carry;
  useEffect(() => {
    if (!carrying) return;
    let frame = requestAnimationFrame(function step() {
      const { width: w, height: h } = size();
      const dx = edgeSpeed(pointer.current.x, w), dy = edgeSpeed(pointer.current.y, h);
      if (dx || dy) setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      frame = requestAnimationFrame(step);
    });
    const onEscape = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && stopCarry();
    window.addEventListener('keydown', onEscape);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onEscape);
    };
  }, [carrying]);

  function startPan(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as Element).closest('.tnode, .tnew, .first, .zoom')) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  }
  function movePan(e: PointerEvent<HTMLDivElement>) {
    const p = pressed.current;
    if (p && p.pointer === e.pointerId) {
      if (!(e.buttons & 1)) return stopCarry();
      if (!carry) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 5) return;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return setCarry({ id: p.id, ...local(e) });
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    drag.current = { id: d.id, x: e.clientX, y: e.clientY, moved: true };
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }
  function endPan(e: PointerEvent) {
    if (pressed.current?.pointer === e.pointerId) {
      if (e.type === 'pointerup') return finishCarry();
      return stopCarry();
    }
    // clique no fundo, sem arrastar: tira a seleção
    if (e.type === 'pointerup' && drag.current?.id === e.pointerId && !drag.current.moved && app.selected) select(null);
    drag.current = null;
    setPanning(false);
  }

  function onZoomKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || (e.target as Element).closest('input')) return;
    const action = { '+': () => zoomCenter(STEP), '=': () => zoomCenter(STEP), '-': () => zoomCenter(1 / STEP), '0': fitAll }[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  }

  /** Minimiza ou expande mantendo o nó clicado parado na tela. */
  function toggle(node: TreeNode) {
    const id = node.activity.id;
    const next = new Set(collapsed);
    if (!next.delete(id)) next.add(id);
    const from = pos.get(id)!;
    const to = layout(app.tree, null, next, heightOf).pos.get(id)!;
    setView((v) => ({ ...v, y: v.y + (from.y - to.y) * v.k }));
    clicked.current = id;
    toggleCollapse(id, descendants(node));
  }

  const withChildren = (nodes: TreeNode[]): string[] => nodes.flatMap((n) => (n.children.length ? [n.activity.id, ...withChildren(n.children)] : []));
  const parents = withChildren(app.tree);

  /** Só as raízes ficam à vista, então a tela se ajusta a elas. */
  function closeAll() {
    const next = layout(app.tree, null, new Set(parents), heightOf);
    setView(fit(next, { ...size(), height: size().height - 60 }));
    clicked.current = app.tree.find((r) => r.activity.id === app.selected || descendants(r).includes(app.selected ?? ''))?.activity.id ?? null;
    minimizeAll();
  }

  /** O nó selecionado (ou o primeiro à vista) continua no mesmo lugar. */
  function openAll() {
    const id = app.selected && pos.has(app.selected) ? app.selected : order[0]?.node.activity.id;
    if (id) {
      const from = pos.get(id)!;
      const to = layout(app.tree, null, new Set(), heightOf).pos.get(id)!;
      setView((v) => ({ ...v, x: v.x + (from.x - to.x) * v.k, y: v.y + (from.y - to.y) * v.k }));
      clicked.current = app.selected;
    }
    expandAll();
  }

  function onKey(e: KeyboardEvent, index: number) {
    if (e.target !== e.currentTarget) return;
    const { node, parent } = order[index]!;
    const go = (id: string | null | undefined) => {
      if (!id) return;
      clicked.current = null;
      select(id);
      refs.current.get(id)?.focus({ preventScroll: true });
      show(id);
    };
    const keys: Record<string, () => void> = {
      ArrowUp: () => go(order[index - 1]?.node.activity.id),
      ArrowDown: () => go(order[index + 1]?.node.activity.id),
      // como em árvores de arquivos: esquerda minimiza (ou sobe), direita expande (ou desce)
      ArrowLeft: () => (node.children.length && !collapsed.has(node.activity.id) ? toggle(node) : go(parent)),
      ArrowRight: () => (collapsed.has(node.activity.id) ? toggle(node) : go(node.children[0]?.activity.id)),
      Enter: () => !app.readOnly && startCreate(node.activity.id),
      F2: () => !app.readOnly && setRenaming(node.activity.id),
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
      <div
        ref={screen}
        className={`viewport${panning ? ' panning' : ''}${carry ? ' carrying' : ''}${carry && !drop ? ' no-drop' : ''}`}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onKeyDown={onZoomKey}
        onScroll={(e) => (e.currentTarget.scrollTo(0, 0))}
      >
        {!order.length && !app.creating && !app.readOnly && (
          <button type="button" className="first" aria-label="Nova atividade" title="Nova atividade" onClick={() => startCreate(null)}>
            <Icon name="plus" size={34} />
          </button>
        )}
        <div className="tree" role="tree" style={{ width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
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
                aria-expanded={node.children.length ? !collapsed.has(a.id) : undefined}
                aria-label={a.title}
                tabIndex={focusable === a.id ? 0 : -1}
                className={`tnode${app.selected === a.id ? ' sel' : ''}${renaming === a.id ? ' editing' : ''}${moving.has(a.id) ? ' moving' : ''}${drop?.kind === 'child' && drop.over === a.id ? ' drop-child' : ''}`}
                onPointerDown={(e) => {
                  // botões e o campo de renomear não iniciam arrasto
                  if (e.button === 0 && !app.readOnly && !(e.target as Element).closest('button, textarea')) pressed.current = { id: a.id, pointer: e.pointerId, x: e.clientX, y: e.clientY };
                }}
                style={renaming === a.id ? { left: p.x, top: p.y, minHeight: p.h } : { left: p.x, top: p.y, height: p.h }}
                onClick={() => ((clicked.current = a.id), select(a.id))}
                onKeyDown={(e) => onKey(e, i)}
                title={node.warning ?? a.title}
              >
                {renaming === a.id ? (
                  <Rename
                    id={a.id}
                    title={a.title}
                    onDone={(refocus) => {
                      setRenaming(null);
                      if (refocus) refs.current.get(a.id)?.focus({ preventScroll: true });
                    }}
                  />
                ) : (
                  <b onDoubleClick={() => !app.readOnly && setRenaming(a.id)}>
                    {node.warning && <span className="warn" aria-label={node.warning}>⚠ </span>}{a.title}
                  </b>
                )}
                <span className="meta">
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`state status-${a.status ?? 'todo'}`}
                    disabled={app.readOnly}
                    aria-label={`Status de ${a.title}: ${STATUS_LABEL[a.status ?? 'todo']}`}
                    title="Clique para mudar o status"
                    onClick={(e) => {
                      e.stopPropagation();
                      // To do → Doing → Done → To do
                      void setStatus(a.id, STATUSES[(STATUSES.indexOf(a.status ?? 'todo') + 1) % STATUSES.length]!);
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {STATUS_LABEL[a.status ?? 'todo']}
                  </button>
                  {a.assignee ? <span className={`chip ${who?.type ?? 'unknown'}`}>{who?.name ?? `${a.assignee} (?)`}</span> : <span className="chip none">sem responsável</span>}
                  {node.children.length > 0 && !collapsed.has(a.id) && <span className="count">{node.children.length}</span>}
                </span>
                {node.children.length > 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`toggle${collapsed.has(a.id) ? ' closed' : ''}`}
                    aria-label={collapsed.has(a.id) ? `Expandir ${a.title} (${descendants(node).length} ocultas)` : `Minimizar ${a.title}`}
                    title={collapsed.has(a.id) ? 'Expandir' : 'Minimizar'}
                    onClick={(e) => (e.stopPropagation(), toggle(node))}
                  >
                    {collapsed.has(a.id) ? `+${descendants(node).length}` : <Icon name="minus" size={13} />}
                  </button>
                )}
                {!app.readOnly && renaming !== a.id && (
                  <span className="tools">
                    <button type="button" tabIndex={-1} aria-label={`Nova atividade filha de ${a.title}`} title="Nova atividade filha" onClick={(e) => (e.stopPropagation(), startCreate(a.id))}><Icon name="plus" size={14} /></button>
                    <button type="button" tabIndex={-1} aria-label={`Remover ${a.title}`} title="Remover" onClick={(e) => (e.stopPropagation(), void askRemove(a.id))}><Icon name="x" size={14} /></button>
                  </span>
                )}
              </div>
            );
          })}
          {drop && drop.kind !== 'child' && (
            <i
              className="drop-line"
              aria-hidden="true"
              style={{ left: pos.get(drop.over)!.x, top: pos.get(drop.over)!.y + (drop.kind === 'before' ? -GY / 2 : pos.get(drop.over)!.h + GY / 2), width: W }}
            />
          )}
          {app.creating && pos.has(NEW) && <NewNode key={app.creating} at={pos.get(NEW)!} parent={app.creating === 'root' ? null : app.creating} />}
        </div>
        {found && carry && (
          <div className="drag-ghost" aria-hidden="true" style={{ left: carry.x + 12, top: carry.y + 12 }}>
            {found.activity.title}
            {found.children.length > 0 && <small>+{descendants(found).length}</small>}
          </div>
        )}
        {order.length > 0 && (
          <div className="zoom" role="group" aria-label="Controles da árvore">
            <button type="button" aria-label="Diminuir zoom" title="Diminuir zoom (-)" onClick={() => zoomCenter(1 / STEP)}><Icon name="minus" /></button>
            <button type="button" className="level" aria-label={`Zoom ${Math.round(view.k * 100)}%, voltar a 100%`} title="Voltar a 100%" onClick={() => zoomCenter(1 / view.k)}>
              {Math.round(view.k * 100)}%
            </button>
            <button type="button" aria-label="Aumentar zoom" title="Aumentar zoom (+)" onClick={() => zoomCenter(STEP)}><Icon name="plus" /></button>
            <button type="button" aria-label="Ajustar à tela" title="Ajustar à tela (0)" onClick={fitAll}><Icon name="fit" /></button>
            <i aria-hidden="true" />
            <button type="button" aria-label="Minimizar tudo" title="Minimizar tudo" onClick={closeAll} disabled={!parents.length || parents.every((id) => collapsed.has(id))}><Icon name="collapseAll" /></button>
            <button type="button" aria-label="Expandir tudo" title="Expandir tudo" onClick={openAll} disabled={!parents.some((id) => collapsed.has(id))}><Icon name="expandAll" /></button>
          </div>
        )}
      </div>
    </section>
  );
}
