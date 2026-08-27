import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { marketplaces } from '../../data/mockData';
import { useState } from 'react';

export function ChannelsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(marketplaces.map((m) => [m, m !== 'AliExpress']))
  );

  return (
    <>
      <PageHeader title="Canais de monitoramento" description="Marketplaces e sites próprios." screenId="TELA-05" stories="US-03" />
      <div className="indicators-row">
        <span>Canais ativos: <strong>{Object.values(enabled).filter(Boolean).length}</strong></span>
        {Object.values(enabled).every((v) => !v) && <span style={{ color: 'var(--danger)' }}>Nenhum canal habilitado</span>}
      </div>
      <Panel title="Marketplaces">
        {marketplaces.map((m) => (
          <div className="toggle-row" key={m}>
            <span>{m}</span>
            <input type="checkbox" checked={enabled[m] ?? false} onChange={(e) => setEnabled((s) => ({ ...s, [m]: e.target.checked }))} />
          </div>
        ))}
      </Panel>
      <Panel title="Sites próprios">
        <table className="data-table">
          <thead><tr><th>Nome</th><th>URL</th><th>Status</th><th>Parceiro</th><th></th></tr></thead>
          <tbody>
            <tr><td>Revendedor XYZ</td><td>https://loja.xyz.com.br</td><td>Ativo</td><td>—</td><td><button type="button" className="btn btn-sm btn-secondary">Editar</button></td></tr>
          </tbody>
        </table>
        <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>Adicionar site</button>
      </Panel>
      <button type="button" className="btn btn-primary">Salvar configuração</button>
    </>
  );
}
