import { Router, type Request, type RequestHandler, type Response } from "express";
import rateLimit from "express-rate-limit";
import { guestBody, loginBody, registerBody } from "@flow/shared";
import { config } from "../../config";
import { ah, parse } from "../../shared/http";
import { unauthorized } from "../../shared/errors";
import { createGuest, destroySession, guestByKey, login, upgrade, userFromToken, type AuthUser } from "./auth.service";

export const COOKIE = "flow_sid";
declare module "express-serve-static-core" { interface Request { user?: AuthUser } }

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: config.isProd, path: "/", maxAge: config.SESSION_TTL_HOURS * 3_600_000 };
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: config.isTest ? 1000 : 30, standardHeaders: "draft-7", legacyHeaders: false, message: { error: { code: "rate_limited", message: "Muitas tentativas. Aguarde alguns minutos." } } });

/** Carrega a sessão (cookie httpOnly) em req.user quando existir. */
export const loadUser: RequestHandler = ah(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE] as string | undefined;
  if (token) req.user = (await userFromToken(token)) ?? undefined;
  next();
});
/** deny-by-default: toda rota fora de /auth exige usuário. */
export const requireUser: RequestHandler = (req, _res, next) => (req.user ? next() : next(unauthorized()));
export const me = (req: Request): AuthUser => { if (!req.user) throw unauthorized(); return req.user; };
const pub = (u: AuthUser) => ({ id: u.id, email: u.email, name: u.name, guest: u.guest, ...(u.guest ? { personKey: u.personKey } : {}) });
const setCookie = (res: Response, token: string) => res.cookie(COOKIE, token, cookieOpts);

export const authRouter = Router();
/** Entra sem conta: retoma pelo código (person_key) ou cria um visitante novo. */
authRouter.post("/guest", authLimiter, ah(async (req, res) => {
  const b = parse(guestBody, req.body);
  const r = (b.key ? await guestByKey(b.key) : null) ?? await createGuest();
  setCookie(res, r.token); res.status(201).json({ user: pub(r.user) });
}));
/** Vincular conta ao visitante atual (mesmo UUID). */
authRouter.post("/register", authLimiter, ah(async (req, res) => {
  const b = parse(registerBody, req.body);
  const user = await upgrade(me(req), b.email, b.password, b.name);
  res.status(201).json({ user: pub(user) });
}));
authRouter.post("/login", authLimiter, ah(async (req, res) => {
  const b = parse(loginBody, req.body);
  const { user, token } = await login(b.email, b.password, req.user);
  setCookie(res, token); res.json({ user: pub(user) });
}));
authRouter.post("/logout", ah(async (req, res) => {
  const token = req.cookies?.[COOKIE] as string | undefined;
  if (token) await destroySession(token);
  res.clearCookie(COOKIE, { path: "/" }); res.status(204).end();
}));
authRouter.get("/me", (req, res) => (req.user ? res.json({ user: pub(req.user) }) : res.status(401).json({ error: { code: "unauthorized", message: "Sem sessão" } })));
