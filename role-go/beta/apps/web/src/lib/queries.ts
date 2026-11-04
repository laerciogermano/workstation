import type { CityDto, Counts, EventCard, EventTypeDto, Me } from '@rolego/contracts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, qs } from './http';

export const keys = {
  me: ['me'] as const,
  types: ['catalog', 'types'] as const,
  cities: (q: string) => ['catalog', 'cities', q] as const,
  discovery: ['discovery'] as const,
  event: (slug: string) => ['event', slug] as const,
  myRsvps: ['me', 'rsvps'] as const,
  pendingReviews: ['me', 'reviews', 'pending'] as const,
  organizer: ['organizer'] as const,
};

/** Sessão: null = visitante. */
export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async (): Promise<Me | null> => {
      try {
        return await api<Me>('/me');
      } catch (e) {
        if (e instanceof ApiError && (e.code === 'UNAUTHENTICATED' || e.code === 'TOKEN_EXPIRED' || e.code === 'REFRESH_REUSED')) return null;
        throw e;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export const setMe = (qc: QueryClient, me: Me | null): void => {
  qc.setQueryData(keys.me, me);
};

export function useEventTypes() {
  return useQuery({ queryKey: keys.types, queryFn: () => api<EventTypeDto[]>('/catalog/event-types'), staleTime: 5 * 60_000 });
}

export function useCities(q: string) {
  return useQuery({ queryKey: keys.cities(q), queryFn: () => api<CityDto[]>(`/catalog/cities${qs({ q })}`), staleTime: 5 * 60_000 });
}

/** ♥ otimista (só interesse e passe são otimistas — docs/08 §7). */
export function useToggleInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => api<{ interested: boolean; counts: Counts }>(`/events/${id}/interest`, { method: on ? 'PUT' : 'DELETE' }),
    onMutate: ({ id, on }) => {
      const patch = (e: EventCard): EventCard =>
        e.id === id ? { ...e, viewer: { ...e.viewer, interested: on }, counts: { ...e.counts, interested: Math.max(0, e.counts.interested + (on ? 1 : -1)) } } : e;
      qc.setQueriesData<unknown>({ queryKey: keys.discovery }, (old: unknown) => mapCards(old, patch));
      qc.setQueriesData<unknown>({ queryKey: ['event'] }, (old: unknown) => (isCard(old) ? patch(old) : old));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

const isCard = (x: unknown): x is EventCard => typeof x === 'object' && x !== null && 'slug' in x && 'viewer' in x;

/** Aplica `fn` a cards em formatos comuns de cache (lista, página, páginas infinitas). */
function mapCards(old: unknown, fn: (e: EventCard) => EventCard): unknown {
  if (Array.isArray(old)) return old.map((x) => (isCard(x) ? fn(x) : x));
  if (old && typeof old === 'object') {
    const o = old as Record<string, unknown>;
    if (Array.isArray(o['pages'])) return { ...o, pages: o['pages'].map((p) => mapCards(p, fn)) };
    if (Array.isArray(o['items'])) return { ...o, items: mapCards(o['items'], fn) };
  }
  return old;
}
