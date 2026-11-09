import { Link } from 'react-router';
import { THEMES, applyTheme, useTheme } from '../../lib/theme';
import { ThemeDot } from '../../ui/ThemePicker';
import { useAnchor } from '../../lib/location';
import { useAuth, useMe } from '../../lib/queries';
import { ErrorBanner } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { TopBar } from '../../ui/TopBar';

/** T-51 · REQ-050 — visitante vê fingerprint + IP e o que está pendente de merge; conta vê e-mail, pontos e sair. */
export default function ProfilePage() {
  const me = useMe();
  const anchor = useAnchor();
  const { logout } = useAuth();
  const theme = useTheme();
  const u = me.data?.user;

  return (
    <>
      <TopBar title="Perfil e configurações" />
      <ErrorBanner error={me.error} />
      <div className="idcard">
        <span className={`avatar ${u ? '' : 'anon'}`}>{u ? (u.name ?? u.email).charAt(0).toUpperCase() : <Icon name="finger" />}</span>
        <div className="grow">
          <p className="b">{u ? (u.name ?? 'Sua conta') : 'Visitante'}</p>
          <p className="meta" style={{ overflowWrap: 'anywhere' }}>
            {u ? u.email : 'Sem conta — seus dados ficam ligados a este navegador'}
          </p>
        </div>
        <Link to="/pontos" className="ptschip">
          <Icon name="award" />
          <span className="tnum">{me.data?.points ?? 0}</span>
        </Link>
      </div>

      {!u && (
        <>
          <div className="card list">
            <div className="li">
              <Icon name="finger" />
              <div className="grow">
                <p className="b">Identificador deste navegador</p>
                <p className="meta mono">{me.data?.visitorId ? `${me.data.visitorId.slice(0, 8)}…` : '—'}</p>
              </div>
            </div>
            <div className="li">
              <Icon name="monitor" />
              <div className="grow">
                <p className="b">IP registrado pelo servidor</p>
                <p className="meta mono">{me.data?.ip ?? '—'}</p>
              </div>
            </div>
            {me.data && (
              <div className="li">
                <Icon name="info" />
                <p className="meta grow">
                  Neste navegador: {me.data.pending.receipts} notas, {me.data.pending.lists} listas e {me.data.pending.points} pontos. Ao criar conta, tudo vai junto.
                </p>
              </div>
            )}
          </div>
          <div className="duo mb12">
            <Link to="/conta/criar" className="btn p">
              Criar conta
            </Link>
            <Link to="/conta/entrar" className="btn s">
              Entrar
            </Link>
          </div>
        </>
      )}

      <div className="sec">
        <h2>Preferências</h2>
      </div>
      <div className="card list set">
        <Link to="/perfil/localizacao" className="li">
          <Icon name="pin" />
          <span className="grow">
            <span className="b">Localização e raio</span>
            <span className="meta" style={{ display: 'block' }}>
              {anchor.mode === 'gps' ? 'GPS' : anchor.label} · {anchor.radiusKm} km
            </span>
          </span>
          <Icon name="next" />
        </Link>
        <div className="li" style={{ flexWrap: 'wrap' }}>
          <Icon name="sun" />
          <span className="grow b">Tema · {THEMES.find((t) => t.id === theme)?.name}</span>
          <div className="flex" role="radiogroup" aria-label="Tema" style={{ gap: 6, width: '100%', paddingLeft: 30 }}>
            {THEMES.map((t) => (
              <button key={t.id} role="radio" aria-checked={t.id === theme} aria-label={t.name} title={t.name} className={`tpick ${t.id === theme ? 'on' : ''}`} onClick={() => applyTheme(t.id, true)}>
                <ThemeDot id={t.id} size={30} />
              </button>
            ))}
          </div>
        </div>
        <Link to="/notas" className="li">
          <Icon name="receipt" />
          <span className="grow b">Minhas notas</span>
          <Icon name="next" />
        </Link>
        <Link to="/gastos" className="li">
          <Icon name="chart" />
          <span className="grow b">Gasto do mês</span>
          <Icon name="next" />
        </Link>
      </div>

      <div className="sec">
        <h2>Privacidade</h2>
      </div>
      <div className="card list set">
        <div className="li">
          <Icon name="shield" />
          <p className="meta grow">Os preços que você manda entram no índice público sem nada que identifique você. CPF da nota é descartado na leitura.</p>
        </div>
        {u && (
          <>
            <button className="li" onClick={() => logout.mutate()}>
              <Icon name="logout" />
              <span className="grow b">Sair</span>
            </button>
            <Link to="/perfil/excluir" className="li danger">
              <Icon name="trash" />
              <span className="grow b">Excluir conta e dados</span>
              <Icon name="next" />
            </Link>
          </>
        )}
      </div>
      {u?.role === 'admin' && (
        <Link to="/admin" className="btn s mt12">
          <Icon name="shield" />
          Abrir backoffice
        </Link>
      )}
      <p className="foot-note">notinhas.shop · Beta</p>
    </>
  );
}
