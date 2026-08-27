import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { columns, lanes, responsibleById, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { UnitDrawer } from '../../components/ui/UnitDrawer';

export function BoardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const active = useMemo(() => units.filter((u) => !u.archived), []);
  const selected = units.find((u) => u.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        title="Board"
        subtitle="Mesma unidade como card — colunas × raias, hierarquia e execução de IA."
        actions={
          <Link className="btn ghost" to="/board/config">
            Configurar colunas e raias
          </Link>
        }
      />

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel-body row gap wrap">
          <input
            placeholder="Título do card *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <input
            placeholder="Contexto opcional"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            style={{ minWidth: 260, flex: 1 }}
          />
          <button type="button" className="btn" disabled={!title.trim()}>
            Criar no board
          </button>
        </div>
      </div>

      <div className="kanban">
        {columns
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((col) => (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-head">
                <strong>{col.name}</strong>
                {col.execution ? <Badge tone="exec">execução</Badge> : null}
              </div>
              {lanes
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((lane) => {
                  const cards = active.filter((u) => u.columnId === col.id && u.laneId === lane.id);
                  return (
                    <div key={lane.id} className="kanban-lane">
                      <div className="kanban-lane-title">{lane.name}</div>
                      {cards.map((card) => {
                        const resp = responsibleById(card.responsibleId);
                        const kids = active.filter((u) => u.parentId === card.id).length;
                        return (
                          <button
                            type="button"
                            key={card.id}
                            className="kanban-card"
                            onClick={() => setSelectedId(card.id)}
                          >
                            <div className="kanban-card-title">{card.title}</div>
                            <div className="row gap wrap">
                              {card.parentId ? <Badge>filho</Badge> : null}
                              {kids > 0 ? <Badge tone="info">{kids} filhos</Badge> : null}
                              {resp ? <Badge tone="info">{resp.type}</Badge> : null}
                              {card.aiStatus ? (
                                <Badge tone={card.aiStatus === 'falhou' ? 'danger' : 'exec'}>
                                  {card.aiStatus}
                                </Badge>
                              ) : null}
                            </div>
                            {card.aiStatus === 'falhou' ? (
                              <span className="linkish" onClick={(e) => e.stopPropagation()}>
                                Retry IA
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          ))}
      </div>

      {selected ? <UnitDrawer unit={selected} view="board" onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
