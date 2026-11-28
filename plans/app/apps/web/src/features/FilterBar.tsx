// Barra de filtros acima da visão: um grupo por critério (o estado e a regra ficam em filters.ts).
import { STATUS_LABEL, STATUSES } from '@plans/domain';
import { clearFilters, setFilters, type State } from '../store/app.ts';
import { AssigneeIcon } from '../ui/AssigneeIcon.tsx';
import { assigneeOptions, isFiltering, toggled } from './filters.ts';

export function FilterBar({ app }: { app: State }) {
  return (
    <div className="filter-bar">
      <AssigneeFilter app={app} />
      <StatusFilter app={app} />
      {/* os grupos dos outros critérios entram aqui, antes do botão de limpar */}
      {isFiltering(app.filters) && (
        <button type="button" className="clear" onClick={clearFilters}>Limpar filtros</button>
      )}
    </div>
  );
}

/** Um botão por status; dá para escolher vários. Nenhum escolhido = todos. */
function StatusFilter({ app }: { app: State }) {
  const selected = app.filters.statuses;
  return (
    <div className="filter-group" role="group" aria-label="Filtrar por status">
      <span aria-hidden="true">Status</span>
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={`filter-option by-status status-${status}`}
          aria-pressed={selected.includes(status)}
          onClick={() => setFilters({ statuses: toggled(selected, status) })}
        >
          <i aria-hidden="true" />
          <span>{STATUS_LABEL[status]}</span>
        </button>
      ))}
    </div>
  );
}

/** Um botão por responsável; dá para escolher vários. Nenhum escolhido = todos. */
function AssigneeFilter({ app }: { app: State }) {
  const selected = app.filters.assignees;
  const options = assigneeOptions(app.snapshot.assignees, app.snapshot.activities, selected);
  return (
    <div className="filter-group" role="group" aria-label="Filtrar por responsável">
      <span aria-hidden="true">Responsável</span>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          className={`filter-option ${o.type}`}
          aria-pressed={selected.includes(o.key)}
          onClick={() => setFilters({ assignees: toggled(selected, o.key) })}
        >
          <AssigneeIcon type={o.type} size={14} />
          <span>{o.name}</span>
        </button>
      ))}
    </div>
  );
}
