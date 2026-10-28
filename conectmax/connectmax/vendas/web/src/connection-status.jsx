/**
 * Label evidente de status de conexão LinkedIn.
 * Aceita status int (0/1/2), inviteStatus string, ou kind do funil.
 */

const BY_INT = {
  0: { key: 'none', label: 'Não conectado' },
  1: { key: 'pending', label: 'Pendente' },
  2: { key: 'connected', label: 'Conectado' },
  3: { key: 'discarded', label: 'Descartado' },
};

const BY_INVITE = {
  connect: { key: 'none', label: 'Não conectado' },
  pending: { key: 'pending', label: 'Pendente' },
  connected: { key: 'connected', label: 'Conectado' },
};

const BY_COLUMN = {
  candidatos: { key: 'none', label: 'Não conectado' },
  convidados: { key: 'pending', label: 'Pendente' },
  conectados: { key: 'connected', label: 'Conectado' },
  abordados: { key: 'connected', label: 'Conectado' },
  respondidos: { key: 'connected', label: 'Conectado' },
  descartados: { key: 'discarded', label: 'Descartado' },
};

export function resolveConnectionStatus({
  status,
  inviteStatus,
  columnId,
} = {}) {
  if (status === 0 || status === 1 || status === 2 || status === 3) {
    return BY_INT[status];
  }
  if (status != null && Number.isFinite(Number(status))) {
    const n = Number(status);
    if (BY_INT[n]) return BY_INT[n];
  }
  const inv = String(inviteStatus || '')
    .toLowerCase()
    .trim();
  if (BY_INVITE[inv]) return BY_INVITE[inv];
  if (columnId && BY_COLUMN[columnId]) return BY_COLUMN[columnId];
  return { key: 'none', label: 'Não conectado' };
}

export function ConnectionStatusBadge({
  status,
  inviteStatus,
  columnId,
  className = '',
}) {
  const info = resolveConnectionStatus({ status, inviteStatus, columnId });
  return (
    <span
      className={`conn-badge conn-badge-${info.key}${className ? ` ${className}` : ''}`}
      title={`Conexão: ${info.label}`}
    >
      <span className="conn-badge-dot" aria-hidden />
      {info.label}
    </span>
  );
}
