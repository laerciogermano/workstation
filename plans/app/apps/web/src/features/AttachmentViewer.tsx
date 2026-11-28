// Abre um anexo numa janela, com a visualização do tipo dele. Nada do arquivo roda como página.
import type { Side } from '@plans/domain';
import { lazy, Suspense, useEffect, useState } from 'react';
import { readAttachment } from '../store/app.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { LazyMarkdown } from './LazyMarkdown.tsx';
import { readDocument, type Block } from './office.ts';
import { extension, fileKind, looksBinary, prettyJson, TEXT_LIMIT } from './preview.ts';

/** Planilhas abrem no editor, que só é baixado quando alguém precisa. */
const SheetDialog = lazy(() => import('./SheetDialog.tsx'));
const SPREADSHEETS = ['csv', 'tsv', 'xlsx', 'xlsm', 'xls', 'ods'];

type Shown =
  | { kind: 'image' | 'video' | 'audio' | 'pdf'; url: string }
  | { kind: 'markdown' | 'text'; text: string; cut: boolean }
  | { kind: 'document'; blocks: Block[]; cut: boolean }
  | { kind: 'none'; reason: string };

const NO_PREVIEW = 'Sem visualização para este tipo de arquivo. Baixe para abrir no programa dele.';

async function prepare(name: string, blob: Blob, track: (url: string) => string): Promise<Shown> {
  const { kind, mime } = fileKind(name);
  // SVG vai como data: para não ganhar a origem do app se for aberto em outra aba
  if (mime === 'image/svg+xml') return { kind: 'image', url: `data:${mime};charset=utf-8,${encodeURIComponent(await blob.text())}` };
  if (kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'pdf') return { kind, url: track(URL.createObjectURL(new Blob([blob], { type: mime }))) };
  if (kind === 'document') {
    const { blocks, truncated } = await readDocument(blob);
    return { kind, blocks, cut: truncated };
  }
  const cut = blob.size > TEXT_LIMIT;
  let text = await blob.slice(0, TEXT_LIMIT).text();
  if (cut) text = text.replace(/�+$/, ''); // o corte pode partir um caractere ao meio
  if (kind === 'unknown' && looksBinary(text)) return { kind: 'none', reason: NO_PREVIEW };
  if (kind === 'markdown') return { kind, text, cut };
  return { kind: 'text', text: extension(name) === 'json' && !cut ? prettyJson(text) : text, cut };
}

function Table({ rows }: { rows: string[][] }) {
  return (
    <table>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function Preview({ name, shown, dark, onBroken }: { name: string; shown: Shown; dark: boolean; onBroken: () => void }) {
  switch (shown.kind) {
    case 'image':
      return <img src={shown.url} alt={name} onError={onBroken} />;
    case 'video':
      return <video src={shown.url} controls aria-label={name} onError={onBroken} />;
    case 'audio':
      return <audio src={shown.url} controls aria-label={name} onError={onBroken} />;
    case 'pdf':
      return <iframe src={shown.url} title={name} />;
    case 'markdown':
      return <LazyMarkdown source={shown.text} dark={dark} />;
    case 'text':
      return shown.text ? <pre tabIndex={0} aria-label={name}>{shown.text}</pre> : <p className="muted">Arquivo vazio.</p>;
    case 'document':
      return (
        <article>
          {shown.blocks.map((b, i) => (b.type === 'table' ? <Table key={i} rows={b.rows} /> : b.heading ? <h3 key={i}>{b.text}</h3> : <p key={i}>{b.text}</p>))}
        </article>
      );
    case 'none':
      return <p className="muted">{shown.reason}</p>;
  }
}

type Props = { nodeId: string; side: Side; name: string; dark: boolean; onClose: () => void };

export function AttachmentViewer(props: Props) {
  if (!SPREADSHEETS.includes(extension(props.name))) return <FileDialog {...props} />;
  return (
    <Suspense fallback={null}>
      <SheetDialog {...props} />
    </Suspense>
  );
}

function FileDialog({ nodeId, side, name, dark, onClose }: Props) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [download, setDownload] = useState('');

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    const track = (url: string) => (urls.push(url), url);
    (async () => {
      const blob = await readAttachment(nodeId, side, name);
      const next = await prepare(name, blob, track);
      if (!alive) return urls.forEach((u) => URL.revokeObjectURL(u));
      // sempre como arquivo comum: baixar nunca abre o conteúdo como página
      setDownload(track(URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }))));
      setShown(next);
    })().catch((e: Error) => alive && setShown({ kind: 'none', reason: `Não deu para abrir o arquivo. ${e.message}` }));
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [nodeId, side, name]);

  return (
    <Dialog
      wide
      title={name}
      onClose={onClose}
      actions={
        <>
          {download && <a className="btn" href={download} download={name}>Baixar</a>}
          <button type="button" className="btn pri" onClick={onClose}>Fechar</button>
        </>
      }
    >
      <div className={`viewer ${shown?.kind ?? ''}`}>
        {shown ? <Preview name={name} shown={shown} dark={dark} onBroken={() => setShown({ kind: 'none', reason: 'O navegador não conseguiu mostrar este arquivo. Baixe para abrir.' })} /> : <p className="muted">Abrindo…</p>}
      </div>
      {shown && 'cut' in shown && shown.cut && (
        <p className="muted small">Mostrando só o começo do arquivo. Baixe para ver tudo.</p>
      )}
    </Dialog>
  );
}
