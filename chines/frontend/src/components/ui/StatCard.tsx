type Props = {
  label: string;
  value: string | number;
  variant?: 'default' | 'danger' | 'success' | 'warning';
};

export function StatCard({ label, value, variant = 'default' }: Props) {
  const colors: Record<string, string> = {
    default: undefined as unknown as string,
    danger: '#dc2626',
    success: '#059669',
    warning: '#d97706',
  };
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={variant !== 'default' ? { color: colors[variant] } : undefined}>
        {value}
      </div>
    </div>
  );
}
