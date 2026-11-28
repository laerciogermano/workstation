// Status e responsável, iguais nos cartões da árvore e do Kanban.
import { STATUS_LABEL, STATUSES, type Activity } from '@plans/domain';
import { setStatus, type State } from '../store/app.ts';
import { AssigneeIcon } from '../ui/AssigneeIcon.tsx';

export function StatusButton({ activity, disabled, tabIndex }: { activity: Activity; disabled: boolean; tabIndex?: number }) {
  const status = activity.status ?? 'todo';
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className={`state status-${status}`}
      disabled={disabled}
      aria-label={`Status de ${activity.title}: ${STATUS_LABEL[status]}`}
      title="Clique para mudar o status"
      onClick={(e) => {
        e.stopPropagation();
        // To do → Doing → Done → To do
        void setStatus(activity.id, STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length]!);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {STATUS_LABEL[status]}
    </button>
  );
}

export function AssigneeChip({ id, assignees }: { id: string | null; assignees: State['snapshot']['assignees'] }) {
  const who = id ? assignees.find((a) => a.id === id) : undefined;
  const type = id ? (who?.type ?? 'unknown') : 'none';
  const name = id ? (who?.name ?? `${id} (?)`) : 'sem responsável';
  return (
    <span className={`chip who ${type}`} title={name}>
      <AssigneeIcon type={type} size={13} />
      <span>{name}</span>
    </span>
  );
}
