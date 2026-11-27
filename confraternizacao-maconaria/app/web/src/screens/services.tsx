import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAction, useApp, useEv } from '../app-context';
import { ago, brl, date, fmt } from '../format';
import { Icon } from '../icons';
import { Area, Art, Avatar, Done, Empty, Field, Form, Item, Load, Page, SectionHead, hashOf } from '../ui';

export function Vouchers() {
  const q = useEv<{ id: string; title: string; place: string; validOn: string; status: string; qr: string | null }[]>('/vouchers');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Page title="Vouchers" back="/conta" sub="Alimentação durante o evento">
      <Load q={q}>{(list) => list.length ? <>{list.map((v) => <div key={v.id}>
        <Item title={v.title} sub={`${date(v.validOn)} · ${v.place}`} side={v.status === 'used' ? <Done>Usado</Done> : <button className="btn tint" onClick={() => setOpen(open === v.id ? null : v.id)}>{open === v.id ? 'Ocultar' : 'Mostrar código'}</button>} />
        {open === v.id && v.qr && <div className="form qrbox"><div className="qr img"><img src={v.qr} alt={`Código do voucher ${v.title}`} /></div></div>}</div>)}</> : <Empty text="Nenhum voucher para você neste evento." />}</Load>
    </Page>
  );
}

export function Parking() {
  const q = useEv<{ id: string; venueName: string; period: string; free: number; code: string | null }[]>('/parking'), { path } = useApp(), run = useAction();
  return (
    <Page title="Estacionamento" back="/conta" sub="Vagas reservadas aos participantes">
      <Load q={q}>{(list) => list.length ? <>{list.map((a) => <Item key={a.id} title={a.venueName} sub={<>{a.period} · {a.code ? `Sua vaga: ${a.code}` : <><span className="num">{a.free}</span> vagas livres</>}</>}
        side={a.code ? <button className="btn ok" onClick={() => run(() => api('DELETE', path(`/parking/${a.id}`)), 'Vaga liberada.')}>Liberar</button>
          : a.free > 0 ? <button className="btn primary" onClick={() => run(() => api('POST', path(`/parking/${a.id}`)), 'Vaga reservada.')}>Reservar</button> : <span className="status">Lotado</span>} />)}</> : <Empty text="Sem estacionamento cadastrado." />}</Load>
    </Page>
  );
}

/** cria o pedido e segue para o pagamento */
function useCheckout() {
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  return async (body: object) => { const o = await run(() => api<{ id: string }>('POST', path('/orders'), body)); if (o) navigate(`/pagamento/${o.id}`); };
}

export function Membership() {
  const q = useEv<{ membership: { status: string; validUntil: string } | null; payments: { id: string; title: string; amount: number; dueOn: string; paidAt: string | null }[] }>('/membership');
  const { ctx } = useApp(), checkout = useCheckout();
  return (
    <Page title="Minha assinatura" back="/conta" sub="Anuidade">
      <Load q={q}>{(d) => !d.membership ? <Empty text="Nenhuma anuidade registrada para você." /> : <>
        <div className="auc-head" style={{ marginBottom: 16 }}><Art v={0} /><span className="status">{d.membership.status === 'overdue' ? 'Em atraso' : 'Adimplente'}</span><h2 className="num">{brl(d.payments.reduce((a, p) => a + p.amount, 0))} por ano</h2><p>{ctx.me.lodge} · válida até {date(d.membership.validUntil)}</p></div>
        {d.payments.map((p) => <Item key={p.id} title={p.title} sub={<><span className="num">{brl(p.amount)}</span>{!p.paidAt && ` · vence em ${date(p.dueOn)}`}</>}
          side={p.paidAt ? <Done>Paga</Done> : <button className="btn primary" onClick={() => checkout({ source: 'membership', paymentId: p.id })}>Pagar</button>} />)}
      </>}</Load>
    </Page>
  );
}

export function CostShares() {
  const q = useEv<{ id: string; title: string; total: number; parts: number; amount: number; isPaid: boolean }[]>('/cost-shares'), checkout = useCheckout();
  return (
    <Page title="Meus rateios" back="/conta" sub="Custos divididos entre irmãos">
      <Load q={q}>{(list) => list.length ? <>{list.map((r) => <Item key={r.id} title={r.title} sub={`Total ${brl(r.total)} · dividido por ${r.parts} · sua parte ${brl(r.amount)}`}
        side={r.isPaid ? <Done>Pago</Done> : <button className="btn primary" onClick={() => checkout({ source: 'cost_share', costShareId: r.id })}>Pagar {brl(r.amount)}</button>} />)}</> : <Empty text="Você não participa de nenhum rateio." />}</Load>
    </Page>
  );
}

export function Network() {
  const [term, setTerm] = useState(''), [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(term), 250); return () => clearTimeout(t); }, [term]);
  const q = useEv<{ id: string; name: string; industry: string; city: string; owner: string; attendeeId: string; mine: boolean }[]>(`/network?q=${encodeURIComponent(query)}`);
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  return (
    <Page title="Rede de empresas" back="/conta" sub="Empresas de irmãos">
      <label className="search"><Icon n="search" /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Empresa, ramo ou cidade" aria-label="Buscar empresa" /></label>
      <Load q={q}>{(list) => list.length ? <div className="people">{list.map((x) => <div key={x.id} className="person"><Avatar name={x.name} /><div><b>{x.name}</b><small>{x.industry} · {x.city}</small><small>{x.owner}</small></div>
        {!x.mine && <button className="icon-btn" aria-label={`Falar com ${x.owner}`} onClick={async () => { const c = await run(() => api<{ id: string }>('POST', path('/chats/direct'), { attendeeId: x.attendeeId })); if (c) navigate(`/chat/${c.id}`); }}><Icon n="message-circle" /></button>}</div>)}</div> : <Empty text="Nada encontrado." />}</Load>
    </Page>
  );
}

export function Ranking() {
  const q = useEv<{ me: { position: number; points: number; checkins: number }; rows: { attendeeId: string; name: string; points: number; position: number; mine: boolean }[] }>('/ranking');
  return (
    <Page title="Meu ranking" back="/conta" sub="Pontos por participação">
      <Load q={q}>{(d) => <>
        <div className="figures"><div><b className="cond num">{d.me.position}º</b><span>Posição</span></div><div><b className="cond num">{fmt(d.me.points)}</b><span>Pontos</span></div><div><b className="cond num">{d.me.checkins}</b><span>Check-ins</span></div></div>
        <div className="group" style={{ marginTop: 16 }}>{d.rows.map((r) => <div key={r.attendeeId} className={`row2 ${r.mine ? 'me' : ''}`}><span className="num">{r.position}º</span><b style={{ flex: 1, textAlign: 'left' }}>{r.mine ? 'Você' : r.name}</b><b className="num">{r.points}</b></div>)}</div>
        <p className="hint-line">Inscrição vale 2 pontos e check-in vale 10.</p>
      </>}</Load>
    </Page>
  );
}

export function Support() {
  const q = useEv<{ id: string; number: number; subject: string; status: string; createdAt: string }[]>('/support'), { path } = useApp(), run = useAction();
  return (
    <Page title="Central de atendimento" back="/conta" sub="Fale com a organização">
      <Form submit="Enviar" onSubmit={async (d, form) => { await api('POST', path('/support'), { subject: d.subject, message: d.message }); form.reset(); await run(async () => {}, 'Chamado enviado.'); }}>
        <Field label="Assunto" name="subject" maxLength={120} /><Area label="Mensagem" name="message" maxLength={2000} />
      </Form>
      <section className="section"><SectionHead title="Seus chamados" />
        <Load q={q}>{(list) => list.length ? <>{list.map((c) => <Item key={c.id} title={c.subject} sub={`Chamado nº ${c.number} · ${ago(c.createdAt)}`} side={<span className="status">{c.status === 'open' ? 'Aberto' : 'Respondido'}</span>} />)}</> : <p className="hint-line">Nenhum chamado aberto.</p>}</Load></section>
    </Page>
  );
}

export function Products() {
  const q = useEv<{ id: string; name: string; description: string; icon: string; price: number; stock: number }[]>('/products'), checkout = useCheckout();
  return (
    <Page title="Produtos" back="/" sub="Itens comemorativos">
      <Load q={q}>{(list) => list.length ? <div className="shop">{list.map((p, i) => <div key={p.id} className="prod"><Art v={i} icon={p.icon} className={`tone-${i % 3}`} /><h3>{p.name}</h3><small>{p.description}{p.stock === 0 && ' · Esgotado'}</small>
        <div className="foot2"><b className="cond num">{brl(p.price)}</b><button className="icon-btn" disabled={p.stock === 0} onClick={() => checkout({ source: 'shop', productId: p.id, quantity: 1 })} aria-label={`Comprar ${p.name}`}><Icon n="plus" /></button></div></div>)}</div> : <Empty text="Nenhum produto à venda." />}</Load>
    </Page>
  );
}

interface Piece_ { id: string; category: string; title: string; year: number; location: string; temperature: number | null; humidity: number | null; conservation: string; security: string; icon: string }
export function Museum() {
  const q = useEv<Piece_[]>('/museum'), navigate = useNavigate(), [category, setCategory] = useState('Todos');
  return (
    <Page title="Museu e acervo" back="/" sub="Patrimônio da potência">
      <Load q={q}>{(all) => <>
        <div className="chips">{['Todos', ...new Set(all.map((a) => a.category))].map((c) => <button key={c} aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</button>)}</div>
        {all.filter((a) => category === 'Todos' || a.category === category).map((a) => <div key={a.id} className="card one"><button className="open" onClick={() => navigate(`/museu/${a.id}`)}><Art v={hashOf(a.title)} icon={a.icon} className={`thumbart tone-${hashOf(a.title) % 3}`} />
          <span><h3>{a.title}</h3><small>{a.category} · {a.year} · {a.location}</small><span className={`level ${a.conservation === 'ok' ? 'ok' : 'alto'}`}>{a.conservation === 'ok' ? 'Em ordem' : 'Atenção'}</span></span></button></div>)}
        {all.length === 0 && <Empty text="Acervo vazio neste evento." />}
      </>}</Load>
    </Page>
  );
}
export function Piece() {
  const { id } = useParams(), q = useEv<Piece_>(`/museum/${id}`);
  return (
    <Page title={q.data?.title ?? 'Peça'} back="/museu" sub={q.data && `${q.data.category} · ${q.data.year}`}>
      <Load q={q}>{(a) => <div className="bento">
        <div className="tile"><small>Temperatura</small><span className="big cond num">{a.temperature === null ? '—' : `${a.temperature} °C`}</span></div><div className="tile"><small>Umidade</small><span className="big cond num">{a.humidity === null ? '—' : `${a.humidity}%`}</span></div>
        <div className="tile wide"><small>Situação</small><b>{a.conservation === 'ok' ? 'Dentro da faixa de conservação' : 'Fora da faixa: avisar o responsável'}</b></div><div className="tile wide"><small>Onde está</small><b>{a.location}</b></div><div className="tile wide"><small>Segurança</small><b>{a.security}</b></div>
      </div>}</Load>
    </Page>
  );
}
