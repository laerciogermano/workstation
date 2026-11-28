// F04: descrição em Markdown, lida como um README ou editada; "tela cheia" abre numa janela larga.
import { lazy, Suspense, useState, type FocusEvent } from 'react';
import { Dialog } from '../ui/Dialog.tsx';
import { Icon } from '../ui/Icon.tsx';
import type { DescriptionMode } from './MarkdownEditor.tsx';

const MarkdownEditor = lazy(() => import('./MarkdownEditor.tsx'));
const MODES: [DescriptionMode, string][] = [['read', 'Ler'], ['edit', 'Editar'], ['split', 'Dividido']];

type Props = {
  title: string;
  value: string;
  /** modo preferido, lembrado no projeto */
  preferred: DescriptionMode;
  readOnly: boolean;
  dark: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onMode: (mode: DescriptionMode) => void;
};

export function Description({ title, value, preferred, readOnly, dark, onChange, onSave, onMode }: Props) {
  // nó sem descrição já abre para escrever
  const [mode, setMode] = useState<DescriptionMode>(() => (readOnly ? 'read' : preferred === 'read' && !value.trim() ? 'edit' : preferred));
  const [wide, setWide] = useState<DescriptionMode | null>(null);
  const choose = (next: DescriptionMode) => {
    onSave();
    setMode(next);
    onMode(next);
  };
  // salva quando o foco sai do editor (não ao usar a barra de ferramentas dele)
  const leave = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onSave();
  };

  const tabs = (current: DescriptionMode, pick: (m: DescriptionMode) => void) => (
    <div className="md-tabs" role="radiogroup" aria-label="Modo da descrição">
      {MODES.map(([m, label]) => (
        <button key={m} type="button" role="radio" aria-checked={current === m} disabled={readOnly && m !== 'read'} onClick={() => pick(m)}>{label}</button>
      ))}
    </div>
  );
  const editor = (current: DescriptionMode, height: number | string, edit: () => void) => (
    <div onBlur={leave}>
      <Suspense fallback={<p className="muted md-loading">Abrindo o editor…</p>}>
        <MarkdownEditor value={value} mode={current} readOnly={readOnly} dark={dark} height={height} onChange={onChange} onSave={onSave} onEdit={edit} />
      </Suspense>
    </div>
  );
  const close = () => {
    onSave();
    setWide(null);
  };

  return (
    <div className="field">
      <div className="md-head">
        <span>Descrição</span>
        {tabs(mode, choose)}
        <button type="button" className="md-wide" aria-label="Abrir descrição em tela cheia" title="Tela cheia" onClick={() => setWide(readOnly || mode === 'read' ? 'read' : 'split')}>
          <Icon name="fit" size={15} />
        </button>
      </div>
      {wide === null && editor(mode, 260, () => choose('edit'))}
      {wide !== null && (
        <Dialog wide title={title} onClose={close} actions={<button type="button" className="btn pri" onClick={close}>Fechar</button>}>
          {tabs(wide, (m) => (onSave(), setWide(m)))}
          <div className="md-big">{editor(wide, '62vh', () => setWide('split'))}</div>
        </Dialog>
      )}
    </div>
  );
}
