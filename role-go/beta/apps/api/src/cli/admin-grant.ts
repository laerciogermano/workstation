import { eq } from 'drizzle-orm';
import { createDb, createPool } from '../shared/db/db';
import { users } from '../shared/db/schema';
import { audit } from '../shared/audit';
import { env } from '../shared/env';

/** RF-ADM-01: papel admin só via CLI (sem cadastro público). Uso: pnpm admin:grant email@x.com */
async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) throw new Error('uso: pnpm admin:grant <email>');
  const pool = createPool(env().DATABASE_URL);
  const db = createDb(pool);
  const [u] = await db.update(users).set({ role: 'admin' }).where(eq(users.email, email.toLowerCase())).returning();
  if (!u) throw new Error('usuário não encontrado');
  await audit(db, { actorId: null, action: 'admin.granted', entity: 'user', entityId: u.id, payload: { via: 'cli' } });
  await pool.end();
  console.log(`${email} agora é admin (entre de novo para o papel valer no token)`);
}
void main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
