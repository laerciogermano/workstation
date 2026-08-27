import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
};

export function ExportModal({ open, onClose, title = 'Exportar dados' }: Props) {
  const [format, setFormat] = useState('xlsx');
  const [progress, setProgress] = useState(false);

  if (!open) return null;

  const handleExport = () => {
    setProgress(true);
    setTimeout(() => {
      setProgress(false);
      onClose();
      alert(`Exportação ${format.toUpperCase()} concluída (mock).`);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="export-title">
        <div className="modal-header" id="export-title">
          {title}
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 0 }}>
            Filtros ativos da tela serão aplicados à exportação.
          </p>
          <div className="field">
            <label htmlFor="format">Formato</label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          {progress && (
            <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Gerando arquivo…</p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={progress}>
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export function useExportModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openExport: () => setOpen(true),
    closeExport: () => setOpen(false),
  };
}
