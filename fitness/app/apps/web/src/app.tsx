import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { isApiError } from './lib/api';
import { useMe } from './lib/queries';
import { SessionProvider, useSession } from './lib/session';
import { BodyCompare, BodyMeasure, BodyPhoto, BodyTimeline } from './screens/body';
import { DietClose, DietIncomplete, DietMeal, DietPantry, DietPlanScreen } from './screens/diet';
import { GymDetail, GymsNearby } from './screens/gyms';
import { NewDevice } from './screens/new-device';
import { Offline } from './screens/offline';
import { OnboardingRoutes } from './screens/onboarding';
import { InsightsScreen, ProgressScreen } from './screens/progress';
import { CharacterCreate, CharacterPrivacy, CharacterSearch, PublicProfile, Vitrine } from './screens/social';
import { Today } from './screens/today';
import { ExerciseDetail, SessionDone, TrainingDay } from './screens/training';
import { Welcome } from './screens/welcome';
import { You } from './screens/you';
import { ErrorState, ToastProvider, Wordmark } from './ui/kit';

/** RN-02: sem onboarding, dashboard/dieta/treino/avaliação ficam bloqueados. */
function Gate({ children }: { children: ReactNode }) {
  const { onboarded } = useSession();
  return onboarded ? children : <Navigate to="/bem-vindo" replace />;
}
/** RNF-08: vitrine, busca e academias precisam de rede. */
function Net({ children }: { children: ReactNode }) {
  const { online } = useSession();
  return online ? children : <Offline />;
}

function Shell() {
  const loc = useLocation();
  const { online } = useSession();
  const dark = loc.pathname === '/corpo/foto';
  return (
    <div className={`scr${dark ? ' is-dark' : ''}`}>
      {!online && !dark && (
        <div className="offline-bar" role="status">
          Sem internet · registros ficam salvos e sincronizam depois
        </div>
      )}
      <ToastProvider>
        <Routes>
          <Route path="/bem-vindo" element={<Welcome />} />
          <Route path="/comecar/*" element={<OnboardingRoutes />} />
          <Route
            path="/"
            element={
              <Gate>
                <Today />
              </Gate>
            }
          />
          <Route
            path="/progresso"
            element={
              <Gate>
                <ProgressScreen />
              </Gate>
            }
          />
          <Route
            path="/insights"
            element={
              <Gate>
                <InsightsScreen />
              </Gate>
            }
          />
          <Route
            path="/dieta"
            element={
              <Gate>
                <DietPlanScreen />
              </Gate>
            }
          />
          <Route
            path="/dieta/estoque"
            element={
              <Gate>
                <DietPantry />
              </Gate>
            }
          />
          <Route
            path="/dieta/refeicao/:mealId"
            element={
              <Gate>
                <DietMeal />
              </Gate>
            }
          />
          <Route
            path="/dieta/fechar"
            element={
              <Gate>
                <DietClose />
              </Gate>
            }
          />
          <Route
            path="/dieta/incompleto"
            element={
              <Gate>
                <DietIncomplete />
              </Gate>
            }
          />
          <Route
            path="/treino"
            element={
              <Gate>
                <TrainingDay />
              </Gate>
            }
          />
          <Route
            path="/treino/exercicio/:exerciseId"
            element={
              <Gate>
                <ExerciseDetail />
              </Gate>
            }
          />
          <Route
            path="/treino/concluido"
            element={
              <Gate>
                <SessionDone />
              </Gate>
            }
          />
          <Route
            path="/corpo"
            element={
              <Gate>
                <BodyTimeline />
              </Gate>
            }
          />
          <Route
            path="/corpo/medir"
            element={
              <Gate>
                <BodyMeasure />
              </Gate>
            }
          />
          <Route
            path="/corpo/foto"
            element={
              <Gate>
                <BodyPhoto />
              </Gate>
            }
          />
          <Route
            path="/corpo/comparar"
            element={
              <Gate>
                <BodyCompare />
              </Gate>
            }
          />
          <Route
            path="/vitrine"
            element={
              <Net>
                <Vitrine />
              </Net>
            }
          />
          <Route
            path="/vitrine/personagem"
            element={
              <Gate>
                <Net>
                  <CharacterCreate />
                </Net>
              </Gate>
            }
          />
          <Route
            path="/vitrine/buscar"
            element={
              <Net>
                <CharacterSearch />
              </Net>
            }
          />
          <Route
            path="/vitrine/privacidade"
            element={
              <Net>
                <CharacterPrivacy />
              </Net>
            }
          />
          <Route
            path="/p/:nick"
            element={
              <Net>
                <PublicProfile />
              </Net>
            }
          />
          <Route
            path="/academias"
            element={
              <Net>
                <GymsNearby />
              </Net>
            }
          />
          <Route
            path="/academias/:gymId"
            element={
              <Net>
                <GymDetail />
              </Net>
            }
          />
          <Route
            path="/voce"
            element={
              <Gate>
                <You />
              </Gate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </div>
  );
}

function Boot() {
  const me = useMe();
  if (me.data) {
    return (
      <SessionProvider me={me.data}>
        <Shell />
      </SessionProvider>
    );
  }
  if (me.error && isApiError(me.error, 'DEVICE_UNKNOWN')) {
    return (
      <div className="scr">
        <NewDevice />
      </div>
    );
  }
  return (
    <div className="scr">
      {me.error ? (
        <div className="body">
          <ErrorState error={me.error} retry={() => void me.refetch()} />
        </div>
      ) : (
        <div className="boot" aria-busy="true">
          <Wordmark size="lg" />
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Boot />
    </BrowserRouter>
  );
}
