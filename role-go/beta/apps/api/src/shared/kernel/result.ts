import type { ErrorCode } from '@rolego/contracts';

/** Erro de negócio: nunca é exceção (docs/08 §2). */
export type DomainError = { code: ErrorCode; detail?: string; missing?: string[] };
export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: DomainError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (code: ErrorCode, detail?: string, missing?: string[]): Err => ({
  ok: false,
  error: { code, ...(detail ? { detail } : {}), ...(missing ? { missing } : {}) },
});
