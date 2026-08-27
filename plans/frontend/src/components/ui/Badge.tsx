import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'exec';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
