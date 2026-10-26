import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'

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
      <TopBar back="/login" />
      <h2 className="screen-title">Recuperar acesso</h2>
      <p className="screen-sub">
        Enviaremos um link de redefinição de senha para o e-mail da conta.
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
        />
        <button className="btn btn-primary" type="submit">
          Enviar link
        </button>
      </form>

      {sent && (
        <div className="toast" role="status">
          <Icon name="mail" />
          <span>
            Link de redefinição enviado para <b className="hl-c">{email}</b> (protótipo, sem backend).
          </span>
        </div>
      )}

      <p className="link-row">
        <button className="link" type="button" onClick={() => navigate('/login')}>
          Voltar ao login
        </button>
      </p>
    </PhoneShell>
  )
}
