import { useState } from 'react';
import { Link } from 'react-router-dom';
import { childrenOf, responsibleById, roots, type WorkUnit } from '../../data/mockData';

function sortedChildren(parentId?: string) {
  const list = parentId ? childrenOf(parentId) : roots();
  return list.slice().sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

function FileNode({
  unit,
  depth,
  expanded,
  onToggle,
}: {
  unit: WorkUnit;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const resp = responsibleById(unit.responsibleId);
  const kids = sortedChildren(unit.id);
  const isOpen = expanded.has(unit.id);
  const hasKids = kids.length > 0;

  return (
    <div className="ide-tree-node" style={{ paddingLeft: Math.min(depth, 12) * 8 }}>
      <div className="ide-tree-row">
        {hasKids ? (
          <button
            type="button"
            className="ide-tree-toggle"
            aria-label={isOpen ? 'Recolher' : 'Expandir'}
            onClick={() => onToggle(unit.id)}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="ide-tree-toggle spacer" aria-hidden />
        )}
        <span className="ide-tree-label" title={unit.title}>
          {unit.title || '(sem título)'}
          {unit.archived ? <span className="ide-tree-meta"> · arq.</span> : null}
          {resp ? <span className="ide-tree-meta"> · {resp.type}</span> : null}
        </span>
      </div>
      {isOpen
        ? kids.map((k) => (
            <FileNode key={k.id} unit={k} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))
        : null}
    </div>
  );
}

/** Lista em árvore embutida no painel Explorar (estilo explorador de IDE) — não é tela. */
export function ExploreTreePanel() {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(Array.from({ length: 21 }, (_, i) => `deep-${i + 1}`)),
  );
  const forest = sortedChildren();

  return (
    <div className="ide-explorer">
      <div className="ide-explorer-tree">
        {forest.length === 0 ? (
          <p className="ide-explorer-empty">Sem arquivos</p>
        ) : (
          forest.map((r) => (
            <FileNode
              key={r.id}
              unit={r}
              depth={0}
              expanded={expanded}
              onToggle={(id) => {
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
            />
          ))
        )}
      </div>
      <div className="ide-explorer-footer">
        <Link to="/configuracoes/catalogo" className="ide-explorer-settings">
          Configurações
        </Link>
      </div>
    </div>
  );
}
