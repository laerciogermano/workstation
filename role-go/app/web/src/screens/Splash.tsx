import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { BrandSymbol, Slogan, Wordmark } from '../components/Brand'

// Splash do manual: fundo preto, ícone + wordmark com glow + slogan, um único CTA em gradiente.
export function Splash() {
  const navigate = useNavigate()

  return (
    <PhoneShell>
      <div className="spacer" />
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <BrandSymbol size={88} />
        <div style={{ marginTop: 26 }}>
          <Wordmark size={60} glow />
        </div>
        <div style={{ marginTop: 12 }}>
          <Slogan size={13} />
        </div>
        <p className="screen-sub" style={{ margin: '22px 0 0' }}>
          Chega de sofrer para
          <br />
          decidir onde sair.
        </p>
      </div>
      <div className="spacer" />
      <button className="btn btn-primary" onClick={() => navigate('/cadastro')}>
        Começar
      </button>
      <p className="link-row" style={{ marginTop: 14 }}>
        Já tem conta?{' '}
        <button className="link" type="button" onClick={() => navigate('/login')}>
          Entrar
        </button>
      </p>
    </PhoneShell>
  )
}
