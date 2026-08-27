import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';

export function ReportsAlertsPage() {
  return (
    <>
      <PageHeader title="Relatórios, alertas e advertências" description="Envios automáticos." screenId="TELA-07" stories="US-12, US-13, US-21" />
      <Panel title="Relatório periódico (US-12)">
        <div className="form-grid">
          <div className="field"><label>Intervalo</label><select defaultValue="5h"><option value="5h">5 horas (padrão)</option><option>Diário</option></select></div>
          <div className="field"><label>Destinatários</label><input defaultValue="comercial@bluetti.com.br" /></div>
          <div className="field"><label>Formato</label><select><option>E-mail HTML + Excel</option><option>PDF</option></select></div>
          <div className="field"><label>Ativo</label><input type="checkbox" defaultChecked /></div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Enviar teste</button>
      </Panel>
      <Panel title="Alertas imediatos (US-13)">
        <div className="toggle-row"><span>E-mail</span><input type="checkbox" defaultChecked /></div>
        <div className="toggle-row"><span>WhatsApp</span><input type="checkbox" disabled /><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}> Em breve</span></div>
        <div className="toggle-row"><span>Telegram</span><input type="checkbox" disabled /></div>
        <div className="toggle-row"><span>Microsoft Teams</span><input type="checkbox" disabled /></div>
        <div className="toggle-row"><span>CRM</span><input type="checkbox" disabled /></div>
      </Panel>
      <Panel title="Advertência automática (US-21)">
        <div className="form-grid">
          <div className="field"><label>Prazo padrão (dias)</label><input type="number" defaultValue={3} /></div>
          <div className="field"><label>Remetente</label><input defaultValue="map@bluetti.com.br" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Template</label><textarea defaultValue="Prezado parceiro, identificamos anúncio abaixo do PMA…" /></div>
        </div>
        <div className="chart-placeholder" style={{ height: 80, marginTop: '0.75rem' }}>Preview advertência</div>
      </Panel>
      <button type="button" className="btn btn-primary">Salvar configurações</button>
    </>
  );
}
