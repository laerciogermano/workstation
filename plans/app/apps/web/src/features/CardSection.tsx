// Uma das metades do cartão (Input ou Output): o conteúdo dela e os seus anexos. Soltar arquivos aqui anexa.
import type { Side } from '@plans/domain';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import type { Attachment } from '../folder/project.ts';
import { addAttachments, removeAttachment } from '../store/app.ts';
import { Icon } from '../ui/Icon.tsx';
import { AttachmentViewer } from './AttachmentViewer.tsx';
import { fileSize } from './preview.ts';
import { Thumb } from './Thumb.tsx';

type Props = {
  nodeId: string;
  side: Side;
  title: string;
  files: Attachment[];
  readOnly: boolean;
  dark: boolean;
  children: ReactNode;
};

const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');

export function CardSection({ nodeId, side, title, files, readOnly, dark, children }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const add = (list: FileList | null) => {
    if (list?.length && !readOnly) void addAttachments(nodeId, side, Array.from(list));
  };

  return (
    <>
      <section
        className={`io${over ? ' over' : ''}`}
        aria-label={title}
        // captura: o arquivo solto sobre o editor de texto também vira anexo
        onDragOverCapture={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = readOnly ? 'none' : 'copy';
          setOver(!readOnly);
        }}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(false)}
        onDropCapture={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          add(e.dataTransfer.files);
        }}
      >
        <h3>{title}</h3>
        {children}
        <div className="field">
          <div className="md-head">
            <span>Anexos</span>
            <button type="button" className="btn attach" disabled={readOnly} onClick={() => picker.current?.click()}>
              <Icon name="clip" size={14} /> Anexar
            </button>
            <input
              ref={picker}
              type="file"
              multiple
              hidden
              aria-label={`Anexar em ${title}`}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = ''; // o mesmo arquivo pode ser anexado de novo
              }}
            />
          </div>
          {files.length === 0 ? (
            <p className="muted small">Nenhum anexo.{!readOnly && ' Arraste arquivos para cá.'}</p>
          ) : (
            <ul className="files" aria-label={`Anexos de ${title}`}>
              {files.map((f) => (
                <li key={f.name}>
                  <button type="button" className="file" title={`Abrir ${f.name}`} onClick={() => setOpen(f.name)}>
                    <Thumb nodeId={nodeId} side={side} file={f} />
                    <span className="fname">{f.name}</span>
                    <span className="muted small">{fileSize(f.size)}</span>
                  </button>
                  <button type="button" className="remove" aria-label={`Remover anexo ${f.name}`} title="Remover (vai para a lixeira)" disabled={readOnly} onClick={() => void removeAttachment(nodeId, side, f.name)}>
                    <Icon name="x" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {/* fora da seção: arrastar algo dentro da janela não anexa */}
      {open !== null && <AttachmentViewer nodeId={nodeId} side={side} name={open} dark={dark} onClose={() => setOpen(null)} />}
    </>
  );
}
