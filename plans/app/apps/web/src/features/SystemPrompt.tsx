// Instruções padrão do projeto: sozinhas nas configurações; cada cartão leva uma cópia no arquivo.
import { setSystemPromptMode, updateSystemPrompt, type State } from '../store/app.ts';
import { isDark } from '../ui/themes.ts';
import { Description } from './Description.tsx';
import { SYSTEM_PROMPT_TEXT } from './markdownText.ts';
import { DraftStatus, useDraft } from './useDraft.tsx';

export function SystemPrompt({ app }: { app: State }) {
  const { text, rev } = app.snapshot.systemPrompt;
  const draft = useDraft(text, rev, updateSystemPrompt, app.readOnly);
  const inActivity = app.opened && app.snapshot.activities.some((a) => a.id === app.selected);

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
        {inActivity
          ? 'Novo cartão (ou regravação de arquivo legado) copia este texto; editar aqui não altera os já gravados.'
          : 'Instruções padrão: cada cartão novo recebe uma cópia no próprio arquivo.'}{' '}
        · system-prompt.md
      </p>
    </section>
  );
}
