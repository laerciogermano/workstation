export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Sem conexão. Tente de novo.');
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) {
    const message = res.status === 429 && String(data?.message).startsWith('Throttler') ? 'Muitos pedidos seguidos. Aguarde um minuto.' : data?.message ?? 'Algo deu errado.';
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export interface Me { id: string; email: string; name: string; phone: string; city: string; country: string; photo: string | null; shortcuts: string[]; mfaEnabled: boolean; analyticsConsent: boolean | null }
export interface EventItem { id: string; name: string; slug: string; city: string; startsOn: string | null; endsOn: string | null; status: string; joined: boolean; organizer: boolean }
export interface Context {
  event: { id: string; name: string; slug: string; city: string; startsOn: string | null; endsOn: string | null; status: string };
  me: { attendeeId: string; lodge: string; obedience: string; cim: string; office: string; roles: string[]; facial: boolean };
  counts: { notifications: number; registrations: number; checkins: number; messages: number };
  modules: Record<string, boolean>;
  membership: 'good_standing' | 'overdue' | null;
}
export interface Session {
  id: string; title: string; kind: string; description: string; startsAt: string; endsAt: string; capacity: number; confirmed: number;
  venueId: string; venueName: string; venueAddress: string; lat: number; lng: number; registered: boolean; checkedIn: boolean; chatId: string | null; price: number | null;
}
export interface Order { id: string; source: string; status: 'pending' | 'paid'; total: number; createdAt: string; items: { description: string; quantity: number; unitPrice: number }[] }
export interface Challenge { method: 'app' | 'sms' | 'email' | 'backup'; destination: string; methods?: string[]; devCode?: string; challengeId?: string }
