/** Catálogo de erros (06-contratos §12). Respostas de erro seguem RFC 9457 (application/problem+json). */
export const ERROR_CATALOG = {
  VALIDATION_FAILED: { status: 422, title: 'Confira os dados informados nos campos destacados.' },
  UNAUTHENTICATED: { status: 401, title: 'Faça login para continuar.' },
  INVALID_CREDENTIALS: { status: 401, title: 'E-mail ou senha incorretos.' },
  TOKEN_EXPIRED: { status: 401, title: 'Sua sessão expirou.' },
  REFRESH_REUSED: { status: 401, title: 'Sessão invalidada por segurança. Entre novamente.' },
  FORBIDDEN: { status: 403, title: 'Você não tem permissão para esta ação.' },
  NOT_FOUND: { status: 404, title: 'Não encontramos o que você procurou.' },
  EMAIL_TAKEN: { status: 409, title: 'Este e-mail já tem cadastro. Entre para continuar.' },
  CSRF_HEADER_MISSING: { status: 403, title: 'Requisição sem o cabeçalho de proteção.' },
  INVALID_SEFAZ_URL: { status: 400, title: 'Esse link não é de uma NFC-e do Paraná.' },
  SEFAZ_TIMEOUT: { status: 504, title: 'A SEFAZ não respondeu a tempo. Guardamos o link e tentamos de novo.' },
  SEFAZ_PARSER_ERROR: { status: 502, title: 'A SEFAZ está fora do ar ou mudou o formato da nota.' },
  INVALID_EAN: { status: 422, title: 'Código de barras com dígito verificador inválido.' },
  NO_QUOTE_CREDITS: { status: 402, title: 'Seus créditos de cotação acabaram. Contribua com uma nota ou um código de barras.' },
  RATE_LIMIT_EXCEEDED: { status: 429, title: 'Muitas solicitações em sequência. Aguarde alguns instantes.' },
  INTERNAL: { status: 500, title: 'Algo deu errado do nosso lado.' },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: ErrorCode;
  invalidParams?: { name: string; reason: string }[];
}
