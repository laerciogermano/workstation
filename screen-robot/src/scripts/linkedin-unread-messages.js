#!/usr/bin/env node
/**
 * Lista conversas unread do LinkedIn (AVD).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-unread-messages -- --max-results 20
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listUnreadMessages } from "../lib/linkedin-unread-messages.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let maxResults = 20;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max-results" || a === "-m") maxResults = Number(argv[++i]);
    else if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-unread-messages -- --max-results 20`,
      );
      process.exit(0);
    }
  }
  if (!Number.isFinite(maxResults) || maxResults < 1) {
    throw new Error("--max-results deve ser >= 1");
  }
  return { maxResults, device, configPath, noShot };
}

async function main() {
  const { maxResults, device, configPath, noShot } = parseArgs(
    process.argv.slice(2),
  );
  const cfg = loadConfig(configPath);
  if (device) {
    cfg.device = device;
    cfg.provision = { ...(cfg.provision || {}), serial: device };
  }
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-unread-messages", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(`serial=${serial} maxResults=${maxResults}`);
  const result = await listUnreadMessages({
    serial,
    linkedinPackage: linkedinPkg,
    maxResults,
    outDir,
  });
  if (outDir) {
    writeFileSync(
      join(outDir, "unread.json"),
      JSON.stringify(result, null, 2),
    );
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
