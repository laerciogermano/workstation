import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Panel } from '../components/ui/Panel';
import { FiltersBar } from '../components/ui/FiltersBar';
import { useState } from 'react';
import { ads, occurrences, unregisteredSellers } from '../data/mockData';

export function DashboardPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral do monitoramento e das violações em andamento."
        screenId="TELA-01"
        stories="US-14"
      />
      <FiltersBar
        fields={[
          { name: 'product', label: 'Produto', placeholder: 'SKU ou nome' },
          { name: 'marketplace', label: 'Marketplace', type: 'select', options: [{ value: 'ml', label: 'Mercado Livre' }, { value: 'shopee', label: 'Shopee' }] },
          { name: 'period', label: 'Período', type: 'date' },
        ]}
        values={filters}
        onChange={(n, v) => setFilters((f) => ({ ...f, [n]: v }))}
      />
      <div className="card-grid">
        <StatCard label="Produtos monitorados" value={12} />
        <StatCard label="Anúncios encontrados" value={156} />
        <StatCard label="Vendedores" value={48} />
        <StatCard label="Regulares" value={132} variant="success" />
        <StatCard label="Irregulares" value={24} variant="danger" />
        <StatCard label="Ocorrências abertas" value={8} variant="warning" />
        <StatCard label="Resolvidas" value={34} variant="success" />
        <StatCard label="Reincidentes" value={3} variant="danger" />
      </div>
      <div className="two-col">
        <Panel title="Evolução de violações">
          <div className="chart-placeholder">Gráfico — violações ao longo do tempo</div>
        </Panel>
        <Panel title="Marketplaces com mais irregularidades">
          <div className="chart-placeholder">Gráfico — por marketplace</div>
        </Panel>
      </div>
      <Panel title="Últimas irregularidades">
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
          {ads.filter((a) => a.classification === 'irregular').map((a) => (
            <li key={a.id}>
              <Link to={`/monitoramento/anuncios/${a.id}`}>{a.title}</Link> — {a.marketplace} — R$ {a.price}
            </li>
          ))}
        </ul>
      </Panel>
      <div className="two-col">
        <Panel title="Prazos vencidos">
          {occurrences.filter((o) => o.overdue).length === 0 ? (
            <p style={{ margin: 0, color: 'var(--muted)' }}>Nenhum prazo vencido.</p>
          ) : (
            <ul>{occurrences.filter((o) => o.overdue).map((o) => <li key={o.id}>{o.number}</li>)}</ul>
          )}
        </Panel>
        <Panel title="Vendedores não cadastrados">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {unregisteredSellers.map((u) => (
              <li key={u.id}>
                <Link to="/fiscalizacao/nao-cadastrados">{u.seller}</Link> — {u.marketplace}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="actions-row">
        <Link to="/produtos" className="btn btn-secondary">Produtos</Link>
        <Link to="/fiscalizacao/ocorrencias" className="btn btn-secondary">Ocorrências</Link>
        <Link to="/monitoramento/mapeamento" className="btn btn-secondary">Mapeamento</Link>
        <Link to="/relatorios/ranking" className="btn btn-secondary">Ranking</Link>
      </div>
    </>
  );
}
