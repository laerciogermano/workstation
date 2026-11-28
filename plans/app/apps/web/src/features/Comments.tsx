// Respostas e retornos da atividade: um arquivo por comentário.
import { useState } from 'react';
import type { StoredComment } from '../folder/project.ts';
import { addComment, removeComment, type State } from '../store/app.ts';
import { Icon } from '../ui/Icon.tsx';
import { LazyMarkdown } from './LazyMarkdown.tsx';

/** texto ainda não enviado, por atividade: trocar de seleção não perde nada */
const drafts = new Map<string, string>();

export function Comments({ nodeId, comments, assignees, readOnly, dark }: { nodeId: string; comments: StoredComment[]; assignees: State['snapshot']['assignees']; readOnly: boolean; dark: boolean }) {
  const [text, setText] = useState(() => drafts.get(nodeId) ?? '');
  const [sending, setSending] = useState(false);
  const change = (next: string) => {
    setText(next);
    if (next) drafts.set(nodeId, next);
    else drafts.delete(nodeId);
  };
  const send = async () => {
    if (!text.trim() || sending || readOnly) return;
    setSending(true);
    if (await addComment(nodeId, text)) change('');
    setSending(false);
  };

  return (
    <div className="field">
      <span>Comentários</span>
      {comments.length === 0 && <p className="muted small">Nenhum comentário.</p>}
      {comments.length > 0 && (
        <ul className="comments" aria-label="Comentários">
          {comments.map((c) => {
            const who = c.author ? (assignees.find((a) => a.id === c.author)?.name ?? c.author) : 'Sem autor';
            return (
              <li key={c.file}>
                <header>
                  <b>{who}</b>
                  <time className="muted small" dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time>
                  <button type="button" className="remove" aria-label={`Remover comentário de ${who}`} title="Remover (vai para a lixeira)" disabled={readOnly} onClick={() => void removeComment(nodeId, c.file)}>
                    <Icon name="x" size={14} />
                  </button>
                </header>
                <LazyMarkdown source={c.text} dark={dark} />
              </li>
            );
          })}
        </ul>
      )}
      <textarea
        aria-label="Novo comentário"
        placeholder="Resposta ou retorno da atividade (aceita Markdown)"
        rows={3}
        maxLength={100_000}
        value={text}
        readOnly={readOnly}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            void send();
          }
        }}
      />
      <button type="button" className="btn pri send" disabled={readOnly || sending || !text.trim()} onClick={() => void send()}>Comentar</button>
    </div>
  );
}
