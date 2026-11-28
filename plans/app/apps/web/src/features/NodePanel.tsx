// F03 e F04: responsável e o cartão em duas metades, Input (descrição e anexos) e Output (comentários e anexos).
import { localDay, STATUS_LABEL, STATUSES, withLocalDay } from '@plans/domain';
import { useEffect, useState } from 'react';
import type { ActivityFiles, Patch, StoredActivity } from '../folder/project.ts';
import { askRemove, cancelDescribe, closeCard, fail, loadFiles, toggleLabel, updateNode, type State } from '../store/app.ts';
import { isDark } from '../ui/themes.ts';
import { AssigneePicker } from './AssigneePicker.tsx';
import { CardSection } from './CardSection.tsx';
import { DateField } from './DateField.tsx';
import { Comments } from './Comments.tsx';
import { Description } from './Description.tsx';
import { LabelPicker } from './Labels.tsx';
import { CopyMdButton } from './CopyMdButton.tsx';
import { PlayButton } from './PlayButton.tsx';
import { DESCRIPTION_TEXT } from './markdownText.ts';
import { PriorityScale } from './Priority.tsx';
import { Regenerate } from './Regenerate.tsx';
import { DraftStatus, useDraft } from './useDraft.tsx';

/** Relidos a cada leitura da pasta: o que um agente grava aparece sozinho. */
function useActivityFiles(id: string, snapshot: State['snapshot']) {
  const [files, setFiles] = useState<ActivityFiles>({ input: [], output: [], comments: [] });
  useEffect(() => {
    let alive = true;
    loadFiles(id).then((next) => alive && setFiles(next), (e) => alive && fail(e));
    return () => void (alive = false);
  }, [id, snapshot]);
  return files;
}

/** Um arquivo solto fora das áreas de anexo não pode tirar a pessoa do app. */
function useNoFileNavigation() {
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files') || e.defaultPrevented) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
    };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);
}

export function NodePanel({ app, node }: { app: State; node: StoredActivity }) {
  const draft = useDraft(node.description, node.rev, (rev, description) => updateNode(node.id, rev, { description }), app.readOnly);
  const save = (patch: Patch) => draft.save((rev) => updateNode(node.id, rev, patch));
  const files = useActivityFiles(node.id, app.snapshot);
  const dark = isDark(app.theme);
  const describing = app.describing.includes(node.id);
  useNoFileNavigation();

  return (
    <section className="node-panel" aria-label="Atividade selecionada">
      <header>
        <h2>{node.title}</h2>
        <CopyMdButton activity={node} description={draft.draft} wide />
        <PlayButton activity={node} app={app} wide />
        <button type="button" className="btn ghost danger" onClick={() => void askRemove(node.id)} disabled={app.readOnly}>Remover</button>
        <button type="button" className="btn pri" aria-label="Fechar atividade" title="Fechar (Esc)" onClick={closeCard}>Fechar</button>
      </header>
      <div className="node-meta">
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
        <PriorityScale value={node.priority} disabled={app.readOnly} onChange={(priority) => save({ priority })} />
        <AssigneePicker value={node.assignee} assignees={app.snapshot.assignees} disabled={app.readOnly} onChange={(assignee) => save({ assignee })} />
        <LabelPicker value={node.labels} catalog={app.snapshot.labels} disabled={app.readOnly} onToggle={(label) => draft.save((rev) => toggleLabel(node.id, rev, label))} />
        <DateField label="Criado em" value={localDay(node.createdAt)} disabled={app.readOnly} onChange={(day) => {
          const createdAt = day && withLocalDay(node.createdAt, day);
          if (createdAt) save({ createdAt });
        }} />
        <DateField label="Entrega" value={node.dueDate} disabled={app.readOnly} clearable onChange={(dueDate) => save({ dueDate })} />
      </div>
      <div className="node-main">
        <CardSection nodeId={node.id} side="input" title="Input" files={files.input} readOnly={app.readOnly} dark={dark}>
          {describing && (
            <div className="note" role="status">
              Gerando descrição com IA…
              <button type="button" className="btn" onClick={() => cancelDescribe(node.id)}>Cancelar e escrever eu mesmo</button>
            </div>
          )}
          <Description
            text={DESCRIPTION_TEXT}
            title={node.title}
            value={draft.draft}
            preferred="split"
            height="max(320px, 62vh)"
            readOnly={app.readOnly || describing}
            dark={dark}
            onChange={draft.change}
            onSave={draft.flush}
          />
          <DraftStatus draft={draft} />
          <Regenerate nodeId={node.id} disabled={app.readOnly || describing || draft.status === 'conflict'} dark={dark} />
        </CardSection>
        <CardSection nodeId={node.id} side="output" title="Output" files={files.output} readOnly={app.readOnly} dark={dark}>
          <Comments nodeId={node.id} comments={files.comments} assignees={app.snapshot.assignees} readOnly={app.readOnly} dark={dark} />
        </CardSection>
      </div>
      <p className="muted small">activities/{node.id}.md</p>
    </section>
  );
}
