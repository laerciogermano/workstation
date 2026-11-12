/** E02 · Dashboard de projeção (F-11) e insights (F-12). RF-16, RF-30, RF-33, RF-34 · RN-09, RN-13, RN-14, RN-15. */
import type { Insight } from '@fitness/contracts';
import { STRATEGY_LABEL, daysBetween, expectedWeeklyRate, goalOf, n0, n1, sgn } from '@fitness/domain';
import { Link } from 'react-router';
import { INSIGHT_ROUTE } from '../lib/format';
import { useProgress } from '../lib/queries';
import { useSession } from '../lib/session';
import { Icon } from '../ui/icon';
import { Chip, ErrorState, Loading, Note, Stat, TopBar } from '../ui/kit';
import { LineChart } from '../ui/viz';

export type InsightT = Insight;

export function InsightCard({ i }: { i: InsightT }) {
  return (
    <Link className="ins" to={INSIGHT_ROUTE[i.target]} viewTransition>
      <span className="ins-i">
        <Icon name={i.icon} />
      </span>
      <div>
        <p className="tag">{i.tag}</p>
        <h3>{i.title}</h3>
        <p>{i.text}</p>
      </div>
    </Link>
  );
}

export function ProgressScreen() {
  const { today, me } = useSession();
  const q = useProgress(today);
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const { energy: e, history: h, projection: pr } = q.data;
  const goal = me.profile ? goalOf(me.profile.goal) : null;
  const t0 = h[0]?.date ?? today;
  const td = daysBetween(t0, today);
  const a = h[Math.max(0, h.length - 3)];
  const b = h[h.length - 1];
  const wk = a && b ? daysBetween(a.date, b.date) / 7 : 0;
  const rate = a && b && wk > 0 ? (b.weightKg - a.weightKg) / wk : null;
  const expected = expectedWeeklyRate(e);
  const end = pr[pr.length - 1]?.weightKg ?? 0;
  return (
    <div className="body">
      <TopBar
        title="Progresso"
        sub={`${goal?.name ?? ''} · ${STRATEGY_LABEL[e.strategy].toLowerCase()} ${e.magnitudePct ? `${e.magnitudePct}%` : ''}`}
      />
      <section className="card flush-b">
        <div className="ch-h">
          <h2 className="h-sm">Peso</h2>
          <Chip tone="meta">estimativa</Chip>
        </div>
        <LineChart
          pts={h.map((m) => ({ x: daysBetween(t0, m.date), y: m.weightKg, d: m.date }))}
          proj={pr.map((p) => ({ x: td + p.week * 7, y: p.weightKg }))}
          today={td}
          h={190}
        />
        <div className="lg">
          <span className="l1">registrado</span>
          <span className="l2">projeção</span>
        </div>
      </section>
      <div className="kpis three">
        <Stat v={rate === null ? '—' : `${sgn(rate)} kg`} l="por semana · real" />
        <Stat v={`${sgn(expected)} kg`} l="por semana · previsto" />
        <Stat v={`${n1(end)} kg`} l="em 12 semanas" />
      </div>
      {rate === null && (
        <p className="hint">
          Registre o peso em duas avaliações com pelo menos 1 semana de intervalo para ver o ritmo real.
        </p>
      )}
      <section className="card">
        <h2 className="h-sm">Estratégia</h2>
        <dl className="kv">
          <div>
            <dt>TMB</dt>
            <dd className="tnum">{n0(e.tmb)} kcal</dd>
          </div>
          <div>
            <dt>Gasto diário</dt>
            <dd className="tnum">{n0(e.tdee)} kcal</dd>
          </div>
          <div>
            <dt>Meta</dt>
            <dd className="tnum">
              {n0(e.target)} kcal ({sgn(e.diff, n0)})
            </dd>
          </div>
          <div>
            <dt>Macros</dt>
            <dd className="tnum">
              P {e.protein} · C {e.carbs} · G {e.fat} g
            </dd>
          </div>
        </dl>
        <Link className="btn s sm" to="/voce" viewTransition>
          Ajustar estratégia
        </Link>
      </section>
      <section className="card">
        <h2 className="h-sm">Premissas</h2>
        <ul className="prem">
          <li>Adesão de 85% à meta calórica</li>
          <li>1 kg de gordura ≈ 7.700 kcal</li>
          <li>Gasto recalculado semanalmente com o peso projetado</li>
          <li>Água e intestino mexem no peso diário: olhe a tendência</li>
        </ul>
      </section>
      <div className="sec-h">
        <h2>Insights</h2>
        <Link to="/insights" viewTransition>
          Todos
        </Link>
      </div>
      {q.data.insights.slice(0, 2).map((i) => (
        <InsightCard key={i.title} i={i} />
      ))}
    </div>
  );
}

export function InsightsScreen() {
  const { today } = useSession();
  const q = useProgress(today);
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <div className="body">
      <TopBar title="Insights" sub="Últimos 7 dias e tendência das medidas" />
      {q.data.insights.map((i) => (
        <InsightCard key={i.title} i={i} />
      ))}
      <Note icon="shield">Insights usam só o que você registrou. Não são diagnóstico nem orientação clínica.</Note>
    </div>
  );
}
