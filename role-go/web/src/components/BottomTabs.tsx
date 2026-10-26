import { NavLink } from 'react-router-dom'

export function BottomTabs() {
  return (
    <div className="bottom-tabs">
      <NavLink to="/home" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        Início
      </NavLink>
      <NavLink to="/amigos" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        Amigos
      </NavLink>
      <NavLink to="/perfil" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        Perfil
      </NavLink>
    </div>
  )
}
