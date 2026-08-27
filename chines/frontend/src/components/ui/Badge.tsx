type Variant = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export function Badge({ children, variant = 'neutral' }: Props) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function classificationBadge(c: string) {
  const map: Record<string, Variant> = {
    regular: 'success',
    irregular: 'danger',
    pendente: 'warning',
    descartado: 'neutral',
  };
  return map[c] ?? 'neutral';
}

export function occurrenceStatusBadge(s: string) {
  const map: Record<string, Variant> = {
    Identificada: 'info',
    Enviada: 'info',
    'Aguardando correção': 'warning',
    Corrigida: 'success',
    Reincidente: 'danger',
  };
  return map[s] ?? 'neutral';
}
