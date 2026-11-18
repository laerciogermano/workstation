import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import type { UserDto } from "@flow/shared";
import { pool, withTx } from "../../db/pool";
import { config } from "../../config";
import { AppError, conflict } from "../../shared/errors";
import { seedDemoProject } from "../projects/demo-seed";

export interface AuthUser extends UserDto { _id: number }
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
// Argon2id (defaults do pacote de segurança)
const ARGON = { algorithm: 2 as const, memoryCost: 19_456, timeCost: 2, parallelism: 1 };
const DUMMY = await hash("flow-dummy-password", ARGON);

export async function register(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
  const passwordHash = await hash(password, ARGON);
  const user = await withTx(async db => {
    const dup = await db.query("select 1 from flow.users where lower(email) = lower($1)", [email]);
    if (dup.rowCount) throw conflict("Já existe uma conta com esse e-mail");
    const { rows } = await db.query("insert into flow.users (email, password_hash, name) values ($1,$2,$3) returning id, public_id", [email, passwordHash, name]);
    await seedDemoProject(db, rows[0].id, "Exemplo · Flow IDE");
    return { _id: rows[0].id as number, id: rows[0].public_id as string, email, name };
  });
  return { user, token: await newSession(user._id) };
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const { rows } = await pool.query("select id, public_id, email, name, password_hash from flow.users where lower(email) = lower($1)", [email]);
  const r = rows[0];
  // verifica sempre (hash dummy) para não vazar por tempo se o e-mail existe
  const ok = await verify(r?.password_hash ?? DUMMY, password).catch(() => false);
  if (!r || !ok) throw new AppError(401, "invalid_credentials", "E-mail ou senha inválidos");
  return { user: { _id: r.id, id: r.public_id, email: r.email, name: r.name }, token: await newSession(r.id) };
}

async function newSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await pool.query("insert into flow.sessions (user_id, token_hash, expires_at) values ($1,$2, now() + make_interval(hours => $3))", [userId, sha(token), config.SESSION_TTL_HOURS]);
  return token;
}
export async function userFromToken(token: string): Promise<AuthUser | null> {
  const { rows } = await pool.query(
    "select u.id, u.public_id, u.email, u.name from flow.sessions s join flow.users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()", [sha(token)]);
  const r = rows[0];
  return r ? { _id: r.id, id: r.public_id, email: r.email, name: r.name } : null;
}
export async function destroySession(token: string): Promise<void> { await pool.query("delete from flow.sessions where token_hash = $1", [sha(token)]); }
export async function purgeExpiredSessions(): Promise<void> { await pool.query("delete from flow.sessions where expires_at < now()"); }
