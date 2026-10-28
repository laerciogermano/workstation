#!/usr/bin/env node
/**
 * Extrai as N conexões mais recentes do LinkedIn (AVD) via dump/uiautomator.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-extract-connections -- --n 20
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { resolveAgentId } from "../lib/linkedin-connect.js";
import { extractRecentConnections } from "../lib/linkedin-extract-connections.js";
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
  let n = 20;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  let profileUrl = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--n" || a === "-n") n = Number(argv[++i]);
    else if (a === "--device" || a === "-s") device = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--url" || a === "--profile-url") {
      profileUrl = String(argv[++i] || "").trim() || null;
    }
  }
  if (!Number.isFinite(n) || n < 1) throw new Error("--n deve ser >= 1");
  return { n, device, configPath, noShot, profileUrl };
}

async function main() {
  const { n, device, configPath, noShot, profileUrl } = parseArgs(
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
    : resolve(ROOT, "screenshots", "linkedin-extract-connections", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(
    `serial=${serial} n=${n} agent=${resolveAgentId(cfg)} url=${profileUrl || process.env.LINKEDIN_PROFILE_URL || "(tela atual)"}`,
  );
  const result = await extractRecentConnections({
    serial,
    linkedinPackage: linkedinPkg,
    n,
    outDir,
    agentId: resolveAgentId(cfg),
    profileUrl,
  });
  if (outDir) {
    writeFileSync(join(outDir, "connections.json"), JSON.stringify(result, null, 2));
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
