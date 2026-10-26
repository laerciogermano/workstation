import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'

export function Splash() {
  const navigate = useNavigate()

  return (
    <PhoneShell>
      <div className="spacer" />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="logo-wordmark">RoleGo</div>
        <p
          style={{
            marginTop: 16,
            marginBottom: 8,
            fontSize: '1.15rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'var(--gradient)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Viva o Rolê
        </p>
        <p className="screen-sub" style={{ marginTop: 0 }}>
          Chega de sofrer para decidir onde sair.
        </p>
      </div>
      <div className="stack-gap">
        <button className="btn btn-primary" onClick={() => navigate('/cadastro')}>
          Começar
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/login')}>
          Já tem conta? Entrar
        </button>
      </div>
    </PhoneShell>
  )
}
