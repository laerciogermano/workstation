import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { ErrorToast } from '../components/ErrorToast'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'
import { CITIES } from '../state/catalog'
import { useSave } from '../state/useSave'

export function OnboardingCidade() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { save, busy, error } = useSave()
  const saved = user!.city ?? ''
  const isSuggested = CITIES.includes(saved)
  const [city, setCity] = useState(isSuggested ? saved : 'Curitiba')
  const [custom, setCustom] = useState(isSuggested ? '' : saved)

  async function next() {
    if (await save(() => api.updatePreferences({ city: custom.trim() || city }))) {
      navigate('/onboarding/localizacao')
    }
  }

  return (
    <PhoneShell accent="cyan">
      <TopBar back="/onboarding/preferencias" />
      <h2 className="screen-title">Sua cidade</h2>
      <p className="screen-sub">Usamos a cidade para priorizar eventos próximos.</p>

      <div className="chips" style={{ marginBottom: 18 }}>
        {CITIES.map((c) => {
          const on = city === c && !custom.trim()
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              className={`chip${on ? ' active' : ''}`}
              onClick={() => {
                setCity(c)
                setCustom('')
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      <Field
        label="Outra cidade"
        icon="search"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Digite sua cidade"
        maxLength={80}
      />

      <ErrorToast message={error} />
      <div className="spacer" />
      <button className="btn btn-primary" disabled={busy} onClick={next}>
        Continuar
      </button>
    </PhoneShell>
  )
}
