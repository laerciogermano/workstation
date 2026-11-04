import { ConsentBody, type Me, type Providers, RegisterBody, ResetBody } from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type JSX, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { safeNext } from '../../app/guards';
import { api, ApiError, errorMessage } from '../../lib/http';
import { t } from '../../lib/i18n/pt-BR';
import { setMe } from '../../lib/queries';
import { Icon } from '../../ui/Icon';
import { Screen, TopBar } from '../../ui/layout';
import { Button, Checkbox, EmptyState, TextInput, Title, ui, Wordmark } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import s from './auth.module.css';

type View = 'splash' | 'register' | 'login' | 'forgot' | 'reset' | 'verify' | 'consent' | 'google';

export default function AuthRoutes({ view }: { view: View }): JSX.Element {
  switch (view) {
    case 'splash':
      return <Splash />;
    case 'register':
      return <Register />;
    case 'login':
      return <Login />;
    case 'forgot':
      return <Forgot />;
    case 'reset':
      return <Reset />;
    case 'verify':
      return <VerifyEmail />;
    case 'consent':
      return <Consent />;
    case 'google':
      return <GoogleCallback />;
  }
}

/** Depois de autenticar: onboarding pendente vai para o passo certo; senão, o destino pedido. */
function useAfterAuth() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const loc = useLocation();
  return (me: Me) => {
    setMe(qc, me);
    if (me.needsConsent) nav('/consentimento', { replace: true });
    else if (!me.onboarded) nav('/onboarding/tipos', { replace: true });
    else nav(safeNext(loc.search), { replace: true });
  };
}

const useProviders = () => useQuery({ queryKey: ['providers'], queryFn: () => api<Providers>('/auth/providers'), staleTime: Infinity });

function GoogleButton(): JSX.Element | null {
  const { data } = useProviders();
  if (!data?.google) return null;
  const start = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('rg_oauth_state', state);
    const p = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
      redirect_uri: `${location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    location.href = `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  };
  return (
    <>
      <Button variant="secondary" className={s.social} onClick={start} icon="google">
        {t.continueGoogle}
      </Button>
      <div className={ui.divider}>{t.or}</div>
    </>
  );
}

function Splash(): JSX.Element {
  const nav = useNavigate();
  return (
    <div className={s.splash}>
      <div className={s.bg} aria-hidden />
      <Wordmark size={64} glow />
      <p className={s.slogan}>{t.slogan}</p>
      <p className={s.tagline}>{t.tagline}</p>
      <div className={s.actions}>
        <Button onClick={() => nav('/cadastro')}>{t.start}</Button>
        <Button variant="ghost" onClick={() => nav('/entrar')}>
          {t.haveAccount}
        </Button>
      </div>
    </div>
  );
}

function fieldErrors(e: unknown): Record<string, string> {
  if (e instanceof ApiError && e.problem.errors) return Object.fromEntries(e.problem.errors.map((x) => [x.path, x.message]));
  return {};
}

function Register(): JSX.Element {
  const after = useAfterAuth();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '', passwordConfirm: '', acceptTerms: false, adult: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({ mutationFn: (body: unknown) => api<Me>('/auth/register', { method: 'POST', body }), onSuccess: after });
  const ready = f.email && f.password.length >= 8 && f.password === f.passwordConfirm && f.acceptTerms && f.adult;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = RegisterBody.safeParse(f);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }
    setErrors({});
    m.mutate(r.data);
  };
  const apiErrors = fieldErrors(m.error);
  const generic = m.error && !Object.keys(apiErrors).length ? errorMessage(m.error) : undefined;
  return (
    <Screen title={t.createAccount}>
      <TopBar />
      <Title accent="cyan">{t.createAccount}</Title>
      <p className={ui.sub}>Leva menos de um minuto.</p>
      <GoogleButton />
      <form className={s.form} onSubmit={submit} noValidate>
        <TextInput label={t.email} type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors['email'] ?? apiErrors['email'] ?? (m.error instanceof ApiError && m.error.code === 'EMAIL_TAKEN' ? errorMessage(m.error) : undefined)} />
        <TextInput label={t.password} type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} hint="Mínimo de 8 caracteres" error={errors['password'] ?? apiErrors['password']} />
        <TextInput label={t.passwordConfirm} type="password" autoComplete="new-password" value={f.passwordConfirm} onChange={(e) => setF({ ...f, passwordConfirm: e.target.value })} error={errors['passwordConfirm'] ?? (f.passwordConfirm && f.password !== f.passwordConfirm ? 'As senhas não conferem' : undefined)} />
        <Checkbox checked={f.acceptTerms} onChange={(v) => setF({ ...f, acceptTerms: v })}>
          Li e aceito os <a href="/termos" target="_blank">Termos de Uso</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>
        </Checkbox>
        <Checkbox checked={f.adult} onChange={(v) => setF({ ...f, adult: v })}>
          {t.adult}
        </Checkbox>
        {generic && !(m.error instanceof ApiError && m.error.code === 'EMAIL_TAKEN') ? <p className={`${ui.hint} ${ui.hintErr}`} role="alert">{generic}</p> : null}
        <Button type="submit" className={ui.mt8} disabled={!ready} loading={m.isPending}>
          {t.createAccount}
        </Button>
      </form>
      <p className={`${ui.textCenter} ${ui.small} ${ui.mt16} ${ui.soft}`}>
        Já tem conta? <Link className={ui.link} to={`/entrar${loc.search}`}>{t.login}</Link>
      </p>
    </Screen>
  );
}

function Login(): JSX.Element {
  const after = useAfterAuth();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const m = useMutation({ mutationFn: () => api<Me>('/auth/login', { method: 'POST', body: f }), onSuccess: after });
  return (
    <Screen title={t.login}>
      <TopBar />
      <div className={s.head}>
        <Wordmark size={40} glow />
      </div>
      <Title accent="cyan">{t.login}</Title>
      <GoogleButton />
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <TextInput label={t.email} type="email" autoComplete="username webauthn" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <TextInput label={t.password} type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {m.error ? <p className={`${ui.hint} ${ui.hintErr} ${ui.mb12}`} role="alert">{errorMessage(m.error)}</p> : null}
        <Button type="submit" disabled={!f.email || !f.password} loading={m.isPending}>
          {t.login}
        </Button>
      </form>
      <Link to="/recuperar-senha" className={`${ui.link} ${ui.small}`} style={{ display: 'block', textAlign: 'center', marginTop: 18 }}>
        {t.forgot}
      </Link>
      <p className={`${ui.textCenter} ${ui.small} ${ui.mt16} ${ui.soft}`}>
        Novo por aqui? <Link className={ui.link} to={`/cadastro${loc.search}`}>{t.createAccount}</Link>
      </p>
    </Screen>
  );
}

function Forgot(): JSX.Element {
  const [email, setEmail] = useState('');
  const m = useMutation({ mutationFn: () => api('/auth/password/forgot', { method: 'POST', body: { email } }) });
  return (
    <Screen title="Recuperar senha">
      <TopBar />
      <Title accent="cyan">Recuperar senha</Title>
      {m.isSuccess ? (
        <EmptyState icon="mail" title="Confira seu e-mail" hint="Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. O link vale 1 hora." />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <p className={ui.sub}>Digite o e-mail da sua conta e enviamos um link para criar uma senha nova.</p>
          <TextInput label={t.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {m.error ? <p className={`${ui.hint} ${ui.hintErr} ${ui.mb12}`}>{errorMessage(m.error)}</p> : null}
          <Button type="submit" disabled={!email} loading={m.isPending}>
            Enviar link
          </Button>
        </form>
      )}
    </Screen>
  );
}

function Reset(): JSX.Element {
  const [params] = useSearchParams();
  const after = useAfterAuth();
  const toast = useToast();
  const [f, setF] = useState({ password: '', passwordConfirm: '' });
  const m = useMutation({
    mutationFn: (body: unknown) => api<Me>('/auth/password/reset', { method: 'POST', body }),
    onSuccess: (me) => {
      toast.show('Senha alterada. As outras sessões foram encerradas.');
      after(me);
    },
  });
  const token = params.get('token') ?? '';
  const parsed = ResetBody.safeParse({ token, ...f });
  return (
    <Screen title="Redefinir senha">
      <TopBar back={false} />
      <Title accent="cyan">Nova senha</Title>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (parsed.success) m.mutate(parsed.data);
        }}
      >
        <TextInput label="Nova senha" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} hint="Mínimo de 8 caracteres" />
        <TextInput label={t.passwordConfirm} type="password" autoComplete="new-password" value={f.passwordConfirm} onChange={(e) => setF({ ...f, passwordConfirm: e.target.value })} error={f.passwordConfirm && f.password !== f.passwordConfirm ? 'As senhas não conferem' : undefined} />
        {m.error ? (
          <p className={`${ui.hint} ${ui.hintErr} ${ui.mb12}`} role="alert">
            {errorMessage(m.error)} {m.error instanceof ApiError && m.error.code === 'TOKEN_INVALID' ? <Link className={ui.link} to="/recuperar-senha">Pedir novo link</Link> : null}
          </p>
        ) : null}
        <Button type="submit" disabled={!parsed.success} loading={m.isPending}>
          Salvar nova senha
        </Button>
      </form>
    </Screen>
  );
}

function VerifyEmail(): JSX.Element {
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const token = params.get('token') ?? '';
  const m = useMutation({ mutationFn: () => api('/auth/email/verify', { method: 'POST', body: { token } }), onSuccess: () => void qc.invalidateQueries({ queryKey: ['me'] }) });
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current && token) {
      fired.current = true;
      m.mutate();
    }
  }, [token, m]);
  return (
    <Screen title="Confirmar e-mail">
      <div className={s.verify}>
        {m.isPending ? <EmptyState icon="mail" title="Confirmando…" /> : null}
        {m.isSuccess ? <EmptyState icon="check" title="E-mail confirmado!" hint="Agora você pode publicar rolês." action={<Button onClick={() => nav('/explorar')}>Explorar</Button>} /> : null}
        {m.isError ? <EmptyState icon="x" title="Link inválido" hint={errorMessage(m.error)} action={<Button variant="secondary" onClick={() => nav('/perfil')}>Ir para o perfil</Button>} /> : null}
      </div>
    </Screen>
  );
}

/** "Só mais uma coisa": aceite dos termos e 18+ após OAuth (US-01.02). */
function Consent(): JSX.Element {
  const after = useAfterAuth();
  const [f, setF] = useState({ acceptTerms: false, adult: false });
  const m = useMutation({ mutationFn: (body: unknown) => api<Me>('/auth/consent', { method: 'POST', body }), onSuccess: after });
  const parsed = ConsentBody.safeParse(f);
  return (
    <Screen title="Só mais uma coisa">
      <Title accent="cyan">Só mais uma coisa</Title>
      <p className={ui.sub}>Para usar o RoleGo, confirme:</p>
      <Checkbox checked={f.acceptTerms} onChange={(v) => setF({ ...f, acceptTerms: v })}>
        {t.acceptTerms}
      </Checkbox>
      <Checkbox checked={f.adult} onChange={(v) => setF({ ...f, adult: v })}>
        {t.adult}
      </Checkbox>
      <Button className={ui.mt16} disabled={!parsed.success} loading={m.isPending} onClick={() => parsed.success && m.mutate(parsed.data)}>
        {t.next}
      </Button>
    </Screen>
  );
}

function GoogleCallback(): JSX.Element {
  const [params] = useSearchParams();
  const after = useAfterAuth();
  const m = useMutation({ mutationFn: (code: string) => api<Me>('/auth/google', { method: 'POST', body: { code, redirectUri: `${location.origin}/auth/google/callback` } }), onSuccess: after });
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const code = params.get('code');
    const okState = params.get('state') === sessionStorage.getItem('rg_oauth_state');
    if (code && okState) m.mutate(code);
  }, [params, m]);
  return (
    <Screen title="Entrando">
      {m.isError ? <EmptyState icon="x" title="Não deu certo" hint={errorMessage(m.error)} action={<Link className={ui.link} to="/entrar">Voltar</Link>} /> : <EmptyState icon="user" title="Entrando com Google…" />}
      <Icon name="google" size="s" />
    </Screen>
  );
}

/** Termos de Uso e Política de Privacidade (rascunho do beta; texto final com o jurídico — BETA-606). */
export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }): JSX.Element {
  return (
    <Screen title={kind === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}>
      <TopBar />
      <Title>{kind === 'terms' ? 'Termos de Uso' : 'Privacidade'}</Title>
      {kind === 'terms' ? (
        <div className={`${ui.small} ${ui.soft}`} style={{ display: 'grid', gap: 12 }}>
          <p>O RoleGo é uma plataforma para descobrir e divulgar eventos. No beta não há venda de ingressos: valores são informativos e links externos são de responsabilidade do organizador.</p>
          <p>Você declara ter 18 anos ou mais. Não publique conteúdo falso, ofensivo, ilegal ou que viole direitos de terceiros. Conteúdo denunciado pode ser removido e contas podem ser suspensas.</p>
          <p>Organizadores são responsáveis pelas informações e pela realização dos seus eventos.</p>
        </div>
      ) : (
        <div className={`${ui.small} ${ui.soft}`} style={{ display: 'grid', gap: 12 }}>
          <p>Coletamos e-mail, nome, foto (opcional), preferências de descoberta e, com sua permissão, sua localização aproximada (3 casas decimais, só a última posição) para calcular distâncias. Ela nunca é mostrada a outras pessoas.</p>
          <p>Sua presença em eventos aparece em "Quem vai" se você deixar ligado em Perfil → Privacidade.</p>
          <p>Você pode excluir sua conta a qualquer momento: anonimizamos seus dados e apagamos suas fotos. Contato: privacidade@rolego.com.br.</p>
        </div>
      )}
    </Screen>
  );
}
