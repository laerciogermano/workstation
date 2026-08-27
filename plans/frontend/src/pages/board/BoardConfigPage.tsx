import { useState } from 'react';
import { Link } from 'react-router-dom';
import { columns as seedColumns, lanes as seedLanes, units } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

export function BoardConfigPage() {
  const [cols, setCols] = useState(seedColumns.map((c) => ({ ...c })));
  const [laneList, setLaneList] = useState(seedLanes.map((l) => ({ ...l })));

  const cardsIn = (columnId: string) => units.filter((u) => !u.archived && u.columnId === columnId).length;

  return (
    <div>
      <PageHeader
        title="Configuração de colunas e raias"
        subtitle="Quantidade livre; remoção só com coluna/raia vazia."
        actions={
          <Link className="btn ghost" to="/">
            Voltar ao Board
          </Link>
        }
      />

      <div className="grid-2">
        <Panel
          title="Colunas"
          actions={
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                setCols((c) => [
                  ...c,
                  { id: `c${c.length + 1}`, name: 'Nova coluna', order: c.length + 1, execution: false },
                ])
              }
            >
              Adicionar
            </button>
          }
        >
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
          <p className="muted small">Remoção bloqueada enquanto houver cards.</p>
        </Panel>

        <Panel
          title="Raias"
          actions={
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                setLaneList((l) => [...l, { id: `l${l.length + 1}`, name: 'Nova raia', order: l.length + 1 }])
              }
            >
              Adicionar
            </button>
          }
        >
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

      <div className="row gap" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn">
          Salvar
        </button>
        <Link className="btn ghost" to="/">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
