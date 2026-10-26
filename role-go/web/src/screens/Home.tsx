import { PhoneShell } from '../components/PhoneShell'
import { BottomTabs } from '../components/BottomTabs'
import { TopBar } from '../components/Brand'
import { Icon } from '../components/Icon'
import { usePrototype } from '../state/PrototypeContext'

export function Home() {
  const { user } = usePrototype()

  return (
    <PhoneShell footer={<BottomTabs />}>
      <TopBar
        action={
          <span className="badge c">
            <Icon name="pin" size={12} />
            {user.city || 'cidade n/d'} · {user.radiusKm} km
          </span>
        }
      />
      <div className="home-hero">
        <span className="badge v">
          <Icon name="spark" size={12} />
          E01 concluído · stub
        </span>
        <h2 className="screen-title">Pronto para explorar</h2>
        <p className="screen-sub" style={{ marginBottom: 0 }}>
          A descoberta de eventos (feed / swipe / mapa) entra no <strong>E02</strong>.
        </p>
      </div>

      <div className="sec-title" style={{ ['--bar' as string]: 'var(--rg-cyan)' }}>
        Onboarding aplicado
      </div>
      <div className="card-list">
        <div className="card acc c">
          <span className="ic">
            <Icon name="flame" size={22} />
          </span>
          <div>
            <h3>Tipos de evento</h3>
            <p>{user.eventTypes.join(', ') || 'sem tipos'}</p>
          </div>
        </div>
        <div className="card acc c">
          <span className="ic">
            <Icon name="pin" size={22} />
          </span>
          <div>
            <h3>Raio de busca</h3>
            <p>
              {user.city || 'cidade n/d'}, raio {user.radiusKm} km
            </p>
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
