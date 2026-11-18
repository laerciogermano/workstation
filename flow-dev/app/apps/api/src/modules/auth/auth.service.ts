import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import type { UserDto } from "@flow/shared";
import { pool, withTx } from "../../db/pool";
import { config } from "../../config";
import { AppError, conflict } from "../../shared/errors";
import { seedDemoProject } from "../projects/demo-seed";

export interface AuthUser extends UserDto { _id: number; personKey: string }
type Row = { id: number; public_id: string; email: string | null; name: string; person_key: string };
const toUser = (r: Row): AuthUser => ({ _id: r.id, id: r.public_id, email: r.email, name: r.name, guest: r.email == null, personKey: r.person_key });
const COLS = "id, public_id, email, name, person_key";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
// Argon2id (defaults do pacote de segurança)
const ARGON = { algorithm: 2 as const, memoryCost: 19_456, timeCost: 2, parallelism: 1 };
const DUMMY = await hash("flow-dummy-password", ARGON);

/** Visitante: nasce com um person_key próprio e já recebe o projeto de exemplo. */
export async function createGuest(): Promise<{ user: AuthUser; token: string }> {
  const user = await withTx(async db => {
    const r = (await db.query(`insert into flow.users default values returning ${COLS}`)).rows[0] as Row;
    await seedDemoProject(db, r.id, "Exemplo · Flow IDE");
    return toUser(r);
  });
  return { user, token: await newSession(user._id) };
}
/** Retoma um visitante pelo person_key. Contas com senha NÃO retomam por código. */
export async function guestByKey(key: string): Promise<{ user: AuthUser; token: string } | null> {
  const { rows } = await pool.query(`select ${COLS} from flow.users where person_key = $1 and email is null`, [key]);
  return rows[0] ? { user: toUser(rows[0]), token: await newSession(rows[0].id) } : null;
}

/** Vincular: o visitante vira conta (mesmo UUID, mesmos projetos). */
export async function upgrade(guest: AuthUser, email: string, password: string, name: string): Promise<AuthUser> {
  if (!guest.guest) throw conflict("Você já tem conta");
  const passwordHash = await hash(password, ARGON);
  return withTx(async db => {
    if ((await db.query("select 1 from flow.users where lower(email) = lower($1)", [email])).rowCount) throw conflict("Já existe uma conta com esse e-mail");
    const r = (await db.query(`update flow.users set email = $2, password_hash = $3, name = $4 where id = $1 and email is null returning ${COLS}`, [guest._id, email, passwordHash, name])).rows[0] as Row | undefined;
    if (!r) throw conflict("Você já tem conta");
    return toUser(r);
  });
}

/** Entrar numa conta existente; os projetos do visitante atual vão junto (e o visitante some). */
export async function login(email: string, password: string, current?: AuthUser): Promise<{ user: AuthUser; token: string }> {
  const { rows } = await pool.query(`select ${COLS}, password_hash from flow.users where lower(email) = lower($1)`, [email]);
  const r = rows[0];
  // verifica sempre (hash dummy) para não vazar por tempo se o e-mail existe
  const ok = await verify(r?.password_hash ?? DUMMY, password).catch(() => false);
  if (!r || !ok) throw new AppError(401, "invalid_credentials", "E-mail ou senha inválidos");
  if (current?.guest && current._id !== r.id) {
    await withTx(async db => {
      await db.query("update flow.projects set owner_id = $1 where owner_id = $2", [r.id, current._id]);
      await db.query("delete from flow.users where id = $1 and email is null", [current._id]);
    });
  }
  return { user: toUser(r), token: await newSession(r.id) };
}

async function newSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await pool.query("insert into flow.sessions (user_id, token_hash, expires_at) values ($1,$2, now() + make_interval(hours => $3))", [userId, sha(token), config.SESSION_TTL_HOURS]);
  return token;
}
export async function userFromToken(token: string): Promise<AuthUser | null> {
  const { rows } = await pool.query(
    `select u.id, u.public_id, u.email, u.name, u.person_key from flow.sessions s join flow.users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()`, [sha(token)]);
  return rows[0] ? toUser(rows[0]) : null;
}
export async function destroySession(token: string): Promise<void> { await pool.query("delete from flow.sessions where token_hash = $1", [sha(token)]); }
export async function purgeExpiredSessions(): Promise<void> { await pool.query("delete from flow.sessions where expires_at < now()"); }
