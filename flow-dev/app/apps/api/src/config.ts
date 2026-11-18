import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4180),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default("http://localhost:5180"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET precisa de 32+ caracteres"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
  LOG_LEVEL: z.string().default("info"),
  SERVE_WEB: z.enum(["true", "false"]).default("false"),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = { ...parsed.data, isProd: parsed.data.NODE_ENV === "production", isTest: parsed.data.NODE_ENV === "test" };
