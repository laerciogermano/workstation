import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { api, errorMessage } from '../api/client'
import { homeFor, useAuth } from '../state/AuthContext'

export function RedefinirSenha() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(token ? '' : 'Link inválido. Peça um novo em “Esqueci minha senha”.')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError('Senha mínima: 6 caracteres.')
    if (password !== confirm) return setError('Confirmação de senha não confere.')
    setError('')
    setBusy(true)
    try {
      const { user } = await api.resetPassword(token, password, confirm)
      setUser(user)
      navigate(homeFor(user), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <PhoneShell>
      <TopBar back="/login" />
      <h2 className="screen-title">Nova senha</h2>
      <p className="screen-sub">Escolha uma nova senha para a sua conta.</p>

      <form onSubmit={submit}>
        <Field
          label="Nova senha (mín. 6 caracteres)"
          icon="lock"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••"
          autoComplete="new-password"
          disabled={!token}
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
          disabled={!token}
        />
        <ErrorToast message={error} />
        <button className="btn btn-primary" type="submit" disabled={busy || !token}>
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="link-row">
        <button className="link" type="button" onClick={() => navigate('/recuperar-senha')}>
          Pedir novo link
        </button>
      </p>
    </PhoneShell>
  )
}
