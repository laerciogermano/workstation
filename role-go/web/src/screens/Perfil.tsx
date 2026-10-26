import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { BottomTabs } from '../components/BottomTabs'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
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
      <TopBar
        title="Perfil"
        action={
          <button className="link" type="button" onClick={() => navigate('/perfil/editar')}>
            Editar
          </button>
        }
      />

      <div className="avatar">
        <div className="avatar-inner">
          {user.photoUrl ? <img src={user.photoUrl} alt="" /> : initial}
        </div>
      </div>
      <h2 className="screen-title" style={{ textAlign: 'center', fontSize: '1.5rem' }}>
        {user.name || 'Você'}
      </h2>
      <p className="screen-sub" style={{ textAlign: 'center', marginBottom: 8 }}>
        {user.city || 'Cidade não definida'}
        <br />
        {user.email || '—'}
      </p>

      <div className="card acc c stat-card">
        <span className="ic">
          <Icon name="pin" size={22} />
        </span>
        <div style={{ flex: 1 }}>
          <h3>Raio de busca</h3>
          <p>Eventos até esta distância</p>
        </div>
        <span className="kpi">
          {user.radiusKm}
          <small>km</small>
        </span>
      </div>

      <div className="stack-gap">
        <button className="btn btn-secondary" onClick={() => navigate('/perfil/editar')}>
          <Icon name="edit" size={16} />
          Editar dados
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/perfil/foto')}>
          <Icon name="camera" size={16} />
          Alterar foto
        </button>
        <button className="btn btn-secondary m" onClick={handleLogout}>
          <Icon name="logout" size={16} />
          Encerrar sessão
        </button>
      </div>
    </PhoneShell>
  )
}
