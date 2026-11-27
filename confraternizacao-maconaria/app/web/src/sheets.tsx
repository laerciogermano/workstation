import { useLocation, useNavigate } from 'react-router-dom';
import { api, type Session } from './api';
import { useAction, useApp, useEv, useToast } from './app-context';
import { brl, initials } from './format';
import { Icon } from './icons';
import { SvcRow, Switch } from './ui';
import { useLogout } from './screens/auth';
import { useState } from 'react';

export function Sheets() {
  const { sheet, openSheet, me } = useApp();
  const { pathname } = useLocation();
  // CU-42: no primeiro acesso, pede a escolha sobre cookies na tela inicial
  const consent = me.analyticsConsent === null && pathname === '/';
  const open = consent ? 'consent' : sheet?.kind;
  return (<>
    <div className={`scrim ${open ? 'open' : ''}`} onClick={() => !consent && openSheet(null)} />
    <Wrapper name="menu" open={open === 'menu'} label="Menu">{open === 'menu' && <Menu />}</Wrapper>
    <Wrapper name="account" open={open === 'account'} label="Menu da conta">{open === 'account' && <AccountMenu />}</Wrapper>
    <Wrapper name="actions" open={open === 'actions'} label="Ações do evento">{sheet?.kind === 'actions' && <Actions id={sheet.sessionId} />}</Wrapper>
    <Wrapper name="consent" open={open === 'consent'} label="Privacidade e cookies">{open === 'consent' && <Consent />}</Wrapper>
  </>);
}
function Wrapper({ name, open, label, children }: { name: string; open: boolean; label: string; children: React.ReactNode }) {
  return <div className={`bsheet ${open ? 'open' : ''}`} data-sheet={name} role="dialog" aria-label={label}><div className="handle" />{children}</div>;
}

function Menu() {
  const { ctx, openSheet } = useApp(), navigate = useNavigate(), { pathname } = useLocation();
  const m = ctx.modules, has = (r: string) => ctx.me.roles.includes(r);
  const tiles = (list: (false | [string, string, string])[]) => (
    <div className="tiles">{(list.filter(Boolean) as [string, string, string][]).map(([to, i, l]) => (
      <button key={to} aria-current={pathname === to ? 'page' : undefined} onClick={() => { openSheet(null); navigate(to); }}><Icon n={i} />{l}</button>))}</div>
  );
  const organizer = has('organizer'), seller = m.auction && (has('auctioneer') || organizer);
  return (
    <div className="menu">
      {tiles([['/', 'calendar-days', 'Eventos'], ['/inscricoes', 'ticket', 'Inscrições'], !!m.auction && ['/leilao', 'gavel', 'Leilão'], ['/chat', 'message-circle', 'Chat'], !!m.news && ['/noticias', 'newspaper', 'Notícias'],
        !!m.products && ['/produtos', 'shopping-cart', 'Produtos'], !!m.museum && ['/museu', 'landmark', 'Museu e acervo'], ['/eventos-gob', 'repeat', 'Eventos do GOB']])}
      {(organizer || seller || m.rooms || m.risks) && <><div className="grp-label">Organização</div>
        {tiles([!!seller && ['/leiloeiro', 'megaphone', 'Leiloeiro'], organizer && ['/organizacao', 'clipboard-list', 'Painel'], organizer && ['/organizacao/evento', 'calendar-plus', 'Novo evento'], organizer && ['/organizacao/local', 'map-pin-plus', 'Novo local'],
          organizer && ['/modulos', 'puzzle', 'Módulos'], organizer && ['/papeis', 'users-round', 'Papéis'], !!m.rooms && ['/salas', 'building-2', 'Salas'], !!m.risks && ['/riscos', 'triangle-alert', 'Riscos']])}</>}
    </div>
  );
}

function AccountMenu() {
  const { me, openSheet } = useApp(), navigate = useNavigate(), logout = useLogout();
  const row = (to: string, i: string, l: string) => <SvcRow icon={i} label={l} onClick={() => { openSheet(null); navigate(to); }} />;
  return (<>
    <div className="head"><span className="av av-0">{me.photo ? <img src={me.photo} alt="" /> : initials(me.name)}</span><div><b>Ir. {me.name}</b><small>{me.email}</small></div></div>
    <div className="group svcs">{row('/conta', 'layout-grid', 'Serviços da conta')}{row('/perfil', 'user-round', 'Ver perfil')}{row('/perfil/editar', 'pencil', 'Editar perfil')}{row('/senha', 'key-round', 'Alterar senha')}{row('/seguranca', 'lock-keyhole', 'Segurança')}
      <SvcRow icon="log-out" label="Sair" danger onClick={logout} /></div>
  </>);
}

function Actions({ id }: { id: string }) {
  const { ctx, openSheet, path } = useApp(), navigate = useNavigate(), toast = useToast(), run = useAction();
  const s = useEv<Session[]>('/sessions').data?.find((x) => x.id === id);
  if (!s) return null;
  return (<>
    <div className="sheet-title"><b>{s.title}</b><small>Selecione o que deseja fazer.</small></div>
    <div className="group svcs">
      {ctx.modules.tickets ? <>
        <SvcRow icon="circle-check" label="Fazer check-in" sub={s.checkedIn ? 'Presença já confirmada' : 'Confirme sua presença no evento'} onClick={() => {
          openSheet(null);
          if (!s.registered) toast('Inscreva-se no evento antes do check-in.', true);
          else run(() => api('POST', path(`/sessions/${id}/check-in`)), 'Check-in registrado.');
        }} />
        <SvcRow icon="ticket" label="Comprar ingresso" sub={s.price ? `A partir de ${brl(s.price)}` : 'Evento gratuito'} onClick={() => { openSheet(null); navigate(`/comprar/${id}`); }} />
      </> : <p className="hint-line">Check-ins e ingressos estão desligados.</p>}
    </div>
  </>);
}

function Consent() {
  const navigate = useNavigate(), run = useAction();
  const [analytics, setAnalytics] = useState(false);
  const save = (value: boolean) => run(() => api('PUT', '/me/consent', { analytics: value }), 'Escolha de privacidade salva.');
  return (<>
    <div className="sheet-title"><b>Privacidade e cookies</b></div>
    <div className="consent">
      <p>Usamos cookies essenciais para o app funcionar e, com a sua permissão, cookies de análise para melhorar a experiência.</p>
      <div className="group"><Switch title="Essenciais" desc="Login e segurança. Sempre ativos." checked disabled />
        <Switch title="Desempenho e análise" desc="Para entender o uso do app. Sem publicidade." checked={analytics} onChange={() => setAnalytics(!analytics)} /></div>
      <div className="pair"><button className="btn tint" onClick={() => save(false)}>Rejeitar opcionais</button><button className="btn tint" onClick={() => save(true)}>Aceitar todos</button></div>
      <button className="btn soft" onClick={() => save(analytics)}>Salvar escolha</button>
      <button className="textlink" onClick={() => navigate('/privacidade')}>Ler a política de privacidade</button>
    </div>
  </>);
}
