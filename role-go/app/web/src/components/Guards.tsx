import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { homeFor, useAuth } from '../state/AuthContext'
import { PhoneShell } from './PhoneShell'
import { BrandSymbol } from './Brand'

function Loading() {
  return (
    <PhoneShell>
      <div className="spacer" />
      <div style={{ textAlign: 'center' }} aria-busy="true">
        <BrandSymbol size={64} />
      </div>
      <div className="spacer" />
    </PhoneShell>
  )
}

// Telas de entrada: quem já tem sessão vai direto pro app/onboarding.
export function PublicOnly() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to={homeFor(user)} replace /> : <Outlet />
}

// Exige sessão; com onboarded=true exige também onboarding concluído.
export function RequireAuth({ onboarded }: { onboarded?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (onboarded && !user.onboarded) return <Navigate to="/onboarding/preferencias" replace />
  return <Outlet />
}
