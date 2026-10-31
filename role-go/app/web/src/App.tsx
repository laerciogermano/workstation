import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, PublicOnly } from './components/Guards'
import { Splash } from './screens/Splash'
import { Cadastro } from './screens/Cadastro'
import { Login } from './screens/Login'
import { RecuperarSenha } from './screens/RecuperarSenha'
import { RedefinirSenha } from './screens/RedefinirSenha'
import { OnboardingPreferencias } from './screens/OnboardingPreferencias'
import { OnboardingCidade } from './screens/OnboardingCidade'
import { OnboardingLocalizacao } from './screens/OnboardingLocalizacao'
import { OnboardingRaio } from './screens/OnboardingRaio'
import { Home } from './screens/Home'
import { Perfil } from './screens/Perfil'
import { EditarPerfil } from './screens/EditarPerfil'
import { FotoPerfil } from './screens/FotoPerfil'

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/" element={<Splash />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        </Route>
        {/* aberto com ou sem sessão: o link chega por e-mail */}
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        <Route element={<RequireAuth />}>
          <Route path="/onboarding/preferencias" element={<OnboardingPreferencias />} />
          <Route path="/onboarding/cidade" element={<OnboardingCidade />} />
          <Route path="/onboarding/localizacao" element={<OnboardingLocalizacao />} />
          <Route path="/onboarding/raio" element={<OnboardingRaio />} />
        </Route>

        <Route element={<RequireAuth onboarded />}>
          <Route path="/home" element={<Home />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} />
          <Route path="/perfil/foto" element={<FotoPerfil />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
