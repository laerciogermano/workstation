/** E04 · Treino do dia (F-30..F-32). RF-23..28, RF-37..40 · RN-12, RN-17, RN-18, RN-22. */
import type { FeedPost } from '@fitness/contracts';
import {
  type ExerciseId,
  SESSIONS,
  WEEKDAYS_PT,
  WEEK_PLAN,
  addDays,
  exerciseKcal,
  exerciseMinutes,
  exerciseOf,
  exerciseVolume,
  isExerciseId,
  n0,
  restWalkKcal,
  sessionFor,
  setsLabel,
  weekday,
} from '@fitness/domain';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { errorText } from '../../lib/api';
import { useCompleteSession, useLogExercise, useTraining } from '../../lib/queries';
import { useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import { Bar, ErrorState, Loading, Note, NumStep, Stat, TabBar, Toggle, TopBar, useToast } from '../../ui/kit';
import { Figure } from '../../ui/viz';
import { FeedCard } from '../social/feed-card';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** F-30 · Treino do dia */
export function TrainingDay() {
  const { today } = useSession();
  const q = useTraining(today);
  const log = useLogExercise(today);
  const toast = useToast();
  const [offset, setOffset] = useState(0);
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const t = q.data;
  const day = addDays(today, offset);
  const sel = sessionFor(day);
  const isToday = offset === 0;
  const kg = t.bodyWeightKg;
  const k = sel.exercises.reduce((a, id) => a + exerciseKcal(exerciseOf(id), kg), 0);
  const mn = Math.round(sel.exercises.reduce((a, id) => a + exerciseMinutes(exerciseOf(id)), 0));
  const vol = sel.exercises.reduce((a, id) => a + exerciseVolume(exerciseOf(id), exerciseOf(id).loadKg), 0);
  const logOf = (id: ExerciseId) => t.logs.find((l) => l.exerciseId === id);
  return (
    <>
      <div className="body tb">
        <TopBar
          title="Treino"
          back={false}
          sub={`${t.workoutsLast7} treino${t.workoutsLast7 === 1 ? '' : 's'} nos últimos 7 dias`}
        />
        <div className="days" role="tablist">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(today, i);
            const s = WEEK_PLAN[weekday(d)] ?? 'R';
            return (
              <button
                type="button"
                role="tab"
                aria-selected={offset === i}
                key={d}
                className={`${offset === i ? 'on' : ''}${s === 'R' ? ' rest' : ''}`}
                onClick={() => setOffset(i)}
              >
                <span>{i ? WEEKDAYS_PT[weekday(d)] : 'Hoje'}</span>
                <b>{s === 'R' ? '–' : s}</b>
              </button>
            );
          })}
        </div>
        {sel.exercises.length ? (
          <>
            <section className="card sess">
              <p className="tag">{sel.modality}</p>
              <h2>{sel.name}</h2>
              <div className="kpis three plain">
                <Stat v={`≈ ${n0(k)}`} l="kcal" />
                <Stat v={`${mn} min`} l="duração" />
                <Stat v={vol ? `${n0(vol)} kg` : '—'} l="volume" />
              </div>
              {isToday ? (
                <>
                  <Bar small pct={(t.summary.done.length / sel.exercises.length) * 100} />
                  <p className="hint tnum">
                    {t.summary.done.length} de {sel.exercises.length} feitos · {n0(t.summary.kcal)} kcal até agora
                  </p>
                </>
              ) : (
                <p className="hint">Prévia. O check abre no dia.</p>
              )}
            </section>
            <ul className="exl">
              {sel.exercises.map((id) => {
                const x = exerciseOf(id);
                const l = logOf(id);
                const dn = isToday && t.summary.done.includes(id);
                const load = isToday ? (l?.loadKg ?? x.loadKg) : x.loadKg;
                return (
                  <li key={id} className={dn ? 'done' : ''}>
                    {isToday && (
                      <button
                        type="button"
                        className={`ck${dn ? ' on' : ''}`}
                        aria-label={`Marcar ${x.name}`}
                        aria-pressed={dn}
                        onClick={() => {
                          log.mutate({ exerciseId: id, setsDone: dn ? 0 : x.sets });
                          if (!dn) toast(`${x.name} · +${exerciseKcal(x, kg)} kcal`);
                        }}
                      >
                        <Icon name="check" />
                      </button>
                    )}
                    <Link className="exm" to={`/treino/exercicio/${id}${isToday ? '' : '?previa=1'}`} viewTransition>
                      <Figure kind={x.anim} size="xs" animate={false} bar={!('noBar' in x && x.noBar)} />
                    </Link>
                    <Link className="exi" to={`/treino/exercicio/${id}${isToday ? '' : '?previa=1'}`} viewTransition>
                      <b>{x.name}</b>
                      <span className="tnum">{setsLabel(x, load)}</span>
                      <span className="tnum kc">
                        ≈ {exerciseKcal(x, kg)} kcal · {Math.round(exerciseMinutes(x))} min
                      </span>
                    </Link>
                    <Icon name="next" />
                  </li>
                );
              })}
            </ul>
            {isToday && (
              <div className="row2">
                {t.completedAt ? (
                  <button type="button" className="btn p" disabled>
                    Sessão concluída
                  </button>
                ) : t.summary.done.length ? (
                  <Link className="btn p" to="/treino/concluido" viewTransition>
                    Concluir sessão
                  </Link>
                ) : (
                  <button type="button" className="btn p" disabled>
                    Concluir sessão
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <section className="verdict meta">
            <Icon name="clock" />
            <h1>{sel.name}</h1>
            <p>Caminhada de 30 min ≈ {n0(restWalkKcal(kg))} kcal no balanço.</p>
          </section>
        )}
      </div>
      <TabBar on="/treino" />
    </>
  );
}

/** F-31 · Detalhe do exercício (RF-24, RF-26, RF-27): movimento em loop, séries e carga. */
export function ExerciseDetail() {
  const { today } = useSession();
  const { exerciseId = '' } = useParams();
  const [params] = useSearchParams();
  const preview = params.has('previa');
  const q = useTraining(today);
  const log = useLogExercise(today);
  const toast = useToast();
  const [paused, setPaused] = useState(reduced());
  if (!isExerciseId(exerciseId)) return <Navigate to="/treino" replace />;
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const x = exerciseOf(exerciseId);
  const t = q.data;
  const inToday = SESSIONS[t.sessionId].exercises.includes(exerciseId) && !preview;
  const l = t.logs.find((e) => e.exerciseId === exerciseId);
  const sd = inToday ? (l?.setsDone ?? 0) : 0;
  const load = l?.loadKg ?? x.loadKg;
  const dn = sd >= x.sets;
  const best = t.bestLoads[exerciseId];
  const isPr = inToday && best !== undefined && load > best;
  const setSets = (n: number) => {
    const next = sd >= n ? n - 1 : n;
    log.mutate({ exerciseId, setsDone: next });
    if (next >= x.sets && !dn) toast('Exercício concluído');
  };
  return (
    <div className="body ft">
      <TopBar title={x.name} sub={x.muscles} fallback="/treino" />
      <section className={`stagefig${paused ? ' still' : ''}`}>
        <Figure kind={x.anim} size="lg" animate={!paused} bar={!('noBar' in x && x.noBar)} />
        <button
          type="button"
          className="ib glass"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Animar' : 'Pausar'}
        >
          <Icon name={paused ? 'play' : 'pause'} />
        </button>
        <span className="figlab">{paused ? 'início e fim do movimento' : 'ritmo: 1 s sobe · 1 s desce'}</span>
      </section>
      <div className="kpis three">
        <Stat
          v={`${x.sets}×`}
          l={'seconds' in x && x.seconds ? `${x.seconds} s` : `${'reps' in x ? x.reps : ''} reps`}
        />
        <Stat v={load ? `${load} kg` : 'corpo'} l="carga" />
        <Stat v={`≈ ${exerciseKcal(x, t.bodyWeightKg)}`} l="kcal" />
      </div>
      {inToday && x.loadKg > 0 && (
        <div className="fld">
          <label>Carga de hoje {best !== undefined && <span className="hint tnum">melhor: {best} kg</span>}</label>
          <NumStep
            label="carga"
            value={load}
            unit="kg"
            step={2.5}
            decimals={1}
            min={0}
            max={500}
            onChange={(v) => log.mutate({ exerciseId, setsDone: sd, loadKg: v })}
          />
        </div>
      )}
      {inToday && (
        <div className="fld">
          <label>
            Séries{' '}
            <span className="hint tnum">
              {sd}/{x.sets}
            </span>
          </label>
          <div className="sets">
            {Array.from({ length: x.sets }, (_, i) => (
              <button
                type="button"
                key={`set-${i + 1}`}
                className={i < sd ? 'on' : ''}
                aria-pressed={i < sd}
                onClick={() => setSets(i + 1)}
              >
                <b>{i + 1}</b>
                <span>
                  {'seconds' in x && x.seconds
                    ? `${x.seconds} s`
                    : `${'reps' in x ? x.reps : ''}${load ? ` × ${load}` : ''}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <section className="card">
        <p>{x.description}</p>
        <h2 className="h-sm" style={{ marginTop: 12 }}>
          Pontos de atenção
        </h2>
        <ul className="prem">
          {x.tips.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      {isPr && (
        <Note icon="trophy">
          Carga de hoje é recorde pessoal. Concluir com a série completa entra na vitrine se você publicar.
        </Note>
      )}
      {!inToday && <Note icon="info">Prévia. O check abre no dia do treino.</Note>}
      {inToday && (
        <div className="footcta">
          <button
            type="button"
            className={`btn ${dn ? 's' : 'p'}`}
            onClick={() => log.mutate({ exerciseId, setsDone: dn ? 0 : x.sets })}
          >
            {dn ? (
              'Desmarcar'
            ) : (
              <>
                <Icon name="check" />
                Marcar como feito
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** F-32 · Sessão concluída: publicar é opt-in por sessão e só com personagem (RN-17, RN-18). */
export function SessionDone() {
  const { today, me, online } = useSession();
  const q = useTraining(today);
  const done = useCompleteSession(today);
  const nav = useNavigate();
  const toast = useToast();
  const [pub, setPub] = useState(true);
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const t = q.data;
  const s = SESSIONS[t.sessionId];
  const c = me.character;
  const canPub = !!c?.optIn && c.share.treinos;
  const pr = t.prs[0];
  const preview: FeedPost = {
    id: '00000000-0000-0000-0000-000000000000',
    nick: c?.nick ?? 'voce',
    color: c?.color ?? 0,
    gymId: c?.gymId ?? null,
    gymName: null,
    kind: 'treino',
    title: `${s.name} · ${s.modality}`,
    values: [
      ['Duração', `${t.summary.minutes} min`],
      ['Gasto', `${n0(t.summary.kcal)} kcal`],
      ...(t.summary.volumeKg ? ([['Volume', `${n0(t.summary.volumeKg)} kg`]] as [string, string][]) : []),
    ],
    pr: pr ? `${exerciseOf(pr.exerciseId).name.split(' ')[0]} · ${pr.loadKg} kg` : null,
    achievement: null,
    createdAt: new Date().toISOString(),
    kudos: 0,
    kudoed: false,
    mine: true,
  };
  if (!t.summary.done.length && !t.completedAt) return <Navigate to="/treino" replace />;
  const finish = () =>
    done.mutate(canPub && pub, {
      onSuccess: (r) => {
        if (r.published) toast('Publicado na vitrine', { to: '/vitrine', label: 'Ver' });
        else toast(`Sessão salva · ${n0(t.summary.kcal)} kcal no balanço`);
        void nav('/', { replace: true, viewTransition: true });
      },
    });
  return (
    <div className="body ft">
      <TopBar title="Sessão concluída" fallback="/treino" />
      <section className="verdict ok">
        <Icon name="check" />
        <h1>
          {t.summary.done.length} de {s.exercises.length} exercícios
        </h1>
        <p>{s.name}</p>
      </section>
      <div className="kpis three">
        <Stat v={`${t.summary.minutes} min`} l="duração" />
        <Stat v={n0(t.summary.kcal)} l="kcal no balanço" />
        <Stat v={t.summary.volumeKg ? n0(t.summary.volumeKg) : '—'} l="kg de volume" />
      </div>
      {preview.pr && (
        <p className="badge pr big">
          <Icon name="trophy" />
          Recorde pessoal · {preview.pr}
        </p>
      )}
      <div className="sec-h">
        <h2>Vitrine</h2>
      </div>
      {c ? (
        <>
          <div className="pubrow">
            <div>
              <b>Publicar esta sessão</b>
              <span>
                {canPub
                  ? 'Aparece no feed da vitrine e da sua academia'
                  : 'Sua vitrine está privada. Ligue em Privacidade.'}
              </span>
            </div>
            {canPub ? (
              <Toggle on={pub} onChange={setPub} label="Publicar" />
            ) : (
              <Link className="btn s sm" to="/vitrine/privacidade" viewTransition>
                Privacidade
              </Link>
            )}
          </div>
          {canPub && pub && (
            <div className="preview">
              <FeedCard post={preview} preview />
            </div>
          )}
        </>
      ) : (
        <div className="pubrow">
          <div>
            <b>Quer aparecer na vitrine?</b>
            <span>Crie um personagem público. Sem e-mail, sem senha.</span>
          </div>
          <Link className="btn s sm" to="/vitrine/personagem" viewTransition>
            Criar
          </Link>
        </div>
      )}
      {!online && (
        <Note icon="wifioff" tone="warn">
          Sem internet: a sessão é enviada quando a rede voltar.
        </Note>
      )}
      {done.error && <p className="err-box">{errorText(done.error)}</p>}
      <div className="footcta">
        <button type="button" className="btn p" onClick={finish} disabled={done.isPending || !!t.completedAt}>
          {t.completedAt ? 'Já concluída' : 'Concluir'}
        </button>
      </div>
    </div>
  );
}
