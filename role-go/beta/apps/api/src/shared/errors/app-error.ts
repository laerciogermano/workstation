import { ERRORS, type ErrorCode } from '@rolego/contracts';
import type { DomainError, Result } from '../kernel/result';

/** Exceção HTTP carregando um code do contrato. Só a borda (http) lança. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly detail?: string,
    public readonly extra: { errors?: { path: string; message: string }[]; missing?: string[] } = {},
  ) {
    super(code);
  }
  get status(): number {
    return ERRORS[this.code].status;
  }
  static from(e: DomainError): AppError {
    return new AppError(e.code, e.detail, e.missing ? { missing: e.missing } : {});
  }
}

/** Result → valor ou AppError (usado nos controllers). */
export function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.value;
  throw AppError.from(r.error);
}
