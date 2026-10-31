import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { SESSION_COOKIE, type SessionPayload } from './session'

type AuthedRequest = Request & { user?: User }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>()
    const token = req.cookies?.[SESSION_COOKIE]
    if (!token) throw new UnauthorizedException('Sessão expirada. Entre novamente.')
    let payload: SessionPayload
    try {
      payload = await this.jwt.verifyAsync<SessionPayload>(token)
    } catch {
      throw new UnauthorizedException('Sessão expirada. Entre novamente.')
    }
    const user = await this.users.findById(payload.sub)
    if (!user || user.tokenVersion !== payload.v) {
      throw new UnauthorizedException('Sessão expirada. Entre novamente.')
    }
    req.user = user
    return true
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user!,
)
