import { PhoneShell } from '../components/PhoneShell'
import { BottomTabs } from '../components/BottomTabs'
import { usePrototype } from '../state/PrototypeContext'

export function Amigos() {
  const { friends } = usePrototype()

  return (
    <PhoneShell footer={<BottomTabs />}>
      <div className="top-bar">
        <span className="logo-wordmark sm">Amigos</span>
      </div>
      <p className="screen-sub">Contagem e lista de amigos feitos no app (E01).</p>

      <div className="toast" style={{ marginBottom: 16 }}>
        {friends.length} amigos
      </div>

      <div className="friend-list">
        {friends.map((f) => (
          <div className="friend-item" key={f.id}>
            <div className="friend-avatar">{f.name.charAt(0)}</div>
            <div className="friend-meta">
              <strong>{f.name}</strong>
              <span>{f.status === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}
