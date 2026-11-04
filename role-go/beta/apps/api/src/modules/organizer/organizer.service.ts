import { Inject, Injectable } from '@nestjs/common';
import type { OrganizerDto, OrganizerInput } from '@rolego/contracts';
import { eq } from 'drizzle-orm';
import { DB, type Db, type DbOrTx } from '../../shared/db/db';
import { mediaAssets, organizers } from '../../shared/db/schema';
import { Clock } from '../../shared/kernel/clock';
import { newId, randomSuffix, slugify } from '../../shared/kernel/ids';
import { err, ok, type Result } from '../../shared/kernel/result';
import { mediaUrl } from '../../shared/media/storage';

type OrgRow = typeof organizers.$inferSelect;
const cleanIg = (v?: string) => (v ? v.replace(/^@/, '') : null);

@Injectable()
export class OrganizerService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async uniqueSlug(name: string, db: DbOrTx = this.db): Promise<string> {
    const base = slugify(name);
    for (let i = 0; i < 5; i++) {
      const slug = i === 0 ? base : `${base}-${randomSuffix(4)}`;
      const [hit] = await db.select({ id: organizers.id }).from(organizers).where(eq(organizers.slug, slug));
      if (!hit) return slug;
    }
    return `${base}-${randomSuffix(8)}`;
  }

  async byUser(userId: string): Promise<OrgRow | null> {
    const [o] = await this.db.select().from(organizers).where(eq(organizers.userId, userId));
    return o ?? null;
  }

  async toDto(o: OrgRow): Promise<OrganizerDto> {
    let avatarUrl: string | null = null;
    if (o.avatarAssetId) {
      const [a] = await this.db.select({ v: mediaAssets.variants }).from(mediaAssets).where(eq(mediaAssets.id, o.avatarAssetId));
      avatarUrl = mediaUrl(a?.v['md']);
    }
    return { id: o.id, slug: o.slug, displayName: o.displayName, kind: o.kind, bio: o.bio, instagram: o.instagram, avatarUrl };
  }

  /** RF-E02-01: qualquer usuário pode virar organizador (sem CNPJ no beta). */
  async activate(userId: string, input: OrganizerInput): Promise<Result<OrgRow>> {
    const existing = await this.byUser(userId);
    if (existing) return ok(existing);
    const [o] = await this.db
      .insert(organizers)
      .values({
        id: newId(),
        userId,
        slug: await this.uniqueSlug(input.displayName),
        displayName: input.displayName,
        kind: input.kind,
        bio: input.bio ?? null,
        instagram: cleanIg(input.instagram),
        claimedAt: this.clock.now(),
      })
      .returning();
    return o ? ok(o) : err('INTERNAL');
  }

  async update(userId: string, input: Partial<OrganizerInput>): Promise<Result<OrgRow>> {
    const o = await this.byUser(userId);
    if (!o) return err('ORGANIZER_REQUIRED');
    const [u] = await this.db
      .update(organizers)
      .set({
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.instagram !== undefined ? { instagram: cleanIg(input.instagram) } : {}),
        updatedAt: this.clock.now(),
      })
      .where(eq(organizers.id, o.id))
      .returning();
    return u ? ok(u) : err('INTERNAL');
  }

  /** RF-ADM-04: organizador criado pelo admin, sem usuário (curadoria de lançamento). */
  async createUnclaimed(input: OrganizerInput & { contactEmail: string }): Promise<OrgRow> {
    const [o] = await this.db
      .insert(organizers)
      .values({
        id: newId(),
        userId: null,
        slug: await this.uniqueSlug(input.displayName),
        displayName: input.displayName,
        kind: input.kind,
        bio: input.bio ?? null,
        instagram: cleanIg(input.instagram),
        contactEmail: input.contactEmail,
      })
      .returning();
    if (!o) throw new Error('insert failed');
    return o;
  }
}
