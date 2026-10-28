import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPrincipal } from './auth-user';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { RESOURCE_KEY } from './resource.decorator';
import { rolesHavePermission, UserRole } from './roles';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const explicit = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const resource = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let required = explicit;
    if (!required?.length && resource) {
      const method = context.switchToHttp().getRequest<{ method?: string }>()
        .method;
      const verb =
        method === 'GET' || method === 'HEAD' ? 'read' : 'write';
      required = [`${resource}:${verb}`];
    }
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthPrincipal }>();
    const user = req.user;
    if (!user) throw new ForbiddenException();

    if (user.kind === 'service') return true;
    /** Worker: só rotas `@Resource('agente')` (fila claim/complete). */
    if (user.kind === 'agent') {
      if (resource === 'agente') return true;
      throw new ForbiddenException(
        'API key de agente só acessa /agente/* (fila do worker)',
      );
    }
    if (user.roles?.includes(UserRole.Admin) || user.role === UserRole.Admin) {
      return true;
    }

    const ok = required.some((p) => rolesHavePermission(user.roles, p));
    if (!ok) {
      throw new ForbiddenException(
        `Permissão necessária: ${required.join(' | ')}`,
      );
    }
    return true;
  }
}
