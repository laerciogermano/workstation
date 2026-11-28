// "Regenerar descrição": a IA reescreve com todo o contexto do cartão. Nada é trocado sem a pessoa conferir.
import { useEffect, useRef, useState } from 'react';
import { generateDescription, aiReady } from '../ai/describe.ts';
import { openAiSettings } from '../ai/settings.ts';
import { loadCardContext, replaceDescription } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { LazyMarkdown } from './LazyMarkdown.tsx';

type Run = { step: 'working' } | { step: 'ready'; from: string; text: string } | { step: 'failed'; message: string };

const NOT_REPLACED = 'Nada foi trocado: a descrição mudou enquanto a IA escrevia ou não pôde ser gravada. Gere de novo.';

export function Regenerate({ nodeId, disabled, dark }: { nodeId: string; disabled: boolean; dark: boolean }) {
  const [run, setRun] = useState<Run | null>(null);
  const [replacing, setReplacing] = useState(false);
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);

  const close = () => {
    current.current?.abort();
    setRun(null);
  };

  const start = async () => {
    current.current?.abort();
    const { signal } = (current.current = new AbortController());
    setRun({ step: 'working' });
    try {
      const ready = await aiReady();
      if (signal.aborted) return;
      if (!ready) {
        setRun(null);
        return openAiSettings();
      }
      const context = await loadCardContext(nodeId);
      if (signal.aborted) return;
      const text = (await generateDescription(context, signal)).trim();
      if (signal.aborted) return;
      if (!text) throw new Error('A IA não devolveu texto. Tente de novo.');
      setRun({ step: 'ready', from: context.description, text });
    } catch (e) {
      if (signal.aborted) return;
      console.error(e);
      setRun({ step: 'failed', message: e instanceof Error ? e.message : String(e) });
    }
  };

  const replace = async (from: string, text: string) => {
    setReplacing(true);
    try {
      if (await replaceDescription(nodeId, from, text)) close();
      else setRun({ step: 'failed', message: NOT_REPLACED });
    } finally {
      setReplacing(false);
    }
  };

  return (
    <>
      <button type="button" className="btn regenerate" disabled={disabled} title="A IA reescreve a descrição com todo o contexto do cartão" onClick={() => void start()}>
        Regenerar descrição
      </button>
      {run && (
        <Dialog
          wide
          title="Regenerar descrição"
          onClose={close}
          actions={
            <>
              <button type="button" className="btn" onClick={close}>{run.step === 'ready' ? 'Descartar' : 'Cancelar'}</button>
              {run.step !== 'working' && <button type="button" className="btn" disabled={replacing} onClick={() => void start()}>Gerar de novo</button>}
              {run.step === 'ready' && (
                <button type="button" className="btn pri" disabled={disabled || replacing} onClick={() => void replace(run.from, run.text)}>Substituir descrição</button>
              )}
            </>
          }
        >
          {run.step === 'working' && <p className="muted" role="status">Gerando com o contexto do cartão: pais, subatividades, comentários e anexos…</p>}
          {run.step === 'failed' && <p className="note warn" role="alert">{run.message}</p>}
          {run.step === 'ready' && (
            <>
              <p className="muted small">Confira o texto. A descrição atual só muda se você substituir.</p>
              <div className="regenerated" role="region" aria-label="Descrição gerada" tabIndex={0}>
                <LazyMarkdown source={run.text} dark={dark} />
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
