import type { Response } from 'express'

export const SESSION_COOKIE = 'rolego_session'
export const SESSION_TTL_S = 60 * 60 * 24 * 30 // 30 dias

export type SessionPayload = { sub: string; v: number }

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_S * 1000,
    path: '/',
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}
