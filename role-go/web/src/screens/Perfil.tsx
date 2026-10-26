import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { BottomTabs } from '../components/BottomTabs'
import { usePrototype } from '../state/PrototypeContext'

export function Perfil() {
  const navigate = useNavigate()
  const { user, logout } = usePrototype()
  const initial = (user.name || 'V').trim().charAt(0).toUpperCase()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <PhoneShell footer={<BottomTabs />}>
      <div className="top-bar">
        <span className="logo-wordmark sm">Perfil</span>
        <div className="spacer" />
        <button className="btn-ghost" style={{ width: 'auto', padding: 8 }} onClick={() => navigate('/perfil/editar')}>
          Editar
        </button>
      </div>

      <div className="avatar">
        {user.photoUrl ? <img src={user.photoUrl} alt="" /> : initial}
      </div>
      <h2 className="screen-title" style={{ textAlign: 'center' }}>
        {user.name || 'Você'}
      </h2>
      <p className="screen-sub" style={{ textAlign: 'center', marginBottom: 8 }}>
        {user.city || 'Cidade não definida'}
        <br />
        {user.email || '—'}
      </p>

      <div className="stat-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="stat-card">
          <strong>{user.radiusKm}</strong>
          <span>km raio</span>
        </div>
      </div>

      <div className="stack-gap">
        <button className="btn btn-secondary" onClick={() => navigate('/perfil/editar')}>
          Editar dados
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/perfil/foto')}>
          Alterar foto
        </button>
        <button className="btn btn-danger" onClick={handleLogout}>
          Encerrar sessão
        </button>
      </div>
    </PhoneShell>
  )
}
