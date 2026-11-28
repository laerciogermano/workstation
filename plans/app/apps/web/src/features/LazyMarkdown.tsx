// Markdown só para leitura, carregado junto com o editor quando alguém precisa.
import { lazy, Suspense } from 'react';

const View = lazy(() => import('./MarkdownEditor.tsx').then((m) => ({ default: m.MarkdownView })));

export function LazyMarkdown(props: { source: string; dark: boolean }) {
  return (
    <Suspense fallback={<p className="muted md-loading">Abrindo…</p>}>
      <View {...props} />
    </Suspense>
  );
}
