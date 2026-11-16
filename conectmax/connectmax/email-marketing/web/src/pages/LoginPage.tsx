import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ErrorNote } from '../components/ui.tsx';
import { api } from '../lib/api.ts';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/campanhas', { replace: true });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    login.mutate();
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.svg" alt="Connect" height={30} />
        <h1>E-mail marketing</h1>
        <div className="field">
          <label htmlFor={emailId}>E-mail</label>
          <input id={emailId} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={passwordId}>Senha</label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorNote error={login.error} />
        <button type="submit" className="btn btn-primary btn-block" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
