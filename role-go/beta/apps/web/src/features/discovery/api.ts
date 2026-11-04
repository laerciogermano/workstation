import type { EventCard, Origin, Page } from '@rolego/contracts';
import { api, qs } from '../../lib/http';
import { guestQuery, readGuest, type GuestDiscovery } from './guestPrefs';

export type FeedPage = Page<EventCard> & { origin: Origin };

export type DiscoveryParams = Record<string, string | number | boolean | string[] | undefined | null>;

const withGuest = (extra?: DiscoveryParams, guest?: GuestDiscovery | null): string => {
  const g = guest ?? readGuest();
  return qs({ ...guestQuery(g), ...extra });
};

export const feed = (cursor?: string, guest?: GuestDiscovery | null) => api<FeedPage>(`/discovery/feed${withGuest({ cursor }, guest)}`);
export const list = (sort: 'soonest' | 'nearest', cursor?: string, guest?: GuestDiscovery | null) =>
  api<FeedPage>(`/discovery/list${withGuest({ sort, cursor }, guest)}`);
export const swipe = (guest?: GuestDiscovery | null) => api<EventCard[]>(`/discovery/swipe${withGuest(undefined, guest)}`);
/** Prévia dos filtros: manda tudo explícito (vazio = sem filtro), senão o servidor usaria os filtros salvos. */
export const count = (p: { types: string[]; days: string[]; radiusKm: number; freeOnly: boolean } & DiscoveryParams) => {
  const sp = new URLSearchParams({
    types: p.types.join(','),
    days: p.days.join(','),
    radiusKm: String(p.radiusKm),
    freeOnly: String(p.freeOnly),
  });
  if (typeof p.cityId === 'string') sp.set('cityId', p.cityId);
  if (typeof p.lat === 'number') sp.set('lat', String(p.lat));
  if (typeof p.lng === 'number') sp.set('lng', String(p.lng));
  return api<{ total: number }>(`/discovery/count?${sp}`);
};
export const search = (q: string, scope: 'radius' | 'city', cursor?: string, guest?: GuestDiscovery | null) =>
  api<Page<EventCard>>(`/discovery/search${withGuest({ q, scope, cursor }, guest)}`);
export const setPass = (id: string, on: boolean) => api<void>(`/events/${id}/pass`, { method: on ? 'PUT' : 'DELETE' });
export const setInterest = (id: string, on: boolean) => api(`/events/${id}/interest`, { method: on ? 'PUT' : 'DELETE' });
