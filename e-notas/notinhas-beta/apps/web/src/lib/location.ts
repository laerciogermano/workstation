import { useSyncExternalStore } from 'react';
import { DEFAULT_ANCHOR } from '@notinhas/domain';

/**
 * RN-09: âncora = GPS (com permissão) ou bairro escolhido; sem nada, o centro do município.
 * Fica só no aparelho (privacidade: o servidor recebe lat/lng arredondados por consulta, não guarda).
 */
export interface Anchor {
  mode: 'gps' | 'bairro' | 'padrao';
  lat: number;
  lng: number;
  label: string;
  radiusKm: number;
}

const KEY = 'nt_anchor';
const DEFAULT: Anchor = { mode: 'padrao', lat: DEFAULT_ANCHOR.lat, lng: DEFAULT_ANCHOR.lng, label: DEFAULT_ANCHOR.label, radiusKm: 5 };
const listeners = new Set<() => void>();

function read(): Anchor {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<Anchor>) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
let current = read();

export function setAnchor(patch: Partial<Anchor>) {
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

export function useAnchor(): Anchor {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => DEFAULT,
  );
}

/** ~110 m de precisão: suficiente para raio de 1–30 km e não identifica a residência. */
export const geoQuery = (a: Anchor) => ({ lat: Math.round(a.lat * 1000) / 1000, lng: Math.round(a.lng * 1000) / 1000, raioKm: a.radiusKm });

export const BAIRROS_SJP: { label: string; lat: number; lng: number }[] = [
  { label: 'Centro, São José dos Pinhais', lat: -25.535, lng: -49.206 },
  { label: 'Águas Belas', lat: -25.5283, lng: -49.1942 },
  { label: 'Aviação', lat: -25.5531, lng: -49.1988 },
  { label: 'Boneca do Iguaçu', lat: -25.5462, lng: -49.1871 },
  { label: 'São Cristóvão', lat: -25.5208, lng: -49.2109 },
  { label: 'Afonso Pena', lat: -25.5185, lng: -49.1745 },
];

export function requestGps(): Promise<Anchor> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Sem GPS neste aparelho.'));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setAnchor({ mode: 'gps', lat: p.coords.latitude, lng: p.coords.longitude, label: 'Sua localização' });
        resolve(current);
      },
      () => reject(new Error('Permissão de localização negada.')),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}
