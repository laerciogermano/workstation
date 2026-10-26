import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
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
    <PhoneShell>
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/onboarding/preferencias')}>
          ←
        </button>
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <h2 className="screen-title">Sua cidade</h2>
      <p className="screen-sub">Usamos a cidade para priorizar eventos próximos.</p>

      <div className="chips" style={{ marginBottom: 18 }}>
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${city === c && !custom ? ' active' : ''}`}
            onClick={() => {
              setCity(c)
              setCustom('')
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="field">
        <label>Outra cidade</label>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Digite sua cidade"
        />
      </div>

      <div className="spacer" />
      <button className="btn btn-primary" onClick={next}>
        Continuar
      </button>
    </PhoneShell>
  )
}
