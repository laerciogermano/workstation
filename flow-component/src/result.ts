/** Resultado tipado: operações esperadas falham por valor, nunca por exceção. */
export type ErrorCode =
  | "not_found"   // IDR/nome inexistente
  | "invalid"     // payload ou estado inválido para a operação
  | "conflict"    // colisão (nome duplicado, item em uso)
  | "disabled"    // comando desabilitado pelo host
  | "unsupported" // host não injetou o adapter necessário
  | "failed";     // adapter (runner/exporter/store) falhou

export interface CommandError { readonly code: ErrorCode; readonly message: string }
export type Result<T, E = CommandError> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = (code: ErrorCode, message: string): Result<never> => ({ ok: false, error: { code, message } });
