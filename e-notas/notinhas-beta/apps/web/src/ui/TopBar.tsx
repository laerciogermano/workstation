import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { useGo } from './nav';

export function TopBar({ title, sub, right, back = true }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; back?: boolean }) {
  const go = useGo();
  return (
    <header className="top">
      {back && (
        <button className="ib" onClick={() => go(-1)} aria-label="Voltar">
          <Icon name="back" />
        </button>
      )}
      <div className="tt">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  );
}
