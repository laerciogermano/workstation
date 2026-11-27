import { useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, type UIEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Session } from './api';
import { useApp } from './app-context';
import { dayFull, dayNumber, fmt, initials, month, time } from './format';
import { Icon } from './icons';

// ---------- arte gerada ----------
export const PATTERNS = [
  [10, 20, 30, 40, 50, 60, 70, 80].map((r) => <circle key={r} cx="84" cy="16" r={r} />),
  [12, 22, 32, 42, 52].map((r) => <path key={r} d={`M${50 - r} 110V62a${r} ${r} 0 0 1 ${2 * r} 0v48`} />),
  [-60, -42, -26, -12, 0, 12, 26, 42, 60].map((x) => <path key={x} d={`M50 112L${50 + x * 2} -10`} />),
  [0, 14, 28, 42, 56, 70].map((y) => <path key={y} d={`M-10 ${y + 20}Q30 ${y - 8} 55 ${y + 18}T112 ${y + 6}`} />),
];
export const Pattern = ({ v }: { v: number }) => (
  <svg className="pat" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" strokeOpacity=".17" strokeWidth="1">{PATTERNS[v % PATTERNS.length]}</g></svg>
);
export const Art = ({ v = 0, icon, className = '' }: { v?: number; icon?: string; className?: string }) => <span className={`art ${className}`}><Pattern v={v} />{icon && <Icon n={icon} />}</span>;
export const hashOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export const KIND_ICON: Record<string, string> = { Recepção: 'coffee', Sessão: 'landmark', Jantar: 'utensils', Passeio: 'bus', Painel: 'presentation', Cultura: 'music', Família: 'trees', Gala: 'sparkles' };
export const SessionArt = ({ s, className = '' }: { s: Pick<Session, 'id' | 'kind'>; className?: string }) => <Art v={hashOf(s.id)} icon={KIND_ICON[s.kind] ?? 'calendar-days'} className={`${className} tone-${hashOf(s.id) % 3}`} />;

// ---------- estrutura ----------
export function Avatar({ name, photo, className = '' }: { name: string; photo?: string | null; className?: string }) {
  return <span className={`av av-${(hashOf(name) % 6) + 1} ${className}`}>{photo ? <img src={photo} alt="" /> : initials(name)}</span>;
}
export function MeButton() {
  const { me, openSheet } = useApp();
  return <button className="me-btn" onClick={() => openSheet({ kind: 'account' })} aria-label="Abrir menu da conta">{me.photo ? <img src={me.photo} alt="" /> : initials(me.name)}</button>;
}
export function Back({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button className="glass-btn" onClick={() => navigate(to)} aria-label="Voltar"><Icon n="chevron-left" /></button>;
}

export function TabBar({ current }: { current: string }) {
  const { ctx } = useApp(), navigate = useNavigate();
  const tabs = [['/', 'calendar-days', 'Eventos'], ['/inscricoes', 'ticket', 'Inscrições'], ...(ctx.modules.auction ? [['/leilao', 'gavel', 'Leilão']] : []), ['/chat', 'message-circle', 'Chat']];
  return (<>
    <div className="edge" />
    <nav className="tabbar" aria-label="Seções">{tabs.map(([to, i, l]) => (
      <button key={to} onClick={() => navigate(to)} aria-label={l} aria-current={current === to ? 'page' : undefined}>
        <Icon n={i} /><span className="t">{l}</span>{to === '/chat' && ctx.counts.messages > 0 && <span className="dot num">{ctx.counts.messages}</span>}
      </button>))}</nav>
  </>);
}

/** rolagem: a barra superior vira vidro e a barra de abas encolhe */
export function useScrollState() {
  const last = useRef(0);
  return (e: UIEvent<HTMLElement>) => {
    const v = e.currentTarget, y = v.scrollTop;
    v.classList.toggle('scrolled', y > 28); v.classList.toggle('past', y > 260);
    if (Math.abs(y - last.current) > 6 || y < 40) { v.classList.toggle('down', y > last.current && y > 80); last.current = y; }
  };
}

interface PageProps { title: string; sub?: ReactNode; back?: string; tab?: string; children?: ReactNode }
/** tela comum; com `tab` leva a barra de abas e o avatar */
export function Page({ title, sub, back, tab, children }: PageProps) {
  const app = useApp();
  const onScroll = useScrollState();
  return (<>
    <main className={`view page ${tab ? 'has-bar' : ''}`} onScroll={onScroll}>
      <div className="topbar">
        {back ? <Back to={back} /> : tab ? <button className="glass-btn" onClick={() => app.openSheet({ kind: 'menu' })} aria-label="Abrir menu"><Icon n="menu" /></button> : <span />}
        <span className="mini" aria-hidden="true">{title}</span>{tab ? <MeButton /> : <span />}
      </div>
      <header className="largetitle"><h1>{title}</h1>{sub && <p>{sub}</p>}</header>
      {children}
    </main>
    {tab && <TabBar current={tab} />}
  </>);
}
/** telas sem sessão completa (entrada e verificação) */
export function PlainPage({ title, sub, back, noTitle, children }: Omit<PageProps, 'tab'> & { noTitle?: boolean }) {
  const onScroll = useScrollState();
  return (
    <main className="view page" onScroll={onScroll}>
      <div className="topbar">{back ? <Back to={back} /> : <span />}<span className="mini" aria-hidden="true">{title}</span><span /></div>
      {!noTitle && <header className="largetitle"><h1>{title}</h1>{sub && <p>{sub}</p>}</header>}
      {children}
    </main>
  );
}

export const Empty = ({ text, children }: { text: string; children?: ReactNode }) => <div className="empty"><p>{text}</p>{children}</div>;
export const Loading = () => <><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>;
export function Load<T>({ q, children }: { q: { data?: T; error: Error | null; refetch: () => void }; children: (data: T) => ReactNode }) {
  if (q.data !== undefined) return <>{children(q.data)}</>;
  if (q.error) return <Empty text={q.error.message}><button className="btn soft fit" onClick={q.refetch}>Tentar de novo</button></Empty>;
  return <Loading />;
}
export const Item = ({ title, sub, side }: { title: ReactNode; sub?: ReactNode; side?: ReactNode }) => <div className="ticket"><div className="tx"><h3>{title}</h3>{sub && <small>{sub}</small>}</div>{side}</div>;
export const Done = ({ children }: { children: ReactNode }) => <span className="status yes"><Icon n="check" />{children}</span>;
export const SectionHead = ({ title, side }: { title: string; side?: ReactNode }) => <div className="section-head"><h2>{title}</h2>{side}</div>;
export function SvcRow({ icon, label, to, sub, onClick, danger }: { icon: string; label: string; to?: string; sub?: string; onClick?: () => void; danger?: boolean }) {
  const navigate = useNavigate();
  return (
    <button type="button" className={`svc ${sub ? 'two' : ''} ${danger ? 'danger' : ''}`} onClick={onClick ?? (() => navigate(to!))}>
      <Icon n={icon} /><span>{label}{sub && <small>{sub}</small>}</span><Icon n="chevron-right" className="chev" />
    </button>
  );
}
export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return <>{label && <div className="grp-label">{label}</div>}<div className="group svcs">{children}</div></>;
}
export function Switch({ title, desc, checked, disabled, onChange }: { title: string; desc?: ReactNode; checked: boolean; disabled?: boolean; onChange?: () => void }) {
  return <div className="swrow"><b>{title}</b>{desc && <small>{desc}</small>}<button type="button" className="toggle" role="switch" aria-checked={checked} aria-label={title} disabled={disabled} onClick={onChange} /></div>;
}

// ---------- formulários ----------
export function Field({ label, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; name: string }) {
  return <div className="field"><label htmlFor={`f-${p.name}`}>{label}</label><input id={`f-${p.name}`} {...p} />{hint && <span className="hint">{hint}</span>}</div>;
}
export function Select({ label, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string }) {
  return <div className="field"><label htmlFor={`f-${p.name}`}>{label}</label><select id={`f-${p.name}`} {...p}>{children}</select></div>;
}
export function Area({ label, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
  return <div className="field"><label htmlFor={`f-${p.name}`}>{label}</label><textarea id={`f-${p.name}`} {...p} /></div>;
}
export function Form({ onSubmit, submit, children, after }: { onSubmit: (data: Record<string, string>, form: HTMLFormElement) => Promise<unknown>; submit: string; children?: ReactNode; after?: ReactNode }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(''); setBusy(true);
    try { await onSubmit(Object.fromEntries([...new FormData(form)].filter(([, v]) => typeof v === 'string')) as Record<string, string>, form); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <form className="form" noValidate onSubmit={send}>
      {children}
      <div className="err" role="alert">{error}</div>
      <button className="btn primary" type="submit" aria-busy={busy}>{submit}</button>
      {after}
    </form>
  );
}

// ---------- programação ----------
export function Pass({ s, soft }: { s: Session; soft?: boolean }) {
  return (
    <Link to={`/evento/${s.id}`} className={`pass plainlink ${soft ? 'soft' : ''}`}>
      <div className="main"><small>{dayFull(s.startsAt)} · <span className="num">{time(s.startsAt)}</span></small><h3>{s.title}</h3><span className="where"><Icon n="map-pin" />{s.venueName}</span></div>
      <div className="stub"><b className="cond num">{dayNumber(s.startsAt)}</b><span>{month(s.startsAt)}</span></div>
    </Link>
  );
}
export function Slot({ s }: { s: Session }) {
  const left = s.capacity - s.confirmed;
  const status = s.registered ? <span className="mine-mark">Inscrito</span> : left <= 0 ? <span className="full-mark">Lotado</span>
    : left <= 50 ? <span className="left-mark num">Restam {left}</span> : <span className="num"><Icon n="users" />{fmt(s.confirmed)} de {fmt(s.capacity)}</span>;
  return (
    <Link to={`/evento/${s.id}`} className={`slot plainlink ${s.registered ? 'is-mine' : ''}`}>
      <div className="t cond num">{time(s.startsAt)}<small>até {time(s.endsAt)}</small></div>
      <div><h3>{s.title}</h3><div className="m"><span><Icon n="map-pin" />{s.venueName}</span>{status}</div></div><Icon n="chevron-right" />
    </Link>
  );
}

// ---------- mapa desenhado de Curitiba ----------
const BOUNDS = { west: -49.34, east: -49.23, north: -25.38, south: -25.45 };
export const project = (lat: number, lng: number) => ({
  x: Math.min(1, Math.max(0, (lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west))),
  y: Math.min(1, Math.max(0, (BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south))),
});
export const CityDrawing = () => (<>
  <rect x="-100" y="-100" width="560" height="530" fill="var(--map)" />
  <g fill="var(--park)"><path d="M92 124 q24 -14 40 6 q10 20 -10 30 q-26 10 -36 -12 q-4 -16 6 -24z" /><path d="M262 168 q22 -10 36 6 q8 18 -12 24 q-24 4 -28 -12z" /><path d="M136 60 q18 -8 28 8 q4 14 -12 20 q-18 0 -18 -16z" /><path d="M200 86 q16 -4 24 6 q2 12 -12 14 q-14 0 -14 -12z" /></g>
  <ellipse cx="114" cy="140" rx="12" ry="7" fill="var(--water)" />
  <path d="M0 250 q60 -10 110 -30 q40 -14 90 -10" stroke="var(--water)" strokeWidth="6" fill="none" strokeLinecap="round" />
  <g stroke="var(--road)" strokeLinecap="round" fill="none">
    <path d="M0 196 L120 170 L200 150 L360 126" strokeWidth="9" /><path d="M10 40 L80 90 L150 124 L200 150 L260 200 L320 330" strokeWidth="9" /><path d="M210 0 L206 150 L196 330" strokeWidth="7" />
    <path d="M0 104 L70 96 L150 86 L240 70 L360 56" strokeWidth="6" /><path d="M100 330 L120 170 L112 100 L132 0" strokeWidth="5" /><path d="M270 0 L262 90 L280 182 L300 330" strokeWidth="5" />
    <path d="M0 160 L92 168 L200 150" strokeWidth="4" /><path d="M150 124 L236 100 L360 92" strokeWidth="4" /><path d="M40 330 L92 168" strokeWidth="3" /><path d="M200 150 L360 250" strokeWidth="3" />
  </g>
</>);
