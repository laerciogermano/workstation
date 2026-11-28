import { useEffect, useRef, type ReactNode } from 'react';

/** Diálogo modal nativo: foco preso e Esc fecha. */
/** `wide` alarga a janela; `full` ocupa a tela inteira. */
export function Dialog({ title, onClose, children, actions, wide, full }: { title: string; onClose: () => void; children: ReactNode; actions: ReactNode; wide?: boolean; full?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className={full ? 'dialog full' : wide ? 'dialog wide' : 'dialog'} onClose={onClose} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      {children}
      <div className="actions">{actions}</div>
    </dialog>
  );
}
