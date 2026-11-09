import type { ReactNode } from 'react';
import { CATEGORIES } from '@notinhas/domain';
import { brl } from '../lib/format';
import { Icon, type IconName } from './Icon';

export function Photo({ url, category, size = '', alt = '' }: { url: string | null | undefined; category?: string | undefined; size?: '' | 'sm' | 'xs' | 'xl'; alt?: string }) {
  if (url)
    return (
      <div className={`ph ${size}`}>
        <img src={url} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  const icon = (CATEGORIES.find((c) => c.id === category)?.icon ?? 'box') as IconName;
  return (
    <div className={`ph ph-empty ${size}`}>
      <Icon name={icon} />
    </div>
  );
}

/** Preço tabular; verde só quando é o menor (RN-05, DESIGN.md: verde = menor preço). */
export function Price({ cents, menor = false, className = '' }: { cents: number; menor?: boolean; className?: string }) {
  return <span className={`price tnum ${menor ? 'menor' : ''} ${className}`}>{brl(cents)}</span>;
}

export const Chip = ({ children, kind = '' }: { children: ReactNode; kind?: '' | 'menor' | 'meta' | 'warn' }) => <span className={`chip ${kind}`}>{children}</span>;

/** REQ-046: verde = com EAN · vermelho = faltam */
export function Progress({ done, total, receipts, compact = false }: { done: number; total: number; receipts?: number; compact?: boolean }) {
  const p = total ? Math.round((done / total) * 100) : 0;
  const miss = total - done;
  return (
    <div className={`prog ${compact ? 'compact' : ''}`} role="img" aria-label={`${done} de ${total} itens com código de barras`}>
      <div className="bar">
        <i style={{ width: `${p}%` }} />
        <b style={{ width: `${100 - p}%` }} />
      </div>
      <p className="tnum">
        <span className="ok">
          {done} com EAN ({p}%)
        </span>
        {miss > 0 && (
          <>
            {' · '}
            <span className="miss">
              {miss} {miss === 1 ? 'falta' : 'faltam'}
            </span>
          </>
        )}
        {` · ${total} itens`}
        {receipts !== undefined && ` · ${receipts} nota${receipts === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}

export const Skel = ({ h = 12, w = '100%', r = 6 }: { h?: number; w?: string | number; r?: number }) => (
  <span className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />
);

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <p>
        <b>{title}</b>
        {children && <br />}
        {children}
      </p>
    </div>
  );
}

export function StateView({ icon, tone = '', title, children }: { icon: IconName; tone?: '' | 'err' | 'warn' | 'ok'; title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <span className={`sticon ${tone}`}>
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="stepper" role="group" aria-label="Quantidade">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Menos">
        <Icon name="minus" />
      </button>
      <span className="tnum" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} aria-label="Mais">
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={`tog ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : 'Algo deu errado.';
  return (
    <div className="banner err" role="alert">
      <Icon name="alert" />
      <span>{msg}</span>
    </div>
  );
}
