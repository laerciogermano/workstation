import { describe, expect, it } from 'vitest';
import { canCancelRsvp, canCheckIn, decideRsvp, type RsvpEventFacts } from './rsvp.policy';

const now = new Date('2026-11-04T12:00:00Z');
const ev = (over: Partial<RsvpEventFacts> = {}): RsvpEventFacts => ({ status: 'published', visibility: 'public', approvalMode: 'manual', ageRating: 'free', endsAt: new Date('2026-11-05T12:00:00Z'), privateDiscoverable: false, accessCode: null, ...over });
const v = { adult: true, current: null, isOrganizer: false };

describe('RsvpPolicy', () => {
  it('público confirma na hora', () => expect(decideRsvp(ev(), v, null, now)).toEqual({ ok: true, value: { kind: 'create', status: 'confirmed' } }));
  it('privado manual vira pedido', () => expect(decideRsvp(ev({ visibility: 'private', accessCode: 'ABCDEF' }), v, 'abcdef', now)).toEqual({ ok: true, value: { kind: 'create', status: 'pending' } }));
  it('privado auto aprova', () => expect(decideRsvp(ev({ visibility: 'private', approvalMode: 'auto', privateDiscoverable: true }), v, null, now)).toMatchObject({ ok: true, value: { status: 'approved' } }));
  it('privado não descobrível sem código: ACCESS_CODE_INVALID', () => expect(decideRsvp(ev({ visibility: 'private', accessCode: 'ABCDEF' }), v, 'XXXXXX', now)).toMatchObject({ ok: false, error: { code: 'ACCESS_CODE_INVALID' } }));
  it('18+ exige maioridade declarada (RN-11)', () => expect(decideRsvp(ev({ ageRating: '18' }), { ...v, adult: false }, null, now)).toMatchObject({ ok: false, error: { code: 'ADULT_REQUIRED' } }));
  it('encerrado: EVENT_UNAVAILABLE', () => expect(decideRsvp(ev({ endsAt: new Date('2026-11-04T11:00:00Z') }), v, null, now)).toMatchObject({ ok: false, error: { code: 'EVENT_UNAVAILABLE' } }));
  it('idempotente: já confirmado é noop', () => expect(decideRsvp(ev(), { ...v, current: 'confirmed' }, null, now)).toEqual({ ok: true, value: { kind: 'noop', status: 'confirmed' } }));
  it('recusado pode pedir de novo', () => expect(decideRsvp(ev({ visibility: 'private', privateDiscoverable: true }), { ...v, current: 'declined' }, null, now)).toMatchObject({ ok: true, value: { status: 'pending' } }));
  it('cancelar depois do fim não pode', () => expect(canCancelRsvp('confirmed', new Date('2026-11-04T11:00:00Z'), now).ok).toBe(false));
  it('"Estou aqui" só em LIVE para quem vai', () => {
    expect(canCheckIn('confirmed', new Date('2026-11-04T11:00:00Z'), new Date('2026-11-04T13:00:00Z'), now)).toBe(true);
    expect(canCheckIn('pending', new Date('2026-11-04T11:00:00Z'), new Date('2026-11-04T13:00:00Z'), now)).toBe(false);
  });
});
