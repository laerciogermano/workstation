import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAction, useApp, useEv } from '../app-context';
import { brl, dayFull, firstName, time } from '../format';
import { Icon } from '../icons';
import { Area, Art, Empty, Field, Form, Load, Page, SectionHead } from '../ui';

interface LotItem { id: string; title: string; description: string; startingBid: number; status: 'open' | 'sold'; topBid: number | null; leading: boolean | null; leader: string | null; bidCount: number; won: boolean | null }
interface Data { auction: { title: string; status: 'scheduled' | 'open' | 'closed'; bidStep: number; scheduledAt: string | null; venueName: string | null } | null; lots: LotItem[] }
const STATUS = { scheduled: 'Agendado', open: 'Ao vivo', closed: 'Encerrado' };
const useAuction = () => useEv<Data>('/auction');

export function Auction() {
  const q = useAuction(), { ctx } = useApp(), navigate = useNavigate();
  const seller = ctx.me.roles.some((r) => r === 'auctioneer' || r === 'organizer');
  return (
    <Page title="Leilão" tab="/leilao">
      <Load q={q}>{({ auction: a, lots }) => <>
        {a ? <div className="auc-head"><Art v={2} /><span className={`status ${a.status === 'open' ? 'live' : ''}`}>{STATUS[a.status]}</span><h2>{a.title}</h2>
          <p>{a.status === 'open' ? 'Abra um lote e dê o seu lance.' : a.status === 'closed' ? 'O leilão terminou. Os lotes arrematados estão nos pedidos.' : `${a.scheduledAt ? `Começa ${dayFull(a.scheduledAt).toLowerCase()}, às ${time(a.scheduledAt)}${a.venueName ? `, em ${a.venueName}` : ''}. ` : ''}Os lances abrem quando o leiloeiro chamar.`}</p></div>
          : <Empty text="Nenhum leilão marcado para este evento." />}
        {seller && <div className="actions one"><button className="btn tint" onClick={() => navigate('/leiloeiro')}><Icon n="gavel" />Painel do leiloeiro</button></div>}
        {a && <section className="section"><SectionHead title="Lotes" side={<span className="num">{lots.length}</span>} />
          {lots.map((l) => <button key={l.id} className={`lot ${l.status === 'sold' ? 'sold' : ''}`} onClick={() => navigate(`/leilao/${l.id}`)}><h3>{l.title}</h3>
            <small>{l.status === 'sold' ? `Vendido${l.won ? ' para você' : ''}` : l.leader ? `Lidera: ${l.leading ? 'você' : firstName(l.leader)}` : 'Sem lances'}</small>
            <div className="price"><b className="num">{brl(l.topBid ?? l.startingBid)}</b><span>{l.status === 'sold' ? 'arrematado' : l.topBid ? 'maior lance' : 'lance inicial'}</span></div></button>)}</section>}
      </>}</Load>
    </Page>
  );
}

export function Lot() {
  const { id } = useParams(), { path } = useApp(), run = useAction();
  const q = useEv<LotItem & { history: { amount: number; name: string; mine: boolean; at: string }[]; auctionStatus: string; bidStep: number }>(`/auction/lots/${id}`);
  return (
    <Page title={q.data?.title ?? 'Lote'} sub={q.data?.description} back="/leilao">
      <Load q={q}>{(l) => {
        const value = l.topBid ?? l.startingBid, next = l.topBid ? l.topBid + l.bidStep : l.startingBid, live = l.auctionStatus === 'open' && l.status === 'open';
        return (<>
          <div className="bento"><div className="tile wide"><small>{l.status === 'sold' ? 'Arrematado por' : l.topBid ? 'Maior lance' : 'Lance inicial'}</small><span className="big cond num">{brl(value)}</span>
            <span className="sub">{l.leader ? `${l.leading ? 'Você' : l.leader} · ${l.bidCount} ${l.bidCount === 1 ? 'lance' : 'lances'}` : 'Nenhum lance ainda'}</span></div></div>
          <section className="section"><SectionHead title="Histórico de lances" />
            <div className="bids">{l.history.length ? l.history.map((h) => <div key={h.amount}><span>{h.mine ? 'Você' : h.name}</span><b className="num">{brl(h.amount)}</b></div>) : <div><span>Seja o primeiro a dar um lance.</span></div>}</div></section>
          <div className="cta-dock">{l.status === 'sold' ? <button className="btn soft" disabled>Lote vendido</button>
            : !live ? <button className="btn soft" disabled>{l.auctionStatus === 'closed' ? 'Leilão encerrado' : 'Lances abrem quando o leilão for chamado'}</button>
            : l.leading ? <button className="btn ok" disabled><Icon n="check" />Você lidera com {brl(value)}</button>
            : <button className="btn primary" onClick={() => confirm(`Confirmar lance de ${brl(next)}? O lance é uma oferta de compra.`) && run(() => api('POST', path(`/auction/lots/${l.id}/bids`), { amount: next }), `Lance de ${brl(next)} registrado.`)}>Dar lance de {brl(next)}</button>}</div>
        </>);
      }}</Load>
    </Page>
  );
}

export function Auctioneer() {
  const q = useAuction(), { path } = useApp(), run = useAction(), navigate = useNavigate();
  return (
    <Page title="Leiloeiro" back="/leilao" sub={q.data?.auction?.title}>
      <Load q={q}>{({ auction: a, lots }) => <>
        <div className="actions one" style={{ paddingTop: 0 }}>
          {a?.status === 'scheduled' && <button className="btn primary" onClick={() => confirm('Chamar o leilão agora? Todos os participantes são avisados.') && run(() => api('POST', path('/auction/call')), 'Leilão chamado. Os participantes foram avisados.')}><Icon n="megaphone" />Chamar leilão</button>}
          {a?.status === 'open' && <button className="btn soft" onClick={() => confirm('Encerrar o leilão e vender os lotes com lance?') && run(() => api('POST', path('/auction/close')), 'Leilão encerrado.')}><Icon n="flag" />Encerrar leilão</button>}
          {a?.status === 'closed' ? <button className="btn soft" disabled>Leilão encerrado</button> : <button className="btn tint" onClick={() => navigate('/leiloeiro/novo')}><Icon n="plus" />Novo lote</button>}
        </div>
        <section className="section"><SectionHead title="Lotes" side={<span className="num">{lots.length}</span>} />
          {lots.map((l) => <div key={l.id} className="panel-row"><div><b>{l.title}</b><small>{l.status === 'sold' ? `Vendido por ${brl(l.topBid!)}` : `${brl(l.topBid ?? l.startingBid)} · ${l.bidCount} lances`}</small></div>
            {l.status === 'open' ? <button className="btn soft" disabled={a?.status !== 'open' || !l.topBid} onClick={() => run(() => api('POST', path(`/auction/lots/${l.id}/close`)), 'Lote vendido.')}>Encerrar lote</button> : <span className="status">Vendido</span>}</div>)}</section>
      </>}</Load>
    </Page>
  );
}

export function NewLot() {
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  return (
    <Page title="Novo lote" back="/leiloeiro" sub="Item para o leilão">
      <Form submit="Adicionar ao leilão" onSubmit={async (d) => { await api('POST', path('/auction/lots'), d); await run(async () => {}, 'Lote adicionado ao leilão.'); navigate('/leiloeiro'); }}>
        <Field label="Título" name="title" placeholder="Ex.: Espada cerimonial" /><Area label="Descrição" name="description" placeholder="Origem, estado, o que acompanha" />
        <Field label="Lance inicial (R$)" name="startingBid" inputMode="numeric" defaultValue="500" />
      </Form>
    </Page>
  );
}
