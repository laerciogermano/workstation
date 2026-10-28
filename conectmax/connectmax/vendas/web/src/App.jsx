import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChatCircle, UserPlus } from '@phosphor-icons/react';
import { AppNav, ExtractIcon } from './app-nav.jsx';
import { BrandBar, useTheme } from './brand.jsx';
import {
  ConnectionStatusBadge,
  resolveConnectionStatus,
} from './connection-status.jsx';

const Dashboard = lazy(() => import('./dashboard.jsx'));
const Executivo = lazy(() => import('./executivo.jsx'));
const Mensagens = lazy(() => import('./mensagens.jsx'));
const Funil = lazy(() => import('./funil.jsx'));
const Empresas = lazy(() => import('./empresas.jsx'));
const Agentes = lazy(() => import('./agentes.jsx'));
const Usuarios = lazy(() => import('./usuarios.jsx'));
const Gestores = lazy(() => import('./gestores.jsx'));

const PROFILES_URL = import.meta.env.VITE_PROFILES_URL ?? '/profiles';
const DETAILS_URL =
  import.meta.env.VITE_PROFILE_DETAILS_URL ?? '/profile-details';
const EXTRACT_URL = import.meta.env.VITE_EXTRACT_URL ?? '/extract';
const CONNECTIONS_URL =
  import.meta.env.VITE_LINKEDIN_CONNECTIONS_URL ??
  '/linkedin-base/connections';
const ROBOT_URL = import.meta.env.VITE_LINKEDIN_ROBOT_URL ?? '/linkedin-robot';
const ACTION_ICON = { size: 18, weight: 'thin', 'aria-hidden': true };

function photoSrc(base64) {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;
  return `data:image/png;base64,${base64}`;
}

function formatExtractedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function profileIdFromPath(pathname = window.location.pathname) {
  const m = pathname.match(/^\/profiles\/([^/]+)\/?$/);
  return m?.[1] ?? null;
}

function routeFromPath(pathname = window.location.pathname) {
  if (pathname === '/' || pathname === '') {
    return { name: 'funil', profileId: null };
  }
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return { name: 'dashboard', profileId: null };
  }
  if (pathname === '/executivo' || pathname === '/executivo/') {
    return { name: 'executivo', profileId: null };
  }
  if (pathname === '/mensagens' || pathname === '/mensagens/') {
    return { name: 'mensagens', profileId: null };
  }
  if (pathname === '/funil' || pathname === '/funil/') {
    return { name: 'funil', profileId: null };
  }
  if (pathname === '/empresas' || pathname === '/empresas/') {
    return { name: 'empresas', profileId: null };
  }
  if (pathname === '/agentes' || pathname === '/agentes/') {
    return { name: 'agentes', profileId: null };
  }
  if (pathname === '/usuarios' || pathname === '/usuarios/') {
    return { name: 'usuarios', profileId: null };
  }
  if (pathname === '/gestores' || pathname === '/gestores/') {
    return { name: 'gestores', profileId: null };
  }
  const profileId = profileIdFromPath(pathname);
  if (profileId) return { name: 'profile', profileId };
  return { name: 'funil', profileId: null };
}

function LinkedInLink({ url, className = '' }) {
  if (!url) return null;
  return (
    <a
      className={`linkedin-link ${className}`.trim()}
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      LinkedIn
    </a>
  );
}

function Field({ label, children, className = '' }) {
  if (children == null || children === false || children === '') return null;
  return (
    <div className={`field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <div className="field-value">{children}</div>
    </div>
  );
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <p className="detail-text">{children}</p>
    </section>
  );
}

function ProfilePage({
  profileId,
  cachedProfile,
  onBack,
  onRemoved,
  onMessage,
}) {
  const [profile, setProfile] = useState(cachedProfile ?? null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extractRunning, setExtractRunning] = useState(false);
  const [extractNote, setExtractNote] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionNote, setActionNote] = useState(null);
  const extractForThisRef = useRef(false);

  const loadProfile = useCallback(
    async ({ soft = false } = {}) => {
      if (!profileId) {
        setLoading(false);
        setError('Perfil sem id');
        return;
      }
      if (!soft) {
        setLoading(true);
        setError(null);
      }
      try {
        const [profileRes, detailRes] = await Promise.all([
          fetch(`${PROFILES_URL}/${profileId}`),
          fetch(`${DETAILS_URL}/${profileId}`),
        ]);

        if (profileRes.status === 404) throw new Error('Perfil não encontrado');
        if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`);
        setProfile(await profileRes.json());

        if (detailRes.status === 404) {
          setDetail(null);
        } else if (!detailRes.ok) {
          throw new Error(`HTTP ${detailRes.status}`);
        } else {
          setDetail(await detailRes.json());
        }
      } catch (e) {
        if (!soft) setError(e.message ?? 'Falha ao carregar detalhe');
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    if (cachedProfile?.id === profileId) setProfile(cachedProfile);
    loadProfile({ soft: false });
  }, [profileId, cachedProfile, loadProfile]);

  const linkedInUrl = detail?.profileUrl ?? profile?.profileUrl ?? null;

  const loadConnection = useCallback(async () => {
    if (!profileId && !linkedInUrl) {
      setConnStatus(null);
      return;
    }
    try {
      const params = new URLSearchParams({ limit: '1' });
      if (profileId) params.set('clienteLinkedinId', profileId);
      else if (linkedInUrl) params.set('profileUrl', linkedInUrl);
      const res = await fetch(`${CONNECTIONS_URL}?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      const row = Array.isArray(json?.data)
        ? json.data[0]
        : Array.isArray(json)
          ? json[0]
          : null;
      setConnStatus(row?.status ?? null);
    } catch {
      /* API offline */
    }
  }, [profileId, linkedInUrl]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const connInfo = useMemo(
    () =>
      resolveConnectionStatus({
        status: connStatus,
        inviteStatus:
          detail?.inviteStatus ||
          profile?.inviteStatus ||
          profile?.connection,
      }),
    [
      connStatus,
      detail?.inviteStatus,
      profile?.inviteStatus,
      profile?.connection,
    ],
  );
  const isConnected = connInfo.key === 'connected';
  const canConnect = connInfo.key === 'none' && Boolean(linkedInUrl);

  useEffect(() => {
    let cancelled = false;
    let wasForThis = extractForThisRef.current;
    async function poll() {
      try {
        const res = await fetch(`${EXTRACT_URL}/status`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const running = Boolean(json?.running);
        const sameUrl =
          linkedInUrl &&
          json?.profileUrl &&
          String(json.profileUrl).replace(/\/$/, '') ===
            String(linkedInUrl).replace(/\/$/, '');
        const forThis =
          running &&
          json?.kind === 'detail' &&
          (json?.profileId === profileId || Boolean(sameUrl));
        extractForThisRef.current = forThis;
        setExtractRunning(Boolean(forThis || (running && wasForThis)));
        if (forThis) {
          await loadProfile({ soft: true });
        } else if (wasForThis && !running && json?.exitCode != null) {
          await loadProfile({ soft: true });
          setExtractNote(
            json.exitCode === 0
              ? 'Extração de detalhe concluída'
              : `Extração terminou com código ${json.exitCode}`,
          );
        }
        wasForThis = forThis;
      } catch {
        /* API offline */
      }
    }
    poll();
    const id = window.setInterval(poll, extractRunning ? 4000 : 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [extractRunning, profileId, linkedInUrl, loadProfile]);

  async function startDetailExtract() {
    const url = linkedInUrl;
    if (!url) {
      setExtractNote(
        'Perfil sem URL LinkedIn — grave profileUrl no detail antes de extrair.',
      );
      return;
    }
    setExtractNote(null);
    try {
      const q = new URLSearchParams({ url });
      const res = await fetch(`${EXTRACT_URL}/by-url/start?${q}`);
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 || json?.running) {
        setExtractRunning(true);
        setExtractNote('Extract já em execução');
        return;
      }
      if (!res.ok) {
        const msg =
          json?.message ||
          (Array.isArray(json?.message) ? json.message.join(', ') : null) ||
          `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      extractForThisRef.current = true;
      setExtractRunning(true);
      setExtractNote(
        json?.pid
          ? `Extração por URL iniciada (pid ${json.pid})`
          : 'Extração por URL iniciada',
      );
    } catch (e) {
      setExtractNote(String(e?.message || e));
    }
  }

  async function removeProfile() {
    if (!profileId || removing) return;
    const ok = window.confirm(
      'Remover este perfil da lista de candidatos? (exclusão lógica — a linha permanece no banco)',
    );
    if (!ok) return;
    setRemoving(true);
    setExtractNote(null);
    try {
      const res = await fetch(`${PROFILES_URL}/${profileId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message ||
          (Array.isArray(json?.message) ? json.message.join(', ') : null) ||
          `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      onRemoved?.(profileId);
    } catch (e) {
      setExtractNote(String(e?.message || e));
      setRemoving(false);
    }
  }

  async function startConnect() {
    if (!linkedInUrl || actionBusy || !canConnect) return;
    setActionBusy(true);
    setActionNote(null);
    try {
      const endpoint = `${ROBOT_URL.replace(/\/$/, '')}/connect`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: linkedInUrl }),
        });
      } catch {
        throw new Error(
          `Robot inacessível (${endpoint}). Suba: cd screen-robot/src && npm run linkedin-connect-api`,
        );
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(
          json?.error ||
            json?.warning ||
            `${res.status} ${res.statusText || 'falha ao conectar'}`,
        );
      }
      setActionNote(
        json.warning
          ? `Convite enviado; base: ${json.warning}`
          : 'Convite de conexão enviado',
      );
      await loadConnection();
      await loadProfile({ soft: true });
    } catch (e) {
      setActionNote(String(e?.message || e));
    } finally {
      setActionBusy(false);
    }
  }

  const name = detail?.name ?? profile?.name;
  const avatarImg = detail?.photoBase64 ?? profile?.photoBase64 ?? null;
  const extractedLabel = formatExtractedAt(
    profile?.extractedAt ?? profile?.createdAt,
  );

  return (
    <div className="page page-detail">
      <BrandBar eyebrow="Perfil" />
      <header className="header header-detail">
        <button type="button" className="back" onClick={onBack}>
          ← Voltar
        </button>
        <div className="header-actions">
          {isConnected && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onMessage?.(profileId)}
              disabled={actionBusy || removing || !profileId}
              title="Abrir conversa em Mensagens"
            >
              <ChatCircle className="btn-extract-icon" {...ACTION_ICON} />
              Enviar mensagem
            </button>
          )}
          {canConnect && (
            <button
              type="button"
              className="btn-primary"
              onClick={startConnect}
              disabled={actionBusy || removing}
              title={`Conectar: ${linkedInUrl}`}
            >
              <UserPlus className="btn-extract-icon" {...ACTION_ICON} />
              {actionBusy ? 'Conectando…' : 'Conectar'}
            </button>
          )}
          <button
            type="button"
            className="btn-primary btn-extract"
            onClick={startDetailExtract}
            disabled={extractRunning || removing || !linkedInUrl}
            title={
              linkedInUrl
                ? `Abre no LinkedIn e extrai: ${linkedInUrl}`
                : 'Sem URL LinkedIn neste perfil'
            }
          >
            <ExtractIcon className="btn-extract-icon" />
            {extractRunning ? 'Extraindo…' : 'Extrair informações'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={removeProfile}
            disabled={removing || loading}
            title="Exclusão lógica (deleted_at) — some da lista de candidatos"
          >
            {removing ? 'Removendo…' : 'Remover'}
          </button>
        </div>
      </header>
      {extractNote && <p className="muted">{extractNote}</p>}
      {actionNote && <p className="muted">{actionNote}</p>}

      <article className="profile">
        <div className="profile-media">
          <figure className="media-block">
            <figcaption>Avatar</figcaption>
            {avatarImg ? (
              <img
                className="media-avatar"
                src={photoSrc(avatarImg)}
                alt={name ? `Avatar de ${name}` : 'Avatar'}
              />
            ) : (
              <div className="media-empty" aria-hidden>
                Sem avatar
              </div>
            )}
            <LinkedInLink url={linkedInUrl} />
          </figure>
        </div>

        <div className="profile-body">
          <Field label="Nome">
            <h1>{name ?? '—'}</h1>
          </Field>
          <Field label="Cargo">{detail?.headline ?? profile?.title}</Field>
          <Field label="Nível">
            {detail?.connectionDegree ?? profile?.level}
          </Field>
          <Field label="Conexão">
            <ConnectionStatusBadge
              status={connStatus}
              inviteStatus={
                detail?.inviteStatus ||
                profile?.inviteStatus ||
                profile?.connection
              }
            />
          </Field>
          <Field label="Empresa">{detail?.company ?? profile?.current}</Field>
          <Field label="Local">{detail?.location ?? profile?.city}</Field>
          <Field label="Conexões" className="muted">
            {detail?.connections}
          </Field>
          <Field label="Em comum" className="muted">
            {detail?.mutualConnections ?? profile?.mutualConnections}
          </Field>
          <Field label="Extraído" className="muted">
            {extractedLabel}
          </Field>
          <Field label="LinkedIn">
            {linkedInUrl ? (
              <>
                <LinkedInLink url={linkedInUrl} />
                <span className="linkedin-url"> · {linkedInUrl}</span>
              </>
            ) : null}
          </Field>

          {loading && <p className="muted">Carregando detalhe…</p>}
          {error && <p className="error">Erro: {error}</p>}
          {!loading && !error && !detail && (
            <p className="empty">Detalhe ainda não extraído para este perfil.</p>
          )}

          <Section title="Sobre">{detail?.about}</Section>
          <Section title="Experiência">{detail?.experience}</Section>
          <Section title="Formação">{detail?.education}</Section>
          <Section title="Competências">{detail?.skills}</Section>
        </div>
      </article>
    </div>
  );
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [route, setRoute] = useState(() => routeFromPath());
  const [cachedProfile, setCachedProfile] = useState(null);

  useEffect(() => {
    const onPop = () => {
      setRoute(routeFromPath());
      setCachedProfile(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** `/` (antiga Candidatos) → `/funil`. */
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      window.history.replaceState(null, '', '/funil');
    }
  }, []);

  function openProfile(profile) {
    if (!profile?.id) return;
    setCachedProfile(profile);
    setRoute({ name: 'profile', profileId: profile.id });
    window.history.pushState(null, '', `/profiles/${profile.id}`);
  }

  function goHome() {
    setCachedProfile(null);
    setRoute({ name: 'funil', profileId: null });
    window.history.pushState(null, '', '/funil');
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    goHome();
  }

  function navigate(path) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function openMessages(profileId) {
    if (!profileId) return;
    navigate(`/mensagens?profileId=${encodeURIComponent(profileId)}`);
  }

  const navActive = route.name === 'profile' ? 'funil' : route.name;

  const appNav = (
    <AppNav
      active={navActive}
      onNavigate={navigate}
      onHome={goHome}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );

  function shell(main) {
    return (
      <div className="app-shell">
        {appNav}
        <div className="app-main">{main}</div>
      </div>
    );
  }

  if (route.name === 'mensagens') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-mensagens">
            <p className="muted">Carregando mensagens…</p>
          </div>
        }
      >
        <Mensagens
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          initialProfileId={
            new URLSearchParams(window.location.search).get('profileId') ||
            null
          }
        />
      </Suspense>,
    );
  }

  if (route.name === 'funil') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-funil">
            <p className="muted">Carregando funil…</p>
          </div>
        }
      >
        <Funil
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          onNavigate={navigate}
          onOpenProfile={openProfile}
        />
      </Suspense>,
    );
  }

  if (route.name === 'empresas') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-empresas">
            <p className="muted">Carregando empresas…</p>
          </div>
        }
      >
        <Empresas
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          onNavigate={navigate}
        />
      </Suspense>,
    );
  }

  if (route.name === 'agentes') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-agentes">
            <p className="muted">Carregando agentes…</p>
          </div>
        }
      >
        <Agentes />
      </Suspense>,
    );
  }

  if (route.name === 'usuarios') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-usuarios">
            <p className="muted">Carregando usuários…</p>
          </div>
        }
      >
        <Usuarios />
      </Suspense>,
    );
  }

  if (route.name === 'gestores') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-gestores">
            <p className="muted">Carregando gestores…</p>
          </div>
        }
      >
        <Gestores />
      </Suspense>,
    );
  }

  if (route.name === 'executivo') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-dashboard">
            <p className="muted">Carregando visão executiva…</p>
          </div>
        }
      >
        <Executivo
          onGoHome={goHome}
          onNavigate={navigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>,
    );
  }

  if (route.name === 'dashboard') {
    return shell(
      <Suspense
        fallback={
          <div className="page page-dashboard">
            <p className="muted">Carregando dashboard…</p>
          </div>
        }
      >
        <Dashboard
          onOpenProfile={openProfile}
          onGoHome={goHome}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>,
    );
  }

  if (route.name === 'profile' && route.profileId) {
    return shell(
      <ProfilePage
        profileId={route.profileId}
        cachedProfile={
          cachedProfile?.id === route.profileId ? cachedProfile : null
        }
        onBack={goBack}
        onMessage={openMessages}
        onRemoved={() => goHome()}
      />,
    );
  }

  return shell(
    <Suspense
      fallback={
        <div className="page page-funil">
          <p className="muted">Carregando funil…</p>
        </div>
      }
    >
      <Funil
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={goHome}
        onNavigate={navigate}
        onOpenProfile={openProfile}
      />
    </Suspense>,
  );
}
