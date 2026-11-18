import { pino } from "pino";
import { config } from "./config";

/** Pino em stdout (12-factor XI); segredos redigidos. */
export const logger = pino({
  level: config.isTest ? "silent" : config.LOG_LEVEL,
  redact: { paths: ["req.headers.cookie", "req.headers.authorization", "res.headers['set-cookie']", "password", "*.password", "passwordHash"], censor: "[redigido]" },
  transport: config.isProd || config.isTest ? undefined : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});
