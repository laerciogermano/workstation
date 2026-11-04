import { describe, expect, it } from 'vitest';
import { directionLinks } from './directions';

describe('directionLinks', () => {
  it('gera Uber, 99, Maps, Apple e Waze', () => {
    const links = directionLinks({ lat: -25.43, lng: -49.27, label: 'Club Central' });
    expect(links.map((l) => l.id)).toEqual(['uber', '99', 'google', 'apple', 'waze']);
    expect(links[0]!.href).toContain('m.uber.com');
    expect(links[0]!.href).toContain('dropoff[latitude]=-25.43');
    expect(links[1]!.href).toContain('m.99app.com');
    expect(links[2]!.href).toContain('google.com/maps');
    expect(links[3]!.href).toContain('maps.apple.com');
    expect(links[4]!.href).toContain('waze.com');
  });
});
