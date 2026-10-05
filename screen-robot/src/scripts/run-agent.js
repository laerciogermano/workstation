#!/usr/bin/env node
/**
 * CLI — EP-07 runAgent (prompt como input; zero jornada embutida).
 *
 *   npm run agent -- --prompt ../roteiros/jornada-comprador.md
 *   npm run agent -- --prompt "objetivo em texto"
 *   npm run agent -- --prompt ./meu.txt --device emulator-5554 --max-steps 20
 *
 * Env: GEMINI_API_KEY (obrigatório) · GEMINI_MODEL (opcional)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "../lib/agent-run.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
}

function loadPrompt(raw) {
  if (!raw) return null;
  const asPath = resolve(process.cwd(), raw);
  if (existsSync(asPath) && !raw.includes("\n")) {
    return readFileSync(asPath, "utf8");
  }
  const fromSrc = resolve(SRC_ROOT, raw);
  if (existsSync(fromSrc) && !raw.includes("\n")) {
    return readFileSync(fromSrc, "utf8");
  }
  return raw;
}

function loadSerial() {
  const fromArg = argValue("--device") || argValue("--serial");
  if (fromArg) return fromArg;
  if (process.env.ANDROID_SERIAL) return process.env.ANDROID_SERIAL;
  try {
    const cfg = JSON.parse(
      readFileSync(join(SRC_ROOT, "device.config.json"), "utf8"),
    );
    return cfg.device || cfg.provision?.serial || null;
  } catch {
    return null;
  }
}

const promptRaw = argValue("--prompt") || argValue("-p");
const prompt = loadPrompt(promptRaw);
const serial = loadSerial();
const maxSteps = Number(argValue("--max-steps") || "40");
const engine = argValue("--engine") || "rapidocr";
const logDir = argValue("--log-dir") || join(SRC_ROOT, "logs", "agent");

if (!prompt) {
  console.error("uso: npm run agent -- --prompt <texto|arquivo.md>");
  process.exit(2);
}
if (!serial) {
  console.error("falta serial (--device / ANDROID_SERIAL / device.config.json)");
  process.exit(2);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("falta GEMINI_API_KEY");
  process.exit(2);
}

console.log(`runAgent serial=${serial} engine=${engine} maxSteps=${maxSteps}`);
const result = await runAgent({
  serial,
  prompt,
  maxSteps,
  engine,
  logDir,
});
console.log(JSON.stringify({ status: result.status, steps: result.steps.length, logPath: result.logPath }, null, 2));
process.exit(result.status === "done" ? 0 : 1);
