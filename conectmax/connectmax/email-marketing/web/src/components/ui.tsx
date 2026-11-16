import { useEffect, useRef, type ReactNode } from 'react';
import type { CampaignStatus, Progress } from '../lib/api.ts';
import { fmtNumber } from '../lib/format.ts';

export function PageHeader({ title, back, actions }: { title: ReactNode; back?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {back}
        <h1>{title}</h1>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'Algo deu errado.';
  return (
    <p className="note note-error" role="alert">
      {message}
    </p>
  );
}

const STATUS_LABEL: Record<CampaignStatus, string> = { draft: 'Rascunho', sending: 'Enviando', sent: 'Enviada' };

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function doneCount(p: Progress) {
  return p.sent + p.failed + p.skipped;
}

export function ProgressBar({ progress, label }: { progress: Progress; label: string }) {
  const { total, sent, failed, skipped } = progress;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  const done = doneCount(progress);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${fmtNumber(done)} de ${fmtNumber(total)}`}
    >
      <span className="progress-sent" style={{ width: `${pct(sent)}%` }} />
      <span className="progress-failed" style={{ width: `${pct(failed)}%` }} />
      <span className="progress-skipped" style={{ width: `${pct(skipped)}%` }} />
    </div>
  );
}

/** Diálogo modal nativo (foco preso, Esc fecha). */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Aguarde…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  );
}
