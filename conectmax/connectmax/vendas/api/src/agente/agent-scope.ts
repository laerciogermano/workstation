import { ForbiddenException } from '@nestjs/common';
import { AuthPrincipal } from '../auth/auth-user';

/** Chave de agente só opera o próprio agentId. */
export function assertAgentScope(
  user: AuthPrincipal | undefined,
  agentId: string,
): void {
  if (!user || user.kind !== 'agent') return;
  if (user.agentId !== agentId) {
    throw new ForbiddenException(
      `API key do agente ${user.agentId} não pode acessar ${agentId}`,
    );
  }
}
