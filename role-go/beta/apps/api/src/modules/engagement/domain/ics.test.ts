import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

describe('buildIcs (RFC 5545)', () => {
  const ics = buildIcs(
    { id: 'abc', title: 'Rock; Indie, e mais', startsAt: new Date('2026-11-14T01:00:00Z'), endsAt: new Date('2026-11-14T06:00:00Z'), location: 'Bairro', url: 'https://rolego.com.br/e/x', description: 'linha 1\nlinha 2' },
    new Date('2026-11-04T12:00:00Z'),
  );
  it('escapa ; , e quebras de linha', () => {
    expect(ics).toContain('SUMMARY:Rock\\; Indie\\, e mais');
    expect(ics).toContain('DESCRIPTION:linha 1\\nlinha 2');
  });
  it('datas em UTC', () => expect(ics).toContain('DTSTART:20261114T010000Z'));
});
