// Rascunho de um texto guardado em arquivo: salva em fila e nunca sobrescreve o que mudou fora desta tela.
import { useEffect, useRef, useState } from 'react';

/** Nova revisão do arquivo, 'conflict' ou null (falhou e o aviso já foi mostrado). */
export type WriteResult = string | 'conflict' | null;
type Status = 'idle' | 'saving' | 'saved' | 'conflict';

export function useDraft(value: string, rev: string, write: (rev: string, text: string) => Promise<WriteResult>, readOnly: boolean) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<Status>('idle');
  /** versão do arquivo sobre a qual o rascunho foi escrito */
  const base = useRef({ rev, value });
  const live = useRef({ draft, write });
  live.current = { draft, write };

  /** texto que estamos gravando agora: quando ele volta do arquivo, não é conflito */
  const writing = useRef<string | null>(null);

  useEffect(() => {
    if (rev === base.current.rev) return;
    if (value === writing.current) {
      base.current = { rev, value };
      return;
    }
    const dirty = live.current.draft !== base.current.value;
    if (!dirty || live.current.draft === value) {
      base.current = { rev, value };
      setDraft(value);
    } else if (value === base.current.value) {
      base.current.rev = rev; // mudou outro campo: o rascunho continua válido
    } else setStatus('conflict');
  }, [rev, value]);

  const saving = useRef<Promise<unknown>>(Promise.resolve());
  /** Sem `other`, grava o rascunho; com `other`, grava outro campo do mesmo arquivo. */
  const save = (other?: (rev: string) => Promise<WriteResult>) => {
    saving.current = saving.current.then(async () => {
      const text = live.current.draft;
      if (!other && text === base.current.value) return;
      setStatus('saving');
      if (!other) writing.current = text;
      const result = await (other ? other(base.current.rev) : live.current.write(base.current.rev, text));
      writing.current = null;
      if (result === 'conflict') return setStatus('conflict');
      if (!result) return setStatus('idle');
      base.current = { rev: result, value: other ? base.current.value : text };
      setStatus('saved');
    });
  };

  // o editor pode sumir com texto por salvar (outra atividade selecionada pelo teclado, por exemplo)
  const flush = useRef(() => {});
  flush.current = () => status !== 'conflict' && !readOnly && save();
  useEffect(() => () => flush.current(), []);

  return {
    draft,
    status,
    dirty: draft !== base.current.value,
    save,
    flush: () => flush.current(),
    change: (next: string) => (setDraft(next), setStatus((s) => (s === 'conflict' ? s : 'idle'))),
    reload: () => {
      base.current = { rev, value };
      setDraft(value);
      setStatus('idle');
    },
  };
}

export function DraftStatus({ draft }: { draft: ReturnType<typeof useDraft> }) {
  return (
    <>
      <p className="status" role="status">
        {draft.status === 'saving' && 'Salvando…'}
        {draft.status === 'saved' && 'Salvo no arquivo'}
        {draft.status === 'idle' && draft.dirty && 'Salva ao sair do editor ou com ⌘S'}
      </p>
      {draft.status === 'conflict' && (
        <div className="note warn" role="alert">
          O arquivo mudou fora desta tela. Copie seu texto se quiser guardá-lo.
          <button type="button" className="btn" onClick={draft.reload}>Recarregar do arquivo</button>
        </div>
      )}
    </>
  );
}
