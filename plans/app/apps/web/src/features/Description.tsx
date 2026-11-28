// F04: campo em Markdown (descrição e system prompt), lido como um README ou editado; "tela cheia" ocupa a janela inteira. No cartão e na tela cheia abre com edição e visualização lado a lado.
import { lazy, Suspense, useState, type FocusEvent } from 'react';
import { Dialog } from '../ui/Dialog.tsx';
import { Icon } from '../ui/Icon.tsx';
import type { DescriptionMode } from './MarkdownEditor.tsx';
import type { MarkdownText } from './markdownText.ts';

const MarkdownEditor = lazy(() => import('./MarkdownEditor.tsx'));
const MODES: [DescriptionMode, string][] = [['read', 'Ler'], ['edit', 'Editar'], ['split', 'Dividido']];

type Props = {
  text: MarkdownText;
  /** título da janela de tela cheia */
  title: string;
  value: string;
  /** modo em que abre */
  preferred: DescriptionMode;
  /** altura do editor */
  height?: number | string;
  readOnly: boolean;
  dark: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  /** para lembrar o modo escolhido */
  onMode?: (mode: DescriptionMode) => void;
};

export function Description({ text, title, value, preferred, height = 260, readOnly, dark, onChange, onSave, onMode }: Props) {
  const [chosen, setMode] = useState<DescriptionMode>(preferred);
  // sem poder editar é leitura; liberado (a IA terminou de escrever), volta ao modo escolhido
  const mode = readOnly ? 'read' : chosen;
  const [full, setFull] = useState<DescriptionMode | null>(null);
  const choose = (next: DescriptionMode) => {
    onSave();
    setMode(next);
    onMode?.(next);
  };
  // salva quando o foco sai do editor (não ao usar a barra de ferramentas dele)
  const leave = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onSave();
  };

  const tabs = (current: DescriptionMode, pick: (m: DescriptionMode) => void) => (
    <div className="md-tabs" role="radiogroup" aria-label={text.modes}>
      {MODES.map(([m, label]) => (
        <button key={m} type="button" role="radio" aria-checked={current === m} disabled={readOnly && m !== 'read'} onClick={() => pick(m)}>{label}</button>
      ))}
    </div>
  );
  const editor = (current: DescriptionMode, height: number | string, edit: () => void) => (
    <div onBlur={leave}>
      <Suspense fallback={<p className="muted md-loading">Abrindo o editor…</p>}>
        <MarkdownEditor text={text} value={value} mode={current} readOnly={readOnly} dark={dark} height={height} onChange={onChange} onSave={onSave} onEdit={edit} />
      </Suspense>
    </div>
  );
  const close = () => {
    onSave();
    setFull(null);
  };

  return (
    <div className="field">
      <div className="md-head">
        <span>{text.label}</span>
        {tabs(mode, choose)}
        <button type="button" className="md-wide" aria-label={text.fullScreen} title="Tela cheia" onClick={() => setFull(readOnly ? 'read' : 'split')}>
          <Icon name="fit" size={15} />
        </button>
      </div>
      {full === null && editor(mode, height, () => choose('edit'))}
      {full !== null && (
        <Dialog full title={title} onClose={close} actions={<button type="button" className="btn pri" onClick={close}>Fechar</button>}>
          {tabs(full, (m) => (onSave(), setFull(m)))}
          <div className="md-big">{editor(full, '100%', () => setFull('split'))}</div>
        </Dialog>
      )}
    </div>
  );
}
