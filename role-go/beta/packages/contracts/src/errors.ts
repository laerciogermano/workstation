/** Códigos de erro de negócio (docs/06 §10). O front mapeia code → mensagem/ação. */
export const ERRORS = {
  VALIDATION_FAILED: { status: 422, message: 'Confira os campos destacados.' },
  UNAUTHENTICATED: { status: 401, message: 'Entre para continuar.' },
  TOKEN_EXPIRED: { status: 401, message: 'Sessão expirada.' },
  REFRESH_REUSED: { status: 401, message: 'Por segurança, entre de novo.' },
  PASSKEY_FAILED: { status: 401, message: 'Não conseguimos confirmar sua passkey. Tente de novo ou use a senha.' },
  FORBIDDEN: { status: 403, message: 'Você não tem acesso a isso.' },
  NOT_FOUND: { status: 404, message: 'Não encontramos isso.' },
  EMAIL_TAKEN: { status: 409, message: 'Este e-mail já tem conta.' },
  INVALID_CREDENTIALS: { status: 401, message: 'E-mail ou senha incorretos.' },
  ACCOUNT_BLOCKED: { status: 403, message: 'Sua conta está suspensa.' },
  TOKEN_INVALID: { status: 410, message: 'Este link expirou. Peça um novo.' },
  CONSENT_REQUIRED: { status: 428, message: 'Aceite os termos para continuar.' },
  ONBOARDING_INCOMPLETE: { status: 422, message: 'Falta completar seu perfil.' },
  EMAIL_NOT_VERIFIED: { status: 403, message: 'Confirme seu e-mail para publicar.' },
  ORGANIZER_REQUIRED: { status: 403, message: 'Ative o modo organizador.' },
  EVENT_NOT_PUBLISHABLE: { status: 422, message: 'Falta completar o evento.' },
  EVENT_NOT_EDITABLE: { status: 409, message: 'Este evento já terminou.' },
  EVENT_FULL: { status: 409, message: 'Este rolê está lotado.' },
  EVENT_UNAVAILABLE: { status: 410, message: 'Este evento não está mais disponível.' },
  ACCESS_CODE_INVALID: { status: 404, message: 'Código não encontrado.' },
  ADULT_REQUIRED: { status: 403, message: 'Evento para maiores de 18.' },
  REVIEW_WINDOW_CLOSED: { status: 422, message: 'O prazo para avaliar acabou.' },
  REVIEW_NOT_ALLOWED: { status: 403, message: 'Só quem foi pode avaliar.' },
  MEDIA_INVALID: { status: 415, message: 'Envie JPG, PNG ou WebP.' },
  MEDIA_TOO_LARGE: { status: 413, message: 'Arquivo muito grande.' },
  GEOCODE_FAILED: { status: 422, message: 'Não achamos esse endereço. Confira o CEP e o número.' },
  ALREADY_REPORTED: { status: 409, message: 'Você já denunciou isso.' },
  RATE_LIMITED: { status: 429, message: 'Muitas tentativas. Tente de novo em instantes.' },
  INTERNAL: { status: 500, message: 'Algo deu errado. Tente de novo.' },
} as const;

export type ErrorCode = keyof typeof ERRORS;

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  detail?: string;
  requestId?: string;
  errors?: { path: string; message: string }[];
  missing?: string[];
};

export const isErrorCode = (v: unknown): v is ErrorCode => typeof v === 'string' && v in ERRORS;
