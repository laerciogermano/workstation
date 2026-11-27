import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Post, Req as Request_, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { AuthGuard, User, Zod, cookie, sign, text, unsign, type Me } from '../common.js';
import { config } from '../config.js';
import { Db } from '../database.js';
import { encrypt, newTotpSecret } from './crypto.js';
import { MfaService, maskPhone } from './mfa.service.js';

const method = z.enum(['app', 'sms', 'email']);
const setupBody = z.object({ method, phone: text(0, 30, 'Celular inválido.').default('') });
const activateBody = z.object({ challengeId: z.uuid(), code: text(6, 6, 'Digite o código de 6 dígitos.') });
const stepStartBody = z.object({ method: z.enum(['app', 'sms', 'email', 'backup']).optional() });
const stepBody = z.object({ challengeId: z.uuid(), code: text(6, 12, 'Digite o código.') });
type Row = { id: string; email: string; phone: string; mfaEnabled: boolean; mfaMethod: 'app' | 'sms' | 'email' | null };

const STEP_MS = 5 * 60_000;

@Controller('security') @UseGuards(AuthGuard)
@Throttle({ default: { limit: config.devTools ? 600 : 30, ttl: 60_000 } })
export class SecurityController {
  constructor(private db: Db, private mfa: MfaService) {}

  private user(id: string) { return this.db.one<Row>('select id, email, phone, mfa_enabled, mfa_method from users where id = $1', [id]).then((u) => u!); }

  /** mudar a verificação já ativa exige um código confirmado há pouco */
  private async fresh(req: Request, user: Row) {
    if (!user.mfaEnabled) return;
    const claims = unsign<{ sub: string; kind: string }>(req.cookies?.cf_stepup);
    if (claims?.kind !== 'stepup' || claims.sub !== user.id) throw new ForbiddenException('Confirme um código antes de mudar a segurança.');
  }

  @Get()
  async status(@User() me: Me, @Request_() req: Request) {
    const u = await this.user(me.id);
    const codes = await this.db.one<{ n: number }>('select count(*) as n from backup_codes where user_id = $1 and used_at is null', [me.id]);
    const devices = await this.db.many('select id, label, expires_at from trusted_devices where user_id = $1 and expires_at > now() order by expires_at desc', [me.id]);
    const claims = unsign<{ sub: string; kind: string }>(req.cookies?.cf_stepup);
    return {
      enabled: u.mfaEnabled, method: u.mfaMethod, methods: await this.mfa.methods(me.id), phone: maskPhone(u.phone),
      backupCodesLeft: codes!.n, trustedDevices: devices, confirmed: claims?.kind === 'stepup' && claims.sub === me.id,
    };
  }

  @Post('step-up') @HttpCode(200)
  async stepUp(@User() me: Me, @Body(new Zod(stepStartBody)) b: z.infer<typeof stepStartBody>) {
    const u = await this.user(me.id);
    if (!u.mfaEnabled) throw new BadRequestException('A verificação está desativada.');
    const methods = await this.mfa.methods(me.id);
    const chosen = b.method ?? u.mfaMethod!;
    if (chosen !== 'backup' && !methods.includes(chosen)) throw new BadRequestException('Método não configurado.');
    const c = await this.mfa.start(u, 'stepup', chosen);
    return { challengeId: c.id, method: c.method, destination: c.destination, methods, devCode: c.devCode };
  }

  @Post('step-up/verify') @HttpCode(200)
  async stepVerify(@User() me: Me, @Body(new Zod(stepBody)) b: z.infer<typeof stepBody>, @Res({ passthrough: true }) res: Response) {
    const c = await this.mfa.get(b.challengeId, me.id, 'stepup');
    if (!c) throw new BadRequestException('O tempo acabou. Peça um novo código.');
    await this.mfa.check(c, b.code);
    res.cookie('cf_stepup', sign({ sub: me.id, kind: 'stepup' }, STEP_MS / 1000), cookie(STEP_MS));
    return { ok: true };
  }

  @Post('setup') @HttpCode(200)
  async setup(@User() me: Me, @Body(new Zod(setupBody)) b: z.infer<typeof setupBody>, @Request_() req: Request) {
    const u = await this.user(me.id);
    await this.fresh(req, u);
    if (b.method === 'sms' && b.phone.replace(/\D/g, '').length < 10) throw new BadRequestException('Informe o celular com DDD.');
    const secret = b.method === 'app' ? newTotpSecret() : undefined;
    const c = await this.mfa.start(u, 'setup', b.method, { secret: secret && encrypt(secret), phone: b.method === 'sms' ? b.phone : undefined });
    return {
      challengeId: c.id, method: b.method, destination: c.destination, devCode: c.devCode,
      ...(secret ? { secret, qr: await QRCode.toDataURL(`otpauth://totp/${encodeURIComponent(`Confraternização:${u.email}`)}?secret=${secret}&issuer=${encodeURIComponent('Confraternização')}`, { margin: 1, width: 336 }) } : {}),
    };
  }

  @Post('activate') @HttpCode(200)
  async activate(@User() me: Me, @Body(new Zod(activateBody)) b: z.infer<typeof activateBody>, @Request_() req: Request) {
    await this.fresh(req, await this.user(me.id));
    const c = await this.mfa.get(b.challengeId, me.id, 'setup');
    if (!c || c.method === 'backup') throw new BadRequestException('O tempo acabou. Comece de novo.');
    await this.mfa.check(c, b.code);
    const step = c.usedStep ?? 0; // o código usado na ativação não vale de novo
    await this.db.tx(async (q) => {
      await q.many(`insert into mfa_factors (user_id, method, secret, last_step) values ($1,$2,$3,$4)
        on conflict (user_id, method) do update set secret = excluded.secret, last_step = excluded.last_step, is_active = true`, [me.id, c.method, c.secret, step]);
      await q.many('update users set mfa_enabled = true, mfa_method = $2, phone = coalesce($3, phone) where id = $1', [me.id, c.method, c.phone]);
    });
    return { backupCodes: await this.mfa.newBackupCodes(me.id) };
  }

  @Post('backup-codes') @HttpCode(200)
  async codes(@User() me: Me, @Request_() req: Request) {
    const u = await this.user(me.id);
    if (!u.mfaEnabled) throw new BadRequestException('Ative a verificação primeiro.');
    await this.fresh(req, u);
    return { backupCodes: await this.mfa.newBackupCodes(me.id) };
  }

  @Post('disable') @HttpCode(200)
  async disable(@User() me: Me, @Request_() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.fresh(req, await this.user(me.id));
    await this.db.tx(async (q) => {
      await q.many('update users set mfa_enabled = false, mfa_method = null where id = $1', [me.id]);
      for (const table of ['mfa_factors', 'backup_codes', 'trusted_devices']) await q.many(`delete from ${table} where user_id = $1`, [me.id]);
    });
    res.clearCookie('cf_stepup', { path: '/api' });
    return { ok: true };
  }

  @Delete('trusted-devices')
  async forget(@User() me: Me, @Res({ passthrough: true }) res: Response) {
    await this.db.many('delete from trusted_devices where user_id = $1', [me.id]);
    res.clearCookie('cf_device', { path: '/api' });
    return { ok: true };
  }
}
