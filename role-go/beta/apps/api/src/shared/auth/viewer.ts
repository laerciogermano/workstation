import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../errors/app-error';

export type Viewer = { userId: string; role: 'user' | 'admin'; sid: string; amr: string[]; consented: boolean };
export type AuthedRequest = Request & { viewer?: Viewer };

export const IS_PUBLIC = 'rg:public';
export const ALLOW_NO_CONSENT = 'rg:allowNoConsent';
export const ROLES = 'rg:roles';

/** Rota pública: o viewer é opcional (preenchido se houver token válido). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const AllowNoConsent = () => SetMetadata(ALLOW_NO_CONSENT, true);
export const Roles = (...roles: ('admin' | 'user')[]) => SetMetadata(ROLES, roles);

export const CurrentViewer = createParamDecorator((_: unknown, ctx: ExecutionContext): Viewer => {
  const v = ctx.switchToHttp().getRequest<AuthedRequest>().viewer;
  if (!v) throw new AppError('UNAUTHENTICATED');
  return v;
});
export const OptionalViewer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Viewer | null => ctx.switchToHttp().getRequest<AuthedRequest>().viewer ?? null,
);
