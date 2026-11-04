import { and, eq, isNull } from 'drizzle-orm';
import type { DbOrTx } from '../db/db';
import { refreshTokens } from '../db/schema';
import { env } from '../env';
import { newId } from '../kernel/ids';
import { randomToken, sha256 } from './crypto';
import type { TokenService } from './token.service';

export type Amr = 'pwd' | 'google' | 'apple' | 'passkey';
export type SessionUser = { id: string; role: 'user' | 'admin'; termsAcceptedAt: Date | null };
export type SessionTokens = { access: string; refresh: string; familyId: string };

/** Cria uma família de refresh nova (= sid do JWT) e o access token. */
export async function createSession(
  db: DbOrTx,
  tokens: TokenService,
  user: SessionUser,
  amr: Amr,
  userAgent: string | undefined,
  now: Date,
  familyId: string = newId(),
): Promise<SessionTokens> {
  const refresh = randomToken();
  await db.insert(refreshTokens).values({
    id: newId(),
    userId: user.id,
    familyId,
    tokenHash: sha256(refresh),
    amr,
    userAgent: userAgent?.slice(0, 200) ?? null,
    expiresAt: new Date(now.getTime() + env().REFRESH_TTL_D * 86400_000),
  });
  const access = await tokens.signAccess({ userId: user.id, sid: familyId, role: user.role, amr: [amr], consented: user.termsAcceptedAt !== null });
  return { access, refresh, familyId };
}

export async function revokeFamily(db: DbOrTx, familyId: string, reason: 'logout' | 'reuse', now: Date): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: now, revokedReason: reason })
    .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
}

export async function revokeAllSessions(db: DbOrTx, userId: string, reason: 'logout' | 'reset' | 'block' | 'delete', now: Date): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: now, revokedReason: reason })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}
