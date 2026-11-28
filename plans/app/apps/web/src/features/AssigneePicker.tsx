// F03: escolha do responsável no painel, um cartão com ícone para cada um.
import type { Assignee } from '@plans/domain';
import { useId } from 'react';
import { AssigneeIcon } from '../ui/AssigneeIcon.tsx';

const TYPE_LABEL = { person: 'pessoa', ai: 'IA', machine: 'máquina' } as const;

export function AssigneePicker({ value, assignees, disabled, onChange }: { value: string | null; assignees: Assignee[]; disabled: boolean; onChange: (id: string | null) => void }) {
  const name = useId();
  const unknown = value !== null && !assignees.some((a) => a.id === value);
  const options = [
    { id: null, name: 'Sem responsável', type: 'none' as const, detail: '' },
    ...(unknown ? [{ id: value, name: value, type: 'unknown' as const, detail: 'não está em assignees.json' }] : []),
    ...assignees.map((a) => ({ ...a, detail: TYPE_LABEL[a.type] })),
  ];

  return (
    <div className="field">
      <span id={`${name}-label`}>Responsável</span>
      <div className="assignees" role="radiogroup" aria-labelledby={`${name}-label`}>
        {options.map((o) => (
          <label key={o.id ?? ''} className={o.type}>
            <input type="radio" name={name} value={o.id ?? ''} checked={value === o.id} disabled={disabled} onChange={() => onChange(o.id)} />
            <AssigneeIcon type={o.type} size={22} />
            <b>{o.name}</b>
            {o.detail && <small>{o.detail}</small>}
          </label>
        ))}
      </div>
    </div>
  );
}
