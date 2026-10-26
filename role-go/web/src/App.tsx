import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Splash } from './screens/Splash'
import { Cadastro } from './screens/Cadastro'
import { Login } from './screens/Login'
import { RecuperarSenha } from './screens/RecuperarSenha'
import { OnboardingPreferencias } from './screens/OnboardingPreferencias'
import { OnboardingCidade } from './screens/OnboardingCidade'
import { OnboardingLocalizacao } from './screens/OnboardingLocalizacao'
import { OnboardingRaio } from './screens/OnboardingRaio'
import { Home } from './screens/Home'
import { Perfil } from './screens/Perfil'
import { EditarPerfil } from './screens/EditarPerfil'
import { FotoPerfil } from './screens/FotoPerfil'
import { Amigos } from './screens/Amigos'
import { usePrototype } from './state/PrototypeContext'

const NAV = [
  {
    group: 'Conta',
    items: [
      { to: '/', label: 'Splash' },
      { to: '/cadastro', label: 'Cadastro' },
      { to: '/login', label: 'Login' },
      { to: '/recuperar-senha', label: 'Recuperar senha' },
    ],
  },
  {
    group: 'Onboarding',
    items: [
      { to: '/onboarding/preferencias', label: 'Preferências' },
      { to: '/onboarding/cidade', label: 'Cidade' },
      { to: '/onboarding/localizacao', label: 'Localização' },
      { to: '/onboarding/raio', label: 'Raio' },
    ],
  },
  {
    group: 'App (pós E01)',
    items: [
      { to: '/home', label: 'Home (stub E02)' },
      { to: '/perfil', label: 'Perfil' },
      { to: '/perfil/editar', label: 'Editar perfil' },
      { to: '/perfil/foto', label: 'Foto' },
      { to: '/amigos', label: 'Amigos' },
    ],
  },
]

export default function App() {
  const { resetDemo } = usePrototype()

  return (
    <div className="app-shell">
      <aside className="nav-panel">
        <h1>RoleGo · E01</h1>
        <p>Protótipo frontend — conta, onboarding e perfil.</p>
        <nav>
          {NAV.map((section) => (
            <div key={section.group}>
              <div className="nav-group">{section.group}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button
          className="btn btn-ghost"
          style={{ marginTop: 20 }}
          type="button"
          onClick={resetDemo}
        >
          Resetar estado demo
        </button>
      </aside>

      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/onboarding/preferencias" element={<OnboardingPreferencias />} />
        <Route path="/onboarding/cidade" element={<OnboardingCidade />} />
        <Route path="/onboarding/localizacao" element={<OnboardingLocalizacao />} />
        <Route path="/onboarding/raio" element={<OnboardingRaio />} />
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/editar" element={<EditarPerfil />} />
        <Route path="/perfil/foto" element={<FotoPerfil />} />
        <Route path="/amigos" element={<Amigos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
