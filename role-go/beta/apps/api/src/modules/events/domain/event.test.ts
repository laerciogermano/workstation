import { describe, expect, it } from 'vitest';
import { canEdit, generateAccessCode, phaseOf, priceSummary, publishCheck, reviewWindowOpen, scheduleChanged, validateTimeRange } from './event';

const at = (iso: string) => new Date(iso);
const H = 3600_000;

describe('phaseOf (ADR-015)', () => {
  const s = at('2026-11-14T01:00:00Z'); // sáb 22:00 em SP
  const e = at('2026-11-14T09:00:00Z'); // dom 06:00 em SP
  it('antes do início é upcoming', () => expect(phaseOf(s, e, at('2026-11-14T00:59:59Z'))).toBe('upcoming'));
  it('Fuso/madrugada: evento 22:00 → 06:00 está LIVE às 23:30', () => expect(phaseOf(s, e, at('2026-11-14T02:30:00Z'))).toBe('live'));
  it('no fim exato é ended', () => expect(phaseOf(s, e, e)).toBe('ended'));
});

describe('validateTimeRange (RN-12)', () => {
  it('fim antes do início é inválido', () => expect(validateTimeRange({ startsAt: at('2026-11-14T10:00:00Z'), endsAt: at('2026-11-14T09:00:00Z') }).ok).toBe(false));
  it('48 h exatas é válido', () => expect(validateTimeRange({ startsAt: at('2026-11-14T00:00:00Z'), endsAt: at('2026-11-16T00:00:00Z') }).ok).toBe(true));
  it('48 h + 1 min é inválido', () => expect(validateTimeRange({ startsAt: at('2026-11-14T00:00:00Z'), endsAt: at('2026-11-16T00:01:00Z') }).ok).toBe(false));
  it('sem datas ainda é válido (rascunho)', () => expect(validateTimeRange({ startsAt: null, endsAt: null }).ok).toBe(true));
});

describe('publishCheck (RF-E02-04)', () => {
  const now = at('2026-11-04T12:00:00Z');
  const full = { title: 'Neon Pulse', typeSlug: 'eletronica', hasCover: true, startsAt: at('2026-11-10T01:00:00Z'), endsAt: at('2026-11-10T07:00:00Z'), venueName: 'Club Central', hasLocation: true };
  it('evento completo não tem pendências', () => expect(publishCheck(full, now)).toEqual([]));
  it('rascunho vazio lista tudo que falta', () =>
    expect(publishCheck({ title: '', typeSlug: '', hasCover: false, startsAt: null, endsAt: null, venueName: '', hasLocation: false }, now)).toEqual(['title', 'type', 'cover', 'startsAt', 'endsAt', 'venue', 'location']));
  it('início no passado bloqueia', () => expect(publishCheck({ ...full, startsAt: at('2026-11-04T11:00:00Z') }, now)).toContain('startInFuture'));
  it('duração acima de 48 h bloqueia', () => expect(publishCheck({ ...full, endsAt: new Date(full.startsAt.getTime() + 49 * H) }, now)).toContain('duration'));
});

describe('reviewWindowOpen (RN-07)', () => {
  const end = at('2026-11-10T07:00:00Z');
  it('Janela de avaliação: ends_at + 7d − 1s permitido', () => expect(reviewWindowOpen(end, new Date(end.getTime() + 7 * 86400_000 - 1000))).toBe(true));
  it('Janela de avaliação: ends_at + 7d + 1s negado', () => expect(reviewWindowOpen(end, new Date(end.getTime() + 7 * 86400_000 + 1000))).toBe(false));
  it('antes do fim negado', () => expect(reviewWindowOpen(end, new Date(end.getTime() - 1000))).toBe(false));
});

describe('scheduleChanged (RN-08)', () => {
  const base = { startsAt: at('2026-11-10T01:00:00Z'), endsAt: at('2026-11-10T07:00:00Z'), lat: -25.43, lng: -49.27 };
  it('mudar início notifica', () => expect(scheduleChanged(base, { ...base, startsAt: at('2026-11-10T02:00:00Z') })).toBe(true));
  it('mudar local notifica', () => expect(scheduleChanged(base, { ...base, lat: -25.44 })).toBe(true));
  it('nada mudou não notifica', () => expect(scheduleChanged(base, { ...base })).toBe(false));
});

describe('canEdit', () => {
  const now = at('2026-11-04T12:00:00Z');
  it('encerrado não edita', () => expect(canEdit({ status: 'published', endsAt: at('2026-11-04T11:00:00Z') }, now)).toMatchObject({ ok: false, error: { code: 'EVENT_NOT_EDITABLE' } }));
  it('cancelado não edita', () => expect(canEdit({ status: 'cancelled', endsAt: null }, now)).toMatchObject({ ok: false, error: { code: 'EVENT_UNAVAILABLE' } }));
  it('rascunho edita', () => expect(canEdit({ status: 'draft', endsAt: null }, now).ok).toBe(true));
});

describe('generateAccessCode', () => {
  it('6 caracteres sem ambíguos', () => {
    let i = 0;
    const code = generateAccessCode(() => i++ % 31);
    expect(code).toHaveLength(6);
    expect(code).not.toMatch(/[01ILO]/);
  });
});

describe('priceSummary', () => {
  it('sem itens é grátis', () => expect(priceSummary([])).toEqual({ priceFromCents: null, isFree: true }));
  it('menor preço positivo', () => expect(priceSummary([{ priceCents: 8900 }, { priceCents: 18900 }, { priceCents: null }])).toEqual({ priceFromCents: 8900, isFree: false }));
});
