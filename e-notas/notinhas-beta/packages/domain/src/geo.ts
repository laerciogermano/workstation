export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export const EARTH_RADIUS_KM = 6371;

/** Distância esférica de Haversine em km (ADR-010, Q4). */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Âncora padrão quando não há GPS nem bairro (RN-09): centro de São José dos Pinhais. */
export const DEFAULT_ANCHOR: Coordinates & { label: string } = {
  lat: -25.535,
  lng: -49.206,
  label: 'Centro, São José dos Pinhais',
};

export const RADIUS_OPTIONS_KM = [1, 3, 5, 10, 30] as const;

export const formatKm = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
