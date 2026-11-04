import type { EventCard, EventDetail, MediaRef, OrganizerPublic, Page, PersonRef, ReviewDto, RsvpResult } from '@rolego/contracts';
import { api, qs } from '../../lib/http';

export const bySlug = (slug: string, code?: string | null) => api<EventDetail>(`/events/by-slug/${encodeURIComponent(slug)}${qs({ c: code ?? undefined })}`);
export const rsvp = (id: string, accessCode?: string | null) => api<RsvpResult>(`/events/${id}/rsvp`, { method: 'POST', body: accessCode ? { accessCode } : {} });
export const cancelRsvp = (id: string) => api<RsvpResult>(`/events/${id}/rsvp`, { method: 'DELETE' });
export const here = (id: string) => api<void>(`/events/${id}/here`, { method: 'POST' });
export const people = (id: string, kind: 'going' | 'interested', cursor?: string) => api<Page<PersonRef> & { hiddenCount: number; total: number }>(`/events/${id}/people${qs({ kind, cursor })}`);
export const reviews = (id: string) => api<Page<ReviewDto> & { avg: number; count: number }>(`/events/${id}/reviews`);
export const putReview = (id: string, body: { rating: number; comment?: string }) => api<ReviewDto>(`/events/${id}/review`, { method: 'PUT', body });
export const editions = (id: string) => api<{ editions: EventCard[]; photos: MediaRef[] }>(`/events/${id}/editions`);
export const organizer = (slug: string) => api<OrganizerPublic>(`/organizers/${encodeURIComponent(slug)}`);
export const report = (body: { targetType: 'event' | 'review' | 'user' | 'organizer'; targetId: string; reason: string; note?: string }) => api<void>('/reports', { method: 'POST', body });
export const accessCode = (code: string) => api<{ slug: string }>('/events/access-code', { method: 'POST', body: { code } });
