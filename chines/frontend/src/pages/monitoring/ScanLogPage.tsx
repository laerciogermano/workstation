import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { FiltersBar } from '../../components/ui/FiltersBar';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Panel } from '../../components/ui/Panel';
import { scanLogs, products } from '../../data/mockData';

export function ScanLogPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  return (
    <>
      <PageHeader title="Log de varreduras" description="Auditoria das execuções automáticas." screenId="TELA-18" stories="US-04, US-05" />
      <FiltersBar
        fields={[
          { name: 'sku', label: 'Produto', type: 'select', options: products.map((p) => ({ value: p.sku, label: p.sku })) },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'sucesso', label: 'Sucesso' }, { value: 'parcial', label: 'Parcial' }, { value: 'falha', label: 'Falha' }] },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <Panel title="Agenda — próximas varreduras">
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
          {products.filter((p) => p.status === 'ativo').map((p) => (
            <li key={p.id}>{p.sku} — {p.frequency} — próxima: {p.nextScan}</li>
          ))}
        </ul>
      </Panel>
      <DataTable
        keyField="id"
        data={scanLogs}
        columns={[
          { key: 'at', header: 'Data/hora' },
          { key: 'sku', header: 'SKU' },
          { key: 'channels', header: 'Canais' },
          { key: 'duration', header: 'Duração' },
          { key: 'found', header: 'Encontrados' },
          { key: 'new', header: 'Novos' },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'sucesso' ? 'success' : r.status === 'parcial' ? 'warning' : 'danger'}>{String(r.status)}</Badge> },
          { key: 'error', header: 'Erro', render: (r) => String(r.error || '—') },
          { key: 'actions', header: 'Ações', render: () => (
            <>
              <button type="button" className="btn btn-sm btn-secondary">Reprocessar</button>{' '}
              <Link to="/monitoramento/anuncios" className="btn btn-sm btn-secondary">Anúncios</Link>
            </>
          )},
        ]}
      />
    </>
  );
}
