import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Order } from '../api';
import { useAction, useApp, useEv, useToast } from '../app-context';
import { ago, brl, dayFull, time, GOB, OBEDIENCES, initials } from '../format';
import { Icon } from '../icons';
import { Art, Done, Empty, Field, Form, Group, Item, Load, Page, PlainPage, Select, SvcRow, Switch } from '../ui';
import { useLogout } from './auth';
import { useSessions } from './program';

export const SHORTCUTS = [
  { id: 'membership_card', name: 'Carteirinha', icon: 'contact', module: 'membership_card', to: '/carteirinha' },
  { id: 'tickets', name: 'Ingressos', icon: 'ticket', module: 'tickets', to: '/ingressos' },
  { id: 'parking', name: 'Estacionar', icon: 'car', module: 'parking', to: '/estacionamento' },
  { id: 'buy', name: 'Comprar ingresso', icon: 'ticket-plus', module: 'tickets', to: '/comprar' },
  { id: 'vouchers', name: 'Vouchers', icon: 'utensils', module: 'vouchers', to: '/vouchers' },
  { id: 'products', name: 'Produtos', icon: 'shopping-cart', module: 'products', to: '/produtos' },
  { id: 'news', name: 'Notícias', icon: 'newspaper', module: 'news', to: '/noticias' },
  { id: 'support', name: 'Atendimento', icon: 'headset', module: 'support', to: '/atendimento' },
  { id: 'museum', name: 'Museu', icon: 'landmark', module: 'museum', to: '/museu' },
];
const ROLE: Record<string, [string, string]> = { organizer: ['shield-check', 'Organização'], auctioneer: ['gavel', 'Leiloeiro'], family: ['users', 'Familiar'] };

export function Account() {
  const { me, ctx } = useApp(), navigate = useNavigate(), logout = useLogout(), m = ctx.modules;
  const row = (show: boolean, to: string, icon: string, label: string) => show && <SvcRow key={label} to={to} icon={icon} label={label} />;
  const group = (label: string, rows: unknown[]) => rows.some(Boolean) && <Group label={label}>{rows as never}</Group>;
  const top = SHORTCUTS.filter((x) => ['membership_card', 'tickets', 'vouchers', 'parking'].includes(x.id) && m[x.module]);
  return (
    <Page title="Conta" back="/">
      <button className="me-card" onClick={() => navigate('/perfil')}><span className="av av-0">{me.photo ? <img src={me.photo} alt="" /> : initials(me.name)}</span><span><b>Ir. {me.name}</b><small>{ctx.me.lodge || me.email}</small></span><Icon n="chevron-right" /></button>
      {top.length > 0 && <div className="quick" style={{ paddingTop: 20 }}>{top.map((x) => <button key={x.id} onClick={() => navigate(x.to)}><span className="ic"><Icon n={x.icon} /></span>{x.name}</button>)}</div>}
      {group('Compras e finanças', [row(m.orders, '/pedidos', 'package', 'Pedidos'), row(m.membership, '/assinatura', 'credit-card', 'Minha assinatura'), row(m.cost_shares, '/rateios', 'users', 'Meus rateios'), row(m.products, '/produtos', 'shopping-cart', 'Produtos')])}
      {group('Comunidade', [row(true, '/chat', 'message-circle', 'Chat'), row(m.network, '/rede', 'briefcase', 'Rede de empresas'), row(m.ranking, '/ranking', 'trophy', 'Meu ranking'), row(m.museum, '/museu', 'landmark', 'Museu e acervo'), row(m.news, '/noticias', 'newspaper', 'Notícias')])}
      {group('Perfil e segurança', [row(true, '/perfil/editar', 'user-round-pen', 'Editar perfil'), row(true, '/seguranca', 'lock-keyhole', 'Segurança'), row(true, '/senha', 'key-round', 'Alterar senha'), row(true, '/facial', 'scan-face', 'Reconhecimento facial'), row(true, '/atalhos', 'layout-grid', 'Atalhos da home'), row(m.rooms, '/salas', 'building-2', 'Gestão de salas')])}
      {group('Suporte', [row(m.support, '/atendimento', 'headset', 'Central de atendimento'), row(true, '/faq', 'circle-help', 'Perguntas frequentes'), row(true, '/privacidade', 'file-text', 'Política de privacidade'), row(true, '/termos', 'shield-check', 'Termos de uso')])}
      {group('Links úteis', [row(m.tickets, '/comprar', 'ticket-plus', 'Comprar ingresso'), row(true, '/tornar-se-irmao', 'user-round-plus', 'Quero me tornar irmão')])}
      <Group label="Aplicativo"><SvcRow to="/dados" icon="info" label="Dados e aplicativo" /><SvcRow icon="log-out" label="Sair" danger onClick={logout} /></Group>
    </Page>
  );
}

export function Profile() {
  const { me, ctx } = useApp(), navigate = useNavigate();
  const chats = useEv<{ groups: unknown[]; direct: unknown[] }>('/chats').data;
  const line = (label: string, value?: string) => value ? <div className="row2"><span>{label}</span><b>{value}</b></div> : null;
  return (
    <PlainPage title={`Ir. ${me.name}`} back="/conta" noTitle>
      <div className="profile"><span className="av av-0">{me.photo ? <img src={me.photo} alt="" /> : initials(me.name)}</span><h1>Ir. {me.name}</h1><p>{[ctx.me.lodge, me.city].filter(Boolean).join(' · ')}</p>
        <div className="roles">{ctx.me.roles.map((r) => ROLE[r] && <span key={r} className="role"><Icon n={ROLE[r][0]} />{ROLE[r][1]}</span>)}{ctx.me.facial && <span className="role"><Icon n="scan-face" />Facial autorizado</span>}</div></div>
      <div className="figures"><div><b className="cond num">{ctx.counts.registrations}</b><span>Inscrições</span></div><div><b className="cond num">{chats?.groups.length ?? '–'}</b><span>Grupos</span></div><div><b className="cond num">{chats?.direct.length ?? '–'}</b><span>Conversas</span></div></div>
      <div className="actions"><button className="btn soft" onClick={() => navigate('/perfil/editar')}><Icon n="pencil" />Editar</button><button className="btn soft" onClick={() => navigate('/senha')}><Icon n="key-round" />Senha</button></div>
      <div className="grp-label">Dados</div>
      <div className="group">{line('Loja', ctx.me.lodge)}{line('Potência', ctx.me.obedience)}{line('CIM', ctx.me.cim)}{line('Oriente', me.city)}{line('País', me.country)}{line('E-mail', me.email)}{line('Telefone', me.phone)}</div>
      <div className="actions one"><button className="btn tint" onClick={() => navigate('/facial')}><Icon n="scan-face" />Reconhecimento facial</button></div>
    </PlainPage>
  );
}

/** reduz a foto no aparelho antes de enviar */
async function shrink(file: File) {
  const image = await createImageBitmap(file).catch(() => { throw new Error('Não foi possível ler a imagem.'); });
  const side = Math.min(image.width, image.height), canvas = document.createElement('canvas');
  canvas.width = canvas.height = 320;
  canvas.getContext('2d')!.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 320, 320);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function EditProfile() {
  const { me, ctx, path } = useApp(), navigate = useNavigate(), run = useAction();
  const [obedience, setObedience] = useState(ctx.me.obedience), [email, setEmail] = useState(me.email);
  return (
    <Page title="Editar perfil" back="/perfil">
      <Form submit="Salvar" onSubmit={async (d, form) => {
        const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0];
        await api('PATCH', '/me', { name: d.name, email: d.email, phone: d.phone, city: d.city, country: d.country, currentPassword: d.currentPassword, ...(file ? { photo: await shrink(file) } : {}) });
        await api('PUT', path('/profile'), { lodge: d.lodge, obedience: d.obedience, cim: d.cim ?? '' });
        await run(async () => {}, 'Perfil atualizado.'); navigate('/perfil');
      }}>
        <Field label="Nome" name="name" defaultValue={me.name} />
        <div className="field"><label htmlFor="f-file">Foto</label><input id="f-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" /></div>
        <Select label="Potência" name="obedience" value={obedience} onChange={(e) => setObedience(e.target.value)}>{[...new Set([ctx.me.obedience, ...OBEDIENCES])].map((o) => <option key={o} value={o}>{o || 'Não informada'}</option>)}</Select>
        {GOB(obedience) && <Field label="CIM" name="cim" inputMode="numeric" defaultValue={ctx.me.cim} />}
        <Field label="Loja" name="lodge" defaultValue={ctx.me.lodge} />
        <div className="grid2"><Field label="Oriente" name="city" defaultValue={me.city} /><Field label="País" name="country" defaultValue={me.country} /></div>
        <Field label="E-mail" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {email.trim().toLowerCase() !== me.email.toLowerCase() && <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" hint="Necessária para trocar o e-mail." />}
        <Field label="Telefone" name="phone" inputMode="tel" defaultValue={me.phone} />
      </Form>
    </Page>
  );
}

export function Password() {
  const navigate = useNavigate(), toast = useToast();
  return (
    <Page title="Alterar senha" back="/perfil">
      <Form submit="Alterar senha" onSubmit={async (d) => {
        if (d.next !== d.repeat) throw new Error('As duas senhas novas não são iguais.');
        await api('PUT', '/me/password', { current: d.current, next: d.next }); toast('Senha alterada. Os outros aparelhos saíram.'); navigate('/perfil');
      }}>
        <Field label="Senha atual" name="current" type="password" autoComplete="current-password" />
        <Field label="Nova senha" name="next" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." />
        <Field label="Repita a nova senha" name="repeat" type="password" autoComplete="new-password" />
      </Form>
    </Page>
  );
}

export function Facial() {
  const { ctx, path } = useApp(), run = useAction();
  return (
    <Page title="Reconhecimento facial" back="/perfil" sub="Opcional, para entrar nos eventos sem mostrar a carteirinha.">
      <p className="hint-line center">Esta versão registra só a sua autorização. Nenhuma imagem do rosto é capturada.</p>
      {ctx.me.facial ? <div className="form dock"><div className="face done"><Icon n="user-check" /></div><button className="btn soft" onClick={() => run(() => api('DELETE', path('/facial')), 'Autorização apagada.')}><Icon n="trash-2" />Retirar minha autorização</button></div>
        : <Form submit="Autorizar" onSubmit={async (_d, form) => { await api('POST', path('/facial'), { accept: (form.elements.namedItem('accept') as HTMLInputElement).checked }); await run(async () => {}, 'Autorização registrada.'); }}>
          <div className="face"><Icon n="scan-face" /></div>
          <label className="check"><input type="checkbox" name="accept" />Autorizo o uso da imagem do meu rosto para o controle de entrada.</label>
        </Form>}
    </Page>
  );
}

export function Card() {
  const { me, ctx } = useApp(), q = useEv<{ qr: string }>('/card');
  const item = (label: string, value: string) => <div><small>{label}</small><b>{value || '—'}</b></div>;
  return (
    <Page title="Carteirinha" back="/conta" sub="Apresente na entrada dos eventos">
      <div className="card-id"><Art v={0} />
        <small>{ctx.event.name}</small><h2>Ir. {me.name}</h2>
        <div className="dl">{item('Loja', ctx.me.lodge)}{item('CIM', ctx.me.cim)}{item('Potência', ctx.me.obedience.split(' · ')[0])}{item('Oriente', me.city)}</div>
        <div className="qr img">{q.data && <img src={q.data.qr} alt="Código da carteirinha" />}</div></div>
    </Page>
  );
}

export function Tickets() {
  const q = useSessions(), { path } = useApp(), run = useAction(), navigate = useNavigate();
  const mine = (q.data ?? []).filter((s) => s.registered);
  return (
    <Page title="Ingressos" back="/conta" sub={q.data && <><span className="num">{mine.length}</span> {mine.length === 1 ? 'evento' : 'eventos'} com ingresso</>}>
      <Load q={q}>{() => mine.length ? <>{mine.map((s) => <Item key={s.id} title={s.title} sub={`${dayFull(s.startsAt)} · ${time(s.startsAt)} · ${s.venueName}`}
        side={s.checkedIn ? <Done>Presente</Done> : <button className="btn primary" onClick={() => run(() => api('POST', path(`/sessions/${s.id}/check-in`)), 'Check-in registrado.')}>Check-in</button>} />)}</>
        : <Empty text="Inscreva-se em um evento para receber o ingresso."><button className="btn primary fit" onClick={() => navigate('/')}>Ver programação</button></Empty>}</Load>
    </Page>
  );
}

const SOURCE: Record<string, string> = { ticket: 'Ingresso', shop: 'Produto', auction: 'Leilão', membership: 'Anuidade', cost_share: 'Rateio' };
export function Orders() {
  const q = useEv<Order[]>('/orders'), navigate = useNavigate(), { ctx } = useApp();
  return (
    <Page title="Pedidos" back="/conta" sub={q.data && <><span className="num">{q.data.length}</span> {q.data.length === 1 ? 'pedido' : 'pedidos'}</>}>
      <Load q={q}>{(list) => list.length ? <>{list.map((o) => <Item key={o.id} title={o.items[0]?.description} sub={<>{SOURCE[o.source]} · {o.items[0]?.quantity > 1 && `${o.items[0].quantity}x · `}{brl(o.total)} · {ago(o.createdAt)}</>}
        side={o.status === 'paid' ? <Done>Pago</Done> : <button className="btn primary" onClick={() => navigate(`/pagamento/${o.id}`)}>Pagar</button>} />)}</>
        : <Empty text="Nenhum pedido ainda. Ingressos, produtos e lotes aparecem aqui.">{ctx.modules.auction && <button className="btn primary fit" onClick={() => navigate('/leilao')}>Ver leilão</button>}</Empty>}</Load>
    </Page>
  );
}

export function News() {
  const q = useEv<{ id: string; title: string; body: string; publishedAt: string }[]>('/news');
  return (
    <Page title="Notícias" back="/conta" sub="Novidades do evento">
      <Load q={q}>{(list) => list.length ? <div>{list.map((n) => <article key={n.id} className="news"><small>{ago(n.publishedAt)}</small><h3>{n.title}</h3><p>{n.body}</p></article>)}</div> : <Empty text="Nenhuma notícia publicada." />}</Load>
    </Page>
  );
}

const FAQ = [
  ['Preciso me inscrever em cada evento?', 'Sim. A inscrição garante a vaga, libera o grupo no Chat e o ingresso.'],
  ['Como entro no leilão?', 'Na aba Leilão, quando o leiloeiro chamar, abra um lote e dê o seu lance.'],
  ['Posso trazer minha esposa?', 'Eventos marcados como Família ou Jantar são abertos a familiares.'],
  ['Esqueci minha senha.', 'Procure a organização do evento. A recuperação por e-mail ainda não está disponível.'],
  ['Não recebi o código de acesso.', 'Na tela do código, toque em Reenviar ou em Usar outro método.'],
];
export const Faq = () => <Page title="Perguntas frequentes" back="/conta"><div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></Page>;

export function Privacy() {
  const { me } = useApp(), run = useAction();
  return (
    <Page title="Privacidade e cookies" back="/conta">
      <div className="prose-block"><h2>Política de privacidade</h2>
        <p>O aplicativo guarda nome, loja, CIM, oriente, e-mail e telefone para organizar o evento. Os dados só são vistos pela organização e, em parte, pelos outros participantes (nome, loja, potência e cidade).</p>
        <p>Você pode corrigir seus dados em Editar perfil ou apagar a conta a qualquer momento.</p></div>
      <div className="group svcs"><Switch title="Cookies necessários" desc="Mantêm você conectado." checked disabled />
        <Switch title="Cookies de análise" desc="Ajudam a melhorar o aplicativo." checked={!!me.analyticsConsent} onChange={() => run(() => api('PUT', '/me/consent', { analytics: !me.analyticsConsent }), 'Escolha salva.')} /></div>
    </Page>
  );
}
export const Terms = () => (
  <Page title="Termos de uso" back="/conta"><div className="prose-block"><h2>Uso do aplicativo</h2>
    <p>O aplicativo é de uso exclusivo dos participantes do evento e dos irmãos convidados. O cadastro é pessoal e intransferível.</p>
    <h2>Conduta</h2><p>As conversas seguem o decoro da instituição. A organização pode remover conteúdo ou contas que o descumpram.</p>
    <h2>Leilão</h2><p>Todo lance é uma oferta de compra. O lote é de quem tiver o maior lance quando o leiloeiro encerrar o lote.</p></div></Page>
);

const THEMES = [['bordo', 'Bordô', '#740012'], ['azul', 'Azul', '#1f4e8c'], ['dourado', 'Dourado', '#7c5a15'], ['marinho', 'Marinho', '#172540']];
export function Data() {
  const { ctx } = useApp(), navigate = useNavigate(), logout = useLogout();
  const [theme, setTheme] = useState(document.documentElement.dataset.tema);
  const line = (label: string, value: string) => <div className="row2"><span>{label}</span><b>{value || '—'}</b></div>;
  return (
    <Page title="Dados e aplicativo" back="/conta">
      <div className="group">{line('Loja', ctx.me.lodge)}{line('Potência', ctx.me.obedience)}{line('CIM', ctx.me.cim)}{line('Cargo', ctx.me.office)}</div>
      <div className="grp-label">Aparência</div>
      <div className="group"><div className="themes">{THEMES.map(([id, name, color]) => <button key={id} style={{ background: color }} aria-label={`Tema ${name}`} aria-pressed={theme === id} onClick={() => {
        document.documentElement.dataset.tema = id; try { localStorage.setItem('tema-125', id); } catch { /* ignora */ } setTheme(id);
      }} />)}</div></div>
      <div className="grp-label">Aplicativo</div>
      <div className="group">{line('Versão do aplicativo', '1.0.0')}{line('Sistema', navigator.platform || 'Web')}</div>
      <Group label="Conta"><SvcRow icon="trash-2" label="Excluir conta" danger to="/excluir" /><SvcRow icon="log-out" label="Sair" onClick={logout} /></Group>
    </Page>
  );
}

export function DeleteAccount() {
  const logout = useLogout(), toast = useToast();
  return (
    <Page title="Excluir conta" back="/dados">
      <div className="prose-block"><p>Seu cadastro, inscrições, grupos e conversas serão apagados. Os lances já dados continuam valendo, sem o seu nome.</p><p><b>Essa ação não pode ser desfeita.</b></p></div>
      <Form submit="Excluir minha conta" onSubmit={async (d) => { await api('DELETE', '/me', { password: d.password }); toast('Conta excluída.'); await logout(); }}>
        <Field label="Confirme com a sua senha" name="password" type="password" autoComplete="current-password" />
      </Form>
    </Page>
  );
}

export function Shortcuts() {
  const { me, ctx } = useApp(), run = useAction(), toast = useToast();
  const list = SHORTCUTS.filter((x) => ctx.modules[x.module]);
  const toggle = (id: string) => {
    const on = me.shortcuts.includes(id);
    const next = on ? me.shortcuts.filter((x) => x !== id) : [...me.shortcuts, id];
    if (next.length > 4) return toast('Desligue um atalho antes de ligar outro.', true);
    run(() => api('PUT', '/me/shortcuts', { shortcuts: next }));
  };
  return (
    <Page title="Atalhos da home" back="/conta" sub={<>Escolha até 4 · <span className="num">{me.shortcuts.length}</span> em uso</>}>
      <div className="group svcs">{list.map((x) => <Switch key={x.id} title={x.name} checked={me.shortcuts.includes(x.id)} onChange={() => toggle(x.id)} />)}</div>
    </Page>
  );
}

export function Join() {
  const { path } = useApp(), navigate = useNavigate();
  const [sent, setSent] = useState(false);
  return (
    <Page title="Quero me tornar irmão" back="/conta" sub={sent ? undefined : 'Deixe seu contato para a instituição'}>
      {sent ? <Empty text="Pedido enviado. A instituição entra em contato."><button className="btn soft fit" onClick={() => navigate('/conta')}>Voltar à conta</button></Empty>
        : <Form submit="Enviar pedido" onSubmit={async (d) => { await api('POST', path('/join-requests'), d); setSent(true); }}>
          <Field label="Nome completo" name="name" /><Field label="Cidade" name="city" /><Field label="Telefone ou e-mail" name="contact" />
        </Form>}
    </Page>
  );
}
