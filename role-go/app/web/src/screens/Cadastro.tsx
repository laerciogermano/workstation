import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { SocialButtons } from '../components/SocialButtons'
import { api, errorMessage } from '../api/client'
import { useAuth } from '../state/AuthContext'

export function Cadastro() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError('Senha mínima: 6 caracteres.')
    if (password !== confirm) return setError('Confirmação de senha não confere.')
    setError('')
    setBusy(true)
    try {
      const { user } = await api.register(email.trim(), password, confirm)
      setUser(user)
      navigate('/onboarding/preferencias', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <PhoneShell>
      <TopBar back="/" />
      <h2 className="screen-title">Criar Conta</h2>
      <p className="screen-sub">
        Crie sua conta para descobrir rolês <span className="hl-c">perto de você</span>.
      </p>

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
          label="Senha (mín. 6 caracteres)"
          icon="lock"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••"
          autoComplete="new-password"
        />
        <Field
          label="Confirmar senha"
          icon="lock"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="••••••"
          autoComplete="new-password"
        />
        <ErrorToast message={error} />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
          {busy ? 'Criando…' : 'Criar Conta'}
        </button>
      </form>

      <div className="divider">ou cadastre-se com</div>
      <SocialButtons mode="signup" onError={setError} />
      <p className="link-row">
        Já tem conta?{' '}
        <button className="link" type="button" onClick={() => navigate('/login')}>
          Entrar
        </button>
      </p>
    </PhoneShell>
  )
}
