import type { Accent, PersonRef } from '@rolego/contracts';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type JSX, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId, useState } from 'react';
import { initials } from '../lib/format';
import { Icon, type IconName } from './Icon';
import s from './ui.module.css';

export const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ');

const ACCENT_VAR: Record<Accent, string> = {
  cyan: 'var(--rg-cyan)',
  magenta: 'var(--rg-magenta)',
  yellow: 'var(--rg-yellow)',
  green: 'var(--rg-green)',
  violet: 'var(--rg-violet)',
};
export const accentStyle = (a: Accent, prop: '--pc' | '--bar' = '--pc'): React.CSSProperties => ({ [prop]: ACCENT_VAR[a] }) as React.CSSProperties;

export function Wordmark({ size = 28, glow = false }: { size?: number; glow?: boolean }): JSX.Element {
  return (
    <span className={cx(s.wm, glow && s.glow)} style={{ fontSize: size }} aria-label="RoleGo">
      <span aria-hidden>Role</span>
      <span className={s.wmGo} aria-hidden>
        G<span className={s.pin} />
      </span>
    </span>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'secondaryMagenta' | 'ghost' | 'danger' | 'private';
export function Button({ variant = 'primary', small, loading, icon, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; small?: boolean; loading?: boolean; icon?: IconName }): JSX.Element {
  const v = variant === 'private' ? cx(s.primary, s.privateCta) : s[variant];
  return (
    <button type="button" className={cx(s.btn, v, small && s.sm, className)} disabled={rest.disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className={s.spinner} aria-hidden /> : icon ? <Icon name={icon} size="s" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, glass, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; glass?: boolean; badge?: number }): JSX.Element {
  return (
    <button type="button" className={cx(s.iconBtn, glass && s.glass)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
      {badge ? <span className={s.dot}>{badge}</span> : null}
    </button>
  );
}

export function Chip({ on, small, children, onClick, removable }: { on?: boolean; small?: boolean; children: ReactNode; onClick?: () => void; removable?: boolean }): JSX.Element {
  return (
    <button type="button" className={cx(s.chip, on && s.chipOn, small && s.chipSm)} aria-pressed={on} onClick={onClick}>
      {children}
      {removable ? <span aria-hidden>×</span> : null}
    </button>
  );
}

export type BadgeTone = 'cyan' | 'magenta' | 'yellow' | 'green' | 'violet' | 'neutral' | 'dark';
export function Badge({ tone = 'neutral', children, live }: { tone?: BadgeTone; children: ReactNode; live?: boolean }): JSX.Element {
  return (
    <span className={cx(s.badge, s[`b-${tone}`])}>
      {live ? <span className={s.liveDot} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Title({ children, accent }: { children: ReactNode; accent?: Accent }): JSX.Element {
  const style = accent ? ({ '--bar': ACCENT_VAR[accent], '--barGlow': ACCENT_VAR[accent] } as React.CSSProperties) : undefined;
  return (
    <h1 className={s.h1} style={style}>
      {children}
    </h1>
  );
}

export function Section({ children, accent = 'magenta', right }: { children: ReactNode; accent?: Accent; right?: ReactNode }): JSX.Element {
  return (
    <h2 className={s.sec} style={accentStyle(accent, '--bar')}>
      {children}
      {right ? <span className={s.secRight}>{right}</span> : null}
    </h2>
  );
}

export function Field({ label, hint, error, children }: { label?: string; hint?: string | undefined; error?: string | undefined; children: (id: string) => ReactNode }): JSX.Element {
  const id = useId();
  return (
    <div className={s.field}>
      {label ? (
        <label className={s.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children(id)}
      {error ? (
        <p className={cx(s.hint, s.hintErr)} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={s.hint}>{hint}</p>
      ) : null}
    </div>
  );
}

/** Defaults estilo app: sem autofill/sugestões do browser (override com props). */
const APP_INPUT = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
} as const;

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string | undefined; error?: string | undefined }
>(function TextInput({ label, hint, error, className, ...rest }, ref): JSX.Element {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <input
          id={id}
          ref={ref}
          {...APP_INPUT}
          {...rest}
          className={cx(s.input, error && s.inputErr, className)}
          aria-invalid={!!error}
          onDoubleClick={(e) => {
            e.preventDefault();
            rest.onDoubleClick?.(e);
          }}
        />
      )}
    </Field>
  );
});

export function TextArea({ label, hint, error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string | undefined; error?: string | undefined }): JSX.Element {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <textarea
          id={id}
          {...APP_INPUT}
          {...rest}
          className={cx(s.input, error && s.inputErr, className)}
          aria-invalid={!!error}
          onDoubleClick={(e) => {
            e.preventDefault();
            rest.onDoubleClick?.(e);
          }}
        />
      )}
    </Field>
  );
}

export function Select({ label, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }): JSX.Element {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} className={s.input} autoComplete="off" {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }): JSX.Element {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }): JSX.Element {
  return <input type="checkbox" role="switch" className={s.toggle} checked={checked} aria-label={label} onChange={(e) => onChange(e.target.checked)} />;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon?: IconName }[]; onChange: (v: T) => void; label: string }): JSX.Element {
  return (
    <div className={s.seg} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={cx(s.segItem, value === o.value && s.segOn)} onClick={() => onChange(o.value)}>
          {o.icon ? <Icon name={o.icon} size="s" /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RangeSlider({ value, min, max, onChange, label, scale }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; scale?: string[] }): JSX.Element {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <input
        type="range"
        className={s.range}
        min={min}
        max={max}
        value={value}
        aria-label={label}
        aria-valuetext={`${value} km`}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {scale ? (
        <div className={s.scale} aria-hidden>
          {scale.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProgressSteps({ total, current }: { total: number; current: number }): JSX.Element {
  return (
    <div className={s.prog} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`Passo ${current} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < current ? s.progOn : undefined} />
      ))}
    </div>
  );
}

export function NeonCard({ accent = 'violet', children, className, onClick }: { accent?: Accent; children: ReactNode; className?: string; onClick?: () => void }): JSX.Element {
  const props = { className: cx(s.ncard, className), style: accentStyle(accent) };
  return onClick ? (
    <button type="button" {...props} onClick={onClick} style={{ ...props.style, width: '100%', textAlign: 'left' }}>
      {children}
    </button>
  ) : (
    <div {...props}>{children}</div>
  );
}

const AV_GRADIENTS = ['var(--rg-g-avatar-1)', 'var(--rg-g-avatar-2)', 'var(--rg-g-avatar-3)', 'var(--rg-g-avatar-4)', 'var(--rg-g-avatar-5)', 'var(--rg-g-avatar-6)'];
const hashName = (n: string) => [...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Avatar({ name, url, size }: { name: string; url: string | null; size?: 'md' | 'lg' }): JSX.Element {
  const src = url?.trim() || null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImg = !!src && failedSrc !== src;
  return (
    <span className={cx(s.av, size === 'md' && s.avMd, size === 'lg' && s.avLg)} style={{ background: AV_GRADIENTS[hashName(name) % AV_GRADIENTS.length] }} title={name} aria-label={name}>
      {showImg ? <img src={src} alt="" width={88} height={88} loading="lazy" onError={() => setFailedSrc(src)} /> : initials(name)}
    </span>
  );
}

/** `blurred`: mantém as fotos, só esmaece (visitante). */
export function AvatarStack({ people, extra, blurred }: { people: PersonRef[]; extra?: number; blurred?: boolean }): JSX.Element {
  return (
    <span className={cx(s.avs, blurred && s.avsBlur)} aria-hidden={blurred || undefined} title={blurred ? 'Cadastre-se para ver quem vai' : undefined}>
      {people.map((p) => (
        <Avatar key={p.id} name={p.name} url={p.photoUrl} />
      ))}
      {extra && extra > 0 ? <span className={cx(s.av, s.avMore)}>+{extra}</span> : null}
    </span>
  );
}

export function Stars({ value, onChange, big }: { value: number; onChange?: (v: number) => void; big?: boolean }): JSX.Element {
  return (
    <div className={s.stars} role={onChange ? 'radiogroup' : 'img'} aria-label={onChange ? 'Nota' : `${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" className={s.starBtn} role="radio" aria-checked={value === n} aria-label={`${n} estrela${n > 1 ? 's' : ''}`} onClick={() => onChange(n)}>
            <Icon name="star" size={big ? 'xl' : 'l'} className={n > value ? s.starOff : undefined} />
          </button>
        ) : (
          <Icon key={n} name="star" size="s" className={n > Math.round(value) ? s.starOff : undefined} />
        ),
      )}
    </div>
  );
}

export function EmptyState({ icon = 'compass', title, hint, action }: { icon?: IconName; title: string; hint?: string; action?: ReactNode }): JSX.Element {
  return (
    <div className={s.empty}>
      <span className={s.emptyIco}>
        <Icon name={icon} size="l" />
      </span>
      <p className={cx(s.b, s.lg)}>{title}</p>
      {hint ? <p className={s.small}>{hint}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }): JSX.Element {
  return (
    <EmptyState
      icon="x"
      title="Ops"
      hint={message}
      action={
        onRetry ? (
          <Button variant="secondary" small onClick={onRetry}>
            Tentar de novo
          </Button>
        ) : undefined
      }
    />
  );
}

export function Skeleton({ height = 160, className }: { height?: number; className?: string }): JSX.Element {
  return <div className={cx(s.skel, className)} style={{ height }} aria-hidden />;
}

export function Loading(): JSX.Element {
  return (
    <div className={s.center} role="status" aria-label="Carregando">
      <span className={s.spinner} />
    </div>
  );
}

export function ListRow({ icon, children, onClick, tone, right }: { icon: IconName; children: ReactNode; onClick?: () => void; tone?: 'magenta'; right?: ReactNode }): JSX.Element {
  return (
    <button type="button" className={s.lrow} onClick={onClick}>
      <span className={s.lrowIco} style={tone ? { color: 'var(--rg-magenta)' } : undefined}>
        <Icon name={icon} />
      </span>
      <span className={cx(s.grow, s.b, tone === 'magenta' && s.mg)}>{children}</span>
      {right ?? (tone ? null : <Icon name="chev" className={s.muted} />)}
    </button>
  );
}

export { s as ui };
