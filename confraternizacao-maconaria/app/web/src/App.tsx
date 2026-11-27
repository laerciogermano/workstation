import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, type Context, type EventItem, type Me } from './api';
import { AppContext, ToastProvider, useMe, type Sheet } from './app-context';
import { Sheets } from './sheets';
import { Empty, Loading, Page } from './ui';
import { Activate, BackupCodes, Configure, ConfirmChange, Login, Methods, Register, Security, Verify, clearNext, peekNext } from './screens/auth';
import { Agenda, Buy, EventDetail, Home, Notifications, Participants, Payment, Registrations } from './screens/program';
import { ChatList, Conversation } from './screens/chat';
import { Account, Card, Data, DeleteAccount, EditProfile, Facial, Faq, Join, News, Orders, Password, Privacy, Profile, Shortcuts, Terms, Tickets } from './screens/account';
import { CostShares, Membership, Museum, Network, Parking, Piece, Products, Ranking, Support, Vouchers } from './screens/services';
import { Auction, Auctioneer, Lot, NewLot } from './screens/auction';
import { GobEvents, Modules, NewRisk, NewSession, NewVenue, Organization, Risks, Roles, Rooms } from './screens/org';

export function App() {
  const me = useMe();
  return (
    <div className="phone enter">
      <ToastProvider>
        {me.data === undefined ? <div className="app"><main className="view page" style={{ paddingTop: 120 }}>{me.error ? <Empty text={me.error.message}><button className="btn soft fit" onClick={() => me.refetch()}>Tentar de novo</button></Empty> : <Loading />}</main></div>
          : me.data ? <Shell me={me.data} /> : <Public />}
      </ToastProvider>
    </div>
  );
}

function Public() {
  const { pathname } = useLocation();
  return (
    <div className="app" key={pathname}>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/criar-conta" element={<Register />} />
        <Route path="/verificar" element={<Verify />} />
        <Route path="/metodos" element={<Methods />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    </div>
  );
}

const stored = () => { try { return localStorage.getItem('evento-atual'); } catch { return null; } };

/** só mostra a tela se o módulo estiver visível (o servidor confere de novo) */
function Shell({ me }: { me: Me }) {
  const { pathname } = useLocation();
  const client = useQueryClient();
  const [chosen, setChosen] = useState(stored);
  const [sheet, openSheet] = useState<Sheet>(null);
  const events = useQuery({ queryKey: ['events'], queryFn: () => api<EventItem[]>('GET', '/events') });
  const joined = events.data?.filter((e) => e.joined) ?? [];
  const eventId = (joined.find((e) => e.id === chosen) ?? joined.find((e) => e.slug === '125-anos') ?? joined[0])?.id;
  const ctx = useQuery({ queryKey: ['ev', eventId, '/context'], queryFn: () => api<Context>('GET', `/events/${eventId}/context`), enabled: !!eventId });

  useEffect(() => { openSheet(null); }, [pathname]);
  // avisos em tempo real: mensagem, lance, programação e módulos
  useEffect(() => {
    if (!eventId) return;
    const stream = new EventSource(`/api/events/${eventId}/stream`);
    stream.onmessage = () => { client.invalidateQueries({ queryKey: ['ev', eventId] }); };
    return () => stream.close();
  }, [eventId, client]);

  const failure = events.error ?? ctx.error;
  if (!events.data || !ctx.data || !eventId) {
    return <div className="app"><main className="view page" style={{ paddingTop: 120 }}>{failure ? <Empty text={failure.message} /> : events.data && !eventId ? <Empty text="Você ainda não participa de um evento." /> : <Loading />}</main></div>;
  }
  const switchEvent = (id: string) => { try { localStorage.setItem('evento-atual', id); } catch { /* ignora */ } setChosen(id); };
  const m = ctx.data.modules;
  const gate = (key: string, el: ReactNode) => (m[key] ? el : <Page title="Indisponível" back="/"><Empty text="Este recurso não está disponível neste evento." /></Page>);
  const staff = (el: ReactNode, roles = ['organizer']) => (roles.some((r) => ctx.data.me.roles.includes(r)) ? el : <Page title="Acesso restrito" back="/"><Empty text="Esta área é da organização do evento." /></Page>);
  const auctioneer = (el: ReactNode) => gate('auction', staff(el, ['organizer', 'auctioneer']));

  return (
    <AppContext.Provider value={{ me, ctx: ctx.data, events: events.data, eventId, switchEvent, sheet, openSheet, path: (p) => `/events/${eventId}${p}` }}>
      <div className="app" key={`${eventId}${pathname}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notificacoes" element={<Notifications />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/evento/:id" element={<EventDetail />} />
          <Route path="/evento/:id/participantes" element={<Participants />} />
          <Route path="/comprar/:id?" element={gate('tickets', <Buy />)} />
          <Route path="/pagamento/:id" element={<Payment />} />
          <Route path="/inscricoes" element={<Registrations />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:id" element={<Conversation />} />
          <Route path="/ativar" element={<Activate />} />
          <Route path="/configurar/:method" element={<Configure />} />
          <Route path="/codigos" element={<BackupCodes />} />
          <Route path="/seguranca" element={<Security />} />
          <Route path="/confirmar" element={<ConfirmChange />} />
          <Route path="/conta" element={<Account />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/perfil/editar" element={<EditProfile />} />
          <Route path="/senha" element={<Password />} />
          <Route path="/facial" element={<Facial />} />
          <Route path="/carteirinha" element={gate('membership_card', <Card />)} />
          <Route path="/ingressos" element={gate('tickets', <Tickets />)} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/noticias" element={gate('news', <News />)} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/dados" element={<Data />} />
          <Route path="/excluir" element={<DeleteAccount />} />
          <Route path="/atalhos" element={<Shortcuts />} />
          <Route path="/tornar-se-irmao" element={<Join />} />
          <Route path="/vouchers" element={gate('vouchers', <Vouchers />)} />
          <Route path="/estacionamento" element={gate('parking', <Parking />)} />
          <Route path="/assinatura" element={gate('membership', <Membership />)} />
          <Route path="/rateios" element={gate('cost_shares', <CostShares />)} />
          <Route path="/rede" element={gate('network', <Network />)} />
          <Route path="/ranking" element={gate('ranking', <Ranking />)} />
          <Route path="/atendimento" element={gate('support', <Support />)} />
          <Route path="/produtos" element={gate('products', <Products />)} />
          <Route path="/museu" element={gate('museum', <Museum />)} />
          <Route path="/museu/:id" element={gate('museum', <Piece />)} />
          <Route path="/leilao" element={gate('auction', <Auction />)} />
          <Route path="/leilao/:id" element={gate('auction', <Lot />)} />
          <Route path="/leiloeiro" element={auctioneer(<Auctioneer />)} />
          <Route path="/leiloeiro/novo" element={auctioneer(<NewLot />)} />
          <Route path="/organizacao" element={staff(<Organization />)} />
          <Route path="/organizacao/local" element={staff(<NewVenue />)} />
          <Route path="/organizacao/evento" element={staff(<NewSession />)} />
          <Route path="/modulos" element={staff(<Modules />)} />
          <Route path="/papeis" element={staff(<Roles />)} />
          <Route path="/salas" element={gate('rooms', <Rooms />)} />
          <Route path="/riscos" element={gate('risks', <Risks />)} />
          <Route path="/riscos/novo" element={gate('risks', staff(<NewRisk />))} />
          <Route path="/eventos-gob" element={<GobEvents />} />
          <Route path="*" element={<Redirect />} />
        </Routes>
      </div>
      <Sheets />
    </AppContext.Provider>
  );
}
/** depois de entrar, segue para o destino pendente (ex.: ativar a verificação) */
function Redirect() {
  const [to] = useState(() => peekNext() ?? '/');
  useEffect(clearNext, []);
  return <Navigate to={to} replace />;
}
