import { createDb, createPool } from '../shared/db/db';
import { runMigrations } from '../shared/db/migrate';
import { env } from '../shared/env';

async function main(): Promise<void> {
  const pool = createPool(env().DATABASE_URL);
  await runMigrations(createDb(pool));
  await pool.end();
  console.log('migrations aplicadas');
}
void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
