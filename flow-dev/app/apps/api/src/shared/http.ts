import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AppError } from "./errors";
import { logger } from "../logger";

export const ah = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler => (req, res, next) => { fn(req, res, next).catch(next); };
export const parse = <T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> => schema.parse(data);

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: "validation", message: "Dados inválidos", issues: err.issues.map(i => ({ path: i.path.join("."), message: i.message })) } });
    return;
  }
  if (err instanceof AppError) { res.status(err.status).json({ error: { code: err.code, message: err.message } }); return; }
  if ((err as { type?: string }).type === "entity.parse.failed") { res.status(400).json({ error: { code: "bad_json", message: "JSON inválido" } }); return; }
  if ((err as { type?: string }).type === "entity.too.large") { res.status(413).json({ error: { code: "too_large", message: "Corpo grande demais" } }); return; }
  logger.error({ err, url: req.originalUrl }, "erro não tratado");
  res.status(500).json({ error: { code: "internal", message: "Erro interno" } });
}
