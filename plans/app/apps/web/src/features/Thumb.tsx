// Miniatura de um anexo. Enquanto não há (ou quando não dá para ter), mostra o selo com a extensão.
import type { Side } from '@plans/domain';
import { useEffect, useState } from 'react';
import type { Attachment } from '../folder/project.ts';
import { readAttachment } from '../store/app.ts';
import { extension } from './preview.ts';
import { makeThumbnail, type Thumbnail } from './thumb.ts';

export function Thumb({ nodeId, side, file: { name, size } }: { nodeId: string; side: Side; file: Attachment }) {
  const key = JSON.stringify([nodeId, side, name, size]);
  // a chave evita mostrar a miniatura de outro arquivo enquanto a nova não chega
  const [made, setMade] = useState<{ key: string; thumb: Thumbnail | null } | null>(null);

  useEffect(() => {
    let alive = true;
    let url = '';
    readAttachment(nodeId, side, name)
      .then((blob) => makeThumbnail(name, blob))
      .then((thumb) => {
        if (thumb && 'url' in thumb) url = thumb.url;
        if (alive) setMade({ key, thumb });
        else URL.revokeObjectURL(url);
      })
      .catch(() => {}); // arquivo corrompido ou que sumiu: fica o selo
    return () => {
      alive = false;
      URL.revokeObjectURL(url);
    };
  }, [key, nodeId, side, name]);

  const thumb = made?.key === key ? made.thumb : null;
  const label = <span className="ftype">{extension(name).slice(0, 4) || '?'}</span>;
  if (!thumb) return <span className="thumb" aria-hidden="true">{label}</span>;
  const broken = () => setMade({ key, thumb: null });

  return (
    <span className={`thumb ${thumb.kind}`} aria-hidden="true">
      {thumb.kind === 'text' ? (
        <span className="lines">{thumb.text}</span>
      ) : thumb.kind === 'video' ? (
        // o #t pede um quadro do começo: sem ele o vídeo parado pode ficar em branco
        <video src={`${thumb.url}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} onError={broken} />
      ) : thumb.kind === 'pdf' ? (
        // o próprio navegador desenha a primeira página; inert: a moldura não recebe foco nem clique
        <iframe src={`${thumb.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} title="" tabIndex={-1} inert />
      ) : (
        <img src={thumb.url} alt="" decoding="async" onError={broken} />
      )}
      {thumb.kind !== 'image' && label}
    </span>
  );
}
