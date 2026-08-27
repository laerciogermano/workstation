import { useMemo, useState } from 'react';
import { catalog, type ResponsibleType } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';

const tabs: { id: ResponsibleType; label: string }[] = [
  { id: 'pessoa', label: 'Pessoas' },
  { id: 'ia', label: 'IAs' },
  { id: 'maquina', label: 'Máquinas' },
];

export function CatalogPage() {
  const [tab, setTab] = useState<ResponsibleType>('pessoa');
  const items = useMemo(() => catalog.filter((c) => c.type === tab), [tab]);

  return (
    <div>
      <PageHeader
        title="Catálogo de responsáveis"
        subtitle="Somente itens do catálogo podem ser atribuídos — pessoa, IA ou máquina."
      />

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Panel
        title={tabs.find((t) => t.id === tab)?.label}
        actions={
          <button type="button" className="btn">
            Incluir
          </button>
        }
      >
        {items.length === 0 ? (
          <p className="muted">Nenhum item neste tipo — atribuição indisponível.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Em uso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <Badge tone="info">{item.type}</Badge>
                  </td>
                  <td>{item.inUse ? <Badge tone="warn">sim</Badge> : <Badge tone="ok">não</Badge>}</td>
                  <td>
                    <button type="button" className="btn ghost" disabled={item.inUse} title={item.inUse ? 'Reatribua antes' : ''}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
