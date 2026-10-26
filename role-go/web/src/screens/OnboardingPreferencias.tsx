import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
import { usePrototype } from '../state/PrototypeContext'

const OPTIONS = ['Festas', 'Shows', 'Bares', 'Eventos privados', 'Eventos culturais']

export function OnboardingPreferencias() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const [selected, setSelected] = useState<string[]>(user.eventTypes)

  function toggle(opt: string) {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    )
  }

  function next() {
    updateUser({ eventTypes: selected })
    navigate('/onboarding/cidade')
  }

  return (
    <PhoneShell>
      <TopBar />
      <h2 className="screen-title">O que você curte?</h2>
      <p className="screen-sub">Escolha os tipos de evento para personalizar a descoberta.</p>

      <div className="chips" style={{ marginBottom: 28 }}>
        {OPTIONS.map((opt) => {
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

      <div className="spacer" />
      <button className="btn btn-primary" disabled={selected.length === 0} onClick={next}>
        Continuar
      </button>
    </PhoneShell>
  )
}
