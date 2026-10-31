import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
import { ErrorToast } from '../components/ErrorToast'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import { EVENT_TYPES } from '../state/catalog'
import { useSave } from '../state/useSave'

export function OnboardingPreferencias() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { save, busy, error } = useSave()
  const [selected, setSelected] = useState<string[]>(user!.eventTypes)

  function toggle(opt: string) {
    setSelected((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }

  async function next() {
    if (await save(() => api.updatePreferences({ eventTypes: selected }))) {
      navigate('/onboarding/cidade')
    }
  }

  return (
    <PhoneShell>
      <TopBar />
      <h2 className="screen-title">O que você curte?</h2>
      <p className="screen-sub">Escolha os tipos de evento para personalizar a descoberta.</p>

      <div className="chips" style={{ marginBottom: 28 }}>
        {EVENT_TYPES.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              className={`chip${on ? ' active' : ''}`}
              onClick={() => toggle(opt)}
            >
              {on && <Icon name="check" size={14} />}
              {opt}
            </button>
          )
        })}
      </div>

      <ErrorToast message={error} />
      <div className="spacer" />
      <button className="btn btn-primary" disabled={selected.length === 0 || busy} onClick={next}>
        Continuar
      </button>
    </PhoneShell>
  )
}
