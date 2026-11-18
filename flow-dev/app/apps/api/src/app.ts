import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "./config";
import { logger } from "./logger";
import { pool } from "./db/pool";
import { errorHandler } from "./shared/http";
import { AppError } from "./shared/errors";
import { authRouter, loadUser, requireUser } from "./modules/auth/auth.routes";
import { projectsRouter } from "./modules/projects/projects.routes";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(pinoHttp({ logger, autoLogging: { ignore: req => req.url === "/healthz" } }));
  app.use(helmet({
    hsts: config.isProd,
    contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:"], fontSrc: ["'self'", "data:"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"], ...(config.isProd ? { upgradeInsecureRequests: [] } : {}) } },
  }));
  app.use(express.json({ limit: "512kb" }));
  app.use(cookieParser());

  // health/readiness (Express health guide)
  app.get("/healthz", (_req, res) => { res.json({ ok: true }); });
  app.get("/readyz", async (_req, res) => { try { await pool.query("select 1"); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } });

  const api = express.Router();
  // CSRF: cookie SameSite=Lax + só JSON + Origin conferida em métodos que alteram estado
  api.use((req: Request, _res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.headers.origin;
    const allowed = [config.WEB_ORIGIN, `${req.protocol}://${req.headers.host}`];
    if (origin && !allowed.includes(origin)) return next(new AppError(403, "csrf", "Origem não permitida"));
    if (req.method !== "DELETE" && !req.is("application/json") && req.headers["content-length"] !== "0" && req.headers["content-length"] !== undefined) return next(new AppError(415, "unsupported", "Use application/json"));
    next();
  });
  api.use(rateLimit({ windowMs: 60_000, limit: config.isTest ? 100_000 : 600, standardHeaders: "draft-7", legacyHeaders: false }));
  api.use(loadUser);
  api.use("/auth", authRouter);
  api.use("/projects", requireUser, projectsRouter);
  api.use((_req, _res, next) => next(new AppError(404, "not_found", "Rota não encontrada")));
  app.use("/api/v1", api);

  // front estático (produção/preview): apps/web/dist
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");
  if (config.SERVE_WEB === "true" && existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: "1h" }));
    app.get(/^(?!\/api).*/, (_req, res) => { res.sendFile(path.join(dist, "index.html")); });
  }
  app.use(errorHandler);
  return app;
}
