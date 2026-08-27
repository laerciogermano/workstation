type Field = {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type Props = {
  fields: Field[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
};

export function FiltersBar({ fields, values, onChange }: Props) {
  return (
    <div className="filters-bar">
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          {f.type === 'select' ? (
            <select
              id={f.name}
              value={values[f.name] ?? ''}
              onChange={(e) => onChange(f.name, e.target.value)}
            >
              <option value="">Todos</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={f.name}
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              value={values[f.name] ?? ''}
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
