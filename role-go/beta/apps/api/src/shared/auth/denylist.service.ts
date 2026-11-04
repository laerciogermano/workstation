import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../db/db';
import { env } from '../env';
import { Clock } from '../kernel/clock';

const CHANNEL = 'rolego_denylist';

/**
 * Revogação imediata (docs/03 §5.3): o `sub` entra numa denylist em memória com TTL = vida do access token.
 * Tokens emitidos ANTES da revogação são recusados; o usuário pode entrar de novo depois (ex.: reset).
 * Sincronizada entre instâncias via LISTEN/NOTIFY.
 */
@Injectable()
export class DenylistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Denylist');
  private readonly denied = new Map<string, number>();
  private listener: PoolClient | null = null;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly clock: Clock,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.listener = await this.pool.connect();
      await this.listener.query(`LISTEN ${CHANNEL}`);
      this.listener.on('notification', (msg) => {
        if (!msg.payload) return;
        const [sub, at] = msg.payload.split('|');
        if (sub && at) this.remember(sub, Number(at));
      });
    } catch (e) {
      this.logger.warn(`LISTEN indisponível: ${String(e)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.listener?.release();
    this.listener = null;
  }

  private remember(sub: string, atMs: number): void {
    this.denied.set(sub, Math.max(atMs, this.denied.get(sub) ?? 0));
  }

  /** Revoga os access tokens vivos do usuário em todas as instâncias. */
  async deny(sub: string): Promise<void> {
    const at = this.clock.now().getTime();
    this.remember(sub, at);
    await this.pool.query('SELECT pg_notify($1, $2)', [CHANNEL, `${sub}|${at}`]);
  }

  isDenied(sub: string, issuedAtS: number): boolean {
    const at = this.denied.get(sub);
    if (at === undefined) return false;
    const ttlMs = (env().ACCESS_TTL_S + 30) * 1000;
    if (this.clock.now().getTime() - at > ttlMs) {
      this.denied.delete(sub);
      return false;
    }
    return issuedAtS * 1000 <= at;
  }
}
