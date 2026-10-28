import { ForbiddenException } from '@nestjs/common';
import { AuthPrincipal } from '../auth/auth-user';

/** Chave de agente só opera o próprio agentId (uuid) ou nome legado no path. */
export function assertAgentScope(
  user: AuthPrincipal | undefined,
  agentId: string,
): void {
  if (!user || user.kind !== 'agent') return;
  const ok =
    user.agentId === agentId ||
    (user.agentNome != null && user.agentNome === agentId);
  if (!ok) {
    throw new ForbiddenException(
      `API key do agente ${user.agentId} não pode acessar ${agentId}`,
    );
  }
}
