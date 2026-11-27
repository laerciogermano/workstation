import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, Post, Req as Request_, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthGuard, User, Zod, cookie, sign, startSession, text, unsign, type Me } from '../common.js';
import { config } from '../config.js';
import { Db } from '../database.js';
import { digest, hashPassword, token, verifyPassword } from './crypto.js';
import { MfaService, type Challenge } from './mfa.service.js';

export const email = z.string({ error: 'Informe um e-mail válido.' }).trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'));
export const password = z.string({ error: 'A senha precisa ter pelo menos 8 caracteres.' }).min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(200);

const registerBody = z.object({
  name: text(2, 120, 'Informe seu nome completo.'), email, password,
  obedience: text(0, 80, 'Potência inválida.').default(''), lodge: text(0, 120, 'Loja inválida.').default(''),
  cim: text(0, 30, 'CIM inválido.').default(''), city: text(0, 80, 'Cidade inválida.').default(''), country: text(0, 60, 'País inválido.').default('Brasil'),
});
const loginBody = z.object({ email, password: z.string().min(1, 'Informe a senha.').max(200) });
const verifyBody = z.object({ code: text(6, 12, 'Digite o código.'), trustDevice: z.boolean().default(false) });
const switchBody = z.object({ method: z.enum(['app', 'sms', 'email', 'backup']) });

const CHALLENGE_MS = 10 * 60_000, TRUST_MS = 30 * 86_400_000;
type User_ = { id: string; email: string; phone: string; passwordHash: string; mfaEnabled: boolean; mfaMethod: 'app' | 'sms' | 'email'; tokenVersion: number };
// senha errada para e-mail inexistente gasta o mesmo tempo
const decoy = hashPassword('conta-inexistente');

const limit = (n: number) => Throttle({ default: { limit: config.devTools ? n * 20 : n, ttl: 60_000 } });

@Controller('auth')
export class AuthController {
  constructor(private db: Db, private mfa: MfaService) {}

  @Get('config')
  config_() { return { devTools: config.devTools }; }

  @Post('register') @limit(5)
  async register(@Body(new Zod(registerBody)) b: z.infer<typeof registerBody>, @Res({ passthrough: true }) res: Response) {
    const event = await this.db.one<{ id: string }>('select id from events where slug = $1', [config.defaultEvent]);
    const hash = await hashPassword(b.password);
    const user = await this.db.tx(async (q) => {
      const u = await q.one<{ id: string; tokenVersion: number }>(
        `insert into users (email, password_hash, name, city, country) values ($1,$2,$3,$4,$5)
         on conflict (lower(email)) where deleted_at is null do nothing returning id, token_version`, [b.email, hash, b.name, b.city, b.country]);
      if (!u) throw new ConflictException('Já existe uma conta com este e-mail.');
      if (event) await q.many('insert into attendees (event_id, user_id, lodge, obedience, cim) values ($1,$2,$3,$4,$5)',
        [event.id, u.id, b.lodge, b.obedience, b.obedience.startsWith('GOB') ? b.cim : '']);
      return u;
    });
    startSession(res, user);
    return { ok: true };
  }

  @Post('login') @HttpCode(200) @limit(10)
  async login(@Body(new Zod(loginBody)) b: z.infer<typeof loginBody>, @Request_() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.db.one<User_>('select * from users where lower(email) = $1 and deleted_at is null', [b.email]);
    const ok = await verifyPassword(user?.passwordHash ?? (await decoy), b.password);
    if (!user || !ok) throw new UnauthorizedException('E-mail ou senha incorretos.');
    const trusted = req.cookies?.cf_device && (await this.db.one('select id from trusted_devices where user_id = $1 and token_hash = $2 and expires_at > now()', [user.id, digest(req.cookies.cf_device)]));
    if (!user.mfaEnabled || trusted) { startSession(res, user); return { mfaRequired: false }; }
    return this.challenge(res, user, user.mfaMethod, 0);
  }

  private async challenge(res: Response, user: User_, method: 'app' | 'sms' | 'email' | 'backup', attempts: number) {
    const c = await this.mfa.start(user, 'login', method, { attempts });
    res.cookie('cf_login', sign({ sub: user.id, cid: c.id, kind: 'login' }, CHALLENGE_MS / 1000), cookie(CHALLENGE_MS));
    return { mfaRequired: true, method: c.method, destination: c.destination, methods: await this.mfa.methods(user.id), devCode: c.devCode };
  }

  private async pending(req: Request): Promise<{ user: User_; challenge: Challenge }> {
    const claims = unsign<{ sub: string; cid: string; kind: string }>(req.cookies?.cf_login);
    const user = claims?.kind === 'login' ? await this.db.one<User_>('select * from users where id = $1 and deleted_at is null', [claims.sub]) : undefined;
    const challenge = user && (await this.mfa.get(claims!.cid, user.id, 'login'));
    if (!user || !challenge) throw new UnauthorizedException('O tempo acabou. Entre de novo.');
    return { user, challenge };
  }

  /** trocar de método ou reenviar não zera as tentativas */
  @Post('mfa/method') @HttpCode(200) @limit(10)
  async method(@Body(new Zod(switchBody)) b: z.infer<typeof switchBody>, @Request_() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, challenge } = await this.pending(req);
    if (b.method !== 'backup' && !(await this.mfa.methods(user.id)).includes(b.method)) throw new BadRequestException('Método não configurado.');
    await this.db.many('update challenges set consumed_at = now() where id = $1', [challenge.id]);
    return this.challenge(res, user, b.method, challenge.attempts);
  }

  @Post('mfa/verify') @HttpCode(200) @limit(15)
  async verify(@Body(new Zod(verifyBody)) b: z.infer<typeof verifyBody>, @Request_() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, challenge } = await this.pending(req);
    await this.mfa.check(challenge, b.code);
    res.clearCookie('cf_login', { path: '/api' });
    if (b.trustDevice) {
      const t = token();
      await this.db.many(`insert into trusted_devices (user_id, token_hash, label, expires_at) values ($1,$2,$3, now() + interval '30 days')`,
        [user.id, digest(t), String(req.headers['user-agent'] ?? '').slice(0, 200)]);
      res.cookie('cf_device', t, cookie(TRUST_MS));
    }
    startSession(res, user);
    return { ok: true };
  }

  @Post('logout') @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    for (const name of ['cf_session', 'cf_login', 'cf_stepup']) res.clearCookie(name, { path: '/api' });
    return { ok: true };
  }

  /** encerra as sessões em todos os aparelhos */
  @Post('logout-all') @HttpCode(200) @UseGuards(AuthGuard)
  async logoutAll(@User() me: Me, @Res({ passthrough: true }) res: Response) {
    await this.db.many('update users set token_version = token_version + 1 where id = $1', [me.id]);
    await this.db.many('delete from trusted_devices where user_id = $1', [me.id]);
    return this.logout(res);
  }
}
