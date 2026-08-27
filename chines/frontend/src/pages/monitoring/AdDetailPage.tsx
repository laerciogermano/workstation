import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { Badge, classificationBadge } from '../../components/ui/Badge';
import { getAd } from '../../data/mockData';

export function AdDetailPage() {
  const { id } = useParams();
  const ad = id ? getAd(id) : undefined;
  if (!ad) return <p>Anúncio não encontrado.</p>;

  return (
    <>
      <PageHeader
        title={ad.title}
        description={`${ad.marketplace} · ${ad.collectedAt}`}
        screenId="TELA-09"
        stories="US-06, US-07, US-08, US-09, US-11"
        breadcrumbs={[{ label: 'Anúncios', to: '/monitoramento/anuncios' }, { label: 'Detalhe' }]}
      />
      <div className="actions-row">
        <a href={ad.url} target="_blank" rel="noreferrer" className="btn btn-secondary">Abrir no marketplace</a>
        <button type="button" className="btn btn-secondary">Confirmar match</button>
        <button type="button" className="btn btn-danger">Rejeitar match</button>
        <Link to="/fiscalizacao/ocorrencias/o1" className="btn btn-primary">Ver ocorrência</Link>
      </div>
      <div className="two-col">
        <Panel title="Cabeçalho">
          <div className="detail-grid">
            <div className="detail-item"><label>Status</label><span>{ad.adStatus}</span></div>
            <div className="detail-item"><label>Modalidade</label><span>{ad.modality}</span></div>
            <div className="detail-item"><label>Coleta</label><span>{ad.collectedAt}</span></div>
          </div>
          <div className="chart-placeholder" style={{ height: 120, marginTop: '1rem' }}>Imagem do anúncio</div>
        </Panel>
        <Panel title="Vendedor">
          <div className="detail-grid">
            <div className="detail-item"><label>Vendedor</label><span>{ad.seller}</span></div>
            <div className="detail-item"><label>Empresa</label><span>{ad.company}</span></div>
            <div className="detail-item"><label>Parceiro</label><span>{ad.unregistered ? <Badge variant="warning">Canal paralelo</Badge> : ad.partner}</span></div>
          </div>
          {ad.unregistered && <Link to="/parceiros/novo" className="btn btn-sm btn-primary" style={{ marginTop: '0.75rem' }}>Cadastrar parceiro</Link>}
        </Panel>
      </div>
      <Panel title="Comparação PMA">
        <div className="detail-grid">
          <div className="detail-item"><label>Preço anunciado</label><span>R$ {ad.price}</span></div>
          <div className="detail-item"><label>PMA aplicado</label><span>R$ {ad.pmaApplied}</span></div>
          <div className="detail-item"><label>Regra canal</label><span>{ad.marketplace} {ad.modality} {ad.marketplace === 'Shopee' ? '(−8%)' : ''}</span></div>
          <div className="detail-item"><label>Parcelas</label><span>{ad.installments ?? '—'}x</span></div>
          <div className="detail-item"><label>Diferença</label><span>{ad.diffPct}%</span></div>
          <div className="detail-item"><label>Classificação</label><span><Badge variant={classificationBadge(ad.classification)}>{ad.classification}</Badge></span></div>
        </div>
      </Panel>
      <Panel title="Histórico do anúncio">
        <ul className="timeline">
          <li>2026-08-26 14:30 — R$ {ad.price} — {ad.classification}</li>
          <li>2026-08-26 08:00 — R$ {ad.price + 100} — regular</li>
        </ul>
      </Panel>
    </>
  );
}
