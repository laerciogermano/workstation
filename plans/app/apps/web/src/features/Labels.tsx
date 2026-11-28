// Etiquetas: selos no cartão do Kanban, marcação no cartão aberto e o catálogo nas configurações.
import { LABEL_COLOR_NAME, LABEL_COLORS, LABEL_NAME_MAX, labelsOf, type Label, type LabelColor } from '@plans/domain';
import { useId, useState, type FormEvent } from 'react';
import { addLabel, openSettings, removeLabel, updateLabel, type State } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';

/** Sem etiqueta, o cartão não mostra nada. */
export function LabelChips({ ids, catalog }: { ids: string[] | undefined; catalog: Label[] }) {
  const own = labelsOf(ids, catalog);
  if (!own.length) return null;
  return (
    <span className="labels" aria-label="Etiquetas">
      {own.map((l) => <span key={l.id} className={`label label-${l.color}`} title={l.name}>{l.name}</span>)}
    </span>
  );
}

export function LabelPicker({ value, catalog, disabled, onToggle }: { value: string[] | undefined; catalog: Label[]; disabled: boolean; onToggle: (id: string) => void }) {
  const id = useId();
  return (
    <div className="field">
      <span id={id}>Etiquetas</span>
      {catalog.length > 0 ? (
        <div className="label-picker" role="group" aria-labelledby={id}>
          {catalog.map((l) => (
            <button key={l.id} type="button" className={`label label-${l.color}`} aria-pressed={!!value?.includes(l.id)} title={l.name} disabled={disabled} onClick={() => onToggle(l.id)}>
              {l.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted small">Nenhuma etiqueta criada.</p>
      )}
      <button type="button" className="btn ghost label-manage" onClick={openSettings}>Gerenciar etiquetas</button>
    </div>
  );
}

function Swatches({ label, value, disabled, onChange }: { label: string; value: LabelColor; disabled: boolean; onChange: (color: LabelColor) => void }) {
  const name = useId();
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {LABEL_COLORS.map((c) => (
        <input key={c} type="radio" name={name} className={`label-${c}`} aria-label={LABEL_COLOR_NAME[c]} title={LABEL_COLOR_NAME[c]} checked={value === c} disabled={disabled} onChange={() => onChange(c)} />
      ))}
    </div>
  );
}

/** Salva o nome ao sair do campo ou com Enter; recusado (repetido, vazio), volta o anterior. */
function LabelRow({ label, readOnly, onRemove }: { label: Label; readOnly: boolean; onRemove: () => void }) {
  async function rename(input: HTMLInputElement) {
    const name = input.value.trim();
    if (name === label.name || !name || !(await updateLabel(label.id, { name }))) input.value = label.name;
  }
  return (
    <li>
      <input
        key={label.name}
        className={`label-name label-${label.color}`}
        aria-label={`Nome da etiqueta ${label.name}`}
        defaultValue={label.name}
        maxLength={LABEL_NAME_MAX}
        readOnly={readOnly}
        onBlur={(e) => void rename(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur();
          if (e.key === 'Escape') e.currentTarget.value = label.name;
        }}
      />
      <button type="button" className="btn ghost danger" aria-label={`Remover etiqueta ${label.name}`} disabled={readOnly} onClick={onRemove}>Remover</button>
      <Swatches label={`Cor da etiqueta ${label.name}`} value={label.color} disabled={readOnly} onChange={(color) => void updateLabel(label.id, { color })} />
    </li>
  );
}

export function LabelSettings({ app }: { app: State }) {
  const { labels, activities } = app.snapshot;
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabelColor>('blue');
  const [removing, setRemoving] = useState<string | null>(null);
  const target = labels.find((l) => l.id === removing);
  const used = activities.filter((a) => a.labels?.includes(removing ?? '')).length;

  async function add(e: FormEvent) {
    e.preventDefault();
    if (name.trim() && (await addLabel(name, color))) setName('');
  }

  return (
    <section className="label-settings" aria-label="Etiquetas do projeto">
      <h3>Etiquetas</h3>
      {labels.length > 0 && (
        <ul>{labels.map((l) => <LabelRow key={l.id} label={l} readOnly={app.readOnly} onRemove={() => setRemoving(l.id)} />)}</ul>
      )}
      <form onSubmit={(e) => void add(e)}>
        <input aria-label="Nome da nova etiqueta" placeholder="Nova etiqueta" value={name} maxLength={LABEL_NAME_MAX} disabled={app.readOnly} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn" disabled={app.readOnly || !name.trim()}>Adicionar</button>
        <Swatches label="Cor da nova etiqueta" value={color} disabled={app.readOnly} onChange={setColor} />
      </form>
      <p className="muted small">Marque nos cartões abertos; aparecem no Kanban. · labels.json</p>
      {target && (
        <Dialog
          title="Remover etiqueta?"
          onClose={() => setRemoving(null)}
          actions={
            <>
              <button type="button" className="btn ghost" onClick={() => setRemoving(null)}>Cancelar</button>
              <button type="button" className="btn pri" onClick={() => (setRemoving(null), void removeLabel(target.id))}>Remover etiqueta</button>
            </>
          }
        >
          <p>
            “{target.name}” {used === 0 ? 'não está em nenhuma atividade.' : `sai de ${used} ${used === 1 ? 'atividade' : 'atividades'}.`} Uma cópia do que mudar vai para <code>.plans/trash/</code>.
          </p>
        </Dialog>
      )}
    </section>
  );
}
