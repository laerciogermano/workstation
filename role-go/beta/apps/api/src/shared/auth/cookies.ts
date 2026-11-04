import type { CookieOptions, Response } from 'express';
import { env } from '../env';

export const AT_COOKIE = 'rg_at';
export const RT_COOKIE = 'rg_rt';
export const RT_PATH = '/api/v1/auth/refresh';

const secure = () => env().NODE_ENV === 'production';

export function setAuthCookies(res: Response, access: string, refresh: string): void {
  const base: CookieOptions = { httpOnly: true, secure: secure() };
  res.cookie(AT_COOKIE, access, { ...base, sameSite: 'lax', path: '/api', maxAge: env().ACCESS_TTL_S * 1000 });
  res.cookie(RT_COOKIE, refresh, { ...base, sameSite: 'strict', path: RT_PATH, maxAge: env().REFRESH_TTL_D * 86400_000 });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(AT_COOKIE, { path: '/api' });
  res.clearCookie(RT_COOKIE, { path: RT_PATH });
}
