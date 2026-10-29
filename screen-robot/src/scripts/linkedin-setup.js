#!/usr/bin/env node
/**
 * Configuração LinkedIn pós-signup (onboarding).
 *
 * 1º caso: Job title na tela "most recent experience".
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-setup -- --device emulator-5556 \
 *     --job-title 'Especialista em suprimentos e itens corporativos' \
 *     --company ConectMax
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { linkedinSetupJobTitle } from "../lib/linkedin-setup.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let device = null;
  let jobTitle = null;
  let company = "ConectMax";
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--job-title" || a === "--jobtitle")
      jobTitle = String(argv[++i] || "").trim();
    else if (a === "--company") company = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-setup -- --device emulator-5556 --job-title 'Cargo' [--company ConectMax]`,
      );
      process.exit(0);
    }
  }
  return { device, jobTitle, company, configPath, noShot };
}

async function main() {
  const { device, jobTitle, company, configPath, noShot } = parseArgs(
    process.argv.slice(2),
  );
  if (!jobTitle) throw new Error("passe --job-title");

  const cfg = loadConfig(configPath);
  if (device) {
    cfg.device = device;
    cfg.provision = { serial: device, kind: "adb" };
  }
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-setup", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(`serial=${serial} jobTitle=${jobTitle} company=${company}`);
  const result = await linkedinSetupJobTitle({
    serial,
    jobTitle,
    company,
    outDir,
  });
  if (outDir) {
    writeFileSync(
      join(outDir, "result.json"),
      JSON.stringify(result, null, 2),
    );
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
