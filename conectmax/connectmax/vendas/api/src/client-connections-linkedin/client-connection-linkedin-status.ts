/**
 * Status da conexão LinkedIn (agente → cliente).
 * Persistido como inteiro na coluna `status`.
 */
export enum ClientConnectionLinkedinStatus {
  /** Fila / ainda não enviou convite. */
  NOT_SENT = 0,
  /** Convite enviado; aguardando aceite (Pending na UI). */
  PENDING = 1,
  /** Aceito / 1st connection. */
  CONNECTED = 2,
  /** Descartado (ex.: perfil LinkedIn inexistente). */
  DISCARDED = 3,
}

export const CLIENT_CONNECTION_LINKEDIN_STATUS_LABEL: Record<
  ClientConnectionLinkedinStatus,
  string
> = {
  [ClientConnectionLinkedinStatus.NOT_SENT]: 'nao_enviado',
  [ClientConnectionLinkedinStatus.PENDING]: 'pendente',
  [ClientConnectionLinkedinStatus.CONNECTED]: 'conectado',
  [ClientConnectionLinkedinStatus.DISCARDED]: 'descartado',
};
