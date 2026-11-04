import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, types } from 'pg';
import * as schema from './schema';

// int8 (count/bigint) como number: os contadores do beta cabem em 2^53.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1700, (v) => Number(v));

export type Db = NodePgDatabase<typeof schema>;
/** Transação ou conexão: os serviços aceitam os dois. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

export function createPool(url: string): Pool {
  return new Pool({ connectionString: url, max: 10 });
}
export function createDb(pool: Pool): Db {
  return drizzle(pool, { schema });
}

const PG_TIMESTAMPTZ = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)$/;

/**
 * Linhas de db.execute(sql`...`) com tipagem explícita.
 * why: o Drizzle desliga o parser de timestamptz do pg no execute(); convertemos de volta para Date aqui.
 */
export async function rows<T>(db: DbOrTx, query: Parameters<Db['execute']>[0]): Promise<T[]> {
  const res = await db.execute(query);
  for (const row of res.rows as Record<string, unknown>[]) {
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (typeof v === 'string' && v.length >= 19 && v.length <= 35 && PG_TIMESTAMPTZ.test(v)) row[k] = new Date(v.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
    }
  }
  return res.rows as T[];
}

/** why: arrays dentro de sql`` viram tupla ($1,$2); aqui vão como um único parâmetro text[]. */
export const textArray = (values: readonly string[]) => sql`${sql.param(values)}::text[]`;
