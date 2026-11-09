import { useSyncExternalStore } from 'react';

/** Access token só em memória (nunca localStorage); refresh vive em cookie HttpOnly. */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export const session = {
  get token() {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAccessToken(): string | null {
  return useSyncExternalStore(session.subscribe, () => accessToken, () => null);
}
