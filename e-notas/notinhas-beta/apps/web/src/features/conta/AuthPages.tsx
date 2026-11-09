import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { api } from '../../lib/api';
import { useAuth, useMe } from '../../lib/queries';
import { ErrorBanner, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { TopBar } from '../../ui/TopBar';
import { Wordmark } from '../../ui/Wordmark';

function strength(p: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
}

/** T-02 criar · T-03 entrar · T-04 recuperar · redefinir — fora do onboarding (só pelo Perfil, listas ou pontos). */
export default function AuthPages() {
  const { modo } = useParams();
  if (modo === 'criar') return <Register />;
  if (modo === 'recuperar') return <Forgot />;
  if (modo === 'redefinir') return <Reset />;
  return <Login />;
}

function Register() {
  const { register } = useAuth();
  const me = useMe();
  const go = useGo();
  const [f, setF] = useState({ name: '', email: '', password: '', accept: false, optIn: false });
  const s = strength(f.password);
  const pending = me.data?.pending;
  async function submit(e: FormEvent) {
    e.preventDefault();
    await register.mutateAsync({ email: f.email, password: f.password, ...(f.name ? { name: f.name } : {}), acceptTerms: true, storeOptIn: f.optIn });
    go('/perfil', { replace: true });
  }
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <TopBar title="Criar conta" />
      {pending && (pending.receipts > 0 || pending.lists > 0 || pending.points > 0) && (
        <div className="merge">
          <Icon name="finger" />
          <span>
            <b>Vai junto para a conta:</b>
            <span className="meta" style={{ display: 'block' }}>
              {pending.receipts} notas · {pending.lists} listas · {pending.points} pontos deste navegador
            </span>
          </span>
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <label className="lbl" htmlFor="name">
          Nome (opcional)
        </label>
        <div className="field">
          <input id="name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} />
        </div>
        <label className="lbl" htmlFor="email">
          E-mail
        </label>
        <div className="field">
          <input id="email" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <label className="lbl" htmlFor="pw">
          Senha
        </label>
        <div className="field">
          <input id="pw" type="password" autoComplete="new-password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        <div className={`pwm s${s}`} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <p className="hint">{f.password.length < 8 ? 'Mínimo de 8 caracteres.' : ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][s]}</p>
        <label className="check">
          <input type="checkbox" checked={f.accept} onChange={(e) => setF({ ...f, accept: e.target.checked })} required />
          <span>
            Li e aceito como o notinhas.shop trata meus dados (LGPD): preços entram no índice sem identificar ninguém.
          </span>
        </label>
        <label className="check">
          <input type="checkbox" checked={f.optIn} onChange={(e) => setF({ ...f, optIn: e.target.checked })} />
          <span>Opcional: deixar as lojas onde compro verem minhas compras e pontos, para bonificações.</span>
        </label>
        <ErrorBanner error={register.error} />
        <button className="btn p mt12" disabled={!f.accept || f.password.length < 8 || !f.email || register.isPending}>
          Criar conta
        </button>
      </form>
      <p className="foot-note">
        Já tem conta? <Link to="/conta/entrar">Entrar</Link>
      </p>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const go = useGo();
  const [f, setF] = useState({ email: '', password: '' });
  async function submit(e: FormEvent) {
    e.preventDefault();
    await login.mutateAsync(f);
    go(-1);
  }
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <TopBar title="" />
      <div className="center mb12">
        <Wordmark className="mt12" />
      </div>
      <form onSubmit={submit}>
        <label className="lbl" htmlFor="email">
          E-mail
        </label>
        <div className="field">
          <input id="email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        </div>
        <label className="lbl" htmlFor="pw">
          Senha
        </label>
        <div className="field">
          <input id="pw" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        </div>
        <ErrorBanner error={login.error} />
        <button className="btn p mt12" disabled={login.isPending}>
          Entrar
        </button>
      </form>
      <Link to="/conta/recuperar" className="btn gh mt8">
        Esqueci a senha
      </Link>
      <p className="foot-note">
        Novo por aqui? <Link to="/conta/criar">Criar conta</Link>
      </p>
    </div>
  );
}

function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  if (sent)
    return (
      <>
        <TopBar title="Recuperar senha" />
        <StateView icon="mail" tone="ok" title="Confira seu e-mail">
          <p>Se existir uma conta com esse e-mail, mandamos um link que vale por 1 hora.</p>
        </StateView>
      </>
    );
  return (
    <>
      <TopBar title="Recuperar senha" />
      <p className="lede">Mandamos um link de uso único para criar uma senha nova.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api('/auth/forgot-password', { method: 'POST', body: { email } });
            setSent(true);
          } catch (x) {
            setErr(x);
          }
        }}
      >
        <div className="field">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" aria-label="E-mail" required />
        </div>
        <ErrorBanner error={err} />
        <button className="btn p mt12">Enviar link</button>
      </form>
    </>
  );
}

function Reset() {
  const [params] = useSearchParams();
  const [pw, setPw] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  if (done)
    return (
      <StateView icon="check" tone="ok" title="Senha alterada">
        <Link to="/conta/entrar" className="btn p sm">
          Entrar
        </Link>
      </StateView>
    );
  return (
    <>
      <TopBar title="Nova senha" />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api('/auth/reset-password', { method: 'POST', body: { token: params.get('token') ?? '', newPassword: pw } });
            setDone(true);
          } catch (x) {
            setErr(x);
          }
        }}
      >
        <div className="field">
          <input type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Nova senha" required />
        </div>
        <ErrorBanner error={err} />
        <button className="btn p mt12" disabled={pw.length < 8}>
          Salvar senha
        </button>
      </form>
    </>
  );
}
