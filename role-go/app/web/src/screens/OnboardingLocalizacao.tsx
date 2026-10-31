import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { ErrorToast } from '../components/ErrorToast'
import { api } from '../api/client'
import { useSave } from '../state/useSave'

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Este navegador não oferece localização.'))
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, maximumAge: 60000 })
  })
}

// Radar do manual: anéis ciano + pings coloridos representando o raio de busca.
function Radar() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="56" stroke="rgba(0,229,229,.25)" />
      <circle cx="60" cy="60" r="38" stroke="rgba(0,229,229,.35)" />
      <circle cx="60" cy="60" r="20" stroke="rgba(0,229,229,.5)" />
      <path d="M60 60 L100 20 A56 56 0 0 1 116 60 Z" fill="rgba(0,229,229,.22)" />
      <circle cx="60" cy="60" r="5" fill="#00E5E5" />
      <circle cx="88" cy="38" r="4" fill="#FF1F7A" />
      <circle cx="38" cy="84" r="3" fill="#FFCC00" />
    </svg>
  )
}

export function OnboardingLocalizacao() {
  const navigate = useNavigate()
  const { save, busy, error, setError } = useSave()
  const [asking, setAsking] = useState(false)

  async function allow() {
    setError('')
    setAsking(true)
    let pos: GeolocationPosition
    try {
      pos = await currentPosition()
    } catch {
      setAsking(false)
      setError('Localização não liberada. Ative nas permissões do navegador ou toque em “Agora não”.')
      return
    }
    setAsking(false)
    const { latitude, longitude } = pos.coords
    if (await save(() => api.updatePreferences({ locationGranted: true, latitude, longitude }))) {
      navigate('/onboarding/raio')
    }
  }

  async function skip() {
    if (await save(() => api.updatePreferences({ locationGranted: false }))) {
      navigate('/onboarding/raio')
    }
  }

  return (
    <PhoneShell accent="cyan">
      <TopBar back="/onboarding/cidade" />
      <h2 className="screen-title">Permitir localização</h2>
      <p className="screen-sub">
        O RoleGo precisa da sua localização para mostrar eventos{' '}
        <span className="hl-c">perto de você</span>.
      </p>

      <div className="radar-card">
        <Radar />
        <h3>Radar dinâmico</h3>
        <p>Eventos no raio configurado, atualizados conforme você se move.</p>
      </div>

      <ErrorToast message={error} />
      <div className="spacer" />
      <div className="stack-gap">
        <button className="btn btn-primary" disabled={busy || asking} onClick={allow}>
          {asking ? 'Aguardando permissão…' : 'Permitir sempre'}
        </button>
        <button className="btn btn-ghost" disabled={busy || asking} onClick={skip}>
          Agora não
        </button>
      </div>
    </PhoneShell>
  )
}
