import { useEffect, useRef, type ReactNode } from 'react';

/** Diálogo modal nativo: foco preso e Esc fecha. */
export function Dialog({ title, onClose, children, actions, wide }: { title: string; onClose: () => void; children: ReactNode; actions: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className={wide ? 'dialog wide' : 'dialog'} onClose={onClose} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      {children}
      <div className="actions">{actions}</div>
    </dialog>
  );
}
