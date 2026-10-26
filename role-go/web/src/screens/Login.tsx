import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

export function Login() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const [email, setEmail] = useState(user.email || '')
  const [password, setPassword] = useState('')

  function goIn(onboarded = user.onboarded) {
    updateUser({
      loggedIn: true,
      email: email || user.email,
      name: user.name || 'Você',
      onboarded,
    })
    navigate(onboarded ? '/home' : '/onboarding/preferencias')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    goIn()
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Entrar</h2>
      <p className="screen-sub">Entre na sua conta com e-mail ou social.</p>

      <form onSubmit={submit}>
        <div className="field">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="voce@email.com"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
      </form>

      <p className="link-row">
        <button
          className="btn-ghost"
          style={{ width: 'auto', display: 'inline', padding: 0, color: 'var(--cyan)' }}
          onClick={() => navigate('/recuperar-senha')}
        >
          Esqueci minha senha
        </button>
      </p>

      <div className="divider">ou</div>
      <div className="stack-gap">
        <button className="btn btn-secondary" type="button" onClick={() => goIn()}>
          Login com Google
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => goIn()}>
          Login com Apple
        </button>
      </div>

      <p className="link-row">
        Novo aqui?{' '}
        <button
          className="btn-ghost"
          style={{ width: 'auto', display: 'inline', padding: 0, color: 'var(--cyan)' }}
          onClick={() => navigate('/cadastro')}
        >
          Criar conta
        </button>
      </p>
    </PhoneShell>
  )
}
