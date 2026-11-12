import type { ErrorBody } from '@fitness/contracts';
import { getToken } from './device';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE = import.meta.env.VITE_API_URL ?? '';

/** Cliente HTTP fino: token do aparelho no header e erro tipado com o código estável da API. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as ErrorBody | null)?.error;
    throw new ApiError(res.status, e?.code ?? 'HTTP', e?.message ?? 'Falha de rede', e?.details);
  }
  return data as T;
}

export const isApiError = (e: unknown, code?: string): e is ApiError =>
  e instanceof ApiError && (code === undefined || e.code === code);

export const errorText = (e: unknown): string =>
  e instanceof ApiError ? e.message : 'Sem conexão. Tente de novo em instantes.';
