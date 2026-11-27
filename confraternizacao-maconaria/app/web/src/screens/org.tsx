import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAction, useApp, useEv } from '../app-context';
import { dateRange, fmt } from '../format';
import { Icon } from '../icons';
import { Area, Done, Empty, Field, Form, Group, Item, Load, Page, SectionHead, Select, SvcRow, Switch } from '../ui';

interface Venue { id: string; name: string; address: string; capacity: number }
export function Organization() {
  const summary = useEv<{ sessions: number; venues: number; registrations: number; status: string }>('/summary'), venues = useEv<Venue[]>('/venues');
  const { ctx, eventId } = useApp(), navigate = useNavigate(), run = useAction();
  return (
    <Page title="Organização" back="/" sub={ctx.event.name}>
      <Load q={summary}>{(s) => <>
        <div className="figures"><div><b className="cond num">{s.sessions}</b><span>Eventos</span></div><div><b className="cond num">{s.venues}</b><span>Locais</span></div><div><b className="cond num">{fmt(s.registrations)}</b><span>Inscrições</span></div></div>
        {s.status === 'draft' && <div className="actions one"><button className="btn primary" onClick={() => run(() => api('PATCH', `/events/${eventId}/publish`), 'Programação publicada.')}>Publicar para os irmãos</button></div>}
      </>}</Load>
      <div className="actions"><button className="btn primary" onClick={() => navigate('/organizacao/evento')}><Icon n="plus" />Evento</button><button className="btn soft" onClick={() => navigate('/organizacao/local')}><Icon n="plus" />Local</button></div>
      <Group label="Gestão"><SvcRow to="/modulos" icon="puzzle" label="Módulos do evento" /><SvcRow to="/papeis" icon="users-round" label="Papéis e acessos" />
        {ctx.modules.rooms && <SvcRow to="/salas" icon="building-2" label="Gestão de salas" />}{ctx.modules.risks && <SvcRow to="/riscos" icon="triangle-alert" label="Gestão de riscos" />}<SvcRow to="/eventos-gob" icon="repeat" label="Eventos do GOB" /></Group>
      <section className="section"><SectionHead title="Locais cadastrados" side={<span className="num">{venues.data?.length}</span>} />
        <Load q={venues}>{(list) => list.length ? <div className="group">{list.map((p) => <div key={p.id} className="placerow"><div><b>{p.name}</b><small>{p.address}</small></div><div className="cap"><b className="num">{fmt(p.capacity)}</b><br /><span>lugares</span></div></div>)}</div> : <p className="hint-line">Nenhum local. Cadastre o primeiro.</p>}</Load></section>
    </Page>
  );
}

export function NewVenue() {
  const { path } = useApp(), navigate = useNavigate(), run = useAction();
  return (
    <Page title="Novo local" back="/organizacao">
      <Form submit="Cadastrar local" onSubmit={async (d) => {
        await api('POST', path('/venues'), { name: d.name, address: [d.address, d.district].filter(Boolean).join(', '), capacity: d.capacity || 0 });
        await run(async () => {}, 'Local cadastrado.'); navigate('/organizacao');
      }}>
        <Field label="Nome do local" name="name" placeholder="Ex.: Memorial de Curitiba" /><Field label="Endereço" name="address" placeholder="Rua e número" />
        <div className="grid2"><Field label="Bairro" name="district" /><Field label="Capacidade" name="capacity" inputMode="numeric" placeholder="Pessoas" /></div>
      </Form>
    </Page>
  );
}

export function NewSession() {
  const { path, ctx } = useApp(), navigate = useNavigate(), run = useAction(), venues = useEv<Venue[]>('/venues');
  return (
    <Page title="Novo evento" back="/organizacao" sub="Item da programação">
      <Load q={venues}>{(list) => !list.length ? <Empty text="Cadastre um local antes."><button className="btn primary fit" onClick={() => navigate('/organizacao/local')}>Cadastrar local</button></Empty> :
        <Form submit="Publicar na programação" onSubmit={async (d) => {
          const s = await api<{ id: string }>('POST', path('/sessions'), d); await run(async () => {}, 'Evento publicado na programação.'); navigate(`/evento/${s.id}`);
        }}>
          <Field label="Título" name="title" placeholder="Ex.: Almoço das delegações" />
          <div className="grid2"><Field label="Dia" name="date" type="date" defaultValue={ctx.event.startsOn ?? ''} /><Field label="Horário" name="time" type="time" defaultValue="12:30" /></div>
          <Select label="Local" name="venueId">{list.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
          <Field label="Vagas" name="capacity" inputMode="numeric" defaultValue="200" />
          <Area label="Descrição" name="description" placeholder="O que acontece, traje, transporte" />
        </Form>}</Load>
    </Page>
  );
}

interface Module { key: string; name: string; description: string; enabled: boolean; roles: string[] }
export function Modules() {
  const q = useEv<Module[]>('/modules'), { path } = useApp(), run = useAction();
  return (
    <Page title="Módulos do evento" back="/organizacao" sub="Ligue só o que este evento usa">
      <Load q={q}>{(list) => <div className="group svcs">{list.map((m) => <Switch key={m.key} title={m.name} desc={m.description} checked={m.enabled}
        onChange={() => run(() => api('PUT', path(`/modules/${m.key}`), { enabled: !m.enabled }), m.enabled ? 'Módulo desligado.' : 'Módulo ligado.')} />)}</div>}</Load>
    </Page>
  );
}

const ROLES = [['attendee', 'Irmãos'], ['family', 'Familiares'], ['auctioneer', 'Leiloeiro'], ['organizer', 'Organização']];
export function Roles() {
  const q = useEv<Module[]>('/modules'), { path } = useApp(), run = useAction();
  return (
    <Page title="Papéis e acessos" back="/organizacao" sub="Quem vê cada módulo. A organização vê tudo o que estiver ligado.">
      <Load q={q}>{(list) => <div className="group svcs">{list.filter((m) => m.enabled).map((m) => <div key={m.key} className="swrow"><b>{m.name}</b><div className="chips wrapchips">
        {ROLES.slice(0, 3).map(([r, label]) => { const on = m.roles.includes(r); return <button key={r} aria-pressed={on} onClick={() => run(() => api('PUT', path(`/modules/${m.key}`), { roles: on ? m.roles.filter((x) => x !== r) : [...m.roles, r] }))}>{on && <Icon n="check" />}{label}</button>; })}
      </div></div>)}</div>}</Load>
    </Page>
  );
}

export function Rooms() {
  const q = useEv<{ id: string; name: string; capacity: number; venueName: string; reservedNote: string | null; sessionTitle: string | null }[]>('/rooms'), { path, ctx } = useApp(), run = useAction();
  const organizer = ctx.me.roles.includes('organizer');
  return (
    <Page title="Gestão de salas" back="/" sub="Salas dos locais">
      <Load q={q}>{(list) => list.length ? <>{list.map((r) => <Item key={r.id} title={r.name} sub={<>{r.venueName} · <span className="num">{r.capacity}</span> lugares · {r.sessionTitle ?? r.reservedNote ?? 'Livre'}</>}
        side={organizer ? <button className={`btn ${r.reservedNote ? 'tint' : 'primary'}`} onClick={() => run(() => api('PUT', path(`/rooms/${r.id}`), { reserved: !r.reservedNote }), r.reservedNote ? 'Sala liberada.' : 'Sala reservada.')}>{r.reservedNote ? 'Liberar' : 'Reservar'}</button> : undefined} />)}</> : <Empty text="Nenhuma sala cadastrada." />}</Load>
    </Page>
  );
}

const LEVEL: Record<string, string> = { high: 'Alto', medium: 'Médio', low: 'Baixo' };
export function Risks() {
  const q = useEv<{ id: string; title: string; level: string; plan: string; status: string; owner: string | null }[]>('/risks'), { path, ctx } = useApp(), run = useAction(), navigate = useNavigate();
  const organizer = ctx.me.roles.includes('organizer');
  return (
    <Page title="Gestão de riscos" back="/" sub={q.data && <><span className="num">{q.data.filter((r) => r.status === 'open').length}</span> em aberto</>}>
      {organizer && <div className="form" style={{ paddingBottom: 16 }}><button className="btn primary" onClick={() => navigate('/riscos/novo')}><Icon n="plus" />Novo risco</button></div>}
      <Load q={q}>{(list) => list.length ? <>{list.map((r) => <Item key={r.id} title={r.title} side={r.status === 'resolved' ? <Done>Resolvido</Done> : <span className={`level ${r.level === 'high' ? 'alto' : ''}`}>{LEVEL[r.level]}</span>}
        sub={<>{[r.owner, r.plan].filter(Boolean).join(' · ')}{organizer && r.status === 'open' && <><br /><button className="textlink" onClick={() => run(() => api('POST', path(`/risks/${r.id}/resolve`)), 'Risco resolvido.')}>Marcar como resolvido</button></>}</>} />)}</> : <Empty text="Nenhum risco registrado." />}</Load>
    </Page>
  );
}
export function NewRisk() {
  const { path } = useApp(), navigate = useNavigate(), run = useAction(), people = useEv<{ id: string; name: string }[]>('/attendees');
  return (
    <Page title="Novo risco" back="/riscos">
      <Load q={people}>{(list) => <Form submit="Registrar risco" onSubmit={async (d) => { await api('POST', path('/risks'), d); await run(async () => {}, 'Risco registrado.'); navigate('/riscos'); }}>
        <Field label="Risco" name="title" />
        <div className="grid2"><Select label="Nível" name="level" defaultValue="medium">{Object.entries(LEVEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
          <Select label="Responsável" name="ownerId">{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
        <Area label="Plano de resposta" name="plan" />
      </Form>}</Load>
    </Page>
  );
}

export function GobEvents() {
  const { events, eventId, switchEvent, ctx } = useApp(), navigate = useNavigate(), run = useAction();
  const organizer = events.some((e) => e.organizer);
  const [name, setName] = useState('');
  async function open(id: string, joined: boolean) {
    if (!joined && !(await run(() => api('POST', `/events/${id}/join`)))) return;
    switchEvent(id); navigate('/');
  }
  return (
    <Page title="Eventos do GOB" back="/" sub={`Aberto agora: ${ctx.event.name}`}>
      {events.map((e) => <Item key={e.id} title={e.name} sub={`${[e.city, dateRange(e.startsOn, e.endsOn)].filter(Boolean).join(' · ')}${e.status === 'draft' ? ' · Rascunho' : ''}`}
        side={e.id === eventId ? <Done>Atual</Done> : <button className="btn tint" onClick={() => open(e.id, e.joined)}>Abrir</button>} />)}
      {organizer && <><div className="section-head" style={{ marginTop: 20 }}><h2>Criar evento</h2></div>
        <Form submit="Criar evento do GOB" onSubmit={async (d, form) => { await api('POST', '/events', { name: d.name, city: d.city }); form.reset(); setName(''); await run(async () => {}, 'Evento criado como rascunho.'); }}>
          <Field label="Nome" name="name" value={name} onChange={(e) => setName(e.target.value)} /><Field label="Cidade" name="city" />
        </Form></>}
    </Page>
  );
}
