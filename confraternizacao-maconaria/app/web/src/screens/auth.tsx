import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Challenge } from '../api';
import { refresh, useAction, useApp, useDev, useToast } from '../app-context';
import { GOB, OBEDIENCES } from '../format';
import { Icon } from '../icons';
import { Empty, Field, Form, Group, Load, Page, PlainPage, Select, SvcRow, Switch, useScrollState } from '../ui';

const METHODS: Record<string, { name: string; icon: string; desc: string }> = {
  sms: { name: 'SMS', icon: 'message-square', desc: 'Código enviado para o seu celular.' },
  app: { name: 'Aplicativo autenticador', icon: 'smartphone', desc: 'Google ou Microsoft Authenticator. Funciona sem sinal.' },
  email: { name: 'E-mail', icon: 'mail', desc: 'Código enviado para o e-mail da conta.' },
  backup: { name: 'Código reserva', icon: 'key-square', desc: 'Um dos códigos guardados na ativação.' },
};

// estado curto entre telas (só neste aba)
const put = (k: string, v: unknown) => sessionStorage.setItem(k, JSON.stringify(v));
const get = <T,>(k: string): T | null => JSON.parse(sessionStorage.getItem(k) ?? 'null');
export const peekNext = () => get<string>('destino');
export const clearNext = () => sessionStorage.removeItem('destino');

function useEnter() {
  const client = useQueryClient();
  return async (next = '/') => { put('destino', next); sessionStorage.removeItem('mfa'); await client.resetQueries(); };
}
export function useLogout() {
  const client = useQueryClient(), navigate = useNavigate();
  return async () => {
    await api('POST', '/auth/logout').catch(() => {});
    navigate('/entrar');
    client.setQueryData(['me'], null);
    client.removeQueries({ predicate: (q) => !['me', 'config'].includes(String(q.queryKey[0])) });
  };
}

/** em desenvolvimento não há provedor de SMS/e-mail: o código aparece na tela */
const DevCode = ({ code }: { code?: string }) => (code ? <div className="devbox"><span>Modo desenvolvimento, sem envio real. Código: <b>{code}</b></span></div> : null);
const CodeField = ({ backup }: { backup?: boolean }) => (
  <div className="field"><label htmlFor="f-code">{backup ? 'Código reserva' : 'Código de 6 dígitos'}</label>
    <input id="f-code" className="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={backup ? 9 : 6} placeholder={backup ? '0000-0000' : '000000'} autoFocus /></div>
);

function Poster({ title, children }: { title: string; children: ReactNode }) {
  const onScroll = useScrollState();
  return (
    <main className="view" onScroll={onScroll}><div className="auth">
      <div className="poster">
        <svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth=".35">{[8, 15, 22, 29, 36, 43, 49].map((r) => <circle key={r} cx="50" cy="50" r={r} />)}</g></svg>
        <span className="kicker">Confraternização Maçônica · Curitiba</span><span className="huge cond num">125</span><span className="anos">anos</span>
        <p>22 a 25 de abril de 2027. Programação pela cidade, para irmãos de todas as delegações.</p>
      </div>
      <div className="auth-sheet"><h2>{title}</h2>{children}</div>
    </div></main>
  );
}

export function Login() {
  const navigate = useNavigate(), enter = useEnter(), dev = useDev();
  const [email, setEmail] = useState('');
  return (
    <Poster title="Entrar">
      {dev && <div className="devbox"><span>Contas de exemplo (senha: <code>SEED_PASSWORD</code> do <code>.env</code>)</span>
        <div className="chips">{[['paulo.ribeiro', 'Organização'], ['roberto.almeida', 'Irmão'], ['ana.ribeiro', 'Familiar']].map(([u, l]) =>
          <button key={u} type="button" aria-pressed={email.startsWith(u)} onClick={() => setEmail(`${u}@exemplo.com`)}>{l}</button>)}</div></div>}
      <Form submit="Entrar" onSubmit={async (d) => {
        const r = await api<Challenge & { mfaRequired: boolean }>('POST', '/auth/login', d);
        if (!r.mfaRequired) return enter();
        put('mfa', r); navigate('/verificar');
      }}>
        <Field label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" />
      </Form>
      <div className="switch">Primeira vez no evento? <button type="button" onClick={() => navigate('/criar-conta')}>Criar conta</button></div>
    </Poster>
  );
}

export function Register() {
  const enter = useEnter(), navigate = useNavigate();
  const [obedience, setObedience] = useState(OBEDIENCES[0]);
  return (
    <Poster title="Criar conta">
      <Form submit="Criar conta" onSubmit={async (d) => { await api('POST', '/auth/register', d); await enter('/ativar?novo'); }}>
        <Field label="Nome completo" name="name" autoComplete="name" />
        <Select label="Potência" name="obedience" value={obedience} onChange={(e) => setObedience(e.target.value)}>{OBEDIENCES.map((o) => <option key={o}>{o}</option>)}</Select>
        <div className="grid2"><Field label="Loja" name="lodge" placeholder="Nome e nº" />{GOB(obedience) && <Field label="CIM" name="cim" inputMode="numeric" />}</div>
        <div className="grid2"><Field label="Cidade" name="city" /><Select label="País" name="country">{['Brasil', 'Portugal', 'Uruguai', 'Argentina', 'Outro'].map((c) => <option key={c}>{c}</option>)}</Select></div>
        <Field label="E-mail" name="email" type="email" autoComplete="email" />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." />
      </Form>
      <div className="switch">Já tem conta? <button type="button" onClick={() => navigate('/entrar')}>Entrar</button></div>
    </Poster>
  );
}

const subtitle = (c: Challenge) => ({ sms: `Enviamos um código por SMS para ${c.destination}.`, email: `Enviamos um código para ${c.destination}.`,
  app: 'Abra o aplicativo autenticador e digite o código da conta.', backup: 'Digite um dos códigos que você guardou. Cada um vale uma vez.' })[c.method];

export function Verify() {
  const navigate = useNavigate(), enter = useEnter(), toast = useToast();
  const [c, setC] = useState(() => get<Challenge>('mfa'));
  if (!c) return <Navigate to="/entrar" replace />;
  const expired = (e: any) => { if (e.status === 401 || e.status === 429) { sessionStorage.removeItem('mfa'); toast(e.message, true); navigate('/entrar'); } throw e; };
  return (
    <PlainPage title="Confirme que é você" sub={subtitle(c)} back="/entrar">
      <DevCode code={c.devCode} />
      <Form submit="Verificar" onSubmit={async (d) => { await api('POST', '/auth/mfa/verify', { code: d.code ?? '', trustDevice: d.trust === 'on' }).catch(expired); await enter(); }}
        after={<div className="links">
          {(c.method === 'sms' || c.method === 'email') && <button type="button" className="textlink" onClick={async () => {
            try { const n = await api<Challenge>('POST', '/auth/mfa/method', { method: c.method }); put('mfa', n); setC(n); toast('Enviamos um novo código.'); } catch (e) { toast((e as Error).message, true); }
          }}>Reenviar código</button>}
          <button type="button" className="textlink" onClick={() => navigate('/metodos')}>Usar outro método</button></div>}>
        <CodeField key={c.method} backup={c.method === 'backup'} />
        <label className="check"><input type="checkbox" name="trust" />Confiar neste aparelho por 30 dias</label>
      </Form>
    </PlainPage>
  );
}
export function Methods() {
  const navigate = useNavigate(), toast = useToast();
  const c = get<Challenge>('mfa');
  if (!c) return <Navigate to="/entrar" replace />;
  const others = [...(c.methods ?? []), 'backup'].filter((m) => m !== c.method);
  return (
    <PlainPage title="Outro método" sub="Escolha como confirmar o acesso." back="/verificar">
      <Group>{others.map((m) => <SvcRow key={m} icon={METHODS[m].icon} label={METHODS[m].name} sub={METHODS[m].desc} onClick={async () => {
        try { put('mfa', await api('POST', '/auth/mfa/method', { method: m })); navigate('/verificar'); }
        catch (e) { toast((e as Error).message, true); navigate('/entrar'); }
      }} />)}</Group>
      <p className="hint-line">Sem acesso a nenhum deles? Procure a organização no credenciamento com um documento com foto.</p>
    </PlainPage>
  );
}

// ---------- com sessão: ativação e gestão ----------
interface Status { enabled: boolean; method: string | null; methods: string[]; phone: string; backupCodesLeft: number; trustedDevices: { id: string; label: string; expiresAt: string }[]; confirmed: boolean }
const useStatus = () => useQuery({ queryKey: ['security'], queryFn: () => api<Status>('GET', '/security'), staleTime: 0 });

export function Activate() {
  const navigate = useNavigate(), fresh = useSearchParams()[0].has('novo');
  const row = Object.entries(METHODS).filter(([k]) => k !== 'backup');
  return (
    <PlainPage title="Proteja sua conta" sub="Com a verificação em duas etapas, só a senha não basta para entrar. Escolha como receber o código." back={fresh ? undefined : '/seguranca'}>
      <Group>{row.map(([k, m]) => <SvcRow key={k} icon={m.icon} label={m.name} sub={m.desc} to={`/configurar/${k}${fresh ? '?novo' : ''}`} />)}</Group>
      {fresh && <><div className="actions one"><button className="btn soft" onClick={() => navigate('/')}>Agora não</button></div><p className="hint-line center">Você pode ativar depois em Segurança.</p></>}
    </PlainPage>
  );
}

export function Configure() {
  const { method = 'app' } = useParams(), navigate = useNavigate(), toast = useToast(), { me } = useApp();
  const fresh = useSearchParams()[0].has('novo');
  const [phone, setPhone] = useState(me.phone);
  const [setup, setSetup] = useState<(Challenge & { secret?: string; qr?: string }) | null>(null);
  const start = async () => setSetup(await api('POST', '/security/setup', { method, phone: method === 'sms' ? phone : '' }));
  // autenticador e e-mail já começam; SMS espera o número
  const auto = useQuery({ queryKey: ['setup', method], queryFn: async () => { await start(); return true; }, enabled: method !== 'sms', gcTime: 0, staleTime: Infinity, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
  const m = METHODS[method];
  if (!m || method === 'backup') return <Navigate to="/seguranca" replace />;
  if (auto.error && (auto.error as any).status === 403) return <Navigate to={`/confirmar?acao=trocar`} replace />;
  const intro = method === 'app' ? 'No aplicativo autenticador, leia o código QR ou digite a chave.' : method === 'sms' ? 'Informe o celular que vai receber o código.' : `Enviamos um código para ${setup?.destination ?? 'o seu e-mail'}.`;
  return (
    <Page title={m.name} sub={intro} back={`/ativar${fresh ? '?novo' : ''}`}>
      <DevCode code={setup?.devCode} />
      {auto.error && <p className="hint-line">{auto.error.message}</p>}
      <Form submit="Ativar verificação" onSubmit={async (d) => {
        if (!setup) throw new Error(method === 'sms' ? 'Envie o código primeiro.' : 'Aguarde um instante.');
        const r = await api<{ backupCodes: string[] }>('POST', '/security/activate', { challengeId: setup.challengeId, code: d.code ?? '' });
        put('codigos', { codes: r.backupCodes, next: fresh ? '/' : '/seguranca' }); navigate('/codigos', { replace: true });
      }}>
        {method === 'app' && setup?.qr && <><div className="qr img"><img src={setup.qr} alt="Código QR para o aplicativo autenticador" /></div>
          <div className="keybox"><small>Chave</small><b className="num" style={{ wordBreak: 'break-all' }}>{setup.secret?.match(/.{1,4}/g)?.join(' ')}</b></div>
          <button type="button" className="btn tint" onClick={() => navigator.clipboard?.writeText(setup.secret!).then(() => toast('Chave copiada.'))}><Icon n="copy" />Copiar chave</button></>}
        {method === 'sms' && <><Field label="Celular" name="phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="button" className="btn tint" onClick={() => start().then(() => toast('Código enviado.')).catch((e) => (e.status === 403 ? navigate('/confirmar?acao=trocar') : toast(e.message, true)))}><Icon n="send" />Enviar código</button></>}
        <CodeField />
      </Form>
    </Page>
  );
}

export function BackupCodes() {
  const navigate = useNavigate(), toast = useToast(), client = useQueryClient();
  const data = get<{ codes: string[]; next: string }>('codigos');
  if (!data) return <Navigate to="/seguranca" replace />;
  return (
    <PlainPage title="Códigos reserva" sub="Guarde em lugar seguro: eles não aparecem de novo. Cada código vale uma vez.">
      <div className="codes">{data.codes.map((c) => <span key={c}>{c}</span>)}</div>
      <div className="actions one">
        <button className="btn tint" onClick={() => navigator.clipboard?.writeText(data.codes.join('\n')).then(() => toast('Códigos copiados.'))}><Icon n="copy" />Copiar códigos</button>
        <button className="btn primary" onClick={async () => { sessionStorage.removeItem('codigos'); await refresh(client); navigate(data.next, { replace: true }); toast('Verificação em duas etapas ativa.'); }}>Já guardei</button>
      </div>
    </PlainPage>
  );
}

const ACTIONS: Record<string, string> = { desativar: 'desativar a verificação', trocar: 'trocar o método', codigos: 'gerar novos códigos' };

function useSensitive() {
  const navigate = useNavigate(), run = useAction();
  return async (action: string) => {
    if (action === 'trocar') return navigate('/ativar');
    if (action === 'desativar') { await run(() => api('POST', '/security/disable'), 'Verificação desativada.'); return navigate('/seguranca'); }
    const r = await run(() => api<{ backupCodes: string[] }>('POST', '/security/backup-codes'), 'Novos códigos gerados.');
    if (r) { put('codigos', { codes: r.backupCodes, next: '/seguranca' }); navigate('/codigos'); }
  };
}

/** mudança sensível: pede um código antes */
export function ConfirmChange() {
  const action = useSearchParams()[0].get('acao') ?? 'trocar', toast = useToast(), apply = useSensitive();
  const { pathname } = useLocation();
  const start = useQuery({ queryKey: ['stepup', pathname], queryFn: () => api<Challenge>('POST', '/security/step-up', {}), gcTime: 0, staleTime: Infinity, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
  const [other, setOther] = useState<Challenge | null>(null);
  const c = other ?? start.data;
  return (
    <Page title="Confirme que é você" sub={c ? `${subtitle(c)} É para ${ACTIONS[action]}.` : ''} back="/seguranca">
      {!c ? <Empty text={start.error?.message ?? 'Preparando o código…'} /> : <>
        <DevCode code={c.devCode} />
        <Form submit="Verificar" onSubmit={async (d) => { await api('POST', '/security/step-up/verify', { challengeId: c.challengeId, code: d.code ?? '' }); await apply(action); }}
          after={<div className="links">{[...(c.methods ?? []), 'backup'].filter((m) => m !== c.method).map((m) => <button key={m} type="button" className="textlink" onClick={() =>
            api<Challenge>('POST', '/security/step-up', { method: m }).then((n) => setOther(n)).catch((e) => toast(e.message, true))}>Usar {METHODS[m].name.toLowerCase()}</button>)}</div>}>
          <CodeField key={c.method} backup={c.method === 'backup'} />
        </Form></>}
    </Page>
  );
}

export function Security() {
  const q = useStatus(), navigate = useNavigate(), run = useAction(), apply = useSensitive();
  return (
    <Page title="Segurança" sub="Como você entra na sua conta" back="/conta">
      <Load q={q}>{(s) => {
        const sensitive = (a: string) => (s.confirmed ? apply(a) : navigate(`/confirmar?acao=${a}`));
        const f = METHODS[s.method ?? 'email'];
        return (<>
          <div className="group svcs"><Switch title="Verificação em duas etapas" desc={s.enabled ? 'Ativa. Pede um código além da senha.' : 'Desativada. A conta usa só a senha.'} checked={s.enabled} onChange={() => (s.enabled ? sensitive('desativar') : navigate('/ativar'))} /></div>
          {s.enabled && <>
            <Group label="Segundo fator"><SvcRow icon={f.icon} label={f.name} sub="Toque para trocar o método" onClick={() => sensitive('trocar')} />
              <SvcRow icon="key-square" label="Códigos reserva" sub={`${s.backupCodesLeft} de 8 disponíveis · gerar novos`} onClick={() => sensitive('codigos')} /></Group>
            <div className="grp-label">Aparelhos confiáveis</div>
            {s.trustedDevices.length ? <div className="group svcs"><SvcRow icon="smartphone" label={`${s.trustedDevices.length} aparelho(s)`} sub="Sem código por 30 dias · toque para remover" onClick={() => run(() => api('DELETE', '/security/trusted-devices'), 'Aparelhos removidos.')} /></div>
              : <p className="hint-line">Nenhum. O código é pedido a cada entrada.</p>}
          </>}
          <div className="actions one"><button className="btn soft" onClick={() => navigate('/senha')}><Icon n="key-round" />Alterar senha</button></div>
        </>);
      }}</Load>
    </Page>
  );
}
