import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

export function EditarPerfil() {
  const navigate = useNavigate()
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
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/perfil')}>
          ←
        </button>
        <span className="logo-wordmark sm">Editar perfil</span>
      </div>
      <p className="screen-sub">Campos de identidade do E01.</p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Nome completo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit">
          Salvar
        </button>
      </form>

      {saved && <div className="toast">Dados salvos no protótipo (estado local).</div>}
    </PhoneShell>
  )
}
