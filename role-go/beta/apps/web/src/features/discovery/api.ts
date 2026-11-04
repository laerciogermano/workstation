import type { EventCard, Origin, Page } from '@rolego/contracts';
import { api, qs } from '../../lib/http';

export type FeedPage = Page<EventCard> & { origin: Origin };
export const feed = (cursor?: string) => api<FeedPage>(`/discovery/feed${qs({ cursor })}`);
export const list = (sort: 'soonest' | 'nearest', cursor?: string) => api<FeedPage>(`/discovery/list${qs({ sort, cursor })}`);
export const swipe = () => api<EventCard[]>('/discovery/swipe');
/** Prévia dos filtros: manda tudo explícito (vazio = sem filtro), senão o servidor usaria os filtros salvos. */
export const count = (p: { types: string[]; days: string[]; radiusKm: number; freeOnly: boolean }) => {
  const sp = new URLSearchParams({ types: p.types.join(','), days: p.days.join(','), radiusKm: String(p.radiusKm), freeOnly: String(p.freeOnly) });
  return api<{ total: number }>(`/discovery/count?${sp}`);
};
export const search = (q: string, scope: 'radius' | 'city', cursor?: string) => api<Page<EventCard>>(`/discovery/search${qs({ q, scope, cursor })}`);
export const setPass = (id: string, on: boolean) => api<void>(`/events/${id}/pass`, { method: on ? 'PUT' : 'DELETE' });
export const setInterest = (id: string, on: boolean) => api(`/events/${id}/interest`, { method: on ? 'PUT' : 'DELETE' });
