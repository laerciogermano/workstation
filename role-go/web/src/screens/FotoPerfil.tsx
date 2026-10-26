import { useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
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
      <TopBar back="/perfil" title="Foto de perfil" />
      <p className="screen-sub">Defina ou altere a foto exibida no seu perfil.</p>

      <div className="avatar" style={{ ['--size' as string]: '148px' }}>
        <div className="avatar-inner">
          {user.photoUrl ? <img src={user.photoUrl} alt="" /> : initial}
        </div>
        <button
          className="avatar-edit"
          type="button"
          aria-label="Escolher foto"
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="camera" size={18} />
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
