import { useState, type FormEvent } from 'react'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { Icon } from '../components/Icon'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import { useSave } from '../state/useSave'

export function EditarPerfil() {
  const user = useAuth().user!
  const { save, busy, error } = useSave()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    if (await save(() => api.updateProfile({ name: name.trim(), email: email.trim() }))) setSaved(true)
  }

  return (
    <PhoneShell>
      <TopBar back="/perfil" title="Editar perfil" />
      <p className="screen-sub">Seu nome e e-mail de acesso.</p>

      <form onSubmit={submit}>
        <Field
          label="Nome completo"
          icon="user"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
        />
        <Field
          label="E-mail"
          icon="mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <ErrorToast message={error} />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      {saved && (
        <div className="toast" role="status">
          <Icon name="check" />
          Dados salvos.
        </div>
      )}
    </PhoneShell>
  )
}
