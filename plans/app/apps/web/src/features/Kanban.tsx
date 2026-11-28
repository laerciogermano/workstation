// Kanban: uma coluna por status, só com as atividades sem filhas (folhas), da maior para a menor prioridade.
import { leaves, sortByPriority, STATUS_LABEL, STATUSES, type Status } from '@plans/domain';
import { useState, type DragEvent } from 'react';
import { openCard, setStatus, type State } from '../store/app.ts';
import { AssigneeChip, StatusButton } from './Chips.tsx';
import { DueChip } from './DueDate.tsx';
import { FilterBar } from './FilterBar.tsx';
import { matches } from './filters.ts';
import { LabelChips } from './Labels.tsx';
import { PlayButton } from './PlayButton.tsx';
import { PriorityChip } from './Priority.tsx';

/** tipo próprio: texto ou arquivo arrastado de fora não vale como cartão */
const CARD = 'application/x-plans-activity';

export function Kanban({ app }: { app: State }) {
  // as folhas saem da árvore inteira: filtrar não transforma um pai em cartão
  const all = sortByPriority(leaves(app.tree)).filter((l) => matches(l.activity, app.filters));
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
    <div className="board-view">
      <FilterBar app={app} />
      <section className="board" aria-label="Kanban">
        {STATUSES.map((status) => {
          const cards = all.filter((l) => (l.activity.status ?? 'todo') === status);
          // a coluna continua ali (dá para soltar um cartão nela), mas avisa por que está vazia
          const off = app.filters.statuses.length > 0 && !app.filters.statuses.includes(status);
          return (
            <section
              key={status}
              className={`column status-${status}${over === status ? ' over' : ''}${off ? ' off' : ''}`}
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
              {off && <p className="off-note">Fora do filtro de status</p>}
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
                    onClick={() => openCard(a.id)}
                  >
                    {path.length > 0 && <small title={path.join(' › ')}>{path.join(' › ')}</small>}
                    <button type="button" className="open" aria-pressed={app.selected === a.id}>{a.title}</button>
                    <LabelChips ids={a.labels} catalog={app.snapshot.labels} />
                    <span className="meta">
                      <PriorityChip value={a.priority} />
                      <DueChip activity={a} />
                      <StatusButton activity={a} disabled={app.readOnly} />
                      <AssigneeChip id={a.assignee} assignees={app.snapshot.assignees} />
                      <PlayButton activity={a} app={app} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>
    </div>
  );
}
