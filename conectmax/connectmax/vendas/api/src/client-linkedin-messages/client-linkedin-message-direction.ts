/** Direção da mensagem no fio com o cliente LinkedIn. */
export enum ClientLinkedinMessageDirection {
  SENT = 'sent',
  RECEIVED = 'received',
}

export const CLIENT_LINKEDIN_MESSAGE_DIRECTIONS = [
  ClientLinkedinMessageDirection.SENT,
  ClientLinkedinMessageDirection.RECEIVED,
] as const;
