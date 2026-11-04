import { Inject, Injectable } from '@nestjs/common';
import type { CityRef, Origin } from '@rolego/contracts';
import { sql } from 'drizzle-orm';
import { DB, rows, type Db } from '../../../shared/db/db';

type CityRow = CityRef & { lat: number; lng: number };
const CURITIBA = { lat: -25.4284, lng: -49.2733 };

/** Origem da busca resolvida no servidor: override city → gps → city (US-02.15). */
@Injectable()
export class OriginResolver {
  constructor(@Inject(DB) private readonly db: Db) {}

  async city(id: string | null): Promise<CityRow | null> {
    if (!id) return null;
    const [c] = await rows<CityRow>(
      this.db,
      sql`SELECT id, name, uf, launch_status AS "launchStatus", ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng FROM cities WHERE id = ${id}`,
    );
    return c ?? null;
  }

  async defaultCity(): Promise<CityRow | null> {
    const [c] = await rows<CityRow>(
      this.db,
      sql`SELECT id, name, uf, launch_status AS "launchStatus", ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng
          FROM cities ORDER BY (launch_status = 'live') DESC, name LIMIT 1`,
    );
    return c ?? null;
  }

  async forUser(userId: string | null, radiusOverride?: number): Promise<Origin & { preferredTypes: string[] }> {
    const [p] = userId
      ? await rows<{ originMode: 'gps' | 'city' | 'override'; cityId: string | null; overrideCityId: string | null; lat: number | null; lng: number | null; radiusKm: number; types: string[] }>(
          this.db,
          sql`SELECT origin_mode AS "originMode", city_id AS "cityId", override_city_id AS "overrideCityId",
                ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng, radius_km AS "radiusKm", event_type_slugs AS types
              FROM discovery_preferences WHERE user_id = ${userId}`,
        )
      : [];
    const radiusKm = radiusOverride ?? p?.radiusKm ?? 20;
    const strip = (c: CityRow): CityRef => ({ id: c.id, name: c.name, uf: c.uf, launchStatus: c.launchStatus });
    const preferredTypes = p?.types ?? [];
    if (p?.originMode === 'override' && p.overrideCityId) {
      const c = await this.city(p.overrideCityId);
      if (c) return { mode: 'override', label: c.name, city: strip(c), point: { lat: c.lat, lng: c.lng }, radiusKm, preferredTypes };
    }
    const base = (await this.city(p?.cityId ?? null)) ?? (await this.defaultCity());
    if (p?.originMode === 'gps' && p.lat !== null && p.lng !== null) {
      return { mode: 'gps', label: base?.name ?? 'Minha localização', city: base ? strip(base) : null, point: { lat: p.lat, lng: p.lng }, radiusKm, preferredTypes };
    }
    return {
      mode: 'city',
      label: base?.name ?? 'Curitiba',
      city: base ? strip(base) : null,
      point: base ? { lat: base.lat, lng: base.lng } : CURITIBA,
      radiusKm,
      preferredTypes,
    };
  }
}
