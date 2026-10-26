import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

export function Cadastro() {
  const navigate = useNavigate()
  const { updateUser } = usePrototype()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
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
      name,
      email,
      phone,
      loggedIn: true,
      onboarded: false,
    })
    navigate('/onboarding/preferencias')
  }

  function social(provider: string) {
    updateUser({
      name: name || `Usuário ${provider}`,
      email: email || `demo@${provider.toLowerCase()}.com`,
      loggedIn: true,
      onboarded: false,
    })
    navigate('/onboarding/preferencias')
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Criar Conta</h2>
      <p className="screen-sub">Crie sua conta para descobrir rolês perto de você.</p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Nome completo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="voce@email.com"
          />
        </div>
        <div className="field">
          <label>Senha (mín. 6 caracteres)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••"
          />
        </div>
        <div className="field">
          <label>Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••"
          />
        </div>
        <div className="field">
          <label>Telefone (opcional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(41) 99999-9999"
          />
        </div>
        {error && <div className="toast" style={{ color: 'var(--magenta)', borderColor: 'rgba(255,31,122,.4)' }}>{error}</div>}
        <button className="btn btn-primary" type="submit" style={{ marginTop: 8 }}>
          Criar Conta
        </button>
      </form>

      <div className="divider">ou cadastre-se com</div>
      <div className="stack-gap">
        <button className="btn btn-secondary" type="button" onClick={() => social('Google')}>
          Continuar com Google
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => social('Apple')}>
          Continuar com Apple
        </button>
      </div>
      <p className="link-row">
        Já tem conta?{' '}
        <button className="btn-ghost" style={{ width: 'auto', display: 'inline', padding: 0, color: 'var(--cyan)' }} onClick={() => navigate('/login')}>
          Entrar
        </button>
      </p>
    </PhoneShell>
  )
}
