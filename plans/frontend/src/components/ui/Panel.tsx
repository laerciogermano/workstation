import type { ReactNode } from 'react';

export function Panel({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div className="panel-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
