import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { audit } from '../../shared/audit';
import { DB, rows, textArray, type Db } from '../../shared/db/db';
import { EmailPort } from '../../shared/email/email.port';
import { env } from '../../shared/env';
import { JobQueue } from '../../shared/jobs/job-queue';
import { Clock } from '../../shared/kernel/clock';
import { formatWhen } from '../../shared/kernel/format';
import { MeService } from '../profile';
import { isTemplate, render, type TemplateName } from './templates';

type EvInfo = { id: string; slug: string; title: string; startsAt: Date | null; venueName: string; street: string | null; number: string | null; neighborhood: string; cityName: string; visibility: string; cancelReason: string | null };
const BATCH = 50;

/** Consumidores dos jobs (rodam no worker). Idempotentes. */
@Injectable()
export class NotificationHandlers {
  private readonly logger = new Logger('Jobs');
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly email: EmailPort,
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
    private readonly me: MeService,
  ) {}

  private async eventInfo(id: string): Promise<EvInfo | null> {
    const [e] = await rows<EvInfo>(
      this.db,
      sql`SELECT id, slug, title, starts_at AS "startsAt", venue_name AS "venueName", street, number, neighborhood, city_name AS "cityName", visibility, cancel_reason AS "cancelReason" FROM events WHERE id = ${id}`,
    );
    return e ?? null;
  }

  private async recipient(userId: string): Promise<{ email: string; name: string } | null> {
    const [u] = await rows<{ email: string; name: string }>(this.db, sql`SELECT email, name FROM users WHERE id = ${userId} AND status = 'active' AND email_bounced_at IS NULL`);
    return u ?? null;
  }

  /** email.send: { template, to?, userId?, eventId?, vars? } */
  async emailSend(data: Record<string, unknown>): Promise<void> {
    const template = data['template'];
    if (!isTemplate(template)) return;
    const vars: Record<string, string> = { ...((data['vars'] as Record<string, string> | undefined) ?? {}), exploreUrl: `${env().APP_URL}/explorar` };
    let to = typeof data['to'] === 'string' ? data['to'] : null;
    if (typeof data['userId'] === 'string') {
      const r = await this.recipient(data['userId']);
      if (!r) return;
      to = r.email;
      vars['name'] ??= r.name;
    }
    if (typeof data['eventId'] === 'string') {
      const e = await this.eventInfo(data['eventId']);
      if (!e) return;
      Object.assign(vars, this.eventVars(e, template));
    }
    if (!to) return;
    await this.email.send(render(template, to, vars));
  }

  private eventVars(e: EvInfo, template: TemplateName): Record<string, string> {
    // endereço exato só no e-mail de aprovação (o convidado já pode ver) ou em evento público
    const address = [e.street, e.number].filter(Boolean).join(', ');
    const place = e.visibility === 'private' ? `${e.neighborhood || e.cityName}` : e.venueName;
    return {
      title: e.title,
      when: e.startsAt ? formatWhen(e.startsAt) : '',
      place,
      address: template === 'rsvp_approved' || e.visibility === 'public' ? `${e.venueName}${address ? ` — ${address}` : ''}, ${e.neighborhood}` : '',
      reason: e.cancelReason ?? '',
      url: `${env().APP_URL}/app/e/${e.slug}${template === 'review_invite' ? '/avaliar' : ''}`,
    };
  }

  /** Fan-out em lotes de 50 para os confirmados (RN-08 / RN-09). */
  private async fanOut(eventId: string, statuses: string[], template: TemplateName, key: string): Promise<void> {
    let offset = 0;
    for (;;) {
      const batch = await rows<{ userId: string }>(
        this.db,
        sql`SELECT user_id AS "userId" FROM rsvps WHERE event_id = ${eventId} AND status = ANY(${textArray(statuses)}) ORDER BY id LIMIT ${BATCH} OFFSET ${offset}`,
      );
      for (const b of batch) await this.jobs.send('email.send', { template, userId: b.userId, eventId }, { singletonKey: `${key}:${b.userId}` });
      if (batch.length < BATCH) break;
      offset += BATCH;
    }
  }

  async eventChanged(data: Record<string, unknown>): Promise<void> {
    const id = String(data['eventId']);
    await this.fanOut(id, ['confirmed', 'approved'], 'event_changed', `changed:${id}:${String(data['at'] ?? '')}`);
  }

  async eventCancelled(data: Record<string, unknown>): Promise<void> {
    const id = String(data['eventId']);
    await this.fanOut(id, ['cancelled_by_event'], 'event_cancelled', `cancelled:${id}`);
  }

  /** Cron 30 min: eventos encerrados nas últimas 2 h → "Como foi?". Marca no audit_log para não repetir. */
  async reviewInvite(): Promise<void> {
    const now = this.clock.now();
    const since = new Date(now.getTime() - 2 * 3600_000);
    const evs = await rows<{ id: string }>(
      this.db,
      sql`SELECT e.id FROM events e WHERE e.status = 'published' AND e.ends_at <= ${now} AND e.ends_at > ${since}
          AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity = 'event' AND a.entity_id = e.id AND a.action = 'review.invite.sent')`,
    );
    for (const e of evs) {
      await this.fanOut(e.id, ['confirmed', 'approved'], 'review_invite', `review:${e.id}`);
      await audit(this.db, { actorId: null, action: 'review.invite.sent', entity: 'event', entityId: e.id });
    }
  }

  async accountPurge(data: Record<string, unknown>): Promise<void> {
    await this.me.purgeMedia(String(data['userId']));
  }

  /** Limpeza diária (docs/05 §6) + reconciliação de contadores. */
  async cleanup(): Promise<void> {
    const now = this.clock.now();
    await this.db.execute(sql`DELETE FROM refresh_tokens WHERE (revoked_at IS NOT NULL OR expires_at < ${now}) AND created_at < ${new Date(now.getTime() - 30 * 86400_000)}`);
    await this.db.execute(sql`DELETE FROM auth_tokens WHERE (used_at IS NOT NULL OR expires_at < ${now}) AND created_at < ${new Date(now.getTime() - 7 * 86400_000)}`);
    await this.db.execute(sql`DELETE FROM geocode_cache WHERE fetched_at < ${new Date(now.getTime() - 30 * 86400_000)}`);
    await this.db.execute(sql`DELETE FROM share_clicks WHERE at < ${new Date(now.getTime() - 180 * 86400_000)}`);
    const drift = await rows<{ id: string }>(
      this.db,
      sql`UPDATE events e SET
            going_count = (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed','approved')),
            pending_count = (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'pending'),
            interests_count = (SELECT count(*) FROM interests i WHERE i.event_id = e.id)
          WHERE e.status = 'published' AND (
            going_count <> (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status IN ('confirmed','approved'))
            OR pending_count <> (SELECT count(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'pending')
            OR interests_count <> (SELECT count(*) FROM interests i WHERE i.event_id = e.id))
          RETURNING e.id`,
    );
    if (drift.length) this.logger.warn(`maintenance.recount corrigiu ${drift.length} eventos`);
  }
}
