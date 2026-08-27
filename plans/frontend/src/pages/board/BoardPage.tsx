import { useMemo, useState } from 'react';
import { columns as seedColumns, lanes as seedLanes, responsibleById, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Panel } from '../../components/ui/Panel';
import { UnitDrawer } from '../../components/ui/UnitDrawer';

export function BoardPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [cols, setCols] = useState(seedColumns.map((c) => ({ ...c })));
  const [laneList, setLaneList] = useState(seedLanes.map((l) => ({ ...l })));
  const active = useMemo(() => units.filter((u) => !u.archived), []);
  const selected = units.find((u) => u.id === selectedId) ?? null;
  const cardsIn = (columnId: string) => units.filter((u) => !u.archived && u.columnId === columnId).length;

  return (
    <div>
      <PageHeader
        title="Board"
        subtitle="Mesma unidade como card — colunas × raias, hierarquia, execução de IA e configuração do board."
        actions={
          <button type="button" className="btn ghost" onClick={() => setShowConfig((v) => !v)}>
            {showConfig ? 'Fechar configuração' : 'Configurar colunas e raias'}
          </button>
        }
      />

      {showConfig ? (
        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <Panel title="Colunas">
            <ul className="config-list">
              {cols
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((col) => {
                  const count = cardsIn(col.id);
                  return (
                    <li key={col.id}>
                      <input
                        value={col.name}
                        onChange={(e) =>
                          setCols((all) => all.map((c) => (c.id === col.id ? { ...c, name: e.target.value } : c)))
                        }
                      />
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={col.execution}
                          onChange={(e) =>
                            setCols((all) =>
                              all.map((c) => (c.id === col.id ? { ...c, execution: e.target.checked } : c)),
                            )
                          }
                        />
                        execução
                      </label>
                      {count > 0 ? <Badge tone="warn">{count} cards</Badge> : <Badge tone="ok">vazia</Badge>}
                      <button type="button" className="btn ghost" disabled={count > 0}>
                        Remover
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Panel>
          <Panel title="Raias">
            <ul className="config-list">
              {laneList
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((lane) => (
                  <li key={lane.id}>
                    <input
                      value={lane.name}
                      onChange={(e) =>
                        setLaneList((all) =>
                          all.map((l) => (l.id === lane.id ? { ...l, name: e.target.value } : l)),
                        )
                      }
                    />
                    <button type="button" className="btn ghost">
                      Remover
                    </button>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      ) : null}

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
        {cols
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((col) => (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-head">
                <strong>{col.name}</strong>
                {col.execution ? <Badge tone="exec">execução</Badge> : null}
              </div>
              {laneList
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
