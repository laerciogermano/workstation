/** Valores canônicos de `cliente_linkedin.invite_status`. */
export type InviteStatus = 'connect' | 'pending' | 'connected';

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  connect: 'não enviado',
  pending: 'pendente',
  connected: 'conectado',
};

/**
 * Normaliza OCR/UI ("Connect", "Pending", …) → `connect` | `pending` | `connected`.
 * Desconhecido / vazio → `null` (não grava lixo).
 */
export function normalizeInviteStatus(
  raw: string | null | undefined,
): InviteStatus | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (
    s === 'connected' ||
    s === 'conectado' ||
    s === 'accepted' ||
    s === '1st'
  ) {
    return 'connected';
  }
  if (s === 'pending' || s === 'pendente' || s === 'convidado') {
    return 'pending';
  }
  if (
    s === 'connect' ||
    s === 'nao_enviado' ||
    s === 'não enviado' ||
    s === 'nao enviado' ||
    s === 'not_sent' ||
    s === 'none'
  ) {
    return 'connect';
  }
  return null;
}
