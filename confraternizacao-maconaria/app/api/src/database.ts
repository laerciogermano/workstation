import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';
import { config } from './config.js';

pg.types.setTypeParser(1700, Number); // numeric -> number (valores pequenos, 2 casas)
pg.types.setTypeParser(20, Number);   // bigint de count()
pg.types.setTypeParser(1082, (v) => v); // date como AAAA-MM-DD

/** snake_case das colunas vira camelCase na resposta */
function camel<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_(\w)/g, (_, c: string) => c.toUpperCase()), v])) as T;
}

export interface Queryable {
  many<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T = any>(sql: string, params?: unknown[]): Promise<T | undefined>;
}

function wrap(client: pg.Pool | pg.PoolClient): Queryable {
  const many = async <T>(sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows.map((r) => camel<T>(r));
  return { many, one: async <T>(sql: string, params?: unknown[]) => (await many<T>(sql, params))[0] };
}

@Injectable()
export class Db implements Queryable, OnModuleDestroy {
  readonly pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
  private q = wrap(this.pool);
  many<T = any>(sql: string, params?: unknown[]) { return this.q.many<T>(sql, params); }
  one<T = any>(sql: string, params?: unknown[]) { return this.q.one<T>(sql, params); }
  async tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const out = await fn(wrap(client));
      await client.query('commit');
      return out;
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }
  async onModuleDestroy() { await this.pool.end(); }
}

@Global()
@Module({ providers: [Db], exports: [Db] })
export class DatabaseModule {}
