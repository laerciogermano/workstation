import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

export function OnboardingLocalizacao() {
  const navigate = useNavigate()
  const { updateUser } = usePrototype()

  function allow() {
    updateUser({ locationGranted: true })
    navigate('/onboarding/raio')
  }

  function skip() {
    updateUser({ locationGranted: false })
    navigate('/onboarding/raio')
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/onboarding/cidade')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Permitir localização</h2>
      <p className="screen-sub">
        O RoleGo precisa da sua localização para mostrar eventos perto de você.
      </p>

      <div className="loc-card">
        <div className="loc-icon">📍</div>
        <strong>Radar dinâmico</strong>
        <p className="screen-sub" style={{ marginBottom: 0 }}>
          Eventos no raio configurado, atualizados conforme você se move.
        </p>
      </div>

      <div className="stack-gap">
        <button className="btn btn-primary" onClick={allow}>
          Permitir sempre
        </button>
        <button className="btn btn-ghost" onClick={skip}>
          Agora não
        </button>
      </div>
    </PhoneShell>
  )
}
