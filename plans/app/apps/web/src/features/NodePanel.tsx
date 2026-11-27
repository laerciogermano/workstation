// F03 e F04: responsável e descrição.
import { STATUS_LABEL, STATUSES } from '@plans/domain';
import { useEffect, useRef, useState } from 'react';
import type { Patch, StoredActivity } from '../folder/project.ts';
import { askRemove, updateNode, type State } from '../store/app.ts';

type Status = 'idle' | 'saving' | 'saved' | 'conflict';

export function NodePanel({ app, node }: { app: State; node: StoredActivity }) {
  const [draft, setDraft] = useState(node.description);
  const [status, setStatus] = useState<Status>('idle');
  /** versão do arquivo sobre a qual o rascunho foi escrito */
  const base = useRef({ rev: node.rev, description: node.description });
  const live = useRef({ draft, rev: node.rev });
  live.current.draft = draft;

  useEffect(() => {
    if (node.rev === base.current.rev) return;
    const dirty = live.current.draft !== base.current.description;
    if (!dirty || live.current.draft === node.description) {
      base.current = { rev: node.rev, description: node.description };
      setDraft(node.description);
    } else if (node.description === base.current.description) {
      base.current.rev = node.rev; // mudou outro campo: o rascunho continua válido
    } else setStatus('conflict');
  }, [node.rev, node.description]);

  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const save = (patch?: Patch) => {
    saving.current = saving.current.then(async () => {
      const description = live.current.draft;
      if (!patch && description === base.current.description) return;
      setStatus('saving');
      const result = await updateNode(node.id, base.current.rev, patch ?? { description });
      if (result === 'conflict') return setStatus('conflict');
      if (!result) return setStatus('idle');
      base.current = { rev: result, description: patch ? base.current.description : description };
      setStatus('saved');
    });
  };

  const reload = () => {
    base.current = { rev: node.rev, description: node.description };
    setDraft(node.description);
    setStatus('idle');
  };
  const known = app.snapshot.assignees.some((a) => a.id === node.assignee);

  return (
    <section className="node-panel" aria-label="Atividade selecionada">
      <header>
        <h2>{node.title}</h2>
        <button type="button" className="btn ghost danger" onClick={() => void askRemove(node.id)} disabled={app.readOnly}>Remover</button>
      </header>
      <div className="field">
        <span id="status-label">Status</span>
        <div className="segmented" role="radiogroup" aria-labelledby="status-label">
          {STATUSES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={(node.status ?? 'todo') === s} className={`status-${s}`} disabled={app.readOnly} onClick={() => save({ status: s })}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Responsável</span>
        <select value={node.assignee ?? ''} disabled={app.readOnly} onChange={(e) => save({ assignee: e.target.value || null })}>
          <option value="">Sem responsável</option>
          {node.assignee && !known && <option value={node.assignee}>{node.assignee} (não está em assignees.json)</option>}
          {app.snapshot.assignees.map((a) => (
            <option key={a.id} value={a.id}>{a.name} · {{ person: 'pessoa', ai: 'IA', machine: 'máquina' }[a.type]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea
          rows={6}
          maxLength={100_000}
          value={draft}
          readOnly={app.readOnly}
          placeholder="Contexto para quem vai executar"
          onChange={(e) => (setDraft(e.target.value), setStatus((s) => (s === 'conflict' ? s : 'idle')))}
          onBlur={() => status !== 'conflict' && save()}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && save()}
        />
      </label>
      <p className="status" role="status">
        {status === 'saving' && 'Salvando…'}
        {status === 'saved' && 'Salvo no arquivo'}
        {status === 'idle' && draft !== base.current.description && 'Alterações salvam ao sair do campo'}
      </p>
      {status === 'conflict' && (
        <div className="note warn" role="alert">
          O arquivo mudou fora desta tela. Copie seu texto se quiser guardá-lo.
          <button type="button" className="btn" onClick={reload}>Recarregar do arquivo</button>
        </div>
      )}
      <p className="muted small">activities/{node.id}.md</p>
    </section>
  );
}
