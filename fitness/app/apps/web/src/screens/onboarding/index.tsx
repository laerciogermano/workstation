/**
 * E01 · Onboarding = cadastro metabólico (F-02..F-06). Rascunho local até concluir; concluir grava o
 * perfil na API (RF-09) e libera o app (RF-05). Cálculos ao vivo com o mesmo domínio do servidor.
 */
import {
  ACTIVITIES,
  GOALS,
  type MetabolicProfile,
  PROFILE_LIMITS,
  STRATEGY_LABEL,
  activityOf,
  energyOf,
  goalOf,
  n0,
  n1,
  projection,
  sgn,
  tmbOf,
} from '@fitness/domain';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { errorText, isApiError } from '../../lib/api';
import { addWeeksLabel } from '../../lib/format';
import { useSaveProfile } from '../../lib/queries';
import { useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import { Chip, Note, NumStep, Seg, Sheet, Stat, TopBar, useToast } from '../../ui/kit';
import { LineChart } from '../../ui/viz';

type Draft = MetabolicProfile & { ok: boolean };
const KEY = 'ft-onb';
const DEFAULT: Draft = {
  sex: 'f',
  age: 30,
  heightCm: 168,
  weightKg: 70,
  activity: 'moderado',
  goal: 'definicao',
  magnitudePct: 20,
  ok: false,
};

const Ctx = createContext<{ d: Draft; set: (p: Partial<Draft>) => void } | null>(null);
function useDraft() {
  const c = useContext(Ctx);
  if (!c) throw new Error('fora do onboarding');
  return c;
}

function Provider({ children }: { children: ReactNode }) {
  const { me } = useSession();
  const [d, setD] = useState<Draft>(() => {
    try {
      const s = sessionStorage.getItem(KEY);
      if (s) return { ...DEFAULT, ...(JSON.parse(s) as Partial<Draft>) };
    } catch {
      /* ignora rascunho inválido */
    }
    const p = me.profile;
    return p
      ? {
          sex: p.sex,
          age: p.age,
          heightCm: p.heightCm,
          weightKg: p.weightKg,
          activity: p.activity,
          goal: p.goal,
          magnitudePct: p.magnitudePct,
          ok: p.extremeConfirmed,
        }
      : DEFAULT;
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* sem storage */
    }
  }, [d]);
  return <Ctx.Provider value={{ d, set: (p) => setD((x) => ({ ...x, ...p })) }}>{children}</Ctx.Provider>;
}

const Dots = ({ i }: { i: number }) => (
  <div className="obdots" aria-label={`Etapa ${i} de 5`}>
    {[1, 2, 3, 4, 5].map((k) => (
      <i key={k} className={k <= i ? 'on' : ''} />
    ))}
  </div>
);

function Foot({ children, two }: { children: ReactNode; two?: boolean }) {
  return <div className={`footcta${two ? ' two' : ''}`}>{children}</div>;
}

/** F-02 · Sobre você (RF-06, RF-11 · RN-03) */
function AboutYou() {
  const { d, set } = useDraft();
  const nav = useNavigate();
  const ch = (p: Partial<Draft>) => set({ ...p, ok: false });
  return (
    <div className="body ob ft">
      <TopBar title="" right={<Dots i={1} />} fallback="/bem-vindo" />
      <h1 className="h-lg">Sobre você</h1>
      <p className="lede">Só o necessário para estimar quanto seu corpo gasta em repouso.</p>
      <div className="fld">
        <label>Sexo para o cálculo</label>
        <Seg
          options={
            [
              ['f', 'Feminino'],
              ['m', 'Masculino'],
            ] as const
          }
          value={d.sex}
          onChange={(sex) => ch({ sex })}
        />
        <p className="hint">A fórmula usa valores diferentes para cada um. Não aparece em lugar nenhum.</p>
      </div>
      <div className="fgrid">
        <div className="fld">
          <label>Idade</label>
          <NumStep
            label="idade"
            value={d.age}
            unit="anos"
            min={PROFILE_LIMITS.age[0]}
            max={PROFILE_LIMITS.age[1]}
            onChange={(age) => ch({ age })}
          />
        </div>
        <div className="fld">
          <label>Altura</label>
          <NumStep
            label="altura"
            value={d.heightCm}
            unit="cm"
            min={PROFILE_LIMITS.heightCm[0]}
            max={PROFILE_LIMITS.heightCm[1]}
            onChange={(heightCm) => ch({ heightCm })}
          />
        </div>
      </div>
      <div className="fld">
        <label>Peso de hoje</label>
        <NumStep
          label="peso"
          value={d.weightKg}
          unit="kg"
          step={0.5}
          decimals={1}
          min={PROFILE_LIMITS.weightKg[0]}
          max={PROFILE_LIMITS.weightKg[1]}
          onChange={(weightKg) => ch({ weightKg })}
        />
      </div>
      <div className="live">
        <Icon name="flame" />
        <span>TMB estimada</span>
        <b className="tnum">{n0(tmbOf(d))} kcal</b>
      </div>
      <Foot>
        <button type="button" className="btn p" onClick={() => nav('/comecar/rotina', { viewTransition: true })}>
          Continuar
        </button>
      </Foot>
    </div>
  );
}

/** F-03 · Rotina e atividade (RF-07, RF-12) */
function Routine() {
  const { d, set } = useDraft();
  const nav = useNavigate();
  return (
    <div className="body ob ft">
      <TopBar title="" right={<Dots i={2} />} />
      <h1 className="h-lg">Como é sua semana?</h1>
      <p className="lede">Conte o movimento fora do treino também: trabalho, deslocamento, filhos.</p>
      <div className="opts" role="radiogroup">
        {ACTIVITIES.map((a) => (
          <button
            type="button"
            key={a.id}
            role="radio"
            aria-checked={d.activity === a.id}
            className={`opt${d.activity === a.id ? ' on' : ''}`}
            onClick={() => set({ activity: a.id })}
          >
            <span className="rd" />
            <div>
              <b>{a.name}</b>
              <span>{a.desc}</span>
            </div>
            <span className="tnum f">× {a.factor.toLocaleString('pt-BR')}</span>
          </button>
        ))}
      </div>
      <div className="live">
        <Icon name="zap" />
        <span>Gasto diário estimado</span>
        <b className="tnum">{n0(tmbOf(d) * activityOf(d.activity).factor)} kcal</b>
      </div>
      <Foot>
        <button type="button" className="btn p" onClick={() => nav('/comecar/objetivo', { viewTransition: true })}>
          Continuar
        </button>
      </Foot>
    </div>
  );
}

/** F-04 · Objetivo (RF-08, RF-13 · RN-04, RN-05, RN-06) */
function GoalStep() {
  const { d, set } = useDraft();
  const nav = useNavigate();
  return (
    <div className="body ob ft">
      <TopBar title="" right={<Dots i={3} />} />
      <h1 className="h-lg">O que você quer agora?</h1>
      <p className="lede">Dá para mudar depois. A dieta e o treino se ajustam.</p>
      <div className="goals" role="radiogroup">
        {GOALS.map((g) => (
          <button
            type="button"
            key={g.id}
            role="radio"
            aria-checked={d.goal === g.id}
            className={`goal${d.goal === g.id ? ' on' : ''}`}
            onClick={() => set({ goal: g.id, magnitudePct: g.defaultPct, ok: false })}
          >
            <Icon name={g.icon} />
            <b>{g.name}</b>
            <span>{g.sub}</span>
            <Chip tone={g.strategy}>
              {STRATEGY_LABEL[g.strategy]}
              {g.defaultPct ? ` ${g.strategy === 'deficit' ? '−' : '+'}${g.defaultPct}%` : ''}
            </Chip>
          </button>
        ))}
      </div>
      <Foot>
        <button type="button" className="btn p" onClick={() => nav('/comecar/base', { viewTransition: true })}>
          Ver minha base
        </button>
      </Foot>
    </div>
  );
}

/** Sheet de confirmação fora da faixa segura (RN-16). */
export function ExtremeSheet({
  open,
  onClose,
  energy,
  profile,
  onSafe,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  energy: ReturnType<typeof energyOf>;
  profile: MetabolicProfile;
  onSafe: () => void;
  onConfirm: () => void;
}) {
  const g = goalOf(profile.goal);
  return (
    <Sheet open={open} onClose={onClose}>
      <h2>{energy.target < energy.tmb ? 'Meta abaixo da TMB' : 'Acima da faixa segura'}</h2>
      <p>
        {n0(energy.target)} kcal/dia é {energy.strategy === 'deficit' ? 'um déficit' : 'um superávit'} de{' '}
        {energy.magnitudePct}%. Pode funcionar por pouco tempo, mas aumenta perda de massa magra, fome e risco de
        abandono. Converse com um profissional antes.
      </p>
      <div className="cta-col">
        <button type="button" className="btn s" onClick={onSafe}>
          Voltar para {g.safePct}%
        </button>
        <button type="button" className="btn danger" onClick={onConfirm}>
          Entendo, seguir com {energy.magnitudePct}%
        </button>
      </div>
    </Sheet>
  );
}

/** F-05 · Sua base e estratégia (RF-09, RF-11, RF-12, RF-14 · RN-15, RN-16) */
function Base() {
  const { d, set } = useDraft();
  const nav = useNavigate();
  const [sheet, setSheet] = useState(false);
  const e = energyOf(d);
  const g = goalOf(d.goal);
  const a = activityOf(d.activity);
  const needsConfirm = e.extreme && !d.ok;
  return (
    <div className="body ob ft">
      <TopBar title="" right={<Dots i={4} />} />
      <h1 className="h-lg">Sua base</h1>
      <div className="kpis">
        <Stat v={n0(e.tmb)} l="TMB · kcal em repouso" />
        <Stat v={n0(e.tdee)} l="Gasto diário estimado" />
      </div>
      <div className={`meta-card ${e.strategy}`}>
        <p>
          <Chip tone={e.strategy}>{STRATEGY_LABEL[e.strategy]}</Chip> {g.name.toLowerCase()}
        </p>
        <b className="tnum">
          {n0(e.target)}
          <i>kcal/dia</i>
        </b>
        <span className="tnum">{e.diff ? `${sgn(e.diff, n0)} kcal vs gasto` : 'igual ao gasto'}</span>
      </div>
      {g.strategy === 'manutencao' ? (
        <p className="hint">Na manutenção a meta acompanha o gasto diário.</p>
      ) : (
        <div className="fld">
          <label htmlFor="mag">
            Tamanho do {g.strategy === 'deficit' ? 'déficit' : 'superávit'} <b className="tnum">{e.magnitudePct}%</b>
          </label>
          <input
            id="mag"
            type="range"
            className={`rng${e.extreme ? ' bad' : ''}`}
            min={g.minPct}
            max={g.maxPct}
            step={5}
            value={e.magnitudePct}
            onChange={(ev) => set({ magnitudePct: Number(ev.target.value), ok: false })}
            style={{ '--p': `${((e.magnitudePct - g.minPct) / (g.maxPct - g.minPct)) * 100}%` } as React.CSSProperties}
          />
          <div className="rl">
            <span>{g.minPct}% leve</span>
            <span>faixa segura até {g.safePct}%</span>
            <span>{g.maxPct}%</span>
          </div>
        </div>
      )}
      {e.extreme && (
        <Note icon="alert" tone="warn">
          {e.target < e.tmb
            ? 'A meta ficou abaixo da sua TMB. Só seguimos com sua confirmação.'
            : 'Acima da faixa segura. Só seguimos com sua confirmação.'}
        </Note>
      )}
      <details className="disc">
        <summary>
          <Icon name="info" />
          Como calculamos
        </summary>
        <p>
          TMB pela Mifflin–St Jeor: 10 × peso + 6,25 × altura − 5 × idade {d.sex === 'm' ? '+ 5' : '− 161'}. Gasto = TMB
          × {a.factor.toLocaleString('pt-BR')} ({a.name.toLowerCase()}). São estimativas: o peso real das próximas
          semanas corrige o rumo.
        </p>
      </details>
      <Foot>
        <button
          type="button"
          className="btn p"
          onClick={() => (needsConfirm ? setSheet(true) : nav('/comecar/macros', { viewTransition: true }))}
        >
          {needsConfirm ? 'Revisar e confirmar' : 'Ver macros e projeção'}
        </button>
      </Foot>
      <ExtremeSheet
        open={sheet}
        onClose={() => setSheet(false)}
        energy={e}
        profile={d}
        onSafe={() => {
          set({ magnitudePct: g.safePct });
          setSheet(false);
        }}
        onConfirm={() => {
          set({ ok: true });
          setSheet(false);
          void nav('/comecar/macros', { viewTransition: true });
        }}
      />
    </div>
  );
}

/** F-06 · Macros e projeção (RF-09, RF-15, RF-16 · RN-08, RN-09). Concluir libera o app (RF-05). */
function Macros() {
  const { d } = useDraft();
  const nav = useNavigate();
  const toast = useToast();
  const save = useSaveProfile();
  const e = energyOf(d);
  if (e.extreme && !d.ok) return <Navigate to="/comecar/base" replace />;
  const pr = projection(d);
  const k = [e.protein * 4, e.carbs * 4, e.fat * 9] as const;
  const tot = k[0] + k[1] + k[2];
  const end = pr[pr.length - 1]?.weightKg ?? d.weightKg;
  const g = goalOf(d.goal);
  const finish = (to: string) =>
    save.mutate(
      { ...d, confirmExtreme: d.ok },
      {
        onSuccess: () => {
          sessionStorage.removeItem(KEY);
          toast('Pronto · meta e macros calculadas');
          void nav(to, { replace: true, viewTransition: true });
        },
      },
    );
  const legend = [
    ['Proteína', e.protein, k[0], 'mp', `${n1(g.proteinPerKg)} g/kg`],
    ['Carbo', e.carbs, k[1], 'mc', 'o restante'],
    ['Gordura', e.fat, k[2], 'mg', `${n1(e.fat / d.weightKg)} g/kg`],
  ] as const;
  return (
    <div className="body ob ft">
      <TopBar title="" right={<Dots i={5} />} />
      <h1 className="h-lg">Seu dia em números</h1>
      <p className="lede">{n0(e.target)} kcal divididas assim:</p>
      <div className="mstack">
        <i className="mp" style={{ flex: k[0] }} />
        <i className="mc" style={{ flex: k[1] }} />
        <i className="mg" style={{ flex: k[2] }} />
      </div>
      <div className="mleg">
        {legend.map(([l, gr, kc, c, s]) => (
          <div className={c} key={l}>
            <span>{l}</span>
            <b className="tnum">{gr} g</b>
            <i className="tnum">
              {Math.round((kc / tot) * 100)}% · {s}
            </i>
          </div>
        ))}
      </div>
      <section className="card">
        <h2 className="h-sm">Projeção · 12 semanas</h2>
        <LineChart proj={pr.map((p) => ({ x: p.week * 7, y: p.weightKg }))} today={0} h={150} />
        <p className="proj-sum">
          <b className="tnum">
            {n1(d.weightKg)} → {n1(end)} kg
          </b>{' '}
          em {addWeeksLabel(12)}
        </p>
        <ul className="prem">
          <li>85% de adesão à meta</li>
          <li>Gasto recalculado a cada semana com o peso novo</li>
          {e.strategy === 'superavit' && <li>Ganho limitado a 0,35 kg/semana</li>}
          <li>Atualiza quando você registra peso</li>
        </ul>
      </section>
      {save.error && (
        <p className="err-box" role="alert">
          {isApiError(save.error, 'EXTREME_NEEDS_CONFIRMATION')
            ? 'Confirme a meta fora da faixa segura.'
            : errorText(save.error)}
        </p>
      )}
      <Foot two>
        <button type="button" className="btn p" disabled={save.isPending} onClick={() => finish('/dieta/estoque')}>
          Montar dieta com o que tenho
        </button>
        <button type="button" className="btn g" disabled={save.isPending} onClick={() => finish('/')}>
          Ir para o dia de hoje
        </button>
      </Foot>
    </div>
  );
}

export function OnboardingRoutes() {
  return (
    <Provider>
      <Routes>
        <Route path="voce" element={<AboutYou />} />
        <Route path="rotina" element={<Routine />} />
        <Route path="objetivo" element={<GoalStep />} />
        <Route path="base" element={<Base />} />
        <Route path="macros" element={<Macros />} />
        <Route path="*" element={<Navigate to="voce" replace />} />
      </Routes>
    </Provider>
  );
}
