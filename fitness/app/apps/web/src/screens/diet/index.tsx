/** E03 · Dieta pelo estoque (F-20..F-24). RF-17..22 · RN-10, RN-11, RN-22. */
import type { DietDayResponse } from '@fitness/contracts';
import {
  DAY_STATUS_LABEL,
  FOODS,
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABEL,
  type FoodId,
  MEAL_STATUSES,
  MEAL_STATUS_LABEL,
  type MealId,
  type MealStatus,
  QUICK_EXTRAS,
  WEEKDAYS_PT,
  dayStatus,
  foodOf,
  mealFactor,
  n0,
  n1,
  nutrientsOf,
  sgn,
  weekday,
} from '@fitness/domain';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { errorText } from '../../lib/api';
import { itemText } from '../../lib/format';
import {
  useAddExtra,
  useCloseDay,
  useDiet,
  useMarkMeal,
  useRemoveExtra,
  useResetPrefs,
  useSetPantry,
  useSetPref,
} from '../../lib/queries';
import { useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import {
  Bar,
  Chip,
  ErrorState,
  Loading,
  MacroBars,
  Note,
  STATUS_TONE,
  Sheet,
  Stat,
  TabBar,
  TopBar,
  useToast,
} from '../../ui/kit';

function useDay() {
  const { today } = useSession();
  return { today, q: useDiet(today) };
}

function MealButtons({ d, mealId }: { d: DietDayResponse; mealId: MealId }) {
  const { today } = useSession();
  const mark = useMarkMeal(today);
  const st = d.logs[mealId];
  return (
    <div className="mk" role="group" aria-label="Como foi">
      {MEAL_STATUSES.map((v) => (
        <button
          type="button"
          key={v}
          className={st === v ? `on ${v}` : ''}
          aria-pressed={st === v}
          onClick={() => mark.mutate({ mealId, status: st === v ? null : v })}
        >
          {v === 'feito' && <Icon name="check" />}
          {MEAL_STATUS_LABEL[v]}
        </button>
      ))}
    </div>
  );
}

/** F-20 · Estoque de ingredientes (RF-17, RF-22 · RN-10) */
export function DietPantry() {
  const { q } = useDay();
  const nav = useNavigate();
  const toast = useToast();
  const save = useSetPantry();
  const [sel, setSel] = useState<FoodId[] | null>(null);
  const [fq, setFq] = useState('');
  useEffect(() => {
    if (q.data && sel === null) setSel(q.data.pantry);
  }, [q.data, sel]);
  if (q.isPending || sel === null) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const term = fq.trim().toLowerCase();
  const list = FOODS.filter((f) => !term || f.name.toLowerCase().includes(term));
  const toggle = (id: FoodId) => setSel((s) => (s ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : s));
  const gen = () =>
    save.mutate(sel, {
      onSuccess: (d) => {
        if (!d.plan.viable) void nav('/dieta/incompleto', { viewTransition: true });
        else {
          toast(`Plano gerado · ${n0(d.plan.total.kcal)} kcal com ${sel.length} ingredientes`);
          void nav('/dieta', { viewTransition: true });
        }
      },
    });
  return (
    <div className="body ft">
      <TopBar title="O que tem em casa" sub={`${sel.length} ingredientes no estoque`} fallback="/dieta" />
      <label className="search">
        <Icon name="search" />
        <input
          value={fq}
          onChange={(e) => setFq(e.target.value)}
          placeholder="Buscar alimento"
          autoComplete="off"
          aria-label="Buscar alimento"
        />
      </label>
      {FOOD_CATEGORIES.map((c) => {
        const fs = list.filter((f) => f.category === c);
        if (!fs.length) return null;
        return (
          <div className="fld" key={c}>
            <label>
              {FOOD_CATEGORY_LABEL[c]}{' '}
              <span className="hint tnum">
                {fs.filter((f) => sel.includes(f.id)).length}/{fs.length}
              </span>
            </label>
            <div className="chips">
              {fs.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={`fchip${sel.includes(f.id) ? ' on' : ''}`}
                  aria-pressed={sel.includes(f.id)}
                  onClick={() => toggle(f.id)}
                >
                  <Icon name={sel.includes(f.id) ? 'check' : 'plus'} />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {!list.length && <p className="hint">Nada com esse nome.</p>}
      <Note icon="box">O plano usa só o que está marcado aqui. Faltou algo? Marque e gere de novo.</Note>
      {save.error && <p className="err-box">{errorText(save.error)}</p>}
      <div className="footcta">
        <button type="button" className="btn p" onClick={gen} disabled={save.isPending}>
          <Icon name="refresh" />
          Gerar plano do dia
        </button>
      </div>
    </div>
  );
}

/** F-21 · Plano alimentar do dia (RF-18..21 · RN-10, RN-11) */
export function DietPlanScreen() {
  const { today, q } = useDay();
  const [sheet, setSheet] = useState(false);
  const add = useAddExtra(today);
  const rm = useRemoveExtra(today);
  const toast = useToast();
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const d = q.data;
  const e = d.energy;
  return (
    <>
      <div className="body tb">
        <TopBar
          title="Dieta de hoje"
          back={false}
          sub={`Plano ${n0(d.plan.total.kcal)} kcal · meta ${n0(e.target)}`}
          right={
            <Link className="ib" to="/dieta/estoque" aria-label="Estoque" viewTransition>
              <Icon name="box" />
            </Link>
          }
        />
        {!d.plan.viable && (
          <Link className="alert" to="/dieta/incompleto" viewTransition>
            <Icon name="alert" />
            <span>
              <b>O estoque não fecha a meta</b>Veja o que falta
            </span>
            <Icon name="next" />
          </Link>
        )}
        <section className="card dsum">
          <div className="ds-h">
            <div>
              <span>Comido</span>
              <b className="tnum">
                {n0(d.consumed.kcal)}
                <i> / {n0(e.target)} kcal</i>
              </b>
            </div>
            <Chip tone={STATUS_TONE[d.status]}>{DAY_STATUS_LABEL[d.status]}</Chip>
          </div>
          <Bar pct={(d.consumed.kcal / e.target) * 100} over={d.status === 'estourou'} />
          <MacroBars c={d.consumed} e={e} />
        </section>
        {d.plan.meals.map((m) => (
          <article className={`meal${d.logs[m.id] === 'feito' ? ' done' : ''}`} key={m.id}>
            <Link to={`/dieta/refeicao/${m.id}`} className="meal-h" viewTransition>
              <header>
                <div>
                  <h3>{m.name}</h3>
                  <span className="tnum">
                    {m.time} · {n0(m.total.kcal)} kcal · P {n0(m.total.p)} g
                  </span>
                </div>
                <Icon name="next" />
              </header>
            </Link>
            <ul>
              {m.items.length ? (
                m.items.map((i) => (
                  <li key={i.foodId}>
                    <span>{foodOf(i.foodId).name}</span>
                    <b className="tnum">{itemText(i)}</b>
                  </li>
                ))
              ) : (
                <li className="miss">Sem ingredientes no estoque para esta refeição</li>
              )}
            </ul>
            <MealButtons d={d} mealId={m.id} />
          </article>
        ))}
        {d.extras.length > 0 && (
          <div className="extras">
            {d.extras.map((x) => (
              <div className="xrow" key={x.id}>
                <span>{x.name}</span>
                <b className="tnum">{n0(x.kcal)} kcal</b>
                <button
                  type="button"
                  className="ib sm ghost"
                  aria-label={`Remover ${x.name}`}
                  onClick={() => rm.mutate(x.id)}
                >
                  <Icon name="x" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="row2">
          <button type="button" className="btn s" onClick={() => setSheet(true)}>
            <Icon name="plus" />
            Fora do plano
          </button>
          <Link className="btn p" to="/dieta/fechar" viewTransition>
            Fechar o dia
          </Link>
        </div>
      </div>
      <TabBar on="/dieta" />
      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <h2>Fora do plano</h2>
        <p className="hint">Entra no total do dia.</p>
        <ul className="xlist">
          {QUICK_EXTRAS.map((x) => (
            <li key={x.name}>
              <button
                type="button"
                onClick={() =>
                  add.mutate(x, {
                    onSuccess: () => {
                      setSheet(false);
                      toast(`${x.name} somado ao dia`);
                    },
                  })
                }
              >
                <span>{x.name}</span>
                <b className="tnum">{x.kcal} kcal</b>
                <Icon name="plus" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

/** F-22 · Detalhe da refeição (RF-18, RF-20, RF-22 · RN-10): trocar fonte só oferece o que está no estoque. */
export function DietMeal() {
  const { q } = useDay();
  const { mealId } = useParams();
  const back = useNavigate();
  const pref = useSetPref();
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const d = q.data;
  const m = d.plan.meals.find((x) => x.id === mealId);
  if (!m) return <Navigate to="/dieta" replace />;
  const cur = (cat: 'prot' | 'carb') => m.items.find((i) => foodOf(i.foodId).category === cat)?.foodId;
  return (
    <div className="body ft">
      <TopBar title={m.name} sub={`${m.time} · alvo ${n0(m.targetKcal)} kcal`} fallback="/dieta" />
      <div className="kpis four">
        <Stat v={n0(m.total.kcal)} l="kcal" />
        <Stat v={`${n0(m.total.p)}g`} l="proteína" tone="mp" />
        <Stat v={`${n0(m.total.c)}g`} l="carbo" tone="mc" />
        <Stat v={`${n0(m.total.g)}g`} l="gordura" tone="mg" />
      </div>
      <section className="card">
        <ul className="items">
          {m.items.map((i) => {
            const f = foodOf(i.foodId);
            const n = nutrientsOf(f, i.grams);
            return (
              <li key={i.foodId}>
                <div>
                  <b>{f.name}</b>
                  <span className="tnum">
                    P {n1(n.p)} · C {n1(n.c)} · G {n1(n.g)}
                  </span>
                </div>
                <b className="tnum">
                  {itemText(i)}
                  <i>{n0(n.kcal)} kcal</i>
                </b>
              </li>
            );
          })}
        </ul>
      </section>
      {(['prot', 'carb'] as const).map((cat) =>
        m.alternatives[cat].length > 1 ? (
          <div className="fld" key={cat}>
            <label>
              Trocar {cat === 'prot' ? 'proteína' : 'carboidrato'} <span className="hint">só do estoque</span>
            </label>
            <div className="chips">
              {m.alternatives[cat].map((id) => (
                <button
                  type="button"
                  key={id}
                  className={`fchip${cur(cat) === id ? ' on' : ''}`}
                  aria-pressed={cur(cat) === id}
                  disabled={pref.isPending}
                  onClick={() => pref.mutate({ mealId: m.id, category: cat, foodId: id })}
                >
                  {foodOf(id).name}
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
      <div className="fld">
        <label>Como foi?</label>
        <MealButtons d={d} mealId={m.id} />
      </div>
      <div className="footcta">
        <button type="button" className="btn p" onClick={() => back(-1)}>
          Pronto
        </button>
      </div>
    </div>
  );
}

/** F-23 · Fechamento do dia (RF-21, RF-40 · RN-11, RN-22): cumpriu = 90%–105% da meta. */
export function DietClose() {
  const { today, q } = useDay();
  const nav = useNavigate();
  const toast = useToast();
  const close = useCloseDay(today);
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const d = q.data;
  const e = d.energy;
  const st = d.status;
  const big = {
    cumpriu: 'Meta cumprida',
    abaixo: 'Abaixo da meta',
    estourou: 'Passou da meta',
    vazio: 'Nada marcado ainda',
  }[st];
  const macros = [
    ['Proteína', d.consumed.p, e.protein],
    ['Carbo', d.consumed.c, e.carbs],
    ['Gordura', d.consumed.g, e.fat],
  ] as const;
  return (
    <div className="body ft">
      <TopBar title="Fechar o dia" fallback="/dieta" />
      <section className={`verdict ${STATUS_TONE[st]}`}>
        <Icon name={st === 'cumpriu' ? 'check' : st === 'vazio' ? 'info' : 'alert'} />
        <h1>{big}</h1>
        <p className="tnum">
          {n0(d.consumed.kcal)} de {n0(e.target)} kcal · {sgn(Math.round(d.consumed.kcal - e.target), n0)}
        </p>
      </section>
      <section className="card">
        <ul className="mstat">
          {macros.map(([l, v, a]) => {
            const s = dayStatus(v, a);
            return (
              <li key={l}>
                <span>{l}</span>
                <b className="tnum">
                  {n0(v)} / {n0(a)} g
                </b>
                <Chip tone={STATUS_TONE[s]}>{DAY_STATUS_LABEL[s]}</Chip>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card">
        <ul className="mstat">
          {d.plan.meals.map((m) => {
            const s: MealStatus | undefined = d.logs[m.id];
            return (
              <li key={m.id}>
                <span>{m.name}</span>
                <b className="tnum">{s ? `${n0(m.total.kcal * mealFactor(s))} kcal` : '—'}</b>
                <Chip tone={s === 'feito' ? 'ok' : s ? 'warn' : 'meta'}>{s ? MEAL_STATUS_LABEL[s] : 'Sem marcar'}</Chip>
              </li>
            );
          })}
          {d.extras.map((x) => (
            <li key={x.id}>
              <span>{x.name}</span>
              <b className="tnum">{n0(x.kcal)} kcal</b>
              <Chip tone="warn">extra</Chip>
            </li>
          ))}
        </ul>
      </section>
      <div className="sec-h">
        <h2>Semana</h2>
      </div>
      <div className="wk">
        {d.week.map((w) => (
          <div key={w.date} className={`${w.status ? STATUS_TONE[w.status] : 'meta'}${w.date === today ? ' now' : ''}`}>
            <span>{WEEKDAYS_PT[weekday(w.date)]}</span>
            <i>{w.status === 'cumpriu' ? <Icon name="check" /> : w.status ? <Icon name="x" /> : null}</i>
          </div>
        ))}
      </div>
      {close.error && <p className="err-box">{errorText(close.error)}</p>}
      <div className="footcta">
        <button
          type="button"
          className="btn p"
          disabled={st === 'vazio' || close.isPending}
          onClick={() =>
            close.mutate(undefined, {
              onSuccess: (r) => {
                toast(`Dia fechado · ${DAY_STATUS_LABEL[st].toLowerCase()}${r.published ? ' · na vitrine' : ''}`);
                void nav('/', { viewTransition: true });
              },
            })
          }
        >
          {d.closedAt ? 'Fechar de novo' : 'Concluir o dia'}
        </button>
      </div>
    </div>
  );
}

/** F-24 · Estoque não fecha a meta (RF-19, RF-22 · RN-10): avisa em vez de inventar alimento. */
export function DietIncomplete() {
  const { q } = useDay();
  const nav = useNavigate();
  const toast = useToast();
  const save = useSetPantry();
  const reset = useResetPrefs();
  const d = q.data;
  const sug = useMemo(
    () =>
      d
        ? FOODS.filter(
            (f) => !d.pantry.includes(f.id) && (d.plan.missing.includes(f.category) || f.category === 'prot'),
          ).slice(0, 5)
        : [],
    [d],
  );
  if (q.isPending) return <Loading />;
  if (!d) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const e = d.energy;
  const regen = () =>
    reset.mutate(undefined, {
      onSuccess: () => {
        void q.refetch().then((r) => {
          if (r.data?.plan.viable) {
            toast(`Plano gerado · ${n0(r.data.plan.total.kcal)} kcal`);
            void nav('/dieta', { replace: true, viewTransition: true });
          } else toast('Ainda não fecha · adicione algo ao estoque');
        });
      },
    });
  return (
    <div className="body ft">
      <TopBar title="Plano incompleto" fallback="/dieta" />
      <section className="verdict warn">
        <Icon name="alert" />
        <h1>{d.plan.viable ? 'Agora o estoque fecha a meta' : 'Seu estoque não fecha a meta'}</h1>
        <p className="tnum">
          Plano possível: {n0(d.plan.total.kcal)} de {n0(e.target)} kcal · {n0(d.plan.total.p)} de {e.protein} g de
          proteína
        </p>
      </section>
      <section className="card">
        <h2 className="h-sm">O que falta</h2>
        <ul className="mstat">
          {(['prot', 'carb'] as const).map((c) => (
            <li key={c}>
              <span>{FOOD_CATEGORY_LABEL[c]}</span>
              {d.plan.missing.includes(c) ? <Chip tone="err">nenhum no estoque</Chip> : <Chip tone="ok">ok</Chip>}
            </li>
          ))}
          <li>
            <span>Proteína do dia</span>
            <Chip tone={d.plan.coverage.protein > 0.85 ? 'ok' : 'err'}>
              {Math.round(d.plan.coverage.protein * 100)}% da meta
            </Chip>
          </li>
        </ul>
      </section>
      {sug.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Adicionar ao estoque</h2>
          </div>
          <div className="chips">
            {sug.map((f) => (
              <button
                type="button"
                key={f.id}
                className="fchip"
                disabled={save.isPending}
                onClick={() => save.mutate([...d.pantry, f.id], { onSuccess: () => toast(`${f.name} no estoque`) })}
              >
                <Icon name="plus" />
                {f.name}
              </button>
            ))}
          </div>
        </>
      )}
      <Note icon="box">Não colocamos no plano nada que você não marcou como disponível.</Note>
      <div className="footcta two">
        <button type="button" className="btn p" onClick={regen} disabled={reset.isPending}>
          Gerar de novo
        </button>
        <Link className="btn g" to="/dieta/estoque" viewTransition>
          Editar estoque
        </Link>
      </div>
    </div>
  );
}
