import { useState, type FormEvent } from 'react'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { usePrototype } from '../state/PrototypeContext'

export function EditarPerfil() {
  const { user, updateUser } = usePrototype()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    updateUser({ name, email })
    setSaved(true)
  }

  return (
    <PhoneShell>
      <TopBar back="/perfil" title="Editar perfil" />
      <p className="screen-sub">Campos de identidade do E01.</p>

      <form onSubmit={submit}>
        <Field
          label="Nome completo"
          icon="user"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="E-mail"
          icon="mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">
          Salvar
        </button>
      </form>

      {saved && (
        <div className="toast" role="status">
          <Icon name="check" />
          Dados salvos no protótipo (estado local).
        </div>
      )}
    </PhoneShell>
  )
}
