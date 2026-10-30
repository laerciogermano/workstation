#!/usr/bin/env node
/**
 * Lista as últimas mensagens de um perfil LinkedIn.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-profile-messages -- \
 *     --url 'https://www.linkedin.com/in/laerciogermano' \
 *     --max-results 10
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";
import { listProfileMessages } from "../lib/linkedin-profile-messages.js";
import { provisionEmulator } from "../lib/provision.js";

installConnectmaxApiAuth();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let url = null;
  let maxResults = 20;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") url = String(argv[++i] || "").trim();
    else if (a === "--max-results" || a === "-m") maxResults = Number(argv[++i]);
    else if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-profile-messages -- --url <linkedin.com/in/…> --max-results 10`,
      );
      process.exit(0);
    }
  }
  if (!url || !normalizeLinkedInProfileUrl(url)) {
    throw new Error("passe --url https://www.linkedin.com/in/…");
  }
  if (!Number.isFinite(maxResults) || maxResults < 1) {
    throw new Error("--max-results deve ser >= 1");
  }
  return { url, maxResults, device, configPath, noShot };
}

async function main() {
  const { url, maxResults, device, configPath, noShot } = parseArgs(
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
    : resolve(ROOT, "screenshots", "linkedin-profile-messages", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(`serial=${serial} url=${normalizeLinkedInProfileUrl(url)} maxResults=${maxResults}`);
  const result = await listProfileMessages({
    serial,
    linkedinPackage: linkedinPkg,
    url,
    maxResults,
    outDir,
    apps: cfg.apps,
  });
  if (outDir) {
    writeFileSync(
      join(outDir, "messages.json"),
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
