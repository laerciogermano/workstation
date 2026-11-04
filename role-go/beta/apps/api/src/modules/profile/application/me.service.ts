import { Inject, Injectable } from '@nestjs/common';
import { DiscoveryFilters, type Me, type PreferencesBody, RADIUS_DEFAULT_KM } from '@rolego/contracts';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DenylistService } from '../../../shared/auth/denylist.service';
import { revokeAllSessions } from '../../../shared/auth/sessions';
import { DB, rows, textArray, type Db } from '../../../shared/db/db';
import { cities, discoveryPreferences, events, mediaAssets, organizers, passkeys, rsvps, users } from '../../../shared/db/schema';
import { JobQueue } from '../../../shared/jobs/job-queue';
import { Clock } from '../../../shared/kernel/clock';
import { err, ok, type Result } from '../../../shared/kernel/result';
import { MediaService } from '../../../shared/media/media.service';
import { mediaUrl } from '../../../shared/media/storage';
import { audit } from '../../../shared/audit';

/** GPS: só a última posição, com 3 casas decimais (~100 m) — docs/05 §6. */
const round3 = (v: number) => Math.round(v * 1000) / 1000;

@Injectable()
export class MeService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly media: MediaService,
    private readonly jobs: JobQueue,
    private readonly denylist: DenylistService,
    private readonly clock: Clock,
  ) {}

  async getMe(userId: string): Promise<Me | null> {
    const [r] = await rows<{
      id: string; email: string; emailVerifiedAt: Date | null; name: string; photo: Record<string, string> | null;
      role: 'user' | 'admin'; termsAcceptedAt: Date | null; createdAt: Date; showPresence: boolean;
      eventTypeSlugs: string[] | null; cityId: string | null; originMode: 'gps' | 'city' | 'override' | null;
      lat: number | null; lng: number | null; overrideCityId: string | null; radiusKm: number | null;
      filters: Record<string, unknown> | null; onboardedAt: Date | null;
    }>(
      this.db,
      sql`SELECT u.id, u.email, u.email_verified_at AS "emailVerifiedAt", u.name, m.variants AS photo, u.role,
            u.terms_accepted_at AS "termsAcceptedAt", u.created_at AS "createdAt", u.show_presence AS "showPresence",
            p.event_type_slugs AS "eventTypeSlugs", p.city_id AS "cityId", p.origin_mode AS "originMode",
            ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng, p.override_city_id AS "overrideCityId",
            p.radius_km AS "radiusKm", p.filters, p.onboarded_at AS "onboardedAt"
          FROM users u
          LEFT JOIN discovery_preferences p ON p.user_id = u.id
          LEFT JOIN media_assets m ON m.id = u.photo_asset_id
          WHERE u.id = ${userId} AND u.status = 'active'`,
    );
    if (!r) return null;
    const cityIds = [r.cityId, r.overrideCityId].filter((x): x is string => !!x);
    const cityRows = cityIds.length ? await this.db.select().from(cities).where(inArray(cities.id, cityIds)) : [];
    const cityRef = (id: string | null) => {
      const c = cityRows.find((x) => x.id === id);
      return c ? { id: c.id, name: c.name, uf: c.uf, launchStatus: c.launchStatus } : null;
    };
    const [org] = await this.db.select().from(organizers).where(eq(organizers.userId, userId));
    const [pk] = await this.db.select({ id: passkeys.id }).from(passkeys).where(eq(passkeys.userId, userId)).limit(1);
    const now = this.clock.now();
    const [stats] = await rows<{ attended: number; upcoming: number; reviews: number }>(
      this.db,
      sql`SELECT
            (SELECT count(*) FROM rsvps r JOIN events e ON e.id = r.event_id WHERE r.user_id = ${userId} AND r.status IN ('confirmed','approved') AND e.ends_at <= ${now})::int AS attended,
            (SELECT count(*) FROM rsvps r JOIN events e ON e.id = r.event_id WHERE r.user_id = ${userId} AND r.status IN ('confirmed','approved','pending') AND e.ends_at > ${now} AND e.status = 'published')::int AS upcoming,
            (SELECT count(*) FROM reviews WHERE user_id = ${userId})::int AS reviews`,
    );
    return {
      id: r.id,
      email: r.email,
      emailVerified: r.emailVerifiedAt !== null,
      name: r.name,
      photoUrl: mediaUrl(r.photo?.['md']),
      role: r.role,
      needsConsent: r.termsAcceptedAt === null,
      onboarded: r.onboardedAt !== null,
      hasPasskey: !!pk,
      createdAt: r.createdAt.toISOString(),
      preferences: {
        eventTypes: r.eventTypeSlugs ?? [],
        city: cityRef(r.cityId),
        originMode: r.originMode ?? 'city',
        location: r.lat !== null && r.lng !== null ? { lat: r.lat, lng: r.lng } : null,
        overrideCity: cityRef(r.overrideCityId),
        radiusKm: r.radiusKm ?? RADIUS_DEFAULT_KM,
        filters: DiscoveryFilters.parse(r.filters ?? {}),
      },
      privacy: { showPresence: r.showPresence },
      organizer: org ? { id: org.id, slug: org.slug, displayName: org.displayName, kind: org.kind } : null,
      stats: stats ?? { attended: 0, upcoming: 0, reviews: 0 },
    };
  }

  async update(userId: string, body: { name?: string; email?: string }): Promise<Result<void>> {
    const patch: Partial<typeof users.$inferInsert> = { updatedAt: this.clock.now() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.email !== undefined) {
      const [current] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, userId));
      if (current && current.email !== body.email) {
        const [taken] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
        if (taken) return err('EMAIL_TAKEN', 'Este e-mail já está em uso.');
        patch.email = body.email;
        patch.emailVerifiedAt = null; // trocar o e-mail reinicia a verificação
      }
    }
    await this.db.update(users).set(patch).where(eq(users.id, userId));
    return ok(undefined);
  }

  async setPhoto(userId: string, file: Buffer | undefined): Promise<Result<void>> {
    const up = await this.media.upload('avatar', userId, file);
    if (!up.ok) return up;
    const [prev] = await this.db.select({ photo: users.photoAssetId }).from(users).where(eq(users.id, userId));
    await this.db.update(users).set({ photoAssetId: up.value.id }).where(eq(users.id, userId));
    if (prev?.photo) await this.media.removeAsset(prev.photo);
    return ok(undefined);
  }

  async removePhoto(userId: string): Promise<void> {
    const [prev] = await this.db.select({ photo: users.photoAssetId }).from(users).where(eq(users.id, userId));
    await this.db.update(users).set({ photoAssetId: null }).where(eq(users.id, userId));
    if (prev?.photo) await this.media.removeAsset(prev.photo);
  }

  async setPreferences(userId: string, b: PreferencesBody): Promise<Result<void>> {
    if (b.eventTypes) {
      const known = await rows<{ slug: string }>(this.db, sql`SELECT slug FROM event_types WHERE slug = ANY(${textArray(b.eventTypes)})`);
      if (known.length !== new Set(b.eventTypes).size) return err('VALIDATION_FAILED', 'Tipo de evento desconhecido');
    }
    for (const id of [b.cityId, b.overrideCityId]) {
      if (!id) continue;
      const [c] = await this.db.select({ id: cities.id }).from(cities).where(eq(cities.id, id));
      if (!c) return err('VALIDATION_FAILED', 'Cidade desconhecida');
    }
    const [current] = await this.db.select().from(discoveryPreferences).where(eq(discoveryPreferences.userId, userId));
    const set: Record<string, unknown> = { updatedAt: this.clock.now() };
    if (b.eventTypes) set['eventTypeSlugs'] = b.eventTypes;
    if (b.cityId) set['cityId'] = b.cityId;
    if (b.radiusKm !== undefined) set['radiusKm'] = b.radiusKm;
    if (b.overrideCityId !== undefined) set['overrideCityId'] = b.overrideCityId;
    if (b.originMode) set['originMode'] = b.originMode;
    if (b.overrideCityId === null && current?.originMode === 'override' && !b.originMode) {
      set['originMode'] = current.location ? 'gps' : 'city';
    }
    if (b.location !== undefined) {
      set['location'] = b.location ? sql`ST_SetSRID(ST_MakePoint(${round3(b.location.lng)}, ${round3(b.location.lat)}), 4326)::geography` : null;
    }
    if (b.filters) set['filters'] = DiscoveryFilters.parse({ ...(current?.filters ?? {}), ...b.filters });
    if (current) {
      await this.db.update(discoveryPreferences).set(set).where(eq(discoveryPreferences.userId, userId));
    } else {
      await this.db.insert(discoveryPreferences).values({ userId, eventTypeSlugs: [], originMode: 'city', radiusKm: RADIUS_DEFAULT_KM, filters: {}, ...set });
    }
    return ok(undefined);
  }

  async completeOnboarding(userId: string): Promise<Result<void>> {
    const [p] = await this.db.select().from(discoveryPreferences).where(eq(discoveryPreferences.userId, userId));
    if (!p || p.eventTypeSlugs.length === 0 || !p.cityId) return err('ONBOARDING_INCOMPLETE');
    if (!p.onboardedAt) await this.db.update(discoveryPreferences).set({ onboardedAt: this.clock.now() }).where(eq(discoveryPreferences.userId, userId));
    return ok(undefined);
  }

  async setPrivacy(userId: string, showPresence: boolean): Promise<void> {
    await this.db.update(users).set({ showPresence, updatedAt: this.clock.now() }).where(eq(users.id, userId));
  }

  /**
   * Excluir conta (LGPD, RF-E01-15): anonimiza, apaga fotos, revoga sessões e cancela eventos futuros que organiza.
   */
  async deleteAccount(userId: string): Promise<void> {
    const now = this.clock.now();
    const cancelled = await this.db.transaction(async (tx) => {
      const [org] = await tx.select({ id: organizers.id }).from(organizers).where(eq(organizers.userId, userId));
      let cancelledIds: string[] = [];
      if (org) {
        const evs = await tx
          .update(events)
          .set({ status: 'cancelled', cancelReason: 'O organizador encerrou a conta.', updatedAt: now })
          .where(and(eq(events.organizerId, org.id), eq(events.status, 'published'), sql`${events.endsAt} > ${now}`))
          .returning({ id: events.id });
        cancelledIds = evs.map((e) => e.id);
        await tx.delete(events).where(and(eq(events.organizerId, org.id), eq(events.status, 'draft')));
      }
      await tx.execute(sql`
        UPDATE events e SET going_count = greatest(0, going_count - 1)
          FROM rsvps r WHERE r.event_id = e.id AND r.user_id = ${userId} AND r.status IN ('confirmed','approved') AND e.ends_at > ${now}`);
      await tx.execute(sql`
        UPDATE events e SET pending_count = greatest(0, pending_count - 1)
          FROM rsvps r WHERE r.event_id = e.id AND r.user_id = ${userId} AND r.status = 'pending'`);
      await tx.execute(sql`
        UPDATE events e SET interests_count = greatest(0, interests_count - 1)
          FROM interests i WHERE i.event_id = e.id AND i.user_id = ${userId}`);
      await tx.delete(rsvps).where(and(eq(rsvps.userId, userId), sql`${rsvps.eventId} IN (SELECT id FROM events WHERE ends_at > ${now})`));
      await tx.execute(sql`DELETE FROM interests WHERE user_id = ${userId}`);
      await tx.execute(sql`DELETE FROM swipe_passes WHERE user_id = ${userId}`);
      await tx.delete(passkeys).where(eq(passkeys.userId, userId));
      await tx.execute(sql`DELETE FROM refresh_tokens WHERE user_id = ${userId}`);
      await tx.execute(sql`DELETE FROM auth_tokens WHERE user_id = ${userId}`);
      await tx.delete(discoveryPreferences).where(eq(discoveryPreferences.userId, userId));
      await tx
        .update(users)
        .set({
          email: `deleted+${userId}@rolego.invalid`,
          name: 'Usuário removido',
          passwordHash: null,
          googleSub: null,
          appleSub: null,
          photoAssetId: null,
          showPresence: false,
          status: 'deleted',
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      await audit(tx, { actorId: userId, action: 'account.deleted', entity: 'user', entityId: userId });
      return cancelledIds;
    });
    await revokeAllSessions(this.db, userId, 'delete', now);
    await this.denylist.deny(userId);
    await this.jobs.send('account.purge', { userId }, { singletonKey: `purge:${userId}` });
    for (const eventId of cancelled) await this.jobs.send('event.cancelled.notify', { eventId }, { singletonKey: `cancel:${eventId}` });
  }

  /** Job account.purge: apaga a mídia do usuário. */
  async purgeMedia(userId: string): Promise<void> {
    const assets = await this.db.select({ id: mediaAssets.id }).from(mediaAssets).where(and(eq(mediaAssets.ownerUserId, userId), eq(mediaAssets.kind, 'avatar')));
    for (const a of assets) await this.media.removeAsset(a.id);
  }
}
