// Chave de API da IA: o botão no topo e o diálogo de configuração.
import { useState, type FormEvent } from 'react';
import { AI_PROVIDERS, closeAiSettings, openAiSettings, removeAiConfig, saveAiConfig, useAiConfig, useAiSettingsOpen, type AiConfig, type AiProvider } from '../ai/settings.ts';
import { fail } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';

const providerOf = (id: AiProvider) => AI_PROVIDERS.find((p) => p.id === id)!;

export function AiSettings() {
  const config = useAiConfig();
  const open = useAiSettingsOpen();

  return (
    <>
      <button type="button" className={`link-chip ${config ? 'ready' : 'unpaired'}`} title="Configurar a chave de API da IA" onClick={openAiSettings}>
        <i aria-hidden="true" /> {config ? `IA: ${providerOf(config.provider).name}` : 'IA sem chave'}
      </button>
      {/* só depois de ler o que está salvo: o formulário já nasce preenchido */}
      {open && config !== undefined && <AiSettingsDialog saved={config} />}
    </>
  );
}

function AiSettingsDialog({ saved }: { saved: AiConfig | null }) {
  const [form, setForm] = useState<AiConfig>(saved ?? { provider: 'gemini', apiKey: '', model: '' });
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const provider = providerOf(form.provider);

  // a chave de um provedor não serve no outro: voltar ao salvo traz a dele de volta
  const choose = (id: AiProvider) => {
    setError('');
    setForm(saved?.provider === id ? saved : { provider: id, apiKey: '', model: '' });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveAiConfig(form).then(closeAiSettings, (err: Error) => setError(err.message));
  };

  return (
    <Dialog
      title="Chave de API da IA"
      onClose={closeAiSettings}
      actions={
        <>
          {saved && <button type="button" className="btn ghost danger" onClick={() => void removeAiConfig().then(closeAiSettings, fail)}>Remover chave</button>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={closeAiSettings}>Cancelar</button>
          <button type="submit" form="ai-settings" className="btn pri">Salvar</button>
        </>
      }
    >
      <p>A chave fica salva só neste navegador: não vai para a pasta do projeto nem para o hub. Com a chave salva, criar uma atividade ou regenerar a descrição envia o contexto dela (textos, comentários, anexos legíveis, instruções do projeto e atividades relacionadas, incluindo as de cima) ao provedor escolhido.</p>
      <form id="ai-settings" className="ai-form" onSubmit={submit}>
        <label className="field">
          <span>Provedor</span>
          <select value={form.provider} onChange={(e) => choose(e.target.value as AiProvider)}>
            {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="field">
          <label htmlFor="ai-key">Chave de API</label>
          <div className="ai-key">
            <input
              id="ai-key"
              type={visible ? 'text' : 'password'}
              value={form.apiKey}
              onChange={(e) => (setError(''), setForm({ ...form, apiKey: e.target.value }))}
              required
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error !== ''}
            />
            <button type="button" className="btn" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          <a className="small" href={provider.keyUrl} target="_blank" rel="noreferrer">Criar uma chave em {provider.name}</a>
        </div>
        <label className="field">
          <span>Modelo (opcional)</span>
          <input value={form.model} placeholder="Em branco: o padrão do provedor" onChange={(e) => setForm({ ...form, model: e.target.value })} autoComplete="off" spellCheck={false} />
        </label>
        {error && <p className="ai-error" role="alert">{error}</p>}
      </form>
    </Dialog>
  );
}
