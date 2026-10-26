import { useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

export function FotoPerfil() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const inputRef = useRef<HTMLInputElement>(null)
  const initial = (user.name || 'V').trim().charAt(0).toUpperCase()

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateUser({ photoUrl: url })
  }

  function clear() {
    updateUser({ photoUrl: null })
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/perfil')}>
          ←
        </button>
        <span className="logo-wordmark sm">Foto de perfil</span>
      </div>
      <p className="screen-sub">Defina ou altere a foto exibida no seu perfil.</p>

      <div className="avatar" style={{ width: 140, height: 140, fontSize: '2.6rem' }}>
        {user.photoUrl ? <img src={user.photoUrl} alt="" /> : initial}
        <button className="avatar-edit" type="button" onClick={() => inputRef.current?.click()}>
          Escolher
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />

      <div className="stack-gap" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          Escolher da galeria
        </button>
        <button className="btn btn-ghost" onClick={clear}>
          Remover foto
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/perfil')}>
          Concluir
        </button>
      </div>
    </PhoneShell>
  )
}
