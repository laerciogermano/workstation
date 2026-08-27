import { useState } from 'react';
import { childrenOf, responsibleById, roots, units, type WorkUnit } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { UnitDrawer } from '../../components/ui/UnitDrawer';

function Node({
  unit,
  depth,
  onOpen,
}: {
  unit: WorkUnit;
  depth: number;
  onOpen: (id: string) => void;
}) {
  const resp = responsibleById(unit.responsibleId);
  const kids = childrenOf(unit.id);
  return (
    <div className="tree-node" style={{ marginLeft: depth * 16 }}>
      <button type="button" className="tree-item" onClick={() => onOpen(unit.id)}>
        <span>{unit.title}</span>
        <span className="row gap">
          {resp ? <Badge tone="info">{resp.type}: {resp.name}</Badge> : <Badge>sem responsável</Badge>}
          {unit.archived ? <Badge tone="warn">arquivada</Badge> : null}
        </span>
      </button>
      {resp?.type === 'maquina' ? (
        <div className="tree-proc muted small">procedimento editável (paridade parcial vs Gantt)</div>
      ) : null}
      {kids.map((k) => (
        <Node key={k.id} unit={k} depth={depth + 1} onOpen={onOpen} />
      ))}
    </div>
  );
}

export function TreePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const forest = roots().filter((r) => !r.archived);
  const selected = units.find((u) => u.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        title="Árvore de execução"
        subtitle="Floresta com múltiplas raízes, hierarquia infinita e responsáveis."
        actions={
          <button type="button" className="btn">
            Nova atividade raiz
          </button>
        }
      />

      <div className="panel">
        <div className="panel-body">
          {forest.length === 0 ? (
            <p className="muted">Árvore vazia — ainda utilizável para criar raízes.</p>
          ) : (
            forest.map((r) => <Node key={r.id} unit={r} depth={0} onOpen={setSelectedId} />)
          )}
        </div>
      </div>

      {selected ? <UnitDrawer unit={selected} view="tree" onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
