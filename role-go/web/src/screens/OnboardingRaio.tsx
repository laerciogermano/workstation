import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { usePrototype } from '../state/PrototypeContext'

const MIN_KM = 1
const MAX_KM = 100

export function OnboardingRaio() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const initial = Math.min(MAX_KM, Math.max(MIN_KM, user.radiusKm || 20))
  const [radiusKm, setRadiusKm] = useState(initial)

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
      <p className="screen-sub">Até onde quer ver eventos? De {MIN_KM} a {MAX_KM} km. Você pode mudar depois.</p>

      <div className="field" style={{ marginBottom: 8 }}>
        <label htmlFor="raio">
          {radiusKm} km
        </label>
        <input
          id="raio"
          type="range"
          min={MIN_KM}
          max={MAX_KM}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          aria-valuemin={MIN_KM}
          aria-valuemax={MAX_KM}
          aria-valuenow={radiusKm}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          <span>{MIN_KM} km</span>
          <span>{MAX_KM} km</span>
        </div>
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
