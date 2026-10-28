import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { Agente } from '../agentes/agente.entity';
import { hashApiKey, safeEqualStr } from './api-key-hash';
import { AuthPrincipal } from './auth-user';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserRole } from './roles';

@Injectable()
export class AuthGuard
  extends PassportAuthGuard('jwt')
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    @InjectRepository(Agente)
    private readonly agentes: Repository<Agente>,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthPrincipal;
    }>();

    const apiKeyHeader = req.headers['x-api-key'];
    const apiKey =
      typeof apiKeyHeader === 'string'
        ? apiKeyHeader
        : Array.isArray(apiKeyHeader)
          ? apiKeyHeader[0]
          : undefined;

    if (apiKey) {
      const expected = this.config.get<string>('AGENT_API_KEY')?.trim();
      if (expected && safeEqualStr(apiKey, expected)) {
        req.user = {
          sub: 'service',
          roles: [UserRole.Admin],
          role: UserRole.Admin,
          kind: 'service',
        };
        return true;
      }

      const hash = hashApiKey(apiKey);
      const agent = await this.agentes
        .createQueryBuilder('a')
        .addSelect('a.apiKeyHash')
        .where('a.apiKeyHash = :hash', { hash })
        .getOne();
      if (agent?.nome) {
        req.user = {
          sub: agent.id,
          roles: [],
          role: 'service',
          kind: 'agent',
          agentId: agent.nome,
        };
        return true;
      }
    }

    try {
      const ok = await super.canActivate(context);
      return ok as boolean;
    } catch {
      throw new UnauthorizedException('Token ou API key inválidos');
    }
  }
}
