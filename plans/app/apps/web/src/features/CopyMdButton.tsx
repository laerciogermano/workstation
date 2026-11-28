// Copia o Markdown do cartão e dos pais (raiz → nó), no formato de activities/<id>.md.
import { serializeActivityWithAncestors, type Activity } from '@plans/domain';
import { useEffect, useState } from 'react';
import { useApp } from '../store/app.ts';
import { Icon } from '../ui/Icon.tsx';

type Props = {
  activity: Activity;
  /** descrição atual (ex.: rascunho do cartão aberto); senão usa a do activity */
  description?: string;
  tabIndex?: number;
  /** texto ao lado do ícone (cartão aberto) */
  wide?: boolean;
};

export function CopyMdButton({ activity, description, tabIndex, wide }: Props) {
  const app = useApp();
  const fallbackPrompt = app.snapshot.systemPrompt.text;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const label = copied ? 'Copiado' : 'Copiar Markdown';
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className={wide ? 'btn ghost copy-md' : undefined}
      aria-label={`${label}: ${activity.title}`}
      title={copied ? 'Markdown copiado' : 'Copiar o Markdown deste cartão e dos pais'}
      onClick={(e) => {
        e.stopPropagation();
        const leaf = description !== undefined ? { ...activity, description } : activity;
        const text = serializeActivityWithAncestors(app.snapshot.activities, leaf, fallbackPrompt);
        void navigator.clipboard.writeText(text).then(() => setCopied(true));
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Icon name="copy" size={14} />
      {wide && <span>{copied ? 'Copiado' : 'Copiar'}</span>}
    </button>
  );
}
