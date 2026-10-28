/** Papéis do painel ConnectMax — um usuário pode ter vários ao mesmo tempo. */
export enum UserRole {
  Admin = 'admin',
  Dev = 'dev',
  Gestor = 'gestor',
  Operador = 'operador',
  Viewer = 'viewer',
}

export const ALL_USER_ROLES: readonly UserRole[] = [
  UserRole.Admin,
  UserRole.Dev,
  UserRole.Gestor,
  UserRole.Operador,
  UserRole.Viewer,
];

/**
 * Permissões granulares. `*` = tudo.
 * Um usuário acumula a união das permissões de todas as roles.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  [UserRole.Admin]: [
    '*',
    'users:read',
    'users:write',
    'agentes:read',
    'agentes:write',
  ],
  [UserRole.Dev]: [
    'profiles:read',
    'profiles:write',
    'connections:read',
    'connections:write',
    'messages:read',
    'messages:write',
    'empresas:read',
    'empresas:write',
    'clientes:read',
    'clientes:write',
    'gestores:read',
    'gestores:write',
    'dashboard:read',
    'extract:read',
    'extract:write',
    'agente:read',
    'agente:write',
    'agentes:read',
    'agentes:write',
  ],
  [UserRole.Gestor]: [
    'gestores:read',
    'dashboard:read',
    'profiles:read',
    'connections:read',
    'messages:read',
    'empresas:read',
    'agente:read',
    'agentes:read',
    'agentes:write',
  ],
  [UserRole.Operador]: [
    'profiles:read',
    'profiles:write',
    'connections:read',
    'connections:write',
    'messages:read',
    'messages:write',
    'empresas:read',
    'empresas:write',
    'clientes:read',
    'clientes:write',
    'gestores:read',
    'gestores:write',
    'dashboard:read',
    'extract:read',
    'extract:write',
    'agente:read',
    'agente:write',
    'agentes:read',
    'agentes:write',
  ],
  [UserRole.Viewer]: [
    'profiles:read',
    'connections:read',
    'messages:read',
    'empresas:read',
    'clientes:read',
    'gestores:read',
    'dashboard:read',
    'extract:read',
    'agente:read',
    'agentes:read',
  ],
};

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    (ALL_USER_ROLES as readonly string[]).includes(value)
  );
}

/** Normaliza entrada (string legada, array) → roles únicas válidas. */
export function normalizeRoles(input: unknown): UserRole[] {
  const raw: unknown[] = Array.isArray(input)
    ? input
    : input != null && input !== ''
      ? [input]
      : [];
  const out: UserRole[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isUserRole(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function roleHasPermission(
  role: UserRole | string,
  permission: string,
): boolean {
  const list = ROLE_PERMISSIONS[role as UserRole];
  if (!list) return false;
  if (list.includes('*')) return true;
  if (list.includes(permission)) return true;
  const [res] = permission.split(':');
  return list.includes(`${res}:*`);
}

export function rolesHavePermission(
  roles: readonly (UserRole | string)[] | null | undefined,
  permission: string,
): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => roleHasPermission(r, permission));
}

/** União das permissões de todas as roles (dedupe, `*` no topo). */
export function permissionsForRoles(
  roles: readonly UserRole[],
): string[] {
  const set = new Set<string>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p);
  }
  if (set.has('*')) return ['*', ...[...set].filter((p) => p !== '*')];
  return [...set];
}

export function userHasRole(
  roles: readonly (UserRole | string)[] | null | undefined,
  role: UserRole,
): boolean {
  return Boolean(roles?.includes(role));
}
