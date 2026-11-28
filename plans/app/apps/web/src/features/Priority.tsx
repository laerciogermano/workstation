// Prioridade em escala: escolha no painel e selo no cartão do Kanban.
import { PRIORITIES, PRIORITY_LABEL, type Priority } from '@plans/domain';

export function PriorityScale({ value, disabled, onChange }: { value: Priority | undefined; disabled: boolean; onChange: (value: Priority | undefined) => void }) {
  return (
    <div className="field">
      <span id="priority-label">Prioridade · {value ? PRIORITY_LABEL[value] : 'sem prioridade'}</span>
      <div className="segmented priority-scale" role="radiogroup" aria-labelledby="priority-label">
        {[undefined, ...PRIORITIES].map((p) => {
          const name = p ? `${p} — ${PRIORITY_LABEL[p]}` : 'Sem prioridade';
          return (
            <button key={p ?? 0} type="button" role="radio" aria-checked={value === p} aria-label={name} title={name} className={`priority-${p ?? 0}`} disabled={disabled} onClick={() => value !== p && onChange(p)}>
              {p ?? '–'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Sem prioridade, o cartão não mostra nada. */
export function PriorityChip({ value }: { value: Priority | undefined }) {
  if (!value) return null;
  return (
    <span className={`priority priority-${value}`} title={`Prioridade ${value} de ${PRIORITIES.length}`}>
      {PRIORITY_LABEL[value]}
    </span>
  );
}
