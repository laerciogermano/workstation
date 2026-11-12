/** F-10 · Hoje (RF-35, RF-36, RF-21, RF-27, RF-12 · RN-11, RN-12): fecha o balanço do dia e marca sem abrir a dieta. */
import { SESSIONS, exerciseOf, n0, restWalkKcal, sessionFor } from '@fitness/domain';
import { Link, useNavigate } from 'react-router';
import { longDate } from '../lib/date';
import { useDiet, useMarkMeal, useProgress, useTraining } from '../lib/queries';
import { useSession } from '../lib/session';
import { Icon } from '../ui/icon';
import { Bar, BrandBar, ErrorState, Loading, MacroBars, TabBar, useToast } from '../ui/kit';
import { Figure, Ring } from '../ui/viz';
import { InsightCard } from './progress';

export function Today() {
  const { today, me } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const diet = useDiet(today);
  const training = useTraining(today);
  const progress = useProgress(today);
  const mark = useMarkMeal(today);
  if (diet.isPending || training.isPending) return <Loading />;
  if (!diet.data || !training.data)
    return <ErrorState error={diet.error ?? training.error} retry={() => void diet.refetch()} />;
  const d = diet.data;
  const t = training.data;
  const e = d.energy;
  const session = SESSIONS[t.sessionId];
  const bal = Math.round(d.consumed.kcal - (e.tdee + t.summary.kcal));
  const ins = progress.data?.insights[0];
  const first = session.exercises[0];
  return (
    <>
      <div className="body tb">
        <BrandBar
          me={me.character}
          right={
            <span className="streak" title="Dias seguidos com ação registrada">
              <Icon name="flame" />
              <b className="tnum">{progress.data?.streak ?? 0}</b>
            </span>
          }
        />
        <p className="date">{longDate(today)}</p>
        <section className="today">
          <Ring
            val={d.consumed.kcal}
            max={e.target}
            label={n0(d.consumed.kcal)}
            sub={`de ${n0(e.target)} kcal`}
            over={d.status === 'estourou'}
          />
          <dl className="bal">
            <div>
              <dt>Meta</dt>
              <dd className="tnum">{n0(e.target)}</dd>
            </div>
            <div>
              <dt>Comido</dt>
              <dd className="tnum">{n0(d.consumed.kcal)}</dd>
            </div>
            <div>
              <dt>Treino</dt>
              <dd className="tnum kc">+{n0(t.summary.kcal)}</dd>
            </div>
            <div className="tot">
              <dt>Balanço</dt>
              <dd className="tnum">{(bal > 0 ? '+' : bal < 0 ? '−' : '') + n0(Math.abs(bal))}</dd>
            </div>
          </dl>
        </section>
        <MacroBars c={d.consumed} e={e} />
        {ins && (
          <>
            <div className="sec-h">
              <h2>Insight</h2>
              <Link to="/insights" viewTransition>
                Ver todos
              </Link>
            </div>
            <InsightCard i={ins} />
          </>
        )}
        <div className="sec-h">
          <h2>Refeições</h2>
          <Link to="/dieta" viewTransition>
            Plano
          </Link>
        </div>
        <div className="qmeals">
          {d.plan.meals.map((m) => {
            const s = d.logs[m.id];
            return (
              <div className={`qm${s === 'feito' ? ' done' : ''}`} key={m.id}>
                <button
                  type="button"
                  className={`ck${s === 'feito' ? ' on' : s === 'parcial' ? ' half' : ''}`}
                  aria-label={`Marcar ${m.name}`}
                  aria-pressed={s === 'feito'}
                  onClick={() => {
                    const next = s === 'feito' ? null : 'feito';
                    mark.mutate({ mealId: m.id, status: next });
                    if (next) toast(`${m.name} marcado · +${n0(m.total.kcal)} kcal`);
                  }}
                >
                  <Icon name="check" />
                </button>
                <Link to={`/dieta/refeicao/${m.id}`} viewTransition>
                  <b>{m.name}</b>
                  <span className="tnum">
                    {m.time} · {n0(m.total.kcal)} kcal{s === 'parcial' ? ' · metade' : s === 'nao' ? ' · pulou' : ''}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
        <div className="sec-h">
          <h2>Treino do dia</h2>
        </div>
        {first ? (
          <article className="tcard" onClick={() => nav('/treino', { viewTransition: true })}>
            <Figure kind={exerciseOf(first).anim} size="sm" animate={false} />
            <div>
              <p className="tag">{session.modality}</p>
              <h3>{session.name}</h3>
              <p className="tnum">
                {t.summary.done.length}/{session.exercises.length} exercícios ·{' '}
                {t.completedAt ? 'concluído' : `≈ ${n0(t.summary.plannedKcal)} kcal`}
              </p>
              <Bar small pct={(t.summary.done.length / session.exercises.length) * 100} />
            </div>
            <Icon name="next" />
          </article>
        ) : (
          <article className="tcard rest">
            <Icon name="clock" />
            <div>
              <h3>{sessionFor(today).name}</h3>
              <p>Caminhada leve de 30 min ≈ {n0(restWalkKcal(t.bodyWeightKg))} kcal no gasto.</p>
            </div>
          </article>
        )}
        <div className="shortcuts">
          <Link to="/corpo/medir" viewTransition>
            <Icon name="ruler" />
            <span>Medida</span>
          </Link>
          <Link to="/corpo/foto" viewTransition>
            <Icon name="camera" />
            <span>Foto</span>
          </Link>
          <Link to="/vitrine" viewTransition>
            <Icon name="trophy" />
            <span>Vitrine</span>
          </Link>
          <Link to="/academias" viewTransition>
            <Icon name="pin" />
            <span>Academias</span>
          </Link>
        </div>
      </div>
      <TabBar on="/" />
    </>
  );
}
