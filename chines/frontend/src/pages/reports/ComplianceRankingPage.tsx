import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { partners } from '../../data/mockData';

export function ComplianceRankingPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const exportModal = useExportModal();

  const ranking = partners.map((p) => ({
    id: p.id,
    name: p.tradeName,
    distributor: p.distributor,
    ads: 24,
    irregularities: p.openOccurrences,
    compliance: p.compliance,
    recidivism: p.openOccurrences > 0 ? 1 : 0,
    lastViolation: p.openOccurrences > 0 ? '2026-08-26' : '—',
  }));

  return (
    <>
      <PageHeader title="Ranking de conformidade" description="Revendedores por distribuidor." screenId="TELA-17" stories="US-22, US-23" />
      <FiltersBar
        fields={[
          { name: 'distributor', label: 'Distribuidor', placeholder: 'Filtrar' },
          { name: 'period', label: 'Período', type: 'date' },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="two-col">
        <Panel title="Top violadores">
          <div className="chart-placeholder">Gráfico — top violadores</div>
        </Panel>
        <Panel title="Evolução por distribuidor">
          <div className="chart-placeholder">Gráfico — conformidade</div>
        </Panel>
      </div>
      <DataTable
        keyField="id"
        data={ranking}
        columns={[
          { key: 'name', header: 'Revendedor', render: (r) => <Link to={`/parceiros/${r.id}`}>{String(r.name)}</Link> },
          { key: 'distributor', header: 'Distribuidor' },
          { key: 'ads', header: 'Anúncios' },
          { key: 'irregularities', header: 'Irregularidades' },
          { key: 'compliance', header: 'Conformidade %', render: (r) => `${r.compliance}%` },
          { key: 'recidivism', header: 'Reincidências' },
          { key: 'lastViolation', header: 'Última violação' },
          { key: 'actions', header: '', render: (r) => <Link to={`/fiscalizacao/ocorrencias?partner=${r.id}`} className="btn btn-sm btn-secondary">Ocorrências</Link> },
        ]}
      />
      <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar ranking</button>
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar ranking" />
    </>
  );
}
