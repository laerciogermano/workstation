/** E06 · Vitrine e personagens (F-50..F-54). RF-37..46, RF-49 · RN-01b, RN-02, RN-17, RN-18, RN-19, RN-22. */
import { AVATAR_COLORS, GOALS, type GoalId, NICK_RE, type ShareKey, goalOf, normalizeNick } from '@fitness/domain';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { errorText, isApiError } from '../../lib/api';
import {
  useCreateCharacter,
  useDeleteCharacter,
  useFeed,
  useGyms,
  useNickAvailable,
  usePatchCharacter,
  useProgress,
  usePublicProfile,
  useSearch,
} from '../../lib/queries';
import { useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import {
  Avatar,
  Bar,
  BrandBar,
  Chip,
  ErrorState,
  Loading,
  Note,
  Seg,
  Stat,
  TabBar,
  Toggle,
  TopBar,
  useToast,
} from '../../ui/kit';
import { FeedCard } from './feed-card';

function useDebounced<T>(v: T, ms = 250): T {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** F-51 · Vitrine: só ações reais; apoio sem comentários; sem personagem é só leitura. */
export function Vitrine() {
  const { me, onboarded, today } = useSession();
  const c = me.character;
  const [scope, setScope] = useState<'all' | 'gym'>('all');
  const feed = useFeed(c?.gymId ? scope : 'all');
  const progress = useProgress(today, onboarded);
  const gyms = useGyms({ q: '' });
  const gymName = gyms.data?.gyms.find((g) => g.id === c?.gymId)?.name;
  return (
    <>
      <div className="body tb">
        <BrandBar
          me={c}
          right={
            <Link className="ib" to="/vitrine/buscar" aria-label="Buscar personagens" viewTransition>
              <Icon name="search" />
            </Link>
          }
        />
        <h1 className="h-lg tight">Vitrine</h1>
        {!c ? (
          <Link className="alert info" to={onboarded ? '/vitrine/personagem' : '/bem-vindo'} viewTransition>
            <Icon name="user" />
            <span>
              <b>Você está só olhando</b>
              {onboarded ? 'Crie um personagem para publicar' : 'Termine o cadastro para publicar'}
            </span>
            <Icon name="next" />
          </Link>
        ) : !c.optIn ? (
          <Link className="alert info" to="/vitrine/privacidade" viewTransition>
            <Icon name="lock" />
            <span>
              <b>Sua vitrine está privada</b>Ninguém vê seus treinos
            </span>
            <Icon name="next" />
          </Link>
        ) : null}
        {progress.data && (
          <div className="chal">
            {progress.data.challenges.map((ch) => (
              <article key={ch.id} className={ch.done ? 'ok' : ''}>
                <Icon name={ch.icon} />
                <b>{ch.name}</b>
                <Bar small pct={(ch.progress / ch.goal) * 100} />
                <span className="tnum">
                  {ch.progress}/{ch.goal}
                </span>
              </article>
            ))}
          </div>
        )}
        {c?.gymId && gymName && (
          <Seg
            options={
              [
                ['all', 'Todos'],
                ['gym', gymName],
              ] as const
            }
            value={scope}
            onChange={setScope}
          />
        )}
        <Link className="gymline" to="/academias" viewTransition>
          <Icon name="pin" />
          <span>Academias perto de você</span>
          <Icon name="next" />
        </Link>
        {feed.isPending ? (
          <Loading />
        ) : feed.data ? (
          <div className="feed">
            {feed.data.posts.map((p) => (
              <FeedCard key={p.id} post={p} />
            ))}
            {!feed.data.posts.length && <p className="hint">Nada publicado aqui ainda.</p>}
          </div>
        ) : (
          <ErrorState error={feed.error} retry={() => void feed.refetch()} />
        )}
      </div>
      <TabBar on="/vitrine" />
    </>
  );
}

/** F-50 · Criar personagem público (RF-42, RF-46, RF-38, RF-49 · RN-01b, RN-17, RN-18) */
export function CharacterCreate() {
  const { me } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const create = useCreateCharacter();
  const gyms = useGyms({ q: '' });
  const [nick, setNick] = useState('');
  const [color, setColor] = useState(1);
  const [gymId, setGymId] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);
  const dn = useDebounced(nick);
  const avail = useNickAvailable(dn);
  if (me.character) {
    return (
      <div className="body">
        <TopBar title="Seu personagem" />
        <Note icon="user">
          Você já é <b>@{me.character.nick}</b>.
        </Note>
        <Link className="btn s" to="/vitrine/privacidade" viewTransition>
          Privacidade
        </Link>
      </div>
    );
  }
  const valid = NICK_RE.test(nick);
  const taken = valid && dn === nick && avail.data?.available === false;
  const hint = !nick
    ? '3 a 20 letras minúsculas, números, ponto ou _'
    : !valid
      ? 'Use só minúsculas, números, ponto ou _'
      : taken
        ? 'Já existe alguém com esse apelido'
        : avail.data?.available && dn === nick
          ? 'Disponível'
          : 'Conferindo…';
  return (
    <div className="body ft">
      <TopBar title="Seu personagem" sub="Público e opcional · não é uma conta" fallback="/vitrine" />
      <div className="avpick">
        <Avatar nick={nick || 'voce'} color={color} size="xl" />
        <div className="pal" role="radiogroup" aria-label="Cor do avatar">
          {AVATAR_COLORS.map((cHex, i) => (
            <button
              type="button"
              key={cHex}
              role="radio"
              aria-checked={color === i}
              className={color === i ? 'on' : ''}
              style={{ '--c': cHex } as React.CSSProperties}
              aria-label={`Cor ${i + 1}`}
              onClick={() => setColor(i)}
            />
          ))}
        </div>
      </div>
      <div className={`fld${nick ? (valid && !taken ? ' ok' : ' bad') : ''}`}>
        <label htmlFor="nick">Apelido</label>
        <label className="inp">
          @
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(normalizeNick(e.target.value))}
            placeholder="carla.no.ferro"
            autoComplete="off"
            maxLength={20}
          />
        </label>
        <p className="hint" aria-live="polite">
          {hint}
        </p>
      </div>
      <div className="fld">
        <label>
          Academia <span className="hint">opcional</span>
        </label>
        <div className="chips">
          {(gyms.data?.gyms ?? []).slice(0, 5).map((g) => (
            <button
              type="button"
              key={g.id}
              className={`fchip${gymId === g.id ? ' on' : ''}`}
              aria-pressed={gymId === g.id}
              onClick={() => setGymId(gymId === g.id ? null : g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <div className="pubrow">
        <div>
          <b>Publicar resultados na vitrine</b>
          <span>Desligado, ninguém vê nada além do apelido</span>
        </div>
        <Toggle on={optIn} onChange={setOptIn} label="Publicar na vitrine" />
      </div>
      <Note icon="lock">Peso, medidas, fotos e TMB nunca saem do aparelho sem você ligar um por um.</Note>
      {create.error && (
        <p className="err-box">
          {isApiError(create.error, 'NICK_TAKEN') ? 'Já existe alguém com esse apelido' : errorText(create.error)}
        </p>
      )}
      <div className="footcta">
        <button
          type="button"
          className="btn p"
          disabled={!valid || taken || create.isPending}
          onClick={() =>
            create.mutate(
              { nick, color, gymId, optIn },
              {
                onSuccess: () => {
                  toast(optIn ? 'Personagem criado · vitrine ligada' : 'Personagem criado · vitrine privada');
                  void nav('/vitrine', { replace: true, viewTransition: true });
                },
              },
            )
          }
        >
          Criar personagem
        </button>
      </div>
    </div>
  );
}

/** F-52 · Buscar personagens (RF-44, RF-45 · RN-19) */
export function CharacterSearch() {
  const { me } = useSession();
  const [q, setQ] = useState('');
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [mineGym, setMineGym] = useState(false);
  const dq = useDebounced(q);
  const r = useSearch({ q: dq, goal, mineGym });
  return (
    <div className="body">
      <TopBar title="Buscar personagens" fallback="/vitrine" />
      <label className="search">
        <Icon name="search" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Apelido"
          autoComplete="off"
          aria-label="Apelido"
        />
      </label>
      <div className="chips scroll">
        <button type="button" className={`fchip${goal === null ? ' on' : ''}`} onClick={() => setGoal(null)}>
          Todos
        </button>
        {GOALS.filter((g) => g.id !== 'manutencao').map((g) => (
          <button
            type="button"
            key={g.id}
            className={`fchip${goal === g.id ? ' on' : ''}`}
            aria-pressed={goal === g.id}
            onClick={() => setGoal(goal === g.id ? null : g.id)}
          >
            {g.name}
          </button>
        ))}
        {me.character?.gymId && (
          <button
            type="button"
            className={`fchip${mineGym ? ' on' : ''}`}
            aria-pressed={mineGym}
            onClick={() => setMineGym(!mineGym)}
          >
            <Icon name="pin" />
            Minha academia
          </button>
        )}
      </div>
      {r.data ? (
        r.data.characters.length ? (
          <ul className="pl">
            {r.data.characters.map((c) => (
              <li key={c.nick}>
                <Link to={`/p/${c.nick}`} viewTransition>
                  <Avatar nick={c.nick} color={c.color} />
                  <div>
                    <b>
                      @{c.nick}
                      {c.mine && <i className="you-t">você</i>}
                    </b>
                    <span>
                      {c.goal ? goalOf(c.goal).name : 'Objetivo privado'}
                      {c.gymName ? ` · ${c.gymName}` : ''}
                    </span>
                    {c.topPr && (
                      <span className="tnum pr">
                        <Icon name="trophy" />
                        {c.topPr}
                      </span>
                    )}
                  </div>
                  {c.streak !== null && (
                    <span className="streak">
                      <Icon name="flame" />
                      <b className="tnum">{c.streak}</b>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <section className="empty sm">
            <Icon name="search" />
            <p>Ninguém com “{q}”.</p>
          </section>
        )
      ) : r.isPending ? (
        <Loading />
      ) : (
        <ErrorState error={r.error} />
      )}
      <Note icon="eye">Só aparecem personagens públicos. Quem desliga a vitrine some da busca.</Note>
    </div>
  );
}

/** F-53 · Perfil público (RF-43, RF-45, RF-46 · RN-18): nunca TMB, peso ou medidas por padrão. */
export function PublicProfile() {
  const { nick = '' } = useParams();
  const q = usePublicProfile(nick);
  if (q.isPending) return <Loading />;
  if (!q.data) {
    return (
      <div className="body">
        <TopBar title="" fallback="/vitrine" />
        {isApiError(q.error, 'NOT_FOUND') ? (
          <section className="empty">
            <Icon name="eye" />
            <h1>Perfil indisponível</h1>
            <p>Esse personagem não existe ou desligou a vitrine.</p>
          </section>
        ) : (
          <ErrorState error={q.error} retry={() => void q.refetch()} />
        )}
      </div>
    );
  }
  const p = q.data;
  const s = p.stats;
  const goal = s.goal ? goalOf(s.goal) : null;
  return (
    <div className="body">
      <TopBar
        title=""
        fallback="/vitrine"
        right={
          p.mine ? (
            <Link className="ib" to="/vitrine/privacidade" aria-label="Privacidade" viewTransition>
              <Icon name="lock" />
            </Link>
          ) : undefined
        }
      />
      <section className="phead">
        <Avatar nick={p.nick} color={p.color} size="xl" />
        <h1>@{p.nick}</h1>
        <p>
          {goal && <Chip tone={goal.strategy}>{goal.name}</Chip>}
          {p.gym && (
            <Link className="gl" to={`/academias/${p.gym.id}`} viewTransition>
              <Icon name="pin" />
              {p.gym.name}
            </Link>
          )}
        </p>
      </section>
      {p.mine && !p.visible && (
        <Note icon="lock" tone="warn">
          Assim os outros veriam seu perfil, mas a vitrine está desligada: hoje ninguém vê.
        </Note>
      )}
      <div className="kpis three">
        {s.streak !== null && <Stat v={s.streak} l="dias seguidos" />}
        {s.workouts !== null && <Stat v={s.workouts} l="treinos" />}
        <Stat v={s.achievements.length} l="conquistas" />
      </div>
      {s.prs.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Recordes</h2>
          </div>
          <div className="card">
            <ul className="mstat">
              {s.prs.map((pr) => {
                const [name, val] = pr.split(' · ');
                return (
                  <li key={pr}>
                    <span>
                      <Icon name="trophy" />
                      {name}
                    </span>
                    <b className="tnum">{val}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
      {s.achievements.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Conquistas</h2>
          </div>
          <div className="chips">
            {s.achievements.map((a) => (
              <Chip key={a} tone="cq">
                <Icon name="spark" />
                {a}
              </Chip>
            ))}
          </div>
        </>
      )}
      {s.evolution && (
        <>
          <div className="sec-h">
            <h2>Evolução compartilhada</h2>
          </div>
          <p className="evol">
            <Icon name="chart" />
            {s.evolution}
          </p>
        </>
      )}
      {p.posts.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Atividade</h2>
          </div>
          <div className="feed">
            {p.posts.map((x) => (
              <FeedCard key={x.id} post={x} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PUBLIC_ROWS: [ShareKey, string, string][] = [
  ['objetivo', 'Objetivo', 'Ganhar músculo, perder gordura…'],
  ['streak', 'Streak', 'Dias seguidos com ação registrada'],
  ['treinos', 'Treinos concluídos', 'Duração, kcal e volume'],
  ['prs', 'Recordes pessoais', 'Carga e repetições'],
  ['dieta', 'Meta da dieta cumprida', 'Só o “cumpriu”, nunca o que comeu'],
];
const SENSITIVE_ROWS: [ShareKey, string, string][] = [
  ['evolucao', 'Resumo de evolução', 'Ex.: “−5 cm de cintura em 10 semanas”'],
  ['medidas', 'Medidas', 'Circunferências nos cards de avaliação'],
];

/** F-54 · Privacidade do personagem (RF-38, RF-46 · RN-17, RN-18) */
export function CharacterPrivacy() {
  const { me } = useSession();
  const patch = usePatchCharacter();
  const del = useDeleteCharacter();
  const nav = useNavigate();
  const toast = useToast();
  const c = me.character;
  if (!c) {
    return (
      <div className="body">
        <TopBar title="Privacidade" sub="Sem personagem" fallback="/vitrine" />
        <Note icon="lock">Sem personagem público, nada sai deste aparelho.</Note>
        <Link className="btn p" to="/vitrine/personagem" viewTransition>
          Criar personagem
        </Link>
      </div>
    );
  }
  const row = ([k, l, s]: [ShareKey, string, string]) => (
    <div className="pubrow" key={k}>
      <div>
        <b>{l}</b>
        <span>{s}</span>
      </div>
      <Toggle on={c.share[k]} onChange={(v) => patch.mutate({ share: { [k]: v } })} label={l} />
    </div>
  );
  return (
    <div className="body">
      <TopBar title="Privacidade" sub={`@${c.nick}`} fallback="/vitrine" />
      <div className="pubrow strong">
        <div>
          <b>Vitrine ligada</b>
          <span>{c.optIn ? 'Suas ações marcadas como públicas aparecem no feed' : 'Nada novo é publicado'}</span>
        </div>
        <Toggle on={c.optIn} onChange={(v) => patch.mutate({ optIn: v })} label="Vitrine" />
      </div>
      {!c.optIn && (
        <div className="pubrow">
          <div>
            <b>Ocultar o que já publiquei</b>
            <span>
              {c.postCount} publicaç{c.postCount === 1 ? 'ão' : 'ões'} no feed
            </span>
          </div>
          <Toggle on={c.hideHistory} onChange={(v) => patch.mutate({ hideHistory: v })} label="Ocultar histórico" />
        </div>
      )}
      <div className="sec-h">
        <h2>No perfil e nos cards</h2>
      </div>
      {PUBLIC_ROWS.map(row)}
      <div className="sec-h">
        <h2>
          <Icon name="lock" /> Sensível · desligado por padrão
        </h2>
      </div>
      {SENSITIVE_ROWS.map(row)}
      <Note icon="shield">Peso, TMB e fotos de progresso não saem deste aparelho no v1: não há opção de publicar.</Note>
      <Link className="btn s" to={`/p/${c.nick}`} viewTransition>
        <Icon name="eye" />
        Ver como os outros veem
      </Link>
      <button
        type="button"
        className="btn danger"
        disabled={del.isPending}
        onClick={() =>
          del.mutate(undefined, {
            onSuccess: () => {
              toast('Personagem apagado · dados privados continuam aqui');
              void nav('/vitrine', { replace: true, viewTransition: true });
            },
          })
        }
      >
        <Icon name="trash" />
        Apagar personagem
      </button>
    </div>
  );
}
