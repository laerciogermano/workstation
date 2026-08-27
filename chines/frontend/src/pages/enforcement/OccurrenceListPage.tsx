import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, occurrenceStatusBadge } from '../../components/ui/Badge';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { occurrences } from '../../data/mockData';

const views = ['Todas', 'Abertas', 'Aguardando correção', 'Vencidas', 'Reincidentes'];

export function OccurrenceListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState('Todas');
  const exportModal = useExportModal();

  return (
    <>
      <PageHeader title="Ocorrências" description="Violações de MAP identificadas." screenId="TELA-12" stories="US-10, US-11, US-20, US-23" />
      <div className="tabs">
        {views.map((v) => (
          <button key={v} type="button" className={`tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{v}</button>
        ))}
      </div>
      <FiltersBar
        fields={[
          { name: 'sku', label: 'SKU', placeholder: 'SKU' },
          { name: 'cnpj', label: 'CNPJ', placeholder: 'CNPJ' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Identificada', label: 'Identificada' }, { value: 'Aguardando correção', label: 'Aguardando' }] },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="actions-row">
        <button type="button" className="btn btn-secondary">Atribuir responsável</button>
        <button type="button" className="btn btn-secondary">Advertência em lote</button>
        <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar</button>
      </div>
      <DataTable
        keyField="id"
        data={occurrences}
        columns={[
          { key: 'number', header: 'Ocorrência', render: (r) => <Link to={`/fiscalizacao/ocorrencias/${r.id}`}>{String(r.number)}</Link> },
          { key: 'sku', header: 'SKU' },
          { key: 'price', header: 'Preço', render: (r) => `R$ ${r.price}` },
          { key: 'diffPct', header: 'Dif. %', render: (r) => `${r.diffPct}%` },
          { key: 'marketplace', header: 'Canal' },
          { key: 'seller', header: 'Vendedor' },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={occurrenceStatusBadge(String(r.status))}>{String(r.status)}</Badge> },
          { key: 'responsible', header: 'Responsável', render: (r) => String(r.responsible ?? '—') },
          { key: 'deadline', header: 'Prazo', render: (r) => String(r.deadline ?? '—') },
        ]}
      />
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar ocorrências" />
    </>
  );
}
