import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import type { Db } from './db';

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../../drizzle') });
}
