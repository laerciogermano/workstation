import { useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { ErrorToast } from '../components/ErrorToast'
import { Icon } from '../components/Icon'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import { useSave } from '../state/useSave'

const MAX_BYTES = 5 * 1024 * 1024

export function FotoPerfil() {
  const navigate = useNavigate()
  const user = useAuth().user!
  const { save, busy, error, setError } = useSave()
  const inputRef = useRef<HTMLInputElement>(null)
  const initial = (user.name || user.email || 'V').trim().charAt(0).toUpperCase()

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_BYTES) return setError('A foto pode ter no máximo 5 MB.')
    await save(() => api.uploadPhoto(file))
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
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="camera" size={18} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={onFile}
      />

      <ErrorToast message={error} />
      <div className="stack-gap" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Enviando…' : 'Escolher da galeria'}
        </button>
        <button
          className="btn btn-ghost"
          disabled={busy || !user.photoUrl}
          onClick={() => save(() => api.deletePhoto())}
        >
          Remover foto
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/perfil')}>
          Concluir
        </button>
      </div>
    </PhoneShell>
  )
}
