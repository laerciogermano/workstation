import type { DayFilter } from '@rolego/contracts';

const KEY = 'rg_guest_discovery';

export type GuestDiscovery = {
  filters: { types: string[]; days: DayFilter[]; freeOnly: boolean };
  radiusKm: number;
  originMode: 'city' | 'gps' | 'override';
  cityId?: string;
  cityName?: string;
  cityUf?: string;
  lat?: number;
  lng?: number;
};

const DEFAULT: GuestDiscovery = {
  filters: { types: [], days: [], freeOnly: false },
  radiusKm: 20,
  originMode: 'city',
};

export function readGuest(): GuestDiscovery {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, filters: { ...DEFAULT.filters } };
    const p = JSON.parse(raw) as Partial<GuestDiscovery>;
    return {
      filters: {
        types: Array.isArray(p.filters?.types) ? p.filters.types : [],
        days: Array.isArray(p.filters?.days) ? (p.filters.days as DayFilter[]) : [],
        freeOnly: !!p.filters?.freeOnly,
      },
      radiusKm: typeof p.radiusKm === 'number' ? p.radiusKm : 20,
      originMode: p.originMode === 'gps' || p.originMode === 'override' ? p.originMode : 'city',
      cityId: typeof p.cityId === 'string' ? p.cityId : undefined,
      cityName: typeof p.cityName === 'string' ? p.cityName : undefined,
      cityUf: typeof p.cityUf === 'string' ? p.cityUf : undefined,
      lat: typeof p.lat === 'number' ? p.lat : undefined,
      lng: typeof p.lng === 'number' ? p.lng : undefined,
    };
  } catch {
    return { ...DEFAULT, filters: { ...DEFAULT.filters } };
  }
}

export function writeGuest(patch: Partial<GuestDiscovery> & { filters?: Partial<GuestDiscovery['filters']> }): GuestDiscovery {
  const cur = readGuest();
  const next: GuestDiscovery = {
    ...cur,
    ...patch,
    filters: { ...cur.filters, ...(patch.filters ?? {}) },
  };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Query params enviados à API de discovery (visitante). */
export function guestQuery(g: GuestDiscovery): Record<string, string | number | boolean | string[] | undefined> {
  return {
    types: g.filters.types.length ? g.filters.types : undefined,
    days: g.filters.days.length ? g.filters.days : undefined,
    freeOnly: g.filters.freeOnly ? true : undefined,
    radiusKm: g.radiusKm,
    cityId: g.originMode === 'override' ? g.cityId : undefined,
    lat: g.originMode === 'gps' ? g.lat : undefined,
    lng: g.originMode === 'gps' ? g.lng : undefined,
  };
}
