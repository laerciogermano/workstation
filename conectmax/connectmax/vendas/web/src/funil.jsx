import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandBar } from './brand.jsx';
import { ConnectionStatusBadge } from './connection-status.jsx';

const PROFILES_URL = import.meta.env.VITE_PROFILES_URL ?? '/profiles';
const CONNECTIONS_URL =
  import.meta.env.VITE_LINKEDIN_CONNECTIONS_URL ??
  '/linkedin-base/connections';
const MESSAGES_URL =
  import.meta.env.VITE_LINKEDIN_MESSAGES_URL ?? '/linkedin-base/messages';
const AGENTES_URL = import.meta.env.VITE_AGENTES_URL ?? '/agentes';
const FUNIL_AGENT_KEY = 'cx-funil-agent';

const PAGE_SIZE = 100;

function agentFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('agent')?.trim() || '';
  } catch {
    return '';
  }
}

function agentFromStorage() {
  try {
    return localStorage.getItem(FUNIL_AGENT_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

function persistAgent(agentId) {
  try {
    if (agentId) localStorage.setItem(FUNIL_AGENT_KEY, agentId);
    else localStorage.removeItem(FUNIL_AGENT_KEY);
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  if (agentId) url.searchParams.set('agent', agentId);
  else url.searchParams.delete('agent');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

/** Colunas do board — funil L→R. Cada uma = 1 API. */
const COLUMNS = [
  {
    id: 'candidatos',
    title: 'Candidatos',
    api: 'GET /profiles?agentId=',
  },
  {
    id: 'convidados',
    title: 'Convidados',
    api: 'GET /linkedin-base/connections?status=1',
  },
  {
    id: 'conectados',
    title: 'Conectados',
    api: 'GET /linkedin-base/connections?status=2',
  },
  {
    id: 'abordados',
    title: 'Abordados',
    api: 'GET /linkedin-base/messages?direction=sent',
  },
  {
    id: 'respondidos',
    title: 'Respondidos',
    api: 'GET /linkedin-base/messages?direction=received',
  },
  {
    id: 'descartados',
    title: 'Descartados',
    api: 'GET /linkedin-base/connections?status=3',
  },
];

function photoSrc(base64) {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;
  return `data:image/png;base64,${base64}`;
}

function initials(name) {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function slugFromUrl(url) {
  const m = String(url || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : url || null;
}

/** `bruno-toyomoto-923…` → `Bruno Toyomoto` (fallback de label). */
function displayNameFromUrl(url) {
  const slug = slugFromUrl(url);
  if (!slug || typeof slug !== 'string') return null;
  const parts = slug.split('-').filter(Boolean);
  while (
    parts.length &&
    (/^\d{5,}$/.test(parts[parts.length - 1]) ||
      (parts[parts.length - 1].length >= 6 &&
        /[0-9]/.test(parts[parts.length - 1]) &&
        /^[a-z0-9]+$/i.test(parts[parts.length - 1])))
  ) {
    parts.pop();
  }
  if (!parts.length) return slug;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function formatWhen(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function Avatar({ name, photoBase64 }) {
  const src = photoSrc(photoBase64);
  if (src) {
    return <img className="funil-avatar" src={src} alt="" loading="lazy" />;
  }
  return (
    <div className="funil-avatar funil-avatar-fallback" aria-hidden>
      {initials(name)}
    </div>
  );
}

function labelFromClienteLinkedin(li) {
  const nome = li?.cliente?.nome?.trim();
  // Evita mostrar slug cru / hífens como se fosse nome
  if (nome && !/-/.test(nome) && !/linkedin\.com/i.test(nome)) return nome;
  return (
    li?.headline?.split('|')[0]?.trim() ||
    displayNameFromUrl(li?.profileUrl) ||
    slugFromUrl(li?.profileUrl) ||
    nome ||
    '—'
  );
}

/** Mensagens → 1 card por peer (clienteLinkedinId / profileUrl). */
function cardsFromMessages(rows) {
  const byKey = new Map();
  for (const m of rows || []) {
    const li = m.clienteLinkedin;
    const key = m.clienteLinkedinId || li?.profileUrl || m.id;
    if (!key || byKey.has(key)) continue;
    byKey.set(key, {
      id: key,
      name: labelFromClienteLinkedin(li),
      subtitle: m.message,
      meta: [m.agentId, formatWhen(m.occurredAt) || m.timeLabel]
        .filter(Boolean)
        .join(' · '),
      url: li?.profileUrl ?? null,
      photoBase64: li?.photoBase64 ?? null,
      connectionStatus: 2,
    });
  }
  return [...byKey.values()];
}

function cardsFromConnections(rows) {
  return (rows || []).map((c) => {
    const li = c.clienteLinkedin;
    const discardReason = c.discardReason || null;
    const subtitle =
      Number(c.status) === 3
        ? discardReason || 'Descartado'
        : li?.headline || li?.company || null;
    return {
      id: c.id,
      name: labelFromClienteLinkedin(li),
      subtitle,
      meta: [c.agentId, formatWhen(c.connectedAt || c.invitedAt || c.updatedAt)]
        .filter(Boolean)
        .join(' · '),
      url: li?.profileUrl ?? null,
      photoBase64: li?.photoBase64 ?? null,
      profileId: li?.id ?? null,
      connectionStatus: c.status,
      discardReason,
    };
  });
}

function cardsFromProfiles(rows) {
  return (rows || []).map((p) => ({
    id: p.id,
    name: p.name || '—',
    subtitle: p.title || p.current || null,
    meta: [p.city, p.level, formatWhen(p.extractedAt || p.createdAt)]
      .filter(Boolean)
      .join(' · '),
    url: p.profileUrl ?? null,
    photoBase64: p.photoBase64 ?? null,
    profileId: p.id,
    inviteStatus: p.inviteStatus || p.connection || null,
    connectionStatus: 0,
  }));
}

/** Chave estável p/ dedupe entre colunas (URL > profileId > id). */
function cardDedupeKey(card) {
  const url = String(card?.url || '')
    .toLowerCase()
    .replace(/\/$/, '');
  if (/linkedin\.com\/in\//i.test(url)) return `u:${url}`;
  if (card?.profileId) return `p:${card.profileId}`;
  return `i:${card?.id}`;
}

/**
 * Funil L→R: cada pessoa só na etapa mais avançada.
 * respondidos > abordados > conectados > convidados > descartados > candidatos
 */
function dedupeBoardColumns(cols) {
  const order = [
    'respondidos',
    'abordados',
    'conectados',
    'convidados',
    'descartados',
    'candidatos',
  ];
  const claimed = new Set();
  const next = { ...cols };
  for (const id of order) {
    const col = cols[id] || { cards: [] };
    const kept = [];
    for (const c of col.cards || []) {
      const k = cardDedupeKey(c);
      if (claimed.has(k)) continue;
      kept.push(c);
      claimed.add(k);
    }
    next[id] = {
      ...col,
      cards: kept,
      // total da coluna = o que o board mostra (após dedupe)
      total: kept.length,
    };
  }
  return next;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} · ${url}`);
  return res.json();
}

/** Pagina até esgotar (mensagens/conexões) — cards = todos os itens da API. */
async function fetchAllPages(baseUrl, params = {}) {
  const all = [];
  let page = 1;
  let pages = 1;
  let total = 0;
  do {
    const q = new URLSearchParams({
      ...params,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    const json = await fetchJson(`${baseUrl}?${q}`);
    const chunk = json?.data ?? [];
    all.push(...chunk);
    total = json?.meta?.total ?? all.length;
    pages = json?.meta?.pages ?? 1;
    page += 1;
  } while (page <= pages);
  return { data: all, total };
}

function FunilCard({ card, columnId, onOpenProfile, opening, nextLabel }) {
  const canOpen = Boolean(onOpenProfile && (card.profileId || card.url));
  return (
    <article
      className={`funil-card${canOpen ? ' funil-card-clickable' : ''}${opening ? ' funil-card-opening' : ''}${nextLabel ? ' funil-card-next' : ''}`}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-busy={opening || undefined}
      onClick={() => {
        if (canOpen && !opening) onOpenProfile(card);
      }}
      onKeyDown={(e) => {
        if (!canOpen || opening) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenProfile(card);
        }
      }}
    >
      <Avatar name={card.name} photoBase64={card.photoBase64} />
      <div className="funil-card-body">
        <div className="funil-card-top">
          <h3 className="funil-card-name">{card.name}</h3>
          {nextLabel ? (
            <span className="funil-card-next-badge">{nextLabel}</span>
          ) : (
            <ConnectionStatusBadge
              status={card.connectionStatus}
              inviteStatus={card.inviteStatus}
              columnId={columnId}
            />
          )}
        </div>
        {card.subtitle && <p className="funil-card-sub">{card.subtitle}</p>}
        {card.discardReason && columnId === 'descartados' && (
          <p className="funil-card-discard muted" title={card.discardReason}>
            Motivo: {card.discardReason}
          </p>
        )}
        {card.meta && <p className="funil-card-meta muted">{card.meta}</p>}
        <div className="funil-card-actions">
          {card.url && (
            <a
              className="linkedin-link"
              href={card.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn
            </a>
          )}
          {canOpen && (
            <span className="funil-card-open">
              {opening ? 'Abrindo…' : 'Perfil'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FunilColumn({
  column,
  state,
  onLoadMore,
  onOpenProfile,
  openingCardId,
  nextConnect,
}) {
  const { cards, total, loading, error, hasMore } = state;
  return (
    <section className="funil-column" aria-labelledby={`funil-col-${column.id}`}>
      <header className="funil-column-head">
        <h2 id={`funil-col-${column.id}`}>{column.title}</h2>
        <span className="funil-column-count">
          {loading && !cards.length
            ? '…'
            : total > cards.length
              ? `${cards.length} / ${total}`
              : String(cards.length)}
        </span>
      </header>
      <div className="funil-column-list">
        {error && <p className="error funil-column-msg">{error}</p>}
        {!loading && !error && cards.length === 0 && (
          <p className="muted funil-column-msg">Vazio</p>
        )}
        {cards.map((c) => {
          const isNext =
            column.id === 'candidatos' &&
            nextConnect &&
            ((nextConnect.profileId && c.profileId === nextConnect.profileId) ||
              (nextConnect.profileUrl &&
                c.url &&
                nextConnect.profileUrl === c.url));
          const nextLabel = isNext
            ? nextConnect.jobStatus === 'claimed'
              ? 'Conectando…'
              : 'Próximo'
            : null;
          return (
          <FunilCard
            key={c.id}
            card={c}
            columnId={column.id}
            onOpenProfile={onOpenProfile}
            opening={openingCardId === c.id}
            nextLabel={nextLabel}
          />
          );
        })}
        {loading && cards.length > 0 && (
          <p className="muted funil-column-msg">Carregando…</p>
        )}
        {hasMore && !loading && (
          <button
            type="button"
            className="btn-secondary funil-load-more"
            onClick={onLoadMore}
          >
            Carregar mais
          </button>
        )}
      </div>
    </section>
  );
}

const emptyCol = () => ({
  cards: [],
  total: 0,
  loading: true,
  error: null,
  hasMore: false,
  page: 0,
});

export default function Funil({
  theme,
  onToggleTheme,
  onGoHome,
  onNavigate,
  onOpenProfile,
}) {
  const [agentes, setAgentes] = useState([]);
  const [agentesLoading, setAgentesLoading] = useState(true);
  const [agentesError, setAgentesError] = useState(null);
  const [agentId, setAgentId] = useState(() => agentFromUrl() || agentFromStorage());
  const [cols, setCols] = useState(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.id, emptyCol()])),
  );
  const [openingCardId, setOpeningCardId] = useState(null);
  const [openError, setOpenError] = useState(null);
  const [nextConnect, setNextConnect] = useState(null);
  /** Evita race: resposta do agente anterior pintar no select novo. */
  const agentIdRef = useRef(agentId);
  agentIdRef.current = agentId;

  const setCol = useCallback((id, patch) => {
    setCols((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const setColIfAgent = useCallback(
    (forAgent, id, patch) => {
      if (agentIdRef.current !== forAgent) return;
      setCol(id, patch);
    },
    [setCol],
  );

  const agentOpts = useMemo(() => {
    const rows = agentes
      .filter((a) => a?.id)
      .map((a) => ({ id: a.id, nome: a.nome || a.id }));
    rows.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return rows;
  }, [agentes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAgentesLoading(true);
      setAgentesError(null);
      try {
        const json = await fetchJson(AGENTES_URL);
        const rows = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [
                ...(json?.ativos || []),
                ...(json?.dormindo || []),
                ...(json?.outros || []),
              ];
        if (cancelled) return;
        setAgentes(rows);
      } catch (e) {
        if (!cancelled) setAgentesError(String(e?.message || e));
      } finally {
        if (!cancelled) setAgentesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Garante agentId (uuid) válido quando a lista chega. */
  useEffect(() => {
    if (agentesLoading || !agentOpts.length) return;
    if (agentId && agentOpts.some((a) => a.id === agentId)) {
      persistAgent(agentId);
      return;
    }
    const next = agentOpts[0].id;
    setAgentId(next);
    persistAgent(next);
  }, [agentesLoading, agentOpts, agentId]);

  function selectAgent(next) {
    const id = String(next || '').trim();
    setAgentId(id);
    persistAgent(id);
  }

  const loadRespondidos = useCallback(async () => {
    const forAgent = agentId;
    if (!forAgent) return;
    setColIfAgent(forAgent, 'respondidos', { loading: true, error: null });
    try {
      const { data } = await fetchAllPages(MESSAGES_URL, {
        direction: 'received',
        agentId: forAgent,
      });
      if (agentIdRef.current !== forAgent) return;
      const cards = cardsFromMessages(data);
      setColIfAgent(forAgent, 'respondidos', {
        cards,
        total: cards.length,
        loading: false,
        hasMore: false,
        page: 1,
      });
    } catch (e) {
      setColIfAgent(forAgent, 'respondidos', {
        cards: [],
        total: 0,
        loading: false,
        error: String(e?.message || e),
        hasMore: false,
      });
    }
  }, [setColIfAgent, agentId]);

  const loadAbordados = useCallback(async () => {
    const forAgent = agentId;
    if (!forAgent) return;
    setColIfAgent(forAgent, 'abordados', { loading: true, error: null });
    try {
      const { data } = await fetchAllPages(MESSAGES_URL, {
        direction: 'sent',
        agentId: forAgent,
      });
      if (agentIdRef.current !== forAgent) return;
      const cards = cardsFromMessages(data);
      setColIfAgent(forAgent, 'abordados', {
        cards,
        total: cards.length,
        loading: false,
        hasMore: false,
        page: 1,
      });
    } catch (e) {
      setColIfAgent(forAgent, 'abordados', {
        cards: [],
        total: 0,
        loading: false,
        error: String(e?.message || e),
        hasMore: false,
      });
    }
  }, [setColIfAgent, agentId]);

  const loadConectados = useCallback(async () => {
    const forAgent = agentId;
    if (!forAgent) return;
    setColIfAgent(forAgent, 'conectados', { loading: true, error: null });
    try {
      const { data, total } = await fetchAllPages(CONNECTIONS_URL, {
        status: '2',
        agentId: forAgent,
      });
      if (agentIdRef.current !== forAgent) return;
      setColIfAgent(forAgent, 'conectados', {
        cards: cardsFromConnections(data),
        total,
        loading: false,
        hasMore: false,
        page: 1,
      });
    } catch (e) {
      setColIfAgent(forAgent, 'conectados', {
        cards: [],
        total: 0,
        loading: false,
        error: String(e?.message || e),
        hasMore: false,
      });
    }
  }, [setColIfAgent, agentId]);

  const loadConvidados = useCallback(async () => {
    const forAgent = agentId;
    if (!forAgent) return;
    setColIfAgent(forAgent, 'convidados', { loading: true, error: null });
    try {
      const { data, total } = await fetchAllPages(CONNECTIONS_URL, {
        status: '1',
        agentId: forAgent,
      });
      if (agentIdRef.current !== forAgent) return;
      setColIfAgent(forAgent, 'convidados', {
        cards: cardsFromConnections(data),
        total,
        loading: false,
        hasMore: false,
        page: 1,
      });
    } catch (e) {
      setColIfAgent(forAgent, 'convidados', {
        cards: [],
        total: 0,
        loading: false,
        error: String(e?.message || e),
        hasMore: false,
      });
    }
  }, [setColIfAgent, agentId]);

  const loadDescartados = useCallback(async () => {
    const forAgent = agentId;
    if (!forAgent) return;
    setColIfAgent(forAgent, 'descartados', { loading: true, error: null });
    try {
      const { data, total } = await fetchAllPages(CONNECTIONS_URL, {
        status: '3',
        agentId: forAgent,
      });
      if (agentIdRef.current !== forAgent) return;
      setColIfAgent(forAgent, 'descartados', {
        cards: cardsFromConnections(data),
        total,
        loading: false,
        hasMore: false,
        page: 1,
      });
    } catch (e) {
      setColIfAgent(forAgent, 'descartados', {
        cards: [],
        total: 0,
        loading: false,
        error: String(e?.message || e),
        hasMore: false,
      });
    }
  }, [setColIfAgent, agentId]);

  const loadCandidatos = useCallback(
    async (page = 1, append = false) => {
      const forAgent = agentId;
      if (!forAgent) return;
      setColIfAgent(forAgent, 'candidatos', { loading: true, error: null });
      try {
        const q = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          agentId: forAgent,
        });
        const json = await fetchJson(`${PROFILES_URL}?${q}`);
        if (agentIdRef.current !== forAgent) return;
        const chunk = cardsFromProfiles(json?.data ?? []);
        const total = json?.meta?.total ?? chunk.length;
        const pages = json?.meta?.pages ?? 1;
        setCols((prev) => {
          if (agentIdRef.current !== forAgent) return prev;
          const prevCards = append ? prev.candidatos.cards : [];
          const cards = append ? [...prevCards, ...chunk] : chunk;
          return {
            ...prev,
            candidatos: {
              cards,
              total,
              loading: false,
              error: null,
              hasMore: page < pages,
              page,
            },
          };
        });
      } catch (e) {
        if (agentIdRef.current !== forAgent) return;
        setCols((prev) => ({
          ...prev,
          candidatos: {
            ...prev.candidatos,
            loading: false,
            error: String(e?.message || e),
            hasMore: false,
            ...(append ? {} : { cards: [], total: 0 }),
          },
        }));
      }
    },
    [setColIfAgent, agentId],
  );

  const reloadAll = useCallback(() => {
    if (!agentId) return;
    loadRespondidos();
    loadAbordados();
    loadConectados();
    loadConvidados();
    loadDescartados();
    loadCandidatos(1, false);
  }, [
    agentId,
    loadRespondidos,
    loadAbordados,
    loadConectados,
    loadConvidados,
    loadDescartados,
    loadCandidatos,
  ]);

  useEffect(() => {
    if (!agentId) return;
    setCols(Object.fromEntries(COLUMNS.map((c) => [c.id, emptyCol()])));
    reloadAll();
  }, [agentId, reloadAll]);

  /** Destaca o 1º da fila de conectar (mesmo agente do worker). */
  useEffect(() => {
    const forAgent = agentId;
    if (!forAgent) {
      setNextConnect(null);
      return undefined;
    }
    let cancelled = false;
    async function loadNext() {
      try {
        const json = await fetchJson(
          `/agente/${encodeURIComponent(forAgent)}/peek`,
        );
        if (!cancelled && agentIdRef.current === forAgent) {
          setNextConnect(json?.nextConnect ?? null);
        }
      } catch {
        if (!cancelled && agentIdRef.current === forAgent) setNextConnect(null);
      }
    }
    loadNext();
    const t = setInterval(loadNext, 8_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [agentId]);

  function go(path) {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  async function openProfile(card) {
    if (!card || openingCardId) return;
    setOpenError(null);
    let profileId = card.profileId || null;
    if (!profileId && card.url) {
      setOpeningCardId(card.id);
      try {
        const q = new URLSearchParams({ url: card.url });
        const res = await fetch(`${PROFILES_URL}/ensure?${q}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            json?.message ||
              (Array.isArray(json?.message) ? json.message.join(', ') : null) ||
              `${res.status} ao resolver perfil`,
          );
        }
        profileId = json?.id;
      } catch (e) {
        setOpenError(String(e?.message || e));
        setOpeningCardId(null);
        return;
      }
      setOpeningCardId(null);
    }
    if (!profileId) return;
    if (onOpenProfile) {
      onOpenProfile({ id: profileId, profileUrl: card.url ?? null });
      return;
    }
    go(`/profiles/${profileId}`);
  }

  return (
    <div className="page page-funil">
      <BrandBar eyebrow="Funil LinkedIn" />
      <header className="header">
        <div>
          <h1>Funil</h1>
          <p className="subtitle">
            Board por agente — etapas do{' '}
            {agentId
              ? (
                  <>
                    <strong>
                      {agentOpts.find((a) => a.id === agentId)?.nome || '…'}
                    </strong>
                    <span className="muted"> · {agentId}</span>
                  </>
                )
              : '…'}
          </p>
        </div>
        <div className="header-actions">
          <label className="filter funil-agent-filter">
            Agente
            <select
              value={agentId}
              disabled={agentesLoading || !agentOpts.length}
              onChange={(e) => selectAgent(e.target.value)}
              aria-label="Filtrar funil por agente"
            >
              {!agentOpts.length && (
                <option value="">
                  {agentesLoading ? 'Carregando…' : 'Nenhum agente'}
                </option>
              )}
              {agentOpts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-secondary"
            onClick={reloadAll}
            disabled={!agentId || Object.values(cols).some((c) => c.loading)}
          >
            Atualizar
          </button>
        </div>
      </header>

      {agentesError && (
        <p className="error">Erro ao listar agentes: {agentesError}</p>
      )}
      {openError && <p className="error">Erro ao abrir perfil: {openError}</p>}

      {!agentId && !agentesLoading && (
        <p className="empty">Cadastre um agente em /agentes para ver o funil.</p>
      )}

      {agentId && (
        <div className="funil-board" role="list">
          {(() => {
            const board = dedupeBoardColumns(cols);
            return COLUMNS.map((column) => (
              <FunilColumn
                key={`${agentId}-${column.id}`}
                column={column}
                state={board[column.id]}
                onOpenProfile={openProfile}
                openingCardId={openingCardId}
                nextConnect={nextConnect}
                onLoadMore={
                  column.id === 'candidatos'
                    ? () =>
                        loadCandidatos((cols.candidatos.page || 1) + 1, true)
                    : undefined
                }
              />
            ));
          })()}
        </div>
      )}
    </div>
  );
}
