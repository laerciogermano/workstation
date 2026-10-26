import { PhoneShell } from '../components/PhoneShell'
import { BottomTabs } from '../components/BottomTabs'
import { usePrototype } from '../state/PrototypeContext'

export function Home() {
  const { user } = usePrototype()

  return (
    <PhoneShell footer={<BottomTabs />}>
      <div className="top-bar">
        <span className="logo-wordmark sm">RoleGo</span>
      </div>
      <div className="home-stub">
        <span className="badge">E01 concluído · stub</span>
        <h2 className="screen-title">Pronto para explorar</h2>
        <p className="screen-sub">
          Onboarding aplicado: {user.eventTypes.join(', ') || 'sem tipos'} em{' '}
          {user.city || 'cidade n/d'}, raio {user.radiusKm} km.
          <br />
          <br />
          A descoberta de eventos (feed / swipe / mapa) entra no <strong>E02</strong>.
        </p>
      </div>
    </PhoneShell>
  )
}
