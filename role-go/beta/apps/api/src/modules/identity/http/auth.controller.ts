import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ConsentBody,
  ForgotBody,
  GoogleBody,
  LoginBody,
  LogoutBody,
  type Me,
  type Providers,
  RegisterBody,
  ResetBody,
  VerifyEmailBody,
} from '@rolego/contracts';
import type { Request, Response } from 'express';
import { clearAuthCookies, RT_COOKIE, setAuthCookies } from '../../../shared/auth/cookies';
import type { SessionTokens } from '../../../shared/auth/sessions';
import { TokenService } from '../../../shared/auth/token.service';
import { AllowNoConsent, CurrentViewer, Public, type Viewer } from '../../../shared/auth/viewer';
import { AppError, unwrap } from '../../../shared/errors/app-error';
import { parseOrThrow } from '../../../shared/http/zod';
import { MeService } from '../../profile';
import { AuthService } from '../application/auth.service';

const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly me: MeService,
  ) {}

  private async respond(res: Response, userId: string, tokens: SessionTokens): Promise<Me> {
    setAuthCookies(res, tokens.access, tokens.refresh);
    const me = await this.me.getMe(userId);
    if (!me) throw new AppError('UNAUTHENTICATED');
    return me;
  }

  @Public()
  @Get('providers')
  providers(): Providers {
    return this.auth.providers();
  }

  @Public()
  @Post('register')
  @Throttle(AUTH_LIMIT)
  async register(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Me> {
    const r = unwrap(await this.auth.register(parseOrThrow(RegisterBody, body), req.get('user-agent')));
    return this.respond(res, r.user.id, r.tokens);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle(AUTH_LIMIT)
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Me> {
    const b = parseOrThrow(LoginBody, body);
    const r = unwrap(await this.auth.login(b.email, b.password, req.get('user-agent')));
    return this.respond(res, r.user.id, r.tokens);
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  @Throttle(AUTH_LIMIT)
  async google(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Me> {
    const b = parseOrThrow(GoogleBody, body);
    const r = unwrap(await this.auth.google(b.code, b.redirectUri, req.get('user-agent')));
    return this.respond(res, r.user.id, r.tokens);
  }

  @Post('consent')
  @HttpCode(200)
  @AllowNoConsent()
  async consent(@CurrentViewer() v: Viewer, @Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Me> {
    parseOrThrow(ConsentBody, body);
    const r = unwrap(await this.auth.consent(v.userId, req.get('user-agent')));
    return this.respond(res, r.user.id, r.tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[RT_COOKIE];
    const r = await this.auth.refresh(raw, req.get('user-agent'));
    if (!r.ok) {
      clearAuthCookies(res);
      throw AppError.from(r.error);
    }
    setAuthCookies(res, r.value.access, r.value.refresh);
  }

  @Post('logout')
  @HttpCode(204)
  @AllowNoConsent()
  async logout(@CurrentViewer() v: Viewer, @Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<void> {
    const b = parseOrThrow(LogoutBody, body);
    await this.auth.logout(v.userId, v.sid, b.everywhere ?? false);
    clearAuthCookies(res);
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async forgot(@Body() body: unknown): Promise<void> {
    await this.auth.forgot(parseOrThrow(ForgotBody, body).email);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(200)
  @Throttle(AUTH_LIMIT)
  async reset(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<Me> {
    const r = unwrap(await this.auth.reset(parseOrThrow(ResetBody, body), req.get('user-agent')));
    return this.respond(res, r.user.id, r.tokens);
  }

  @Post('email/verify/send')
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async sendVerify(@CurrentViewer() v: Viewer): Promise<void> {
    await this.auth.resendVerification(v.userId);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(204)
  async verify(@Body() body: unknown): Promise<void> {
    unwrap(await this.auth.verifyEmail(parseOrThrow(VerifyEmailBody, body).token));
  }
}

@Controller('.well-known')
export class JwksController {
  constructor(private readonly tokens: TokenService) {}
  @Public()
  @Get('jwks.json')
  jwks() {
    return this.tokens.jwks();
  }
}
