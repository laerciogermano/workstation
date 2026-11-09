import { SignJWT, jwtVerify, errors } from 'jose';
import { AppError } from '../../shared/http/problem.js';

export const ACCESS_TTL_S = 15 * 60;
export const REFRESH_TTL_DAYS = 30;
export const REFRESH_COOKIE = 'nt_rt';

export interface AccessClaims {
  sub: string; // users.public_id
  uid: number;
  role: 'user' | 'admin';
}

export function createTokenService(secret: string) {
  const key = new TextEncoder().encode(secret);
  return {
    async sign(c: AccessClaims): Promise<string> {
      return new SignJWT({ uid: c.uid, role: c.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(c.sub)
        .setIssuedAt()
        .setIssuer('notinhas.shop')
        .setExpirationTime(`${ACCESS_TTL_S}s`)
        .sign(key);
    },
    async verify(token: string): Promise<AccessClaims> {
      try {
        const { payload } = await jwtVerify(token, key, { issuer: 'notinhas.shop', algorithms: ['HS256'] });
        const role = payload['role'] === 'admin' ? 'admin' : 'user';
        return { sub: String(payload.sub), uid: Number(payload['uid']), role };
      } catch (e) {
        throw new AppError(e instanceof errors.JWTExpired ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED');
      }
    },
  };
}
export type TokenService = ReturnType<typeof createTokenService>;
