import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
import { usePrototype } from '../state/PrototypeContext'

const MIN_KM = 1
const MAX_KM = 100

export function OnboardingRaio() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const initial = Math.min(MAX_KM, Math.max(MIN_KM, user.radiusKm || 20))
  const [radiusKm, setRadiusKm] = useState(initial)
  const fill = ((radiusKm - MIN_KM) / (MAX_KM - MIN_KM)) * 100

  function finish() {
    updateUser({ radiusKm, onboarded: true, loggedIn: true })
    navigate('/home')
  }

  return (
    <PhoneShell accent="cyan">
      <TopBar back="/onboarding/localizacao" />
      <h2 className="screen-title">Raio de busca</h2>
      <p className="screen-sub">Até onde quer ver eventos? De {MIN_KM} a {MAX_KM} km. Você pode mudar depois.</p>

      <div className="field" style={{ marginBottom: 8 }}>
        <label htmlFor="raio" className="range-head">
          Raio de busca
          <b>{radiusKm} km</b>
        </label>
        <input
          id="raio"
          className="range"
          type="range"
          min={MIN_KM}
          max={MAX_KM}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          style={{ ['--fill' as string]: `${fill}%` }}
          aria-valuemin={MIN_KM}
          aria-valuemax={MAX_KM}
          aria-valuenow={radiusKm}
        />
        <div className="range-scale">
          <span>{MIN_KM} km</span>
          <span>{MAX_KM} km</span>
        </div>
      </div>

      <div className="toast">
        <Icon name="pin" />
        <span>
          Preferências: {user.eventTypes.join(', ') || '—'} · {user.city || '—'} ·{' '}
          {user.locationGranted ? 'GPS ok' : 'GPS pendente'}
        </span>
      </div>

      <div className="spacer" />
      <button className="btn btn-primary" onClick={finish}>
        Concluir onboarding
      </button>
    </PhoneShell>
  )
}
