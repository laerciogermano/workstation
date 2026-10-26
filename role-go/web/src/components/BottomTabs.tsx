import { NavLink } from 'react-router-dom'

export function BottomTabs() {
  return (
    <div className="bottom-tabs" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <NavLink to="/home" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        Início
      </NavLink>
      <NavLink to="/perfil" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        Perfil
      </NavLink>
    </div>
  )
}
