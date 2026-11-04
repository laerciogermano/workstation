import { Inject, Injectable, Logger } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { RegisterBody, ResetBody } from '@rolego/contracts';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomToken, sha256 } from '../../../shared/auth/crypto';
import { DenylistService } from '../../../shared/auth/denylist.service';
import { createSession, revokeAllSessions, revokeFamily, type SessionTokens } from '../../../shared/auth/sessions';
import { TokenService } from '../../../shared/auth/token.service';
import { DB, type Db } from '../../../shared/db/db';
import { authTokens, discoveryPreferences, refreshTokens, users } from '../../../shared/db/schema';
import { env } from '../../../shared/env';
import { JobQueue } from '../../../shared/jobs/job-queue';
import { Clock } from '../../../shared/kernel/clock';
import { newId } from '../../../shared/kernel/ids';
import { err, ok, type Result } from '../../../shared/kernel/result';
import { isWeakPassword } from '../domain/password';

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const TERMS_VERSION = '2026-11-beta';
const RESET_TTL_MS = 3600_000;
const VERIFY_TTL_MS = 24 * 3600_000;
type UserRow = typeof users.$inferSelect;

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');
  private dummyHash: Promise<string> | null = null;
  private googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly tokens: TokenService,
    private readonly denylist: DenylistService,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  providers() {
    return { google: !!env().GOOGLE_CLIENT_ID && !!env().GOOGLE_CLIENT_SECRET, apple: false, passkey: false };
  }

  private session(u: UserRow, amr: 'pwd' | 'google', ua?: string): Promise<SessionTokens> {
    return createSession(this.db, this.tokens, u, amr, ua, this.clock.now());
  }

  async register(body: RegisterBody, ua?: string): Promise<Result<{ user: UserRow; tokens: SessionTokens }>> {
    if (isWeakPassword(body.password)) return err('VALIDATION_FAILED', 'Essa senha é muito comum. Escolha outra.');
    const [exists] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
    if (exists) return err('EMAIL_TAKEN');
    const now = this.clock.now();
    const passwordHash = await hash(body.password, ARGON);
    const user = await this.db.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({
          id: newId(),
          email: body.email,
          passwordHash,
          name: body.email.split('@')[0] ?? '',
          adultDeclaredAt: now,
          termsAcceptedAt: now,
          termsVersion: TERMS_VERSION,
          role: 'user',
          status: 'active',
          showPresence: true,
        })
        .returning();
      if (!u) throw new Error('insert failed');
      await tx.insert(discoveryPreferences).values({ userId: u.id, eventTypeSlugs: [], originMode: 'city', radiusKm: 20, filters: {} });
      return u;
    });
    await this.sendVerification(user);
    return ok({ user, tokens: await this.session(user, 'pwd', ua) });
  }

  async login(email: string, password: string, ua?: string): Promise<Result<{ user: UserRow; tokens: SessionTokens }>> {
    const [u] = await this.db.select().from(users).where(eq(users.email, email));
    if (!u?.passwordHash || u.status === 'deleted') {
      // custo constante: evita enumeração por tempo de resposta
      this.dummyHash ??= hash('rolego-dummy-password', ARGON);
      await verify(await this.dummyHash, password).catch(() => false);
      return err('INVALID_CREDENTIALS');
    }
    const valid = await verify(u.passwordHash, password).catch(() => false);
    if (!valid) return err('INVALID_CREDENTIALS');
    if (u.status === 'blocked') return err('ACCOUNT_BLOCKED');
    return ok({ user: u, tokens: await this.session(u, 'pwd', ua) });
  }

  /** Rotação com detecção de reuso: token já usado → revoga a família inteira. */
  async refresh(raw: string | undefined, ua?: string): Promise<Result<SessionTokens>> {
    if (!raw) return err('UNAUTHENTICATED');
    const now = this.clock.now();
    const outcome = await this.db.transaction(async (tx) => {
      const [t] = await tx.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, sha256(raw))).for('update');
      if (!t) return { kind: 'invalid' as const };
      if (t.usedAt || t.revokedAt) {
        await revokeFamily(tx, t.familyId, 'reuse', now);
        return { kind: 'reuse' as const, userId: t.userId };
      }
      if (t.expiresAt.getTime() <= now.getTime()) return { kind: 'invalid' as const };
      const [u] = await tx.select().from(users).where(eq(users.id, t.userId));
      if (!u || u.status !== 'active') return { kind: 'invalid' as const };
      const next = await createSession(tx, this.tokens, u, t.amr, ua, now, t.familyId);
      const [nextRow] = await tx.select({ id: refreshTokens.id }).from(refreshTokens).where(eq(refreshTokens.tokenHash, sha256(next.refresh)));
      await tx.update(refreshTokens).set({ usedAt: now, replacedBy: nextRow?.id ?? null }).where(eq(refreshTokens.id, t.id));
      return { kind: 'ok' as const, tokens: next };
    });
    if (outcome.kind === 'reuse') {
      this.logger.warn('auth.refresh.reuse');
      return err('REFRESH_REUSED');
    }
    if (outcome.kind === 'invalid') return err('UNAUTHENTICATED');
    return ok(outcome.tokens);
  }

  async logout(userId: string, familyId: string, everywhere: boolean): Promise<void> {
    const now = this.clock.now();
    if (everywhere) {
      await revokeAllSessions(this.db, userId, 'logout', now);
      await this.denylist.deny(userId);
    } else {
      await revokeFamily(this.db, familyId, 'logout', now);
    }
  }

  /** Sempre 202 (não revela se o e-mail existe). */
  async forgot(email: string): Promise<void> {
    const [u] = await this.db.select().from(users).where(eq(users.email, email));
    if (!u || u.status !== 'active') return;
    const token = await this.newAuthToken(u.id, 'reset_password', RESET_TTL_MS);
    await this.jobs.send('email.send', { template: 'reset_password', to: u.email, vars: { name: u.name, url: `${env().APP_URL}/redefinir-senha?token=${token}` } });
  }

  async reset(body: ResetBody, ua?: string): Promise<Result<{ user: UserRow; tokens: SessionTokens }>> {
    if (isWeakPassword(body.password)) return err('VALIDATION_FAILED', 'Essa senha é muito comum. Escolha outra.');
    const now = this.clock.now();
    const t = await this.consumeAuthToken(body.token, 'reset_password');
    if (!t) return err('TOKEN_INVALID');
    const passwordHash = await hash(body.password, ARGON);
    const [u] = await this.db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, t.userId)).returning();
    if (!u) return err('TOKEN_INVALID');
    await revokeAllSessions(this.db, u.id, 'reset', now);
    await this.denylist.deny(u.id);
    if (u.status === 'blocked') return err('ACCOUNT_BLOCKED');
    return ok({ user: u, tokens: await this.session(u, 'pwd', ua) });
  }

  async sendVerification(u: { id: string; email: string; name: string; emailVerifiedAt: Date | null }): Promise<void> {
    if (u.emailVerifiedAt) return;
    const token = await this.newAuthToken(u.id, 'verify_email', VERIFY_TTL_MS);
    await this.jobs.send('email.send', { template: 'verify_email', to: u.email, vars: { name: u.name, url: `${env().APP_URL}/verificar-email?token=${token}` } });
  }

  async resendVerification(userId: string): Promise<void> {
    const [u] = await this.db.select().from(users).where(eq(users.id, userId));
    if (u) await this.sendVerification(u);
  }

  async verifyEmail(token: string): Promise<Result<void>> {
    const t = await this.consumeAuthToken(token, 'verify_email');
    if (!t) return err('TOKEN_INVALID');
    await this.db.update(users).set({ emailVerifiedAt: this.clock.now() }).where(eq(users.id, t.userId));
    return ok(undefined);
  }

  async consent(userId: string, ua?: string): Promise<Result<{ user: UserRow; tokens: SessionTokens }>> {
    const now = this.clock.now();
    const [u] = await this.db
      .update(users)
      .set({ termsAcceptedAt: now, termsVersion: TERMS_VERSION, adultDeclaredAt: now, updatedAt: now })
      .where(eq(users.id, userId))
      .returning();
    if (!u) return err('NOT_FOUND');
    return ok({ user: u, tokens: await this.session(u, 'google', ua) });
  }

  /** Google OAuth (authorization code). O e-mail já verificado pelo Google vincula a conta existente. */
  async google(code: string, redirectUri: string | undefined, ua?: string): Promise<Result<{ user: UserRow; tokens: SessionTokens }>> {
    if (!this.providers().google) return err('FORBIDDEN', 'Google não configurado');
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env().GOOGLE_CLIENT_ID,
        client_secret: env().GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri ?? `${env().APP_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) return err('INVALID_CREDENTIALS');
    const { id_token } = (await res.json()) as { id_token?: string };
    if (!id_token) return err('INVALID_CREDENTIALS');
    const { payload } = await jwtVerify(id_token, this.googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env().GOOGLE_CLIENT_ID,
    });
    const sub = String(payload.sub);
    const email = String(payload['email'] ?? '').toLowerCase();
    const verified = payload['email_verified'] === true;
    const now = this.clock.now();
    let [u] = await this.db.select().from(users).where(eq(users.googleSub, sub));
    if (!u && email && verified) {
      [u] = await this.db.update(users).set({ googleSub: sub, emailVerifiedAt: now }).where(and(eq(users.email, email), eq(users.status, 'active'))).returning();
    }
    if (!u) {
      if (!email) return err('INVALID_CREDENTIALS');
      u = await this.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            id: newId(),
            email,
            googleSub: sub,
            emailVerifiedAt: verified ? now : null,
            name: String(payload['name'] ?? email.split('@')[0]),
            role: 'user',
            status: 'active',
            showPresence: true,
          })
          .returning();
        if (!created) throw new Error('insert failed');
        await tx.insert(discoveryPreferences).values({ userId: created.id, eventTypeSlugs: [], originMode: 'city', radiusKm: 20, filters: {} });
        return created;
      });
    }
    if (u.status === 'blocked') return err('ACCOUNT_BLOCKED');
    if (u.status === 'deleted') return err('INVALID_CREDENTIALS');
    return ok({ user: u, tokens: await this.session(u, 'google', ua) });
  }

  private async newAuthToken(userId: string, kind: 'reset_password' | 'verify_email', ttlMs: number): Promise<string> {
    const token = randomToken();
    await this.db.insert(authTokens).values({ id: newId(), userId, kind, tokenHash: sha256(token), expiresAt: new Date(this.clock.now().getTime() + ttlMs) });
    return token;
  }

  /** Uso único: o UPDATE condicional garante que dois cliques não consomem o mesmo token. */
  private async consumeAuthToken(token: string, kind: 'reset_password' | 'verify_email') {
    const now = this.clock.now();
    const [t] = await this.db
      .update(authTokens)
      .set({ usedAt: now })
      .where(and(eq(authTokens.tokenHash, sha256(token)), eq(authTokens.kind, kind), isNull(authTokens.usedAt), gt(authTokens.expiresAt, now)))
      .returning();
    return t ?? null;
  }
}
