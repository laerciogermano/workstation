import { Link } from 'react-router-dom';

type Breadcrumb = { label: string; to?: string };

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  screenId?: string;
  stories?: string;
};

export function PageHeader({ title, description, breadcrumbs, screenId, stories }: Props) {
  return (
    <header className="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={b.label}>
              {i > 0 && ' · '}
              {b.to ? <Link to={b.to}>{b.label}</Link> : b.label}
            </span>
          ))}
        </nav>
      )}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {(screenId || stories) && (
        <div className="meta-row">
          {screenId && <span>{screenId}</span>}
          {stories && <span>{stories}</span>}
        </div>
      )}
    </header>
  );
}
