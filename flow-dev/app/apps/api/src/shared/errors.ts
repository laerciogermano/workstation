export class AppError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}
export const notFound = (what = "Recurso") => new AppError(404, "not_found", `${what} não encontrado`);
export const badRequest = (msg: string) => new AppError(400, "bad_request", msg);
export const conflict = (msg: string) => new AppError(409, "conflict", msg);
export const unauthorized = (msg = "Entre para continuar") => new AppError(401, "unauthorized", msg);
