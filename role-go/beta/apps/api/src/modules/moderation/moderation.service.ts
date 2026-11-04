import { Inject, Injectable } from '@nestjs/common';
import type { AdminReport, AdminStats, OrganizerDto, ReportBody } from '@rolego/contracts';
import { and, eq, sql } from 'drizzle-orm';
import { audit } from '../../shared/audit';
import { DenylistService } from '../../shared/auth/denylist.service';
import { revokeAllSessions } from '../../shared/auth/sessions';
import type { Viewer } from '../../shared/auth/viewer';
import { DB, rows, type Db } from '../../shared/db/db';
import { events, organizers, reports, reviews, users } from '../../shared/db/schema';
import { Clock } from '../../shared/kernel/clock';
import { newId } from '../../shared/kernel/ids';
import { err, ok, type Result } from '../../shared/kernel/result';
import { OrganizerService } from '../organizer';

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
    private readonly denylist: DenylistService,
    private readonly orgs: OrganizerService,
  ) {}

  /** RF-E03-13: um usuário só denuncia o mesmo item uma vez. */
  async report(viewer: Viewer, b: ReportBody): Promise<Result<void>> {
    const exists = await rows<{ ok: number }>(
      this.db,
      b.targetType === 'event'
        ? sql`SELECT 1 AS ok FROM events WHERE id = ${b.targetId}`
        : b.targetType === 'review'
          ? sql`SELECT 1 AS ok FROM reviews WHERE id = ${b.targetId}`
          : b.targetType === 'user'
            ? sql`SELECT 1 AS ok FROM users WHERE id = ${b.targetId}`
            : sql`SELECT 1 AS ok FROM organizers WHERE id = ${b.targetId}`,
    );
    if (!exists.length) return err('NOT_FOUND');
    const ins = await this.db
      .insert(reports)
      .values({ id: newId(), reporterId: viewer.userId, targetType: b.targetType, targetId: b.targetId, reason: b.reason, note: b.note ?? null, status: 'open' })
      .onConflictDoNothing()
      .returning();
    if (!ins.length) return err('ALREADY_REPORTED');
    return ok(undefined);
  }

  async queue(status: 'open' | 'resolved' | 'dismissed'): Promise<AdminReport[]> {
    const list = await rows<AdminReport & { createdAt: Date }>(
      this.db,
      sql`SELECT r.id, r.target_type AS "targetType", r.target_id AS "targetId", r.reason, r.note, r.status, r.created_at AS "createdAt",
            u.name AS "reporterName",
            (SELECT count(*) FROM reports r2 WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id)::int AS "reportsOnTarget",
            coalesce(e.title, rv.comment, tu.name, o.display_name, '—') AS "targetLabel",
            coalesce(e.slug, re.slug) AS "targetSlug"
          FROM reports r
          JOIN users u ON u.id = r.reporter_id
          LEFT JOIN events e ON r.target_type = 'event' AND e.id = r.target_id
          LEFT JOIN reviews rv ON r.target_type = 'review' AND rv.id = r.target_id
          LEFT JOIN events re ON re.id = rv.event_id
          LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
          LEFT JOIN organizers o ON r.target_type = 'organizer' AND o.id = r.target_id
          WHERE r.status = ${status}
          ORDER BY "reportsOnTarget" DESC, r.created_at LIMIT 200`,
    );
    return list.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  /** Resolver aplica a ação ao alvo e fecha todas as denúncias abertas dele. Tudo vai para o audit_log. */
  async resolve(admin: Viewer, reportId: string, action: 'remove' | 'dismiss' | 'hide_review' | 'block_user', note: string): Promise<Result<void>> {
    const [r] = await this.db.select().from(reports).where(eq(reports.id, reportId));
    if (!r) return err('NOT_FOUND');
    const now = this.clock.now();
    if (action === 'remove') {
      if (r.targetType !== 'event') return err('VALIDATION_FAILED', 'Remover vale só para evento.');
      await this.db.update(events).set({ status: 'removed', updatedAt: now }).where(eq(events.id, r.targetId));
    } else if (action === 'hide_review') {
      if (r.targetType !== 'review') return err('VALIDATION_FAILED', 'Ocultar vale só para comentário.');
      await this.hideReview(r.targetId);
    } else if (action === 'block_user') {
      const userId = await this.userOfTarget(r.targetType, r.targetId);
      if (!userId) return err('NOT_FOUND');
      const b = await this.block(admin, userId, note || `denúncia ${r.reason}`);
      if (!b.ok) return b;
    }
    await this.db
      .update(reports)
      .set({ status: action === 'dismiss' ? 'dismissed' : 'resolved', resolvedBy: admin.userId, resolution: `${action}${note ? `: ${note}` : ''}`, resolvedAt: now })
      .where(and(eq(reports.targetType, r.targetType), eq(reports.targetId, r.targetId), eq(reports.status, 'open')));
    await audit(this.db, { actorId: admin.userId, action: `report.${action}`, entity: r.targetType, entityId: r.targetId, payload: { reportId, note } });
    return ok(undefined);
  }

  private async hideReview(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [rv] = await tx.update(reviews).set({ status: 'hidden' }).where(and(eq(reviews.id, id), eq(reviews.status, 'visible'))).returning();
      if (rv) await tx.execute(sql`UPDATE events SET rating_sum = rating_sum - ${rv.rating}, rating_count = greatest(0, rating_count - 1) WHERE id = ${rv.eventId}`);
    });
  }

  private async userOfTarget(type: string, id: string): Promise<string | null> {
    if (type === 'user') return id;
    if (type === 'review') {
      const [r] = await this.db.select({ u: reviews.userId }).from(reviews).where(eq(reviews.id, id));
      return r?.u ?? null;
    }
    const q =
      type === 'event'
        ? sql`SELECT o.user_id AS u FROM events e JOIN organizers o ON o.id = e.organizer_id WHERE e.id = ${id}`
        : sql`SELECT user_id AS u FROM organizers WHERE id = ${id}`;
    const [r] = await rows<{ u: string | null }>(this.db, q);
    return r?.u ?? null;
  }

  /** RN-10: bloqueado não loga e os eventos dele saem da descoberta. Revogação imediata via denylist. */
  async block(admin: Viewer, userId: string, reason: string): Promise<Result<void>> {
    const now = this.clock.now();
    const [u] = await this.db.update(users).set({ status: 'blocked', blockedReason: reason, updatedAt: now }).where(and(eq(users.id, userId), eq(users.status, 'active'), sql`${users.role} <> 'admin'`)).returning();
    if (!u) return err('NOT_FOUND');
    await revokeAllSessions(this.db, userId, 'block', now);
    await this.denylist.deny(userId);
    await audit(this.db, { actorId: admin.userId, action: 'user.blocked', entity: 'user', entityId: userId, payload: { reason } });
    return ok(undefined);
  }

  async unblock(admin: Viewer, userId: string, reason: string): Promise<Result<void>> {
    const [u] = await this.db.update(users).set({ status: 'active', blockedReason: null, updatedAt: this.clock.now() }).where(and(eq(users.id, userId), eq(users.status, 'blocked'))).returning();
    if (!u) return err('NOT_FOUND');
    await audit(this.db, { actorId: admin.userId, action: 'user.unblocked', entity: 'user', entityId: userId, payload: { reason } });
    return ok(undefined);
  }

  async restoreEvent(admin: Viewer, eventId: string): Promise<Result<void>> {
    const [e] = await this.db.update(events).set({ status: 'published', updatedAt: this.clock.now() }).where(and(eq(events.id, eventId), eq(events.status, 'removed'))).returning();
    if (!e) return err('NOT_FOUND');
    await audit(this.db, { actorId: admin.userId, action: 'event.restored', entity: 'event', entityId: eventId });
    return ok(undefined);
  }

  async createOrganizer(admin: Viewer, input: Parameters<OrganizerService['createUnclaimed']>[0]): Promise<OrganizerDto> {
    const o = await this.orgs.createUnclaimed(input);
    await audit(this.db, { actorId: admin.userId, action: 'organizer.created_by_admin', entity: 'organizer', entityId: o.id });
    return this.orgs.toDto(o);
  }

  async listOrganizers(): Promise<OrganizerDto[]> {
    const list = await this.db.select().from(organizers).orderBy(organizers.displayName).limit(500);
    return Promise.all(list.map((o) => this.orgs.toDto(o)));
  }

  async stats(): Promise<AdminStats> {
    const now = this.clock.now();
    const [s] = await rows<AdminStats>(
      this.db,
      sql`SELECT
        (SELECT count(*) FROM users WHERE status = 'active')::int AS users,
        (SELECT count(*) FROM discovery_preferences WHERE onboarded_at IS NOT NULL)::int AS onboarded,
        (SELECT count(*) FROM organizers)::int AS organizers,
        (SELECT count(*) FROM events WHERE status = 'published')::int AS "eventsPublished",
        (SELECT count(*) FROM events WHERE status = 'published' AND ends_at > ${now})::int AS "eventsUpcoming",
        (SELECT count(*) FROM rsvps WHERE status IN ('confirmed','approved'))::int AS "rsvpsGoing",
        (SELECT count(*) FROM reviews)::int AS reviews,
        (SELECT count(*) FROM reports WHERE status = 'open')::int AS "openReports"`,
    );
    if (!s) throw new Error('stats failed');
    return s;
  }
}
