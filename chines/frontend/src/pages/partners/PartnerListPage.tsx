import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { partners } from '../../data/mockData';

export function PartnerListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const exportModal = useExportModal();

  return (
    <>
      <PageHeader title="Lista de parceiros" description="Base oficial de revendedores." screenId="TELA-14" stories="US-11, US-18, US-23" />
      <div className="indicators-row">
        <span>Ativos: <strong>{partners.filter((p) => p.status === 'ativo').length}</strong></span>
        <span>Com ocorrências: <strong>{partners.filter((p) => p.openOccurrences > 0).length}</strong></span>
      </div>
      <FiltersBar
        fields={[
          { name: 'name', label: 'Nome / CNPJ', placeholder: 'Buscar' },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="actions-row">
        <Link to="/parceiros/novo" className="btn btn-primary">Novo parceiro</Link>
        <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar</button>
      </div>
      <DataTable
        keyField="id"
        data={partners}
        columns={[
          { key: 'tradeName', header: 'Nome', render: (r) => <Link to={`/parceiros/${r.id}`}>{String(r.tradeName)}</Link> },
          { key: 'cnpj', header: 'CNPJ' },
          { key: 'distributor', header: 'Distribuidor' },
          { key: 'marketplaces', header: 'Marketplaces', render: (r) => (r.marketplaces as string[]).join(', ') },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ativo' ? 'success' : 'neutral'}>{String(r.status)}</Badge> },
          { key: 'openOccurrences', header: 'Ocorr. abertas' },
          { key: 'compliance', header: 'Conformidade', render: (r) => `${r.compliance}%` },
        ]}
      />
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar parceiros" />
    </>
  );
}
