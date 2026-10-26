import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'

export function RecuperarSenha() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/login')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Recuperar acesso</h2>
      <p className="screen-sub">
        Enviaremos um link de redefinição de senha para o e-mail da conta.
      </p>

      <form onSubmit={submit}>
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
        <button className="btn btn-primary" type="submit">
          Enviar link
        </button>
      </form>

      {sent && (
        <div className="toast">
          Link de redefinição enviado para {email} (protótipo — sem backend).
        </div>
      )}

      <p className="link-row">
        <button
          className="btn-ghost"
          style={{ width: 'auto', display: 'inline', padding: 0, color: 'var(--cyan)' }}
          onClick={() => navigate('/login')}
        >
          Voltar ao login
        </button>
      </p>
    </PhoneShell>
  )
}
