import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { usePrototype } from '../state/PrototypeContext'

export function Cadastro() {
  const navigate = useNavigate()
  const { updateUser } = usePrototype()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Senha mínima: 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Confirmação de senha não confere.')
      return
    }
    updateUser({
      name: '',
      email,
      loggedIn: true,
      onboarded: false,
    })
    navigate('/onboarding/preferencias')
  }

  function social(provider: string) {
    updateUser({
      name: `Usuário ${provider}`,
      email: email || `demo@${provider.toLowerCase()}.com`,
      loggedIn: true,
      onboarded: false,
    })
    navigate('/onboarding/preferencias')
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
        {error && (
          <div className="toast m" role="alert">
            <Icon name="x" />
            {error}
          </div>
        )}
        <button className="btn btn-primary" type="submit" style={{ marginTop: 8 }}>
          Criar Conta
        </button>
      </form>

      <div className="divider">ou cadastre-se com</div>
      <div className="stack-gap">
        <button className="btn btn-secondary" type="button" onClick={() => social('Google')}>
          Continuar com Google
        </button>
        <button className="btn btn-secondary m" type="button" onClick={() => social('Apple')}>
          Continuar com Apple
        </button>
      </div>
      <p className="link-row">
        Já tem conta?{' '}
        <button className="link" type="button" onClick={() => navigate('/login')}>
          Entrar
        </button>
      </p>
    </PhoneShell>
  )
}
