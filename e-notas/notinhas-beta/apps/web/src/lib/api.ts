import { CSRF_VALUE, type ErrorCode, type ProblemDetails, type SessionDTO } from '@notinhas/contracts';
import { getFingerprint } from './fingerprint';
import { session } from './session';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | 'NETWORK';
  readonly problem: ProblemDetails | null;
  constructor(status: number, problem: ProblemDetails | null, fallback = 'Sem conexão. Tente de novo.') {
    super(problem?.detail ?? problem?.title ?? fallback);
    this.status = status;
    this.code = problem?.code ?? 'NETWORK';
    this.problem = problem;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;
interface Opts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

const BASE = '/api/v1';
let refreshing: Promise<boolean> | null = null;

/** Renova o access token pelo cookie HttpOnly (uma vez por vez). */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await rawFetch('/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        session.set(null);
        return false;
      }
      const s = (await res.json()) as SessionDTO;
      session.set(s.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function rawFetch(path: string, opts: Opts): Promise<Response> {
  const url = new URL(BASE + path, location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': CSRF_VALUE,
    'X-Client-Fingerprint': await getFingerprint(),
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
  return fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'same-origin',
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });
}

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  let res: Response;
  try {
    res = await rawFetch(path, opts);
    if (res.status === 401 && session.token && !path.startsWith('/auth/')) {
      if (await refreshSession()) res = await rawFetch(path, opts);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, null);
  }
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get('content-type')?.includes('json');
  const body: unknown = isJson ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, (body as ProblemDetails | null) ?? null, `Erro ${res.status}`);
  return body as T;
}
