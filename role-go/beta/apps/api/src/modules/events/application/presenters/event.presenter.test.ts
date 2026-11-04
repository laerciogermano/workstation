import { describe, expect, it } from 'vitest';
import type { EventRecord } from '../../infra/event-read';
import { anonymousViewer, canOpenEvent, presentDistance, type ViewerContext } from '../policies/access.policy';
import { toEventCard, toEventDetail } from './event.presenter';

process.env.APP_URL ??= 'http://localhost:5173';
process.env.DATABASE_URL ??= 'postgres://x';
process.env.JWT_KEK ??= Buffer.alloc(32).toString('base64');

const now = new Date('2026-11-04T12:00:00Z');
const rec = (over: Partial<EventRecord> = {}): EventRecord => ({
  id: '01a1a644-0000-7000-8000-000000000001', slug: 'social', title: 'Social', typeSlug: 'social', typeLabel: 'Social', typeAccent: 'yellow',
  description: '', ageRating: '18', startsAt: new Date('2026-11-06T23:00:00Z'), endsAt: new Date('2026-11-07T05:00:00Z'), timezone: 'America/Sao_Paulo',
  venueName: 'Casa do anfitrião', cep: '80020-310', street: 'Rua XV de Novembro', number: '200', complement: 'Casa 2', neighborhood: 'Centro', cityName: 'Curitiba', cityId: null,
  lat: -25.4325, lng: -49.2693, visibility: 'private', privateDiscoverable: true, approvalMode: 'manual', accessCode: 'PRVA2K', capacity: 40, priceItems: [],
  externalTicketUrl: null, status: 'published', cancelReason: null, interestsCount: 3, goingCount: 5, pendingCount: 2, viewsCount: 10, ratingSum: 0, ratingCount: 0,
  seriesId: null, organizerId: 'o', coverAssetId: null, orgSlug: 'laercio', orgName: 'Laércio', orgKind: 'person', orgUserId: 'host-user', orgAvatar: null,
  coverVariants: null, distanceKm: 2.6387, viewerInterested: false, viewerRsvp: null, viewerHereAt: null, peopleGoing: [], ...over,
});
const extras = { gallery: [], peopleInterested: [], organizerRating: null, organizerEventsCount: 1, canReview: false };
const LEAK = ['street', 'number', 'complement', 'cep', 'location'];
const viewer = (over: Partial<ViewerContext>): ViewerContext => ({ ...anonymousViewer, userId: 'u1', ...over });

describe('EventPresenter · privado (RN-02, RN-03)', () => {
  for (const [name, v] of [
    ['anônimo', anonymousViewer],
    ['logado sem RSVP', viewer({})],
    ['pending', viewer({ rsvpStatus: 'pending' })],
    ['declined', viewer({ rsvpStatus: 'declined' })],
  ] as const) {
    it(`${name}: sem rua/número/CEP/coordenadas e distância inteira`, () => {
      const d = toEventDetail(rec({ viewerRsvp: v.rsvpStatus }), v, now, extras);
      for (const k of LEAK) expect(d.venue).not.toHaveProperty(k);
      expect(d.venue.addressLocked).toBe(true);
      expect((d.distanceKm ?? 0) % 1).toBe(0);
      expect(d).not.toHaveProperty('organizerView');
      expect(JSON.stringify(d)).not.toContain('Rua XV');
      expect(JSON.stringify(d)).not.toContain('PRVA2K');
    });
  }
  it('aprovado vê o endereço completo', () => {
    const d = toEventDetail(rec({ viewerRsvp: 'approved' }), viewer({ rsvpStatus: 'approved' }), now, extras);
    expect(d.venue).toMatchObject({ street: 'Rua XV de Novembro', number: '200', location: { lat: -25.4325, lng: -49.2693 }, addressLocked: false });
    expect(d.distanceKm).toBe(2.6);
    expect(d).not.toHaveProperty('organizerView');
  });
  it('organizador vê endereço e código', () => {
    const d = toEventDetail(rec(), viewer({ userId: 'host-user', isOrganizer: true }), now, extras);
    expect(d.organizerView?.accessCode).toBe('PRVA2K');
    expect(d.venue.street).toBeDefined();
  });
  it('card nunca leva rua/coordenadas, nem para evento público', () => {
    const c = toEventCard(rec({ visibility: 'public' }), anonymousViewer, now);
    expect(Object.keys(c.venue).sort()).toEqual(['city', 'name', 'neighborhood']);
    expect(c.distanceKm).toBe(2.6);
  });
});

describe('canOpenEvent', () => {
  const e = { status: 'published', visibility: 'private' as const, privateDiscoverable: false, accessCode: 'PRVA2K' };
  it('privado não descobrível sem código: não abre', () => expect(canOpenEvent(anonymousViewer, e, null)).toBe(false));
  it('com código correto (qualquer caixa) abre', () => expect(canOpenEvent(anonymousViewer, e, 'prva2k')).toBe(true));
  it('rascunho só para o dono', () => expect(canOpenEvent(viewer({}), { ...e, status: 'draft', visibility: 'public' }, null)).toBe(false));
});

describe('presentDistance', () => {
  it('0,1 km para liberado', () => expect(presentDistance(2.6387, false)).toBe(2.6));
  it('mínimo de 1 km arredondado para bloqueado', () => expect(presentDistance(0.2, true)).toBe(1));
});
