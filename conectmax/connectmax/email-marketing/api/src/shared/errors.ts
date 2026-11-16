// Erros de aplicação: lançados uma vez, traduzidos para HTTP no error boundary.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (what: string) => new AppError(404, 'not_found', `${what} não encontrado(a).`);
export const conflict = (message: string) => new AppError(409, 'conflict', message);
export const unauthorized = () => new AppError(401, 'unauthorized', 'Faça login para continuar.');
