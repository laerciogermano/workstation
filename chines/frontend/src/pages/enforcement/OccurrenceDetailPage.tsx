import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge, occurrenceStatusBadge } from '../../components/ui/Badge';
import { getOccurrence } from '../../data/mockData';

const steps = ['Identificada', 'Enviada', 'Aguardando correção', 'Corrigida', 'Reincidente'];

export function OccurrenceDetailPage() {
  const { id } = useParams();
  const occ = id ? getOccurrence(id) : undefined;
  if (!occ) return <p>Ocorrência não encontrada.</p>;

  return (
    <>
      <PageHeader
        title={occ.number}
        description={`${occ.product} · ${occ.marketplace}`}
        screenId="TELA-13"
        stories="US-10, US-17, US-20, US-21"
        breadcrumbs={[{ label: 'Ocorrências', to: '/fiscalizacao/ocorrencias' }, { label: occ.number }]}
      />
      <div className="stepper">
        {steps.map((s) => (
          <span key={s} className={`step ${occ.status === s ? 'active' : steps.indexOf(s) < steps.indexOf(occ.status) ? 'done' : ''}`}>{s}</span>
        ))}
      </div>
      {occ.overdue && <Badge variant="danger">Prazo vencido</Badge>}
      <Panel title="Resumo da violação">
        <div className="detail-grid">
          <div className="detail-item"><label>SKU</label><span>{occ.sku}</span></div>
          <div className="detail-item"><label>PMA</label><span>R$ {occ.pma}</span></div>
          <div className="detail-item"><label>Preço</label><span>R$ {occ.price}</span></div>
          <div className="detail-item"><label>Diferença</label><span>{occ.diffPct}%</span></div>
          <div className="detail-item"><label>Vendedor</label><span>{occ.seller}</span></div>
          <div className="detail-item"><label>Status</label><span><Badge variant={occurrenceStatusBadge(occ.status)}>{occ.status}</Badge></span></div>
        </div>
      </Panel>
      <Panel title="Cobrança">
        <div className="form-grid">
          <div className="field"><label>Responsável</label><input defaultValue={occ.responsible} /></div>
          <div className="field"><label>Prazo correção</label><input type="date" defaultValue={occ.deadline} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Observações</label><textarea /></div>
        </div>
      </Panel>
      <Panel title="Evidências">
        <div className="chart-placeholder" style={{ height: 100 }}>Screenshot — {occ.identifiedAt}</div>
        <ul className="timeline" style={{ marginTop: '1rem' }}>
          <li>{occ.identifiedAt} — R$ {occ.price} — URL capturada</li>
        </ul>
      </Panel>
      <Panel title="Advertência">
        <div className="chart-placeholder" style={{ height: 80 }}>Preview e-mail de advertência</div>
        <div className="actions-row" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="btn btn-primary">Enviar advertência</button>
          <button type="button" className="btn btn-secondary">Reenviar</button>
        </div>
      </Panel>
      <Panel title="Linha do tempo">
        <ul className="timeline">
          <li>{occ.identifiedAt} — Ocorrência identificada</li>
          <li>2026-08-26 15:00 — Status: {occ.status}</li>
        </ul>
      </Panel>
      <div className="actions-row">
        <button type="button" className="btn btn-primary">Marcar corrigida</button>
        <button type="button" className="btn btn-danger">Marcar reincidente</button>
        <Link to="/monitoramento/anuncios/a1" className="btn btn-secondary">Ver anúncio</Link>
        <Link to="/parceiros/p1" className="btn btn-secondary">Ver parceiro</Link>
      </div>
    </>
  );
}
