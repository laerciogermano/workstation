#!/usr/bin/env node
/**
 * Conecta em um perfil LinkedIn pela URL (AVD + app logado).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-connect -- --url 'https://www.linkedin.com/in/…'
 *   npm run linkedin-connect -- --url '…' --device emulator-5554
 *
 * Prints da jornada de referência: screenshots/jornada-conectar-por-url/
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  connectByLinkedInUrl,
  normalizeLinkedInProfileUrl,
  resolveAgentId,
} from "../lib/linkedin-connect.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let url = null;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  let dryRun = false;
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") url = String(argv[++i] || "").trim();
    else if (a === "--device" || a === "-s") device = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(`Uso: npm run linkedin-connect -- --url <linkedin.com/in/…> [--device SERIAL]`);
      process.exit(0);
    }
  }
  return { url, device, configPath, dryRun, noShot };
}

async function main() {
  const { url: rawUrl, device, configPath, dryRun, noShot } = parseArgs(
    process.argv.slice(2),
  );
  if (!rawUrl || !normalizeLinkedInProfileUrl(rawUrl)) {
    throw new Error("passe --url https://www.linkedin.com/in/…");
  }

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
    : resolve(ROOT, "screenshots", "linkedin-connect", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.log(`serial=${serial} url=${normalizeLinkedInProfileUrl(rawUrl)}`);
  const result = await connectByLinkedInUrl({
    serial,
    linkedinPackage: linkedinPkg,
    url: rawUrl,
    outDir,
    dryRun,
    agentId: resolveAgentId(cfg),
  });

  if (outDir) {
    writeFileSync(join(outDir, "result.json"), JSON.stringify(result, null, 2));
    console.log(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
