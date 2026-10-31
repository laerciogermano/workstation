import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'

export function BottomTabs() {
  return (
    <div className="tabbar">
      <NavLink to="/home" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        <Icon name="flame" size={20} />
        Início
      </NavLink>
      <NavLink to="/perfil" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
        <Icon name="user" size={20} />
        Perfil
      </NavLink>
    </div>
  )
}
