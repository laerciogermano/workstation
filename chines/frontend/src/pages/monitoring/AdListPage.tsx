import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, classificationBadge } from '../../components/ui/Badge';
import { ExportModal, useExportModal } from '../../components/ui/ExportModal';
import { ads } from '../../data/mockData';

export function AdListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const exportModal = useExportModal();
  const irregular = ads.filter((a) => a.classification === 'irregular').length;

  return (
    <>
      <PageHeader title="Anúncios coletados" description="Resultados da varredura automática." screenId="TELA-08" stories="US-04, US-07, US-08, US-09, US-11, US-23" />
      <div className="indicators-row">
        <span>Total: <strong>{ads.length}</strong></span>
        <span>Irregulares: <strong>{irregular}</strong></span>
      </div>
      <FiltersBar
        fields={[
          { name: 'sku', label: 'SKU', placeholder: 'Filtrar SKU' },
          { name: 'marketplace', label: 'Marketplace', type: 'select', options: [{ value: 'ml', label: 'Mercado Livre' }, { value: 'shopee', label: 'Shopee' }] },
          { name: 'classification', label: 'Classificação', type: 'select', options: [{ value: 'regular', label: 'Regular' }, { value: 'irregular', label: 'Irregular' }] },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="actions-row">
        <button type="button" className="btn btn-secondary" onClick={exportModal.openExport}>Exportar</button>
      </div>
      <DataTable
        keyField="id"
        data={ads}
        columns={[
          { key: 'title', header: 'Anúncio', render: (r) => <Link to={`/monitoramento/anuncios/${r.id}`}>{String(r.title)}</Link> },
          { key: 'marketplace', header: 'Canal' },
          { key: 'modality', header: 'Modalidade' },
          { key: 'price', header: 'Preço', render: (r) => `R$ ${r.price}` },
          { key: 'pmaApplied', header: 'PMA', render: (r) => `R$ ${r.pmaApplied}` },
          { key: 'diffPct', header: 'Dif. %', render: (r) => `${r.diffPct}%` },
          { key: 'classification', header: 'Classificação', render: (r) => <Badge variant={classificationBadge(String(r.classification))}>{String(r.classification)}</Badge> },
          { key: 'seller', header: 'Vendedor' },
          { key: 'partner', header: 'Parceiro', render: (r) => r.unregistered ? <Badge variant="warning">Não cadastrado</Badge> : String(r.partner ?? '—') },
          { key: 'actions', header: '', render: () => (
            <>
              <button type="button" className="btn btn-sm btn-secondary">Confirmar</button>{' '}
              <button type="button" className="btn btn-sm btn-danger">Descartar</button>
            </>
          )},
        ]}
      />
      <ExportModal open={exportModal.open} onClose={exportModal.closeExport} title="Exportar anúncios" />
    </>
  );
}
