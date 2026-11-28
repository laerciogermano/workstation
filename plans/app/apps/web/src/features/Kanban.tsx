// Kanban: uma coluna por status, só com as atividades sem filhas (folhas).
import { leaves, STATUS_LABEL, STATUSES, type Status } from '@plans/domain';
import { useState, type DragEvent } from 'react';
import { select, setStatus, type State } from '../store/app.ts';
import { AssigneeChip, StatusButton } from './Chips.tsx';

/** tipo próprio: texto ou arquivo arrastado de fora não vale como cartão */
const CARD = 'application/x-plans-activity';

export function Kanban({ app }: { app: State }) {
  const all = leaves(app.tree);
  /** coluna sob o cartão arrastado */
  const [over, setOver] = useState<Status | null>(null);

  const accepts = (e: DragEvent) => !app.readOnly && e.dataTransfer.types.includes(CARD);
  function drop(e: DragEvent, status: Status) {
    setOver(null);
    if (!accepts(e)) return;
    e.preventDefault();
    const id = e.dataTransfer.getData(CARD);
    const found = all.find((l) => l.activity.id === id);
    if (found && (found.activity.status ?? 'todo') !== status) void setStatus(id, status);
  }

  return (
    <section className="board" aria-label="Kanban">
      {STATUSES.map((status) => {
        const cards = all.filter((l) => (l.activity.status ?? 'todo') === status);
        return (
          <section
            key={status}
            className={`column status-${status}${over === status ? ' over' : ''}`}
            aria-label={STATUS_LABEL[status]}
            onDragOver={(e) => {
              if (!accepts(e)) return;
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(null)}
            onDrop={(e) => drop(e, status)}
          >
            <h3>{STATUS_LABEL[status]} <span className="count">{cards.length}</span></h3>
            <ul>
              {cards.map(({ activity: a, path }) => (
                <li
                  key={a.id}
                  className={`card${app.selected === a.id ? ' sel' : ''}`}
                  draggable={!app.readOnly}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(CARD, a.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setOver(null)}
                  onClick={() => select(a.id)}
                >
                  {path.length > 0 && <small title={path.join(' › ')}>{path.join(' › ')}</small>}
                  <button type="button" className="open" aria-pressed={app.selected === a.id}>{a.title}</button>
                  <span className="meta">
                    <StatusButton activity={a} disabled={app.readOnly} />
                    <AssigneeChip id={a.assignee} assignees={app.snapshot.assignees} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
