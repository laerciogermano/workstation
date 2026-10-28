import { UserRole } from './roles';

export type AuthPrincipal = {
  /** user id, `service` (chave global) ou uuid do agente */
  sub: string;
  email?: string;
  /** Roles do usuário (união). Service = `['admin']` efetivo via kind. */
  roles: UserRole[];
  /** Compat: primeira role / admin se presente. */
  role: UserRole | 'service';
  kind: 'user' | 'service' | 'agent';
  /** Preenchido quando kind=agent (X-Api-Key por agente). */
  agentId?: string;
};
