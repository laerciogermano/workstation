import { GOING_STATUSES, type RsvpStatus } from '@rolego/contracts';

/** Quem está olhando o evento. Montado num único lugar e passado ao EventPresenter. */
export type ViewerContext = {
  userId: string | null;
  isAdmin: boolean;
  isOrganizer: boolean;
  rsvpStatus: RsvpStatus | null;
};

export const anonymousViewer: ViewerContext = { userId: null, isAdmin: false, isOrganizer: false, rsvpStatus: null };

export const isGoing = (s: RsvpStatus | null): boolean => s !== null && GOING_STATUSES.includes(s);

/** RN-03: endereço exato e coordenadas de evento privado só para organizador, admin ou RSVP aprovado. */
export function canSeeExactAddress(v: ViewerContext, e: { visibility: 'public' | 'private' }): boolean {
  if (e.visibility === 'public') return true;
  return v.isOrganizer || v.isAdmin || isGoing(v.rsvpStatus);
}

export function canSeeAccessCode(v: ViewerContext): boolean {
  return v.isOrganizer || v.isAdmin;
}

/** Quem pode abrir a página do evento. Rascunho e removido só para dono/admin. */
export function canOpenEvent(
  v: ViewerContext,
  e: { status: string; visibility: 'public' | 'private'; privateDiscoverable: boolean; accessCode: string | null },
  providedCode: string | null,
): boolean {
  if (v.isOrganizer || v.isAdmin) return true;
  if (e.status === 'draft' || e.status === 'removed') return false;
  if (e.visibility === 'public') return true;
  if (v.rsvpStatus !== null) return true;
  if (e.privateDiscoverable) return true;
  return providedCode !== null && e.accessCode !== null && providedCode.toUpperCase() === e.accessCode;
}

/** RN-02: distância 0,1 km; privado não aprovado arredonda para 1 km. */
export function presentDistance(km: number | null, locked: boolean): number | null {
  if (km === null || Number.isNaN(km)) return null;
  if (locked) return Math.max(1, Math.round(km));
  return Math.round(km * 10) / 10;
}
