// Instruções padrão do projeto: sozinhas nas configurações e como referência em cada atividade.
import { setSystemPromptMode, updateSystemPrompt, type State } from '../store/app.ts';
import { isDark } from '../ui/themes.ts';
import { Description } from './Description.tsx';
import { SYSTEM_PROMPT_TEXT } from './markdownText.ts';
import { DraftStatus, useDraft } from './useDraft.tsx';

export function SystemPrompt({ app }: { app: State }) {
  const { text, rev } = app.snapshot.systemPrompt;
  const draft = useDraft(text, rev, updateSystemPrompt, app.readOnly);
  const inActivity = app.snapshot.activities.some((a) => a.id === app.selected);

  return (
    <section className="system-prompt" aria-label="Instruções padrão">
      {!inActivity && <h2>Configurações do projeto</h2>}
      <Description
        text={SYSTEM_PROMPT_TEXT}
        title="System prompt"
        value={draft.draft}
        preferred={app.systemPromptMode}
        readOnly={app.readOnly}
        dark={isDark(app.theme)}
        onChange={draft.change}
        onSave={draft.flush}
        onMode={setSystemPromptMode}
      />
      <DraftStatus draft={draft} />
      <p className="muted small">
        {inActivity ? 'Vale para todas as atividades: editar aqui muda em todas.' : 'Instruções padrão para todas as atividades.'} · system-prompt.md
      </p>
    </section>
  );
}
