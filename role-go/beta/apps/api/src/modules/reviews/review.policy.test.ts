import { describe, expect, it } from 'vitest';
import { canReview, filterComment } from './review.policy';

const end = new Date('2026-11-01T06:00:00Z');
describe('ReviewPolicy (RN-07)', () => {
  it('só quem foi', () => expect(canReview('pending', end, new Date('2026-11-02T00:00:00Z'))).toMatchObject({ ok: false, error: { code: 'REVIEW_NOT_ALLOWED' } }));
  it('dentro da janela', () => expect(canReview('confirmed', end, new Date(end.getTime() + 7 * 86400_000 - 1000)).ok).toBe(true));
  it('fora da janela', () => expect(canReview('approved', end, new Date(end.getTime() + 7 * 86400_000 + 1000))).toMatchObject({ ok: false, error: { code: 'REVIEW_WINDOW_CLOSED' } }));
  it('comentário com link é recusado', () => expect(filterComment('veja www.spam.com').ok).toBe(false));
  it('palavrão é mascarado', () => expect(filterComment('que merda de fila')).toEqual({ ok: true, value: 'que m**** de fila' }));
});
