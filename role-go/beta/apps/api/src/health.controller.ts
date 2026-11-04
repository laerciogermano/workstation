import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from './shared/auth/viewer';
import { DB, type Db } from './shared/db/db';

@Controller('health')
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}
  @Public()
  @Get()
  async health(): Promise<{ status: 'ok'; db: 'ok' | 'down' }> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', db: 'ok' };
    } catch {
      return { status: 'ok', db: 'down' };
    }
  }
}
