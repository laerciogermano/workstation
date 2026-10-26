import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { TopBar } from '../components/Brand'
import { Field } from '../components/Field'
import { usePrototype } from '../state/PrototypeContext'

const CITIES = ['Curitiba', 'São Paulo', 'Rio de Janeiro', 'Florianópolis', 'Porto Alegre']

export function OnboardingCidade() {
  const navigate = useNavigate()
  const { user, updateUser } = usePrototype()
  const [city, setCity] = useState(user.city || 'Curitiba')
  const [custom, setCustom] = useState('')

  function next() {
    updateUser({ city: custom.trim() || city })
    navigate('/onboarding/localizacao')
  }

  return (
    <PhoneShell accent="cyan">
      <TopBar back="/onboarding/preferencias" />
      <h2 className="screen-title">Sua cidade</h2>
      <p className="screen-sub">Usamos a cidade para priorizar eventos próximos.</p>

      <div className="chips" style={{ marginBottom: 18 }}>
        {CITIES.map((c) => {
          const on = city === c && !custom
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
      />

      <div className="spacer" />
      <button className="btn btn-primary" onClick={next}>
        Continuar
      </button>
    </PhoneShell>
  )
}
