/** E07 · Academias próximas (F-55, F-56). RF-47..51 · RN-20, RN-21. */
import type { Gym } from '@fitness/contracts';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useGym, useGyms, usePatchCharacter } from '../../lib/queries';
import { type Position, usePosition, useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import { Avatar, Chip, ErrorState, Loading, Note, Stat, TopBar, useToast } from '../../ui/kit';
import { FMap } from '../../ui/viz';
import { FeedCard } from '../social/feed-card';

const km = (v: number | null) => (v === null ? '' : `${v.toLocaleString('pt-BR')} km`);

/** Projeta lat/lng no mapa estilizado, com você no centro. */
function pinsFor(gyms: Gym[], pos: Position, mine: string | null, onOpen: (id: string) => void) {
  const coslat = Math.cos((pos.lat * Math.PI) / 180);
  const d = gyms.map((g) => ({ g, dx: (g.lng - pos.lng) * coslat, dy: g.lat - pos.lat }));
  const max = Math.max(1e-4, ...d.map((x) => Math.max(Math.abs(x.dx), Math.abs(x.dy))));
  return d.map(({ g, dx, dy }) => ({
    x: 50 + (dx / max) * 40,
    y: 50 - (dy / max) * 38,
    txt: km(g.distanceKm),
    mine: g.id === mine,
    label: g.name,
    onClick: () => onOpen(g.id),
  }));
}

const BAIRROS = ['Centro', 'São Pedro', 'Afonso Pena', 'Cidade Jardim'];

/** F-55 · GPS com permissão; sem permissão, só busca por bairro ou cidade (RN-20). */
export function GymsNearby() {
  const { me } = useSession();
  const nav = useNavigate();
  const { pos, state, ask } = usePosition();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const r = useGyms({ ...(pos ? { lat: pos.lat, lng: pos.lng } : {}), q: dq });
  const mine = me.character?.gymId ?? null;
  const list = r.data?.gyms ?? [];
  const city = list[0]?.city;
  return (
    <div className="body">
      <TopBar title="Academias" sub={pos ? `Perto de você${city ? ` · ${city}` : ''}` : 'Busca por bairro'} />
      {pos ? (
        <FMap you pins={pinsFor(list, pos, mine, (id) => void nav(`/academias/${id}`, { viewTransition: true }))} />
      ) : (
        <section className="nogps">
          <Icon name="pin" />
          <div>
            <b>{state === 'denied' ? 'Localização indisponível' : 'Localização desligada'}</b>
            <p>Busque pelo bairro ou cidade. Ou ative para ver no mapa.</p>
          </div>
          <button type="button" className="btn s sm" onClick={ask} disabled={state === 'asking'}>
            {state === 'asking' ? '…' : 'Ativar'}
          </button>
        </section>
      )}
      <label className="search">
        <Icon name="search" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Bairro, cidade ou nome"
          autoComplete="off"
          aria-label="Bairro, cidade ou nome"
        />
      </label>
      {!pos && (
        <div className="chips">
          {BAIRROS.map((b) => (
            <button
              type="button"
              key={b}
              className={`fchip${q === b ? ' on' : ''}`}
              onClick={() => setQ(q === b ? '' : b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}
      {r.isPending ? (
        <Loading />
      ) : !r.data ? (
        <ErrorState error={r.error} retry={() => void r.refetch()} />
      ) : list.length ? (
        <ul className="gl-list">
          {list.map((g) => (
            <li key={g.id} onClick={() => nav(`/academias/${g.id}`, { viewTransition: true })}>
              <span className="gi">
                <Icon name="dumbbell" />
              </span>
              <div>
                <Link to={`/academias/${g.id}`} viewTransition>
                  <b>
                    {g.name}
                    {mine === g.id && <i className="you-t">você treina</i>}
                  </b>
                </Link>
                <span>
                  {g.neighborhood}
                  {g.distanceKm !== null ? ` · ${km(g.distanceKm)}` : ''} · {g.modalities.join(', ')}
                </span>
                <span className="tnum">{g.characters} personagens públicos</span>
              </div>
              <Icon name="next" />
            </li>
          ))}
        </ul>
      ) : (
        <section className="empty sm">
          <Icon name="pin" />
          <p>Nenhuma academia em “{q}”.</p>
        </section>
      )}
      <Note icon="info">Descoberta e vínculo social. Matrícula e pagamento ficam com a academia.</Note>
    </div>
  );
}

/** F-56 · Academia: “Treino aqui” vincula o personagem; atividade vem de personagens públicos (RN-21). */
export function GymDetail() {
  const { gymId = '' } = useParams();
  const { me } = useSession();
  const { pos } = usePosition();
  const q = useGym(gymId, pos ?? undefined);
  const patch = usePatchCharacter();
  const toast = useToast();
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const g = q.data;
  const c = me.character;
  const mine = c?.gymId === g.id;
  const opens = g.hours.split('–')[0] ?? g.hours;
  return (
    <div className="body ft">
      <TopBar
        title={g.name}
        sub={`${g.neighborhood}${g.distanceKm !== null ? ` · ${km(g.distanceKm)}` : ''}`}
        fallback="/academias"
      />
      <FMap short pins={[{ x: 50, y: 50, txt: g.name, big: true, label: g.name }]} />
      <div className="kpis three">
        <Stat v={g.characters} l="personagens" />
        <Stat v={g.posts.length} l="atividades recentes" />
        <Stat v={opens === '24 horas' ? '24 h' : opens} l="abre" />
      </div>
      <div className="chips">
        {g.modalities.map((m) => (
          <Chip key={m} tone="meta">
            {m}
          </Chip>
        ))}
        <Chip tone="meta">
          <Icon name="clock" />
          {g.hours}
        </Chip>
      </div>
      {g.people.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Quem treina aqui</h2>
          </div>
          <div className="people">
            {g.people.map((p) => (
              <Link key={p.nick} to={`/p/${p.nick}`} viewTransition>
                <Avatar nick={p.nick} color={p.color} />
                <span>{c?.nick === p.nick ? 'você' : p.nick}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      <div className="sec-h">
        <h2>Atividade recente</h2>
      </div>
      <div className="feed">
        {g.posts.map((p) => (
          <FeedCard key={p.id} post={p} />
        ))}
        {!g.posts.length && <p className="hint">Ninguém publicou daqui ainda.</p>}
      </div>
      <div className="footcta">
        {c ? (
          <button
            type="button"
            className={`btn ${mine ? 's' : 'p'}`}
            disabled={patch.isPending}
            onClick={() =>
              patch.mutate(
                { gymId: mine ? null : g.id },
                { onSuccess: () => toast(mine ? 'Vínculo removido' : `Vinculado a ${g.name}`) },
              )
            }
          >
            <Icon name={mine ? 'check' : 'pin'} />
            {mine ? 'Você treina aqui' : 'Treino aqui'}
          </button>
        ) : (
          <Link className="btn s" to="/vitrine/personagem" viewTransition>
            Criar personagem para vincular
          </Link>
        )}
      </div>
    </div>
  );
}
