import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { SocialButtons } from '../components/SocialButtons'
import { api, errorMessage } from '../api/client'
import { homeFor, useAuth } from '../state/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { user } = await api.login(email.trim(), password)
      setUser(user)
      navigate(homeFor(user), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <PhoneShell>
      <TopBar back="/" />
      <h2 className="screen-title">Entrar</h2>
      <p className="screen-sub">Entre na sua conta com e-mail ou social.</p>

      <form onSubmit={submit}>
        <Field
          label="E-mail"
          icon="mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="voce@email.com"
          autoComplete="email"
        />
        <Field
          label="Senha"
          icon="lock"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••"
          autoComplete="current-password"
        />
        <ErrorToast message={error} />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="link-row">
        <button className="link" type="button" onClick={() => navigate('/recuperar-senha')}>
          Esqueci minha senha
        </button>
      </p>

      <div className="divider">ou</div>
      <SocialButtons mode="login" onError={setError} />

      <p className="link-row">
        Novo aqui?{' '}
        <button className="link" type="button" onClick={() => navigate('/cadastro')}>
          Criar conta
        </button>
      </p>
    </PhoneShell>
  )
}
