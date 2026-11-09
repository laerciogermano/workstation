import { ERROR_CATALOG, type ErrorCode, type ProblemDetails } from '@notinhas/contracts';

/** Erro esperado de aplicação → RFC 9457. Falhas inesperadas viram INTERNAL no handler. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly invalidParams: ProblemDetails['invalidParams'];
  readonly detail: string | undefined;

  constructor(code: ErrorCode, detail?: string, invalidParams?: ProblemDetails['invalidParams']) {
    super(detail ?? ERROR_CATALOG[code].title);
    this.code = code;
    this.status = ERROR_CATALOG[code].status;
    this.detail = detail;
    this.invalidParams = invalidParams;
  }

  toProblem(instance?: string): ProblemDetails & { instance?: string } {
    return {
      type: `https://notinhas.shop/erros/${this.code.toLowerCase().replace(/_/g, '-')}`,
      title: ERROR_CATALOG[this.code].title,
      status: this.status,
      code: this.code,
      ...(this.detail ? { detail: this.detail } : {}),
      ...(this.invalidParams ? { invalidParams: this.invalidParams } : {}),
      ...(instance ? { instance } : {}),
    };
  }
}
