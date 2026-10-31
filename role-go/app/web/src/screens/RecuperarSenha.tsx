import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { Icon } from '../components/Icon'
import { api, errorMessage } from '../api/client'

export function RecuperarSenha() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.forgotPassword(email.trim())
      setSent(email.trim())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
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
          autoComplete="email"
        />
        <ErrorToast message={error} />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>

      {sent && (
        <div className="toast" role="status">
          <Icon name="mail" />
          <span>
            Se houver uma conta com <b className="hl-c">{sent}</b>, o link chega em instantes. Ele vale por 1
            hora.
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
