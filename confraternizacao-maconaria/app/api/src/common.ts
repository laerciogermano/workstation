import {
  BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, PipeTransform,
  SetMetadata, UnauthorizedException, createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from './config.js';
import { Db } from './database.js';
import { canSee, type ModuleKey, type ModuleSettings, type Role } from './modules.js';

// ---------- validação ----------
export class Zod<T extends z.ZodType> implements PipeTransform {
  constructor(private schema: T) {}
  transform(value: unknown): z.infer<T> {
    const r = this.schema.safeParse(value ?? {});
    if (!r.success) throw new BadRequestException(r.error.issues[0]?.message ?? 'Dados inválidos.');
    return r.data;
  }
}
export class Uuid implements PipeTransform {
  transform(value: string) {
    if (!z.uuid().safeParse(value).success) throw new NotFoundException('Não encontrado.');
    return value;
  }
}
export const text = (min: number, max: number, message: string) => z.string({ error: message }).trim().min(min, message).max(max, message);
export function found<T>(value: T | undefined | null, message = 'Não encontrado.'): T {
  if (value === undefined || value === null) throw new NotFoundException(message);
  return value;
}

// ---------- cookies de sessão ----------
export const cookie = (maxAgeMs: number) => ({ httpOnly: true, sameSite: 'strict' as const, secure: config.production, path: '/api', maxAge: maxAgeMs });
export const sign = (payload: object, seconds: number) => jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256', expiresIn: seconds });
export function unsign<T>(value: unknown): T | null {
  try { return jwt.verify(String(value), config.jwtSecret, { algorithms: ['HS256'] }) as T; } catch { return null; }
}
export const SESSION_SECONDS = 12 * 3600;
export function startSession(res: Response, user: { id: string; tokenVersion: number }) {
  res.cookie('cf_session', sign({ sub: user.id, tv: user.tokenVersion, kind: 'session' }, SESSION_SECONDS), cookie(SESSION_SECONDS * 1000));
}

export interface Me { id: string; email: string; name: string; tokenVersion: number }
export interface Membership { attendeeId: string; eventId: string; roles: Role[]; modules: ModuleSettings }
export type Req = Request & { user: Me; member: Membership };

/** CSRF: cookie SameSite=Strict e, em escrita, a origem precisa ser a do app. */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
    const origin = req.headers.origin;
    if (origin && origin !== config.origin && !(config.devTools && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) throw new ForbiddenException('Origem não permitida.');
    return true;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private db: Db) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Req>();
    const claims = unsign<{ sub: string; tv: number; kind: string }>(req.cookies?.cf_session);
    const user = claims?.kind === 'session' ? await this.db.one<Me>('select id, email, name, token_version from users where id = $1 and deleted_at is null', [claims.sub]) : undefined;
    if (!user || user.tokenVersion !== claims!.tv) throw new UnauthorizedException('Entre para continuar.');
    req.user = user;
    return true;
  }
}

export const InModule = (key: ModuleKey) => SetMetadata('module', key);
export const Only = (...roles: Role[]) => SetMetadata('roles', roles);

/** Nega por padrão: precisa participar do evento, ter o módulo visível e o papel exigido. */
@Injectable()
export class EventGuard implements CanActivate {
  constructor(private db: Db, private reflector: Reflector) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Req>();
    const eventId = String(req.params.eventId);
    if (!z.uuid().safeParse(eventId).success) throw new NotFoundException('Evento não encontrado.');
    const member = await this.db.one<Membership>(
      'select a.id as attendee_id, a.event_id, a.roles, e.modules from attendees a join events e on e.id = a.event_id where a.event_id = $1 and a.user_id = $2', [eventId, req.user.id]);
    if (!member) throw new ForbiddenException('Você não participa deste evento.');
    const targets = [ctx.getHandler(), ctx.getClass()];
    const key = this.reflector.getAllAndOverride<ModuleKey | undefined>('module', targets);
    if (key && !canSee(member.modules, key, member.roles)) throw new ForbiddenException('Este recurso não está disponível neste evento.');
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>('roles', targets);
    if (roles && !roles.some((r) => member.roles.includes(r))) throw new ForbiddenException('Você não tem permissão para isso.');
    req.member = member;
    return true;
  }
}

export const User = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<Req>().user);
export const Member = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<Req>().member);
