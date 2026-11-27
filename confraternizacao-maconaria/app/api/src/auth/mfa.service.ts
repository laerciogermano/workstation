import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { config } from '../config.js';
import { Db } from '../database.js';
import { backupCode, decrypt, digest, otp, same, totpStep } from './crypto.js';

export type Method = 'app' | 'sms' | 'email';
export type Purpose = 'login' | 'setup' | 'stepup';
export interface Challenge { id: string; userId: string; purpose: Purpose; method: Method | 'backup'; codeHash: string | null; secret: string | null; phone: string | null; attempts: number; usedStep?: number }
export const MAX_TRIES = 5;
const TTL_MINUTES = 10;

export const maskPhone = (p: string) => (p.length > 4 ? `••••• ${p.slice(-4)}` : p);
export const maskEmail = (m: string) => m.replace(/^(.{2})[^@]*/, '$1•••');

@Injectable()
export class MfaService {
  constructor(private db: Db) {}

  /** Envio por SMS e e-mail depende de um provedor, ainda não contratado: em desenvolvimento o código vai para o log. */
  private deliver(method: Method, to: string, code: string) {
    if (config.devTools) console.log(`[dev] código por ${method} para ${to}: ${code}`);
    else console.warn(`Sem provedor de ${method} configurado; código não enviado.`);
  }

  async methods(userId: string) {
    const rows = await this.db.many<{ method: Method }>('select method from mfa_factors where user_id = $1 and is_active', [userId]);
    return [...new Set<Method>([...rows.map((r) => r.method), 'email'])];
  }

  /** Cria o desafio e "envia" o código. As tentativas passam de um desafio para o outro. */
  async start(user: { id: string; email: string; phone?: string }, purpose: Purpose, method: Method | 'backup', opts: { attempts?: number; secret?: string; phone?: string } = {}) {
    const recent = await this.db.one<{ n: number; tries: number }>(
      `select count(*) as n, coalesce(sum(attempts), 0)::int as tries from challenges where user_id = $1 and created_at > now() - interval '15 minutes' and consumed_at is null`, [user.id]);
    if (recent!.n >= 20 || recent!.tries >= 30) throw new HttpException('Muitas tentativas. Aguarde alguns minutos.', 429);
    const code = method === 'sms' || method === 'email' ? otp() : null;
    const row = await this.db.one<{ id: string }>(
      `insert into challenges (user_id, purpose, method, code_hash, secret, phone, attempts, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7, now() + make_interval(mins => $8)) returning id`,
      [user.id, purpose, method, code && digest(code), opts.secret ?? null, opts.phone ?? null, opts.attempts ?? 0, TTL_MINUTES]);
    const phone = opts.phone ?? user.phone ?? '';
    if (code) this.deliver(method as Method, method === 'sms' ? phone : user.email, code);
    return {
      id: row!.id, method,
      destination: method === 'sms' ? maskPhone(phone) : method === 'email' ? maskEmail(user.email) : '',
      ...(config.devTools && code ? { devCode: code } : {}),
    };
  }

  get(id: string, userId: string, purpose: Purpose) {
    return this.db.one<Challenge>('select * from challenges where id = $1 and user_id = $2 and purpose = $3 and consumed_at is null and expires_at > now()', [id, userId, purpose]);
  }

  /** Confere o código; conta a tentativa antes de comparar, para não haver corrida. */
  async check(challenge: Challenge, code: string) {
    const bumped = await this.db.one<{ attempts: number }>(
      'update challenges set attempts = attempts + 1 where id = $1 and attempts < $2 and consumed_at is null returning attempts', [challenge.id, MAX_TRIES]);
    if (!bumped) throw new HttpException('Muitas tentativas. Comece de novo.', 429);
    const ok = await this.matches(challenge, code.replace(/\s/g, ''));
    if (ok && (await this.db.one('update challenges set consumed_at = now() where id = $1 and consumed_at is null returning id', [challenge.id]))) return;
    const left = MAX_TRIES - bumped.attempts;
    if (left <= 0) throw new HttpException('Muitas tentativas. Comece de novo.', 429);
    throw new BadRequestException(`Código incorreto. ${left === 1 ? 'Resta 1 tentativa' : `Restam ${left} tentativas`}.`);
  }

  private async matches(c: Challenge, code: string) {
    if (c.method === 'backup') {
      const digits = code.replace(/\D/g, '');
      if (digits.length !== 8) return false;
      return !!(await this.db.one('update backup_codes set used_at = now() where user_id = $1 and code_hash = $2 and used_at is null returning id',
        [c.userId, digest(`${digits.slice(0, 4)}-${digits.slice(4)}`)]));
    }
    if (c.method === 'app') {
      const factor = await this.db.one<{ secret: string; lastStep: string }>('select secret, last_step from mfa_factors where user_id = $1 and method = $2', [c.userId, 'app']);
      const sealed = c.purpose === 'setup' ? c.secret : factor?.secret;
      if (!sealed) return false;
      const step = totpStep(decrypt(sealed), code, c.purpose === 'setup' ? 0 : Number(factor?.lastStep ?? 0));
      if (step === null) return false;
      c.usedStep = step;
      if (c.purpose !== 'setup') return !!(await this.db.one('update mfa_factors set last_step = $3 where user_id = $1 and method = $2 and last_step < $3 returning id', [c.userId, 'app', step]));
      return true;
    }
    return !!c.codeHash && same(c.codeHash, digest(code));
  }

  async newBackupCodes(userId: string) {
    const codes = Array.from({ length: 8 }, backupCode);
    await this.db.tx(async (q) => {
      await q.many('delete from backup_codes where user_id = $1', [userId]);
      await q.many('insert into backup_codes (user_id, code_hash) select $1, unnest($2::text[])', [userId, codes.map(digest)]);
    });
    return codes;
  }
}
