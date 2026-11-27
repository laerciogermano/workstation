function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}
const production = process.env.NODE_ENV === 'production';
export const config = {
  production,
  databaseUrl: env('DATABASE_URL'),
  jwtSecret: env('JWT_SECRET'),
  encryptionKey: Buffer.from(env('ENCRYPTION_KEY'), 'hex'),
  port: Number(env('PORT', '3333')),
  origin: env('APP_ORIGIN', 'http://localhost:3333'),
  defaultEvent: env('DEFAULT_EVENT_SLUG', '125-anos'),
  /** códigos de SMS/e-mail na tela e pagamento simulado; em Contabo demo só com DEV_TOOLS=true explícito */
  devTools: process.env.DEV_TOOLS === 'true',
  timeZone: 'America/Sao_Paulo',
};
if (config.jwtSecret.length < 32) throw new Error('JWT_SECRET precisa de pelo menos 32 caracteres');
if (config.encryptionKey.length !== 32) throw new Error('ENCRYPTION_KEY precisa de 32 bytes em hexadecimal');
