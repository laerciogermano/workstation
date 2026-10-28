import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { AuthPrincipal } from './auth-user';
import { UserRole } from './roles';

type JwtPayload = {
  sub: string;
  email?: string;
  roles?: UserRole[];
  role?: UserRole;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-insecure-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthPrincipal> {
    if (!payload?.sub) throw new UnauthorizedException();
    const user = await this.auth.findById(payload.sub);
    if (!user || !user.active) throw new UnauthorizedException();
    const roles = this.auth.userRoles(user);
    return {
      sub: user.id,
      email: user.email,
      roles,
      role: this.auth.primaryRole(roles),
      kind: 'user',
    };
  }
}
