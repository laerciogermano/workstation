/** F-60 · Você: perfil e recálculo (RF-03, RF-10, RF-14 · RN-07, RN-08, RN-15, RN-16) + tema e apagar dados (RNF-01). */
import {
  ACTIVITIES,
  GOALS,
  type MetabolicProfile,
  PROFILE_LIMITS,
  STRATEGY_LABEL,
  clampMagnitude,
  energyOf,
  goalOf,
  n0,
} from '@fitness/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { errorText } from '../lib/api';
import { fingerprintLabel, resetFingerprint, setToken } from '../lib/device';
import { clearPhotos } from '../lib/photos';
import { useSaveProfile, useWipe } from '../lib/queries';
import { useSession } from '../lib/session';
import { THEMES, type ThemeId, applyTheme, currentTheme } from '../lib/theme';
import { Icon } from '../ui/icon';
import { Chip, Note, NumStep, Sheet, TopBar, useToast } from '../ui/kit';
import { ExtremeSheet } from './onboarding';

export function You() {
  const { me } = useSession();
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const save = useSaveProfile();
  const wipe = useWipe();
  const p = me.profile;
  const base: MetabolicProfile | null = p
    ? {
        sex: p.sex,
        age: p.age,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        activity: p.activity,
        goal: p.goal,
        magnitudePct: p.magnitudePct,
      }
    : null;
  const [draft, setDraft] = useState<MetabolicProfile | null>(base);
  const [sheet, setSheet] = useState<'extreme' | 'wipe' | null>(null);
  const [theme, setTheme] = useState<ThemeId>(currentTheme);
  if (!base || !draft || !p) return null;
  const before = energyOf(base);
  const e = energyOf(draft);
  const changed = JSON.stringify(base) !== JSON.stringify(draft);
  const extremeOk = p.extremeConfirmed && draft.goal === base.goal && draft.magnitudePct === base.magnitudePct;

  const apply = (confirm: boolean) =>
    save.mutate(
      { ...draft, confirmExtreme: confirm },
      {
        onSuccess: () => {
          setSheet(null);
          toast(`Recalculado · meta ${n0(e.target)} kcal e plano novo`, { to: '/dieta', label: 'Ver dieta' });
        },
      },
    );
  const ba = (l: string, a: number, b: number, u: string) => (
    <li key={l}>
      <span>{l}</span>
      <b className="tnum">
        {a === b ? (
          `${n0(b)}${u}`
        ) : (
          <>
            <s>{n0(a)}</s> → {n0(b)}
            {u}
          </>
        )}
      </b>
    </li>
  );
  const doWipe = () =>
    wipe.mutate(undefined, {
      onSettled: async () => {
        await clearPhotos();
        setToken(null);
        resetFingerprint();
        sessionStorage.clear();
        qc.clear();
        window.localStorage.removeItem('ft-cache');
        window.location.assign('/bem-vindo');
      },
    });

  return (
    <div className="body ft">
      <TopBar title="Você" />
      <div className="fpcard">
        <Icon name="finger" />
        <div>
          <b>Sem conta neste aparelho</b>
          <p>
            ID <span className="mono">{fingerprintLabel()}</span> · dados guardados aqui
            {me.character ? ` · personagem @${me.character.nick}` : ''}
          </p>
        </div>
      </div>
      <div className="fld">
        <label>Peso</label>
        <NumStep
          label="peso"
          value={draft.weightKg}
          unit="kg"
          step={0.5}
          decimals={1}
          min={PROFILE_LIMITS.weightKg[0]}
          max={PROFILE_LIMITS.weightKg[1]}
          onChange={(weightKg) => setDraft({ ...draft, weightKg })}
        />
      </div>
      <div className="fld">
        <label>Objetivo</label>
        <div className="chips">
          {GOALS.map((g) => (
            <button
              type="button"
              key={g.id}
              className={`fchip${draft.goal === g.id ? ' on' : ''}`}
              aria-pressed={draft.goal === g.id}
              onClick={() => setDraft({ ...draft, goal: g.id, magnitudePct: clampMagnitude(g.id, g.defaultPct) })}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <div className="fld">
        <label>Atividade</label>
        <div className="chips">
          {ACTIVITIES.map((a) => (
            <button
              type="button"
              key={a.id}
              className={`fchip${draft.activity === a.id ? ' on' : ''}`}
              aria-pressed={draft.activity === a.id}
              onClick={() => setDraft({ ...draft, activity: a.id })}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>
      <section className={`card${changed ? ' changed' : ''}`}>
        <div className="ch-h">
          <h2 className="h-sm">{changed ? 'Vai mudar' : 'Estratégia atual'}</h2>
          <Chip tone={e.strategy}>
            {STRATEGY_LABEL[e.strategy]}
            {e.magnitudePct ? ` ${e.magnitudePct}%` : ''}
          </Chip>
        </div>
        <ul className="mstat">
          {ba('TMB', before.tmb, e.tmb, ' kcal')}
          {ba('Gasto diário', before.tdee, e.tdee, ' kcal')}
          {ba('Meta', before.target, e.target, ' kcal')}
          {ba('Proteína', before.protein, e.protein, ' g')}
          {ba('Carbo', before.carbs, e.carbs, ' g')}
          {ba('Gordura', before.fat, e.fat, ' g')}
        </ul>
      </section>
      {e.extreme && (
        <Note icon="alert" tone="warn">
          Fora da faixa segura: aplicar pede confirmação.
        </Note>
      )}
      <div className="fld">
        <label>Tema</label>
        <div className="chips">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`fchip${theme === t.id ? ' on' : ''}`}
              aria-pressed={theme === t.id}
              onClick={() => {
                applyTheme(t.id);
                setTheme(t.id);
              }}
            >
              <i
                className="swd"
                style={{ background: `linear-gradient(135deg, ${t.sw[0]} 0 50%, ${t.sw[1]} 50% 100%)` }}
              />
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="row2">
        <button
          type="button"
          className="btn s"
          onClick={() => {
            sessionStorage.removeItem('ft-onb');
            void nav('/comecar/voce', { viewTransition: true });
          }}
        >
          Refazer onboarding
        </button>
        <button type="button" className="btn danger" onClick={() => setSheet('wipe')}>
          <Icon name="trash" />
          Apagar dados
        </button>
      </div>
      <p className="fine">Estimativas de apoio. Não substituem orientação médica ou nutricional.</p>
      {save.error && <p className="err-box">{errorText(save.error)}</p>}
      <div className="footcta">
        <button
          type="button"
          className="btn p"
          disabled={!changed || save.isPending}
          onClick={() => (e.extreme && !extremeOk ? setSheet('extreme') : apply(extremeOk))}
        >
          Aplicar e recalcular plano
        </button>
      </div>
      <ExtremeSheet
        open={sheet === 'extreme'}
        onClose={() => setSheet(null)}
        energy={e}
        profile={draft}
        onSafe={() => {
          setDraft({ ...draft, magnitudePct: goalOf(draft.goal).safePct });
          setSheet(null);
        }}
        onConfirm={() => apply(true)}
      />
      <Sheet open={sheet === 'wipe'} onClose={() => setSheet(null)}>
        <h2>Apagar dados deste aparelho?</h2>
        <p>Perfil, dieta, treinos, medidas, fotos e personagem somem. Sem conta, não há como recuperar.</p>
        <div className="cta-col">
          <button type="button" className="btn danger" onClick={doWipe} disabled={wipe.isPending}>
            Apagar tudo
          </button>
          <button type="button" className="btn g" onClick={() => setSheet(null)}>
            Cancelar
          </button>
        </div>
      </Sheet>
    </div>
  );
}
