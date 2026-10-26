import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

const RADII = [5, 20, 50]

export function OnboardingRaio() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const [radiusKm, setRadiusKm] = useState(user.radiusKm || 20)

  function finish() {
    updateUser({ radiusKm, onboarded: true, loggedIn: true })
    navigate('/home')
  }

  return (
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/onboarding/localizacao')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Raio de busca</h2>
      <p className="screen-sub">Até onde quer ver eventos? Você pode mudar depois.</p>

      <div className="chips" style={{ marginBottom: 24 }}>
        {RADII.map((r) => (
          <button
            key={r}
            type="button"
            className={`chip${radiusKm === r ? ' active' : ''}`}
            onClick={() => setRadiusKm(r)}
          >
            {r} km
          </button>
        ))}
      </div>

      <div className="toast">
        Preferências: {user.eventTypes.join(', ') || '—'} · {user.city || '—'} ·{' '}
        {user.locationGranted ? 'GPS ok' : 'GPS pendente'}
      </div>

      <div className="spacer" />
      <button className="btn btn-primary" onClick={finish}>
        Concluir onboarding
      </button>
    </PhoneShell>
  )
}
