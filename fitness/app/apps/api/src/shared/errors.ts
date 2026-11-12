/** Erro de negócio/esperado com código estável para o cliente. Falhas inesperadas viram 500. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what: string) => new AppError(404, 'NOT_FOUND', `${what} não encontrado`);
export const conflict = (code: string, msg: string) => new AppError(409, code, msg);
export const unprocessable = (code: string, msg: string, details?: unknown) => new AppError(422, code, msg, details);
export const forbidden = (code: string, msg: string) => new AppError(403, code, msg);
