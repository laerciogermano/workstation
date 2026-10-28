import { useState } from 'react';
import { BrandLogo, useTheme } from './brand.jsx';
import { setSession } from './auth.js';

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? '/auth';

export default function LoginPage() {
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      setSession(body.accessToken, body.user);
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      window.location.replace(next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(String(err?.message || err));
      setBusy(false);
    }
  }

  return (
    <div className="login-page" data-theme={theme}>
      <div className="login-card">
        <BrandLogo className="logo login-logo" />
        <h1 className="login-title">Entrar</h1>
        <p className="muted login-sub">Painel ConnectMax</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <button
          type="button"
          className="btn btn-secondary login-theme"
          onClick={toggle}
        >
          Tema: {theme === 'noite' ? 'Noite' : 'Dia'}
        </button>
      </div>
    </div>
  );
}
