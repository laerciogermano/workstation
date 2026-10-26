import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
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
        />
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
      </form>

      <p className="link-row">
        <button className="link" type="button" onClick={() => navigate('/recuperar-senha')}>
          Esqueci minha senha
        </button>
      </p>

      <div className="divider">ou</div>
      <div className="stack-gap">
        <button className="btn btn-secondary" type="button" onClick={() => goIn()}>
          Login com Google
        </button>
        <button className="btn btn-secondary m" type="button" onClick={() => goIn()}>
          Login com Apple
        </button>
      </div>

      <p className="link-row">
        Novo aqui?{' '}
        <button className="link" type="button" onClick={() => navigate('/cadastro')}>
          Criar conta
        </button>
      </p>
    </PhoneShell>
  )
}
