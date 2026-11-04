import { ERRORS, type ErrorCode, isErrorCode, type ProblemDetails } from '@rolego/contracts';

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
  }
  get code(): ErrorCode {
    return this.problem.code;
  }
}

const BASE = '/api/v1';
let refreshing: Promise<boolean> | null = null;

/** Refresh silencioso single-flight: várias requisições com 401 aguardam a mesma renovação (docs/03 §5.3). */
function refreshOnce(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'X-Requested-With': 'rolego' }, credentials: 'same-origin' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    });
  return refreshing;
}

async function toProblem(res: Response): Promise<ProblemDetails> {
  try {
    const body = (await res.json()) as Partial<ProblemDetails>;
    if (isErrorCode(body.code)) return body as ProblemDetails;
  } catch {
    /* corpo não-JSON */
  }
  const code: ErrorCode = res.status === 404 ? 'NOT_FOUND' : res.status === 401 ? 'UNAUTHENTICATED' : res.status === 429 ? 'RATE_LIMITED' : 'INTERNAL';
  return { type: 'about:blank', title: ERRORS[code].message, status: res.status, code };
}

type Opts = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; form?: FormData; signal?: AbortSignal };

export async function api<T>(path: string, opts: Opts = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'rolego', Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${BASE}${path}`, { method: opts.method ?? 'GET', headers, body, credentials: 'same-origin', signal: opts.signal });
  if (res.ok) {
    if (res.status === 204 || res.status === 202) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  const problem = await toProblem(res);
  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/refresh');
  if (res.status === 401 && retry && !isAuthRoute && (problem.code === 'TOKEN_EXPIRED' || problem.code === 'UNAUTHENTICATED')) {
    if (await refreshOnce()) return api<T>(path, opts, false);
  }
  throw new ApiError(problem);
}

export const qs = (params: Record<string, string | number | boolean | string[] | undefined | null>): string => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const errorMessage = (e: unknown): string => {
  if (e instanceof ApiError) {
    if (e.code === 'EVENT_NOT_PUBLISHABLE' && e.problem.missing?.length) return `${ERRORS.EVENT_NOT_PUBLISHABLE.message}`;
    if (e.code === 'VALIDATION_FAILED' && e.problem.errors?.[0]) return e.problem.errors[0].message;
    return e.problem.detail ?? ERRORS[e.code].message;
  }
  return ERRORS.INTERNAL.message;
};
