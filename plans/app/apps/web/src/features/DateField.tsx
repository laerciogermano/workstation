// Campo de data do cartão: o dia no formato AAAA-MM-DD; o navegador mostra no formato da pessoa.
import { useEffect, useState } from 'react';

/** Enquanto o ano é digitado, o campo entrega 0002, 0020, 0202: só grava com os quatro dígitos. */
const COMPLETE = /^[1-9]\d{3}-\d{2}-\d{2}$/;

/** Com `clearable`, `onChange(undefined)` tira a data; sem ele, `onChange` sempre recebe um dia. */
export function DateField({ label, value, disabled, clearable, onChange }: { label: string; value: string | undefined; disabled: boolean; clearable?: boolean; onChange: (day: string | undefined) => void }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return (
    <div className="field">
      <span aria-hidden="true">{label}</span>
      <div className="date-field">
        <input
          type="date"
          aria-label={label}
          value={draft}
          max="9999-12-31"
          disabled={disabled}
          onChange={(e) => {
            const day = e.target.value;
            setDraft(day);
            if (COMPLETE.test(day) && day !== value) onChange(day);
          }}
          onBlur={() => setDraft(value ?? '')}
        />
        {clearable && value && (
          <button type="button" className="btn ghost" aria-label={`Tirar ${label.toLowerCase()}`} disabled={disabled} onClick={() => onChange(undefined)}>
            Tirar
          </button>
        )}
      </div>
    </div>
  );
}
