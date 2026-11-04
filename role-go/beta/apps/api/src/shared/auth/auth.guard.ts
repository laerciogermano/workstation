import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../errors/app-error';
import { AT_COOKIE } from './cookies';
import { DenylistService } from './denylist.service';
import { TokenService } from './token.service';
import { ALLOW_NO_CONSENT, type AuthedRequest, IS_PUBLIC, ROLES } from './viewer';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Guard global: CSRF (header + Origin), JWT, denylist, consentimento e papéis. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly denylist: DenylistService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets) ?? false;

    if (MUTATING.has(req.method) && req.path.startsWith('/api/')) {
      if (req.get('x-requested-with') !== 'rolego') throw new AppError('FORBIDDEN', 'CSRF');
      const origin = req.get('origin');
      if (origin && req.get('host') && new URL(origin).host !== req.get('host') && !this.isAllowedOrigin(origin)) {
        throw new AppError('FORBIDDEN', 'Origin');
      }
    }

    const auth = req.get('authorization');
    const raw = (req.cookies as Record<string, string> | undefined)?.[AT_COOKIE] ?? (auth?.startsWith('Bearer ') ? auth.slice(7) : undefined);
    if (raw) {
      try {
        const c = await this.tokens.verifyAccess(raw);
        if (this.denylist.isDenied(c.sub, c.iat)) throw new AppError('UNAUTHENTICATED');
        req.viewer = { userId: c.sub, role: c.role, sid: c.sid, amr: c.amr, consented: c.cns };
      } catch (e) {
        // Em rota pública um token ruim só vira visitante; expirado ainda avisa o cliente para renovar.
        const expired = e instanceof AppError && e.code === 'TOKEN_EXPIRED';
        if (!isPublic || (expired && !req.path.startsWith('/api/v1/auth/'))) throw e;
      }
    }
    if (isPublic) return true;
    const v = req.viewer;
    if (!v) throw new AppError('UNAUTHENTICATED');
    const allowNoConsent = this.reflector.getAllAndOverride<boolean>(ALLOW_NO_CONSENT, targets) ?? false;
    if (!v.consented && !allowNoConsent) throw new AppError('CONSENT_REQUIRED');
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES, targets);
    if (roles && !roles.includes(v.role)) throw new AppError('FORBIDDEN');
    return true;
  }

  private isAllowedOrigin(origin: string): boolean {
    try {
      return new URL(origin).host === new URL(process.env.APP_URL ?? '').host;
    } catch {
      return false;
    }
  }
}
