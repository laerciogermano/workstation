import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { AccessClaims } from '@rolego/contracts';
import { desc, isNull } from 'drizzle-orm';
import {
  errors as joseErrors,
  exportJWK,
  generateKeyPair,
  importJWK,
  type JWK,
  jwtVerify,
  type KeyLike,
  SignJWT,
  decodeProtectedHeader,
} from 'jose';
import { DB, type Db } from '../db/db';
import { jwtKeys } from '../db/schema';
import { env } from '../env';
import { AppError } from '../errors/app-error';
import { Clock } from '../kernel/clock';
import { newId } from '../kernel/ids';
import { open, seal } from './crypto';

type Amr = 'pwd' | 'google' | 'apple' | 'passkey';
type KeyEntry = { kid: string; publicKey: KeyLike | Uint8Array; publicJwk: JWK; retiredAt: Date | null };
const KEY_ROTATION_DAYS = 90;

/** Único lugar que assina/verifica JWT (docs/08 §5). Algoritmo fixo EdDSA. */
@Injectable()
export class TokenService implements OnModuleInit {
  private active: { kid: string; privateKey: KeyLike | Uint8Array } | null = null;
  private readonly keys = new Map<string, KeyEntry>();

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadKeys();
  }

  async loadKeys(): Promise<void> {
    const rowsAll = await this.db.select().from(jwtKeys).orderBy(desc(jwtKeys.createdAt));
    const now = this.clock.now();
    const current = rowsAll.find((k) => !k.retiredAt);
    const tooOld = current && now.getTime() - current.createdAt.getTime() > KEY_ROTATION_DAYS * 86400_000;
    if (!current || tooOld) {
      const { publicKey, privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
      const kid = newId();
      const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: 'EdDSA', use: 'sig' };
      const privateJwk = await exportJWK(privateKey);
      if (current) await this.db.update(jwtKeys).set({ retiredAt: now }).where(isNull(jwtKeys.retiredAt));
      await this.db.insert(jwtKeys).values({ kid, publicJwk, privateJwkEncrypted: seal(JSON.stringify(privateJwk), env().JWT_KEK) });
      return this.loadKeys();
    }
    this.keys.clear();
    const maxAgeMs = (env().ACCESS_TTL_S + 60) * 1000;
    for (const k of rowsAll) {
      // chaves aposentadas continuam publicadas até o último token expirar
      if (k.retiredAt && now.getTime() - k.retiredAt.getTime() > maxAgeMs) continue;
      this.keys.set(k.kid, {
        kid: k.kid,
        publicJwk: k.publicJwk,
        publicKey: await importJWK(k.publicJwk, 'EdDSA'),
        retiredAt: k.retiredAt,
      });
    }
    const priv = JSON.parse(open(current.privateJwkEncrypted, env().JWT_KEK)) as JWK;
    this.active = { kid: current.kid, privateKey: await importJWK(priv, 'EdDSA') };
  }

  jwks(): { keys: JWK[] } {
    return { keys: [...this.keys.values()].map((k) => k.publicJwk) };
  }

  async signAccess(p: { userId: string; sid: string; role: 'user' | 'admin'; amr: Amr[]; consented: boolean }): Promise<string> {
    if (!this.active) throw new Error('JWT key not loaded');
    const nowS = Math.floor(this.clock.now().getTime() / 1000);
    return new SignJWT({ sid: p.sid, role: p.role, amr: p.amr, cns: p.consented })
      .setProtectedHeader({ alg: 'EdDSA', kid: this.active.kid, typ: 'JWT' })
      .setSubject(p.userId)
      .setIssuer(env().JWT_ISSUER)
      .setAudience(env().JWT_AUDIENCE)
      .setIssuedAt(nowS)
      .setExpirationTime(nowS + env().ACCESS_TTL_S)
      .sign(this.active.privateKey);
  }

  /** Verifica assinatura, alg, kid, iss, aud e exp localmente — sem banco. */
  async verifyAccess(token: string): Promise<AccessClaims & { cns: boolean }> {
    let kid: string | undefined;
    try {
      const h = decodeProtectedHeader(token);
      if (h.alg !== 'EdDSA') throw new AppError('UNAUTHENTICATED');
      kid = h.kid;
    } catch {
      throw new AppError('UNAUTHENTICATED');
    }
    const key = kid ? this.keys.get(kid) : undefined;
    if (!key) throw new AppError('UNAUTHENTICATED');
    try {
      const { payload } = await jwtVerify(token, key.publicKey, {
        algorithms: ['EdDSA'],
        issuer: env().JWT_ISSUER,
        audience: env().JWT_AUDIENCE,
        currentDate: this.clock.now(),
      });
      const claims = AccessClaims.safeParse(payload);
      if (!claims.success) throw new AppError('UNAUTHENTICATED');
      return { ...claims.data, cns: payload['cns'] === true };
    } catch (e) {
      if (e instanceof joseErrors.JWTExpired) throw new AppError('TOKEN_EXPIRED');
      throw new AppError('UNAUTHENTICATED');
    }
  }
}
