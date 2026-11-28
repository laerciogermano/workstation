// F03 e F04: responsável e descrição.
import { STATUS_LABEL, STATUSES } from '@plans/domain';
import type { Patch, StoredActivity } from '../folder/project.ts';
import { askRemove, setDescriptionMode, updateNode, type State } from '../store/app.ts';
import { isDark } from '../ui/themes.ts';
import { Description } from './Description.tsx';
import { DESCRIPTION_TEXT } from './markdownText.ts';
import { DraftStatus, useDraft } from './useDraft.tsx';

export function NodePanel({ app, node }: { app: State; node: StoredActivity }) {
  const draft = useDraft(node.description, node.rev, (rev, description) => updateNode(node.id, rev, { description }), app.readOnly);
  const save = (patch: Patch) => draft.save((rev) => updateNode(node.id, rev, patch));
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
      <Description
        text={DESCRIPTION_TEXT}
        title={node.title}
        value={draft.draft}
        preferred={app.descriptionMode}
        openEmpty
        readOnly={app.readOnly}
        dark={isDark(app.theme)}
        onChange={draft.change}
        onSave={draft.flush}
        onMode={setDescriptionMode}
      />
      <DraftStatus draft={draft} />
      <p className="muted small">activities/{node.id}.md</p>
    </section>
  );
}
