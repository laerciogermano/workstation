import { describe, expect, it } from 'vitest';
import { dayLabel, distanceLabel, endsNextDay, feedGroup, fromLocalInput, initials, priceLabel, toLocalInput, whenLabel } from './format';

// quarta, 4 nov 2026, 23:30 em São Paulo = 2026-11-05T02:30Z
const now = new Date('2026-11-05T02:30:00Z');

describe('feedGroup (agrupamento no fuso do evento)', () => {
  it('Fuso/madrugada: evento 22:00 → 06:00 cai em "Hoje" às 23:30', () => expect(feedGroup('2026-11-05T01:00:00Z', '2026-11-05T09:00:00Z', now)).toBe('today'));
  it('evento às 01:00 local de quinta é "Amanhã" (mesmo já sendo quinta em UTC)', () => expect(feedGroup('2026-11-05T04:00:00Z', '2026-11-05T08:00:00Z', now)).toBe('tomorrow'));
  it('sábado é "Este fim de semana"', () => expect(feedGroup('2026-11-08T01:00:00Z', '2026-11-08T05:00:00Z', now)).toBe('weekend'));
  it('terça seguinte é "Próximos"', () => expect(feedGroup('2026-11-10T22:00:00Z', '2026-11-11T02:00:00Z', now)).toBe('next'));
});

describe('rótulos', () => {
  it('dia relativo', () => expect(dayLabel('2026-11-05T01:00:00Z', now)).toBe('Hoje'));
  it('quando com horário local', () => expect(whenLabel('2026-11-08T01:00:00Z', '2026-11-08T09:00:00Z', now)).toBe('Sáb, 7 nov · 22:00–06:00'));
  it('termina no dia seguinte', () => expect(endsNextDay('2026-11-08T01:00:00Z', '2026-11-08T09:00:00Z')).toBe(true));
  it('distância de privado é aproximada', () => expect(distanceLabel(3, 'private')).toBe('~3 km'));
  it('distância pública com vírgula', () => expect(distanceLabel(2.3, 'public')).toBe('2,3 km'));
  it('preço', () => {
    expect(priceLabel({ isFree: true, priceFromCents: null })).toBe('Grátis');
    expect(priceLabel({ isFree: false, priceFromCents: 8900 })?.replace(/\s/g, ' ')).toBe('a partir de R$ 89');
  });
  it('datetime-local ⇄ ISO em SP', () => {
    expect(toLocalInput('2026-11-08T01:00:00.000Z')).toBe('2026-11-07T22:00');
    expect(fromLocalInput('2026-11-07T22:00')).toBe('2026-11-08T01:00:00.000Z');
  });
  it('iniciais do nome', () => {
    expect(initials('Ana Souza')).toBe('AS');
    expect(initials('Mariana')).toBe('M');
    expect(initials('João Pedro Silva')).toBe('JS');
    expect(initials('')).toBe('?');
  });
});
