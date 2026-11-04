import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db';
import { geocodeCache } from '../db/schema';
import { env } from '../env';

export type CepResult = { street: string; neighborhood: string; city: string; uf: string };
export type GeoPoint = { lat: number; lng: number };
export type ReverseResult = { street: string; neighborhood: string; city: string; uf: string; cep: string };

/** GeocodingPort (ADR-006): ViaCEP + Nominatim atrás de um port trocável. */
export abstract class GeocodingPort {
  abstract cep(cep: string): Promise<CepResult | null>;
  abstract geocode(q: { street: string; number: string; city: string; uf: string; cep: string }): Promise<GeoPoint | null>;
  abstract reverse(p: GeoPoint): Promise<ReverseResult | null>;
}

const CACHE_DAYS = 30;

@Injectable()
export class LiveGeocoder extends GeocodingPort {
  private readonly logger = new Logger('Geocoding');
  constructor(@Inject(DB) private readonly db: Db) {
    super();
  }

  private async cached<T>(key: string, fetcher: () => Promise<T | null>): Promise<T | null> {
    const [hit] = await this.db.select().from(geocodeCache).where(eq(geocodeCache.key, key));
    if (hit && Date.now() - hit.fetchedAt.getTime() < CACHE_DAYS * 86400_000) return hit.result as T;
    try {
      const value = await fetcher();
      if (value) {
        await this.db
          .insert(geocodeCache)
          .values({ key, result: value as Record<string, unknown> })
          .onConflictDoUpdate({ target: geocodeCache.key, set: { result: value as Record<string, unknown>, fetchedAt: new Date() } });
      }
      return value;
    } catch (e) {
      this.logger.warn(`geocoding falhou (${key.split(':')[0]}): ${String(e)}`);
      return null;
    }
  }

  private async json(url: string): Promise<unknown> {
    const res = await fetch(url, { headers: { 'User-Agent': env().NOMINATIM_UA, Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  cep(cep: string): Promise<CepResult | null> {
    const clean = cep.replace(/\D/g, '');
    return this.cached(`cep:${clean}`, async () => {
      const r = (await this.json(`https://viacep.com.br/ws/${clean}/json/`)) as Record<string, string | boolean>;
      if (r['erro']) return null;
      return { street: String(r['logradouro'] ?? ''), neighborhood: String(r['bairro'] ?? ''), city: String(r['localidade'] ?? ''), uf: String(r['uf'] ?? '') };
    });
  }

  geocode(q: { street: string; number: string; city: string; uf: string; cep: string }): Promise<GeoPoint | null> {
    const key = `geo:${q.cep}:${q.number}`.toLowerCase();
    return this.cached(key, async () => {
      const params = new URLSearchParams({ format: 'jsonv2', limit: '1', country: 'Brasil', street: `${q.number} ${q.street}`, city: q.city, state: q.uf });
      let list = (await this.json(`${env().NOMINATIM_URL}/search?${params}`)) as { lat: string; lon: string }[];
      if (!list.length) {
        const p2 = new URLSearchParams({ format: 'jsonv2', limit: '1', country: 'Brasil', postalcode: q.cep, city: q.city });
        list = (await this.json(`${env().NOMINATIM_URL}/search?${p2}`)) as { lat: string; lon: string }[];
      }
      const first = list[0];
      return first ? { lat: Number(first.lat), lng: Number(first.lon) } : null;
    });
  }

  reverse(p: GeoPoint): Promise<ReverseResult | null> {
    return this.cached(`rev:${p.lat.toFixed(4)},${p.lng.toFixed(4)}`, async () => {
      const params = new URLSearchParams({ format: 'jsonv2', lat: String(p.lat), lon: String(p.lng), zoom: '18', addressdetails: '1' });
      const r = (await this.json(`${env().NOMINATIM_URL}/reverse?${params}`)) as { address?: Record<string, string> };
      const a = r.address;
      if (!a) return null;
      return {
        street: a['road'] ?? '',
        neighborhood: a['suburb'] ?? a['neighbourhood'] ?? a['city_district'] ?? '',
        city: a['city'] ?? a['town'] ?? a['municipality'] ?? '',
        uf: (a['ISO3166-2-lvl4'] ?? '').replace('BR-', ''),
        cep: a['postcode'] ?? '',
      };
    });
  }
}

/** Fake determinístico (testes e dev offline): espalha pontos em volta do centro de Curitiba. */
export class FakeGeocoder extends GeocodingPort {
  async cep(cep: string): Promise<CepResult | null> {
    const clean = cep.replace(/\D/g, '');
    if (clean === '00000000') return null;
    return { street: 'Rua XV de Novembro', neighborhood: 'Centro', city: 'Curitiba', uf: 'PR' };
  }
  async geocode(q: { cep: string; number: string }): Promise<GeoPoint | null> {
    let h = 0;
    for (const ch of q.cep + q.number) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return { lat: -25.4284 + ((h % 1000) - 500) / 20000, lng: -49.2733 + (((h >> 10) % 1000) - 500) / 20000 };
  }
  async reverse(): Promise<ReverseResult | null> {
    return { street: 'Rua XV de Novembro', neighborhood: 'Centro', city: 'Curitiba', uf: 'PR', cep: '80020-310' };
  }
}
