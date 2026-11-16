import pino from 'pino';

export function createLogger(level: string) {
  return pino({
    level,
    // nunca logar segredo / sessão
    redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', '*.password'],
  });
}

export type Logger = ReturnType<typeof createLogger>;
