import { describe, expect, it } from 'vitest';
import { dayIntervals, decodeCursor, encodeCursor } from './day-ranges';

const TZ = 'America/Sao_Paulo';
describe('dayIntervals (fuso de SP)', () => {
  // quarta 2026-11-04 23:30 em SP = 2026-11-05T02:30Z
  const now = new Date('2026-11-05T02:30:00Z');
  it('"Hoje" às 23:30 ainda é o dia local (não o dia UTC)', () => {
    const [today] = dayIntervals(['today'], now, TZ);
    expect(today?.from.toISOString()).toBe('2026-11-04T03:00:00.000Z');
    expect(today?.to.toISOString()).toBe('2026-11-05T03:00:00.000Z');
  });
  it('"Sáb" é o próximo sábado', () => expect(dayIntervals(['sat'], now, TZ)[0]?.from.toISOString()).toBe('2026-11-07T03:00:00.000Z'));
  it('"Fim de semana" vai de sexta 00:00 a segunda 00:00', () => {
    const [w] = dayIntervals(['weekend'], now, TZ);
    expect(w?.from.toISOString()).toBe('2026-11-06T03:00:00.000Z');
    expect(w?.to.toISOString()).toBe('2026-11-09T03:00:00.000Z');
  });
});

describe('cursor', () => {
  it('ida e volta', () => expect(decodeCursor(encodeCursor({ k: 't', s: '2026-11-05T00:00:00.000Z', id: 'x' }))).toEqual({ k: 't', s: '2026-11-05T00:00:00.000Z', id: 'x' }));
  it('cursor inválido vira primeira página', () => expect(decodeCursor('lixo!!')).toBeNull());
});
