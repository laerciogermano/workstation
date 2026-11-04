import { Inject, Injectable } from '@nestjs/common';
import { type EventCard, type Page, type ReviewBody, type ReviewDto, REVIEW_WINDOW_DAYS } from '@rolego/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { Viewer } from '../../shared/auth/viewer';
import { DB, rows, type Db } from '../../shared/db/db';
import { events, reviews, rsvps } from '../../shared/db/schema';
import { Clock } from '../../shared/kernel/clock';
import { newId } from '../../shared/kernel/ids';
import { err, ok, type Result } from '../../shared/kernel/result';
import { mediaUrl } from '../../shared/media/storage';
import { findEvents, OriginResolver, toEventCard, viewerFor } from '../events';
import { canReview, filterComment } from './review.policy';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
    private readonly origins: OriginResolver,
  ) {}

  /** Uma avaliação por evento; editar dentro da janela atualiza os agregados na mesma transação. */
  async upsert(viewer: Viewer, eventId: string, body: ReviewBody): Promise<Result<ReviewDto>> {
    const now = this.clock.now();
    const [r] = await this.db
      .select({ status: rsvps.status, endsAt: events.endsAt, evStatus: events.status })
      .from(events)
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.userId, viewer.userId)))
      .where(eq(events.id, eventId));
    if (!r || r.evStatus !== 'published') return err('NOT_FOUND');
    const allowed = canReview(r.status, r.endsAt, now);
    if (!allowed.ok) return allowed;
    const comment = filterComment(body.comment);
    if (!comment.ok) return comment;

    const id = await this.db.transaction(async (tx) => {
      const [prev] = await tx.select().from(reviews).where(and(eq(reviews.eventId, eventId), eq(reviews.userId, viewer.userId))).for('update');
      if (prev) {
        await tx.update(reviews).set({ rating: body.rating, comment: comment.value, updatedAt: now }).where(eq(reviews.id, prev.id));
        if (prev.status === 'visible') await tx.execute(sql`UPDATE events SET rating_sum = rating_sum - ${prev.rating} + ${body.rating} WHERE id = ${eventId}`);
        return prev.id;
      }
      const nid = newId();
      await tx.insert(reviews).values({ id: nid, eventId, userId: viewer.userId, rating: body.rating, comment: comment.value, status: 'visible' });
      await tx.execute(sql`UPDATE events SET rating_sum = rating_sum + ${body.rating}, rating_count = rating_count + 1 WHERE id = ${eventId}`);
      return nid;
    });
    const [dto] = await this.list(eventId, viewer, undefined, id);
    return dto ? ok(dto) : err('INTERNAL');
  }

  private async list(eventId: string, viewer: Viewer | null, offset = 0, onlyId?: string): Promise<ReviewDto[]> {
    const list = await rows<{ id: string; rating: number; comment: string | null; name: string; photo: Record<string, string> | null; createdAt: Date; userId: string }>(
      this.db,
      sql`SELECT r.id, r.rating, r.comment, u.name, m.variants AS photo, r.created_at AS "createdAt", r.user_id AS "userId"
          FROM reviews r JOIN users u ON u.id = r.user_id LEFT JOIN media_assets m ON m.id = u.photo_asset_id
          WHERE r.event_id = ${eventId} AND r.status = 'visible' ${onlyId ? sql`AND r.id = ${onlyId}` : sql``}
          ORDER BY r.created_at DESC LIMIT 21 OFFSET ${offset}`,
    );
    return list.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author: { name: r.name, photoUrl: mediaUrl(r.photo?.['md']) },
      createdAt: r.createdAt.toISOString(),
      mine: viewer?.userId === r.userId,
    }));
  }

  async page(eventId: string, viewer: Viewer | null, cursor: string | undefined): Promise<Page<ReviewDto> & { avg: number; count: number }> {
    const offset = Math.max(0, Number.parseInt(cursor ?? '0', 10) || 0);
    const items = await this.list(eventId, viewer, offset);
    const [agg] = await this.db.select({ sum: events.ratingSum, count: events.ratingCount }).from(events).where(eq(events.id, eventId));
    const count = agg?.count ?? 0;
    return {
      items: items.slice(0, 20),
      nextCursor: items.length > 20 ? String(offset + 20) : null,
      avg: count ? Math.round(((agg?.sum ?? 0) / count) * 10) / 10 : 0,
      count,
    };
  }

  /** Card "Como foi?": eventos que eu fui, encerrados há até 7 dias e ainda sem avaliação. */
  async pending(viewer: Viewer): Promise<EventCard[]> {
    const now = this.clock.now();
    const origin = await this.origins.forUser(viewer.userId);
    const since = new Date(now.getTime() - REVIEW_WINDOW_DAYS * 86400_000);
    const recs = await findEvents(
      this.db,
      { viewerId: viewer.userId, origin: origin.point },
      sql`e.status = 'published' AND r.status IN ('confirmed','approved') AND e.ends_at <= ${now} AND e.ends_at >= ${since}
          AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.event_id = e.id AND rv.user_id = ${viewer.userId})`,
      sql`ORDER BY e.ends_at DESC LIMIT 5`,
    );
    return recs.map((r) => toEventCard(r, viewerFor(r, viewer), now));
  }
}
