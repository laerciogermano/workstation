import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Order, type Session } from '../api';
import { useAction, useApp, useEv, useToast } from '../app-context';
import { ago, brl, dayFull, dayKey, dayNumber, daysUntil, firstName, fmt, greeting, month, time, weekLong, weekShort } from '../format';
import { Icon } from '../icons';
import { Art, Avatar, Back, CityDrawing, Done, Empty, Form, Item, KIND_ICON, Load, Loading, MeButton, Page, Pass, Pattern, SectionHead, Select, SessionArt, Slot, TabBar, hashOf, project, useScrollState } from '../ui';
import { SHORTCUTS } from './account';

export const useSessions = () => useEv<Session[]>('/sessions');
const days = (list: Session[]) => [...new Map(list.map((s) => [dayKey(s.startsAt), s.startsAt])).entries()];

/** pinos do dia; os que se sobrepõem descem */
function Pins({ list }: { list: Session[] }) {
  const navigate = useNavigate();
  const placed: { x: number; y: number }[] = [];
  const unique = [...new Map(list.map((s) => [s.venueId, s])).values()].map((s) => {
    const p = project(s.lat, s.lng);
    return { s, x: Math.min(74, Math.max(26, p.x * 100)), y: 150 + p.y * 100 };
  }).sort((a, b) => a.y - b.y);
  return <>{unique.map(({ s, x, y }) => {
    while (placed.some((o) => Math.abs(o.x - x) < 34 && Math.abs(o.y - y) < 36)) y += 36;
    placed.push({ x, y });
    const label = s.venueName.length > 16 ? `${s.venueName.slice(0, 15)}…` : s.venueName;
    return <button key={s.id} className={`pin ${s.registered ? 'mine' : ''}`} style={{ left: `${x}%`, top: Math.min(y, 288) }} onClick={() => navigate(`/evento/${s.id}`)} aria-label={`${s.title}, ${time(s.startsAt)}, ${s.venueName}`}>
      <span className="tag"><b className="num">{time(s.startsAt)}</b>{label}</span><span className="tail" /></button>;
  })}</>;
}

export function Home() {
  const { me, ctx, openSheet } = useApp(), navigate = useNavigate(), run = useAction(), { path } = useApp();
  const onScroll = useScrollState(), q = useSessions();
  const list = q.data ?? [];
  const allDays = days(list);
  const [picked, setPicked] = useState(() => sessionStorage.getItem('dia'));
  const day = allDays.some(([k]) => k === picked) ? picked! : allDays[0]?.[0];
  const today = list.filter((s) => dayKey(s.startsAt) === day);
  const next = list.find((s) => s.registered && new Date(s.endsAt) > new Date());
  const shortcuts = me.shortcuts.map((id) => SHORTCUTS.find((x) => x.id === id)).filter((x) => x && ctx.modules[x.module]) as typeof SHORTCUTS;
  const mine = ctx.modules.tickets ? today.filter((s) => s.registered) : [];
  const fee = ctx.membership === 'overdue' ? 'Anuidade em atraso' : 'Adimplente';
  const pick = (k: string) => { sessionStorage.setItem('dia', k); setPicked(k); };
  return (<>
    <main className="view has-bar" onScroll={onScroll}>
      <div className="mapwrap">
        <svg className="city" viewBox="0 0 360 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><CityDrawing /></svg>
        <Pins list={today} />
        <div className="over"><button className="glass-btn" onClick={() => openSheet({ kind: 'menu' })} aria-label="Abrir menu"><Icon n="menu" /></button>
          <div className="overgroup"><button className="glass-btn bell" onClick={() => navigate('/notificacoes')} aria-label="Notificações"><Icon n="bell" />{ctx.counts.notifications > 0 && <i className="on" />}</button><MeButton /></div></div>
      </div>
      <div className="sheet-body"><div className="handle" />
        <div className="greet"><small>{greeting()},</small><h1>Ir. {firstName(me.name)}</h1><p>{ctx.event.slug === '125-anos' ? 'Seja bem-vindo às comemorações dos 125 anos.' : ctx.event.name}</p></div>
        <div className="glance">
          <div className="art count"><Pattern v={0} /><b className="cond num">{daysUntil(ctx.event.startsOn)}</b><span>{ctx.event.startsOn ? 'dias para a abertura' : 'data a definir'}</span></div>
          <div className="facts">
            {ctx.modules.membership && ctx.membership ? <button onClick={() => navigate('/assinatura')}><Icon n="circle-check" />{fee}</button> : <span><Icon n="map-pin" />{ctx.event.city || 'Cidade a definir'}</span>}
            <span><Icon n="award" />{ctx.me.obedience.split(' · ')[0] || 'Convidado'}</span>
            <span className="num"><Icon n="square-check" />{ctx.counts.checkins}/{ctx.counts.registrations} check-ins</span>
          </div>
        </div>
        {next && <section className="section"><SectionHead title="Próximo na sua agenda" /><Pass s={next} /></section>}
        {shortcuts.length > 0 && <section className="section"><SectionHead title="Acesso rápido" side={<button className="textlink bare" onClick={() => navigate('/atalhos')}>Editar</button>} />
          <div className="quick">{shortcuts.map((x) => <button key={x.id} onClick={() => navigate(x.to)}><span className="ic"><Icon n={x.icon} /></span>{x.name}</button>)}</div></section>}
        <Load q={q}>{() => list.length === 0 ? <Empty text="A programação deste evento ainda não foi cadastrada.">{ctx.me.roles.includes('organizer') && <button className="btn primary fit" onClick={() => navigate('/organizacao')}>Cadastrar programação</button>}</Empty> : <>
          <section className="section"><SectionHead title="Programação" side={<button className="textlink bare" onClick={() => navigate('/agenda')}>Todos os eventos <Icon n="arrow-right" /></button>} />
            <div className="dates" role="group" aria-label="Dias da programação">{allDays.map(([k, iso]) => {
              const n = list.filter((s) => dayKey(s.startsAt) === k).length;
              return <button key={k} className="date" aria-pressed={k === day} aria-label={`${dayFull(iso)}, ${n} eventos`} onClick={() => pick(k)}><span className="wd">{weekShort(iso)}</span><span className="dn cond num">{dayNumber(iso)}</span><span className="n">{Array.from({ length: Math.min(n, 4) }, (_, i) => <i key={i} />)}</span></button>;
            })}</div></section>
          {mine.length > 0 && <section className="section"><SectionHead title="Faça o check-in" />{mine.map((s) => <Item key={s.id} title={s.title} sub={`${time(s.startsAt)} · ${s.venueName}`}
            side={s.checkedIn ? <Done>Presente</Done> : <button className="btn primary" onClick={() => run(() => api('POST', path(`/sessions/${s.id}/check-in`)), 'Check-in registrado.')}>Check-in</button>} />)}</section>}
          {today[0] && <section className="section"><SectionHead title={weekLong(today[0].startsAt)} side={<span className="num">{today.length} {today.length === 1 ? 'evento' : 'eventos'}</span>} />
            <div className="stack">{today.map((s) => <Slot key={s.id} s={s} />)}</div></section>}
        </>}</Load>
      </div>
    </main>
    <TabBar current="/" />
  </>);
}

export function Notifications() {
  const q = useEv<{ id: string; title: string; body: string; target: string; isRead: boolean; createdAt: string }[]>('/notifications');
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  // marca como lidas ao sair da tela, para o destaque continuar visível enquanto se lê
  const leave = useRef(() => {});
  leave.current = () => { if (q.data?.some((n) => !n.isRead)) run(() => api('POST', path('/notifications/read'))); };
  useEffect(() => () => leave.current(), []);
  const icon = (t: string) => (t.startsWith('/leilao') || t === '/pedidos' ? 'gavel' : t.startsWith('/chat') ? 'message-circle' : 'calendar-check');
  return (
    <Page title="Notificações" back="/">
      <Load q={q}>{(list) => list.length ? <>{list.map((n) => <button key={n.id} className={`lot note ${n.isRead ? '' : 'new'}`} onClick={() => navigate(n.target)}>
        <Art v={hashOf(n.id)} icon={icon(n.target)} className="tone-1" /><h3>{n.title}</h3><small>{n.body}</small><time className="num">{ago(n.createdAt)}</time></button>)}</> : <Empty text="Nenhum aviso ainda." />}</Load>
    </Page>
  );
}

export function Agenda() {
  const q = useSessions(), navigate = useNavigate(), { openSheet } = useApp();
  return (
    <Page title="Eventos" sub={q.data && <><span className="num">{q.data.length}</span> na programação</>} back="/" tab="/">
      <Load q={q}>{(list) => <>{days(list).map(([k, iso]) => <div key={k}><div className="day-label">{dayFull(iso)}</div>
        {list.filter((s) => dayKey(s.startsAt) === k).map((s) => <div className="card" key={s.id}>
          <button className="open" onClick={() => navigate(`/evento/${s.id}`)}><SessionArt s={s} className="thumbart" />
            <span><h3>{s.title}</h3><small className="num">{time(s.startsAt)} · {fmt(s.confirmed)}/{fmt(s.capacity)} confirmados</small><span className="meter" style={{ display: 'block' }}><i style={{ width: `${Math.min(100, (s.confirmed / s.capacity) * 100)}%` }} /></span></span></button>
          <button className="more" onClick={() => openSheet({ kind: 'actions', sessionId: s.id })} aria-label={`Ações de ${s.title}`}><Icon n="ellipsis" /></button></div>)}</div>)}</>}</Load>
    </Page>
  );
}

export interface Participant { id: string; name: string; lodge: string; obedience: string; city: string; photo: string | null; me: boolean }
export function PersonRow({ p }: { p: Participant }) {
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  return (
    <div className="person"><Avatar name={p.name} photo={p.photo} /><div><b>{p.name}{p.me && ' (você)'}</b>{p.lodge && <small>{p.lodge}</small>}<small>{[p.obedience.split(' · ')[0], p.city].filter(Boolean).join(' · ')}</small></div>
      {!p.me && <button className="icon-btn" aria-label={`Enviar mensagem para ${p.name}`} onClick={async () => { const c = await run(() => api<{ id: string }>('POST', path('/chats/direct'), { attendeeId: p.id })); if (c) navigate(`/chat/${c.id}`); }}><Icon n="message-circle" /></button>}</div>
  );
}

export function EventDetail() {
  const { id } = useParams(), q = useSessions(), navigate = useNavigate();
  const { path, openSheet } = useApp(), run = useAction(), onScroll = useScrollState();
  const people = useEv<Participant[]>(`/sessions/${id}/participants`, !!q.data?.some((s) => s.id === id));
  const s = q.data?.find((x) => x.id === id);
  if (!s) return <Page title="Evento" back="/">{q.data ? <Empty text="Evento não encontrado." /> : <Loading />}</Page>;
  const full = s.confirmed >= s.capacity && !s.registered, point = project(s.lat, s.lng), px = point.x * 360, py = point.y * 330;
  const others = (people.data ?? []).filter((p) => !p.me);
  return (
    <main className="view" onScroll={onScroll}>
      <header className="ev-cover"><Art v={hashOf(s.id)} icon={KIND_ICON[s.kind] ?? 'calendar-days'} />
        <div className="top"><Back to="/" /><span className="kind">{s.kind}</span><span style={{ width: 44 }} /></div>
        <div className="ttl"><h1>{s.title}</h1><span className="where"><Icon n="map-pin" />{s.venueName}</span></div></header>
      <div className="ev-body">
        <div className="bento">
          <div className="tile"><small>{weekLong(s.startsAt)}</small><span className="big cond num">{dayNumber(s.startsAt)} {month(s.startsAt).toLowerCase()}</span><span className="sub">{dayKey(s.startsAt).slice(0, 4)}</span></div>
          <div className="tile"><small>Horário</small><span className="big cond num">{time(s.startsAt)}</span><span className="sub num">até {time(s.endsAt)}</span></div>
          <a className="tile wide place plainlink" href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}`} target="_blank" rel="noreferrer"><div><small>Local</small><b>{s.venueName}</b><span className="sub">{s.venueAddress}</span></div>
            <div className="minimap"><svg viewBox={`${px - 40} ${py - 36} 80 72`} width="80" height="72" aria-hidden="true"><CityDrawing /><circle cx={px} cy={py} r="6" fill="var(--brand)" stroke="#fff" strokeWidth="2" /></svg></div></a>
          <div className="tile wide"><small>Confirmados</small><span className="big cond num">{fmt(s.confirmed)} <em>de {fmt(s.capacity)}</em></span>
            <div className="meter"><i style={{ width: `${Math.min(100, (s.confirmed / s.capacity) * 100)}%` }} /></div>
            {others.length > 2 && <div className="faces">{others.slice(0, 5).map((p) => <Avatar key={p.id} name={p.name} photo={p.photo} />)}<span className="txt">{firstName(others[0].name)}, {firstName(others[1].name)} e outros irmãos</span></div>}</div>
        </div>
        {s.description && <section className="section"><SectionHead title="Sobre" /><p className="prose">{s.description}</p></section>}
        <section className="section"><SectionHead title="Participantes" side={<span className="num">{fmt(s.confirmed)}</span>} />
          {others.length ? <><div className="people">{others.slice(0, 4).map((p) => <PersonRow key={p.id} p={p} />)}</div><button className="textlink" onClick={() => navigate(`/evento/${s.id}/participantes`)}>Ver todos os participantes <Icon n="arrow-right" /></button></> : <p className="hint-line">Ninguém inscrito ainda.</p>}</section>
      </div>
      <div className="cta-dock">
        {s.registered ? <><button className="btn ok" onClick={() => confirm('Cancelar a sua inscrição neste evento?') && run(() => api('DELETE', path(`/sessions/${s.id}/registration`)), 'Inscrição cancelada.')}><Icon n="check" />Inscrito</button>
          {s.chatId && <button className="btn tint" onClick={() => navigate(`/chat/${s.chatId}`)}><Icon n="message-circle" />Grupo</button>}</>
          : full ? <button className="btn soft" disabled>Vagas esgotadas</button>
          : <button className="btn primary" onClick={() => run(() => api('POST', path(`/sessions/${s.id}/registration`)), 'Inscrição confirmada. O grupo já está no Chat.')}>Inscrever-se</button>}
        <button className="btn soft icon" onClick={() => openSheet({ kind: 'actions', sessionId: s.id })} aria-label="Ações do evento"><Icon n="ellipsis" /></button>
      </div>
    </main>
  );
}

export function Participants() {
  const { id } = useParams(), [term, setTerm] = useState(''), [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(term), 250); return () => clearTimeout(t); }, [term]);
  const s = useSessions().data?.find((x) => x.id === id);
  const q = useEv<Participant[]>(`/sessions/${id}/participants?q=${encodeURIComponent(query)}`);
  return (
    <Page title="Participantes" back={`/evento/${id}`} sub={s && <>{s.title} · <span className="num">{fmt(s.confirmed)}</span> confirmados</>}>
      <label className="search"><Icon n="search" /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome, loja, potência ou cidade" aria-label="Buscar participante" /></label>
      <Load q={q}>{(list) => list.length ? <div className="people">{list.map((p) => <PersonRow key={p.id} p={p} />)}</div> : <Empty text={query ? `Ninguém encontrado com “${query}”.` : 'Ninguém inscrito ainda.'} />}</Load>
    </Page>
  );
}

export function Registrations() {
  const q = useSessions(), navigate = useNavigate();
  const mine = (q.data ?? []).filter((s) => s.registered);
  return (
    <Page title="Inscrições" tab="/inscricoes" sub={q.data && <><span className="num">{mine.length}</span> {mine.length === 1 ? 'evento' : 'eventos'} na sua agenda</>}>
      <Load q={q}>{() => mine.length ? <>{days(mine).map(([k, iso]) => <div key={k}><div className="day-label">{dayFull(iso)}</div><div className="passes">{mine.filter((s) => dayKey(s.startsAt) === k).map((s) => <Pass key={s.id} s={s} soft={s !== mine[0]} />)}</div></div>)}</>
        : <Empty text="Você ainda não se inscreveu em nenhum evento."><button className="btn primary fit" onClick={() => navigate('/')}>Ver programação</button></Empty>}</Load>
    </Page>
  );
}

interface TicketType { id: string; name: string; price: number; sessionId: string; title: string; startsAt: string }
export function Buy() {
  const { id } = useParams(), q = useEv<TicketType[]>('/ticket-types'), navigate = useNavigate(), { path } = useApp();
  const [quantity, setQuantity] = useState(1);
  const session = useSessions().data?.find((s) => s.id === id);
  return (
    <Load q={q}>{(types) => {
      const t = types.find((x) => x.sessionId === id);
      if (!t) return (
        <Page title="Comprar ingresso" back={id ? `/evento/${id}` : '/'} sub={id ? 'Este evento é gratuito: a inscrição já gera o seu ingresso.' : 'Eventos com ingresso pago'}>
          {types.map((x) => <button key={x.id} className="lot" onClick={() => navigate(`/comprar/${x.sessionId}`)}><h3>{x.title}</h3><small>{dayFull(x.startsAt)} · <span className="num">{time(x.startsAt)}</span></small><div className="price"><b className="num">{brl(x.price)}</b><span>por pessoa</span></div></button>)}
        </Page>);
      return (
        <Page title="Comprar ingresso" back={`/evento/${id}`} sub={`${t.title} · ${dayFull(t.startsAt)}`}>
          <Form submit="Continuar para o pagamento" onSubmit={async (d) => {
            const o = await api<{ id: string }>('POST', path('/orders'), { source: 'ticket', ticketTypeId: t.id, quantity, holder: d.holder });
            navigate(`/pagamento/${o.id}`);
          }}>
            <Select label="Para quem" name="holder"><option value="brother">Irmão</option><option value="guest">Acompanhante</option></Select>
            <Select label="Quantidade" name="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</Select>
            <div className="keybox amount"><small>Total</small><b className="num">{brl(t.price * quantity)}</b></div>
            {session && !session.registered && <p className="hint-line">O pagamento confirma também a sua inscrição.</p>}
          </Form>
        </Page>);
    }}</Load>
  );
}

export function Payment() {
  const { id } = useParams(), q = useEv<Order>(`/orders/${id}`), { path, ctx } = useApp(), run = useAction(), navigate = useNavigate(), toast = useToast();
  return (
    <Page title="Pagamento" back={ctx.modules.orders ? '/pedidos' : '/'} sub={q.data?.items?.[0]?.description}>
      <Load q={q}>{(o) => o.status === 'paid' ? <Empty text="Este pedido já está pago."><button className="btn primary fit" onClick={() => navigate('/pedidos')}>Ver pedidos</button></Empty> : <div className="form">
        <div className="keybox amount"><small>Valor</small><b className="num">{brl(o.total)}</b></div>
        <div className="keybox"><small>Pix</small><b>Meio de pagamento ainda não contratado</b></div>
        <p className="hint-line center">No modo desenvolvimento dá para simular a confirmação.</p>
        <button className="btn primary" onClick={async () => {
          const ok = await run(() => api('POST', path(`/orders/${o.id}/simulate-payment`)));
          if (ok) { toast('Pagamento simulado com sucesso.'); navigate(ctx.modules.orders ? '/pedidos' : '/'); }
        }}>Simular pagamento</button>
      </div>}</Load>
    </Page>
  );
}