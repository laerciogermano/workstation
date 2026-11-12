/** Componentes base (port do ui.js do protótipo v1 para React, mesmas classes e tokens --ft-*). */
import { AVATAR_COLORS, type DayStatus, type Nutrients, initialsOf, n0, n1 } from '@fitness/domain';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Icon } from './icon';

export function Wordmark({ size = '' }: { size?: string }) {
  return (
    <span className={`wm ${size}`}>
      <svg className="sym" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" stroke="var(--ft-line)" strokeWidth="5" />
        <path
          d="M16 5a11 11 0 1 1-10.4 14.6"
          fill="none"
          stroke="var(--ft-act)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3.2" fill="var(--ft-ink)" />
      </svg>
      <b>fitness</b>
    </span>
  );
}

export function useBack(fallback = '/') {
  const nav = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void nav(-1);
    else void nav(fallback, { replace: true });
  }, [nav, fallback]);
}

export function TopBar({
  title,
  sub,
  back = true,
  right,
  fallback,
}: {
  title: string;
  sub?: ReactNode;
  back?: boolean;
  right?: ReactNode;
  fallback?: string;
}) {
  const goBack = useBack(fallback);
  return (
    <header className="top">
      {back && (
        <button type="button" className="ib" onClick={goBack} aria-label="Voltar">
          <Icon name="back" />
        </button>
      )}
      <div className="tt">
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function BrandBar({ right, me }: { right?: ReactNode; me?: { nick: string; color: number } | null }) {
  return (
    <header className="top brand">
      <Wordmark />
      <span className="sp" />
      {right}
      <Link className={`ib${me ? ' av-ib' : ''}`} to="/voce" aria-label="Você" viewTransition>
        {me ? <Avatar nick={me.nick} color={me.color} size="sm" /> : <Icon name="user" />}
      </Link>
    </header>
  );
}

const TABS = [
  ['/', 'home', 'Hoje'],
  ['/dieta', 'bowl', 'Dieta'],
  ['/treino', 'dumbbell', 'Treino'],
  ['/corpo', 'body', 'Corpo'],
  ['/vitrine', 'trophy', 'Vitrine'],
] as const;

export function TabBar({ on }: { on: (typeof TABS)[number][0] }) {
  return (
    <nav className="tabbar" aria-label="Seções">
      {TABS.map(([to, icon, label]) => (
        <Link
          key={to}
          to={to}
          className={`tab${on === to ? ' on' : ''}`}
          aria-current={on === to ? 'page' : undefined}
          viewTransition
        >
          <Icon name={icon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export const Chip = ({ children, tone = '' }: { children: ReactNode; tone?: string }) => (
  <span className={`chip ${tone}`}>{children}</span>
);

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      className={`tog${on ? ' on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: { options: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void }) {
  const i = Math.max(
    0,
    options.findIndex((o) => o[0] === value),
  );
  return (
    <div className="seg" style={{ '--n': options.length, '--i': i } as React.CSSProperties} role="radiogroup">
      <span className="pill" />
      {options.map(([v, l]) => (
        <button
          type="button"
          key={v}
          className={v === value ? 'on' : ''}
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function NumStep({
  value,
  unit,
  step = 1,
  decimals = 0,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  unit: string;
  step?: number;
  decimals?: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const set = (d: number) => onChange(Math.min(max, Math.max(min, Math.round((value + d) * 10) / 10)));
  return (
    <div className="numstep" role="group" aria-label={label}>
      <button type="button" onClick={() => set(-step)} aria-label={`Menos ${label}`} disabled={value <= min}>
        <Icon name="minus" />
      </button>
      <span className="nv tnum" aria-live="polite">
        <b>{decimals ? n1(value) : value}</b>
        <i>{unit}</i>
      </span>
      <button type="button" onClick={() => set(step)} aria-label={`Mais ${label}`} disabled={value >= max}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function Avatar({ nick, color, size = '' }: { nick: string; color: number; size?: string }) {
  return (
    <span
      className={`av ${size}`}
      style={{ '--c': AVATAR_COLORS[color % AVATAR_COLORS.length] } as React.CSSProperties}
    >
      {initialsOf(nick)}
    </span>
  );
}

export const Stat = ({ v, l, tone = '' }: { v: ReactNode; l: string; tone?: string }) => (
  <div className={`st ${tone}`}>
    <b className="tnum">{v}</b>
    <span>{l}</span>
  </div>
);

export const Note = ({ children, icon = 'info', tone = '' }: { children: ReactNode; icon?: string; tone?: string }) => (
  <p className={`note ${tone}`}>
    <Icon name={icon} />
    <span>{children}</span>
  </p>
);

export const STATUS_TONE: Record<DayStatus, string> = { cumpriu: 'ok', abaixo: 'warn', estourou: 'err', vazio: 'meta' };

function MacroBar({ name, val, target, cls }: { name: string; val: number; target: number; cls: string }) {
  const p = target ? Math.min(100, (val / target) * 100) : 0;
  return (
    <div className={`mb ${cls}`}>
      <p>
        <span>{name}</span>
        <b className="tnum">
          {n0(val)}
          <i>/{n0(target)} g</i>
        </b>
      </p>
      <div className="bar">
        <i style={{ width: `${p}%` }} className={val > target * 1.08 ? 'over' : undefined} />
      </div>
    </div>
  );
}

export function MacroBars({ c, e }: { c: Nutrients; e: { protein: number; carbs: number; fat: number } }) {
  return (
    <div className="mbs">
      <MacroBar name="Proteína" val={c.p} target={e.protein} cls="mp" />
      <MacroBar name="Carbo" val={c.c} target={e.carbs} cls="mc" />
      <MacroBar name="Gordura" val={c.g} target={e.fat} cls="mg" />
    </div>
  );
}

export function Bar({ pct, small, over }: { pct: number; small?: boolean; over?: boolean }) {
  return (
    <div className={`bar${small ? ' sm' : ''}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} className={over ? 'over' : undefined} />
    </div>
  );
}

export function Loading() {
  return (
    <div className="body" aria-busy="true">
      <span className="skel" style={{ height: 50, width: '60%', borderRadius: 12 }} />
      <span className="skel" style={{ height: 160, borderRadius: 22 }} />
      <span className="skel" style={{ height: 70, borderRadius: 18 }} />
      <span className="skel" style={{ height: 70, borderRadius: 18 }} />
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <section className="empty">
      <Icon name="alert" />
      <h1>Não deu para carregar</h1>
      <p>{error instanceof Error ? error.message : 'Tente de novo.'}</p>
      {retry && (
        <div className="cta-col">
          <button type="button" className="btn p" onClick={retry}>
            Tentar de novo
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- toast ---------- */
interface ToastMsg {
  msg: string;
  to?: string;
  label?: string;
  id: number;
}
const ToastCtx = createContext<(msg: string, action?: { to: string; label: string }) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((msg: string, action?: { to: string; label: string }) => {
    clearTimeout(timer.current);
    setT({ msg, id: Date.now(), ...(action ? { to: action.to, label: action.label } : {}) });
    timer.current = setTimeout(() => setT(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div className="toast anim" role="status" key={t.id}>
          <Icon name="check" />
          <span>{t.msg}</span>
          {t.to && (
            <Link to={t.to} onClick={() => setT(null)} viewTransition>
              {t.label}
            </Link>
          )}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

/* ---------- sheet ---------- */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="sheet anim" role="dialog" aria-modal="true">
        <i className="grab" />
        {children}
      </div>
    </>
  );
}
