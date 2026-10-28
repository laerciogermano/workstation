import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrandBar } from './brand.jsx';

const CONNECTIONS_URL =
  import.meta.env.VITE_LINKEDIN_CONNECTIONS_URL ??
  '/linkedin-base/connections';
const MESSAGES_URL =
  import.meta.env.VITE_LINKEDIN_MESSAGES_URL ?? '/linkedin-base/messages';
// Via proxy Vite → robot :3099 (evita CORS). Override: VITE_LINKEDIN_ROBOT_URL
const ROBOT_URL = import.meta.env.VITE_LINKEDIN_ROBOT_URL ?? '/linkedin-robot';

const STATUS_LABEL = {
  0: 'Não enviado',
  1: 'Pendente',
  2: 'Conectado',
};

/** Só envia se `client_connection_linkedin.status === 2` (conectado). */
const STATUS_CONNECTED = 2;

function formatWhen(iso, timeLabel) {
  if (timeLabel) return timeLabel;
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function slugFromUrl(url) {
  const m = String(url || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : url || '—';
}

function displayNameFromUrl(url) {
  const slug = slugFromUrl(url);
  if (!slug || typeof slug !== 'string' || slug === '—') return null;
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
  if (!parts.length) return null;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

/** Ordena fio antigo→novo (occurredAt; senão timeLabel; senão createdAt). */
function sortMessagesChronological(rows) {
  const ts = (m) => {
    if (m?.occurredAt) {
      const t = new Date(m.occurredAt).getTime();
      if (!Number.isNaN(t)) return t;
    }
    const label = String(m?.timeLabel || '').trim();
    const hm = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (hm) {
      let h = Number(hm[1]);
      const min = Number(hm[2]);
      const ap = (hm[3] || '').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      const d = new Date();
      d.setHours(h, min, 0, 0);
      return d.getTime();
    }
    const c = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
    return Number.isNaN(c) ? 0 : c;
  };
  return [...(rows || [])].sort((a, b) => {
    const d = ts(a) - ts(b);
    if (d !== 0) return d;
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });
}

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

function ConnAvatar({ name, photoBase64 }) {
  const src = photoSrc(photoBase64);
  if (src) {
    return <img className="msg-avatar" src={src} alt="" loading="lazy" />;
  }
  return (
    <div className="msg-avatar msg-avatar-fallback" aria-hidden>
      {initials(name)}
    </div>
  );
}

function connectionLabel(row) {
  const li = row?.clienteLinkedin;
  const nome = li?.cliente?.nome?.trim();
  if (nome && !/-/.test(nome) && !/linkedin\.com/i.test(nome)) return nome;
  return (
    li?.headline?.split('|')[0]?.trim() ||
    displayNameFromUrl(li?.profileUrl) ||
    slugFromUrl(li?.profileUrl) ||
    nome ||
    row?.clienteLinkedinId ||
    'Conexão'
  );
}

/** Une conexões + peers que só têm mensagem (mesmo profileUrl → preferir conexão). */
function mergeConnectionsWithMessagePeers(connRows, msgRows) {
  const byUrl = new Map();
  for (const m of msgRows || []) {
    const li = m.clienteLinkedin;
    const url = li?.profileUrl;
    if (!url || byUrl.has(url)) continue;
    // Chat na base ⇒ já houve conexão; libera envio (status Conectado).
    byUrl.set(url, {
      id: `msg-${li.id}`,
      agentId: m.agentId,
      status: STATUS_CONNECTED,
      clienteLinkedinId: li.id,
      clienteLinkedin: li,
      _fromMessages: true,
    });
  }
  for (const c of connRows || []) {
    const url = c?.clienteLinkedin?.profileUrl;
    if (url) byUrl.set(url, c);
    else byUrl.set(`id:${c.id}`, c);
  }
  return [...byUrl.values()];
}

export default function Mensagens({
  theme,
  onToggleTheme,
  onGoHome,
  initialProfileId = null,
}) {
  const [connections, setConnections] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgsError, setMsgsError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendOk, setSendOk] = useState(null);
  const [filter, setFilter] = useState('');
  const [extractMax, setExtractMax] = useState(100);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState(null);

  const loadConnections = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      let rows = [];
      let apiDown = false;

      try {
        const res = await fetch(
          `${CONNECTIONS_URL}?status=${STATUS_CONNECTED}&limit=100`,
        );
        if (!res.ok) {
          apiDown = true;
          throw new Error(
            `API vendas (:3000) → ${res.status}. Rode: cd vendas/api && npm run start:dev`,
          );
        }
        const json = await res.json();
        rows = json?.data ?? [];
      } catch (e) {
        if (String(e?.message || '').includes(':3000')) throw e;
        apiDown = true;
        throw new Error(
          `API vendas (:3000) inacessível. Rode: cd vendas/api && npm run start:dev`,
        );
      }

      // peers com mensagem (já conectados na prática) ∪ conexões status=2
      if (!apiDown) {
        const mr = await fetch(`${MESSAGES_URL}?limit=100`);
        if (mr.ok) {
          const mj = await mr.json();
          rows = mergeConnectionsWithMessagePeers(rows, mj?.data ?? []);
        }
      }
      rows = rows.filter((c) => c?.status === STATUS_CONNECTED);

      setConnections(rows);
      setSelected((prev) => {
        if (!rows.length) return null;
        if (!prev && initialProfileId) {
          const byId = rows.find(
            (r) =>
              r.clienteLinkedinId === initialProfileId ||
              r.clienteLinkedin?.id === initialProfileId ||
              r.id === initialProfileId,
          );
          if (byId) return byId;
        }
        if (!prev) return rows[0];
        const prevUrl = prev?.clienteLinkedin?.profileUrl;
        const match = rows.find(
          (r) =>
            r.id === prev.id ||
            (prevUrl && r?.clienteLinkedin?.profileUrl === prevUrl),
        );
        return match ?? rows[0];
      });
    } catch (e) {
      setListError(String(e?.message || e));
      setConnections([]);
    } finally {
      setLoadingList(false);
    }
  }, [initialProfileId]);

  const loadMessages = useCallback(
    async (conn, { silent = false, isStale } = {}) => {
      const url = conn?.clienteLinkedin?.profileUrl;
      if (!url) {
        setMessages([]);
        return;
      }
      if (!silent) {
        setLoadingMsgs(true);
        setMsgsError(null);
      }
      try {
        const q = new URLSearchParams({
          profileUrl: url,
          limit: '100',
        });
        const res = await fetch(`${MESSAGES_URL}?${q}`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        if (isStale?.()) return;
        setMessages(sortMessagesChronological(json?.data ?? []));
        if (silent) setMsgsError(null);
      } catch (e) {
        if (isStale?.()) return;
        if (!silent) {
          setMsgsError(String(e?.message || e));
          setMessages([]);
        }
      } finally {
        if (!isStale?.() && !silent) setLoadingMsgs(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadConnections();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const opts = (silent) => ({
      silent,
      isStale: () => cancelled,
    });
    loadMessages(selected, opts(false));
    const id = window.setInterval(
      () => loadMessages(selected, opts(true)),
      5000,
    );
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selected, loadMessages]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter((c) => {
      const label = connectionLabel(c).toLowerCase();
      const url = String(c?.clienteLinkedin?.profileUrl || '').toLowerCase();
      return label.includes(q) || url.includes(q);
    });
  }, [connections, filter]);

  const peerUrl = selected?.clienteLinkedin?.profileUrl;
  const canSend = selected?.status === STATUS_CONNECTED;
  const sendBlockedReason = !selected
    ? null
    : selected.status === STATUS_CONNECTED
      ? null
      : selected.status == null
        ? 'Sem conexão na base — só envia após aceite (status Conectado).'
        : `Conexão ${STATUS_LABEL[selected.status] ?? selected.status} — só envia após aceite.`;

  async function handleExtractMessages() {
    const url = selected?.clienteLinkedin?.profileUrl;
    if (!url || extracting) return;
    const maxResults = Math.min(
      500,
      Math.max(1, Math.floor(Number(extractMax) || 100)),
    );
    setExtractMax(maxResults);
    setExtracting(true);
    setExtractNote(null);
    setMsgsError(null);
    try {
      const endpoint = `${ROBOT_URL.replace(/\/$/, '')}/profile-messages`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, maxResults }),
        });
      } catch {
        throw new Error(
          `Robot inacessível (${endpoint}). Suba: cd screen-robot/src && npm run linkedin-connect-api`,
        );
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const detail =
          json?.error ||
          json?.warning ||
          (res.status === 500 || res.status === 502 || res.status === 504
            ? 'robot :3099 fora do ar ou travado — cd screen-robot/src && npm run linkedin-connect-api'
            : null) ||
          `${res.status} ${res.statusText || 'falha ao extrair'}`;
        throw new Error(detail);
      }
      const n = json?.count ?? json?.db?.data?.count ?? 0;
      setExtractNote(
        json.warning
          ? `Lidas ${n} · aviso: ${json.warning}`
          : `Extraídas ${n} mensagem(ns) (máx. ${maxResults})`,
      );
      await loadMessages(selected);
      await loadConnections();
    } catch (err) {
      setMsgsError(String(err?.message || err));
    } finally {
      setExtracting(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    const url = selected?.clienteLinkedin?.profileUrl;
    if (!text || !url || sending || !canSend) return;
    setSending(true);
    setSendError(null);
    setSendOk(null);
    try {
      const endpoint = `${ROBOT_URL.replace(/\/$/, '')}/message`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, text }),
        });
      } catch (netErr) {
        throw new Error(
          `Robot inacessível (${endpoint}). Suba: cd screen-robot/src && npm run linkedin-connect-api`,
        );
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.error ||
            json?.warning ||
            `${res.status} ${res.statusText || 'falha ao enviar'}`,
        );
      }
      setDraft('');
      setSendOk(
        json.warning
          ? `Enviado no LinkedIn, mas base: ${json.warning}`
          : 'Enviado',
      );
      await loadMessages(selected);
      await loadConnections();
    } catch (err) {
      setSendError(String(err?.message || err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page page-mensagens">
      <BrandBar eyebrow="Mensagens LinkedIn" />
      <header className="header">
        <div>
          <h1>Mensagens</h1>
          <p className="subtitle">
            Só conectados (status 2) · clique para ver o fio e enviar
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadConnections()}
            disabled={loadingList}
          >
            Atualizar
          </button>
        </div>
      </header>

      <div className="msg-layout">
        <aside className="msg-sidebar">
          <input
            className="search"
            type="search"
            placeholder="Filtrar conectados…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {listError && <p className="error">Erro: {listError}</p>}
          {loadingList && <p className="muted">Carregando conexões…</p>}
          {!loadingList && !filtered.length && (
            <p className="empty">Nenhum conectado na base.</p>
          )}
          <ul className="msg-conn-list">
            {filtered.map((c) => {
              const active = selected?.id === c.id;
              const status = c.status;
              const label = connectionLabel(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`msg-conn-item${active ? ' active' : ''}`}
                    onClick={() => {
                      setSelected(c);
                      setSendOk(null);
                      setSendError(null);
                    }}
                  >
                    <ConnAvatar
                      name={label}
                      photoBase64={c.clienteLinkedin?.photoBase64}
                    />
                    <span className="msg-conn-text">
                      <span className="msg-conn-name">{label}</span>
                      <span className="msg-conn-meta">
                        {status != null
                          ? STATUS_LABEL[status] ?? status
                          : 'Chat'}
                        {c.agentId ? ` · ${c.agentId}` : ''}
                      </span>
                      <span className="msg-conn-url muted">
                        {slugFromUrl(c.clienteLinkedin?.profileUrl)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="msg-thread">
          {!selected && (
            <p className="empty">Selecione uma conexão à esquerda.</p>
          )}
          {selected && (
            <>
              <div className="msg-thread-head">
                <ConnAvatar
                  name={connectionLabel(selected)}
                  photoBase64={selected.clienteLinkedin?.photoBase64}
                />
                <div>
                  <h2>{connectionLabel(selected)}</h2>
                  {peerUrl && (
                    <a
                      className="linkedin-link"
                      href={peerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {peerUrl}
                    </a>
                  )}
                </div>
                <div className="msg-extract-actions">
                  <label className="msg-extract-qty">
                    <span className="muted">Qtd</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={extractMax}
                      disabled={extracting}
                      onChange={(e) => setExtractMax(e.target.value)}
                      aria-label="Quantidade de mensagens a extrair"
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-primary btn-extract"
                    onClick={handleExtractMessages}
                    disabled={extracting || !peerUrl}
                    title="Lê as últimas N mensagens no LinkedIn (AVD) e grava na base"
                  >
                    {extracting ? 'Extraindo…' : 'Extrair'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => loadMessages(selected)}
                    disabled={loadingMsgs || extracting}
                  >
                    Recarregar
                  </button>
                </div>
              </div>

              {extractNote && <p className="muted">{extractNote}</p>}
              {msgsError && <p className="error">Erro: {msgsError}</p>}
              {loadingMsgs && !extracting && (
                <p className="muted">Carregando mensagens…</p>
              )}
              {extracting && (
                <p className="muted">Extraindo no LinkedIn (pode levar minutos)…</p>
              )}

              <div className="msg-bubbles">
                {!loadingMsgs && !messages.length && (
                  <p className="empty">Sem mensagens gravadas ainda.</p>
                )}
                {messages.map((m) => {
                  const mine = m.direction === 'sent';
                  // timeLabel do LinkedIn; senão createdAt (occurredAt do lote é sintético)
                  const when = formatWhen(
                    m.timeLabel ? null : m.createdAt,
                    m.timeLabel,
                  );
                  return (
                    <div
                      key={m.id}
                      className={`msg-bubble${mine ? ' mine' : ' theirs'}`}
                    >
                      <div className="msg-bubble-meta">
                        <span>
                          {mine
                            ? m.sender && m.sender !== 'unknown'
                              ? m.sender
                              : 'Eu'
                            : m.sender && m.sender !== 'unknown'
                              ? m.sender
                              : 'Peer'}
                        </span>
                        {when ? <span>{when}</span> : null}
                      </div>
                      <p className="msg-bubble-text">{m.message}</p>
                    </div>
                  );
                })}
              </div>

              <form className="msg-compose" onSubmit={handleSend}>
                <textarea
                  className="msg-input"
                  rows={3}
                  placeholder={
                    canSend
                      ? 'Escreva a mensagem…'
                      : 'Aguarde o aceite da conexão para enviar…'
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending || !peerUrl || !canSend}
                />
                <div className="msg-compose-actions">
                  {sendBlockedReason && (
                    <p className="muted">{sendBlockedReason}</p>
                  )}
                  {sendError && <p className="error">{sendError}</p>}
                  {sendOk && <p className="muted">{sendOk}</p>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={
                      sending || !draft.trim() || !peerUrl || !canSend
                    }
                  >
                    {sending ? 'Enviando…' : 'Enviar no LinkedIn'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
