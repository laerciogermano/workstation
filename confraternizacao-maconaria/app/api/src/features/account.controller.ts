import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Patch, Put, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { z } from 'zod';
import { AuthGuard, User, Zod, startSession, text, type Me } from '../common.js';
import { config } from '../config.js';
import { Db } from '../database.js';
import { hashPassword, verifyPassword } from '../auth/crypto.js';
import { email, password } from '../auth/auth.controller.js';

const profileBody = z.object({
  name: text(2, 120, 'Informe seu nome.'), email, phone: text(0, 30, 'Telefone inválido.'), city: text(0, 80, 'Cidade inválida.'), country: text(0, 60, 'País inválido.'),
  currentPassword: z.string().max(200).optional(),
  // imagem pequena, já reduzida no aparelho; só data URL de imagem
  photo: z.string().max(400_000, 'Foto grande demais.').regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'Envie uma imagem JPG, PNG ou WebP.').nullable().optional(),
});
const passwordBody = z.object({ current: z.string().min(1, 'Informe a senha atual.').max(200), next: password });
const confirmBody = z.object({ password: z.string({ error: 'Informe sua senha.' }).min(1, 'Informe sua senha.').max(200) });
const consentBody = z.object({ analytics: z.boolean() });
const SHORTCUTS = ['membership_card', 'tickets', 'parking', 'buy', 'vouchers', 'products', 'news', 'support', 'museum'] as const;
const shortcutsBody = z.object({ shortcuts: z.array(z.enum(SHORTCUTS)).max(4, 'Escolha até 4 atalhos.') });

@Controller('me') @UseGuards(AuthGuard)
export class AccountController {
  constructor(private db: Db) {}

  private async checkPassword(userId: string, given?: string) {
    const u = await this.db.one<{ passwordHash: string }>('select password_hash from users where id = $1', [userId]);
    if (!given || !(await verifyPassword(u!.passwordHash, given))) throw new BadRequestException('Senha atual incorreta.');
  }

  @Get()
  async me(@User() me: Me) {
    const user = await this.db.one('select id, email, name, phone, city, country, photo, shortcuts, mfa_enabled from users where id = $1', [me.id]);
    const consent = await this.db.one<{ accepted: boolean }>(`select accepted from consents where user_id = $1 and type = 'analytics' order by at desc limit 1`, [me.id]);
    return { ...user, analyticsConsent: consent?.accepted ?? null };
  }

  @Patch() @Throttle({ default: { limit: config.devTools ? 600 : 20, ttl: 60_000 } })
  async update(@User() me: Me, @Body(new Zod(profileBody)) b: z.infer<typeof profileBody>) {
    if (b.email !== me.email.toLowerCase()) {
      // o e-mail também recebe códigos de acesso
      await this.checkPassword(me.id, b.currentPassword);
      if (await this.db.one('select id from users where lower(email) = $1 and deleted_at is null and id <> $2', [b.email, me.id])) throw new ConflictException('Já existe uma conta com este e-mail.');
    }
    await this.db.many(`update users set name=$2, email=$3, phone=$4, city=$5, country=$6, photo = case when $7 then $8 else photo end where id=$1`,
      [me.id, b.name, b.email, b.phone, b.city, b.country, b.photo !== undefined, b.photo ?? null]);
    return { ok: true };
  }

  @Put('password') @Throttle({ default: { limit: config.devTools ? 600 : 5, ttl: 60_000 } })
  async password(@User() me: Me, @Body(new Zod(passwordBody)) b: z.infer<typeof passwordBody>, @Res({ passthrough: true }) res: Response) {
    await this.checkPassword(me.id, b.current);
    const u = await this.db.one<{ id: string; tokenVersion: number }>('update users set password_hash = $2, token_version = token_version + 1 where id = $1 returning id, token_version', [me.id, await hashPassword(b.next)]);
    await this.db.many('delete from trusted_devices where user_id = $1', [me.id]);
    startSession(res, u!); // as outras sessões caem
    return { ok: true };
  }

  @Put('consent')
  async consent(@User() me: Me, @Body(new Zod(consentBody)) b: z.infer<typeof consentBody>) {
    await this.db.many(`insert into consents (user_id, type, accepted) values ($1, 'analytics', $2)`, [me.id, b.analytics]);
    return { ok: true };
  }

  @Put('shortcuts')
  async shortcuts(@User() me: Me, @Body(new Zod(shortcutsBody)) b: z.infer<typeof shortcutsBody>) {
    await this.db.many('update users set shortcuts = $2 where id = $1', [me.id, [...new Set(b.shortcuts)]]);
    return { ok: true };
  }

  /** CU-47: apaga cadastro, inscrições e conversas. Lances e pedidos ficam, sem identificação. */
  @Delete() @Throttle({ default: { limit: config.devTools ? 600 : 5, ttl: 60_000 } })
  async remove(@User() me: Me, @Body(new Zod(confirmBody)) b: z.infer<typeof confirmBody>, @Res({ passthrough: true }) res: Response) {
    await this.checkPassword(me.id, b.password);
    await this.db.tx(async (q) => {
      const mine = 'attendee_id in (select id from attendees where user_id = $1)';
      await q.many(`delete from chats where type = 'direct' and id in (select chat_id from chat_members where ${mine})`, [me.id]);
      await q.many(`delete from messages where author_id in (select id from attendees where user_id = $1)`, [me.id]);
      for (const t of ['chat_members', 'registrations', 'notifications', 'vouchers', 'parking_spots', 'memberships', 'network_companies', 'facial_opt_ins', 'support_tickets'])
        await q.many(`delete from ${t} where ${mine}`, [me.id]);
      for (const t of ['mfa_factors', 'backup_codes', 'trusted_devices', 'challenges', 'consents']) await q.many(`delete from ${t} where user_id = $1`, [me.id]);
      await q.many(`update attendees set lodge='', obedience='', cim='', office='', roles='{attendee}' where user_id = $1`, [me.id]);
      await q.many(`update users set name='Conta excluída', email = 'excluida-' || id || '@invalid', password_hash='', phone='', city='', photo=null,
        mfa_enabled=false, mfa_method=null, deleted_at=now(), token_version = token_version + 1 where id = $1`, [me.id]);
    });
    for (const n of ['cf_session', 'cf_device', 'cf_stepup']) res.clearCookie(n, { path: '/api' });
    return { ok: true };
  }
}
